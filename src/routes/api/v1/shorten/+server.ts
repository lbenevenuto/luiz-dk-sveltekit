import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createShortUrl, normalizeUrl, ShortCodeConflictError } from '$lib/utils';
import { checkAnonymousRateLimit } from '$lib/server/rate-limit';
import { logger } from '$lib/server/logger';
import { z } from 'zod/v4';

const CUSTOM_CODE_REGEX = /^[a-zA-Z0-9_-]+$/;

const shortenRequestSchema = z.object({
	url: z.url(),
	expiresIn: z.number().positive().max(31536000).optional(), // max 1 year in seconds
	customCode: z.string().min(3).max(50).regex(CUSTOM_CODE_REGEX).optional()
});

export const POST: RequestHandler = async ({ platform, request, locals }) => {
	// Parse JSON body safely
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	// Validate with Zod
	const parsed = shortenRequestSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: 'Validation failed', details: z.prettifyError(parsed.error) }, { status: 400 });
	}

	const { url: originalUrl, expiresIn, customCode } = parsed.data;
	const { auth } = locals;
	const expiresAt = expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null;
	const baseUrl = platform?.env?.BASE_URL || new URL(request.url).origin;

	// Custom codes require authentication
	if (customCode && !auth.userId) {
		return json({ error: 'Authentication required for custom short codes' }, { status: 401 });
	}

	// Protocol validation (Zod's url() allows any valid URL scheme)
	try {
		const parsedUrl = new URL(originalUrl);
		if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
			return json({ error: 'Only http/https URLs are allowed' }, { status: 400 });
		}
	} catch {
		return json({ error: 'Invalid URL' }, { status: 400 });
	}

	// Check rate limit for anonymous users
	if (!auth.userId) {
		const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';

		const rateLimitResult = await checkAnonymousRateLimit(ip, platform);

		if (!rateLimitResult.success) {
			logger.warn('rate_limit.shortener', { ip });
			return json(
				{
					error: 'Rate limit exceeded. Please sign in for unlimited URL shortening.',
					rateLimit: true
				},
				{ status: 429 }
			);
		}
	}

	const normalizedUrl = normalizeUrl(originalUrl);

	// Create short URL with user ID
	let shortCode;
	try {
		shortCode = await createShortUrl(normalizedUrl, expiresAt, platform, auth.userId, customCode ?? null);
	} catch (err) {
		if (err instanceof ShortCodeConflictError) {
			return json({ error: `Custom code "${customCode}" is already taken` }, { status: 409 });
		}
		throw err;
	}

	logger.info('shorten.created', {
		shortCode: shortCode.shortCode,
		anonymous: !auth.userId,
		expiresAt: shortCode.expiresAt,
		url: normalizedUrl
	});
	return json({
		shortUrl: `${baseUrl}/s/${shortCode.shortCode}`,
		originalUrl: normalizedUrl,
		...shortCode,
		expiresAt: shortCode.expiresAt ? new Date(shortCode.expiresAt * 1000).toISOString() : null,
		anonymous: !auth.userId
	});
};
