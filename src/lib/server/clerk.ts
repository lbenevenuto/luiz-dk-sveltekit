import { createClerkClient } from '@clerk/backend';

export function getClerkClient(env: App.Platform['env']) {
	return createClerkClient({
		secretKey: env.CLERK_SECRET_KEY,
		publishableKey: env.CLERK_PUBLISHABLE_KEY
	});
}
