import { createHmac } from 'crypto';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

/**
 * Hash a password using bcrypt with HMAC-SHA384 pre-hash.
 *
 * The pre-hash prevents bcrypt's 72-byte input limit from silently
 * truncating long passwords, and ensures the full password entropy
 * is captured regardless of length.
 */
export async function hashPassword(password: string, secretKey: string): Promise<string> {
	const preHash = createHmac('sha384', secretKey).update(password).digest('base64');
	return bcrypt.hash(preHash, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a stored hash.
 * Supports multiple hash formats for backward compatibility:
 * - bcrypt with HMAC pre-hash (current)
 * - plain bcrypt (legacy)
 */
export async function verifyPassword(
	password: string,
	storedHash: string,
	secretKey: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
	// Current format: bcrypt with HMAC pre-hash
	const preHash = createHmac('sha384', secretKey).update(password).digest('base64');
	const validWithPreHash = await bcrypt.compare(preHash, storedHash);
	if (validWithPreHash) {
		const rounds = getRounds(storedHash);
		return { valid: true, needsRehash: rounds < BCRYPT_ROUNDS };
	}

	// Legacy: plain bcrypt (no pre-hash)
	const validPlain = await bcrypt.compare(password, storedHash);
	if (validPlain) {
		return { valid: true, needsRehash: true };
	}

	return { valid: false, needsRehash: false };
}

function getRounds(hash: string): number {
	const match = hash.match(/^\$2[aby]?\$(\d+)\$/);
	return match ? parseInt(match[1], 10) : 0;
}
