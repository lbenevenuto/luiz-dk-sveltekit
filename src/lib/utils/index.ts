import { getCacheAdapter, getDatabaseAdapter, getIdGeneratorAdapter } from '$lib/adapters/factory';
import { urls } from '$lib/server/db/schemas';
import { generateShortCode } from './hashids';
import { and, eq, isNotNull, isNull, lt } from 'drizzle-orm';

interface CreateShortUrlResult {
	shortCode: string;
	isExisting: boolean;
	// Unix timestamp in seconds when the URL expires, or null for non-expiring links
	expiresAt: number | null;
}

export function normalizeUrl(input: string): string {
	const u = new URL(input.trim());
	u.hash = '';
	u.hostname = u.hostname.toLowerCase();

	if (u.pathname !== '/' && u.pathname.endsWith('/')) {
		u.pathname = u.pathname.slice(0, -1);
	}

	const base = `${u.protocol}//${u.host}`;
	if ((u.pathname === '/' || u.pathname === '') && !u.search) {
		return base;
	}
	return `${base}${u.pathname}${u.search}`;
}

export class ShortCodeConflictError extends Error {
	public readonly shortCode: string;

	constructor(shortCode: string) {
		super(`Short code "${shortCode}" is already taken`);
		this.name = 'ShortCodeConflictError';
		this.shortCode = shortCode;
	}
}

async function purgeExpiredUrls(db: Awaited<ReturnType<typeof getDatabaseAdapter>>) {
	const now = new Date();
	await db.delete(urls).where(and(isNotNull(urls.expiresAt), lt(urls.expiresAt, now)));
}

export const createShortUrl = async (
	url: string,
	expiresAt: number | null,
	platform: Readonly<App.Platform> | undefined,
	userId: string | null = null,
	customCode: string | null = null
): Promise<CreateShortUrlResult> => {
	const normalizedUrl = normalizeUrl(url);
	const db = await getDatabaseAdapter(platform);
	await purgeExpiredUrls(db);

	const expiresAtDate = expiresAt ? new Date(expiresAt * 1000) : null;

	// Custom code path: skip deduplication, check uniqueness, insert directly
	if (customCode) {
		const existing = await db.query.urls.findFirst({
			where: eq(urls.shortCode, customCode)
		});

		if (existing) {
			throw new ShortCodeConflictError(customCode);
		}

		await db.insert(urls).values({
			shortCode: customCode,
			originalUrl: normalizedUrl,
			userId,
			expiresAt: expiresAtDate
		});

		return { shortCode: customCode, isExisting: false, expiresAt: expiresAt ?? null };
	}

	// Auto-generated code path
	const cacheKey = expiresAt ? `url:${normalizedUrl}:exp:${expiresAt}` : `url:${normalizedUrl}:permanent`;
	const hashSalt = platform?.env?.SALT || 'abd';

	// Step 1: Check cache (FASTEST)
	const cacheAdapter = getCacheAdapter(platform);
	if (cacheAdapter && !expiresAt) {
		const cachedCode = await cacheAdapter.get(cacheKey);
		if (cachedCode) {
			// Cache hit! Return immediately
			return { shortCode: cachedCode, isExisting: true, expiresAt: null };
		}
	}

	const wantsExpiry = Boolean(expiresAt);

	// Step 2: Cache miss - check database for a matching entry (expiring vs non-expiring)
	const baseWhere = wantsExpiry ? isNotNull(urls.expiresAt) : isNull(urls.expiresAt);

	const findExisting = async (ownerId: string | null) =>
		db.query.urls.findFirst({
			where: and(
				eq(urls.originalUrl, normalizedUrl),
				baseWhere,
				ownerId ? eq(urls.userId, ownerId) : isNull(urls.userId)
			)
		});

	const existingForUser = await findExisting(userId);
	const existingGlobal = userId ? await findExisting(null) : existingForUser;
	const existing = existingForUser || existingGlobal;

	if (existing) {
		const nowSeconds = Math.floor(Date.now() / 1000);
		const existingExpiresAtSeconds =
			existing.expiresAt instanceof Date
				? Math.floor(existing.expiresAt.getTime() / 1000)
				: (existing.expiresAt ?? null);
		const isExpired = existingExpiresAtSeconds !== null && existingExpiresAtSeconds <= nowSeconds;

		if (!isExpired) {
			// Found in DB - cache it for next time if it doesn't expire
			if (cacheAdapter && !existingExpiresAtSeconds) {
				await cacheAdapter.set(cacheKey, existing.shortCode, 604800); // 7 days
			}
			return { shortCode: existing.shortCode, isExisting: true, expiresAt: existingExpiresAtSeconds };
		}
		// Expired entries fall through to generate a new short code
	}

	// Step 3: Not found - generate new
	const idGeneratorAdapter = getIdGeneratorAdapter(platform);
	const newCount = await idGeneratorAdapter.getNextId();
	const shortCode = generateShortCode(newCount, hashSalt);

	// Insert to DB with user information
	await db.insert(urls).values({
		shortCode,
		originalUrl: normalizedUrl,
		userId,
		expiresAt: expiresAtDate
	});

	// Cache for future requests (only if non-expiring)
	if (cacheAdapter && !expiresAt) {
		await cacheAdapter.set(cacheKey, shortCode, 604800); // 7 days
	}

	return { shortCode, isExisting: false, expiresAt: expiresAt ?? null };
};
