/**
 * ID Generator Adapters
 * Provides unique, sequential IDs starting at 1
 */

import type { GlobalCounterDurableObject } from '../../app';

export interface IdGeneratorAdapter {
	getNextId(): Promise<number>;
}

export class DurableObjectIdGenerator implements IdGeneratorAdapter {
	constructor(private counter: Pick<GlobalCounterDurableObject, 'nextValue'>) {}

	async getNextId(): Promise<number> {
		return this.counter.nextValue();
	}
}

/**
 * SQLite ID Generator (Local Development)
 *
 * Takes a reader for the highest id currently stored rather than the database itself,
 * so the arithmetic is testable without standing up a Drizzle client.
 *
 * ponytail: deleting the newest row frees its id for reuse, and the following insert then
 * collides on the unique short code. Dev-only; add a counter table if it bites.
 */
export class SqliteIdGenerator implements IdGeneratorAdapter {
	constructor(private readMaxId: () => Promise<number | null>) {}

	async getNextId(): Promise<number> {
		return ((await this.readMaxId()) ?? 0) + 1;
	}
}
