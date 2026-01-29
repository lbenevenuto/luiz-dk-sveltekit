import { json } from '@sveltejs/kit';
import { Webhook } from 'svix';
import { getClerkClient } from '$lib/server/clerk';
import { z } from 'zod/v4';

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
		console.error('CLERK_WEBHOOK_SECRET is not configured');
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
		console.error('Error verifying webhook:', err);
		return json({ error: 'Invalid signature' }, { status: 400 });
	}

	// Validate event structure
	const parsed = webhookEventSchema.safeParse(rawEvt);
	if (!parsed.success) {
		console.error('Invalid webhook event structure:', parsed.error);
		return json({ error: 'Invalid event structure' }, { status: 400 });
	}

	const { type, data } = parsed.data;

	console.log(`Clerk webhook received: ${type}`);

	try {
		switch (type) {
			case 'user.created':
				// Set default role to 'user' if not already set
				if (!data.public_metadata?.role && platform) {
					const clerkClient = getClerkClient(platform.env);
					await clerkClient.users.updateUserMetadata(data.id, {
						publicMetadata: { role: 'user' }
					});
					console.log(`Set default role for user ${data.id}`);
				}
				break;

			case 'user.deleted':
				console.log(`User ${data.id} deleted`);
				break;

			case 'user.updated':
				console.log(`User ${data.id} updated`);
				break;

			default:
				console.log(`Unhandled webhook event type: ${type}`);
		}
	} catch (error) {
		console.error(`Error handling webhook event ${type}:`, error);
		return json({ error: 'Failed to process webhook' }, { status: 500 });
	}

	return json({ success: true, type });
};
