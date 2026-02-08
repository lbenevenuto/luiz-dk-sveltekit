import { getDatabaseAdapter } from '$lib/adapters/factory';
import { urls } from '$lib/server/db/schemas';
import { and, isNotNull, lt } from 'drizzle-orm';

export async function cleanupExpiredUrls(platform: Readonly<App.Platform> | undefined): Promise<void> {
	const db = await getDatabaseAdapter(platform);
	const now = new Date();
	await db.delete(urls).where(and(isNotNull(urls.expiresAt), lt(urls.expiresAt, now)));
}
