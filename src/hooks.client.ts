import * as Sentry from '@sentry/sveltekit';
import type { HandleClientError } from '@sveltejs/kit';

Sentry.init({
	dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
	// Adds request headers and IP for users, for more info visit:
	// https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
	sendDefaultPii: true
});

const myErrorHandler: HandleClientError = ({ error, event }) => {
	console.error('An error occurred on the client side:', error, event);
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);
