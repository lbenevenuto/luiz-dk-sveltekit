/**
 * Hashids
 * Generates short codes like "1X9kP" from sequential IDs
 *
 * Uses a cache to avoid recreating Hashids instances on every call,
 * since construction involves alphabet shuffling.
 */

import Hashids from 'hashids';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Cache of Hashids instances keyed by `${salt}:${minLength}` */
const instanceCache = new Map<string, Hashids>();

/**
 * Create or retrieve a cached Hashids instance with custom configuration
 */
export function createHashids(salt: string, minLength: number = 5): Hashids {
	const cacheKey = `${salt}:${minLength}`;
	let instance = instanceCache.get(cacheKey);
	if (!instance) {
		instance = new Hashids(salt, minLength, ALPHABET);
		instanceCache.set(cacheKey, instance);
	}
	return instance;
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
export function extractIdFromShortCode(shortCode: string, salt: string, minLength: number = 3): number | null {
	try {
		const hashids = createHashids(salt, minLength);
		const decoded = hashids.decode(shortCode);

		if (decoded.length === 0) {
			return null;
		}

		return Number(decoded[0]);
	} catch {
		return null;
	}
}
