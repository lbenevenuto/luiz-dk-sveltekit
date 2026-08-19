/**
 * Client-side, in-memory attempt limiter for auth forms.
 * Each call returns an independent (instance-scoped) limiter, so separate flows
 * (e.g. login vs password-reset) keep separate attempt buckets.
 */

const ATTEMPT_LIMIT = 5;
const ATTEMPT_WINDOW_MS = 60_000;

export function createClientRateLimiter() {
	let timestamps: number[] = [];

	return {
		isRateLimited() {
			const now = Date.now();
			timestamps = timestamps.filter((ts) => now - ts < ATTEMPT_WINDOW_MS);
			return timestamps.length >= ATTEMPT_LIMIT;
		},
		recordAttempt() {
			const now = Date.now();
			timestamps = [...timestamps, now].filter((ts) => now - ts < ATTEMPT_WINDOW_MS);
		}
	};
}
