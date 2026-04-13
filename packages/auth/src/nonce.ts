import { createHmac, timingSafeEqual } from 'crypto';

const NONCE_LIFETIME_SECONDS = 86400; // 24 hours
const NONCE_TICK_SECONDS = NONCE_LIFETIME_SECONDS / 2; // 12 hours per tick

/**
 * Generate a nonce for CSRF protection.
 *
 * Nonces are valid for 24 hours (two ticks of 12 hours each).
 * This means a nonce generated at any point is valid for at least 12h
 * and at most 24h.
 */
export function createNonce(action: string, userId: number, secretKey: string): string {
	const tick = getCurrentTick();
	return generateNonceHash(tick, action, userId, secretKey);
}

/**
 * Verify a nonce. Returns:
 * - 1 if valid in the current tick (fresh, 0-12h old)
 * - 2 if valid in the previous tick (aging, 12-24h old)
 * - 0 if invalid
 */
export function verifyNonce(
	nonce: string,
	action: string,
	userId: number,
	secretKey: string,
): 0 | 1 | 2 {
	const tick = getCurrentTick();

	// Check current tick
	const expected1 = generateNonceHash(tick, action, userId, secretKey);
	if (safeCompare(nonce, expected1)) return 1;

	// Check previous tick
	const expected2 = generateNonceHash(tick - 1, action, userId, secretKey);
	if (safeCompare(nonce, expected2)) return 2;

	return 0;
}

function getCurrentTick(): number {
	return Math.ceil(Date.now() / 1000 / NONCE_TICK_SECONDS);
}

function generateNonceHash(
	tick: number,
	action: string,
	userId: number,
	secretKey: string,
): string {
	const data = `${tick}|${action}|${userId}`;
	return createHmac('sha256', secretKey).update(data).digest('hex').substring(0, 10);
}

function safeCompare(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	try {
		return timingSafeEqual(Buffer.from(a), Buffer.from(b));
	} catch {
		return false;
	}
}
