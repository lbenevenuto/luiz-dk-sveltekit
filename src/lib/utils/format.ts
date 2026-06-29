/**
 * Common display-formatting helpers.
 */

/** Format a number using the runtime locale (thousands separators etc.). */
export function formatNumber(value: number): string {
	return value.toLocaleString();
}

/** Truncate a string to `max` characters, appending an ellipsis when shortened. */
export function truncateString(value: string, max = 60): string {
	return value.length > max ? value.slice(0, max) + '...' : value;
}
