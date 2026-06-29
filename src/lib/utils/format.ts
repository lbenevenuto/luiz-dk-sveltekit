/**
 * Common display-formatting helpers.
 */

/** Format a number using the runtime locale (thousands separators etc.). */
export function formatNumber(value: number): string {
	return value.toLocaleString();
}

/** Keep the first `max` characters, appending an ellipsis when the string is longer. */
export function truncateString(value: string, max = 60): string {
	return value.length > max ? value.slice(0, max) + '...' : value;
}
