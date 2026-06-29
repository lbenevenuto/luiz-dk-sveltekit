import { describe, it, expect } from 'vitest';
import { daysSchema, pageSizeSchema } from './validation-schemas';

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
