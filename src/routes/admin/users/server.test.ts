import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionFailure } from '@sveltejs/kit';
import { render } from 'svelte/server';

const { mockGetUserList, mockUpdateUserMetadata, mockRequireAdmin, mockLogger } = vi.hoisted(() => ({
	mockGetUserList: vi.fn(),
	mockUpdateUserMetadata: vi.fn(),
	mockRequireAdmin: vi.fn(),
	mockLogger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

vi.mock('$lib/server/auth', () => ({
	requireAdmin: mockRequireAdmin
}));

vi.mock('$lib/server/clerk', () => ({
	getClerkClient: vi.fn(() => ({
		users: {
			getUserList: mockGetUserList,
			updateUserMetadata: mockUpdateUserMetadata
		}
	}))
}));

vi.mock('$lib/server/logger', () => ({
	logger: mockLogger
}));

import { actions, load } from './+page.server';
import AdminUsers from './+page.svelte';

const adminUserId = 'admin_1';

function createLocals(): App.Locals {
	return {
		requestId: 'req-1',
		db: {} as App.Locals['db'],
		auth: {
			userId: adminUserId,
			sessionId: 'sess_1',
			user: null,
			role: 'admin'
		}
	};
}

describe('admin users page server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('maps clerk users with normalized roles', async () => {
		mockGetUserList.mockResolvedValue({
			data: [
				{
					id: 'user_1',
					firstName: 'Luiz',
					lastName: 'Kowalski',
					primaryEmailAddressId: 'email_1',
					emailAddresses: [{ id: 'email_1', emailAddress: 'luiz@example.com' }],
					publicMetadata: { role: 'admin' },
					createdAt: 123
				},
				{
					id: 'user_2',
					firstName: 'Other',
					lastName: 'User',
					primaryEmailAddressId: 'email_2',
					emailAddresses: [{ id: 'email_2', emailAddress: 'other@example.com' }],
					publicMetadata: { role: 'unexpected' },
					createdAt: 456
				}
			]
		});

		const result = await load({
			platform: {
				env: {} as App.Platform['env']
			} as App.Platform,
			locals: createLocals()
		});

		expect(result.users).toEqual([
			expect.objectContaining({ id: 'user_1', role: 'admin' }),
			expect.objectContaining({ id: 'user_2', role: 'user' })
		]);
		expect(mockRequireAdmin).toHaveBeenCalled();
	});

	it('rejects invalid role updates before calling clerk', async () => {
		const response = (await actions.setRole({
			request: new Request('https://luiz.dk/admin/users', {
				method: 'POST',
				body: new URLSearchParams({ userId: '', role: 'owner' })
			}),
			platform: {
				env: {} as App.Platform['env']
			} as App.Platform,
			locals: createLocals()
		})) as ActionFailure<{ success: boolean; error: string }>;

		expect(response.status).toBe(400);
		expect(response.data).toEqual({
			success: false,
			error: 'Invalid role update request'
		});
		expect(mockUpdateUserMetadata).not.toHaveBeenCalled();
	});

	it('updates a validated role', async () => {
		mockUpdateUserMetadata.mockResolvedValue(undefined);

		const response = await actions.setRole({
			request: new Request('https://luiz.dk/admin/users', {
				method: 'POST',
				body: new URLSearchParams({ userId: 'user_1', role: 'admin' })
			}),
			platform: {
				env: {} as App.Platform['env']
			} as App.Platform,
			locals: createLocals()
		});

		expect(response).toEqual({ success: true });
		expect(mockUpdateUserMetadata).toHaveBeenCalledWith('user_1', {
			publicMetadata: { role: 'admin' }
		});
	});

	it.each(['setRole', 'removeRole'] as const)('%s rejects self-removal before calling Clerk', async (action) => {
		await expect(
			actions[action]({
				request: new Request(`https://luiz.dk/admin/users?/${action}`, {
					method: 'POST',
					body: new URLSearchParams({ userId: adminUserId, role: 'user' })
				}),
				platform: { env: {} } as App.Platform,
				locals: createLocals()
			})
		).resolves.toMatchObject({
			status: 403,
			data: { success: false, error: 'You cannot remove your own admin access.' }
		});
		expect(mockUpdateUserMetadata).not.toHaveBeenCalled();
	});

	it.each(['setRole', 'removeRole'] as const)('%s removes admin access from another user', async (action) => {
		mockUpdateUserMetadata.mockResolvedValueOnce(undefined);

		await expect(
			actions[action]({
				request: new Request(`https://luiz.dk/admin/users?/${action}`, {
					method: 'POST',
					body: new URLSearchParams({ userId: 'admin_2', role: 'user' })
				}),
				platform: { env: {} } as App.Platform,
				locals: createLocals()
			})
		).resolves.toEqual({ success: true });
		expect(mockUpdateUserMetadata).toHaveBeenCalledWith('admin_2', {
			publicMetadata: { role: 'user' }
		});
	});

	it('shows Remove Admin only on the other admin’s row', async () => {
		mockGetUserList.mockResolvedValueOnce({
			data: [adminUserId, 'admin_2'].map((id) => ({
				id,
				firstName: null,
				lastName: null,
				emailAddresses: [],
				publicMetadata: { role: 'admin' },
				createdAt: 123
			}))
		});

		const data = await load({ platform: { env: {} } as App.Platform, locals: createLocals() });
		const { body } = render(AdminUsers, {
			props: {
				params: {},
				data: { ...data, clerkPublishableKey: '', clerkFrontendApi: '' },
				form: null
			}
		});

		expect(body.match(/Remove Admin/g)).toHaveLength(1);
		expect(body).toContain('name="userId" value="admin_2"');
		expect(body).not.toContain(`name="userId" value="${adminUserId}"`);
	});

	it('displays role update errors on the users page', () => {
		const { body } = render(AdminUsers, {
			props: {
				params: {},
				data: { users: [], clerkPublishableKey: '', clerkFrontendApi: '' },
				form: { success: false, error: 'You cannot remove your own admin access.' }
			}
		});

		expect(body).toContain('role="alert"');
		expect(body).toContain('You cannot remove your own admin access.');
	});

	it('rejects invalid role removal requests before calling clerk', async () => {
		const response = (await actions.removeRole({
			request: new Request('https://luiz.dk/admin/users', {
				method: 'POST',
				body: new URLSearchParams()
			}),
			platform: {
				env: {} as App.Platform['env']
			} as App.Platform,
			locals: createLocals()
		})) as ActionFailure<{ success: boolean; error: string }>;

		expect(response.status).toBe(400);
		expect(response.data).toEqual({
			success: false,
			error: 'Invalid role removal request'
		});
		expect(mockUpdateUserMetadata).not.toHaveBeenCalled();
	});
});
