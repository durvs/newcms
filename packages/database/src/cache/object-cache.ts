import Redis from 'ioredis';

export interface ObjectCacheConfig {
	host: string;
	port: number;
	keyPrefix?: string;
	defaultTtl?: number;
}

export interface CacheGroupConfig {
	/** TTL in seconds. 0 = no expiry */
	ttl: number;
	/** Whether this group is global (shared across sites in multisite) */
	global: boolean;
}

/**
 * Redis-backed object cache implementing the CMS cache API.
 *
 * Features:
 * - Group-based key namespacing
 * - Global vs per-site groups (multisite support)
 * - Configurable TTL per group
 * - Batch get/set operations via pipeline
 * - Flush by group or total flush
 * - Increment/decrement operations
 */
export class ObjectCache {
	private redis: Redis;
	private siteId: number = 1;
	private keyPrefix: string;
	private defaultTtl: number;

	/** Groups that are shared across all sites (multisite) */
	private globalGroups: Set<string> = new Set();

	/** Per-group TTL overrides (in seconds) */
	private groupTtl: Map<string, number> = new Map();

	/** Local in-memory cache for the current request (non-persistent) */
	private localCache: Map<string, unknown> = new Map();

	constructor(config: ObjectCacheConfig) {
		this.redis = new Redis({
			host: config.host,
			port: config.port,
			lazyConnect: true,
			maxRetriesPerRequest: 3,
		});
		this.keyPrefix = config.keyPrefix ?? 'cache';
		this.defaultTtl = config.defaultTtl ?? 0;
	}

	async connect(): Promise<void> {
		await this.redis.connect();
	}

	async disconnect(): Promise<void> {
		await this.redis.quit();
	}

	/**
	 * Set the current site ID (for multisite per-site cache isolation).
	 */
	setSiteId(siteId: number): void {
		this.siteId = siteId;
	}

	/**
	 * Register groups as global (shared across sites in multisite).
	 */
	addGlobalGroups(groups: string[]): void {
		for (const group of groups) {
			this.globalGroups.add(group);
		}
	}

	/**
	 * Set TTL for a specific cache group.
	 */
	setGroupTtl(group: string, ttlSeconds: number): void {
		this.groupTtl.set(group, ttlSeconds);
	}

	/**
	 * Build the Redis key for a cache entry.
	 */
	private buildKey(key: string, group: string = 'default'): string {
		if (this.globalGroups.has(group)) {
			return `${this.keyPrefix}:global:${group}:${key}`;
		}
		return `${this.keyPrefix}:site:${this.siteId}:${group}:${key}`;
	}

	/**
	 * Build a local cache key (in-memory, for current request).
	 */
	private buildLocalKey(key: string, group: string = 'default'): string {
		if (this.globalGroups.has(group)) {
			return `global:${group}:${key}`;
		}
		return `site:${this.siteId}:${group}:${key}`;
	}

	/**
	 * Get TTL for a group in seconds.
	 */
	private getTtl(group: string): number {
		return this.groupTtl.get(group) ?? this.defaultTtl;
	}

	/**
	 * Get a cached value.
	 *
	 * @returns The cached value, or undefined if not found
	 */
	async get<T = unknown>(key: string, group: string = 'default'): Promise<T | undefined> {
		// Check local cache first
		const localKey = this.buildLocalKey(key, group);
		if (this.localCache.has(localKey)) {
			return this.localCache.get(localKey) as T;
		}

		const redisKey = this.buildKey(key, group);
		const raw = await this.redis.get(redisKey);

		if (raw === null) return undefined;

		try {
			const value = JSON.parse(raw) as T;
			this.localCache.set(localKey, value);
			return value;
		} catch {
			return raw as T;
		}
	}

	/**
	 * Set a cached value.
	 *
	 * @param key - Cache key
	 * @param value - Value to cache (will be JSON serialized)
	 * @param group - Cache group
	 * @param ttl - TTL in seconds (overrides group default). 0 = no expiry.
	 * @returns true on success
	 */
	async set(
		key: string,
		value: unknown,
		group: string = 'default',
		ttl?: number,
	): Promise<boolean> {
		const redisKey = this.buildKey(key, group);
		const serialized = JSON.stringify(value);
		const effectiveTtl = ttl ?? this.getTtl(group);

		if (effectiveTtl > 0) {
			await this.redis.setex(redisKey, effectiveTtl, serialized);
		} else {
			await this.redis.set(redisKey, serialized);
		}

		const localKey = this.buildLocalKey(key, group);
		this.localCache.set(localKey, value);

		return true;
	}

	/**
	 * Add a cached value only if it doesn't already exist.
	 *
	 * @returns true if the value was added, false if key already exists
	 */
	async add(
		key: string,
		value: unknown,
		group: string = 'default',
		ttl?: number,
	): Promise<boolean> {
		const redisKey = this.buildKey(key, group);
		const serialized = JSON.stringify(value);
		const effectiveTtl = ttl ?? this.getTtl(group);

		let result: string | null;
		if (effectiveTtl > 0) {
			result = await this.redis.set(redisKey, serialized, 'EX', effectiveTtl, 'NX');
		} else {
			result = await this.redis.set(redisKey, serialized, 'NX');
		}

		if (result === 'OK') {
			const localKey = this.buildLocalKey(key, group);
			this.localCache.set(localKey, value);
			return true;
		}

		return false;
	}

