import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { urls } from '$lib/server/db/schemas';

export const GET: RequestHandler = async ({ platform, params, request }) => {
	console.log('GET');

	const { shortCode } = params;

	const db = await getDb(platform);
	const res = await db.query.urls.findFirst({ where: eq(urls.shortCode, shortCode) });
	if (res) {
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
			console.error('Failed to track analytics:', err);
		}

		throw redirect(302, res.originalUrl);
	}

	throw redirect(302, 'https://luiz.dk');
};
