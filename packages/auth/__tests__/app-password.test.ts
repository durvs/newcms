import { describe, it, expect } from 'vitest';
import { generateAppPassword, hashAppPassword, verifyAppPassword } from '../src/app-password.js';

describe('App Passwords', () => {
	it('should generate a password and hash', () => {
		const { raw, hash } = generateAppPassword();
		expect(raw).toBeTruthy();
		expect(hash).toBeTruthy();
		expect(hash.length).toBe(64); // sha256 hex
	});

	it('should verify a generated password against its hash', () => {
		const { raw, hash } = generateAppPassword();
		expect(verifyAppPassword(raw, hash)).toBe(true);
	});

	it('should reject wrong password', () => {
		const { hash } = generateAppPassword();
		expect(verifyAppPassword('wrong-password', hash)).toBe(false);
	});

	it('should verify password with spaces stripped', () => {
		const { raw, hash } = generateAppPassword();
		// raw comes formatted with spaces (e.g., "abcd efgh ijkl ...")
		const noSpaces = raw.replace(/\s/g, '');
		expect(verifyAppPassword(noSpaces, hash)).toBe(true);
	});

	it('should produce unique passwords each time', () => {
		const p1 = generateAppPassword();
		const p2 = generateAppPassword();
		expect(p1.raw).not.toBe(p2.raw);
		expect(p1.hash).not.toBe(p2.hash);
	});

	it('hashAppPassword should be deterministic for same input', () => {
		const h1 = hashAppPassword('test-password');
		const h2 = hashAppPassword('test-password');
		expect(h1).toBe(h2);
	});
});
