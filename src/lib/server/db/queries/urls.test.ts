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
	findExistingGlobalUrlExpiring,
	searchUrls
} from './urls';

function createChainableMock(resolvedValue?: unknown) {
	const chain = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockResolvedValue(resolvedValue ?? []),
		limit: vi.fn().mockReturnThis(),
		offset: vi.fn().mockResolvedValue(resolvedValue ?? []),
		orderBy: vi.fn().mockReturnThis(),
		delete: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		values: vi.fn().mockResolvedValue(resolvedValue ?? [])
	};
	return chain;
}

function createSearchMock(urls: unknown[] = [], count = 0) {
	let callCount = 0;
	const chain = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockImplementation(function (this: typeof chain) {
			callCount++;
			if (callCount === 2) {
				// count query resolves directly from where
				return Promise.resolve([{ count }]);
			}
			return this;
		}),
		orderBy: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		offset: vi.fn().mockResolvedValue(urls)
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

	describe('searchUrls', () => {
		it('returns paginated results with defaults', async () => {
			const mockUrls = [{ id: 1, shortCode: 'abc' }];
			const searchMock = createSearchMock(mockUrls, 1);
			const db = searchMock as unknown as DrizzleClient;

			const result = await searchUrls(db, {});

			expect(result.urls).toEqual(mockUrls);
			expect(result.total).toBe(1);
			expect(result.page).toBe(1);
			expect(result.pageSize).toBe(10);
			expect(result.totalPages).toBe(1);
		});

		it('calculates totalPages correctly', async () => {
			const searchMock = createSearchMock([], 75);
			const db = searchMock as unknown as DrizzleClient;

			const result = await searchUrls(db, { page: 1 });

			expect(result.totalPages).toBe(8);
			expect(result.total).toBe(75);
		});

		it('passes query parameter for search', async () => {
			const searchMock = createSearchMock([], 0);
			const db = searchMock as unknown as DrizzleClient;

			await searchUrls(db, { query: 'test' });

			expect(searchMock.where).toHaveBeenCalled();
			expect(searchMock.select).toHaveBeenCalledTimes(2);
		});

		it('passes userId filter', async () => {
			const searchMock = createSearchMock([], 0);
			const db = searchMock as unknown as DrizzleClient;

			await searchUrls(db, { userId: 'user123' });

			expect(searchMock.where).toHaveBeenCalled();
		});

		it('passes null userId for anonymous filter', async () => {
			const searchMock = createSearchMock([], 0);
			const db = searchMock as unknown as DrizzleClient;

			await searchUrls(db, { userId: null });

			expect(searchMock.where).toHaveBeenCalled();
		});

		it('applies pagination offset correctly', async () => {
			const searchMock = createSearchMock([], 50);
			const db = searchMock as unknown as DrizzleClient;

			await searchUrls(db, { page: 2, pageSize: 10 });

			expect(searchMock.limit).toHaveBeenCalledWith(10);
			expect(searchMock.offset).toHaveBeenCalledWith(10);
		});

		it('returns empty results when no matches', async () => {
			const searchMock = createSearchMock([], 0);
			const db = searchMock as unknown as DrizzleClient;

			const result = await searchUrls(db, { query: 'nonexistent' });

			expect(result.urls).toEqual([]);
			expect(result.total).toBe(0);
			expect(result.totalPages).toBe(0);
		});
	});
});
