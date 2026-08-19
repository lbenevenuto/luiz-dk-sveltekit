import { browser } from '$app/environment';
import type { User } from '@clerk/backend';

type ClerkInstance = NonNullable<Window['Clerk']>;

const DEFAULT_TIMEOUT_MS = 10_000;
let clerkScriptPromise: Promise<ClerkInstance> | null = null;
let clerkReadyPromise: Promise<ClerkInstance> | null = null;

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

/** Poll `get` every 50ms until it yields a Clerk instance, rejecting with `message` after `timeoutMs`. */
function pollForClerk(get: () => ClerkInstance | null, timeoutMs: number, message: string): Promise<ClerkInstance> {
	return new Promise((resolve, reject) => {
		const intervalId = setInterval(() => {
			const clerk = get();
			if (clerk) {
				clearInterval(intervalId);
				clearTimeout(timeoutId);
				resolve(clerk);
			}
		}, 50);

		const timeoutId = setTimeout(() => {
			clearInterval(intervalId);
			reject(new Error(message));
		}, timeoutMs);
	});
}

function waitForClerkScript(timeoutMs: number): Promise<ClerkInstance> {
	const existing = getClerkInstance();
	if (existing) return Promise.resolve(existing);

	if (!browser) {
		return Promise.reject(new Error('Clerk is only available in the browser'));
	}

	clerkScriptPromise ??= pollForClerk(getClerkInstance, timeoutMs, 'Clerk script failed to load').catch((error) => {
		clerkScriptPromise = null;
		throw error;
	});

	return clerkScriptPromise;
}

export function initializeClerk(
	options: Parameters<ClerkInstance['load']>[0],
	timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<ClerkInstance> {
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

export function waitForClerk(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<ClerkInstance> {
	const existing = getClerkClient();
	if (existing) return Promise.resolve(existing);

	if (!browser) {
		return Promise.reject(new Error('Clerk is only available in the browser'));
	}

	return clerkReadyPromise ?? pollForClerk(getClerkClient, timeoutMs, 'Clerk failed to initialize');
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
