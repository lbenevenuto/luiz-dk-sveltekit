import { dev } from '$app/environment';
import { type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { authHandle } from '$lib/server/auth-handle';
import { logger } from '$lib/server/logger';

let envValidated = false;
let sentryInitialized = false;

function validateEnv(env?: App.Platform['env']) {
	if (envValidated || !env) return;

	const missing = [];
	if (!env.SALT) missing.push('SALT');
	if (!env.BASE_URL) missing.push('BASE_URL');

	if (missing.length) {
		const message = `[config] Missing required env vars: ${missing.join(', ')}`;
		if (dev) {
			logger.warn(message);
		} else {
			throw new Error(message);
		}
	}
	envValidated = true;
}

const myErrorHandler: HandleServerError = ({ error, event }) => {
	logger.error('server.error', {
		error:
			error instanceof Error
				? {
						message: error.message,
						name: error.name
					}
				: String(error),
		event: {
			path: event.url.pathname,
			route: event.route.id,
			method: event.request.method
		}
	});
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);

function normalizeHost(input?: string): string | undefined {
	if (!input) return undefined;
	const trimmed = input.trim();
	if (!trimmed) return undefined;

	try {
		const normalized = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`);
		return normalized.hostname || undefined;
	} catch {
		return undefined;
	}
}

export function resolveSentryDsn(env?: App.Platform['env']): string | undefined {
	return env?.SENTRY_DSN || process.env.SENTRY_DSN || undefined;
}

function getSentryHostFromDsn(dsn?: string): string | undefined {
	if (!dsn) return undefined;

	try {
		return new URL(dsn).hostname;
	} catch {
		return undefined;
	}
}

export function buildCspDirectives(input: { clerkFrontendApi?: string; sentryDsn?: string }): string[] {
	const clerkHost = normalizeHost(input.clerkFrontendApi) || '*.clerk.accounts.dev';
	const sentryHost = getSentryHostFromDsn(input.sentryDsn);

	const clerkSource = `https://${clerkHost}`;
	const connectSources = ["'self'", clerkSource];
	if (sentryHost) {
		connectSources.push(`https://${sentryHost}`);
	}

	return [
		"default-src 'self'",
		`script-src 'self' ${clerkSource} https://challenges.cloudflare.com 'unsafe-inline'`,
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: https://img.clerk.com https://*.clerk.com",
		`connect-src ${connectSources.join(' ')}`,
		"font-src 'self'",
		`frame-src ${clerkSource} https://challenges.cloudflare.com`,
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'"
	];
}

export const initialHook: Handle = async ({ event, resolve }) => {
	if (!envValidated) {
		validateEnv(event.platform?.env);
	}
	return resolve(event);
};

export const sentryInitHandle: Handle = async ({ event, resolve }) => {
	if (!sentryInitialized) {
		const dsn = resolveSentryDsn(event.platform?.env);
		if (dsn) {
			if (dev) {
				Sentry.init({
					dsn,
					sendDefaultPii: true
				});
			} else {
				Sentry.initCloudflareSentryHandle({
					dsn,
					tracesSampleRate: 1.0,
					sendDefaultPii: true
				});
			}
		}
		sentryInitialized = true;
	}
	return resolve(event);
};

export const securityHeadersHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

	const cspDirectives = buildCspDirectives({
		clerkFrontendApi: event.platform?.env?.CLERK_FRONTEND_API,
		sentryDsn: resolveSentryDsn(event.platform?.env)
	});

	response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

	return response;
};

export const handle: Handle = sequence(
	initialHook,
	sentryInitHandle,
	Sentry.sentryHandle(),
	authHandle,
	securityHeadersHandle
);
