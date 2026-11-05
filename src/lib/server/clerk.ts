import { createClerkClient } from '@clerk/backend';
import { logger } from '$lib/server/logger';
import { getErrorMessage } from '$lib/utils/validation';

export function getClerkClient(env: App.Platform['env']) {
	return createClerkClient({
		secretKey: env.CLERK_SECRET_KEY,
		publishableKey: env.CLERK_PUBLISHABLE_KEY
	});
}

export interface Owner {
	name: string;
	// Only set when `name` is the person's name, to tell same-named accounts apart.
	email?: string;
}

/** Map Clerk user ids to readable owners in one call. Fails open: unknown ids fall back to the raw id in the UI. */
export async function getOwners(platform: App.Platform | undefined, ids: string[]): Promise<Record<string, Owner>> {
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
		logger.error('clerk.owner_lookup_failed', { error: getErrorMessage(error) });
		return {};
	}
}
