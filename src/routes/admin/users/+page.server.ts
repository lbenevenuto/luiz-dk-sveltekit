import { requireAdmin } from '$lib/server/auth';
import { getClerkClient } from '$lib/server/clerk';

export const load = async ({
	platform,
	locals
}: {
	platform?: App.Platform;
	locals: App.Locals;
}) => {
	requireAdmin(locals);

	if (!platform) {
		return { users: [] };
	}

	const clerkClient = getClerkClient(platform.env);

	try {
		const users = (await clerkClient.users.getUserList({ limit: 100 })).data;

		return {
			users: users.map((user) => ({
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress,
				role: (user.publicMetadata?.role as string) || 'user',
				createdAt: user.createdAt
			}))
		};
	} catch (error) {
		console.error('Failed to fetch users:', error);
		return { users: [], error: 'Failed to fetch users' };
	}
};

export const actions = {
	setRole: async ({
		request,
		platform,
		locals
	}: {
		request: Request;
		platform?: App.Platform;
		locals: App.Locals;
	}) => {
		requireAdmin(locals);

		if (!platform) {
			return { success: false, error: 'Platform not available' };
		}

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const role = data.get('role') as 'admin' | 'user';

		try {
			const clerkClient = getClerkClient(platform.env);
			await clerkClient.users.updateUserMetadata(userId, {
				publicMetadata: { role }
			});

			return { success: true };
		} catch (error) {
			console.error('Failed to update role:', error);
			return { success: false, error: 'Failed to update role' };
		}
	},

	removeRole: async ({
		request,
		platform,
		locals
	}: {
		request: Request;
		platform?: App.Platform;
		locals: App.Locals;
	}) => {
		requireAdmin(locals);

		if (!platform) {
			return { success: false, error: 'Platform not available' };
		}

		const data = await request.formData();
		const userId = data.get('userId') as string;

		try {
			const clerkClient = getClerkClient(platform.env);
			await clerkClient.users.updateUserMetadata(userId, {
				publicMetadata: { role: 'user' } // Default to 'user'
			});

			return { success: true };
		} catch (error) {
			console.error('Failed to remove role:', error);
			return { success: false, error: 'Failed to remove role' };
		}
	}
};
