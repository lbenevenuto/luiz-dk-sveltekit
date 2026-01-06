/**
 * ID Generator Adapters
 * Provides unique, sequential IDs starting at 1
 */

import type Redis from 'ioredis';
import type { GlobalCounterDurableObject } from '../../app';

export interface IdGeneratorAdapter {
	getNextId(): Promise<number>;
}

export class DurableObjectIdGenerator implements IdGeneratorAdapter {
	constructor(private idGeneratorStub: DurableObjectStub<GlobalCounterDurableObject>) {
		console.log('Constructor called for DurableObjectIdGenerator');
	}

	async getNextId(): Promise<number> {
		return this.idGeneratorStub.nextValue();
	}
}

/**
 * Redis ID Generator (Local Development)
 */
export class RedisIdGenerator implements IdGeneratorAdapter {
	private initialized = false;
	private redis: Redis;

	constructor(redis: Redis) {
		console.log('Constructor called for RedisIdGenerator');
		this.redis = redis;
	}

	async getNextId(): Promise<number> {
		// Initialize counter to 0 on first use (first INCR = 1)
		const key = 'url_shortener:id_counter';
		if (!this.initialized) {
			const exists = await this.redis.exists(key);
			if (!exists) {
				await this.redis.set(key, 0);
			}
			this.initialized = true;
		}

		// Increment and return
		const id = await this.redis.incr(key);
		return id;
	}
}
