import { describe, it, expect, vi, afterEach } from 'vitest';
import { createClientRateLimiter } from './rate-limit';

const LIMIT = 5;
const WINDOW_MS = 60_000;

describe('createClientRateLimiter', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('is not rate-limited when fresh', () => {
		const limiter = createClientRateLimiter();
		expect(limiter.isRateLimited()).toBe(false);
	});

	it('is not limited below the attempt limit', () => {
		const limiter = createClientRateLimiter();
		for (let i = 0; i < LIMIT - 1; i++) limiter.recordAttempt();
		expect(limiter.isRateLimited()).toBe(false);
	});

	it('is limited once the attempt limit is reached within the window', () => {
		const limiter = createClientRateLimiter();
		for (let i = 0; i < LIMIT; i++) limiter.recordAttempt();
		expect(limiter.isRateLimited()).toBe(true);
	});

	it('evicts attempts older than the window', () => {
		vi.useFakeTimers();
		const limiter = createClientRateLimiter();
		for (let i = 0; i < LIMIT; i++) limiter.recordAttempt();
		expect(limiter.isRateLimited()).toBe(true);
		vi.advanceTimersByTime(WINDOW_MS + 1);
		expect(limiter.isRateLimited()).toBe(false);
	});

	it('keeps separate buckets per instance', () => {
		const a = createClientRateLimiter();
		const b = createClientRateLimiter();
		for (let i = 0; i < LIMIT; i++) a.recordAttempt();
		expect(a.isRateLimited()).toBe(true);
		expect(b.isRateLimited()).toBe(false);
	});
});
