import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetUser, mockFetchChartAnalytics } = vi.hoisted(() => ({
	mockGetUser: vi.fn(),
	mockFetchChartAnalytics: vi.fn()
}));

vi.mock('$lib/server/auth', () => ({ requireAdmin: vi.fn() }));
vi.mock('$lib/server/clerk', () => ({ getClerkClient: vi.fn(() => ({ users: { getUser: mockGetUser } })) }));
vi.mock('$lib/server/analytics', () => ({ fetchChartAnalytics: mockFetchChartAnalytics }));
vi.mock('$lib/server/db/queries/urls', () => ({ getUserUrls: vi.fn().mockResolvedValue([]) }));
vi.mock('$lib/server/logger', () => ({ logger: { error: vi.fn() } }));

import { load } from './+page.server';

const runLoad = (search: string) =>
	load({
		platform: { env: {} },
		url: new URL(`https://luiz.dk/admin/analytics${search}`),
		locals: { db: {} }
	} as unknown as Parameters<typeof load>[0]) as Promise<{ streamed: { charts: Promise<unknown> } }>;

describe('admin analytics load', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns an error instead of all-user analytics when the user filter fails', async () => {
		mockGetUser.mockRejectedValue(new Error('clerk down'));

		const result = await runLoad('?userId=user_1');

		expect(await result.streamed.charts).toEqual({ charts: undefined, error: expect.any(String) });
		expect(mockFetchChartAnalytics).not.toHaveBeenCalled();
	});
});
