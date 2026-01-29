import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getClerkClient } from '$lib/server/clerk';
import { getAuthorizedParties, isPublicRoute } from '$lib/server/routes';
import type { UserRole } from '../../app';
import { logger } from '$lib/server/logger';

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

	// Skip authentication for public routes to avoid unnecessary handshakes
	if (isPublicRoute(url.pathname)) {
		return resolve(event);
	}

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
		console.log('Clerk handshake required');
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
			logger.warn('auth.admin.redirect_login', { path: url.pathname });
			return redirect(307, `/login?redirect_url=${encodeURIComponent(url.pathname)}`);
		}

		if (event.locals.auth.role !== 'admin') {
			logger.warn('auth.admin.forbidden', { userId: event.locals.auth.userId, path: url.pathname });
			// Redirect to 403 page with attempted URL
			return redirect(307, `/403?url=${encodeURIComponent(url.pathname)}`);
		}
	}

	const response = await resolve(event);

	// Forward any observability or session maintenance headers from Clerk
	if (requestState.headers) {
		requestState.headers.forEach((value, key) => {
			response.headers.append(key, value);
		});
	}

	return response;
};
