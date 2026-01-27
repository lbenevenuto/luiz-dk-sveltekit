import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://5852440bce4280c4f682558c65a35bb4@o4505868707495936.ingest.us.sentry.io/4510782741807104',

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});
