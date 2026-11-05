import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { fetchChartAnalytics } from '$lib/server/analytics';
import { getUserUrls } from '$lib/server/db/queries/urls';
import { logger } from '$lib/server/logger';
import { getErrorMessage } from '$lib/utils/validation';
import { lenientDaysSchema } from '$lib/server/validation-schemas';

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	if (!locals.auth.userId) {
		throw redirect(302, '/login');
	}

	const days = lenientDaysSchema.parse(url.searchParams.get('days'));

	let userShortCodes: string[] = [];
	let urlsError: string | undefined;
	try {
		const userUrls = await getUserUrls(locals.db, locals.auth.userId);
		userShortCodes = userUrls.map((u) => u.shortCode);
	} catch (error) {
		logger.error('dashboard.user_urls_fetch_error', {
			error: getErrorMessage(error)
		});
		// Surface the failure instead of rendering it as "no clicks yet".
		urlsError = 'Failed to load your links';
	}

	return {
		streamed: {
			charts: urlsError
				? Promise.resolve({ charts: undefined, error: urlsError })
				: fetchChartAnalytics(platform, { days, shortCodes: userShortCodes })
		},
		days,
		// The activity log is fetched client-side; pin it to this user so admins don't get every link's clicks.
		filterUser: { id: locals.auth.userId }
	};
};
