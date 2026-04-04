import { json } from '@sveltejs/kit';
import { Webhook } from 'svix';
import { getClerkClient } from '$lib/server/clerk';
import { logger } from '$lib/server/logger';
import { z } from 'zod';

const webhookEventSchema = z.object({
	type: z.string(),
	data: z.object({
		id: z.string(),
		public_metadata: z.record(z.string(), z.unknown()).optional()
	})
});

export const POST = async ({ request, platform }: { request: Request; platform?: App.Platform }) => {
	const webhookSecret = platform?.env.CLERK_WEBHOOK_SECRET;

	if (!webhookSecret) {
		logger.error('webhook.clerk.missing_secret', {});
		return json({ error: 'Webhook secret not configured' }, { status: 500 });
	}

	// Verify webhook signature
	const svix_id = request.headers.get('svix-id');
	const svix_timestamp = request.headers.get('svix-timestamp');
	const svix_signature = request.headers.get('svix-signature');

	if (!svix_id || !svix_timestamp || !svix_signature) {
		return json({ error: 'Missing Svix headers' }, { status: 400 });
	}

	const body = await request.text();

	// Verify using Svix (Clerk uses Svix for webhooks)
	const wh = new Webhook(webhookSecret);

	let rawEvt: unknown;
	try {
		rawEvt = wh.verify(body, {
			'svix-id': svix_id,
			'svix-timestamp': svix_timestamp,
			'svix-signature': svix_signature
		});
	} catch (err) {
		logger.error('webhook.clerk.invalid_signature', { error: err instanceof Error ? err.message : String(err) });
		return json({ error: 'Invalid signature' }, { status: 400 });
	}

	// Validate event structure
	const parsed = webhookEventSchema.safeParse(rawEvt);
	if (!parsed.success) {
		logger.error('webhook.clerk.invalid_structure', { error: parsed.error.message });
		return json({ error: 'Invalid event structure' }, { status: 400 });
	}

	const { type, data } = parsed.data;

	logger.info('webhook.clerk.received', { type });

	try {
		switch (type) {
			case 'user.created':
				// Set default role to 'user' if not already set
				if (!data.public_metadata?.role && platform) {
					const clerkClient = getClerkClient(platform.env);
					await clerkClient.users.updateUserMetadata(data.id, {
						publicMetadata: { role: 'user' }
					});
					logger.info('webhook.clerk.role_set', { userId: data.id, role: 'user' });
				}
				break;

			case 'user.deleted':
				logger.info('webhook.clerk.user_deleted', { userId: data.id });
				break;

			case 'user.updated':
				logger.info('webhook.clerk.user_updated', { userId: data.id });
				break;

			default:
				logger.info('webhook.clerk.unhandled_type', { type });
		}
	} catch (error) {
		logger.error('webhook.clerk.handler_error', {
			type,
			error: error instanceof Error ? error.message : String(error)
		});
		return json({ error: 'Failed to process webhook' }, { status: 500 });
	}

	return json({ success: true, type });
};
