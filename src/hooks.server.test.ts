import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { buildCspDirectives, requestIdHook, resolveSentryDsn, securityHeadersHandle } from './hooks.server';
import { requestContext } from '$lib/server/logger';

describe('hooks security helpers', () => {
	const originalSentryDsn = process.env.SENTRY_DSN;

	beforeEach(() => {
		(process.env as unknown as Record<string, string | undefined>).SENTRY_DSN = originalSentryDsn;
	});

	afterEach(() => {
		(process.env as unknown as Record<string, string | undefined>).SENTRY_DSN = originalSentryDsn;
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
		(process.env as unknown as Record<string, string>).SENTRY_DSN = 'https://fallback@fallback.ingest.sentry.io/1';

		const resolved = resolveSentryDsn({
			SENTRY_DSN: 'https://platform@platform.ingest.sentry.io/2'
		} as unknown as App.Platform['env']);

		expect(resolved).toBe('https://platform@platform.ingest.sentry.io/2');
	});

	it('falls back to process env when platform env is missing', () => {
		(process.env as unknown as Record<string, string>).SENTRY_DSN = 'https://fallback@fallback.ingest.sentry.io/1';
		expect(resolveSentryDsn(undefined)).toBe('https://fallback@fallback.ingest.sentry.io/1');
	});

	it('adds a request id header and exposes it through async local storage', async () => {
		const response = await requestIdHook({
			event: {
				locals: {} as App.Locals
			} as Parameters<typeof requestIdHook>[0]['event'],
			resolve: async () => {
				const store = requestContext.getStore();
				return new Response(store?.requestId ?? 'missing');
			}
		});

		expect(response.headers.get('X-Request-Id')).toBeTruthy();
		expect(await response.text()).toBe(response.headers.get('X-Request-Id'));
	});

	it('applies expected security headers', async () => {
		const response = await securityHeadersHandle({
			event: {
				platform: {
					env: {
						CLERK_FRONTEND_API: 'frontend.clerk.accounts.dev',
						SENTRY_DSN: 'https://platform@platform.ingest.sentry.io/2'
					}
				} as App.Platform
			} as Parameters<typeof securityHeadersHandle>[0]['event'],
			resolve: async () => new Response('ok')
		});

		expect(response.headers.get('X-Frame-Options')).toBe('DENY');
		expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
		expect(response.headers.get('Content-Security-Policy')).toContain('frontend.clerk.accounts.dev');
		expect(response.headers.get('Content-Security-Policy')).toContain('platform.ingest.sentry.io');
	});
});
