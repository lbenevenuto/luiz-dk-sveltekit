import type { PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { getClerkClient } from '$lib/server/clerk';
import { logger } from '$lib/server/logger';
import { searchUrls } from '$lib/server/db/queries/urls';
import { pageSizeSchema } from '$lib/server/validation-schemas';
import { DEFAULT_PAGE_SIZE } from '$lib/utils/constants';
import { getErrorMessage } from '$lib/utils/validation';
import { z } from 'zod';

const searchParamsSchema = z.object({
	q: z.string().optional(),
	userId: z.string().optional(),
	anonymous: z.enum(['true']).optional(),
	page: z.coerce.number().int().positive().optional(),
	pageSize: pageSizeSchema.optional()
});

interface Owner {
	name: string;
	// Only set when `name` is the person's name, to tell same-named accounts apart.
	email?: string;
}

/** Map Clerk user ids to readable owners. Fails open: unknown ids fall back to the raw id in the UI. */
async function getOwners(platform: App.Platform | undefined, ids: string[]): Promise<Record<string, Owner>> {
	if (!platform || ids.length === 0) return {};
	try {
		const { data } = await getClerkClient(platform.env).users.getUserList({ userId: ids, limit: ids.length });
		return Object.fromEntries(
			data.map((user) => {
				const email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress;
				const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
				const owner: Owner = fullName ? { name: fullName, email } : { name: email ?? user.id };
				return [user.id, owner];
			})
		);
	} catch (error) {
		logger.error('admin.urls.owner_lookup_failed', { error: getErrorMessage(error) });
		return {};
	}
}

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
