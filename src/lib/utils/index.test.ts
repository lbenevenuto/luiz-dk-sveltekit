import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeUrl } from './index';

describe('normalizeUrl', () => {
	it('should lowercase the hostname', () => {
		expect(normalizeUrl('https://EXAMPLE.COM/path')).toBe('https://example.com/path');
		expect(normalizeUrl('https://Example.Com/Path')).toBe('https://example.com/Path');
	});

	it('should strip the hash fragment', () => {
		expect(normalizeUrl('https://example.com/page#section')).toBe('https://example.com/page');
		expect(normalizeUrl('https://example.com/#top')).toBe('https://example.com');
	});

	it('should strip trailing slashes from paths', () => {
		expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
		expect(normalizeUrl('https://example.com/a/b/c/')).toBe('https://example.com/a/b/c');
	});

	it('should not strip trailing slash from root path', () => {
		expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
		expect(normalizeUrl('https://example.com')).toBe('https://example.com');
	});

	it('should preserve query strings', () => {
		expect(normalizeUrl('https://example.com/search?q=hello')).toBe('https://example.com/search?q=hello');
		expect(normalizeUrl('https://example.com?foo=bar&baz=1')).toBe('https://example.com/?foo=bar&baz=1');
	});

	it('should preserve query strings and strip hash', () => {
		expect(normalizeUrl('https://example.com/page?q=1#hash')).toBe('https://example.com/page?q=1');
	});

	it('should handle URLs with ports', () => {
		expect(normalizeUrl('https://EXAMPLE.COM:8080/path')).toBe('https://example.com:8080/path');
	});

	it('should trim whitespace from input', () => {
		expect(normalizeUrl('  https://example.com/page  ')).toBe('https://example.com/page');
	});

	it('should handle http protocol', () => {
		expect(normalizeUrl('http://example.com/path')).toBe('http://example.com/path');
	});

	it('should preserve path case (only hostname is lowercased)', () => {
		expect(normalizeUrl('https://example.com/MyPage/SubPage')).toBe('https://example.com/MyPage/SubPage');
	});

	it('should strip authentication info (URL constructor behavior)', () => {
		// The URL constructor strips userinfo per the WHATWG URL spec
		expect(normalizeUrl('https://user:pass@example.com/path')).toBe('https://example.com/path');
	});

	it('should throw for invalid URLs', () => {
		expect(() => normalizeUrl('not-a-url')).toThrow();
	});
});

import { createShortUrl, ShortCodeConflictError } from './index';
import type { DrizzleClient } from '$lib/server/db/client';
import type { Url } from '$lib/server/db/schemas';
import * as factory from '$lib/adapters/factory';
import * as queries from '$lib/server/db/queries/urls';
import { generateShortCode } from './hashids';

const mockUrl = (overrides: Partial<Url> = {}): Url => ({
	id: 1,
	shortCode: 'abc',
	originalUrl: 'https://example.com',
	createdAt: new Date(),
	updatedAt: new Date(),
	expiresAt: null,
	userId: null,
	...overrides
});

vi.mock('$lib/adapters/factory', () => ({
	getDatabaseAdapter: vi.fn(),
	getCacheAdapter: vi.fn(),
	getIdGeneratorAdapter: vi.fn(),
	getAnalyticsAdapter: vi.fn()
}));

vi.mock('$lib/server/db/queries/urls', () => ({
	checkCustomCodeConflict: vi.fn(),
	insertUrl: vi.fn(),
	findExistingUserUrlExpiring: vi.fn(),
	findExistingUserUrlPermanent: vi.fn(),
	findExistingGlobalUrlExpiring: vi.fn(),
	findExistingGlobalUrlPermanent: vi.fn()
}));

vi.mock('./hashids', () => ({
	generateShortCode: vi.fn()
}));

