import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchAnalyticsLog, mockGetUserUrls } = vi.hoisted(() => ({
	mockFetchAnalyticsLog: vi.fn(),
	mockGetUserUrls: vi.fn()
}));

vi.mock('$lib/server/analytics', () => ({ fetchAnalyticsLog: mockFetchAnalyticsLog }));
vi.mock('$lib/server/db/queries/urls', () => ({ getUserUrls: mockGetUserUrls }));

import { GET } from './+server';

const get = (search: string, auth: { userId: string | null; role: 'admin' | 'user' | null }) =>
	GET({
		url: new URL(`https://luiz.dk/api/v1/analytics-log${search}`),
		locals: { db: {}, auth }
	} as unknown as Parameters<typeof GET>[0]);

const shortCodesArg = () => mockFetchAnalyticsLog.mock.calls[0][1].shortCodes;

describe('GET /api/v1/analytics-log', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchAnalyticsLog.mockResolvedValue({ rows: [] });
		mockGetUserUrls.mockImplementation(async (_db, userId: string) => [{ shortCode: `${userId}-code` }]);
	});

	it('rejects anonymous requests and invalid parameters', async () => {
		expect((await get('', { userId: null, role: null })).status).toBe(401);
		expect((await get('?pageSize=9999', { userId: 'u1', role: 'user' })).status).toBe(400);
	});

	it('scopes non-admins to their own links even when they pass userId', async () => {
		await get('?userId=someone-else', { userId: 'u1', role: 'user' });
		expect(mockGetUserUrls).toHaveBeenCalledWith({}, 'u1');
		expect(shortCodesArg()).toEqual(['u1-code']);
	});

	it('lets admins filter by a given user', async () => {
		await get('?userId=u2', { userId: 'admin', role: 'admin' });
		expect(shortCodesArg()).toEqual(['u2-code']);
	});

	it('gives admins every link when no userId is passed', async () => {
		await get('', { userId: 'admin', role: 'admin' });
		expect(mockGetUserUrls).not.toHaveBeenCalled();
		expect(shortCodesArg()).toBeUndefined();
	});
});
