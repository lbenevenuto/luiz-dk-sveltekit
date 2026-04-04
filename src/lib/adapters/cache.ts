/**
 * Cache Adapters
 * KV for production, Redis for local development
 */

import type Redis from 'ioredis';
import { logger } from '$lib/server/logger';

export interface CacheAdapter {
	get(key: string): Promise<string | null>;
	set(key: string, value: string, ttl?: number): Promise<void>;
	delete(key: string): Promise<void>;
}

/**
 * In-memory Cache Adapter (Local Development Fallback)
 */
export class InMemoryCacheAdapter implements CacheAdapter {
	private store = new Map<string, { value: string; expiresAt: number | null }>();

	async get(key: string): Promise<string | null> {
		const entry = this.store.get(key);
		if (!entry) return null;

		if (entry.expiresAt && entry.expiresAt <= Date.now()) {
			this.store.delete(key);
			return null;
		}
		return entry.value;
	}

	async set(key: string, value: string, ttl: number = 86400): Promise<void> {
		const expiresAt = ttl ? Date.now() + ttl * 1000 : null;
		this.store.set(key, { value, expiresAt });
	}

	async delete(key: string): Promise<void> {
		this.store.delete(key);
	}
}

/**
 * KV Cache Adapter (Cloudflare Production)
 */
export class KVAdapter implements CacheAdapter {
	constructor(private kv: KVNamespace) {}

	async get(key: string): Promise<string | null> {
		try {
			return await this.kv.get(key);
		} catch (error) {
			logger.error('cache.kv.get_failed', { key, error: error instanceof Error ? error.message : String(error) });
			return null;
		}
	}

	async set(key: string, value: string, ttl: number = 86400): Promise<void> {
		try {
			await this.kv.put(key, value, {
				expirationTtl: ttl
			});
		} catch (error) {
			logger.error('cache.kv.set_failed', { key, error: error instanceof Error ? error.message : String(error) });
		}
	}

	async delete(key: string): Promise<void> {
		try {
			await this.kv.delete(key);
		} catch (error) {
			logger.error('cache.kv.delete_failed', { key, error: error instanceof Error ? error.message : String(error) });
		}
	}
}

/**
 * Redis Cache Adapter (Local Development)
 */
export class RedisAdapter implements CacheAdapter {
	constructor(private redis: Redis) {}

	async get(key: string): Promise<string | null> {
		try {
			return await this.redis.get(key);
		} catch (error) {
			logger.error('cache.redis.get_failed', { key, error: error instanceof Error ? error.message : String(error) });
			return null;
		}
	}

	async set(key: string, value: string, ttl: number = 86400): Promise<void> {
		try {
			await this.redis.setex(key, ttl, value);
		} catch (error) {
			logger.error('cache.redis.set_failed', { key, error: error instanceof Error ? error.message : String(error) });
		}
	}

	async delete(key: string): Promise<void> {
		try {
			await this.redis.del(key);
		} catch (error) {
			logger.error('cache.redis.delete_failed', { key, error: error instanceof Error ? error.message : String(error) });
		}
	}
}
