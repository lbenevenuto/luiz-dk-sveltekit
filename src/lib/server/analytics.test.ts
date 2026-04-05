import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseBrowser } from './analytics';

vi.mock('$app/environment', () => ({
	dev: true
}));

vi.mock('$lib/server/logger', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

async function loadAnalyticsModule(isDev: boolean) {
	vi.doMock('$app/environment', () => ({ dev: isDev }));
	const mod = await import('./analytics');
	return mod;
}

describe('parseBrowser', () => {
	it('detects Chrome', () => {
		expect(
			parseBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')
		).toBe('Chrome');
	});

	it('detects Edge (contains Chrome and Edg)', () => {
		expect(
			parseBrowser(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
			)
		).toBe('Edge');
	});

	it('detects Firefox', () => {
		expect(parseBrowser('Mozilla/5.0 (Windows NT 10.0; rv:121.0) Gecko/20100101 Firefox/121.0')).toBe('Firefox');
	});

	it('detects Safari (without Chrome)', () => {
		expect(parseBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15')).toBe(
			'Safari'
		);
	});

	it('detects Opera', () => {
		expect(
			parseBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 OPR/106.0.0.0')
		).toBe('Opera');
	});

	it('detects bots', () => {
		expect(parseBrowser('Googlebot/2.1 (+http://www.google.com/bot.html)')).toBe('Bot');
		expect(parseBrowser('Mozilla/5.0 (compatible; bingbot/2.0)')).toBe('Bot');
		expect(parseBrowser('Twitterbot/1.0')).toBe('Bot');
	});

	it('returns Unknown for empty or Unknown UA', () => {
		expect(parseBrowser('')).toBe('Unknown');
		expect(parseBrowser('Unknown')).toBe('Unknown');
	});

	it('returns Other for unrecognized UA', () => {
		expect(parseBrowser('curl/7.68.0')).toBe('Other');
	});
});

describe('sanitizeShortCodes', () => {
	it('filters invalid short codes via fetchChartAnalytics', async () => {
		vi.resetModules();
		const { fetchChartAnalytics } = await loadAnalyticsModule(true);
		const platform = {
			env: {
				CLOUDFLARE_ACCOUNT_ID: 'test',
				CLOUDFLARE_API_TOKEN_ANALYTICS: 'token'
			}
		} as unknown as App.Platform;

		// All codes are invalid (contain special chars)
		const result = await fetchChartAnalytics(platform, {
			days: 7,
			shortCodes: ["'; DROP TABLE--", '<script>']
		});

		// Should return empty since all codes were sanitized out
		expect(result.charts).toBeUndefined();
	});
});

describe('fetchChartAnalytics', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
		vi.resetModules();
	});

	it('returns empty result without error in dev when credentials are missing', async () => {
		const { fetchChartAnalytics } = await loadAnalyticsModule(true);
		const result = await fetchChartAnalytics(undefined, { days: 7 });
		expect(result.charts).toBeUndefined();
		expect(result.error).toBeUndefined();
	});

	it('returns error in production when credentials are missing', async () => {
		const { fetchChartAnalytics } = await loadAnalyticsModule(false);
		const result = await fetchChartAnalytics(undefined, { days: 7 });
		expect(result.charts).toBeUndefined();
		expect(result.error).toBe('Cloudflare credentials not configured');
	});

	it('normalizes days to allowed values', async () => {
		const { fetchChartAnalytics } = await loadAnalyticsModule(true);
		const emptyResponse = () => new Response(JSON.stringify({ meta: [], data: [], rows: 0 }), { status: 200 });
		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(emptyResponse()));

		const platform = {
			env: {
				CLOUDFLARE_ACCOUNT_ID: 'test',
				CLOUDFLARE_API_TOKEN_ANALYTICS: 'token'
			}
		} as unknown as App.Platform;

		await fetchChartAnalytics(platform, { days: 15 });

		expect(fetchSpy).toHaveBeenCalledOnce();
		const body = fetchSpy.mock.calls[0][1]?.body as string;
		expect(body).toContain("INTERVAL '7' DAY");
	});

	it('returns chart data on successful fetch', async () => {
		const { fetchChartAnalytics } = await loadAnalyticsModule(true);
		const row = {
			shortCode: 'abc',
			country: 'US',
			userAgent: 'Chrome/120',
			referrer: 'https://google.com',
			timestamp: new Date().toISOString()
		};

		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(JSON.stringify({ meta: [], data: [row], rows: 1 }), { status: 200 })
		);

		const platform = {
			env: {
				CLOUDFLARE_ACCOUNT_ID: 'test',
				CLOUDFLARE_API_TOKEN_ANALYTICS: 'token'
			}
		} as unknown as App.Platform;

		const result = await fetchChartAnalytics(platform, { days: 7 });

		expect(result.charts).toBeDefined();
		expect(result.charts!.countries).toEqual([{ label: 'US', value: 1 }]);
	});

	it('returns error on fetch failure', async () => {
		const { fetchChartAnalytics } = await loadAnalyticsModule(true);
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Server error', { status: 500 }));

		const platform = {
			env: {
				CLOUDFLARE_ACCOUNT_ID: 'test',
				CLOUDFLARE_API_TOKEN_ANALYTICS: 'token'
			}
		} as unknown as App.Platform;

		const result = await fetchChartAnalytics(platform, { days: 7 });

		expect(result.charts).toBeUndefined();
		expect(result.error).toBe('Failed to fetch analytics data');
	});
});

describe('fetchAnalyticsLog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
		vi.resetModules();
	});

	it('returns paginated log rows', async () => {
		const { fetchAnalyticsLog } = await loadAnalyticsModule(true);
		const row = {
			shortCode: 'abc',
			country: 'US',
			userAgent: 'Chrome/120',
			referrer: 'https://google.com',
			ipHash: 'hash1',
			timestamp: new Date().toISOString()
		};

		vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
			const body = (init?.body as string) ?? '';
			if (body.includes('count()')) {
				return Promise.resolve(
					new Response(JSON.stringify({ meta: [], data: [{ total: 42 }], rows: 1 }), { status: 200 })
				);
			}
			return Promise.resolve(new Response(JSON.stringify({ meta: [], data: [row], rows: 1 }), { status: 200 }));
		});

		const platform = {
			env: {
				CLOUDFLARE_ACCOUNT_ID: 'test',
				CLOUDFLARE_API_TOKEN_ANALYTICS: 'token'
			}
		} as unknown as App.Platform;

		const result = await fetchAnalyticsLog(platform, { days: 7, page: 1, pageSize: 10 });

		expect(result.rows).toHaveLength(1);
		expect(result.rows[0].shortCode).toBe('abc');
		expect(result.totalRows).toBe(42);
		expect(result.totalPages).toBe(5);
		expect(result.page).toBe(1);
		expect(result.pageSize).toBe(10);
	});

	it('returns empty on fetch failure', async () => {
		const { fetchAnalyticsLog } = await loadAnalyticsModule(true);
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Server error', { status: 500 }));

		const platform = {
			env: {
				CLOUDFLARE_ACCOUNT_ID: 'test',
				CLOUDFLARE_API_TOKEN_ANALYTICS: 'token'
			}
		} as unknown as App.Platform;

		const result = await fetchAnalyticsLog(platform, { days: 7 });

		expect(result.rows).toEqual([]);
		expect(result.error).toBe('Failed to fetch analytics data');
	});
});
