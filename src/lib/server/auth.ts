import { error } from '@sveltejs/kit';
import type { UserRole } from '$lib/../app.d';

export function requireAuth(locals: App.Locals): asserts locals is App.Locals & {
	auth: { userId: string; user: NonNullable<App.Locals['auth']['user']> };
} {
	if (!locals.auth.userId) {
		throw error(401, { message: 'Unauthorized. Please sign in.' });
	}
}

export function requireAdmin(locals: App.Locals): void {
	requireAuth(locals);
	if (locals.auth.role !== 'admin') {
		throw error(403, { message: 'Forbidden. Admin access required.' });
	}
}

export function isAuthenticated(locals: App.Locals): boolean {
	return locals.auth.userId !== null;
}

export function hasRole(locals: App.Locals, role: UserRole): boolean {
	return locals.auth.role === role;
}

export function getUserRole(locals: App.Locals): UserRole | null {
	return locals.auth.role;
}
