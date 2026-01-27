import { getCacheAdapter, getDatabaseAdapter, getIdGeneratorAdapter } from '$lib/adapters/factory';
import { urls } from '$lib/server/db/schemas';
import { generateShortCode } from './hashids';
import { eq } from 'drizzle-orm';

export const createShortUrl = async (
	url: string,
	expiresAt: number | null,
	platform: Readonly<App.Platform> | undefined,
	userId: string | null = null
) => {
	// Step 1: Check cache (FASTEST)
	const cacheKey = `url:${url}`;
	const cacheAdapter = getCacheAdapter(platform);
	if (cacheAdapter) {
		const cachedCode = await cacheAdapter.get(cacheKey);
		if (cachedCode) {
			// Cache hit! Return immediately
			return { shortCode: cachedCode, isExisting: true };
		}
	}

	const db = await getDatabaseAdapter(platform);

	// Step 2: Cache miss - check database
	const existing = await db.select().from(urls).where(eq(urls.originalUrl, url)).get();

	if (existing) {
		// Found in DB - cache it for next time
		if (cacheAdapter) {
			await cacheAdapter.set(cacheKey, existing.shortCode, 604800); // 7 days
		}
		return { shortCode: existing.shortCode, isExisting: true };
	}

	// Step 3: Not found - generate new
	const idGeneratorAdapter = getIdGeneratorAdapter(platform);
	const newCount = await idGeneratorAdapter.getNextId();
	const shortCode = generateShortCode(newCount, 'abd');

	// Insert to DB with user information
	await db.insert(urls).values({
		shortCode,
		originalUrl: url,
		userId
	});

	// Cache for future requests (only if non-expiring)
	if (cacheAdapter && !expiresAt) {
		await cacheAdapter.set(cacheKey, shortCode, 604800); // 7 days
	}

	return { shortCode, isExisting: false };
};