	/**
	 * Delete a cached value.
	 *
	 * @returns true if the key existed and was deleted
	 */
	async delete(key: string, group: string = 'default'): Promise<boolean> {
		const redisKey = this.buildKey(key, group);
		const count = await this.redis.del(redisKey);

		const localKey = this.buildLocalKey(key, group);
		this.localCache.delete(localKey);

		return count > 0;
	}

	/**
	 * Increment a numeric cached value.
	 *
	 * @returns The new value, or false if key doesn't exist
	 */
	async incr(key: string, group: string = 'default', offset: number = 1): Promise<number | false> {
		const redisKey = this.buildKey(key, group);
		const keyExists = await this.redis.exists(redisKey);
		if (!keyExists) return false;

		const current = await this.get<number>(key, group);
		if (current === undefined || typeof current !== 'number') return false;

		const newValue = current + offset;
		await this.set(key, newValue, group);
		return newValue;
	}

	/**
	 * Decrement a numeric cached value.
	 *
	 * @returns The new value, or false if key doesn't exist
	 */
	async decr(key: string, group: string = 'default', offset: number = 1): Promise<number | false> {
		return this.incr(key, group, -offset);
	}

	/**
	 * Get multiple cached values at once.
	 *
	 * @returns Map of key -> value (missing keys are not included)
	 */
	async getMultiple(keys: string[], group: string = 'default'): Promise<Map<string, unknown>> {
		const result = new Map<string, unknown>();
		if (keys.length === 0) return result;

		const redisKeys = keys.map((k) => this.buildKey(k, group));
		const values = await this.redis.mget(...redisKeys);

		for (let i = 0; i < keys.length; i++) {
			const raw = values[i];
			if (raw !== null) {
				try {
					const value = JSON.parse(raw);
					result.set(keys[i], value);
					const localKey = this.buildLocalKey(keys[i], group);
					this.localCache.set(localKey, value);
				} catch {
					result.set(keys[i], raw);
				}
			}
		}

		return result;
	}

	/**
	 * Set multiple cached values at once.
	 */
	async setMultiple(
		entries: Map<string, unknown> | Record<string, unknown>,
		group: string = 'default',
		ttl?: number,
	): Promise<boolean> {
		const items = entries instanceof Map ? entries : new Map(Object.entries(entries));
		if (items.size === 0) return true;

		const effectiveTtl = ttl ?? this.getTtl(group);
		const pipeline = this.redis.pipeline();

		for (const [key, value] of items) {
			const redisKey = this.buildKey(key, group);
			const serialized = JSON.stringify(value);

			if (effectiveTtl > 0) {
				pipeline.setex(redisKey, effectiveTtl, serialized);
			} else {
				pipeline.set(redisKey, serialized);
			}

			const localKey = this.buildLocalKey(key, group);
			this.localCache.set(localKey, value);
		}

		await pipeline.exec();
		return true;
	}

	/**
	 * Flush all keys in a specific group using SCAN + pipeline DEL.
	 *
	 * @returns Number of keys deleted
	 */
	async flushGroup(group: string): Promise<number> {
		const pattern = this.globalGroups.has(group)
			? `${this.keyPrefix}:global:${group}:*`
			: `${this.keyPrefix}:site:${this.siteId}:${group}:*`;

		let deleted = 0;
		let cursor = '0';

		do {
			const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
			cursor = nextCursor;

			if (keys.length > 0) {
				const pipeline = this.redis.pipeline();
				for (const key of keys) {
					pipeline.del(key);
				}
				await pipeline.exec();
				deleted += keys.length;
			}
		} while (cursor !== '0');

		// Clear local cache for this group
		for (const localKey of this.localCache.keys()) {
			if (localKey.startsWith(`${group}:`)) {
				this.localCache.delete(localKey);
			}
		}

		return deleted;
	}

	/**
	 * Flush all cached data (all groups, all sites).
	 * Uses SCAN + DEL to only clear cache keys (not other Redis data).
	 *
	 * @returns Number of keys deleted
	 */
	async flushAll(): Promise<number> {
		const pattern = `${this.keyPrefix}:*`;
		let deleted = 0;
		let cursor = '0';

		do {
			const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
			cursor = nextCursor;

			if (keys.length > 0) {
				const pipeline = this.redis.pipeline();
				for (const key of keys) {
					pipeline.del(key);
				}
				await pipeline.exec();
				deleted += keys.length;
			}
		} while (cursor !== '0');

		this.localCache.clear();
		return deleted;
	}

	/**
	 * Clear only the local in-memory cache (for request boundary cleanup).
	 */
	clearLocalCache(): void {
		this.localCache.clear();
	}

	/**
	 * Check if a key exists in cache.
	 */
	async exists(key: string, group: string = 'default'): Promise<boolean> {
		const localKey = this.buildLocalKey(key, group);
		if (this.localCache.has(localKey)) return true;

		const redisKey = this.buildKey(key, group);
		return (await this.redis.exists(redisKey)) === 1;
	}

	/**
	 * Get the underlying Redis instance (for advanced operations).
	 */
	getRedis(): Redis {
		return this.redis;
	}
}
