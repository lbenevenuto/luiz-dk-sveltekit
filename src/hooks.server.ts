import { type Handle, redirect, type HandleServerError } from '@sveltejs/kit';
import { getClerkClient } from '$lib/server/clerk';
import type { UserRole } from './app';

import { sentryHandle, initCloudflareSentryHandle } from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';

/**
 * Define public routes that don't require authentication
 * These routes will skip Clerk authentication entirely
 */
const PUBLIC_ROUTES = [
	'/',
	'/about',
	'/login',
	'/register',
	'/forgot-password',
	'/403',
	'/shortener',
	'/api/v1/shorten',
	'/api/webhooks/clerk'
];

/**
 * Check if a pathname is public
 */
function isPublicRoute(pathname: string): boolean {
	// Exact match for public routes
	if (PUBLIC_ROUTES.includes(pathname)) {
		return true;
	}

	// Pattern-based matching for dynamic routes
	if (pathname.startsWith('/s/')) {
		return true; // Short URL redirects are always public
	}

	if (pathname.startsWith('/api/webhooks/')) {
		return true; // Webhooks are public
	}

	return false;
}

/**
 * Get authorized parties for Clerk authentication
 * Includes both production and development URLs
 */
function getAuthorizedParties(baseUrl?: string): string[] {
	const parties = ['http://localhost:5173', 'http://localhost:4173']; // Dev and preview

	if (baseUrl) {
		parties.push(baseUrl);
	}

	return parties;
}

const myErrorHandler: HandleServerError = ({ error, event }) => {
	console.error('An error occurred on the server side:', error, event);
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);

export const firstStep: Handle = async ({ event, resolve }) => {
	const { platform, url } = event;
	console.log('url:', url.href);

	if (!platform) throw new Error('Platform not available');

	// Initialize default auth state
	event.locals.auth = {
		userId: null,
		sessionId: null,
		user: null,
		role: null
	};

	const isPublic = isPublicRoute(url.pathname);
	console.log('isPublic:', isPublic);
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

export const handle: Handle = sequence(
	// @ts-expect-error - callback pattern is valid but types might be strict
	initCloudflareSentryHandle((event) => ({
		dsn: event.platform?.env?.SENTRY_DSN,
		sendDefaultPii: true
	})),
	sentryHandle(),
	firstStep
);
