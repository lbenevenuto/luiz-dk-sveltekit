import type { PageServerLoad } from './$types';
import { getClerkClient } from '$lib/server/clerk';
import { urls } from '$lib/server/db/schemas';
import { eq } from 'drizzle-orm';
import { fetchAnalytics } from '$lib/server/analytics';
import { logger } from '$lib/server/logger';

export const load: PageServerLoad = async ({ platform, url }) => {
	const daysParam = url.searchParams.get('days');
	let days = daysParam ? parseInt(daysParam) : 7;
	if (isNaN(days) || ![7, 30, 90].includes(days)) {
		days = 7;
	}

	const userId = url.searchParams.get('userId');
	let filterUser = null;
	let userShortCodes: string[] | undefined = undefined;

	if (userId && platform) {
		try {
			const clerkClient = getClerkClient(platform.env);
			filterUser = await clerkClient.users.getUser(userId);

			// Fetch user's shortcodes
			const { getDb } = await import('$lib/server/db');
			const db = await getDb(platform);
			const userUrls = await db.select().from(urls).where(eq(urls.userId, userId));
			userShortCodes = userUrls.map((u) => u.shortCode);
		} catch (error) {
			logger.error('admin.analytics.user_filter_fetch_error', {
				error: error instanceof Error ? error.message : String(error),
				userId
			});
		}
	}

	return {
		streamed: {
			analytics: fetchAnalytics(platform, {
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
