import { logger } from '$lib/server/logger';

interface AnalyticsRow {
	shortCode: string;
	country: string;
	userAgent: string;
	referrer: string;
	ipHash: string;
	timestamp: string;
}

interface SqlApiResponse {
	meta: { name: string; type: string }[];
	data: AnalyticsRow[];
	rows: number;
}

type AnalyticsResult = {
	analytics: Array<AnalyticsRow & { id: string }>;
	charts:
		| {
				daily: Array<{ date: string; count: number }>;
				countries: Array<{ label: string; value: number }>;
				browsers: Array<{ label: string; value: number }>;
				referrers: Array<{ label: string; value: number }>;
		  }
		| undefined;
	error?: string;
};

const SHORT_CODE_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;
const ALLOWED_DAYS = new Set([7, 30, 90]);

function normalizeDays(days: number): number {
	return ALLOWED_DAYS.has(days) ? days : 7;
}

function sanitizeShortCodes(shortCodes?: string[]): string[] | undefined {
	if (!shortCodes) {
		return undefined;
	}

	const unique = new Set<string>();
	for (const shortCode of shortCodes) {
		if (SHORT_CODE_REGEX.test(shortCode)) {
			unique.add(shortCode);
		}
	}

	return Array.from(unique);
}

function aggregateAnalytics(analytics: Array<AnalyticsRow & { id: string }>, days: number) {
	const dailyClicks = new Map<string, number>();
	const countryStats = new Map<string, number>();
	const browserStats = new Map<string, number>();
	const referrerStats = new Map<string, number>();

	for (let i = 0; i < days; i++) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		dailyClicks.set(d.toISOString().split('T')[0], 0);
	}

	for (const row of analytics) {
		const date = row.timestamp.split('T')[0];
		if (dailyClicks.has(date)) {
			dailyClicks.set(date, (dailyClicks.get(date) || 0) + 1);
		}

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
			if (referrer !== 'Direct') {
				referrer = new URL(referrer).hostname;
			}
		} catch {
			// ignored
		}
		referrerStats.set(referrer, (referrerStats.get(referrer) || 0) + 1);
	}

	const sortAndLimit = (map: Map<string, number>, limit: number) =>
		Array.from(map.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, limit);

	return {
		daily: Array.from(dailyClicks.entries())
			.sort()
			.map(([date, count]) => ({ date, count })),
		countries: sortAndLimit(countryStats, 5).map(([label, value]) => ({ label, value })),
		browsers: sortAndLimit(browserStats, 5).map(([label, value]) => ({ label, value })),
		referrers: sortAndLimit(referrerStats, 5).map(([label, value]) => ({ label, value }))
	};
}

export async function fetchAnalytics(
	platform: App.Platform | undefined,
	options: { days: number; shortCodes?: string[] }
): Promise<AnalyticsResult> {
	if (!platform?.env.CLOUDFLARE_ACCOUNT_ID || !platform?.env.CLOUDFLARE_API_TOKEN_ANALYTICS) {
		return {
			analytics: [],
			charts: undefined,
			error: 'Cloudflare credentials not configured'
		};
	}

	const days = normalizeDays(options.days);
	const sanitizedShortCodes = sanitizeShortCodes(options.shortCodes);

	if (options.shortCodes && sanitizedShortCodes && sanitizedShortCodes.length === 0) {
		return {
			analytics: [],
			charts: undefined
		};
	}

	const filters = [`timestamp > NOW() - INTERVAL '${days}' DAY`];
	if (sanitizedShortCodes && sanitizedShortCodes.length > 0) {
		const codesList = sanitizedShortCodes.map((code) => `'${code}'`).join(',');
		filters.push(`blob1 IN (${codesList})`);
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
		WHERE ${filters.join(' AND ')}
		ORDER BY timestamp DESC
		LIMIT 1000
	`;

	try {
		const response = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${platform.env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${platform.env.CLOUDFLARE_API_TOKEN_ANALYTICS}`
				},
				body: `${sql} FORMAT JSON`
			}
		);

		if (!response.ok) {
			const text = await response.text();
			logger.error('analytics.sql_error', { status: response.status, body: text });
			throw new Error(`Failed to fetch analytics data: ${response.statusText}`);
		}

		const result = (await response.json()) as SqlApiResponse;
		const analytics = result.data.map((row) => ({
			...row,
			id: crypto.randomUUID(),
			timestamp: new Date(row.timestamp).toISOString()
		}));

		return {
			analytics,
			charts: aggregateAnalytics(analytics, days)
		};
	} catch (error) {
		logger.error('analytics.fetch_error', {
			error: error instanceof Error ? error.message : String(error)
		});

		return {
			analytics: [],
			charts: undefined,
			error: 'Failed to fetch analytics data'
		};
	}
}
