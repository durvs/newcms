import { describe, it, expect } from 'vitest';
import { createNonce, verifyNonce } from '../src/nonce.js';

const SECRET = 'test-nonce-secret';

describe('Nonce', () => {
	it('should create and verify a nonce', () => {
		const nonce = createNonce('save_post', 1, SECRET);
		expect(typeof nonce).toBe('string');
		expect(nonce.length).toBe(10);

		const result = verifyNonce(nonce, 'save_post', 1, SECRET);
		expect(result).toBe(1); // valid in current tick
	});

	it('should reject wrong action', () => {
		const nonce = createNonce('save_post', 1, SECRET);
		const result = verifyNonce(nonce, 'delete_post', 1, SECRET);
		expect(result).toBe(0);
	});

	it('should reject wrong user', () => {
		const nonce = createNonce('save_post', 1, SECRET);
		const result = verifyNonce(nonce, 'save_post', 2, SECRET);
		expect(result).toBe(0);
	});

	it('should reject wrong secret', () => {
		const nonce = createNonce('save_post', 1, SECRET);
		const result = verifyNonce(nonce, 'save_post', 1, 'wrong-secret');
		expect(result).toBe(0);
	});

	it('should reject empty/garbage nonce', () => {
		expect(verifyNonce('', 'save_post', 1, SECRET)).toBe(0);
		expect(verifyNonce('abcdef1234', 'save_post', 1, SECRET)).toBe(0);
		expect(verifyNonce('x', 'save_post', 1, SECRET)).toBe(0);
	});

	it('should produce different nonces for different actions', () => {
		const n1 = createNonce('action_a', 1, SECRET);
		const n2 = createNonce('action_b', 1, SECRET);
		expect(n1).not.toBe(n2);
	});

	it('should produce different nonces for different users', () => {
		const n1 = createNonce('save_post', 1, SECRET);
		const n2 = createNonce('save_post', 2, SECRET);
		expect(n1).not.toBe(n2);
	});

	it('should produce same nonce for same inputs in same tick', () => {
		const n1 = createNonce('save_post', 1, SECRET);
		const n2 = createNonce('save_post', 1, SECRET);
		expect(n1).toBe(n2);
	});
});
