import type { Handle } from '@sveltejs/kit';
import { getClerkClient } from '$lib/server/clerk';
import { verifyToken } from '@clerk/backend';
import type { UserRole } from './app';

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
	'/403', // Access denied page
	'/shortener',
	'/api/v1/shorten', // Allow anonymous URL shortening with rate limits
	'/api/webhooks/clerk' // Clerk webhook endpoint
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
		parties.push(baseUrl); // Production URL
	}

	return parties;
}

export const handle: Handle = async ({ event, resolve }) => {
	const { platform, url } = event;

	console.log('Handling request:', url.pathname);

	// Initialize default auth state
	event.locals.auth = {
		userId: null,
		sessionId: null,
		user: null,
		role: null
	};

	// Skip Clerk authentication for public routes
	const isPublic = isPublicRoute(url.pathname);

	// Authenticate request if platform is available AND route is not public
	if (platform?.env.CLERK_SECRET_KEY && !isPublic) {
		const clerkClient = getClerkClient(platform.env);

		try {
			const requestState = await clerkClient.authenticateRequest(event.request, {
				authorizedParties: getAuthorizedParties(platform.env.BASE_URL)
			});

			// Handle Clerk handshake (redirects for session management)
			// Only process these redirects for non-public routes
			if (requestState.headers) {
				const locationHeader = requestState.headers.get('location');
				if (locationHeader) {
					return new Response(null, {
						status: 307,
						headers: { location: locationHeader }
					});
				}
			}

			if (requestState.isSignedIn && requestState.toAuth().userId) {
				const authData = requestState.toAuth();

				// Fetch full user to get metadata
				const user = await clerkClient.users.getUser(authData.userId);
				const role = (user.publicMetadata?.role as UserRole) || 'user';

				event.locals.auth = {
					userId: authData.userId,
					sessionId: authData.sessionId,
					user,
					role
				};
			}
		} catch (error) {
			console.error('Clerk authentication error:', error);
		}
	} else if (platform?.env.CLERK_SECRET_KEY && isPublic) {
		// For public routes, still try to get auth info if available
		// but don't enforce authentication or redirects
		const clerkClient = getClerkClient(platform.env);

		try {
			// Check for Bearer token in Authorization header (for API calls)
			const authHeader = event.request.headers.get('Authorization');
			const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

			if (bearerToken) {
				// Verify the session token using Clerk's verifyToken
				const verifiedToken = await verifyToken(bearerToken, {
					secretKey: platform.env.CLERK_SECRET_KEY,
					authorizedParties: getAuthorizedParties(platform.env.BASE_URL)
				});

				const userId = verifiedToken.sub; // Subject claim contains userId

				if (userId) {
					// Fetch full user to get metadata
					const user = await clerkClient.users.getUser(userId);
					const role = (user.publicMetadata?.role as UserRole) || 'user';

					event.locals.auth = {
						userId,
						sessionId: verifiedToken.sid || null, // Session ID from token
						user,
						role
					};

					console.log('[Auth] Authenticated via Bearer token:', { userId, role });
				}
			} else {
				// Fall back to cookie-based authentication
				const requestState = await clerkClient.authenticateRequest(event.request, {
					authorizedParties: getAuthorizedParties(platform.env.BASE_URL)
				});

				if (requestState.isSignedIn && requestState.toAuth().userId) {
					const authData = requestState.toAuth();

					// Fetch full user to get metadata
					const user = await clerkClient.users.getUser(authData.userId);
					const role = (user.publicMetadata?.role as UserRole) || 'user';

					event.locals.auth = {
						userId: authData.userId,
						sessionId: authData.sessionId,
						user,
						role
					};

					console.log('[Auth] Authenticated via cookie:', {
						userId: authData.userId,
						role
					});
				}
			}
		} catch (error) {
			console.error('Clerk authentication error on public route:', error);
			// Don't throw on public routes - just log the error
		}
	}

	// Protect admin routes
	if (url.pathname.startsWith('/admin')) {
		if (!event.locals.auth.userId) {
			return new Response(null, {
				status: 307,
				headers: { location: `/login?redirect_url=${encodeURIComponent(url.pathname)}` }
			});
		}

		if (event.locals.auth.role !== 'admin') {
			// Redirect to 403 page with attempted URL
			return new Response(null, {
				status: 307,
				headers: { location: `/403?url=${encodeURIComponent(url.pathname)}` }
			});
		}
	}

	const response = await resolve(event);
	return response;
};
