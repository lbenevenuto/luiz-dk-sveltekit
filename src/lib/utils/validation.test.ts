import { describe, it, expect } from 'vitest';
import { daysSchema, getErrorMessage, pageSizeSchema, parseDaysParam } from './validation';

describe('getErrorMessage', () => {
	it('returns the message of an Error instance', () => {
		expect(getErrorMessage(new Error('boom'))).toBe('boom');
	});

	it('stringifies non-Error values', () => {
		expect(getErrorMessage('plain string')).toBe('plain string');
		expect(getErrorMessage(42)).toBe('42');
		expect(getErrorMessage(null)).toBe('null');
		expect(getErrorMessage(undefined)).toBe('undefined');
	});
});

describe('parseDaysParam', () => {
	it('returns the value when it is an allowed day range', () => {
		expect(parseDaysParam('30')).toBe(30);
	});

	it('defaults to 7 when missing, invalid, or not allowed', () => {
		expect(parseDaysParam(null)).toBe(7);
		expect(parseDaysParam('abc')).toBe(7);
		expect(parseDaysParam('15')).toBe(7);
	});
});

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
