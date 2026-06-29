/**
 * Common validation utilities
 */

import { z } from 'zod';
import { ALLOWED_DAYS, ALLOWED_PAGE_SIZES, DEFAULT_DAYS, DEFAULT_PAGE_SIZE } from './constants';

/**
 * Extract a human-readable message from an unknown thrown value.
 * Replaces the `error instanceof Error ? error.message : String(error)` pattern.
 */
export function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/** Zod schema coercing/validating an analytics day range, defaulting to {@link DEFAULT_DAYS}. */
export const daysSchema = z.coerce
	.number()
	.int()
	.refine((v) => (ALLOWED_DAYS as readonly number[]).includes(v))
	.default(DEFAULT_DAYS);

/** Zod schema coercing/validating a page size, defaulting to {@link DEFAULT_PAGE_SIZE}. */
export const pageSizeSchema = z.coerce
	.number()
	.int()
	.refine((v) => (ALLOWED_PAGE_SIZES as readonly number[]).includes(v))
	.default(DEFAULT_PAGE_SIZE);

/**
 * Parse a `days` search-param value, falling back to {@link DEFAULT_DAYS} when missing or invalid.
 * For load functions that silently default rather than returning a validation error.
 */
export function parseDaysParam(value: string | null): number {
	const days = value ? parseInt(value) : DEFAULT_DAYS;
	return (ALLOWED_DAYS as readonly number[]).includes(days) ? days : DEFAULT_DAYS;
}

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
 * Sanitize URL for log output.
 * Removes query and fragment and normalizes trailing slash.
 */
export function sanitizeUrlForLog(input: string): string {
	try {
		const parsed = new URL(input.trim());
		parsed.search = '';
		parsed.hash = '';
		parsed.hostname = parsed.hostname.toLowerCase();

		if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
			parsed.pathname = parsed.pathname.slice(0, -1);
		}

		const base = `${parsed.protocol}//${parsed.host}`;
		if (parsed.pathname === '/' || parsed.pathname === '') {
			return base;
		}

		return `${base}${parsed.pathname}`;
	} catch {
		return '[invalid-url]';
	}
}

export function getClientIdentifierForRateLimit(
	headers: Headers,
	options: { trustForwardedFor?: boolean } = {}
): string {
	const cfConnectingIp = headers.get('CF-Connecting-IP');
	if (cfConnectingIp) {
		return sanitizeIdentifier(cfConnectingIp.trim());
	}

	if (options.trustForwardedFor) {
		const forwardedFor = headers.get('X-Forwarded-For');
		if (forwardedFor) {
			const firstIp = forwardedFor
				.split(',')[0]
				?.trim()
				.replace(/^["']|["']$/g, '');
			if (firstIp) {
				return sanitizeIdentifier(firstIp);
			}
		}
	}

	return 'unknown';
}

/**
 * Check if a value is a positive integer
 * @param value - Value to check
 * @returns true if value is a positive integer
 */
export function isPositiveInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
