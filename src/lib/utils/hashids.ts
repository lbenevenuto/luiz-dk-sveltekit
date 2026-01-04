/**
 * Hashids
 * Generates short codes like "ab1X9kP" from sequential IDs
 */

import Hashids from 'hashids';

/**
 * Create Hashids instance with custom configuration
 */
export function createHashids(salt: string, minLength: number = 5): Hashids {
	return new Hashids(
		salt,
		minLength,
		'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
	);
}

/**
 * Generate short code from ID
 * @param id - Sequential ID (e.g., 16000000)
 * @param salt - Secret salt for Hashids
 * @param minLength - Minimum length of hash portion (default: 5)
 * @returns Short code (e.g., "ab1X9kP")
 */
export function generateShortCode(id: number, salt: string, minLength: number = 5): string {
	// Encode ID with Hashids
	const hashids = createHashids(salt, minLength);

	// Combine prefix + hash
	return hashids.encode(id);
}

/**
 * Extract ID from short code
 * @param shortCode - Short code (e.g., "ab1X9kP")
 * @param salt - Secret salt for Hashids
 * @returns Original sequential ID or null if invalid
 */
export function extractIdFromShortCode(shortCode: string, salt: string): number | null {
	// Must have at least prefix (2) + some hash
	if (shortCode.length < 3) {
		return null;
	}

	// Extract hash portion (skip 2-letter prefix)
	const hashPortion = shortCode.substring(2);

	// Decode with Hashids
	const hashids = createHashids(salt);
	const decoded = hashids.decode(hashPortion);

	if (decoded.length === 0) {
		return null;
	}

	return Number(decoded[0]);
}
