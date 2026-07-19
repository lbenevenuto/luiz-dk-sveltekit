import { logger } from '$lib/server/logger';

export interface ClickData {
	ipHash: string;
	userAgent: string;
	referrer: string;
	country: string;
}

export async function trackRedirect(
	platform: Readonly<App.Platform> | undefined,
	shortCode: string,
	data: ClickData
): Promise<void> {
	if (platform?.env.ANALYTICS) {
		try {
			platform.env.ANALYTICS.writeDataPoint({
				blobs: [shortCode, data.country, data.userAgent, data.referrer],
				doubles: [Date.now()],
				indexes: [data.ipHash]
			});
		} catch (error) {
			logger.error('analytics.track_failed', {
				shortCode,
				error: error instanceof Error ? error.message : String(error)
			});
		}
		return;
	}

	logger.info('analytics.track_local', {
		shortCode,
		country: data.country,
		userAgent: data.userAgent,
		referrer: data.referrer,
		timestamp: new Date().toISOString()
	});
}
