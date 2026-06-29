import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
import ErrorAlert from './ErrorAlert.svelte';

describe('ErrorAlert', () => {
	it('renders the message when no children are provided', () => {
		const { body } = render(ErrorAlert, { props: { message: 'Something went wrong' } });
		expect(body).toContain('Something went wrong');
	});

	it('renders children instead of the message when provided', () => {
		const children = createRawSnippet(() => ({ render: () => '<span>custom content</span>' }));
		const { body } = render(ErrorAlert, { props: { message: 'ignored', children } });
		expect(body).toContain('<span>custom content</span>');
		expect(body).not.toContain('ignored');
	});

	it('applies the default padding', () => {
		const { body } = render(ErrorAlert, { props: { message: 'x' } });
		expect(body).toContain('p-4');
	});

	it('applies a custom padding when provided', () => {
		const { body } = render(ErrorAlert, { props: { message: 'x', padding: 'p-6' } });
		expect(body).toContain('p-6');
	});

	it('appends the caller class', () => {
		const { body } = render(ErrorAlert, { props: { message: 'x', class: 'mt-4' } });
		expect(body).toContain('mt-4');
	});
});
