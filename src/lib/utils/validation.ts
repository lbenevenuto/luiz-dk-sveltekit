/**
 * Common validation utilities
 */

/**
 * Validate and sanitize URL protocol
 * @param url - URL string to validate
 * @returns true if valid http/https URL
 */
export function isValidHttpUrl(url: string): boolean {
	try {
		const parsedUrl = new URL(url);
		return ['http:', 'https:'].includes(parsedUrl.protocol);
	} catch {
		return false;
	}
}

/**
 * Sanitize string for use in cache keys or identifiers
 * Removes all non-alphanumeric characters except dots, underscores, and hyphens
 * @param input - String to sanitize
 * @returns Sanitized string safe for use as identifier
 */
export function sanitizeIdentifier(input: string): string {
	return input.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Check if a value is a positive integer
 * @param value - Value to check
 * @returns true if value is a positive integer
 */
export function isPositiveInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
