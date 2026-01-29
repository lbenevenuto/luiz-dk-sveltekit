import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import type { RequestEvent } from '@sveltejs/kit';

// Mock dependencies
vi.mock('$lib/utils', async () => {
	const actual = await vi.importActual<typeof import('$lib/utils')>('$lib/utils');
	return {
		...actual,
		createShortUrl: vi.fn()
	};
});

vi.mock('$lib/server/rate-limit', () => ({
	checkAnonymousRateLimit: vi.fn()
}));

import { createShortUrl } from '$lib/utils';
import { checkAnonymousRateLimit } from '$lib/server/rate-limit';

describe('POST /api/v1/shorten', () => {
	let mockEvent: Partial<RequestEvent>;
	let mockPlatform: App.Platform;
	let mockLocals: App.Locals;

	beforeEach(() => {
		vi.clearAllMocks();

		mockPlatform = {
			env: {
				RATE_LIMIT_MAX_REQUESTS: '10',
				RATE_LIMIT_WINDOW_SECONDS: '60',
				BASE_URL: 'https://luiz.dk'
			} as unknown as App.Platform['env']
		} as App.Platform;

		mockLocals = {
			auth: {
				userId: null,
				sessionId: null,
				user: null,
				role: null
			}
		};

		mockEvent = {
			platform: mockPlatform,
			locals: mockLocals,
			request: new Request('http://localhost/api/v1/shorten', {
				method: 'POST',
				body: JSON.stringify({ url: 'https://example.com' }),
				headers: {
					'CF-Connecting-IP': '127.0.0.1'
				}
			})
		};
	});

	it('should return 429 if rate limit exceeded for anonymous user', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(checkAnonymousRateLimit as any).mockResolvedValue({ success: false });

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await POST(mockEvent as any);
		const json = await response.json();

		expect(response.status).toBe(429);
		expect(json).toEqual({
			error: 'Rate limit exceeded. Please sign in for unlimited URL shortening.',
			rateLimit: true
		});
		expect(checkAnonymousRateLimit).toHaveBeenCalled();
	});

	it('should create short URL for anonymous user if rate limit allows', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(checkAnonymousRateLimit as any).mockResolvedValue({ success: true });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(createShortUrl as any).mockResolvedValue({ shortCode: 'abc', originalUrl: 'https://example.com' });

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await POST(mockEvent as any);
		const json = await response.json();

		expect(response.status).toBe(200); // 200 is default for json() helper if not specified
		expect(json).toEqual({
			shortUrl: 'https://luiz.dk/s/abc',
			originalUrl: 'https://example.com',
			shortCode: 'abc',
			expiresAt: null,
			anonymous: true
		});
		expect(checkAnonymousRateLimit).toHaveBeenCalled();
		expect(createShortUrl).toHaveBeenCalledWith('https://example.com', null, mockPlatform, null);
	});

	it('should create short URL for authenticated user without rate limit check', async () => {
		mockLocals.auth.userId = 'user_123';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(createShortUrl as any).mockResolvedValue({ shortCode: 'xyz', originalUrl: 'https://example.com' });

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await POST(mockEvent as any);
		const json = await response.json();

		expect(response.status).toBe(200);
		expect(checkAnonymousRateLimit).not.toHaveBeenCalled();
		expect(createShortUrl).toHaveBeenCalledWith('https://example.com', null, mockPlatform, 'user_123');
		expect(json).toMatchObject({
			shortUrl: 'https://luiz.dk/s/xyz',
			anonymous: false,
			expiresAt: null
		});
	});

	it('should honor expiresIn by passing expiresAt and returning ISO date', async () => {
		vi.useFakeTimers();
		const now = new Date('2024-01-01T00:00:00Z');
		vi.setSystemTime(now);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(checkAnonymousRateLimit as any).mockResolvedValue({ success: true });

		const expiresInSeconds = 3600;
		const expectedExpiresAt = Math.floor(now.getTime() / 1000) + expiresInSeconds;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(createShortUrl as any).mockResolvedValue({
			shortCode: 'exp',
			originalUrl: 'https://example.com',
			expiresAt: expectedExpiresAt
		});

		const eventWithExpiry: Partial<RequestEvent> = {
			platform: mockPlatform,
			locals: mockLocals,
			request: new Request('http://localhost/api/v1/shorten', {
				method: 'POST',
				body: JSON.stringify({ url: 'https://example.com', expiresIn: expiresInSeconds }),
				headers: {
					'CF-Connecting-IP': '127.0.0.1'
				}
			})
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await POST(eventWithExpiry as any);
		const json = (await response.json()) as { expiresAt?: string; shortCode?: string; anonymous?: boolean };

		expect(createShortUrl).toHaveBeenCalledWith('https://example.com', expectedExpiresAt, mockPlatform, null);
		expect(json.expiresAt).toBe(new Date(expectedExpiresAt * 1000).toISOString());
		expect(json).toMatchObject({
			shortCode: 'exp',
			anonymous: true
		});

		vi.useRealTimers();
	});

	it('should reject invalid URLs', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(checkAnonymousRateLimit as any).mockResolvedValue({ success: true });

		const badEvent: Partial<RequestEvent> = {
			platform: mockPlatform,
			locals: mockLocals,
			request: new Request('http://localhost/api/v1/shorten', {
				method: 'POST',
				body: JSON.stringify({ url: 'notaurl' }),
				headers: {
					'CF-Connecting-IP': '127.0.0.1'
				}
			})
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await POST(badEvent as any);
		const json = await response.json();

		expect(response.status).toBe(400);
		const body = json as { error: string; details: string };
		expect(body.error).toBe('Validation failed');
		expect(body.details).toBeDefined();
		expect(createShortUrl).not.toHaveBeenCalled();
	});

	it('should reject non-http/https URLs', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(checkAnonymousRateLimit as any).mockResolvedValue({ success: true });

		const badEvent: Partial<RequestEvent> = {
			platform: mockPlatform,
			locals: mockLocals,
			request: new Request('http://localhost/api/v1/shorten', {
				method: 'POST',
				body: JSON.stringify({ url: 'ftp://example.com' }),
				headers: {
					'CF-Connecting-IP': '127.0.0.1'
				}
			})
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await POST(badEvent as any);
		const json = await response.json();

		expect(response.status).toBe(400);
		expect(json).toEqual({ error: 'Only http/https URLs are allowed' });
		expect(createShortUrl).not.toHaveBeenCalled();
	});
});
