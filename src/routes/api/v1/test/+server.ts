import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';

export const POST: RequestHandler = async ({ locals, platform }) => {
	const isEnabled = dev || platform?.env?.ENABLE_TEST_ENDPOINT === 'true';
	if (!isEnabled) {
		throw error(404, 'Not found');
	}

	requireAdmin(locals);

	throw new Error('Test error');
};
