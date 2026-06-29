/**
 * Maps Clerk error codes to user-facing messages for the auth flows.
 */

interface ClerkErrorLike {
	errors?: Array<{ code?: string; message?: string }>;
}

/** Default messages shared across sign-in / sign-up / password-reset flows, keyed by Clerk error code. */
export const DEFAULT_CLERK_ERROR_MESSAGES: Record<string, string> = {
	form_identifier_not_found: 'No account found with this email',
	form_identifier_exists: 'An account with this email already exists',
	form_password_incorrect: 'Incorrect password',
	form_param_format_invalid: 'Invalid email format',
	form_password_length_too_short: 'Password must be at least 8 characters',
	form_password_pwned: 'This password has been compromised in a data breach. Please choose a different one.',
	form_code_incorrect: 'Incorrect verification code. Please try again.',
	session_exists: 'You are already logged in'
};

/**
 * Resolve a user-facing message from a Clerk error.
 * Pass `overrides` to customise specific codes for a flow (e.g. "reset code" vs "verification code").
 */
export function getClerkErrorMessage(clerkErr: unknown, overrides?: Record<string, string>): string {
	const firstError = (clerkErr as ClerkErrorLike | null | undefined)?.errors?.[0];
	const code = firstError?.code ?? '';
	const mapped = overrides?.[code] ?? DEFAULT_CLERK_ERROR_MESSAGES[code];
	return mapped || firstError?.message || 'An error occurred. Please try again.';
}
