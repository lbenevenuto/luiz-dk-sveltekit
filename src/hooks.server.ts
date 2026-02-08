import { dev } from '$app/environment';
import { type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { authHandle } from '$lib/server/auth-handle';
import { logger } from '$lib/server/logger';

let envValidated = false;
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

export const initialHook: Handle = async ({ event, resolve }) => {
	if (!envValidated) {
		validateEnv(event.platform?.env);
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

	// CSP: allow Clerk external script, inline styles (Tailwind), and Sentry
	const clerkDomain = event.platform?.env?.CLERK_FRONTEND_API || '*.clerk.accounts.dev';
	const sentryDsn = event.platform?.env?.SENTRY_DSN || '';
	let sentryHost = '';
	try {
		if (sentryDsn) sentryHost = new URL(sentryDsn).hostname;
	} catch {
		// ignore invalid DSN
	}

	const cspDirectives = [
		"default-src 'self'",
		`script-src 'self' https://${clerkDomain} https://challenges.cloudflare.com 'unsafe-inline'`,
		"style-src 'self' 'unsafe-inline'",
		`img-src 'self' data: https://img.clerk.com https://*.clerk.com`,
		`connect-src 'self' https://${clerkDomain} https://clerk.${clerkDomain}${sentryHost ? ` https://${sentryHost}` : ''}`,
		"font-src 'self'",
		`frame-src https://${clerkDomain} https://challenges.cloudflare.com`,
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'"
	];

	response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

	return response;
};

export const handle: Handle = sequence(
	initialHook,
	Sentry.initCloudflareSentryHandle({
		dsn: process.env.SENTRY_DSN,
		sendDefaultPii: true
	}),
	Sentry.sentryHandle(),
	authHandle,
	securityHeadersHandle
);
