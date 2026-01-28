import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getClerkClient } from '$lib/server/clerk';
import { getAuthorizedParties } from '$lib/server/routes';
import type { UserRole } from '../../app';

export const authHandle: Handle = async ({ event, resolve }) => {
	const { platform, url } = event;

	if (!platform) throw new Error('Platform not available');

	// Initialize default auth state
	event.locals.auth = {
		userId: null,
		sessionId: null,
		user: null,
		role: null
	};

	const clerkClient = getClerkClient(platform.env);
	const requestState = await clerkClient.authenticateRequest(event.request, {
		authorizedParties: getAuthorizedParties(platform.env.BASE_URL)
	});

	if (requestState.isSignedIn) {
		const authData = requestState.toAuth();
		const user = await clerkClient.users.getUser(authData.userId);
		const role = (user.publicMetadata?.role as UserRole) || 'user';
		event.locals.auth = {
			userId: authData.userId,
			sessionId: authData.sessionId,
			user,
			role
		};
	}

	if (requestState.headers) {
		const locationHeader = requestState.headers.get('location');
		if (locationHeader) {
			return new Response(null, {
				status: 307,
				headers: requestState.headers
			});
		}
	}

	if (requestState.status === 'handshake') {
		return new Response(null, {
			status: 401,
			headers: requestState.headers
		});
	}

	// Protect admin routes
	// Note: We might want to move this protection logic to a separate function or simpler middleware
	// but keeping it here for now to maintain behavior parity
	if (url.pathname.startsWith('/admin')) {
		if (!event.locals.auth.userId) {
			return redirect(307, `/login?redirect_url=${encodeURIComponent(url.pathname)}`);
		}

		if (event.locals.auth.role !== 'admin') {
			// Redirect to 403 page with attempted URL
			return redirect(307, `/403?url=${encodeURIComponent(url.pathname)}`);
		}
	}

	return resolve(event);
};
