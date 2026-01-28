import { type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { authHandle } from '$lib/server/auth-handle';

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

export const handle: Handle = sequence(
	// @ts-expect-error - callback pattern is valid but types might be strict
	Sentry.initCloudflareSentryHandle((event) => ({
		dsn: event.platform?.env?.SENTRY_DSN,
		sendDefaultPii: true
	})),
	Sentry.sentryHandle(),
	authHandle
);
