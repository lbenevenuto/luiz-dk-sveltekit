/**
 * Adapter Factory
 * Creates appropriate adapters based on environment
 */

import { createD1Client, createSQLiteClient } from '$lib/server/db/client';
import { DurableObjectIdGenerator, type IdGeneratorAdapter, RedisIdGenerator } from './id-generator';
import { type CacheAdapter, KVAdapter, RedisAdapter } from './cache';
import { type AnalyticsAdapter, CloudflareAnalyticsAdapter, ConsoleAnalyticsAdapter } from './analytics';
import { dev } from '$app/environment';
import Redis from 'ioredis';

/**
 * Get ID generator adapter
 */
export function getIdGeneratorAdapter(platform: Readonly<App.Platform> | undefined): IdGeneratorAdapter {
	if (dev) {
		// Local: Use Redis
		const redisUrl = 'redis://localhost:6379';
		const redis = new Redis(redisUrl);
		return new RedisIdGenerator(redis);
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
		// Local: Use SQLite with Drizzle
		const sqlitePath = './data/local.db';
		return createSQLiteClient(sqlitePath);
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
		// Local: Use Redis if available
		const redis = new Redis();
		return new RedisAdapter(redis);
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
