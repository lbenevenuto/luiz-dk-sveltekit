import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';

vi.mock('$lib/server/logger', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

vi.mock('svix', () => ({
	Webhook: vi.fn()
}));

vi.mock('$lib/server/clerk', () => ({
	getClerkClient: vi.fn()
}));

import { logger } from '$lib/server/logger';
import { Webhook } from 'svix';
import { getClerkClient } from '$lib/server/clerk';

function makeRequest(body: string, headers?: Record<string, string>): Request {
	return new Request('http://localhost/api/webhooks/clerk', {
		method: 'POST',
		headers: {
			'svix-id': 'msg_123',
			'svix-timestamp': '1234567890',
			'svix-signature': 'v1_sig',
			'content-type': 'application/json',
			...headers
		},
		body
	});
}

function makePlatform(overrides?: Partial<App.Platform['env']>) {
	return {
		env: {
			CLERK_WEBHOOK_SECRET: 'whsec_test',
			...overrides
		}
	} as unknown as App.Platform;
}

function mockClerkClient(updateUserMetadata: ReturnType<typeof vi.fn>) {
	vi.mocked(getClerkClient).mockReturnValue({
		users: { updateUserMetadata }
	} as unknown as ReturnType<typeof getClerkClient>);
}

function mockWebhookVerify(returnValue: unknown) {
	vi.mocked(Webhook).mockImplementation(
		// Must use function (not arrow) so it can be called with `new`
		function () {
			return { verify: vi.fn().mockReturnValue(returnValue) } as unknown as InstanceType<typeof Webhook>;
		} as unknown as typeof Webhook
	);
}

describe('POST /api/webhooks/clerk', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns 500 if webhook secret is not configured', async () => {
		const response = await POST({
			request: makeRequest('{}'),
			platform: { env: {} } as unknown as App.Platform
		});

		expect(response.status).toBe(500);
		const json = (await response.json()) as { error: string };
		expect(json.error).toBe('Webhook secret not configured');
		expect(logger.error).toHaveBeenCalledWith('webhook.clerk.missing_secret', {});
	});

	it('returns 400 if svix headers are missing', async () => {
		const request = new Request('http://localhost/api/webhooks/clerk', {
			method: 'POST',
			body: '{}'
		});

		const response = await POST({ request, platform: makePlatform() });

		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: string };
		expect(json.error).toBe('Missing Svix headers');
	});

	it('returns 400 if signature verification fails', async () => {
		vi.mocked(Webhook).mockImplementation(function () {
			return {
				verify: vi.fn().mockImplementation(() => {
					throw new Error('Invalid signature');
				})
			} as unknown as InstanceType<typeof Webhook>;
		} as unknown as typeof Webhook);

		const response = await POST({
			request: makeRequest('{}'),
			platform: makePlatform()
		});

		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: string };
		expect(json.error).toBe('Invalid signature');
		expect(logger.error).toHaveBeenCalledWith(
			'webhook.clerk.invalid_signature',
			expect.objectContaining({ error: 'Invalid signature' })
		);
	});

	it('returns 400 if event structure is invalid', async () => {
		mockWebhookVerify({ invalid: 'structure' });

		const response = await POST({
			request: makeRequest('{}'),
			platform: makePlatform()
		});

		expect(response.status).toBe(400);
		const json = (await response.json()) as { error: string };
		expect(json.error).toBe('Invalid event structure');
	});

	it('sets default role on user.created event', async () => {
		const mockUpdateMetadata = vi.fn().mockResolvedValue({});
		mockClerkClient(mockUpdateMetadata);
		mockWebhookVerify({
			type: 'user.created',
			data: { id: 'user_new', public_metadata: {} }
		});

		const response = await POST({
			request: makeRequest('{}'),
			platform: makePlatform()
		});

		expect(response.status).toBe(200);
		const json = (await response.json()) as { success: boolean; type: string };
		expect(json.success).toBe(true);
		expect(json.type).toBe('user.created');

		expect(mockUpdateMetadata).toHaveBeenCalledWith('user_new', {
			publicMetadata: { role: 'user' }
		});
		expect(logger.info).toHaveBeenCalledWith('webhook.clerk.role_set', { userId: 'user_new', role: 'user' });
	});

	it('does not override existing role on user.created', async () => {
		const mockUpdateMetadata = vi.fn();
		mockClerkClient(mockUpdateMetadata);
		mockWebhookVerify({
			type: 'user.created',
			data: { id: 'user_admin', public_metadata: { role: 'admin' } }
		});

		const response = await POST({
			request: makeRequest('{}'),
			platform: makePlatform()
		});

		expect(response.status).toBe(200);
		expect(mockUpdateMetadata).not.toHaveBeenCalled();
	});

	it('handles unknown event types gracefully', async () => {
		mockWebhookVerify({
			type: 'session.ended',
			data: { id: 'sess_123' }
		});

		const response = await POST({
			request: makeRequest('{}'),
			platform: makePlatform()
		});

		expect(response.status).toBe(200);
		const json = (await response.json()) as { success: boolean };
		expect(json.success).toBe(true);
		expect(logger.info).toHaveBeenCalledWith('webhook.clerk.unhandled_type', { type: 'session.ended' });
	});

	it('returns 500 if handler throws', async () => {
		mockClerkClient(vi.fn().mockRejectedValue(new Error('Clerk API down')));
		mockWebhookVerify({
			type: 'user.created',
			data: { id: 'user_fail', public_metadata: {} }
		});

		const response = await POST({
			request: makeRequest('{}'),
			platform: makePlatform()
		});

		expect(response.status).toBe(500);
		const json = (await response.json()) as { error: string };
		expect(json.error).toBe('Failed to process webhook');
		expect(logger.error).toHaveBeenCalledWith(
			'webhook.clerk.handler_error',
			expect.objectContaining({ type: 'user.created', error: 'Clerk API down' })
		);
	});
});
