export { PUBLIC_ROUTES, isPublicRoute } from '$lib/routes/public';

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
