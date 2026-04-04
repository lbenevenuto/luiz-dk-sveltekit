import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAnalyticsAdapter, getCacheAdapter } from '$lib/adapters/factory';
import { getUrlByShortCode, deleteUrlById } from '$lib/server/db/queries/urls';
import { logger } from '$lib/server/logger';
import { sanitizeUrlForLog } from '$lib/utils/validation';

function trackAnalytics(platform: App.Platform | undefined, request: Request, shortCode: string): void {
	try {
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
}

export const GET: RequestHandler = async ({ platform, params, request, locals }) => {
	const { shortCode } = params;

	// Check cache first for permanent URLs (avoids D1 query)
	const cacheAdapter = await getCacheAdapter(platform);
	const cachedUrl = cacheAdapter ? await cacheAdapter.get(`redirect:${shortCode}`) : null;
	if (cachedUrl) {
		trackAnalytics(platform, request, shortCode);
		logger.info('redirect.cache_hit', { shortCode, target: sanitizeUrlForLog(cachedUrl) });
		throw redirect(302, cachedUrl);
	}

	const res = await getUrlByShortCode(locals.db, shortCode);
	if (res) {
		const expiresAtMs = res.expiresAt ? res.expiresAt.getTime() : null;
		if (expiresAtMs && expiresAtMs <= Date.now()) {
			await deleteUrlById(locals.db, res.id);
			if (cacheAdapter) await cacheAdapter.delete(`redirect:${shortCode}`);
			logger.warn('redirect.expired', { shortCode });
			return new Response('This link has expired.', { status: 410 });
		}

		trackAnalytics(platform, request, shortCode);
		logger.info('redirect.found', { shortCode, target: sanitizeUrlForLog(res.originalUrl) });
		throw redirect(302, res.originalUrl);
	}

	logger.warn('redirect.not_found', { shortCode });
	throw redirect(302, 'https://luiz.dk');
};
