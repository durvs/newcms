import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Redis from 'ioredis';
import { SessionManager } from '../src/session.js';

const REDIS_PORT = parseInt(process.env['REDIS_PORT'] ?? '6380', 10);

describe('SessionManager', () => {
	let redis: Redis;
	let manager: SessionManager;

	beforeAll(async () => {
		redis = new Redis({ host: 'localhost', port: REDIS_PORT, lazyConnect: true });
		await redis.connect();
		manager = new SessionManager(redis);
	});

	afterAll(async () => {
		// Clean up test sessions
		let cursor = '0';
		do {
			const [next, keys] = await redis.scan(cursor, 'MATCH', 'session:*', 'COUNT', 100);
			cursor = next;
			if (keys.length > 0) await redis.del(...keys);
		} while (cursor !== '0');
		await redis.quit();
	});

	beforeEach(async () => {
		// Clean sessions for test user IDs
		for (const uid of [999, 998]) {
			await manager.destroyAllForUser(uid);
		}
	});

	describe('create', () => {
		it('should create a session and return token', async () => {
			const { token, session } = await manager.create({ userId: 999 });
			expect(token).toBeTruthy();
			expect(token.length).toBe(64); // 32 bytes hex
			expect(session.userId).toBe(999);
			expect(session.loginTime).toBeGreaterThan(0);
			expect(session.expiresAt).toBeGreaterThan(session.loginTime);
		});

		it('should store IP and user agent', async () => {
			const { session } = await manager.create({
				userId: 999,
				ip: '192.168.1.1',
				userAgent: 'Mozilla/5.0',
			});
			expect(session.ip).toBe('192.168.1.1');
			expect(session.userAgent).toBe('Mozilla/5.0');
		});
	});

	describe('validate', () => {
		it('should validate a valid session', async () => {
			const { token } = await manager.create({ userId: 999 });
			const session = await manager.validate(999, token);
			expect(session).toBeDefined();
			expect(session!.userId).toBe(999);
		});

		it('should return undefined for invalid token', async () => {
			const session = await manager.validate(999, 'invalid-token');
			expect(session).toBeUndefined();
		});

		it('should return undefined for wrong userId', async () => {
			const { token } = await manager.create({ userId: 999 });
			const session = await manager.validate(998, token);
			expect(session).toBeUndefined();
		});

		it('should return undefined for expired session', async () => {
			const { token } = await manager.create({ userId: 999, ttlSeconds: 1 });
			await new Promise((r) => setTimeout(r, 1500));
			const session = await manager.validate(999, token);
			expect(session).toBeUndefined();
		});
	});

	describe('destroy', () => {
		it('should destroy a session', async () => {
			const { token } = await manager.create({ userId: 999 });
			const destroyed = await manager.destroy(999, token);
			expect(destroyed).toBe(true);

			const session = await manager.validate(999, token);
			expect(session).toBeUndefined();
		});

		it('should return false for non-existent session', async () => {
			const destroyed = await manager.destroy(999, 'nonexistent');
			expect(destroyed).toBe(false);
		});
	});

	describe('listByUser', () => {
		it('should list all sessions for a user', async () => {
			await manager.create({ userId: 999, ip: '1.1.1.1' });
			await manager.create({ userId: 999, ip: '2.2.2.2' });
			await manager.create({ userId: 999, ip: '3.3.3.3' });

			const sessions = await manager.listByUser(999);
			expect(sessions).toHaveLength(3);
			const ips = sessions.map((s) => s.ip).sort();
			expect(ips).toEqual(['1.1.1.1', '2.2.2.2', '3.3.3.3']);
		});

		it('should not include other users sessions', async () => {
			await manager.create({ userId: 999 });
			await manager.create({ userId: 998 });

			const sessions = await manager.listByUser(999);
			expect(sessions).toHaveLength(1);
			expect(sessions[0].userId).toBe(999);
		});
	});

	describe('destroyAllForUser', () => {
		it('should destroy all sessions for a user', async () => {
			await manager.create({ userId: 999 });
			await manager.create({ userId: 999 });
			await manager.create({ userId: 999 });

			const destroyed = await manager.destroyAllForUser(999);
			expect(destroyed).toBe(3);

			const sessions = await manager.listByUser(999);
			expect(sessions).toHaveLength(0);
		});

		it('should not affect other users', async () => {
			await manager.create({ userId: 999 });
			await manager.create({ userId: 998 });

			await manager.destroyAllForUser(999);

			const sessions998 = await manager.listByUser(998);
			expect(sessions998).toHaveLength(1);
		});
	});
});
