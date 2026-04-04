// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { User } from '@clerk/backend';
import type { DrizzleClient } from '$lib/server/db/client';

export interface GlobalCounterDurableObject extends Rpc.DurableObjectBranded {
	nextValue(): Promise<number>;
	reset(): Promise<void>;
	resetToValue(value: number): Promise<void>;
}

export type UserRole = 'admin' | 'user';

declare global {
	namespace App {
		interface Locals {
			requestId: string;
			db: DrizzleClient;
			auth: {
				userId: string | null;
				sessionId: string | null;
				user: User | null;
				role: UserRole | null;
			};
		}

		interface Platform {
			env: {
				// Cloudflare bindings
				GLOBAL_COUNTER_DO: DurableObjectNamespace<GlobalCounterDurableObject>;
				DB: D1Database;
				CACHE: KVNamespace;
				ANALYTICS: AnalyticsEngineDataset;

				// Environment variables
				BASE_URL?: string;
				SALT?: string;
				CLOUDFLARE_ACCOUNT_ID: string;
				CLOUDFLARE_API_TOKEN_ANALYTICS: string;

				// Rate limiting
				RATE_LIMIT_MAX_REQUESTS?: string;
				RATE_LIMIT_WINDOW_SECONDS?: string;
				TRUST_X_FORWARDED_FOR?: string;

				// Clerk
				CLERK_PUBLISHABLE_KEY: string;
				CLERK_SECRET_KEY: string;
				CLERK_WEBHOOK_SECRET?: string;
				CLERK_FRONTEND_API: string;
				SENTRY_DSN?: string;
				ENABLE_TEST_ENDPOINT?: string;
			};
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}
	}

	// Extend Clerk's CustomJwtSessionClaims
	interface CustomJwtSessionClaims {
		metadata: {
			role?: UserRole;
		};
	}

	type ClerkAppearance = {
		baseTheme?: unknown;
		variables?: Record<string, string>;
		elements?: Record<string, string>;
	};

	type ClerkError = {
		code?: string;
		message?: string;
	};

	type ClerkApiError = {
		errors?: ClerkError[];
	};

	type ClerkOAuthStrategy = 'oauth_google' | 'oauth_github';

	type ClerkSignInSecondFactorStrategy = 'email_code' | 'phone_code' | 'totp';

	type ClerkResetPasswordStrategy = 'reset_password_email_code';

	type ClerkSignInStatus = 'complete' | 'needs_second_factor' | string;

	type ClerkEmailSecondFactor = {
		strategy: 'email_code';
		emailAddressId: string;
	};

	type ClerkPhoneSecondFactor = {
		strategy: 'phone_code';
		phoneNumberId: string;
	};

	type ClerkTotpSecondFactor = {
		strategy: 'totp';
	};

	type ClerkSupportedSecondFactor = ClerkEmailSecondFactor | ClerkPhoneSecondFactor | ClerkTotpSecondFactor;

	type ClerkResetPasswordFactor = {
		strategy: ClerkResetPasswordStrategy;
		emailAddressId: string;
	};

	interface ClerkSession {
		id: string;
		getToken(): Promise<string | null>;
	}

	interface ClerkSignInAttempt {
		status: ClerkSignInStatus;
		createdSessionId?: string;
		supportedSecondFactors?: ClerkSupportedSecondFactor[];
		supportedFirstFactors?: ClerkResetPasswordFactor[];
		firstFactorVerification?: {
			externalVerificationRedirectURL?: URL | string | null;
		};
		attemptFirstFactor(
			params:
				| {
						strategy: 'password';
						password: string;
				  }
				| {
						strategy: ClerkResetPasswordStrategy;
						code: string;
						password: string;
				  }
		): Promise<ClerkSignInAttempt>;
		prepareFirstFactor(params: { strategy: ClerkResetPasswordStrategy; emailAddressId: string }): Promise<void>;
		prepareSecondFactor(
			params:
				| {
						strategy: 'email_code';
						emailAddressId: string;
				  }
				| {
						strategy: 'phone_code';
						phoneNumberId: string;
				  }
		): Promise<void>;
		attemptSecondFactor(params: {
			strategy: ClerkSignInSecondFactorStrategy;
			code: string;
		}): Promise<ClerkSignInAttempt>;
	}

	interface ClerkSignUpAttempt {
		status?: string;
		createdSessionId?: string;
		verifications?: {
			externalAccount?: {
				externalVerificationRedirectURL?: URL | string | null;
			};
		};
		prepareEmailAddressVerification(params: { strategy: 'email_code' }): Promise<void>;
		attemptEmailAddressVerification(params: { code: string }): Promise<ClerkSignUpAttempt & { status: string }>;
	}

	interface ClerkStateSnapshot {
		user: User | null;
		session: ClerkSession | null;
	}

	interface Clerk {
		load(options: { publishableKey: string; appearance?: ClerkAppearance }): Promise<void>;
		user: User | null;
		session: ClerkSession | null;
		client: {
			signIn: {
				create(
					params:
						| {
								identifier: string;
						  }
						| {
								strategy: ClerkOAuthStrategy;
								redirect_url: string;
						  }
				): Promise<ClerkSignInAttempt>;
			};
			signUp: {
				create(
					params:
						| {
								emailAddress: string;
								password: string;
						  }
						| {
								strategy: ClerkOAuthStrategy;
								redirect_url: string;
						  }
				): Promise<ClerkSignUpAttempt>;
			};
		};
		signOut(): Promise<void>;
		addListener(callback: (resources: ClerkStateSnapshot) => void): () => void;
		openSignIn(options?: { initialScreen?: string }): void;
		openSignUp(): void;
		setActive(options: { session: string }): Promise<void>;
		mountUserProfile(
			node: HTMLElement,
			props?: {
				appearance?: ClerkAppearance;
			}
		): void;
		unmountUserProfile(node: HTMLElement): void;
		handleRedirectCallback(
			params?: Record<string, string>,
			callback?: (url: string) => void | Promise<void>
		): Promise<void>;
	}

	// Clerk client-side types
	interface Window {
		Clerk?: Clerk;
	}
}

export {};
