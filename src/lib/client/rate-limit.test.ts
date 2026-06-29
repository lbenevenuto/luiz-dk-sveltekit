import { describe, it, expect, vi, afterEach } from 'vitest';
import { ATTEMPT_LIMIT, ATTEMPT_WINDOW_MS, createClientRateLimiter } from './rate-limit';

describe('createClientRateLimiter', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('exposes the default limit and window', () => {
		expect(ATTEMPT_LIMIT).toBe(5);
		expect(ATTEMPT_WINDOW_MS).toBe(60_000);
	});

	it('is not rate-limited when fresh', () => {
		const limiter = createClientRateLimiter();
		expect(limiter.isRateLimited()).toBe(false);
	});

	it('is not limited below the attempt limit', () => {
		const limiter = createClientRateLimiter();
		for (let i = 0; i < ATTEMPT_LIMIT - 1; i++) limiter.recordAttempt();
		expect(limiter.isRateLimited()).toBe(false);
	});

	it('is limited once the attempt limit is reached within the window', () => {
		const limiter = createClientRateLimiter();
		for (let i = 0; i < ATTEMPT_LIMIT; i++) limiter.recordAttempt();
		expect(limiter.isRateLimited()).toBe(true);
	});

	it('evicts attempts older than the window', () => {
		vi.useFakeTimers();
		const limiter = createClientRateLimiter();
		for (let i = 0; i < ATTEMPT_LIMIT; i++) limiter.recordAttempt();
		expect(limiter.isRateLimited()).toBe(true);
		vi.advanceTimersByTime(ATTEMPT_WINDOW_MS + 1);
		expect(limiter.isRateLimited()).toBe(false);
	});

	it('keeps separate buckets per instance', () => {
		const a = createClientRateLimiter();
		const b = createClientRateLimiter();
		for (let i = 0; i < ATTEMPT_LIMIT; i++) a.recordAttempt();
		expect(a.isRateLimited()).toBe(true);
		expect(b.isRateLimited()).toBe(false);
	});

	it('respects a custom limit and window', () => {
		const limiter = createClientRateLimiter(2, 1000);
		limiter.recordAttempt();
		limiter.recordAttempt();
		expect(limiter.isRateLimited()).toBe(true);
	});
});
