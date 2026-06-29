import { describe, it, expect } from 'vitest';
import { spinnerClasses } from './spinner-classes';

describe('spinnerClasses', () => {
	it('maps each size to its dimension classes plus the shared animation classes', () => {
		expect(spinnerClasses('sm')).toBe('h-5 w-5 animate-spin rounded-full');
		expect(spinnerClasses('md')).toBe('h-6 w-6 animate-spin rounded-full');
		expect(spinnerClasses('lg')).toBe('h-8 w-8 animate-spin rounded-full');
		expect(spinnerClasses('xl')).toBe('h-12 w-12 animate-spin rounded-full');
	});

	it('appends extra classes when provided', () => {
		expect(spinnerClasses('sm', 'border-t-2 border-b-2 border-white')).toBe(
			'h-5 w-5 animate-spin rounded-full border-t-2 border-b-2 border-white'
		);
	});

	it('omits the trailing space when no extra classes are provided', () => {
		expect(spinnerClasses('lg')).not.toMatch(/\s$/);
	});
});
