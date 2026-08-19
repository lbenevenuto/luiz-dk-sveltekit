import type { PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { getClerkClient } from '$lib/server/clerk';
import { fetchChartAnalytics } from '$lib/server/analytics';
import { getUserUrls } from '$lib/server/db/queries/urls';
import { logger } from '$lib/server/logger';
import { getErrorMessage } from '$lib/utils/validation';
import { lenientDaysSchema } from '$lib/server/validation-schemas';

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	requireAdmin(locals);
	const days = lenientDaysSchema.parse(url.searchParams.get('days'));

	const userId = url.searchParams.get('userId');
	let filterUser = null;
	let userShortCodes: string[] | undefined = undefined;

	if (userId && platform) {
		try {
			const clerkClient = getClerkClient(platform.env);
			filterUser = await clerkClient.users.getUser(userId);

			const userUrls = await getUserUrls(locals.db, userId);
			userShortCodes = userUrls.map((u) => u.shortCode);
		} catch (error) {
			logger.error('admin.analytics.user_filter_fetch_error', {
				error: getErrorMessage(error),
				userId
			});
		}
	}

	return {
		streamed: {
			charts: fetchChartAnalytics(platform, {
				days,
				shortCodes: userShortCodes
			})
		},
		days,
		filterUser: filterUser
			? {
					id: filterUser.id,
					firstName: filterUser.firstName,
					lastName: filterUser.lastName,
					emailAddresses: filterUser.emailAddresses.map((email) => ({
						emailAddress: email.emailAddress
					}))
				}
			: null
	};
};
