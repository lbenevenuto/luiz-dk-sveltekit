import { browser } from '$app/environment';

const DEFAULT_TIMEOUT_MS = 10_000;
let clerkReadyPromise: Promise<NonNullable<Window['Clerk']>> | null = null;

function getClerkClient() {
	if (!browser) return null;
	const clerk = window.Clerk;
	if (clerk?.client) return clerk;
	return null;
}

export function waitForClerk(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<NonNullable<Window['Clerk']>> {
	const existing = getClerkClient();
	if (existing) return Promise.resolve(existing);

	if (!browser) {
		return Promise.reject(new Error('Clerk is only available in the browser'));
	}

	if (!clerkReadyPromise) {
		clerkReadyPromise = new Promise((resolve, reject) => {
			let intervalId: ReturnType<typeof setInterval>;
			const timeoutId = setTimeout(() => {
				clearInterval(intervalId);
				clerkReadyPromise = null;
				reject(new Error('Clerk failed to load'));
			}, timeoutMs);

			intervalId = setInterval(() => {
				const clerk = getClerkClient();
				if (clerk) {
					clearInterval(intervalId);
					clearTimeout(timeoutId);
					resolve(clerk);
				}
			}, 50);
		});
	}

	return clerkReadyPromise;
}
