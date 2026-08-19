import { urls } from '$lib/server/db/schemas';
import { and, isNotNull, lt } from 'drizzle-orm';
import type { DrizzleClient } from '$lib/server/db/client';

export async function cleanupExpiredUrls(db: DrizzleClient): Promise<void> {
	await db.delete(urls).where(and(isNotNull(urls.expiresAt), lt(urls.expiresAt, new Date())));
}
