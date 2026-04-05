import type { PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { searchUrls } from '$lib/server/db/queries/urls';
import { z } from 'zod';

const ALLOWED_PAGE_SIZES = [5, 10, 50, 100] as const;

const searchParamsSchema = z.object({
	q: z.string().optional(),
	userId: z.string().optional(),
	anonymous: z.enum(['true']).optional(),
	page: z.coerce.number().int().positive().optional(),
	pageSize: z.coerce
		.number()
		.int()
		.refine((v) => (ALLOWED_PAGE_SIZES as readonly number[]).includes(v))
		.optional()
});

export const load: PageServerLoad = async ({ url, locals }) => {
	requireAdmin(locals);

	const parsed = searchParamsSchema.safeParse({
		q: url.searchParams.get('q') || undefined,
		userId: url.searchParams.get('userId') || undefined,
		anonymous: url.searchParams.get('anonymous') || undefined,
		page: url.searchParams.get('page') || undefined,
		pageSize: url.searchParams.get('pageSize') || undefined
	});

	const params = parsed.success ? parsed.data : {};

	let userIdFilter: string | null | undefined;
	if (params.anonymous === 'true') {
		userIdFilter = null;
	} else if (params.userId) {
		userIdFilter = params.userId;
	}

	const pageSize = params.pageSize ?? 10;

	const result = await searchUrls(locals.db, {
		query: params.q,
		userId: userIdFilter,
		page: params.page ?? 1,
		pageSize
	});

	return {
		...result,
		q: params.q ?? '',
		userIdFilter: params.userId ?? '',
		anonymous: params.anonymous === 'true'
	};
};
