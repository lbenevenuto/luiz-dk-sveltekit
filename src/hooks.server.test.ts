import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { buildCspDirectives, resolveSentryDsn } from './hooks.server';

describe('hooks security helpers', () => {
	const originalSentryDsn = process.env.SENTRY_DSN;

	beforeEach(() => {
		process.env.SENTRY_DSN = originalSentryDsn;
	});

	afterEach(() => {
		process.env.SENTRY_DSN = originalSentryDsn;
	});

	it('builds CSP with valid Clerk domain and no malformed connect host', () => {
		const directives = buildCspDirectives({
			clerkFrontendApi: 'just-spider-44.clerk.accounts.dev',
			sentryDsn: 'https://abc@example.ingest.us.sentry.io/123'
		});

		const connectSrc = directives.find((value) => value.startsWith('connect-src'));
		expect(connectSrc).toBeDefined();
		expect(connectSrc).toContain('https://just-spider-44.clerk.accounts.dev');
		expect(connectSrc).not.toContain('https://clerk.just-spider-44.clerk.accounts.dev');
		expect(connectSrc).toContain('https://example.ingest.us.sentry.io');
	});

	it('falls back to wildcard Clerk host when frontend api is missing', () => {
		const directives = buildCspDirectives({});
		const scriptSrc = directives.find((value) => value.startsWith('script-src'));
		const frameSrc = directives.find((value) => value.startsWith('frame-src'));

		expect(scriptSrc).toContain('https://*.clerk.accounts.dev');
		expect(frameSrc).toContain('https://*.clerk.accounts.dev');
	});

	it('omits sentry host when DSN is invalid', () => {
		const directives = buildCspDirectives({
			clerkFrontendApi: 'just-spider-44.clerk.accounts.dev',
			sentryDsn: 'invalid-dsn'
		});

		const connectSrc = directives.find((value) => value.startsWith('connect-src'));
		expect(connectSrc).toBeDefined();
		expect(connectSrc).not.toContain('invalid-dsn');
	});

	it('prefers platform SENTRY_DSN over process env fallback', () => {
		process.env.SENTRY_DSN = 'https://fallback@fallback.ingest.sentry.io/1';

		const resolved = resolveSentryDsn({
			SENTRY_DSN: 'https://platform@platform.ingest.sentry.io/2'
		} as App.Platform['env']);

		expect(resolved).toBe('https://platform@platform.ingest.sentry.io/2');
	});

	it('falls back to process env when platform env is missing', () => {
		process.env.SENTRY_DSN = 'https://fallback@fallback.ingest.sentry.io/1';
		expect(resolveSentryDsn(undefined)).toBe('https://fallback@fallback.ingest.sentry.io/1');
	});
});
