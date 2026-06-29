import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import LoadingSpinner from './LoadingSpinner.svelte';

describe('LoadingSpinner', () => {
	it('renders the default (lg) size with the shared animation classes', () => {
		const { body } = render(LoadingSpinner);
		expect(body).toContain('h-8 w-8 animate-spin rounded-full');
	});

	it('renders the requested size', () => {
		const { body } = render(LoadingSpinner, { props: { size: 'xl' } });
		expect(body).toContain('h-12 w-12 animate-spin rounded-full');
	});

	it('appends caller border/color classes after the base classes', () => {
		const { body } = render(LoadingSpinner, { props: { size: 'sm', class: 'border-t-2 border-white' } });
		expect(body).toContain('h-5 w-5 animate-spin rounded-full border-t-2 border-white');
	});
});
