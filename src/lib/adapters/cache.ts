/**
 * Cache Adapters
 * KV for production, Redis for local development
 */

import type Redis from 'ioredis';

export interface CacheAdapter {
	get(key: string): Promise<string | null>;
	set(key: string, value: string, ttl?: number): Promise<void>;
	delete(key: string): Promise<void>;
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
			console.error('KV get error:', error);
			return null;
		}
	}

	async set(key: string, value: string, ttl: number = 86400): Promise<void> {
		try {
			await this.kv.put(key, value, {
				expirationTtl: ttl
			});
		} catch (error) {
			console.error('KV set error:', error);
		}
	}

	async delete(key: string): Promise<void> {
		try {
			await this.kv.delete(key);
		} catch (error) {
			console.error('KV delete error:', error);
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
			console.error('Redis get error:', error);
			return null;
		}
	}

	async set(key: string, value: string, ttl: number = 86400): Promise<void> {
		try {
			await this.redis.setex(key, ttl, value);
		} catch (error) {
			console.error('Redis set error:', error);
		}
	}

	async delete(key: string): Promise<void> {
		try {
			await this.redis.del(key);
		} catch (error) {
			console.error('Redis delete error:', error);
		}
	}
}
