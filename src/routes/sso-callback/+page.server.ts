// src/routes/sso-callback/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If already authenticated (cookie set), redirect to home
	if (locals.auth.userId) {
		throw redirect(303, '/');
	}

	// Otherwise, let the client-side handle the OAuth callback
	return {};
};
