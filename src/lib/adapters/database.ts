/**
 * Database Adapter using Drizzle ORM
 * Works with both D1 and SQLite
 */

import { eq, and, lt, sql } from 'drizzle-orm';
import type { DrizzleClient } from '$lib/server/db/client';
import { urls, rateLimits } from '$lib/server/db/schemas';
import { generateShortCode } from '$lib/utils/hashids';
import type { IdGeneratorAdapter } from './id-generator';
import type { Url } from '$lib/server/db/schemas';

export interface DatabaseAdapter {
	createShortUrl(
		url: string,
		expiresAt: number | null,
		cache?: CacheAdapter | null
	): Promise<{ shortCode: string; url: string; isExisting: boolean }>;
	getOriginalUrl(shortCode: string): Promise<{ url: string; expired: boolean } | null>;
	incrementClicks(shortCode: string): Promise<void>;
	getUrlStats(shortCode: string): Promise<Url | null>;
	deleteExpiredUrls(): Promise<number>;
	checkRateLimit(ipHash: string, limit: number): Promise<{ allowed: boolean; remaining: number }>;
	cleanupRateLimits(): Promise<void>;
}

// Import CacheAdapter type
import type { CacheAdapter } from './cache';

export class DrizzleAdapter implements DatabaseAdapter {
	constructor(
		private db: DrizzleClient,
		private salt: string,
		private idGenerator?: IdGeneratorAdapter
	) {}

	async createShortUrl(
		url: string,
		expiresAt: number | null,
		cache?: CacheAdapter | null
	): Promise<{ shortCode: string; url: string; isExisting: boolean }> {
		// Generate cache key from URL
		const cacheKey = `url:${url}`;

		// Step 1: Check cache first (fastest path)
		if (cache) {
			const cachedShortCode = await cache.get(cacheKey);
			if (cachedShortCode) {
				// Cache hit! Return immediately without DB query
				return {
					shortCode: cachedShortCode,
					url,
					isExisting: true
				};
			}
		}

		// Step 2: Cache miss - check database
		const existing = await this.db
			.select({
				shortCode: urls.shortCode,
				expiresAt: urls.expiresAt
			})
			.from(urls)
			.where(eq(urls.originalUrl, url))
			.limit(1);

		if (existing.length > 0) {
			const existingUrl = existing[0];

			// Check if expired
			const now = new Date();
			const isExpired = existingUrl.expiresAt !== null && existingUrl.expiresAt < now;

			if (!isExpired) {
				// URL exists and not expired - cache it and return
				if (cache) {
					// Cache for 7 days (604800 seconds)
					await cache.set(cacheKey, existingUrl.shortCode, 604800);
				}

				return {
					shortCode: existingUrl.shortCode,
					url,
					isExisting: true
				};
			}
			// If expired, continue to create new one
		}

		// Step 3: URL doesn't exist or is expired - create new short code
		if (!this.idGenerator) {
			throw new Error('ID generator not available');
		}

		let shortCode: string;
		let attempts = 0;
		const maxAttempts = 10;

		while (attempts < maxAttempts) {
			const id = await this.idGenerator.getNextId();
			shortCode = generateShortCode(id, this.salt, 5);

			// Check if short code exists
			const codeExists = await this.db.select().from(urls).where(eq(urls.shortCode, shortCode)).limit(1);

			if (codeExists.length === 0) break;
			attempts++;
		}

		if (attempts >= maxAttempts) {
			throw new Error('Failed to generate unique short code');
		}

		// Step 4: Insert into database
		await this.db.insert(urls).values({
			shortCode,
			originalUrl: url,
			expiresAt: expiresAt ? new Date(expiresAt * 1000) : null
		});

		// Step 5: Cache the new mapping (only if not expiring)
		if (cache && !expiresAt) {
			// Cache for 7 days for non-expiring URLs
			await cache.set(cacheKey, shortCode, 604800);
		}

		return {
			shortCode,
			url,
			isExisting: false
		};
	}

	async getOriginalUrl(shortCode: string): Promise<{ url: string; expired: boolean } | null> {
		const result = await this.db
			.select({
				originalUrl: urls.originalUrl,
				expiresAt: urls.expiresAt
			})
			.from(urls)
			.where(eq(urls.shortCode, shortCode))
			.limit(1);

		if (result.length === 0) return null;

		const row = result[0];
		const now = new Date();
		const expired = row.expiresAt !== null && row.expiresAt < now;

		return {
			url: row.originalUrl,
			expired
		};
	}

	async incrementClicks(shortCode: string): Promise<void> {
		await this.db
			.update(urls)
			.set({
				clicks: sql`${urls.clicks} + 1`,
				lastAccessedAt: new Date()
			})
			.where(eq(urls.shortCode, shortCode));
	}

	async getUrlStats(shortCode: string): Promise<Url | null> {
		const result = await this.db.select().from(urls).where(eq(urls.shortCode, shortCode)).limit(1);

		return result.length > 0 ? result[0] : null;
	}

	async deleteExpiredUrls(): Promise<number> {
		const now = new Date();
		const result = await this.db.delete(urls).where(and(sql`${urls.expiresAt} IS NOT NULL`, lt(urls.expiresAt, now)));

		// D1 returns changes in result, SQLite in result.changes
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (result as any).changes ?? (result as any).rowsAffected ?? 0;
	}

	async checkRateLimit(ipHash: string, limit: number): Promise<{ allowed: boolean; remaining: number }> {
		const now = Math.floor(Date.now() / 1000);
		const windowStart = Math.floor(now / 60) * 60;

		// Try to get existing record
		const existing = await this.db
			.select()
			.from(rateLimits)
			.where(and(eq(rateLimits.ipHash, ipHash), eq(rateLimits.windowStart, windowStart)))
			.limit(1);

		if (existing.length === 0) {
			// First request - insert
			await this.db.insert(rateLimits).values({
				ipHash,
				requests: 1,
				windowStart
			});

			return { allowed: true, remaining: limit - 1 };
		}

		const record = existing[0];

		if (record.requests >= limit) {
			return { allowed: false, remaining: 0 };
		}

		// Increment
		await this.db
			.update(rateLimits)
			.set({
				requests: sql`${rateLimits.requests} + 1`
			})
			.where(and(eq(rateLimits.ipHash, ipHash), eq(rateLimits.windowStart, windowStart)));

		return { allowed: true, remaining: limit - record.requests - 1 };
	}

	async cleanupRateLimits(): Promise<void> {
		const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
		await this.db.delete(rateLimits).where(lt(rateLimits.windowStart, oneHourAgo));
	}
}
