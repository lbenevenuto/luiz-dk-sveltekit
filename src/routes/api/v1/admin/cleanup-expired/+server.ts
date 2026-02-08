import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import { cleanupExpiredUrls } from '$lib/server/url-maintenance';
import { logger } from '$lib/server/logger';

export const POST: RequestHandler = async ({ locals, platform }) => {
	requireAdmin(locals);

	await cleanupExpiredUrls(platform);
	logger.info('maintenance.cleanup_expired_urls');

	return json({ ok: true });
};
