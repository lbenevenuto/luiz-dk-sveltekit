import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUrlByShortCode, deleteUrlById } from '$lib/server/db/queries/urls';
import { logger } from '$lib/server/logger';
import { sanitizeUrlForLog } from '$lib/utils/validation';

export const GET: RequestHandler = async ({ platform, params, request, locals }) => {
	const { shortCode } = params;

	const res = await getUrlByShortCode(locals.db, shortCode);
	if (res) {
		const expiresAtMs =
			res.expiresAt instanceof Date ? res.expiresAt.getTime() : res.expiresAt ? res.expiresAt * 1000 : null;
		if (expiresAtMs && expiresAtMs <= Date.now()) {
			await deleteUrlById(locals.db, res.id);
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

		logger.info('redirect.found', { shortCode, target: sanitizeUrlForLog(res.originalUrl) });
		throw redirect(302, res.originalUrl);
	}

	logger.warn('redirect.not_found', { shortCode });
	throw redirect(302, 'https://luiz.dk');
};
