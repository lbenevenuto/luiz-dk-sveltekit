import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { jsonError, parseJsonBody, validationError } from './responses';

describe('jsonError', () => {
	it('builds a { error } body with the given status and no details key', async () => {
		const res = jsonError('Nope', 401);
		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({ error: 'Nope' });
	});

	it('includes details only when provided', async () => {
		const res = jsonError('Bad', 400, 'more info');
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ error: 'Bad', details: 'more info' });
	});
});

describe('validationError', () => {
	it('returns a 400 with a prettified details string', async () => {
		const result = z.object({ name: z.string() }).safeParse({ name: 123 });
		expect(result.success).toBe(false);
		if (result.success) return;

		const res = validationError(result.error);
		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: string; details: string };
		expect(body.error).toBe('Validation failed');
		expect(typeof body.details).toBe('string');
		expect(body.details.length).toBeGreaterThan(0);
	});
});

describe('parseJsonBody', () => {
	it('returns parsed data for a valid JSON body', async () => {
		const request = new Request('http://localhost/api', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ hello: 'world' })
		});

		const parsed = await parseJsonBody(request);
		expect('data' in parsed).toBe(true);
		if ('response' in parsed) return;
		expect(parsed.data).toEqual({ hello: 'world' });
	});

	it('returns a 400 response for an invalid JSON body', async () => {
		const request = new Request('http://localhost/api', {
			method: 'POST',
			body: 'not-json'
		});

		const parsed = await parseJsonBody(request);
		expect('response' in parsed).toBe(true);
		if (!('response' in parsed)) return;
		expect(parsed.response.status).toBe(400);
		expect(await parsed.response.json()).toEqual({ error: 'Invalid JSON body' });
	});
});
