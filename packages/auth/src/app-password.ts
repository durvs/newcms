import { randomBytes, createHash } from 'crypto';

/**
 * Generate an application password (for API access via HTTP Basic Auth).
 * Returns the raw password (shown once) and the hash (stored in DB).
 */
export function generateAppPassword(): { raw: string; hash: string } {
	// Generate 24 random bytes, encode as base64, take 24 chars
	const raw = randomBytes(24)
		.toString('base64')
		.replace(/[^a-zA-Z0-9]/g, '')
		.substring(0, 24);

	// Format as xxxx xxxx xxxx xxxx xxxx xxxx for readability
	const formatted = raw.match(/.{1,4}/g)?.join(' ') ?? raw;

	const hash = hashAppPassword(raw);

	return { raw: formatted, hash };
}

/**
 * Hash an application password for storage.
 */
export function hashAppPassword(password: string): string {
	// Strip spaces (user might paste with spaces)
	const cleaned = password.replace(/\s/g, '');
	return createHash('sha256').update(cleaned).digest('hex');
}

/**
 * Verify an application password.
 */
export function verifyAppPassword(input: string, storedHash: string): boolean {
	const inputHash = hashAppPassword(input);
	return inputHash === storedHash;
}
