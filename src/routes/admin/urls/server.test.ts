import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSearchUrls } = vi.hoisted(() => ({ mockSearchUrls: vi.fn() }));

vi.mock('$lib/server/db/queries/urls', () => ({ searchUrls: mockSearchUrls }));

import { load } from './+page.server';

const runLoad = (search: string, role: 'admin' | 'user' = 'admin') =>
	load({
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
});
