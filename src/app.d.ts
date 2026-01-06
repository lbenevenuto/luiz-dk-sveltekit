// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

export interface GlobalCounterDurableObject extends Rpc.DurableObjectBranded {
	nextValue(): Promise<number>;
	reset(): Promise<void>;
	resetToValue(value: number): Promise<void>;
}

declare global {
	namespace App {
		interface Platform {
			env: {
				// Cloudflare bindings
				GLOBAL_COUNTER_DO: DurableObjectNamespace<GlobalCounterDurableObject>;
				DB: D1Database;
				CACHE: KVNamespace;

				// Environment variables
				BASE_URL?: string;
				SALT?: string;
			};
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}
	}
}

export {};
