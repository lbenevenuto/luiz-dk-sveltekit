/**
 * Define public routes that don't require authentication
 * These routes will skip Clerk authentication entirely
 */
export const PUBLIC_ROUTES = [
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
export function isPublicRoute(pathname: string): boolean {
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
export function getAuthorizedParties(baseUrl?: string): string[] {
	const parties = ['http://localhost:5173', 'http://localhost:4173']; // Dev and preview

	if (baseUrl) {
		parties.push(baseUrl);
	}

	return parties;
}
