// src/routes/sso-callback/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// If already authenticated (cookie set), redirect to home
	if (locals.auth.userId) {
		const redirectTo = url.searchParams.get('redirect_url');
		const safeRedirect = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
		throw redirect(303, safeRedirect);
	}

	// Otherwise, let the client-side handle the OAuth callback
	return {};
};
