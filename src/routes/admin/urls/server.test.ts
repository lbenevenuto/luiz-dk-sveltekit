import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSearchUrls, mockGetUserList } = vi.hoisted(() => ({ mockSearchUrls: vi.fn(), mockGetUserList: vi.fn() }));

vi.mock('$lib/server/db/queries/urls', () => ({ searchUrls: mockSearchUrls }));
vi.mock('$lib/server/clerk', () => ({ getClerkClient: () => ({ users: { getUserList: mockGetUserList } }) }));
vi.mock('$lib/server/logger', () => ({ logger: { error: vi.fn() } }));

import { load } from './+page.server';

const runLoad = (search: string, role: 'admin' | 'user' = 'admin', platform?: unknown) =>
	load({
		platform,
		url: new URL(`https://luiz.dk/admin/urls${search}`),
		locals: { db: {}, auth: { userId: 'u1', role } }
	} as unknown as Parameters<typeof load>[0]);

describe('admin urls load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSearchUrls.mockResolvedValue({ urls: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
	});

	it('rejects non-admins', async () => {
		await expect(runLoad('', 'user')).rejects.toMatchObject({ status: 403 });
	});

	it('maps search params onto the query', async () => {
		await runLoad('?q=foo&anonymous=true&page=2&pageSize=50');
		expect(mockSearchUrls).toHaveBeenCalledWith({}, { query: 'foo', userId: null, page: 2, pageSize: 50 });
	});

	it('falls back to defaults for a page size outside the allowed set', async () => {
		await runLoad('?pageSize=7');
		expect(mockSearchUrls).toHaveBeenCalledWith({}, expect.objectContaining({ page: 1, pageSize: 10 }));
	});

	it('resolves URL owners to names, with email only alongside a real name', async () => {
		mockSearchUrls.mockResolvedValue({
			urls: [{ userId: 'u_a' }, { userId: 'u_a' }, { userId: 'u_b' }, { userId: null }]
		});
		const email = (address: string) => ({
			primaryEmailAddressId: 'e',
			emailAddresses: [{ id: 'e', emailAddress: address }]
		});
		mockGetUserList.mockResolvedValue({
			data: [
				{ id: 'u_a', firstName: 'Luiz', lastName: 'B', ...email('a@x.dk') },
				{ id: 'u_b', firstName: null, lastName: null, ...email('b@x.dk') }
			]
		});

		const result = (await runLoad('', 'admin', { env: {} })) as { owners: unknown };

		expect(mockGetUserList).toHaveBeenCalledWith({ userId: ['u_a', 'u_b'], limit: 2 });
		expect(result.owners).toEqual({ u_a: { name: 'Luiz B', email: 'a@x.dk' }, u_b: { name: 'b@x.dk' } });
	});

	it('falls back to raw ids when Clerk is unavailable', async () => {
		mockSearchUrls.mockResolvedValue({ urls: [{ userId: 'u_a' }] });
		mockGetUserList.mockRejectedValue(new Error('clerk down'));

		expect(((await runLoad('', 'admin', { env: {} })) as { owners: unknown }).owners).toEqual({});
	});
});
