import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/paths', () => ({ base: '' }));

import { normalizeRedirectPath } from './redirect';

describe('normalizeRedirectPath', () => {
	it.each([
		['/dashboard', '/dashboard'],
		['/admin/urls?page=2#top', '/admin/urls?page=2#top']
	])('keeps same-origin path %s', (input, expected) => {
		expect(normalizeRedirectPath(input)).toBe(expected);
	});

	it.each([null, undefined, '', 'https://evil.com', '//evil.com', '/\\evil.com', '/\t/evil.com', '/\n/evil.com'])(
		'falls back to / for %j',
		(input) => {
			expect(normalizeRedirectPath(input)).toBe('/');
		}
	);

	it.each(['/.//evil.com', '/%2e//evil.com', '/a/..//evil.com'])('rejects %j, which normalizes to //host', (input) => {
		expect(normalizeRedirectPath(input)).toBe('/');
	});
});
