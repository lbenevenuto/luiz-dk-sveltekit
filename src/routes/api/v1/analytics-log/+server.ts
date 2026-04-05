import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchAnalyticsLog } from '$lib/server/analytics';
import { getUserUrls } from '$lib/server/db/queries/urls';
import { z } from 'zod';

const ALLOWED_DAYS = [7, 30, 90, 180];
const ALLOWED_PAGE_SIZES = [5, 10, 50, 100];

const querySchema = z.object({
	days: z.coerce
		.number()
		.int()
		.refine((v) => ALLOWED_DAYS.includes(v))
		.default(7),
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce
		.number()
		.int()
		.refine((v) => ALLOWED_PAGE_SIZES.includes(v))
		.default(10),
	userId: z.string().optional()
});

export const GET: RequestHandler = async ({ platform, url, locals }) => {
	if (!locals.auth.userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const parsed = querySchema.safeParse({
		days: url.searchParams.get('days') || 7,
		page: url.searchParams.get('page') || 1,
		pageSize: url.searchParams.get('pageSize') || 10,
		userId: url.searchParams.get('userId') || undefined
	});

	if (!parsed.success) {
		return json({ error: 'Invalid parameters' }, { status: 400 });
	}

	const { days, page, pageSize, userId } = parsed.data;

	// Determine which short codes to filter by
	let shortCodes: string[] | undefined;

	if (locals.auth.role === 'admin' && userId) {
		// Admin filtering by specific user
		const userUrls = await getUserUrls(locals.db, userId);
		shortCodes = userUrls.map((u) => u.shortCode);
	} else if (locals.auth.role !== 'admin') {
		// Non-admin: only their own URLs
		const userUrls = await getUserUrls(locals.db, locals.auth.userId);
		shortCodes = userUrls.map((u) => u.shortCode);
	}
	// Admin with no userId filter: shortCodes stays undefined (all URLs)

	const result = await fetchAnalyticsLog(platform, { days, page, pageSize, shortCodes });

	return json(result);
};
