import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { normalizeRedirectPath } from '$lib/client/redirect';

export const load: PageServerLoad = async ({ locals, url }) => {
	// If already authenticated (cookie set), redirect to home
	if (locals.auth.userId) {
		throw redirect(303, normalizeRedirectPath(url.searchParams.get('redirect_url')));
	}

	// Otherwise, let the client-side handle the OAuth callback
	return {};
};
