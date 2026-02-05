import type { PageServerLoad } from './$types';
import { urls } from '$lib/server/db/schemas';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

async function getAnalytics(platform: App.Platform | undefined, days: number, userShortCodes: string[]) {
	if (!platform?.env.CLOUDFLARE_ACCOUNT_ID || !platform?.env.CLOUDFLARE_API_TOKEN_ANALYTICS) {
		return {
			analytics: [],
			charts: undefined,
			error: 'Cloudflare credentials not configured'
		};
	}

	const accountId = platform.env.CLOUDFLARE_ACCOUNT_ID;
	const apiToken = platform.env.CLOUDFLARE_API_TOKEN_ANALYTICS;

	let whereClause = `timestamp > NOW() - INTERVAL '${days}' DAY`;
	if (userShortCodes.length > 0) {
		const codesList = userShortCodes.map((c) => `'${c}'`).join(',');
		whereClause += ` AND blob1 IN (${codesList})`;
	} else {
		return {
			analytics: [],
			charts: undefined
		};
	}

	const sql = `
        SELECT
            blob1 as shortCode,
            blob2 as country,
            blob3 as userAgent,
            blob4 as referrer,
            index1 as ipHash,
            toDateTime(double1 / 1000) as timestamp
        FROM luiz_dk_analytics
        WHERE ${whereClause}
        ORDER BY timestamp DESC
        LIMIT 1000
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
			throw new Error(`Failed to fetch analytics data: ${response.statusText}`);
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

		// Initialize last N days with 0
		for (let i = 0; i < days; i++) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			dailyClicks.set(d.toISOString().split('T')[0], 0);
		}

		analytics.forEach((row) => {
			const date = row.timestamp.split('T')[0];
			if (dailyClicks.has(date)) dailyClicks.set(date, (dailyClicks.get(date) || 0) + 1);

			const country = row.country || 'Unknown';
			countryStats.set(country, (countryStats.get(country) || 0) + 1);

			const ua = row.userAgent || 'Unknown';
			let browser = 'Other';
			if (ua.includes('Chrome')) browser = 'Chrome';
			else if (ua.includes('Firefox')) browser = 'Firefox';
			else if (ua.includes('Safari')) browser = 'Safari';
			else if (ua.includes('Edge')) browser = 'Edge';
			else if (ua.includes('bot')) browser = 'Bot';
			browserStats.set(browser, (browserStats.get(browser) || 0) + 1);

			let referrer = row.referrer || 'Direct';
			try {
				if (referrer !== 'Direct') referrer = new URL(referrer).hostname;
			} catch {
				// Ignore invalid URLs
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
			charts: undefined,
			error: 'Failed to fetch analytics data'
		};
	}
}

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	if (!locals.auth.userId) {
		throw redirect(302, '/login');
	}

	const daysParam = url.searchParams.get('days');
	let days = daysParam ? parseInt(daysParam) : 7;
	if (isNaN(days) || ![7, 30, 90].includes(days)) {
		days = 7;
	}

	let userShortCodes: string[] = [];
	try {
		const { getDb } = await import('$lib/server/db');
		const db = await getDb(platform);
		const userUrls = await db.select().from(urls).where(eq(urls.userId, locals.auth.userId));
		userShortCodes = userUrls.map((u) => u.shortCode);
	} catch (error) {
		console.error('Failed to fetch user urls:', error);
	}

	return {
		streamed: {
			analytics: getAnalytics(platform, days, userShortCodes)
		},
		days
	};
};
