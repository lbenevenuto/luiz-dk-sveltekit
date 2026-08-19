/**
 * ID Generator Adapters
 * Provides unique, sequential IDs starting at 1
 */

import { max } from 'drizzle-orm';
import { urls } from '$lib/server/db/schemas';
import type { DrizzleClient } from '$lib/server/db/client';
import type { GlobalCounterDurableObject } from '../../app';

export interface IdGeneratorAdapter {
	getNextId(): Promise<number>;
}

export class DurableObjectIdGenerator implements IdGeneratorAdapter {
	constructor(private idGeneratorStub: DurableObjectStub<GlobalCounterDurableObject>) {}

	async getNextId(): Promise<number> {
		return this.idGeneratorStub.nextValue();
	}
}

/**
 * SQLite ID Generator (Local Development)
 *
 * ponytail: derives the next id from `max(urls.id)`, so deleting the newest row reuses its id
 * and the insert then fails on the unique short code. Dev-only; add a counter table if it bites.
 */
export class SqliteIdGenerator implements IdGeneratorAdapter {
	constructor(private db: DrizzleClient) {}

	async getNextId(): Promise<number> {
		const [row] = await this.db.select({ maxId: max(urls.id) }).from(urls);
		return (row?.maxId ?? 0) + 1;
	}
}
