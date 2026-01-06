/**
 * Analytics Adapters
 * Cloudflare Analytics Engine for production, console for local
 */

export interface ClickData {
	ipHash: string;
	userAgent: string;
	referrer: string;
	country: string;
}

export interface AnalyticsAdapter {
	trackRedirect(shortCode: string, data: ClickData): Promise<void>;
}

/**
 * Cloudflare Analytics Engine Adapter (Production)
 */
export class CloudflareAnalyticsAdapter implements AnalyticsAdapter {
	constructor(private analytics: AnalyticsEngineDataset) {}

	async trackRedirect(shortCode: string, data: ClickData): Promise<void> {
		try {
			this.analytics.writeDataPoint({
				blobs: [shortCode, data.country, data.userAgent, data.referrer],
				doubles: [Date.now()],
				indexes: [data.ipHash]
			});
		} catch (error) {
			console.error('Analytics tracking error:', error);
		}
	}
}

/**
 * Console Analytics Adapter (Local Development)
 */
export class ConsoleAnalyticsAdapter implements AnalyticsAdapter {
	async trackRedirect(shortCode: string, data: ClickData): Promise<void> {
		console.log('[Analytics]', {
			shortCode,
			country: data.country,
			userAgent: data.userAgent,
			referrer: data.referrer,
			timestamp: new Date().toISOString()
		});
	}
}
