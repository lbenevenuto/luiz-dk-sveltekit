import { getCacheAdapter, getIdGeneratorAdapter } from '$lib/adapters/factory';
import { generateShortCode } from './hashids';
import type { DrizzleClient } from '$lib/server/db/client';

import {
	checkCustomCodeConflict,
	insertUrl,
	findExistingUserUrlExpiring,
	findExistingUserUrlPermanent,
	findExistingGlobalUrlExpiring,
	findExistingGlobalUrlPermanent
} from '$lib/server/db/queries/urls';

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

export const createShortUrl = async (
	url: string,
	expiresAt: number | null,
	platform: Readonly<App.Platform> | undefined,
	db: DrizzleClient,
	userId: string | null = null,
	customCode: string | null = null
): Promise<CreateShortUrlResult> => {
	const normalizedUrl = normalizeUrl(url);

	const expiresAtDate = expiresAt ? new Date(expiresAt * 1000) : null;

	if (customCode) {
		const existing = await checkCustomCodeConflict(db, customCode);

		if (existing) {
			throw new ShortCodeConflictError(customCode);
		}

		await insertUrl(db, {
			shortCode: customCode,
			originalUrl: normalizedUrl,
			userId,
			expiresAt: expiresAtDate
		});

		return { shortCode: customCode, isExisting: false, expiresAt: expiresAt ?? null };
	}

	const cacheKey = expiresAt ? `url:${normalizedUrl}:exp:${expiresAt}` : `url:${normalizedUrl}:permanent`;
	const hashSalt = platform?.env?.SALT || 'abd';

	const cacheAdapter = await getCacheAdapter(platform);
	if (cacheAdapter && !expiresAt) {
		const cachedCode = await cacheAdapter.get(cacheKey);
		if (cachedCode) {
			return { shortCode: cachedCode, isExisting: true, expiresAt: null };
		}
	}

	const wantsExpiry = Boolean(expiresAt);

	let existingForUser;
	if (userId) {
		existingForUser = wantsExpiry
			? await findExistingUserUrlExpiring(db, normalizedUrl, userId)
			: await findExistingUserUrlPermanent(db, normalizedUrl, userId);
	}

	let existingGlobal;
	if (existingForUser === undefined) {
		existingGlobal = wantsExpiry
			? await findExistingGlobalUrlExpiring(db, normalizedUrl)
			: await findExistingGlobalUrlPermanent(db, normalizedUrl);
	}

	const existing = existingForUser || existingGlobal;

	if (existing) {
		const nowSeconds = Math.floor(Date.now() / 1000);
		const existingExpiresAtSeconds =
			existing.expiresAt instanceof Date
				? Math.floor(existing.expiresAt.getTime() / 1000)
				: (existing.expiresAt ?? null);
		const isExpired = existingExpiresAtSeconds !== null && existingExpiresAtSeconds <= nowSeconds;

		if (!isExpired) {
			if (cacheAdapter && !existingExpiresAtSeconds) {
				await cacheAdapter.set(cacheKey, existing.shortCode, 604800); // 7 days
			}
			return { shortCode: existing.shortCode, isExisting: true, expiresAt: existingExpiresAtSeconds };
		}
	}

	const idGeneratorAdapter = await getIdGeneratorAdapter(platform);
	const newCount = await idGeneratorAdapter.getNextId();
	const shortCode = generateShortCode(newCount, hashSalt);

	await insertUrl(db, {
		shortCode,
		originalUrl: normalizedUrl,
		userId,
		expiresAt: expiresAtDate
	});

	if (cacheAdapter && !expiresAt) {
		await cacheAdapter.set(cacheKey, shortCode, 604800); // 7 days
	}

	return { shortCode, isExisting: false, expiresAt: expiresAt ?? null };
};
