import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/logger', () => ({ logger: { error: vi.fn() } }));

import { logger } from '$lib/server/logger';
import { InMemoryCacheAdapter, KVAdapter } from './cache';

describe('InMemoryCacheAdapter', () => {
	afterEach(() => vi.useRealTimers());

	it('expires entries after their TTL', async () => {
		vi.useFakeTimers();
		const cache = new InMemoryCacheAdapter();
		await cache.set('k', 'v', 60);

		expect(await cache.get('k')).toBe('v');
		vi.advanceTimersByTime(60_000);
		expect(await cache.get('k')).toBeNull();
	});
});

describe('KVAdapter', () => {
	const failing = new Error('kv down');
	const kv = {
		get: vi.fn().mockRejectedValue(failing),
		put: vi.fn().mockRejectedValue(failing),
		delete: vi.fn().mockRejectedValue(failing)
	} as unknown as KVNamespace;

	it('fails open and logs when KV errors', async () => {
		const cache = new KVAdapter(kv);

		expect(await cache.get('k')).toBeNull();
		await expect(cache.set('k', 'v', 60)).resolves.toBeUndefined();
		await expect(cache.delete('k')).resolves.toBeUndefined();
		expect(logger.error).toHaveBeenCalledTimes(3);
	});

	it('passes the TTL through to KV', async () => {
		const put = vi.fn().mockResolvedValue(undefined);
		await new KVAdapter({ put } as unknown as KVNamespace).set('k', 'v', 120);
		expect(put).toHaveBeenCalledWith('k', 'v', { expirationTtl: 120 });
	});
});
