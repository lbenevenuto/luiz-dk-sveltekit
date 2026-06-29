import { describe, it, expect } from 'vitest';
import { formatDate, formatDateShort } from './date';

// Dates are built from local components (not ISO strings) so assertions are timezone-independent.
const fixed = new Date(2026, 5, 29, 13, 4, 5);

describe('formatDate', () => {
	it('formats a date as local YYYY-MM-DD HH:mm:ss', () => {
		expect(formatDate(fixed)).toBe('2026-06-29 13:04:05');
	});

	it('zero-pads single-digit months, days, and time parts', () => {
		expect(formatDate(new Date(2026, 0, 5, 9, 8, 7))).toBe('2026-01-05 09:08:07');
	});
});

describe('formatDateShort', () => {
	it('formats a date as local YYYY-MM-DD', () => {
		expect(formatDateShort(fixed)).toBe('2026-06-29');
	});

	it('zero-pads single-digit months and days', () => {
		expect(formatDateShort(new Date(2026, 0, 5))).toBe('2026-01-05');
	});
});
