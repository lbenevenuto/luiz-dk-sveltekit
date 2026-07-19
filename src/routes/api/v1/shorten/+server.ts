import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createShortUrl, normalizeUrl, ShortCodeConflictError } from '$lib/utils';
import { checkAnonymousRateLimit } from '$lib/server/rate-limit';
import { logger } from '$lib/server/logger';
import { jsonError, parseJsonBody, validationError } from '$lib/server/responses';
import { getClientIdentifierForRateLimit, isValidHttpUrl, sanitizeUrlForLog } from '$lib/utils/validation';
import { z } from 'zod';

const CUSTOM_CODE_REGEX = /^[a-zA-Z0-9_-]+$/;

const shortenRequestSchema = z.object({
	url: z.url().max(2048),
	expiresIn: z.number().positive().max(31536000).optional(), // max 1 year in seconds
	customCode: z.string().min(3).max(50).regex(CUSTOM_CODE_REGEX).optional()
});

export const POST: RequestHandler = async ({ platform, request, locals }) => {
	// Parse JSON body safely
	const parsedBody = await parseJsonBody(request);
	if ('response' in parsedBody) {
		return parsedBody.response;
	}

	// Validate with Zod
	const parsed = shortenRequestSchema.safeParse(parsedBody.data);
	if (!parsed.success) {
		return validationError(parsed.error);
	}

	const { url: originalUrl, expiresIn, customCode } = parsed.data;
	const { auth } = locals;
	const expiresAt = expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null;
	const baseUrl = platform?.env?.BASE_URL || new URL(request.url).origin;

	// Custom codes require authentication
	if (customCode && !auth.userId) {
		return jsonError('Authentication required for custom short codes', 401);
	}

	if (!isValidHttpUrl(originalUrl)) {
		return jsonError('Only http/https URLs are allowed', 400);
	}

	// Check rate limit for anonymous users
	if (!auth.userId) {
		const trustForwardedFor = platform?.env?.TRUST_X_FORWARDED_FOR === 'true';
		const ip = getClientIdentifierForRateLimit(request.headers, { trustForwardedFor });

		if (!(await checkAnonymousRateLimit(ip, platform))) {
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
		shortCode = await createShortUrl(normalizedUrl, expiresAt, platform, locals.db, auth.userId, customCode ?? null);
	} catch (err) {
		if (err instanceof ShortCodeConflictError) {
			return jsonError(`Custom code "${customCode}" is already taken`, 409);
		}
		throw err;
	}

	logger.info('shorten.created', {
		shortCode: shortCode.shortCode,
		anonymous: !auth.userId,
		expiresAt: shortCode.expiresAt,
		url: sanitizeUrlForLog(normalizedUrl)
	});
	return json({
		shortUrl: `${baseUrl}/s/${shortCode.shortCode}`,
		originalUrl: normalizedUrl,
		...shortCode,
		expiresAt: shortCode.expiresAt ? new Date(shortCode.expiresAt * 1000).toISOString() : null,
		anonymous: !auth.userId
	});
};
