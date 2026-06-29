import { describe, it, expect } from 'vitest';
import { formatNumber, truncateString } from './format';

describe('formatNumber', () => {
	it('formats using the runtime locale', () => {
		expect(formatNumber(1234567)).toBe((1234567).toLocaleString());
	});

	it('handles zero and negatives', () => {
		expect(formatNumber(0)).toBe((0).toLocaleString());
		expect(formatNumber(-1500)).toBe((-1500).toLocaleString());
	});
});

describe('truncateString', () => {
	it('returns the original string when shorter than the limit', () => {
		expect(truncateString('hello')).toBe('hello');
	});

	it('returns the original string when exactly at the limit', () => {
		const value = 'a'.repeat(60);
		expect(truncateString(value)).toBe(value);
	});

	it('truncates and appends an ellipsis when longer than the limit', () => {
		const value = 'a'.repeat(61);
		expect(truncateString(value)).toBe('a'.repeat(60) + '...');
	});

	it('respects a custom max length', () => {
		expect(truncateString('hello world', 5)).toBe('hello...');
	});

	it('handles an empty string', () => {
		expect(truncateString('')).toBe('');
	});
});
