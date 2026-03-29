import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DrizzleClient } from '../client';
import {
	getUserUrls,
	getUrlByShortCode,
	deleteUrlById,
	insertUrl,
	findExistingUserUrlPermanent,
	findExistingUserUrlExpiring,
	findExistingGlobalUrlPermanent,
	findExistingGlobalUrlExpiring
} from './urls';

function createChainableMock(resolvedValue?: unknown) {
	const chain = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockResolvedValue(resolvedValue ?? []),
		limit: vi.fn().mockReturnThis(),
		delete: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		values: vi.fn().mockResolvedValue(resolvedValue ?? [])
	};
	return chain;
}

describe('URL Queries DAL', () => {
	let mockChain: ReturnType<typeof createChainableMock>;
	let mockDb: DrizzleClient;

	beforeEach(() => {
		vi.resetAllMocks();
		mockChain = createChainableMock();
		mockDb = mockChain as unknown as DrizzleClient;
	});

	it('getUserUrls queries with user ID', async () => {
		mockChain.where.mockResolvedValueOnce([{ id: 1 }]);
		const result = await getUserUrls(mockDb, 'user123');

		expect(mockChain.select).toHaveBeenCalled();
		expect(mockChain.from).toHaveBeenCalled();
		expect(mockChain.where).toHaveBeenCalled();
		expect(result).toEqual([{ id: 1 }]);
	});

	it('getUrlByShortCode returns first result', async () => {
		mockChain.where.mockResolvedValueOnce([{ id: 1, shortCode: 'abc' }]);
		const result = await getUrlByShortCode(mockDb, 'abc');

		expect(mockChain.select).toHaveBeenCalled();
		expect(mockChain.from).toHaveBeenCalled();
		expect(mockChain.where).toHaveBeenCalled();
		expect(result).toEqual({ id: 1, shortCode: 'abc' });
	});

	it('getUrlByShortCode returns undefined when not found', async () => {
		mockChain.where.mockResolvedValueOnce([]);
		const result = await getUrlByShortCode(mockDb, 'nope');

		expect(result).toBeUndefined();
	});

	it('deleteUrlById deletes by ID', async () => {
		mockChain.where.mockResolvedValueOnce(undefined);
		await deleteUrlById(mockDb, 1);

		expect(mockChain.delete).toHaveBeenCalled();
		expect(mockChain.where).toHaveBeenCalled();
	});

	it('insertUrl inserts values', async () => {
		const newUrl = { shortCode: 'test', originalUrl: 'https://test.com', userId: null, expiresAt: null };
		mockChain.values.mockResolvedValueOnce([{ id: 1, ...newUrl }]);

		const result = await insertUrl(mockDb, newUrl);

		expect(mockChain.insert).toHaveBeenCalled();
		expect(mockChain.values).toHaveBeenCalledWith(newUrl);
		expect(result).toEqual([{ id: 1, ...newUrl }]);
	});

	it('findExistingUserUrlPermanent queries with url and userId', async () => {
		mockChain.where.mockResolvedValueOnce([{ id: 1 }]);
		const result = await findExistingUserUrlPermanent(mockDb, 'https://test.com', 'user1');

		expect(mockChain.select).toHaveBeenCalled();
		expect(mockChain.where).toHaveBeenCalled();
		expect(result).toEqual({ id: 1 });
	});

	it('findExistingUserUrlExpiring queries with url and userId', async () => {
		mockChain.where.mockResolvedValueOnce([{ id: 1 }]);
		const result = await findExistingUserUrlExpiring(mockDb, 'https://test.com', 'user1');

		expect(mockChain.select).toHaveBeenCalled();
		expect(mockChain.where).toHaveBeenCalled();
		expect(result).toEqual({ id: 1 });
	});

	it('findExistingGlobalUrlPermanent queries with url', async () => {
		mockChain.where.mockResolvedValueOnce([{ id: 1 }]);
		const result = await findExistingGlobalUrlPermanent(mockDb, 'https://test.com');

		expect(mockChain.select).toHaveBeenCalled();
		expect(mockChain.where).toHaveBeenCalled();
		expect(result).toEqual({ id: 1 });
	});

	it('findExistingGlobalUrlExpiring queries with url', async () => {
		mockChain.where.mockResolvedValueOnce([{ id: 1 }]);
		const result = await findExistingGlobalUrlExpiring(mockDb, 'https://test.com');

		expect(mockChain.select).toHaveBeenCalled();
		expect(mockChain.where).toHaveBeenCalled();
		expect(result).toEqual({ id: 1 });
	});
});
