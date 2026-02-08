/**
 * Adapter Factory
 * Creates appropriate adapters based on environment
 */

import { createD1Client, createSQLiteClient } from '$lib/server/db/client';
import {
	DurableObjectIdGenerator,
	InMemoryIdGenerator,
	type IdGeneratorAdapter,
	RedisIdGenerator
} from './id-generator';
import { InMemoryCacheAdapter, type CacheAdapter, KVAdapter, RedisAdapter } from './cache';
import { type AnalyticsAdapter, CloudflareAnalyticsAdapter, ConsoleAnalyticsAdapter } from './analytics';
import { dev } from '$app/environment';
import Redis from 'ioredis';

let devIdGeneratorAdapter: IdGeneratorAdapter | null = null;
let devCacheAdapter: CacheAdapter | null = null;
let devDatabaseAdapterPromise: ReturnType<typeof createSQLiteClient> | null = null;
let devRedisClient: Redis | null = null;

function getOrCreateDevRedis(): Redis {
	if (!devRedisClient) {
		const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
		devRedisClient = new Redis(redisUrl);
	}

	return devRedisClient;
}

/**
 * Get ID generator adapter
 */
export function getIdGeneratorAdapter(platform: Readonly<App.Platform> | undefined): IdGeneratorAdapter {
	if (dev) {
		if (devIdGeneratorAdapter) {
			return devIdGeneratorAdapter;
		}

		try {
			devIdGeneratorAdapter = new RedisIdGenerator(getOrCreateDevRedis());
		} catch (err) {
			console.warn('Redis unavailable, falling back to in-memory ID generator:', err);
			devIdGeneratorAdapter = new InMemoryIdGenerator();
		}

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
export function getCacheAdapter(platform: Readonly<App.Platform> | undefined): CacheAdapter | null {
	if (dev) {
		if (devCacheAdapter) {
			return devCacheAdapter;
		}

		try {
			devCacheAdapter = new RedisAdapter(getOrCreateDevRedis());
		} catch (err) {
			console.warn('Redis unavailable, using in-memory cache:', err);
			devCacheAdapter = new InMemoryCacheAdapter();
		}

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
