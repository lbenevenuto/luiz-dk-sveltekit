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

vi.mock('$lib/adapters/factory', () => ({
	getCacheAdapter: vi.fn(),
	getAnalyticsAdapter: vi.fn()
}));

import { logger } from '$lib/server/logger';
import { getUrlByShortCode } from '$lib/server/db/queries/urls';
import { getCacheAdapter, getAnalyticsAdapter } from '$lib/adapters/factory';

describe('GET /s/[shortCode]', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getCacheAdapter).mockResolvedValue(null);
		vi.mocked(getAnalyticsAdapter).mockReturnValue({ trackRedirect: vi.fn().mockResolvedValue(undefined) });
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
		const mockCache = {
			get: vi.fn().mockResolvedValue(null),
			set: vi.fn(),
			delete: vi.fn()
		};
		vi.mocked(getCacheAdapter).mockResolvedValue(mockCache);
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

		expect(mockCache.delete).toHaveBeenCalledWith('redirect:abc');
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
		const mockTrackRedirect = vi.fn().mockResolvedValue(undefined);
		vi.mocked(getAnalyticsAdapter).mockReturnValue({ trackRedirect: mockTrackRedirect });

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

		expect(mockWaitUntil).toHaveBeenCalled();
	});

	it('serves from cache without querying DB for permanent URLs', async () => {
		const mockCache = {
			get: vi.fn().mockResolvedValue('https://example.com/cached'),
			set: vi.fn(),
			delete: vi.fn()
		};
		vi.mocked(getCacheAdapter).mockResolvedValue(mockCache);

		const event = {
			params: { shortCode: 'cached' },
			request: new Request('http://localhost/s/cached'),
			locals: { db: {} as DrizzleClient }
		} as Parameters<typeof GET>[0];

		await expect(GET(event)).rejects.toMatchObject({
			status: 302,
			location: 'https://example.com/cached'
		});

		expect(mockCache.get).toHaveBeenCalledWith('redirect:cached');
		expect(getUrlByShortCode).not.toHaveBeenCalled();
		expect(logger.info).toHaveBeenCalledWith('redirect.cache_hit', expect.objectContaining({ shortCode: 'cached' }));
	});
});
