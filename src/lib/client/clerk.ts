import { browser } from '$app/environment';
import type { User } from '@clerk/backend';

const DEFAULT_TIMEOUT_MS = 10_000;
let clerkScriptPromise: Promise<NonNullable<Window['Clerk']>> | null = null;
let clerkReadyPromise: Promise<NonNullable<Window['Clerk']>> | null = null;

function getClerkInstance() {
	if (!browser) return null;
	return window.Clerk ?? null;
}

function getClerkClient() {
	const clerk = getClerkInstance();
	return clerk?.client ? clerk : null;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error(message));
		}, timeoutMs);

		void promise.then(
			(value) => {
				clearTimeout(timeoutId);
				resolve(value);
			},
			(error) => {
				clearTimeout(timeoutId);
				reject(error);
			}
		);
	});
}

export function waitForClerkScript(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<NonNullable<Window['Clerk']>> {
	const existing = getClerkInstance();
	if (existing) return Promise.resolve(existing);

	if (!browser) {
		return Promise.reject(new Error('Clerk is only available in the browser'));
	}

	if (!clerkScriptPromise) {
		clerkScriptPromise = new Promise((resolve, reject) => {
			const intervalId = setInterval(() => {
				const clerk = getClerkInstance();
				if (clerk) {
					clearInterval(intervalId);
					clearTimeout(timeoutId);
					resolve(clerk);
				}
			}, 50);

			const timeoutId = setTimeout(() => {
				clearInterval(intervalId);
				clerkScriptPromise = null;
				reject(new Error('Clerk script failed to load'));
			}, timeoutMs);
		});
	}

	return clerkScriptPromise;
}

export function initializeClerk(
	options: Parameters<NonNullable<Window['Clerk']>['load']>[0],
	timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<NonNullable<Window['Clerk']>> {
	const existing = getClerkClient();
	if (existing) return Promise.resolve(existing);

	if (clerkReadyPromise) {
		return clerkReadyPromise;
	}

	clerkReadyPromise = (async () => {
		const clerk = await waitForClerkScript(timeoutMs);
		if (!clerk.client) {
			await withTimeout(clerk.load(options), timeoutMs, 'Clerk initialization timed out');
		}
		return clerk;
	})().catch((error) => {
		clerkReadyPromise = null;
		throw error;
	});

	return clerkReadyPromise;
}

export function waitForClerk(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<NonNullable<Window['Clerk']>> {
	const existing = getClerkClient();
	if (existing) return Promise.resolve(existing);

	if (!browser) {
		return Promise.reject(new Error('Clerk is only available in the browser'));
	}

	if (clerkReadyPromise) {
		return clerkReadyPromise;
	}

	return new Promise((resolve, reject) => {
		const intervalId = setInterval(() => {
			const clerk = getClerkClient();
			if (clerk) {
				clearInterval(intervalId);
				clearTimeout(timeoutId);
				resolve(clerk);
			}
		}, 50);

		const timeoutId = setTimeout(() => {
			clearInterval(intervalId);
			reject(new Error('Clerk failed to initialize'));
		}, timeoutMs);
	});
}

export function getClerkUser(): User | null {
	return getClerkClient()?.user ?? null;
}

export function subscribeToClerkState(
	callback: (state: { user: User | null; session: ClerkSession | null }) => void
): () => void {
	const clerk = getClerkClient();
	if (!clerk) {
		return () => undefined;
	}

	return clerk.addListener(({ user, session }) => {
		callback({ user, session });
	});
}
