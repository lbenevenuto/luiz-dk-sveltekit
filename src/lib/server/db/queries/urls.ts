import { eq, and, isNull, isNotNull, desc, sql } from 'drizzle-orm';
import { urls } from '../schemas';
import type { Url } from '../schemas';
import type { DrizzleClient } from '../client';

interface SearchUrlsParams {
	query?: string;
	userId?: string | null;
	page?: number;
	pageSize?: number;
}

interface SearchUrlsResult {
	urls: Url[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export async function searchUrls(db: DrizzleClient, params: SearchUrlsParams): Promise<SearchUrlsResult> {
	const page = params.page ?? 1;
	const pageSize = params.pageSize ?? 25;
	const offset = (page - 1) * pageSize;

	const conditions = [];

	if (params.query) {
		const pattern = `%${params.query}%`;
		conditions.push(sql`(${urls.shortCode} LIKE ${pattern} OR ${urls.originalUrl} LIKE ${pattern})`);
	}

	if (params.userId === null) {
		conditions.push(isNull(urls.userId));
	} else if (params.userId) {
		conditions.push(eq(urls.userId, params.userId));
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const [results, countResult] = await Promise.all([
		db.select().from(urls).where(whereClause).orderBy(desc(urls.createdAt)).limit(pageSize).offset(offset),
		db
			.select({ count: sql<number>`count(*)` })
			.from(urls)
			.where(whereClause)
	]);

	const total = countResult[0]?.count ?? 0;

	return {
		urls: results,
		total,
		page,
		pageSize,
		totalPages: Math.ceil(total / pageSize)
	};
}

export async function getUserUrls(db: DrizzleClient, userId: string): Promise<Url[]> {
	return db.select().from(urls).where(eq(urls.userId, userId));
}

export async function getUrlByShortCode(db: DrizzleClient, shortCode: string): Promise<Url | undefined> {
	const res = await db.select().from(urls).where(eq(urls.shortCode, shortCode));
	return res[0] ?? undefined;
}

export async function deleteUrlById(db: DrizzleClient, id: number) {
	return db.delete(urls).where(eq(urls.id, id));
}

export async function insertUrl(
	db: DrizzleClient,
	values: { shortCode: string; originalUrl: string; userId: string | null; expiresAt: Date | null }
) {
	return db.insert(urls).values(values);
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
	return res[0] ?? undefined;
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
	return res[0] ?? undefined;
}

export async function findExistingGlobalUrlExpiring(db: DrizzleClient, originalUrl: string): Promise<Url | undefined> {
	const res = await db
		.select()
		.from(urls)
		.where(and(eq(urls.originalUrl, originalUrl), isNotNull(urls.expiresAt), isNull(urls.userId)));
	return res[0] ?? undefined;
}

export async function findExistingGlobalUrlPermanent(db: DrizzleClient, originalUrl: string): Promise<Url | undefined> {
	const res = await db
		.select()
		.from(urls)
		.where(and(eq(urls.originalUrl, originalUrl), isNull(urls.expiresAt), isNull(urls.userId)));
	return res[0] ?? undefined;
}
