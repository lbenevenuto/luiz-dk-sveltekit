/**
 * ID Generator Adapters
 * Provides unique, sequential IDs starting at 1
 */

import type { GlobalCounterDurableObject } from '../../app';

export interface IdGeneratorAdapter {
	getNextId(): Promise<number>;
}

export class InMemoryIdGenerator implements IdGeneratorAdapter {
	private counter = 0;

	async getNextId(): Promise<number> {
		this.counter += 1;
		return this.counter;
	}
}

export class DurableObjectIdGenerator implements IdGeneratorAdapter {
	constructor(private idGeneratorStub: DurableObjectStub<GlobalCounterDurableObject>) {}

	async getNextId(): Promise<number> {
		return this.idGeneratorStub.nextValue();
	}
}
