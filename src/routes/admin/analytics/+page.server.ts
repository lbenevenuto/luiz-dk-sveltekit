import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform?.env.CLOUDFLARE_ACCOUNT_ID || !platform?.env.CLOUDFLARE_API_TOKEN_ANALYTICS) {
		return {
			analytics: [],
			error: 'Cloudflare credentials not configured'
		};
	}

	const accountId = platform.env.CLOUDFLARE_ACCOUNT_ID;
	const apiToken = platform.env.CLOUDFLARE_API_TOKEN_ANALYTICS;

	const sql = `
        SELECT
            blob1 as shortCode,
            blob2 as country,
            blob3 as userAgent,
            blob4 as referrer,
            index1 as ipHash,
            toDateTime(double1 / 1000) as timestamp
        FROM luiz_dk_analytics
        WHERE timestamp > NOW() - INTERVAL '7' DAY
        ORDER BY timestamp DESC
        LIMIT 100
    `;

	try {
		const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiToken}`
			},
			body: sql + ' FORMAT JSON'
		});

		if (!response.ok) {
			const text = await response.text();
			console.error('Analytics SQL Error:', text);
			throw error(500, `Failed to fetch analytics data: ${response.statusText}`);
		}

		interface SqlApiResponse {
			meta: { name: string; type: string }[];
			data: {
				shortCode: string;
				country: string;
				userAgent: string;
				referrer: string;
				ipHash: string;
				timestamp: string;
			}[];
			rows: number;
		}

		const result = (await response.json()) as SqlApiResponse;

		const analytics = result.data.map((row) => ({
			...row,
			id: crypto.randomUUID(),
			timestamp: new Date(row.timestamp).toISOString()
		}));

		// Aggregations for charts
		const dailyClicks = new Map<string, number>();
		const countryStats = new Map<string, number>();
		const browserStats = new Map<string, number>();
		const referrerStats = new Map<string, number>();

		// Initialize last 7 days with 0
		for (let i = 0; i < 7; i++) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			dailyClicks.set(d.toISOString().split('T')[0], 0);
		}

		analytics.forEach((row) => {
			// Daily Clicks
			const date = row.timestamp.split('T')[0];
			if (dailyClicks.has(date)) {
				dailyClicks.set(date, (dailyClicks.get(date) || 0) + 1);
			}

			// Country Stats
			const country = row.country || 'Unknown';
			countryStats.set(country, (countryStats.get(country) || 0) + 1);

			// Browser Stats
			const ua = row.userAgent || 'Unknown';
			let browser = 'Other';
			if (ua.includes('Chrome')) browser = 'Chrome';
			else if (ua.includes('Firefox')) browser = 'Firefox';
			else if (ua.includes('Safari')) browser = 'Safari';
			else if (ua.includes('Edge')) browser = 'Edge';
			else if (ua.includes('bot')) browser = 'Bot';
			browserStats.set(browser, (browserStats.get(browser) || 0) + 1);

			// Referrer Stats
			let referrer = row.referrer || 'Direct';
			try {
				if (referrer !== 'Direct') {
					referrer = new URL(referrer).hostname;
				}
			} catch {
				// Keep original if parsing fails
			}
			referrerStats.set(referrer, (referrerStats.get(referrer) || 0) + 1);
		});

		const sortAndLimit = (map: Map<string, number>, limit: number) =>
			Array.from(map.entries())
				.sort((a, b) => b[1] - a[1])
				.slice(0, limit);

		return {
			analytics,
			charts: {
				daily: Array.from(dailyClicks.entries())
					.sort()
					.map(([date, count]) => ({ date, count })),
				countries: sortAndLimit(countryStats, 5).map(([label, value]) => ({ label, value })),
				browsers: sortAndLimit(browserStats, 5).map(([label, value]) => ({ label, value })),
				referrers: sortAndLimit(referrerStats, 5).map(([label, value]) => ({ label, value }))
			}
		};
	} catch (err) {
		console.error('Analytics Fetch Error:', err);
		return {
			analytics: [],
			error: 'Failed to fetch analytics data'
		};
	}
};
