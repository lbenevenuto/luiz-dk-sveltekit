import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './validation';

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
