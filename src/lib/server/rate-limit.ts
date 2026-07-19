import { sanitizeIdentifier } from '$lib/utils/validation';
import { logger } from '$lib/server/logger';

/**
 * Check rate limit for anonymous users using Cloudflare KV
 * Uses a sliding window algorithm with KV storage
 * @param identifier - Unique identifier (IP address, fingerprint, etc.)
 * @param platform - SvelteKit platform object
 * @returns Whether the request is allowed
 */
export async function checkAnonymousRateLimit(
	identifier: string,
	platform: App.Platform | undefined
): Promise<boolean> {
	// Local dev: Allow all requests
	if (!platform?.env.CACHE) {
		logger.warn('rate_limit.cache_unavailable');
		return true;
	}

	const maxRequests = parseInt(platform.env.RATE_LIMIT_MAX_REQUESTS || '10');
	const windowSeconds = parseInt(platform.env.RATE_LIMIT_WINDOW_SECONDS || '3600');

	try {
		// Normalize identifier to prevent cache key injection
		const normalizedId = sanitizeIdentifier(identifier);
		const key = `ratelimit:anon:${normalizedId}`;
		const now = Date.now();
		const windowStart = now - windowSeconds * 1000;

		// Get existing requests from KV
		const stored = await platform.env.CACHE.get(key, 'json');
		let requests: number[] = Array.isArray(stored) ? stored : [];

		// Remove requests outside the current window
		requests = requests.filter((timestamp) => timestamp > windowStart);

		// Check if limit exceeded
		if (requests.length >= maxRequests) {
			return false;
		}

		// Add current request
		requests.push(now);

		// Store updated requests with TTL
		await platform.env.CACHE.put(key, JSON.stringify(requests), {
			expirationTtl: windowSeconds
		});

		return true;
	} catch (error) {
		logger.error('rate_limit.check_failed', {
			error: error instanceof Error ? error.message : String(error)
		});
		// Fail open: allow the request if rate limiter fails
		return true;
	}
}
