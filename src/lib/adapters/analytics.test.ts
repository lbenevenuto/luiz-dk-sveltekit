import { describe, it, expect, vi } from 'vitest';
import { CloudflareAnalyticsAdapter, ConsoleAnalyticsAdapter, type ClickData } from './analytics';

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

		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const adapter = new CloudflareAnalyticsAdapter(mockAnalytics);

		await adapter.trackRedirect('abc', {} as ClickData);

		expect(consoleSpy).toHaveBeenCalledWith('Analytics tracking error:', expect.any(Error));
		consoleSpy.mockRestore();
	});
});

describe('ConsoleAnalyticsAdapter', () => {
	it('should log to console', async () => {
		const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const adapter = new ConsoleAnalyticsAdapter();

		const data: ClickData = {
			ipHash: 'hash',
			userAgent: 'ua',
			referrer: 'ref',
			country: 'US'
		};

		await adapter.trackRedirect('abc', data);

		expect(consoleSpy).toHaveBeenCalledWith(
			'[Analytics]',
			expect.objectContaining({
				shortCode: 'abc',
				country: 'US'
			})
		);

		consoleSpy.mockRestore();
	});
});
