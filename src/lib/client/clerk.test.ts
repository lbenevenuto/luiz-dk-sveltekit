import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({
	browser: true
}));

function getTestWindow(): Window & { Clerk?: Window['Clerk'] } {
	return globalThis as typeof globalThis & Window & { Clerk?: Window['Clerk'] };
}

async function loadClerkModule() {
	return import('./clerk');
}

describe('clerk client helpers', () => {
	beforeEach(() => {
		vi.resetModules();
		const testWindow = getTestWindow();
		Object.defineProperty(globalThis, 'window', {
			value: testWindow,
			configurable: true
		});
		delete testWindow.Clerk;
	});

	it('waits for the script global before resolving', async () => {
		const { waitForClerkScript } = await loadClerkModule();
		const promise = waitForClerkScript(100);

		setTimeout(() => {
			getTestWindow().Clerk = {
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
				handleRedirectCallback: vi.fn()
			};
		}, 10);

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

		getTestWindow().Clerk = {
			load,
			client: undefined as unknown as NonNullable<Window['Clerk']>['client'],
			user: null,
			session: null,
			signOut: vi.fn(),
			addListener: vi.fn(() => () => undefined),
			openSignIn: vi.fn(),
			openSignUp: vi.fn(),
			setActive: vi.fn(),
			mountUserProfile: vi.fn(),
			unmountUserProfile: vi.fn(),
			handleRedirectCallback: vi.fn()
		};

		const clerk = await initializeClerk({ publishableKey: 'pk_test' }, 100);

		expect(load).toHaveBeenCalledWith({ publishableKey: 'pk_test' });
		expect(clerk.client).toBeDefined();
		await expect(waitForClerk(100)).resolves.toBe(clerk);
	});

	it('rejects when Clerk.load never resolves', async () => {
		const { initializeClerk } = await loadClerkModule();
		getTestWindow().Clerk = {
			load: vi.fn(() => new Promise<void>(() => undefined)),
			client: undefined as unknown as NonNullable<Window['Clerk']>['client'],
			user: null,
			session: null,
			signOut: vi.fn(),
			addListener: vi.fn(() => () => undefined),
			openSignIn: vi.fn(),
			openSignUp: vi.fn(),
			setActive: vi.fn(),
			mountUserProfile: vi.fn(),
			unmountUserProfile: vi.fn(),
			handleRedirectCallback: vi.fn()
		};

		await expect(initializeClerk({ publishableKey: 'pk_test' }, 20)).rejects.toThrow('Clerk initialization timed out');
	});
});
