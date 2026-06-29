import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { fetchAnalyticsLog } from '$lib/server/analytics';
import { getUserUrls } from '$lib/server/db/queries/urls';
import { jsonError } from '$lib/server/responses';
import { daysSchema, pageSizeSchema } from '$lib/utils/validation';
import { z } from 'zod';

const querySchema = z.object({
	days: daysSchema,
	page: z.coerce.number().int().positive().default(1),
	pageSize: pageSizeSchema,
	userId: z.string().optional()
});

export const GET: RequestHandler = async ({ platform, url, locals }) => {
	if (!locals.auth.userId) {
		return jsonError('Unauthorized', 401);
	}

	const parsed = querySchema.safeParse({
		days: url.searchParams.get('days') || 7,
		page: url.searchParams.get('page') || 1,
		pageSize: url.searchParams.get('pageSize') || 10,
		userId: url.searchParams.get('userId') || undefined
	});

	if (!parsed.success) {
		return jsonError('Invalid parameters', 400);
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
