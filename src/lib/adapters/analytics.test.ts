import { describe, it, expect, vi } from 'vitest';
import { trackRedirect, type ClickData } from './analytics';

vi.mock('$lib/server/logger', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

import { logger } from '$lib/server/logger';

describe('trackRedirect', () => {
	it('should write data point to analytics engine', async () => {
		const mockAnalytics = {
			writeDataPoint: vi.fn()
		};

		const data: ClickData = {
			ipHash: 'hash123',
			userAgent: 'Mozilla/5.0',
			referrer: 'https://google.com',
			country: 'DK'
		};

		await trackRedirect({ env: { ANALYTICS: mockAnalytics } } as unknown as App.Platform, 'abc', data);

		expect(mockAnalytics.writeDataPoint).toHaveBeenCalledWith(
			expect.objectContaining({
				blobs: ['abc', 'DK', 'Mozilla/5.0', 'https://google.com'],
				indexes: ['hash123']
			})
		);
	});

	it('should handle errors gracefully', async () => {
		const mockAnalytics = {
			writeDataPoint: vi.fn().mockImplementation(() => {
				throw new Error('Analytics error');
			})
		};

		await trackRedirect({ env: { ANALYTICS: mockAnalytics } } as unknown as App.Platform, 'abc', {} as ClickData);

		expect(logger.error).toHaveBeenCalledWith(
			'analytics.track_failed',
			expect.objectContaining({ shortCode: 'abc', error: 'Analytics error' })
		);
	});

	it('should log through the structured logger', async () => {
		const data: ClickData = {
			ipHash: 'hash',
			userAgent: 'ua',
			referrer: 'ref',
			country: 'US'
		};

		await trackRedirect(undefined, 'abc', data);

		expect(logger.info).toHaveBeenCalledWith(
			'analytics.track_local',
			expect.objectContaining({
				shortCode: 'abc',
				country: 'US'
			})
		);
	});
});
