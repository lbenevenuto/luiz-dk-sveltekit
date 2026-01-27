/**
 * Hashids
 * Generates short codes like "1X9kP" from sequential IDs
 */

import Hashids from 'hashids';

/**
 * Create Hashids instance with custom configuration
 */
export function createHashids(salt: string, minLength: number = 5): Hashids {
	return new Hashids(salt, minLength, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
}

/**
 * Generate short code from ID
 * @param id - Sequential ID (e.g., 16000000)
 * @param salt - Secret salt for Hashids
 * @param minLength - Minimum length of hash portion (default: 3)
 * @returns Short code (e.g., "1X9kP")
 */
export function generateShortCode(id: number, salt: string, minLength: number = 3): string {
	const hashids = createHashids(salt, minLength);
	return hashids.encode(id);
}

/**
 * Extract ID from short code
 * @param shortCode - Short code (e.g., "1X9kP")
 * @param salt - Secret salt for Hashids
 * @returns Original sequential ID or null if invalid
 */
export function extractIdFromShortCode(shortCode: string, salt: string): number | null {
	const hashids = createHashids(salt);
	const decoded = hashids.decode(shortCode);

	if (decoded.length === 0) {
		return null;
	}

	return Number(decoded[0]);
}
