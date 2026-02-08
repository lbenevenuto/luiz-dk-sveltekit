import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';

vi.mock('$lib/server/db', () => ({
	getDb: vi.fn()
}));

vi.mock('$lib/server/logger', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

import { getDb } from '$lib/server/db';
import { logger } from '$lib/server/logger';

describe('GET /s/[shortCode]', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('sanitizes logged redirect target by removing query and hash', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(getDb as any).mockResolvedValue({
			query: {
				urls: {
					findFirst: vi.fn().mockResolvedValue({
						id: 1,
						shortCode: 'abc',
						originalUrl: 'https://example.com/path?token=secret#frag',
						expiresAt: null
					})
				}
			}
		});

		const event = {
			params: { shortCode: 'abc' },
			request: new Request('http://localhost/s/abc')
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
});
