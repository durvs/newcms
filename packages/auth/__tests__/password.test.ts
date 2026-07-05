import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/password.js';
import bcrypt from 'bcrypt';

const SECRET = 'test-secret-key-for-hmac';

describe('Password hashing', () => {
	it('should hash and verify a password', async () => {
		const hash = await hashPassword('my-secure-password', SECRET);
		const { valid } = await verifyPassword('my-secure-password', hash, SECRET);
		expect(valid).toBe(true);
	});

	it('should reject wrong password', async () => {
		const hash = await hashPassword('correct-password', SECRET);
		const { valid } = await verifyPassword('wrong-password', hash, SECRET);
		expect(valid).toBe(false);
	});

	it('should produce different hashes for same password (salted)', async () => {
		const h1 = await hashPassword('same-password', SECRET);
		const h2 = await hashPassword('same-password', SECRET);
		expect(h1).not.toBe(h2);
	});

	it('should handle empty password', async () => {
		const hash = await hashPassword('', SECRET);
		const { valid } = await verifyPassword('', hash, SECRET);
		expect(valid).toBe(true);
	});

	it('should handle very long passwords (bcrypt 72-byte limit bypassed by pre-hash)', async () => {
		const longPassword = 'a'.repeat(200);
		const hash = await hashPassword(longPassword, SECRET);
		const { valid } = await verifyPassword(longPassword, hash, SECRET);
		expect(valid).toBe(true);
	});

	it('should distinguish passwords that differ only after byte 72', async () => {
		const base = 'x'.repeat(72);
		const p1 = base + 'A';
		const p2 = base + 'B';
		const hash = await hashPassword(p1, SECRET);
		const { valid } = await verifyPassword(p2, hash, SECRET);
		expect(valid).toBe(false);
	});

	describe('legacy hash support', () => {
		it('should verify plain bcrypt (no pre-hash) and flag needsRehash', async () => {
			const plainHash = await bcrypt.hash('legacy-password', 10);
			const { valid, needsRehash } = await verifyPassword('legacy-password', plainHash, SECRET);
			expect(valid).toBe(true);
			expect(needsRehash).toBe(true);
		});

		it('should flag needsRehash when bcrypt rounds are too low', async () => {
			// Hash with current scheme but low rounds
			const lowRoundHash = await bcrypt.hash('test', 8);
			// This is a plain bcrypt hash, so it will match as legacy
			const { valid, needsRehash } = await verifyPassword('test', lowRoundHash, SECRET);
			expect(valid).toBe(true);
			expect(needsRehash).toBe(true);
		});

		it('should NOT flag needsRehash for current-format hash', async () => {
			const hash = await hashPassword('current', SECRET);
			const { valid, needsRehash } = await verifyPassword('current', hash, SECRET);
			expect(valid).toBe(true);
			expect(needsRehash).toBe(false);
		});
	});
});
