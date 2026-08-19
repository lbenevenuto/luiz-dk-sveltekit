import { describe, it, expect, vi } from 'vitest';
import { SqliteIdGenerator, DurableObjectIdGenerator } from './id-generator';

describe('SqliteIdGenerator', () => {
	function mockDb(rows: Array<{ maxId: number | null }>) {
		return { select: vi.fn(() => ({ from: vi.fn(async () => rows) })) };
	}

	it('should start at 1 on an empty table', async () => {
		// @ts-expect-error - partial mock
		const generator = new SqliteIdGenerator(mockDb([{ maxId: null }]));
		expect(await generator.getNextId()).toBe(1);
	});

	it('should continue after the highest existing id', async () => {
		// @ts-expect-error - partial mock
		const generator = new SqliteIdGenerator(mockDb([{ maxId: 41 }]));
		expect(await generator.getNextId()).toBe(42);
	});
});

describe('DurableObjectIdGenerator', () => {
	it('should call nextValue on the stub', async () => {
		const mockStub = { nextValue: vi.fn().mockResolvedValue(123) };

		// @ts-expect-error - partial mock
		const generator = new DurableObjectIdGenerator(mockStub);

		expect(await generator.getNextId()).toBe(123);
		expect(mockStub.nextValue).toHaveBeenCalled();
	});
});
