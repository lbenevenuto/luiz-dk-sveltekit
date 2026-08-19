/**
 * Adapter Factory
 * Creates appropriate adapters based on environment
 */

import { max } from 'drizzle-orm';
import { createD1Client, createSQLiteClient, type DrizzleClient } from '$lib/server/db/client';
import { urls } from '$lib/server/db/schemas';
import { DurableObjectIdGenerator, SqliteIdGenerator, type IdGeneratorAdapter } from './id-generator';
import { InMemoryCacheAdapter, type CacheAdapter, KVAdapter } from './cache';
import { type AnalyticsAdapter, CloudflareAnalyticsAdapter, ConsoleAnalyticsAdapter } from './analytics';
import { dev } from '$app/environment';

let devCacheAdapter: CacheAdapter | null = null;
let devDatabaseAdapterPromise: ReturnType<typeof createSQLiteClient> | null = null;

/**
 * Get ID generator adapter
 */
export async function getIdGeneratorAdapter(
	platform: Readonly<App.Platform> | undefined,
	db: DrizzleClient
): Promise<IdGeneratorAdapter> {
	if (dev) {
		return new SqliteIdGenerator(async () => {
			const [row] = await db.select({ maxId: max(urls.id) }).from(urls);
			return row?.maxId ?? null;
		});
	}

	if (!platform) {
		throw new Error('Platform not found');
	}

	// Production: Use Durable Object
	const id = platform.env.GLOBAL_COUNTER_DO.idFromName('global_counter');
	const stub = platform.env.GLOBAL_COUNTER_DO.get(id);
	return new DurableObjectIdGenerator(stub);
}

/**
 * Get database adapter with Drizzle ORM
 */
export async function getDatabaseAdapter(platform: Readonly<App.Platform> | undefined) {
	if (dev) {
		if (!devDatabaseAdapterPromise) {
			devDatabaseAdapterPromise = createSQLiteClient('./data/local.db');
		}

		return devDatabaseAdapterPromise;
	}

	if (!platform) {
		throw new Error('Platform not found');
	}

	// Production: Use D1 with Drizzle
	return createD1Client(platform.env.DB);
}

/**
 * Get cache adapter
 */
export async function getCacheAdapter(platform: Readonly<App.Platform> | undefined): Promise<CacheAdapter | null> {
	if (dev) {
		devCacheAdapter ??= new InMemoryCacheAdapter();
		return devCacheAdapter;
	}

	if (!platform) {
		throw new Error('Platform not found');
	}
	return new KVAdapter(platform.env.CACHE);
}

/**
 * Get analytics adapter
 */
export function getAnalyticsAdapter(platform: Readonly<App.Platform> | undefined): AnalyticsAdapter {
	if (dev) {
		// Local: Use console
		return new ConsoleAnalyticsAdapter();
	}

	if (!platform) {
		throw new Error('Platform not found');
	}

	// Production: Use Cloudflare Analytics Engine
	if (platform.env.ANALYTICS) {
		return new CloudflareAnalyticsAdapter(platform.env.ANALYTICS);
	}

	// Fallback if analytics binding is missing
	return new ConsoleAnalyticsAdapter();
}
