import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
	browser: true
}));

function getTestWindow(): Window & { Clerk?: Window['Clerk'] } {
	return globalThis as typeof globalThis & Window & { Clerk?: Window['Clerk'] };
}

async function loadClerkModule() {
	return import('./clerk');
}

function createClerkStub(overrides: Partial<NonNullable<Window['Clerk']>> = {}): NonNullable<Window['Clerk']> {
	return {
		load: vi.fn(),
		client: {} as NonNullable<Window['Clerk']>['client'],
		user: null,
		session: null,
		signOut: vi.fn(),
		addListener: vi.fn(() => () => undefined),
		openSignIn: vi.fn(),
		openSignUp: vi.fn(),
		setActive: vi.fn(),
		mountUserProfile: vi.fn(),
		unmountUserProfile: vi.fn(),
		handleRedirectCallback: vi.fn(),
		...overrides
	};
}

describe('clerk client helpers', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.resetModules();
		const testWindow = getTestWindow();
		Object.defineProperty(globalThis, 'window', {
			value: testWindow,
			configurable: true
		});
		delete testWindow.Clerk;
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('waits for the script global before resolving', async () => {
		const { waitForClerkScript } = await loadClerkModule();
		const promise = waitForClerkScript(5000);

		// Simulate the Clerk script appearing on window
		getTestWindow().Clerk = createClerkStub();

		// Advance past one polling interval (50ms) so the setInterval callback detects it
		await vi.advanceTimersByTimeAsync(50);

		const clerk = await promise;
		expect(clerk).toBe(getTestWindow().Clerk);
	});

	it('loads Clerk before exposing the ready client', async () => {
		const { initializeClerk, waitForClerk } = await loadClerkModule();
		const load = vi.fn(async () => {
			if (!window.Clerk) {
				throw new Error('missing clerk');
			}
			window.Clerk.client = {} as NonNullable<Window['Clerk']>['client'];
		});

		// Clerk script is present but not yet initialized (no client)
		getTestWindow().Clerk = createClerkStub({
			load,
			client: undefined as unknown as NonNullable<Window['Clerk']>['client']
		});

		const clerk = await initializeClerk({ publishableKey: 'pk_test' }, 5000);

		expect(load).toHaveBeenCalledWith({ publishableKey: 'pk_test' });
		expect(clerk.client).toBeDefined();
		await expect(waitForClerk(5000)).resolves.toBe(clerk);
	});

	it('rejects when Clerk.load never resolves', async () => {
		const { initializeClerk } = await loadClerkModule();
		getTestWindow().Clerk = createClerkStub({
			load: vi.fn(() => new Promise<void>(() => undefined)),
			client: undefined as unknown as NonNullable<Window['Clerk']>['client']
		});

		// Attach the rejection handler before advancing timers so
		// the re-throw in the .catch() chain is not reported as unhandled
		const rejection = initializeClerk({ publishableKey: 'pk_test' }, 5000).catch((e: unknown) => e);

		// Advance past the withTimeout deadline to trigger rejection
		await vi.advanceTimersByTimeAsync(5000);

		const error = await rejection;
		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toBe('Clerk initialization timed out');
	});
});
