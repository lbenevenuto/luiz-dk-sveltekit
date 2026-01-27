import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createShortUrl } from '$lib/utils';
import { checkAnonymousRateLimit } from '$lib/server/rate-limit';

export const POST: RequestHandler = async ({ platform, request, locals }) => {
	const body = await request.json();
	const { url: originalUrl } = body as { url: string };
	const { auth } = locals;

	// Check rate limit for anonymous users
	if (!auth.userId) {
		const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';

		const rateLimitResult = await checkAnonymousRateLimit(ip, platform);

		if (!rateLimitResult.success) {
			return json(
				{
					error: 'Rate limit exceeded. Please sign in for unlimited URL shortening.',
					rateLimit: true
				},
				{ status: 429 }
			);
		}
	}

	// Create short URL with user ID
	const shortCode = await createShortUrl(
		originalUrl,
		null, // expiresAt
		platform,
		auth.userId // userId
	);

	return json({
		shortUrl: `https://luiz.dk/s/${shortCode.shortCode}`,
		originalUrl,
		...shortCode,
		anonymous: !auth.userId
	});
};
