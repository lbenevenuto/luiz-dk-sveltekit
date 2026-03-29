import { eq, and, isNull, isNotNull } from 'drizzle-orm';
import { urls } from '../schemas';
import type { Url } from '../schemas';
import type { DrizzleClient } from '../client';

export async function getUserUrls(db: DrizzleClient, userId: string): Promise<Url[]> {
	return await db.select().from(urls).where(eq(urls.userId, userId));
}

export async function getUrlByShortCode(db: DrizzleClient, shortCode: string): Promise<Url | undefined> {
	const res = await db.select().from(urls).where(eq(urls.shortCode, shortCode));
	return res[0] || undefined;
}

export async function deleteUrlById(db: DrizzleClient, id: number) {
	return await db.delete(urls).where(eq(urls.id, id));
}

export async function checkCustomCodeConflict(db: DrizzleClient, customCode: string): Promise<Url | undefined> {
	const res = await db.select().from(urls).where(eq(urls.shortCode, customCode));
	return res[0] || undefined;
}

export async function insertUrl(
	db: DrizzleClient,
	values: { shortCode: string; originalUrl: string; userId: string | null; expiresAt: Date | null }
) {
	return await db.insert(urls).values(values);
}

export async function findExistingUserUrlExpiring(
	db: DrizzleClient,
	originalUrl: string,
	userId: string
): Promise<Url | undefined> {
	const res = await db
		.select()
		.from(urls)
		.where(and(eq(urls.originalUrl, originalUrl), isNotNull(urls.expiresAt), eq(urls.userId, userId)));
	return res[0] || undefined;
}

export async function findExistingUserUrlPermanent(
	db: DrizzleClient,
	originalUrl: string,
	userId: string
): Promise<Url | undefined> {
	const res = await db
		.select()
		.from(urls)
		.where(and(eq(urls.originalUrl, originalUrl), isNull(urls.expiresAt), eq(urls.userId, userId)));
	return res[0] || undefined;
}

export async function findExistingGlobalUrlExpiring(db: DrizzleClient, originalUrl: string): Promise<Url | undefined> {
	const res = await db
		.select()
		.from(urls)
		.where(and(eq(urls.originalUrl, originalUrl), isNotNull(urls.expiresAt), isNull(urls.userId)));
	return res[0] || undefined;
}

export async function findExistingGlobalUrlPermanent(db: DrizzleClient, originalUrl: string): Promise<Url | undefined> {
	const res = await db
		.select()
		.from(urls)
		.where(and(eq(urls.originalUrl, originalUrl), isNull(urls.expiresAt), isNull(urls.userId)));
	return res[0] || undefined;
}
