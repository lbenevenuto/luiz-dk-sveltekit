import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetUserUrls, mockFetchChartAnalytics } = vi.hoisted(() => ({
	mockGetUserUrls: vi.fn(),
	mockFetchChartAnalytics: vi.fn()
}));

vi.mock('$lib/server/analytics', () => ({ fetchChartAnalytics: mockFetchChartAnalytics }));
vi.mock('$lib/server/db/queries/urls', () => ({ getUserUrls: mockGetUserUrls }));
vi.mock('$lib/server/logger', () => ({ logger: { error: vi.fn() } }));

import { load } from './+page.server';

const runLoad = (userId: string | null) =>
	load({
		url: new URL('https://luiz.dk/dashboard'),
		locals: { db: {}, auth: { userId } }
	} as unknown as Parameters<typeof load>[0]) as Promise<{ streamed: { charts: Promise<unknown> } }>;

describe('dashboard load', () => {
	beforeEach(() => vi.clearAllMocks());

	it('redirects anonymous visitors to login', async () => {
		await expect(runLoad(null)).rejects.toMatchObject({ status: 302, location: '/login' });
	});

	it('scopes analytics to the signed-in user', async () => {
		mockGetUserUrls.mockResolvedValue([{ shortCode: 'abc' }]);
		await runLoad('user_1');
		expect(mockFetchChartAnalytics).toHaveBeenCalledWith(undefined, expect.objectContaining({ shortCodes: ['abc'] }));
	});

	it('returns an error when the user links cannot be loaded', async () => {
		mockGetUserUrls.mockRejectedValue(new Error('d1 down'));
		const result = await runLoad('user_1');
		expect(await result.streamed.charts).toEqual({ charts: undefined, error: expect.any(String) });
	});
});
