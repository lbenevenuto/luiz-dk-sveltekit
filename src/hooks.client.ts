import { PUBLIC_SENTRY_DSN } from '$env/static/public';
import * as Sentry from '@sentry/sveltekit';
import type { HandleClientError } from '@sveltejs/kit';

Sentry.init({
	dsn: PUBLIC_SENTRY_DSN,
	sendDefaultPii: true
});

const myErrorHandler: HandleClientError = ({ error }) => {
	console.error('Client error', {
		name: error instanceof Error ? error.name : 'UnknownError',
		message: error instanceof Error ? error.message : String(error)
	});
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);
