import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { fetchAnalytics } from '$lib/server/analytics';
import { getUserUrls } from '$lib/server/db/queries/urls';
import { logger } from '$lib/server/logger';

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	if (!locals.auth.userId) {
		throw redirect(302, '/login');
	}

	const daysParam = url.searchParams.get('days');
	let days = daysParam ? parseInt(daysParam) : 7;
	if (isNaN(days) || ![7, 30, 90, 180].includes(days)) {
		days = 7;
	}

	let userShortCodes: string[] = [];
	try {
		const userUrls = await getUserUrls(locals.db, locals.auth.userId);
		userShortCodes = userUrls.map((u) => u.shortCode);
	} catch (error) {
		logger.error('dashboard.user_urls_fetch_error', {
			error: error instanceof Error ? error.message : String(error)
		});
	}

	return {
		streamed: {
			analytics: fetchAnalytics(platform, {
				days,
				shortCodes: userShortCodes
			})
		},
		days
	};
};
