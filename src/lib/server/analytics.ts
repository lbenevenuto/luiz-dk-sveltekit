import { dev } from '$app/environment';
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

export type ChartData = {
	daily: Array<{ date: string; count: number }>;
	countries: Array<{ label: string; value: number }>;
	browsers: Array<{ label: string; value: number }>;
	referrers: Array<{ label: string; value: number }>;
};

export type ChartResult = {
	charts: ChartData | undefined;
	error?: string;
};

export type LogResult = {
	rows: Array<AnalyticsRow & { id: string }>;
	totalRows: number;
	page: number;
	pageSize: number;
	totalPages: number;
	error?: string;
};

const SHORT_CODE_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;
const ALLOWED_DAYS = new Set([7, 30, 90, 180]);

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

export function parseBrowser(ua: string): string {
	if (!ua || ua === 'Unknown') return 'Unknown';
	const lower = ua.toLowerCase();
	if (lower.includes('bot') || lower.includes('crawl') || lower.includes('spider')) return 'Bot';
	if (ua.includes('Edg')) return 'Edge';
	if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera';
	if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
	if (ua.includes('Firefox')) return 'Firefox';
	if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
	return 'Other';
}

function aggregateAnalytics(analytics: Array<AnalyticsRow & { id: string }>, days: number): ChartData {
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
		browserStats.set(parseBrowser(ua), (browserStats.get(parseBrowser(ua)) || 0) + 1);

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

function buildFilters(days: number, sanitizedShortCodes?: string[]): string[] {
	const filters = [`timestamp > NOW() - INTERVAL '${days}' DAY`];
	if (sanitizedShortCodes && sanitizedShortCodes.length > 0) {
		// NOTE: Cloudflare Analytics Engine SQL API does not support parameterized queries.
		// Short codes are validated against SHORT_CODE_REGEX (alphanumeric + _ and -) before interpolation.
		const codesList = sanitizedShortCodes.map((code) => `'${code}'`).join(',');
		filters.push(`blob1 IN (${codesList})`);
	}
	return filters;
}

async function queryAnalyticsEngine(platform: App.Platform, sql: string): Promise<SqlApiResponse> {
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

	return (await response.json()) as SqlApiResponse;
}

function prepareShortCodes(shortCodes?: string[]): { empty: boolean; sanitized: string[] | undefined } {
	const sanitized = sanitizeShortCodes(shortCodes);
	if (shortCodes && sanitized && sanitized.length === 0) {
		return { empty: true, sanitized };
	}
	return { empty: false, sanitized };
}

function checkPlatform(platform: App.Platform | undefined): string | null {
	if (!platform?.env.CLOUDFLARE_ACCOUNT_ID || !platform?.env.CLOUDFLARE_API_TOKEN_ANALYTICS) {
		if (dev) {
			logger.info('analytics.unconfigured_dev');
			return null;
		}
		return 'Cloudflare credentials not configured';
	}
	return null;
}

export async function fetchChartAnalytics(
	platform: App.Platform | undefined,
	options: { days: number; shortCodes?: string[] }
): Promise<ChartResult> {
	const configError = checkPlatform(platform);
	if (configError !== null || !platform) {
		return { charts: undefined, error: configError ?? undefined };
	}

	const days = normalizeDays(options.days);
	const { empty, sanitized } = prepareShortCodes(options.shortCodes);
	if (empty) return { charts: undefined };

	const filters = buildFilters(days, sanitized);
	const whereClause = filters.join(' AND ');

	const chartSql = `
		SELECT
			blob1 as shortCode,
			blob2 as country,
			blob3 as userAgent,
			blob4 as referrer,
			toDateTime(double1 / 1000) as timestamp
		FROM luiz_dk_analytics
		WHERE ${whereClause}
		ORDER BY timestamp DESC
		LIMIT 10000
	`;

	try {
		const chartResult = await queryAnalyticsEngine(platform, chartSql);
		const chartRows = chartResult.data.map((row) => ({
			...row,
			id: crypto.randomUUID(),
			timestamp: new Date(row.timestamp).toISOString()
		}));

		return { charts: aggregateAnalytics(chartRows, days) };
	} catch (error) {
		logger.error('analytics.chart_fetch_error', {
			error: error instanceof Error ? error.message : String(error)
		});
		return { charts: undefined, error: 'Failed to fetch analytics data' };
	}
}

export async function fetchAnalyticsLog(
	platform: App.Platform | undefined,
	options: { days: number; shortCodes?: string[]; page?: number; pageSize?: number }
): Promise<LogResult> {
	const emptyLog: LogResult = { rows: [], totalRows: 0, page: 1, pageSize: 10, totalPages: 0 };

	const configError = checkPlatform(platform);
	if (configError !== null || !platform) {
		return { ...emptyLog, error: configError ?? undefined };
	}

	const days = normalizeDays(options.days);
	const { empty, sanitized } = prepareShortCodes(options.shortCodes);
	if (empty) return emptyLog;

	const filters = buildFilters(days, sanitized);
	const whereClause = filters.join(' AND ');

	const MAX_OFFSET = 10000;
	const page = options.page ?? 1;
	const pageSize = options.pageSize ?? 10;
	const offset = (page - 1) * pageSize;

	if (offset > MAX_OFFSET) {
		return emptyLog;
	}

	const logSql = `
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
		LIMIT ${pageSize}
		OFFSET ${offset}
	`;

	const countSql = `
		SELECT count() as total
		FROM luiz_dk_analytics
		WHERE ${whereClause}
	`;

	try {
		const [logResult, countResult] = await Promise.all([
			queryAnalyticsEngine(platform, logSql),
			queryAnalyticsEngine(platform, countSql)
		]);

		const rows = logResult.data.map((row) => ({
			...row,
			id: crypto.randomUUID(),
			timestamp: new Date(row.timestamp).toISOString()
		}));

		const totalRows = Number((countResult.data as unknown as Array<{ total: number }>)[0]?.total ?? 0);

		return {
			rows,
			totalRows,
			page,
			pageSize,
			totalPages: Math.ceil(totalRows / pageSize)
		};
	} catch (error) {
		logger.error('analytics.log_fetch_error', {
			error: error instanceof Error ? error.message : String(error)
		});
		return { ...emptyLog, error: 'Failed to fetch analytics data' };
	}
}
