import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { urls } from '$lib/server/db/schemas';
import { logger } from '$lib/server/logger';

export const GET: RequestHandler = async ({ platform, params, request }) => {
	const { shortCode } = params;

	const db = await getDb(platform);
	const res = await db.query.urls.findFirst({ where: eq(urls.shortCode, shortCode) });
	if (res) {
		const expiresAtMs =
			res.expiresAt instanceof Date ? res.expiresAt.getTime() : res.expiresAt ? res.expiresAt * 1000 : null;
		if (expiresAtMs && expiresAtMs <= Date.now()) {
			await db.delete(urls).where(eq(urls.id, res.id));
			logger.warn('redirect.expired', { shortCode });
			return new Response('This link has expired.', { status: 410 });
		}

		// Track analytics (fire and forget)
		try {
			const { getAnalyticsAdapter } = await import('$lib/adapters/factory');
			const analytics = getAnalyticsAdapter(platform);
			if (analytics) {
				const userAgent = request.headers.get('user-agent') || 'unknown';
				const referrer = request.headers.get('referer') || 'direct';
				const country = platform?.cf?.country || 'unknown';
				const ipHash = platform?.cf?.colo || 'unknown'; // Using colo as proxy for IP hash for privacy

				platform?.ctx.waitUntil(
					analytics.trackRedirect(shortCode, {
						ipHash,
						userAgent,
						referrer,
						country
					})
				);
			}
		} catch (err) {
			logger.error('redirect.analytics_error', { shortCode, error: err instanceof Error ? err.message : String(err) });
		}

		logger.info('redirect.found', { shortCode, target: res.originalUrl });
		throw redirect(302, res.originalUrl);
	}

	logger.warn('redirect.not_found', { shortCode });
	throw redirect(302, 'https://luiz.dk');
};
