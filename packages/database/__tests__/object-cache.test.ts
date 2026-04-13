import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectCache } from '../src/cache/object-cache.js';

const REDIS_HOST = process.env['REDIS_HOST'] ?? 'localhost';
const REDIS_PORT = parseInt(process.env['REDIS_PORT'] ?? '6380', 10);

describe('ObjectCache', () => {
	let cache: ObjectCache;

	beforeAll(async () => {
		cache = new ObjectCache({
			host: REDIS_HOST,
			port: REDIS_PORT,
			keyPrefix: 'test_cache',
		});
		await cache.connect();
	});

	afterAll(async () => {
		await cache.flushAll();
		await cache.disconnect();
	});

	beforeEach(async () => {
		await cache.flushAll();
		cache.clearLocalCache();
	});

	// ─── Basic get/set ───────────────────────────────────────────

	describe('get / set', () => {
		it('should store and retrieve a string', async () => {
			await cache.set('name', 'hello');
			const result = await cache.get<string>('name');
			expect(result).toBe('hello');
		});

		it('should store and retrieve a number', async () => {
			await cache.set('count', 42);
			const result = await cache.get<number>('count');
			expect(result).toBe(42);
		});

		it('should store and retrieve an object', async () => {
			const obj = { title: 'Hello', id: 1, tags: ['a', 'b'] };
			await cache.set('post', obj);
			const result = await cache.get('post');
			expect(result).toEqual(obj);
		});

		it('should return undefined for non-existent key', async () => {
			const result = await cache.get('nonexistent');
			expect(result).toBeUndefined();
		});

		it('should use "default" group when none specified', async () => {
			await cache.set('key1', 'value1');
			const result = await cache.get('key1', 'default');
			expect(result).toBe('value1');
		});

		it('should separate values by group', async () => {
			await cache.set('key1', 'posts-value', 'posts');
			await cache.set('key1', 'users-value', 'users');

			expect(await cache.get('key1', 'posts')).toBe('posts-value');
			expect(await cache.get('key1', 'users')).toBe('users-value');
		});

		it('should return value from local cache on second read', async () => {
			await cache.set('local', 'value');
			// First read populates local cache
			await cache.get('local');
			// Second read should come from local cache
			const result = await cache.get('local');
			expect(result).toBe('value');
		});
	});

	// ─── TTL ─────────────────────────────────────────────────────

	describe('TTL', () => {
		it('should expire keys after TTL', async () => {
			await cache.set('expiring', 'value', 'default', 1);
			expect(await cache.get('expiring')).toBe('value');

			// Wait for expiry
			await new Promise((resolve) => setTimeout(resolve, 1500));
			cache.clearLocalCache(); // Clear local cache to force Redis read
			expect(await cache.get('expiring')).toBeUndefined();
		});

		it('should respect group-level TTL', async () => {
			cache.setGroupTtl('transients', 1);
			await cache.set('t1', 'value', 'transients');

			await new Promise((resolve) => setTimeout(resolve, 1500));
			cache.clearLocalCache();
			expect(await cache.get('t1', 'transients')).toBeUndefined();
		});
	});

	// ─── add ─────────────────────────────────────────────────────

	describe('add', () => {
		it('should add when key does not exist', async () => {
			const added = await cache.add('new_key', 'value');
			expect(added).toBe(true);
			expect(await cache.get('new_key')).toBe('value');
		});

		it('should NOT overwrite existing key', async () => {
			await cache.set('existing', 'original');
			const added = await cache.add('existing', 'new_value');
			expect(added).toBe(false);

			cache.clearLocalCache();
			expect(await cache.get('existing')).toBe('original');
		});
	});

	// ─── delete ──────────────────────────────────────────────────

	describe('delete', () => {
		it('should delete an existing key', async () => {
			await cache.set('del_me', 'value');
			const deleted = await cache.delete('del_me');
			expect(deleted).toBe(true);
			cache.clearLocalCache();
			expect(await cache.get('del_me')).toBeUndefined();
		});

		it('should return false for non-existent key', async () => {
			const deleted = await cache.delete('nonexistent');
			expect(deleted).toBe(false);
		});
	});

	// ─── incr / decr ────────────────────────────────────────────

	describe('incr / decr', () => {
		it('should increment a numeric value', async () => {
			await cache.set('counter', 10);
			const result = await cache.incr('counter');
			expect(result).toBe(11);
		});

		it('should increment by custom offset', async () => {
			await cache.set('counter', 10);
			const result = await cache.incr('counter', 'default', 5);
			expect(result).toBe(15);
		});

		it('should decrement a numeric value', async () => {
			await cache.set('counter', 10);
			const result = await cache.decr('counter');
			expect(result).toBe(9);
		});

		it('should return false for non-existent key', async () => {
			const result = await cache.incr('nonexistent');
			expect(result).toBe(false);
		});

		it('should return false for non-numeric value', async () => {
			await cache.set('str', 'hello');
			const result = await cache.incr('str');
			expect(result).toBe(false);
		});
	});

	// ─── Batch operations ────────────────────────────────────────

	describe('getMultiple / setMultiple', () => {
		it('should get multiple values at once', async () => {
			await cache.set('a', 1);
			await cache.set('b', 2);
			await cache.set('c', 3);

			cache.clearLocalCache();
			const result = await cache.getMultiple(['a', 'b', 'c', 'nonexistent']);

			expect(result.get('a')).toBe(1);
			expect(result.get('b')).toBe(2);
			expect(result.get('c')).toBe(3);
			expect(result.has('nonexistent')).toBe(false);
		});

		it('should set multiple values at once', async () => {
			await cache.setMultiple({ x: 'alpha', y: 'beta', z: 'gamma' });

			cache.clearLocalCache();
			expect(await cache.get('x')).toBe('alpha');
			expect(await cache.get('y')).toBe('beta');
			expect(await cache.get('z')).toBe('gamma');
		});

		it('should handle empty input', async () => {
			const result = await cache.getMultiple([]);
			expect(result.size).toBe(0);

			await cache.setMultiple({});
		});
	});

	// ─── Groups and isolation ────────────────────────────────────

	describe('groups and multisite', () => {
		it('should isolate per-site groups by siteId', async () => {
			cache.setSiteId(1);
			await cache.set('key', 'site1-value', 'posts');

			cache.setSiteId(2);
			await cache.set('key', 'site2-value', 'posts');

			cache.clearLocalCache();

			cache.setSiteId(1);
			expect(await cache.get('key', 'posts')).toBe('site1-value');

			cache.setSiteId(2);
			expect(await cache.get('key', 'posts')).toBe('site2-value');
		});

		it('should share global groups across sites', async () => {
			cache.addGlobalGroups(['users']);

			cache.setSiteId(1);
			await cache.set('admin', { id: 1 }, 'users');

			cache.clearLocalCache();

			cache.setSiteId(2);
			const result = await cache.get('admin', 'users');
			expect(result).toEqual({ id: 1 });
		});
	});

	// ─── Flush ───────────────────────────────────────────────────

	describe('flush', () => {
		it('should flush all keys in a group', async () => {
			await cache.set('a', 1, 'posts');
			await cache.set('b', 2, 'posts');
			await cache.set('c', 3, 'users');

			const deleted = await cache.flushGroup('posts');
			expect(deleted).toBe(2);

			cache.clearLocalCache();
			expect(await cache.get('a', 'posts')).toBeUndefined();
			expect(await cache.get('b', 'posts')).toBeUndefined();
			expect(await cache.get('c', 'users')).toBe(3);
		});

		it('should flush all cache data', async () => {
			await cache.set('a', 1, 'posts');
			await cache.set('b', 2, 'users');

			const deleted = await cache.flushAll();
			expect(deleted).toBeGreaterThanOrEqual(2);

			cache.clearLocalCache();
			expect(await cache.get('a', 'posts')).toBeUndefined();
			expect(await cache.get('b', 'users')).toBeUndefined();
		});
	});

	// ─── exists ──────────────────────────────────────────────────

	describe('exists', () => {
		it('should return true for existing key', async () => {
			await cache.set('exists_key', 'value');
			expect(await cache.exists('exists_key')).toBe(true);
		});

		it('should return false for non-existent key', async () => {
			expect(await cache.exists('no_key')).toBe(false);
		});
	});
});
