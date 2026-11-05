import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchAnalyticsLog, mockGetUserUrls, mockGetShortCodeOwners, mockGetOwners } = vi.hoisted(() => ({
	mockFetchAnalyticsLog: vi.fn(),
	mockGetUserUrls: vi.fn(),
	mockGetShortCodeOwners: vi.fn(),
	mockGetOwners: vi.fn()
}));

vi.mock('$lib/server/analytics', () => ({ fetchAnalyticsLog: mockFetchAnalyticsLog }));
vi.mock('$lib/server/clerk', () => ({ getOwners: mockGetOwners }));
vi.mock('$lib/server/db/queries/urls', () => ({
	getUserUrls: mockGetUserUrls,
	getShortCodeOwners: mockGetShortCodeOwners
}));

import { GET } from './+server';

const get = (search: string, auth: { userId: string | null; role: 'admin' | 'user' | null }) =>
	GET({
		url: new URL(`https://luiz.dk/api/v1/analytics-log${search}`),
		locals: { db: {}, auth }
	} as unknown as Parameters<typeof GET>[0]);

interface LogBody {
	rows: Array<{ owner?: unknown }>;
}

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

	it("adds each row's link owner for admins, falling back to the raw id", async () => {
		mockFetchAnalyticsLog.mockResolvedValue({ rows: [{ shortCode: 'a' }, { shortCode: 'b' }, { shortCode: 'c' }] });
		mockGetShortCodeOwners.mockResolvedValue(
			new Map([
				['a', 'u_a'],
				['b', null],
				['c', 'u_gone']
			])
		);
		mockGetOwners.mockResolvedValue({ u_a: { name: 'Luiz B', email: 'a@x.dk' } });

		const body = (await (await get('', { userId: 'admin', role: 'admin' })).json()) as LogBody;

		expect(mockGetOwners).toHaveBeenCalledWith(undefined, ['u_a', 'u_gone']);
		expect(body.rows.map((row) => row.owner)).toEqual([{ name: 'Luiz B', email: 'a@x.dk' }, null, { name: 'u_gone' }]);
	});

	it('does not look up owners for non-admins', async () => {
		mockFetchAnalyticsLog.mockResolvedValue({ rows: [{ shortCode: 'u1-code' }] });

		const body = (await (await get('', { userId: 'u1', role: 'user' })).json()) as LogBody;

		expect(mockGetShortCodeOwners).not.toHaveBeenCalled();
		expect(body.rows[0]).not.toHaveProperty('owner');
	});
});
