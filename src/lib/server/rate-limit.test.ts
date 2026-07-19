import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAnonymousRateLimit } from './rate-limit';

describe('checkAnonymousRateLimit', () => {
	let mockPlatform: App.Platform;
	let mockKV: {
		get: ReturnType<typeof vi.fn>;
		put: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		vi.clearAllMocks();

		mockKV = {
			get: vi.fn(),
			put: vi.fn()
		};

		mockPlatform = {
			env: {
				CACHE: mockKV as unknown as KVNamespace,
				RATE_LIMIT_MAX_REQUESTS: '3',
				RATE_LIMIT_WINDOW_SECONDS: '60'
			}
		} as unknown as App.Platform;
	});

	it('should allow requests when no platform is provided (local dev)', async () => {
		const result = await checkAnonymousRateLimit('127.0.0.1', undefined);
		expect(result).toBe(true);
	});

	it('should allow requests when KV cache is not available', async () => {
		const platform = { env: {} } as unknown as App.Platform;
		const result = await checkAnonymousRateLimit('127.0.0.1', platform);
		expect(result).toBe(true);
	});

	it('should allow first request and store it in KV', async () => {
		mockKV.get.mockResolvedValue(null);
		mockKV.put.mockResolvedValue(undefined);

		const result = await checkAnonymousRateLimit('127.0.0.1', mockPlatform);

		expect(result).toBe(true);
		expect(mockKV.put).toHaveBeenCalledOnce();
		expect(mockKV.get).toHaveBeenCalledWith('ratelimit:anon:127.0.0.1', 'json');
	});

	it('should reject when rate limit is exceeded', async () => {
		const now = Date.now();
		// Simulate 3 recent requests within the window
		const timestamps = [now - 10000, now - 5000, now - 1000];
		mockKV.get.mockResolvedValue(timestamps);

		const result = await checkAnonymousRateLimit('127.0.0.1', mockPlatform);

		expect(result).toBe(false);
		// Should NOT store a new request when rate limited
		expect(mockKV.put).not.toHaveBeenCalled();
	});

	it('should filter out expired timestamps from the window', async () => {
		const now = Date.now();
		// 2 old requests outside window (>60s ago), 1 recent
		const timestamps = [now - 120000, now - 90000, now - 5000];
		mockKV.get.mockResolvedValue(timestamps);
		mockKV.put.mockResolvedValue(undefined);

		const result = await checkAnonymousRateLimit('127.0.0.1', mockPlatform);

		expect(result).toBe(true);
	});

	it('should fail open if KV throws an error', async () => {
		mockKV.get.mockRejectedValue(new Error('KV unavailable'));

		const result = await checkAnonymousRateLimit('127.0.0.1', mockPlatform);

		expect(result).toBe(true);
	});

	it('should use correct KV key format', async () => {
		mockKV.get.mockResolvedValue(null);
		mockKV.put.mockResolvedValue(undefined);

		await checkAnonymousRateLimit('192.168.1.1', mockPlatform);

		expect(mockKV.get).toHaveBeenCalledWith('ratelimit:anon:192.168.1.1', 'json');
	});

	it('should use default values when env vars are not set', async () => {
		const platform = {
			env: {
				CACHE: mockKV as unknown as KVNamespace
				// No RATE_LIMIT_MAX_REQUESTS or RATE_LIMIT_WINDOW_SECONDS
			}
		} as unknown as App.Platform;

		mockKV.get.mockResolvedValue(null);
		mockKV.put.mockResolvedValue(undefined);

		const result = await checkAnonymousRateLimit('127.0.0.1', platform);

		expect(result).toBe(true);
	});
});
