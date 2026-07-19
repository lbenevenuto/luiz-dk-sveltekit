/**
 * Adapter Factory
 * Creates appropriate adapters based on environment
 */

import { createD1Client, createSQLiteClient } from '$lib/server/db/client';
import { DurableObjectIdGenerator, InMemoryIdGenerator, type IdGeneratorAdapter } from './id-generator';
import { InMemoryCacheAdapter, type CacheAdapter, KVAdapter } from './cache';
import { dev } from '$app/environment';

let devIdGeneratorAdapter: IdGeneratorAdapter | null = null;
let devCacheAdapter: CacheAdapter | null = null;
let devDatabaseAdapterPromise: ReturnType<typeof createSQLiteClient> | null = null;

/**
 * Get ID generator adapter
 */
export async function getIdGeneratorAdapter(platform: Readonly<App.Platform> | undefined): Promise<IdGeneratorAdapter> {
	if (dev) {
		if (devIdGeneratorAdapter) {
			return devIdGeneratorAdapter;
		}

		devIdGeneratorAdapter = new InMemoryIdGenerator();

		return devIdGeneratorAdapter;
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
			const sqlitePath = './data/local.db';
			devDatabaseAdapterPromise = createSQLiteClient(sqlitePath);
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
		if (devCacheAdapter) {
			return devCacheAdapter;
		}

		devCacheAdapter = new InMemoryCacheAdapter();

		return devCacheAdapter;
	}

	if (!platform) {
		throw new Error('Platform not found');
	}
	return new KVAdapter(platform.env.CACHE);
}
