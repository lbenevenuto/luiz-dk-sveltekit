/**
 * Hashids
 * Generates short codes like "1X9kP" from sequential IDs.
 *
 * The instance is memoized per salt: construction shuffles the alphabet,
 * and in practice the salt never changes within a process.
 */

import Hashids from 'hashids';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MIN_LENGTH = 3;

let cached: { salt: string; hashids: Hashids } | null = null;

/**
 * Generate short code from ID
 * @param id - Sequential ID (e.g., 16000000)
 * @param salt - Secret salt for Hashids
 * @returns Short code (e.g., "1X9kP")
 */
export function generateShortCode(id: number, salt: string): string {
	if (cached?.salt !== salt) {
		cached = { salt, hashids: new Hashids(salt, MIN_LENGTH, ALPHABET) };
	}
	return cached.hashids.encode(id);
}
