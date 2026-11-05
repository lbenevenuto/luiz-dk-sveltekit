import { describe, it, expect, vi } from 'vitest';
import { SqliteIdGenerator, DurableObjectIdGenerator } from './id-generator';

describe('SqliteIdGenerator', () => {
	it('should start at 1 on an empty table', async () => {
		const generator = new SqliteIdGenerator(async () => null);
		expect(await generator.getNextId()).toBe(1);
	});

	it('should continue after the highest existing id', async () => {
		const generator = new SqliteIdGenerator(async () => 41);
		expect(await generator.getNextId()).toBe(42);
	});

	it('should hand out a new id on retry when the max id has not moved', async () => {
		const generator = new SqliteIdGenerator(async () => 1);
		expect([await generator.getNextId(), await generator.getNextId()]).toEqual([2, 3]);
	});
});

describe('DurableObjectIdGenerator', () => {
	it('should call nextValue on the counter', async () => {
		const counter = { nextValue: vi.fn().mockResolvedValue(123) };

		const generator = new DurableObjectIdGenerator(counter);

		expect(await generator.getNextId()).toBe(123);
		expect(counter.nextValue).toHaveBeenCalled();
	});
});
