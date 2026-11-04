import { describe, expect, it } from 'vitest';
import { isPublicRoute } from './public';

describe('isPublicRoute', () => {
	it.each(['/', '/login', '/sso-callback', '/api/v1/shorten', '/s/abc', '/api/webhooks/clerk'])(
		'treats %s as public',
		(path) => {
			expect(isPublicRoute(path)).toBe(true);
		}
	);

	it.each(['/admin', '/admin/urls', '/dashboard', '/profile', '/api/v1/analytics-log', '/api/v1/reset', '/sX', '/s'])(
		'treats %s as protected',
		(path) => {
			expect(isPublicRoute(path)).toBe(false);
		}
	);
});
