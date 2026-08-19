import { describe, it, expect } from 'vitest';
import { generateShortCode } from './hashids';

describe('generateShortCode', () => {
	const salt = 'test-salt';

	it('should generate a non-empty string', () => {
		const code = generateShortCode(1, salt);
		expect(code).toBeTruthy();
		expect(typeof code).toBe('string');
	});

	it('should respect the minimum length', () => {
		expect(generateShortCode(1, salt).length).toBeGreaterThanOrEqual(3);
	});

	it('should generate different codes for different IDs', () => {
		expect(generateShortCode(1, salt)).not.toBe(generateShortCode(2, salt));
	});

	it('should generate the same code for the same ID and salt', () => {
		expect(generateShortCode(42, salt)).toBe(generateShortCode(42, salt));
	});

	it('should generate different codes with different salts', () => {
		expect(generateShortCode(1, 'salt-a')).not.toBe(generateShortCode(1, 'salt-b'));
	});

	it('should only contain alphanumeric characters', () => {
		expect(generateShortCode(999999, salt)).toMatch(/^[a-zA-Z0-9]+$/);
	});
});
