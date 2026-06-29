import { json } from '@sveltejs/kit';
import { z } from 'zod';

/**
 * Standardized JSON error response shape used by all API (`json`) endpoints: `{ error, details? }`.
 */
export function jsonError(message: string, status: number, details?: string): Response {
	return json(details !== undefined ? { error: message, details } : { error: message }, { status });
}

/**
 * Build a validation error response (default 400) from a Zod error, with prettified details.
 */
export function validationError(error: z.ZodError, status = 400): Response {
	return jsonError('Validation failed', status, z.prettifyError(error));
}

/**
 * Parse a JSON request body, returning either the parsed data or a ready-to-return 400 response.
 *
 * Usage:
 *   const parsed = await parseJsonBody(request);
 *   if ('response' in parsed) return parsed.response;
 *   const body = parsed.data;
 */
export async function parseJsonBody(request: Request): Promise<{ data: unknown } | { response: Response }> {
	try {
		return { data: await request.json() };
	} catch {
		return { response: jsonError('Invalid JSON body', 400) };
	}
}
