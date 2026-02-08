import { describe, it, expect, vi } from 'vitest';
import { POST } from './+server';
import type { RequestEvent } from '@sveltejs/kit';

function buildEvent(options?: { body?: unknown; role?: 'admin' | 'user' | null }) {
	const reset = vi.fn().mockResolvedValue(undefined);
	const resetToValue = vi.fn().mockResolvedValue(undefined);

	const body = options?.body ?? {};
	const role = options?.role ?? 'admin';

	const event = {
		request: new Request('http://localhost/api/v1/reset', {
			method: 'POST',
			body: typeof body === 'string' ? body : JSON.stringify(body)
		}),
		locals: {
			auth: {
				userId: role ? 'user_123' : null,
				sessionId: role ? 'sess_123' : null,
				user: null,
				role
			}
		},
		platform: {
			env: {
				GLOBAL_COUNTER_DO: {
					idFromName: vi.fn().mockReturnValue('id'),
					get: vi.fn().mockReturnValue({ reset, resetToValue })
				}
			}
		}
	} as unknown as RequestEvent;

	return {
		event,
		reset,
		resetToValue
	};
}

describe('POST /api/v1/reset', () => {
	it('resets counter when value is not provided', async () => {
		const { event, reset, resetToValue } = buildEvent();
		const response = await POST(event as never);
		const json = await response.json();

		expect(response.status).toBe(200);
		expect(reset).toHaveBeenCalledOnce();
		expect(resetToValue).not.toHaveBeenCalled();
		expect(json).toMatchObject({ status: 'ok', type: 'reset' });
	});

	it('resets counter to provided value including zero', async () => {
		const { event, reset, resetToValue } = buildEvent({ body: { value: 0 } });
		const response = await POST(event as never);
		const json = await response.json();

		expect(response.status).toBe(200);
		expect(reset).not.toHaveBeenCalled();
		expect(resetToValue).toHaveBeenCalledWith(0);
		expect(json).toMatchObject({ status: 'ok', type: 'resetToValue', value: 0 });
	});

	it('rejects invalid JSON body', async () => {
		const { event } = buildEvent({ body: '{not-json}' });
		const response = await POST(event as never);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid JSON body' });
	});

	it('rejects non-admin users', async () => {
		const { event } = buildEvent({ role: 'user' });
		await expect(POST(event as never)).rejects.toMatchObject({ status: 403 });
	});
});
