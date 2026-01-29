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
	console.error(
		JSON.stringify({
			message: 'An error occurred on the server side',
			error:
				error instanceof Error
					? {
							message: error.message,
							stack: error.stack,
							name: error.name
						}
					: error,
			event: {
				url: event.url.href,
				route: event.route.id,
				params: event.params
			},
			timestamp: new Date().toISOString()
		})
	);
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);

export const initialHook: Handle = async ({ event, resolve }) => {
	if (!envValidated) {
		validateEnv(event.platform?.env);
	}
	return resolve(event);
};
export const finalHook: Handle = async ({ event, resolve }) => {
	console.log('Final hook');
	return resolve(event);
};

export const handle: Handle = sequence(
	initialHook,
	Sentry.initCloudflareSentryHandle({
		dsn: process.env.SENTRY_DSN,
		sendDefaultPii: true
	}),
	Sentry.sentryHandle(),
	authHandle,
	finalHook
);
