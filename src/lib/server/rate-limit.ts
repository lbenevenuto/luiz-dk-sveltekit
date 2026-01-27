interface RateLimitResult {
	success: boolean;
	remaining?: number;
	resetAt?: number;
}

/**
 * Check rate limit for anonymous users using Cloudflare KV
 * Uses a sliding window algorithm with KV storage
 * @param identifier - Unique identifier (IP address, fingerprint, etc.)
 * @param platform - SvelteKit platform object
 * @returns Promise<RateLimitResult> - Success status and remaining requests
 */
export async function checkAnonymousRateLimit(
	identifier: string,
	platform: App.Platform | undefined
): Promise<RateLimitResult> {
	// Local dev: Allow all requests
	if (!platform?.env.CACHE) {
		console.warn('KV cache not available (local dev), allowing request');
		return { success: true };
	}

	const maxRequests = parseInt(platform.env.RATE_LIMIT_MAX_REQUESTS || '10');
	const windowSeconds = parseInt(platform.env.RATE_LIMIT_WINDOW_SECONDS || '3600');

	try {
		const key = `ratelimit:anon:${identifier}`;
		const now = Date.now();
		const windowStart = now - windowSeconds * 1000;

		// Get existing requests from KV
		const stored = await platform.env.CACHE.get(key, 'json');
		let requests: number[] = Array.isArray(stored) ? stored : [];

		// Remove requests outside the current window
		requests = requests.filter((timestamp) => timestamp > windowStart);

		// Check if limit exceeded
		if (requests.length >= maxRequests) {
			const oldestRequest = Math.min(...requests);
			const resetAt = oldestRequest + windowSeconds * 1000;

			return {
				success: false,
				remaining: 0,
				resetAt
			};
		}

		// Add current request
		requests.push(now);

		// Store updated requests with TTL
		await platform.env.CACHE.put(key, JSON.stringify(requests), {
			expirationTtl: windowSeconds
		});

		return {
			success: true,
			remaining: maxRequests - requests.length,
			resetAt: now + windowSeconds * 1000
		};
	} catch (error) {
		console.error('Rate limiting error:', error);
		// Fail open: allow the request if rate limiter fails
		return { success: true };
	}
}
