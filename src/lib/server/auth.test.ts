import { describe, it, expect } from 'vitest';
import { requireAuth, requireAdmin } from './auth';

function makeLocals(overrides?: Partial<App.Locals['auth']>): App.Locals {
	return {
		db: {} as App.Locals['db'],
		requestId: 'test-id',
		auth: {
			userId: null,
			sessionId: null,
			user: null,
			role: null,
			...overrides
		}
	};
}

describe('auth guards', () => {
	describe('requireAuth', () => {
		it('throws 401 when user is not authenticated', () => {
			const locals = makeLocals();
			expect(() => requireAuth(locals)).toThrow();
			try {
				requireAuth(locals);
			} catch (e) {
				const err = e as { status: number; body: { message: string } };
				expect(err.status).toBe(401);
				expect(err.body.message).toBe('Unauthorized. Please sign in.');
			}
		});

		it('does not throw when user is authenticated', () => {
			const locals = makeLocals({ userId: 'user_123', user: {} as App.Locals['auth']['user'] });
			expect(() => requireAuth(locals)).not.toThrow();
		});
	});

	describe('requireAdmin', () => {
		it('throws 401 when user is not authenticated', () => {
			const locals = makeLocals();
			expect(() => requireAdmin(locals)).toThrow();
			try {
				requireAdmin(locals);
			} catch (e) {
				const err = e as { status: number };
				expect(err.status).toBe(401);
			}
		});

		it('throws 403 when user is not admin', () => {
			const locals = makeLocals({ userId: 'user_123', user: {} as App.Locals['auth']['user'], role: 'user' });
			expect(() => requireAdmin(locals)).toThrow();
			try {
				requireAdmin(locals);
			} catch (e) {
				const err = e as { status: number; body: { message: string } };
				expect(err.status).toBe(403);
				expect(err.body.message).toBe('Forbidden. Admin access required.');
			}
		});

		it('does not throw when user is admin', () => {
			const locals = makeLocals({ userId: 'admin_1', user: {} as App.Locals['auth']['user'], role: 'admin' });
			expect(() => requireAdmin(locals)).not.toThrow();
		});
	});
});
