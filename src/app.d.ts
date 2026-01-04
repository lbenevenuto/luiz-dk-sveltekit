// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

interface GlobalCounterDurableObject {
	nextValue(): Promise<number>;
}

declare global {
	namespace App {
		interface Platform {
			env: {
				GLOBAL_COUNTER_DO: DurableObjectNamespace<GlobalCounterDurableObject>;
			};
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}
	}
}

export {};
