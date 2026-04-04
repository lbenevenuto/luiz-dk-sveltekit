import { describe, it, expect, vi } from 'vitest';
import { CloudflareAnalyticsAdapter, ConsoleAnalyticsAdapter, type ClickData } from './analytics';

vi.mock('$lib/server/logger', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

import { logger } from '$lib/server/logger';

describe('CloudflareAnalyticsAdapter', () => {
	it('should write data point to analytics engine', async () => {
		const mockAnalytics = {
			writeDataPoint: vi.fn()
		};

		const adapter = new CloudflareAnalyticsAdapter(mockAnalytics);

		const data: ClickData = {
			ipHash: 'hash123',
			userAgent: 'Mozilla/5.0',
			referrer: 'https://google.com',
			country: 'DK'
		};

		await adapter.trackRedirect('abc', data);

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

		const adapter = new CloudflareAnalyticsAdapter(mockAnalytics);

		await adapter.trackRedirect('abc', {} as ClickData);

		expect(logger.error).toHaveBeenCalledWith(
			'analytics.track_failed',
			expect.objectContaining({ shortCode: 'abc', error: 'Analytics error' })
		);
	});
});

describe('ConsoleAnalyticsAdapter', () => {
	it('should log through the structured logger', async () => {
		const adapter = new ConsoleAnalyticsAdapter();

		const data: ClickData = {
			ipHash: 'hash',
			userAgent: 'ua',
			referrer: 'ref',
			country: 'US'
		};

		await adapter.trackRedirect('abc', data);

		expect(logger.info).toHaveBeenCalledWith(
			'analytics.track_local',
			expect.objectContaining({
				shortCode: 'abc',
				country: 'US'
			})
		);
	});
});
