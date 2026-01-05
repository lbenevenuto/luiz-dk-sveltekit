// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

interface GlobalCounterDurableObject extends Rpc.DurableObjectBranded {
	nextValue(): Promise<number>;
	reset(): Promise<void>;
	resetToValue(value: number): Promise<void>;
}

declare global {
	namespace App {
		interface Platform {
			env: {
				GLOBAL_COUNTER_DO: DurableObjectNamespace<GlobalCounterDurableObject>;
				DB: D1Database;
			};
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}
	}
}

export {};
