import type { PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { getOwners } from '$lib/server/clerk';
import { searchUrls } from '$lib/server/db/queries/urls';
import { pageSizeSchema } from '$lib/server/validation-schemas';
import { DEFAULT_PAGE_SIZE } from '$lib/utils/constants';
import { z } from 'zod';

const searchParamsSchema = z.object({
	q: z.string().optional(),
	userId: z.string().optional(),
	anonymous: z.enum(['true']).optional(),
	page: z.coerce.number().int().positive().optional(),
	pageSize: pageSizeSchema.optional()
});

export const load: PageServerLoad = async ({ url, locals, platform }) => {
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

	const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

	const result = await searchUrls(locals.db, {
		query: params.q,
		userId: userIdFilter,
		page: params.page ?? 1,
		pageSize
	});

	const ownerIds = new Set(result.urls.flatMap((u) => (u.userId ? [u.userId] : [])));
	if (params.userId) ownerIds.add(params.userId);

	return {
		...result,
		owners: await getOwners(platform, [...ownerIds]),
		q: params.q ?? '',
		userIdFilter: params.userId ?? '',
		anonymous: params.anonymous === 'true'
	};
};
