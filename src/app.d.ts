// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { User } from '@clerk/backend';

export interface GlobalCounterDurableObject extends Rpc.DurableObjectBranded {
	nextValue(): Promise<number>;
	reset(): Promise<void>;
	resetToValue(value: number): Promise<void>;
}

export type UserRole = 'admin' | 'user';

declare global {
	namespace App {
		interface Locals {
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

				// Clerk
				CLERK_PUBLISHABLE_KEY: string;
				CLERK_SECRET_KEY: string;
				CLERK_WEBHOOK_SECRET?: string;
				CLERK_FRONTEND_API: string;
				SENTRY_DSN?: string;
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

	// Clerk client-side types
	interface Window {
		Clerk?: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			load: (options: { publishableKey: string; appearance?: any }) => Promise<void>;
			user: User | null;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			session: any;
			signOut: () => Promise<void>;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			addListener: (callback: (resources: any) => void) => () => void;
			openSignIn: (options?: { initialScreen?: string }) => void;
			openSignUp: () => void;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			setActive: (options: { session: string }) => Promise<any>;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			mountUserProfile: (node: HTMLElement, props?: any) => void;
			unmountUserProfile: (node: HTMLElement) => void;
			client: {
				signIn: {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					create: (options: { identifier: string; password?: string }) => Promise<any>;
				};
				signUp: {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					create: (options: { emailAddress: string; password: string }) => Promise<any>;
				};
			};
		};
	}
}

export {};
