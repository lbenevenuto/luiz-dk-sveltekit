/**
 * Client-side, in-memory attempt limiter for auth forms.
 * Each call to {@link createClientRateLimiter} returns an independent (instance-scoped) limiter,
 * so separate flows (e.g. login vs password-reset) keep separate attempt buckets.
 */

export const ATTEMPT_LIMIT = 5;
export const ATTEMPT_WINDOW_MS = 60_000;

export interface ClientRateLimiter {
	isRateLimited(): boolean;
	recordAttempt(): void;
}

export function createClientRateLimiter(
	limit: number = ATTEMPT_LIMIT,
	windowMs: number = ATTEMPT_WINDOW_MS
): ClientRateLimiter {
	let timestamps: number[] = [];

	return {
		isRateLimited() {
			const now = Date.now();
			timestamps = timestamps.filter((ts) => now - ts < windowMs);
			return timestamps.length >= limit;
		},
		recordAttempt() {
			const now = Date.now();
			timestamps = [...timestamps, now].filter((ts) => now - ts < windowMs);
		}
	};
}
