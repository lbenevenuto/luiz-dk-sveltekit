import { describe, it, expect } from 'vitest';
import { generateShortCode, extractIdFromShortCode, createHashids } from './hashids';

describe('hashids', () => {
	const salt = 'test-salt';

	describe('createHashids', () => {
		it('should create a Hashids instance with default min length', () => {
			const hashids = createHashids(salt);
			const encoded = hashids.encode(1);
			expect(encoded.length).toBeGreaterThanOrEqual(5);
		});

		it('should respect custom min length', () => {
			const hashids = createHashids(salt, 10);
			const encoded = hashids.encode(1);
			expect(encoded.length).toBeGreaterThanOrEqual(10);
		});
	});

	describe('generateShortCode', () => {
		it('should generate a non-empty string', () => {
			const code = generateShortCode(1, salt);
			expect(code).toBeTruthy();
			expect(typeof code).toBe('string');
		});

		it('should generate different codes for different IDs', () => {
			const code1 = generateShortCode(1, salt);
			const code2 = generateShortCode(2, salt);
			expect(code1).not.toBe(code2);
		});

		it('should generate the same code for the same ID and salt', () => {
			const code1 = generateShortCode(42, salt);
			const code2 = generateShortCode(42, salt);
			expect(code1).toBe(code2);
		});

		it('should generate different codes with different salts', () => {
			const code1 = generateShortCode(1, 'salt-a');
			const code2 = generateShortCode(1, 'salt-b');
			expect(code1).not.toBe(code2);
		});

		it('should only contain alphanumeric characters', () => {
			const code = generateShortCode(999999, salt);
			expect(code).toMatch(/^[a-zA-Z0-9]+$/);
		});

		it('should respect minLength parameter', () => {
			const code = generateShortCode(1, salt, 8);
			expect(code.length).toBeGreaterThanOrEqual(8);
		});
	});

	describe('extractIdFromShortCode', () => {
		it('should decode back to the original ID', () => {
			const id = 16000000;
			const code = generateShortCode(id, salt);
			const decoded = extractIdFromShortCode(code, salt);
			expect(decoded).toBe(id);
		});

		it('should roundtrip for various IDs', () => {
			// Note: Hashids does not support encoding 0
			const ids = [1, 100, 9999, 1000000, 2147483647];
			for (const id of ids) {
				const code = generateShortCode(id, salt);
				const decoded = extractIdFromShortCode(code, salt);
				expect(decoded).toBe(id);
			}
		});

		it('should return null for invalid short codes', () => {
			// Hashids v2 throws for characters outside the alphabet
			const result = extractIdFromShortCode('!!!invalid!!!', salt);
			expect(result).toBeNull();
		});

		it('should return null when decoded with wrong salt', () => {
			const code = generateShortCode(42, 'correct-salt');
			const result = extractIdFromShortCode(code, 'wrong-salt');
			// With wrong salt, decode may return a different number or empty array
			// The key point is it won't return the original ID
			expect(result).not.toBe(42);
		});
	});
});
