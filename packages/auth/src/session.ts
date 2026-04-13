import { randomBytes, createHash } from 'crypto';
import type Redis from 'ioredis';

export interface SessionData {
	userId: number;
	ip: string;
	userAgent: string;
	loginTime: number;
	expiresAt: number;
}

export interface SessionCreateInput {
	userId: number;
	ip?: string;
	userAgent?: string;
	ttlSeconds?: number;
}

const DEFAULT_TTL = 14 * 24 * 3600; // 14 days
const SESSION_PREFIX = 'session';

/**
 * Redis-backed session manager.
 *
 * Sessions are stored as:
 *   Key:   session:{userId}:{tokenHash}
 *   Value: JSON SessionData
 *   TTL:   Native Redis TTL (default 14 days)
 *
 * Operations are O(1) for create, verify, destroy.
 * SCAN used for listing/destroying all sessions of a user.
 */
export class SessionManager {
	constructor(private redis: Redis) {}

	/**
	 * Create a new session. Returns the raw token (given to the client)
	 * and the session data (stored in Redis).
	 */
	async create(input: SessionCreateInput): Promise<{ token: string; session: SessionData }> {
		const token = randomBytes(32).toString('hex');
		const tokenHash = this.hashToken(token);
		const ttl = input.ttlSeconds ?? DEFAULT_TTL;
		const now = Math.floor(Date.now() / 1000);

		const session: SessionData = {
			userId: input.userId,
			ip: input.ip ?? '',
			userAgent: input.userAgent ?? '',
			loginTime: now,
			expiresAt: now + ttl,
		};

		const key = this.buildKey(input.userId, tokenHash);
		await this.redis.setex(key, ttl, JSON.stringify(session));

		return { token, session };
	}

	/**
	 * Validate a session token. Returns the session data if valid, undefined if not.
	 */
	async validate(userId: number, token: string): Promise<SessionData | undefined> {
		const tokenHash = this.hashToken(token);
		const key = this.buildKey(userId, tokenHash);
		const raw = await this.redis.get(key);

		if (!raw) return undefined;

		try {
			return JSON.parse(raw) as SessionData;
		} catch {
			return undefined;
		}
	}

	/**
	 * Destroy a specific session.
	 */
	async destroy(userId: number, token: string): Promise<boolean> {
		const tokenHash = this.hashToken(token);
		const key = this.buildKey(userId, tokenHash);
		const count = await this.redis.del(key);
		return count > 0;
	}

	/**
	 * List all active sessions for a user.
	 */
	async listByUser(userId: number): Promise<SessionData[]> {
		const pattern = `${SESSION_PREFIX}:${userId}:*`;
		const sessions: SessionData[] = [];
		let cursor = '0';

		do {
			const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
			cursor = nextCursor;

			if (keys.length > 0) {
				const values = await this.redis.mget(...keys);
				for (const raw of values) {
					if (raw) {
						try {
							sessions.push(JSON.parse(raw) as SessionData);
						} catch {
							// skip corrupted entries
						}
					}
				}
			}
		} while (cursor !== '0');

		return sessions;
	}

	/**
	 * Destroy all sessions for a user (e.g., on password change).
	 */
	async destroyAllForUser(userId: number): Promise<number> {
		const pattern = `${SESSION_PREFIX}:${userId}:*`;
		let destroyed = 0;
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
				destroyed += keys.length;
			}
		} while (cursor !== '0');

		return destroyed;
	}

	private buildKey(userId: number, tokenHash: string): string {
		return `${SESSION_PREFIX}:${userId}:${tokenHash}`;
	}

	private hashToken(token: string): string {
		return createHash('sha256').update(token).digest('hex');
	}
}