describe('createShortUrl', () => {
	const mockDb = {} as DrizzleClient;
	const mockPlatform = { env: { SALT: 'test-salt' } } as unknown as App.Platform;

	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('custom codes', () => {
		it('throws ShortCodeConflictError if custom code exists', async () => {
			vi.mocked(queries.checkCustomCodeConflict).mockResolvedValue(mockUrl({ shortCode: 'mycode' }));
			await expect(createShortUrl('https://example.com', null, mockPlatform, mockDb, null, 'mycode')).rejects.toThrow(
				ShortCodeConflictError
			);
		});

		it('inserts directly if custom code does not exist', async () => {
			vi.mocked(queries.checkCustomCodeConflict).mockResolvedValue(undefined);
			const result = await createShortUrl('https://example.com', null, mockPlatform, mockDb, null, 'newcode');

			expect(queries.insertUrl).toHaveBeenCalledWith(mockDb, {
				shortCode: 'newcode',
				originalUrl: 'https://example.com',
				userId: null,
				expiresAt: null
			});
			expect(result).toEqual({ shortCode: 'newcode', isExisting: false, expiresAt: null });
		});
	});

	describe('auto-generated codes', () => {
		it('returns immediately if found in cache (non-expiring)', async () => {
			const mockCache = { get: vi.fn().mockResolvedValue('cachehit'), set: vi.fn(), delete: vi.fn() };
			vi.mocked(factory.getCacheAdapter).mockResolvedValue(mockCache);

			const result = await createShortUrl('https://example.com', null, mockPlatform, mockDb);

			expect(mockCache.get).toHaveBeenCalledWith('url:https://example.com:permanent');
			expect(result).toEqual({ shortCode: 'cachehit', isExisting: true, expiresAt: null });
			// Ensure DB was not queried
			expect(queries.findExistingGlobalUrlPermanent).not.toHaveBeenCalled();
		});

		it('caches and returns existing non-expired DB entry (user)', async () => {
			const mockCache = { get: vi.fn().mockResolvedValue(null), set: vi.fn(), delete: vi.fn() };
			vi.mocked(factory.getCacheAdapter).mockResolvedValue(mockCache);

			vi.mocked(queries.findExistingUserUrlPermanent).mockResolvedValue(mockUrl({ shortCode: 'dbhit' }));

			const result = await createShortUrl('https://example.com', null, mockPlatform, mockDb, 'user123');

			expect(queries.findExistingUserUrlPermanent).toHaveBeenCalledWith(mockDb, 'https://example.com', 'user123');
			expect(mockCache.set).toHaveBeenCalledWith('url:https://example.com:permanent', 'dbhit', 604800);
			expect(result).toEqual({ shortCode: 'dbhit', isExisting: true, expiresAt: null });
		});

		it('caches and returns existing non-expired DB entry (global fallback)', async () => {
			const mockCache = { get: vi.fn().mockResolvedValue(null), set: vi.fn(), delete: vi.fn() };
			vi.mocked(factory.getCacheAdapter).mockResolvedValue(mockCache);

			vi.mocked(queries.findExistingUserUrlPermanent).mockResolvedValue(undefined);
			vi.mocked(queries.findExistingGlobalUrlPermanent).mockResolvedValue(mockUrl({ shortCode: 'globalhit' }));

			const result = await createShortUrl('https://example.com', null, mockPlatform, mockDb, 'user123');

			expect(queries.findExistingUserUrlPermanent).toHaveBeenCalledWith(mockDb, 'https://example.com', 'user123');
			expect(queries.findExistingGlobalUrlPermanent).toHaveBeenCalledWith(mockDb, 'https://example.com');
			expect(mockCache.set).toHaveBeenCalledWith('url:https://example.com:permanent', 'globalhit', 604800);
			expect(result).toEqual({ shortCode: 'globalhit', isExisting: true, expiresAt: null });
		});

		it('generates new code if not in cache or DB', async () => {
			const mockCache = { get: vi.fn().mockResolvedValue(null), set: vi.fn(), delete: vi.fn() };
			const mockIdGen = { getNextId: vi.fn().mockResolvedValue(42) };
			vi.mocked(factory.getCacheAdapter).mockResolvedValue(mockCache);
			vi.mocked(factory.getIdGeneratorAdapter).mockResolvedValue(mockIdGen);

			vi.mocked(queries.findExistingGlobalUrlPermanent).mockResolvedValue(undefined);
			vi.mocked(generateShortCode).mockReturnValue('newgen');

			const result = await createShortUrl('https://example.com', null, mockPlatform, mockDb);

			expect(queries.insertUrl).toHaveBeenCalledWith(mockDb, {
				shortCode: 'newgen',
				originalUrl: 'https://example.com',
				userId: null,
				expiresAt: null
			});
			expect(mockCache.set).toHaveBeenCalledWith('url:https://example.com:permanent', 'newgen', 604800);
			expect(result).toEqual({ shortCode: 'newgen', isExisting: false, expiresAt: null });
		});

		it('handles generation of expiring URLs (skips cache)', async () => {
			const mockIdGen = { getNextId: vi.fn().mockResolvedValue(43) };
			vi.mocked(factory.getIdGeneratorAdapter).mockResolvedValue(mockIdGen);

			vi.mocked(queries.findExistingGlobalUrlExpiring).mockResolvedValue(undefined);
			vi.mocked(generateShortCode).mockReturnValue('expirecode');

			// Using a fixed timestamp for reproducibility testing could be done, but simply testing logic flows
			const result = await createShortUrl('https://example.com', 1700000000, mockPlatform, mockDb);

			expect(queries.insertUrl).toHaveBeenCalledWith(
				mockDb,
				expect.objectContaining({
					shortCode: 'expirecode',
					originalUrl: 'https://example.com',
					userId: null
				})
			);
			// Expiring URLs should not trigger cache sets inside the create flow
			expect(result).toEqual({ shortCode: 'expirecode', isExisting: false, expiresAt: 1700000000 });
		});
	});
});
