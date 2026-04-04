import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionFailure } from '@sveltejs/kit';

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

function createLocals(): App.Locals {
	return {
		requestId: 'req-1',
		db: {} as App.Locals['db'],
		auth: {
			userId: 'admin_1',
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
