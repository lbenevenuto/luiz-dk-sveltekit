import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ dev: false }));
vi.mock('$lib/server/db/client', () => ({
	createD1Client: vi.fn(async () => 'd1-client'),
	createSQLiteClient: vi.fn()
}));

import { getAnalyticsAdapter, getCacheAdapter, getDatabaseAdapter, getIdGeneratorAdapter } from './factory';
import { KVAdapter } from './cache';
import { CloudflareAnalyticsAdapter, ConsoleAnalyticsAdapter } from './analytics';
import { DurableObjectIdGenerator } from './id-generator';
import type { DrizzleClient } from '$lib/server/db/client';

const platform = {
	env: {
		CACHE: {},
		DB: {},
		ANALYTICS: { writeDataPoint: vi.fn() },
		GLOBAL_COUNTER_DO: { idFromName: vi.fn(() => 'id'), get: vi.fn(() => ({ nextValue: vi.fn() })) }
	}
} as unknown as App.Platform;

describe('adapter factory (production)', () => {
	it('throws when the platform is missing', async () => {
		await expect(getCacheAdapter(undefined)).rejects.toThrow('Platform not found');
		await expect(getDatabaseAdapter(undefined)).rejects.toThrow('Platform not found');
		await expect(getIdGeneratorAdapter(undefined, {} as DrizzleClient)).rejects.toThrow('Platform not found');
		expect(() => getAnalyticsAdapter(undefined)).toThrow('Platform not found');
	});

	it('returns the Cloudflare-backed adapters', async () => {
		expect(await getCacheAdapter(platform)).toBeInstanceOf(KVAdapter);
		expect(await getDatabaseAdapter(platform)).toBe('d1-client');
		expect(await getIdGeneratorAdapter(platform, {} as DrizzleClient)).toBeInstanceOf(DurableObjectIdGenerator);
		expect(getAnalyticsAdapter(platform)).toBeInstanceOf(CloudflareAnalyticsAdapter);
	});

	it('falls back to console analytics when the binding is missing', () => {
		const noAnalytics = { env: { ...platform.env, ANALYTICS: undefined } } as unknown as App.Platform;
		expect(getAnalyticsAdapter(noAnalytics)).toBeInstanceOf(ConsoleAnalyticsAdapter);
	});
});
