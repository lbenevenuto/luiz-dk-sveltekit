import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuthenticateRequest, mockGetUser, mockIsPublicRoute, mockGetAuthorizedParties, mockLogger } = vi.hoisted(
	() => ({
		mockAuthenticateRequest: vi.fn(),
		mockGetUser: vi.fn(),
		mockIsPublicRoute: vi.fn(),
		mockGetAuthorizedParties: vi.fn(),
		mockLogger: {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn()
		}
	})
);

vi.mock('$lib/server/clerk', () => ({
	getClerkClient: vi.fn(() => ({
		authenticateRequest: mockAuthenticateRequest,
		users: {
			getUser: mockGetUser
		}
	}))
}));

vi.mock('$lib/server/routes', () => ({
	isPublicRoute: mockIsPublicRoute,
	getAuthorizedParties: mockGetAuthorizedParties
}));

vi.mock('$lib/server/logger', () => ({
	logger: mockLogger
}));

import { authHandle } from './auth-handle';

function createEvent(pathname: string) {
	return {
		platform: {
			env: {
				BASE_URL: 'https://luiz.dk'
			}
		},
		url: new URL(`https://luiz.dk${pathname}`),
		request: new Request(`https://luiz.dk${pathname}`),
		locals: {} as App.Locals
	} as Parameters<typeof authHandle>[0]['event'];
}

function createRequestState(overrides: Record<string, unknown> = {}) {
	return {
		isSignedIn: false,
		status: 'signed_out',
		headers: new Headers(),
		toAuth: vi.fn(),
		...overrides
	};
}

describe('authHandle', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsPublicRoute.mockReturnValue(false);
		mockGetAuthorizedParties.mockReturnValue(['https://luiz.dk']);
	});

	it('appends clerk headers on public routes', async () => {
		const headers = new Headers({ 'x-clerk-auth-status': 'signed-out' });
		mockAuthenticateRequest.mockResolvedValue(createRequestState({ headers }));
		mockIsPublicRoute.mockReturnValue(true);

		const response = await authHandle({
			event: createEvent('/'),
			resolve: vi.fn(async () => new Response('ok'))
		});

		expect(response.headers.get('x-clerk-auth-status')).toBe('signed-out');
		expect(response.status).toBe(200);
	});

	it('hydrates locals.auth for signed-in users', async () => {
		mockAuthenticateRequest.mockResolvedValue(
			createRequestState({
				isSignedIn: true,
				toAuth: vi.fn(() => ({
					userId: 'user_123',
					sessionId: 'sess_123'
				}))
			})
		);
		mockGetUser.mockResolvedValue({
			id: 'user_123',
			publicMetadata: { role: 'admin' }
		});

		const event = createEvent('/dashboard');
		await authHandle({
			event,
			resolve: vi.fn(async () => new Response('ok'))
		});

		expect(event.locals.auth).toMatchObject({
			userId: 'user_123',
			sessionId: 'sess_123',
			role: 'admin'
		});
		expect(mockGetUser).toHaveBeenCalledWith('user_123');
	});

	it('redirects anonymous admin requests to login', async () => {
		mockAuthenticateRequest.mockResolvedValue(createRequestState());

		await expect(
			authHandle({
				event: createEvent('/admin/users'),
				resolve: vi.fn(async () => new Response('ok'))
			})
		).rejects.toMatchObject({
			status: 307,
			location: '/login?redirect_url=%2Fadmin%2Fusers'
		});
		expect(mockLogger.warn).toHaveBeenCalledWith('auth.admin.redirect_login', { path: '/admin/users' });
	});

	it('redirects non-admin users away from admin routes', async () => {
		mockAuthenticateRequest.mockResolvedValue(
			createRequestState({
				isSignedIn: true,
				toAuth: vi.fn(() => ({
					userId: 'user_123',
					sessionId: 'sess_123'
				}))
			})
		);
		mockGetUser.mockResolvedValue({
			id: 'user_123',
			publicMetadata: { role: 'user' }
		});

		await expect(
			authHandle({
				event: createEvent('/admin'),
				resolve: vi.fn(async () => new Response('ok'))
			})
		).rejects.toMatchObject({
			status: 307,
			location: '/403?url=%2Fadmin'
		});
		expect(mockLogger.warn).toHaveBeenCalledWith('auth.admin.forbidden', {
			userId: 'user_123',
			path: '/admin'
		});
	});

	it('returns handshake response when clerk requires one', async () => {
		const headers = new Headers({ location: 'https://clerk.test/handshake' });
		mockAuthenticateRequest.mockResolvedValue(
			createRequestState({
				status: 'handshake',
				headers
			})
		);

		const response = await authHandle({
			event: createEvent('/dashboard'),
			resolve: vi.fn(async () => new Response('ok'))
		});

		expect(response.status).toBe(307);
		expect(response.headers.get('location')).toBe('https://clerk.test/handshake');
	});
});
