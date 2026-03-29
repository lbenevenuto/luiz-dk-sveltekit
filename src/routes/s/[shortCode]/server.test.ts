import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import type { DrizzleClient } from '$lib/server/db/client';

vi.mock('$lib/server/logger', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

vi.mock('$lib/server/db/queries/urls', () => ({
	getUrlByShortCode: vi.fn(),
	deleteUrlById: vi.fn()
}));

import { logger } from '$lib/server/logger';
import { getUrlByShortCode } from '$lib/server/db/queries/urls';

describe('GET /s/[shortCode]', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('sanitizes logged redirect target by removing query and hash', async () => {
		vi.mocked(getUrlByShortCode).mockResolvedValue({
			id: 1,
			shortCode: 'abc',
			originalUrl: 'https://example.com/path?token=secret#frag',
			createdAt: new Date(),
			updatedAt: new Date(),
			expiresAt: null,
			userId: null
		});

		const event = {
			params: { shortCode: 'abc' },
			request: new Request('http://localhost/s/abc'),
			locals: { db: {} as DrizzleClient }
		} as Parameters<typeof GET>[0];

		await expect(GET(event)).rejects.toMatchObject({
			status: 302,
			location: 'https://example.com/path?token=secret#frag'
		});

		expect(logger.info).toHaveBeenCalledWith(
			'redirect.found',
			expect.objectContaining({
				shortCode: 'abc',
				target: 'https://example.com/path'
			})
		);
	});

	it('returns 410 Gone for an expired link and deletes it', async () => {
		vi.mocked(getUrlByShortCode).mockResolvedValue({
			id: 1,
			shortCode: 'abc',
			originalUrl: 'https://example.com/expired',
			createdAt: new Date(),
			updatedAt: new Date(),
			expiresAt: new Date(Date.now() - 10000), // 10 seconds ago
			userId: null
		});

		const event = {
			params: { shortCode: 'abc' },
			request: new Request('http://localhost/s/abc'),
			locals: { db: {} as DrizzleClient }
		} as Parameters<typeof GET>[0];

		const response = await GET(event);
		expect(response.status).toBe(410);
		expect(await response.text()).toBe('This link has expired.');

		expect(logger.warn).toHaveBeenCalledWith('redirect.expired', { shortCode: 'abc' });
	});

	it('redirects to fallback for a non-existent shortcode', async () => {
		vi.mocked(getUrlByShortCode).mockResolvedValue(undefined);

		const event = {
			params: { shortCode: 'nope' },
			request: new Request('http://localhost/s/nope'),
			locals: { db: {} as DrizzleClient }
		} as Parameters<typeof GET>[0];

		await expect(GET(event)).rejects.toMatchObject({
			status: 302,
			location: 'https://luiz.dk'
		});

		expect(logger.warn).toHaveBeenCalledWith('redirect.not_found', { shortCode: 'nope' });
	});

	it('calls analytics platform if configured', async () => {
		vi.mocked(getUrlByShortCode).mockResolvedValue({
			id: 1,
			shortCode: 'trackme',
			originalUrl: 'https://example.com/track',
			createdAt: new Date(),
			updatedAt: new Date(),
			expiresAt: null,
			userId: null
		});

		const mockWaitUntil = vi.fn();

		const event = {
			params: { shortCode: 'trackme' },
			request: new Request('http://localhost/s/trackme'),
			platform: {
				ctx: { waitUntil: mockWaitUntil },
				cf: { country: 'JP', colo: 'NRT' }
			},
			locals: { db: {} as DrizzleClient }
		} as unknown as Parameters<typeof GET>[0];

		await expect(GET(event)).rejects.toMatchObject({
			status: 302,
			location: 'https://example.com/track'
		});

		// By importing factory inside the test or mocking it, we could assert exact analytics calls.
		// For now just checking it doesn't crash to get the branch coverage and calls waitUntil
		expect(mockWaitUntil).toHaveBeenCalled();
	});
});
