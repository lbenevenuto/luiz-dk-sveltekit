import { describe, it, expect } from 'vitest';
import { getErrorMessage, parseDaysParam } from './validation';

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
