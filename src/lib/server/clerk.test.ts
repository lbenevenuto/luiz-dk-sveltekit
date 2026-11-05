import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetUserList } = vi.hoisted(() => ({ mockGetUserList: vi.fn() }));

vi.mock('@clerk/backend', () => ({ createClerkClient: () => ({ users: { getUserList: mockGetUserList } }) }));
vi.mock('$lib/server/logger', () => ({ logger: { error: vi.fn() } }));

import { getOwners } from './clerk';

const platform = { env: {} } as App.Platform;
const email = (address: string) => ({
	primaryEmailAddressId: 'e',
	emailAddresses: [{ id: 'e', emailAddress: address }]
});

describe('getOwners', () => {
	beforeEach(() => vi.clearAllMocks());

	it('resolves ids to names, with email only alongside a real name', async () => {
		mockGetUserList.mockResolvedValue({
			data: [
				{ id: 'u_a', firstName: 'Luiz', lastName: 'B', ...email('a@x.dk') },
				{ id: 'u_b', firstName: null, lastName: null, ...email('b@x.dk') }
			]
		});

		expect(await getOwners(platform, ['u_a', 'u_b'])).toEqual({
			u_a: { name: 'Luiz B', email: 'a@x.dk' },
			u_b: { name: 'b@x.dk' }
		});
		expect(mockGetUserList).toHaveBeenCalledWith({ userId: ['u_a', 'u_b'], limit: 2 });
	});

	it('skips Clerk when there is nothing to resolve, and fails open on errors', async () => {
		expect(await getOwners(platform, [])).toEqual({});
		expect(mockGetUserList).not.toHaveBeenCalled();

		mockGetUserList.mockRejectedValue(new Error('clerk down'));
		expect(await getOwners(platform, ['u_a'])).toEqual({});
	});
});
