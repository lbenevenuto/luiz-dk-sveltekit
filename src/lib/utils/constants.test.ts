import { describe, it, expect } from 'vitest';
import { ALLOWED_DAYS, ALLOWED_PAGE_SIZES, DEFAULT_DAYS, DEFAULT_PAGE_SIZE, SHORT_CODE_REGEX } from './constants';

describe('constants', () => {
	it('exposes the allowed day ranges with a valid default', () => {
		expect(ALLOWED_DAYS).toEqual([7, 30, 90, 180]);
		expect(ALLOWED_DAYS).toContain(DEFAULT_DAYS);
	});

	it('exposes the allowed page sizes with a valid default', () => {
		expect(ALLOWED_PAGE_SIZES).toEqual([5, 10, 50, 100]);
		expect(ALLOWED_PAGE_SIZES).toContain(DEFAULT_PAGE_SIZE);
	});

	describe('SHORT_CODE_REGEX', () => {
		it('accepts alphanumeric codes with dashes and underscores', () => {
			expect(SHORT_CODE_REGEX.test('abc_123-XYZ')).toBe(true);
		});

		it('rejects empty strings, overly long codes, and disallowed characters', () => {
			expect(SHORT_CODE_REGEX.test('')).toBe(false);
			expect(SHORT_CODE_REGEX.test('a'.repeat(51))).toBe(false);
			expect(SHORT_CODE_REGEX.test('has space')).toBe(false);
			expect(SHORT_CODE_REGEX.test('slash/code')).toBe(false);
		});
	});
});
