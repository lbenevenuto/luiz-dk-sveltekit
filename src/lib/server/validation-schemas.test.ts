import { describe, it, expect } from 'vitest';
import { daysSchema, lenientDaysSchema, pageSizeSchema } from './validation-schemas';

describe('daysSchema', () => {
	it('coerces and accepts allowed values', () => {
		expect(daysSchema.parse('90')).toBe(90);
	});

	it('applies the default when the value is undefined', () => {
		expect(daysSchema.parse(undefined)).toBe(7);
	});

	it('rejects values outside the allowed list', () => {
		expect(() => daysSchema.parse(15)).toThrow();
	});
});

describe('lenientDaysSchema', () => {
	it('accepts allowed values', () => {
		expect(lenientDaysSchema.parse('30')).toBe(30);
	});

	it('falls back to the default when missing, invalid, or not allowed', () => {
		expect(lenientDaysSchema.parse(null)).toBe(7);
		expect(lenientDaysSchema.parse('abc')).toBe(7);
		expect(lenientDaysSchema.parse('15')).toBe(7);
	});
});

describe('pageSizeSchema', () => {
	it('coerces and accepts allowed values', () => {
		expect(pageSizeSchema.parse('50')).toBe(50);
	});

	it('applies the default when the value is undefined', () => {
		expect(pageSizeSchema.parse(undefined)).toBe(10);
	});

	it('rejects values outside the allowed list', () => {
		expect(() => pageSizeSchema.parse(11)).toThrow();
	});
});
