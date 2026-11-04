import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCleanup } = vi.hoisted(() => ({ mockCleanup: vi.fn() }));

vi.mock('$lib/server/url-maintenance', () => ({ cleanupExpiredUrls: mockCleanup }));
vi.mock('$lib/server/logger', () => ({ logger: { info: vi.fn() } }));

import { POST } from './+server';

const post = (role: 'admin' | 'user') =>
	POST({ locals: { db: {}, auth: { userId: 'u1', role } } } as unknown as Parameters<typeof POST>[0]);

describe('POST /api/v1/admin/cleanup-expired', () => {
	beforeEach(() => vi.clearAllMocks());

	it('rejects non-admins without touching the database', async () => {
		await expect(post('user')).rejects.toMatchObject({ status: 403 });
		expect(mockCleanup).not.toHaveBeenCalled();
	});

	it('deletes expired URLs for admins', async () => {
		const response = await post('admin');
		expect(await response.json()).toEqual({ ok: true });
		expect(mockCleanup).toHaveBeenCalledWith({});
	});
});
