import { error } from '@sveltejs/kit';

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
