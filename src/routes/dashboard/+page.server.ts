import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { fetchChartAnalytics } from '$lib/server/analytics';
import { getUserUrls } from '$lib/server/db/queries/urls';
import { logger } from '$lib/server/logger';
import { getErrorMessage, parseDaysParam } from '$lib/utils/validation';

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	if (!locals.auth.userId) {
		throw redirect(302, '/login');
	}

	const days = parseDaysParam(url.searchParams.get('days'));

	let userShortCodes: string[] = [];
	try {
		const userUrls = await getUserUrls(locals.db, locals.auth.userId);
		userShortCodes = userUrls.map((u) => u.shortCode);
	} catch (error) {
		logger.error('dashboard.user_urls_fetch_error', {
			error: getErrorMessage(error)
		});
	}

	return {
		streamed: {
			charts: fetchChartAnalytics(platform, {
				days,
				shortCodes: userShortCodes
			})
		},
		days
	};
};
