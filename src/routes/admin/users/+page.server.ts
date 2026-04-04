import { requireAdmin } from '$lib/server/auth';
import { getClerkClient } from '$lib/server/clerk';
import { fail } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';
import { z } from 'zod';

const userRoleSchema = z.enum(['admin', 'user']);

const setRoleSchema = z.object({
	userId: z.string().min(1),
	role: userRoleSchema
});

const removeRoleSchema = z.object({
	userId: z.string().min(1)
});

export const load = async ({ platform, locals }: { platform?: App.Platform; locals: App.Locals }) => {
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
				role: user.publicMetadata?.role === 'admin' ? 'admin' : 'user',
				createdAt: user.createdAt
			}))
		};
	} catch (error) {
		logger.error('admin.users.fetch_failed', {
			error: error instanceof Error ? error.message : String(error)
		});
		return { users: [], error: 'Failed to fetch users' };
	}
};

export const actions = {
	setRole: async ({ request, platform, locals }: { request: Request; platform?: App.Platform; locals: App.Locals }) => {
		requireAdmin(locals);

		if (!platform) {
			return { success: false, error: 'Platform not available' };
		}

		const formData = await request.formData();
		const parsed = setRoleSchema.safeParse({
			userId: formData.get('userId'),
			role: formData.get('role')
		});
		if (!parsed.success) {
			return fail(400, {
				success: false,
				error: 'Invalid role update request'
			});
		}

		const { userId, role } = parsed.data;

		try {
			const clerkClient = getClerkClient(platform.env);
			await clerkClient.users.updateUserMetadata(userId, {
				publicMetadata: { role }
			});

			return { success: true };
		} catch (error) {
			logger.error('admin.users.update_role_failed', {
				userId,
				role,
				error: error instanceof Error ? error.message : String(error)
			});
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

		const formData = await request.formData();
		const parsed = removeRoleSchema.safeParse({
			userId: formData.get('userId')
		});
		if (!parsed.success) {
			return fail(400, {
				success: false,
				error: 'Invalid role removal request'
			});
		}

		const { userId } = parsed.data;

		try {
			const clerkClient = getClerkClient(platform.env);
			await clerkClient.users.updateUserMetadata(userId, {
				publicMetadata: { role: 'user' } // Default to 'user'
			});

			return { success: true };
		} catch (error) {
			logger.error('admin.users.remove_role_failed', {
				userId,
				error: error instanceof Error ? error.message : String(error)
			});
			return { success: false, error: 'Failed to remove role' };
		}
	}
};
