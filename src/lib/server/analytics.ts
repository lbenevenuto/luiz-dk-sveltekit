import { dev } from '$app/environment';
import { logger } from '$lib/server/logger';
import { ALLOWED_DAYS, DEFAULT_DAYS, SHORT_CODE_REGEX } from '$lib/utils/constants';
import { getErrorMessage } from '$lib/utils/validation';

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

function toRows(data: AnalyticsRow[]): Array<AnalyticsRow & { id: string }> {
	return data.map((row) => ({
		...row,
		id: crypto.randomUUID(),
		timestamp: new Date(row.timestamp).toISOString()
	}));
}

/**
 * Validate credentials, day range, and short-code filters up front.
 * Returns the query context, or `{ error? }` when the caller should return an empty result
 * without querying (missing credentials in dev, or no valid short code to match).
 */
function prepareQuery(
	platform: App.Platform | undefined,
	options: { days: number; shortCodes?: string[] }
): { context: { platform: App.Platform; whereClause: string; days: number } } | { error?: string } {
	if (!platform?.env.CLOUDFLARE_ACCOUNT_ID || !platform.env.CLOUDFLARE_API_TOKEN_ANALYTICS) {
		if (dev) {
			logger.info('analytics.unconfigured_dev');
			return {};
		}
		return { error: 'Cloudflare credentials not configured' };
	}

	const days = (ALLOWED_DAYS as readonly number[]).includes(options.days) ? options.days : DEFAULT_DAYS;

	let sanitized: string[] | undefined;
	if (options.shortCodes) {
		sanitized = [...new Set(options.shortCodes.filter((code) => SHORT_CODE_REGEX.test(code)))];
		// Every requested short code was rejected, so nothing can match.
		if (sanitized.length === 0) return {};
	}

	const filters = [`timestamp > NOW() - INTERVAL '${days}' DAY`];
	if (sanitized) {
		// NOTE: Cloudflare Analytics Engine SQL API does not support parameterized queries.
		// Short codes are validated against SHORT_CODE_REGEX (alphanumeric + _ and -) before interpolation.
		filters.push(`blob1 IN (${sanitized.map((code) => `'${code}'`).join(',')})`);
	}

	return { context: { platform, whereClause: filters.join(' AND '), days } };
}

export async function fetchChartAnalytics(
	platform: App.Platform | undefined,
	options: { days: number; shortCodes?: string[] }
): Promise<ChartResult> {
	const prepared = prepareQuery(platform, options);
	if (!('context' in prepared)) {
		return { charts: undefined, error: prepared.error };
	}
	const { platform: configured, whereClause, days } = prepared.context;

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
		const chartResult = await queryAnalyticsEngine(configured, chartSql);
		return { charts: aggregateAnalytics(toRows(chartResult.data), days) };
	} catch (error) {
		logger.error('analytics.chart_fetch_error', {
			error: getErrorMessage(error)
		});
		return { charts: undefined, error: 'Failed to fetch analytics data' };
	}
}

export async function fetchAnalyticsLog(
	platform: App.Platform | undefined,
	options: { days: number; shortCodes?: string[]; page?: number; pageSize?: number }
): Promise<LogResult> {
	const emptyLog: LogResult = { rows: [], totalRows: 0, page: 1, pageSize: 10, totalPages: 0 };

	const prepared = prepareQuery(platform, options);
	if (!('context' in prepared)) {
		return { ...emptyLog, error: prepared.error };
	}
	const { platform: configured, whereClause } = prepared.context;

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
			queryAnalyticsEngine(configured, logSql),
			queryAnalyticsEngine(configured, countSql)
		]);

		const totalRows = Number((countResult.data as unknown as Array<{ total: number }>)[0]?.total ?? 0);

		return {
			rows: toRows(logResult.data),
			totalRows,
			page,
			pageSize,
			totalPages: Math.ceil(totalRows / pageSize)
		};
	} catch (error) {
		logger.error('analytics.log_fetch_error', {
			error: getErrorMessage(error)
		});
		return { ...emptyLog, error: 'Failed to fetch analytics data' };
	}
}
