import { describe, it, expect } from 'vitest';
import { DEFAULT_CLERK_ERROR_MESSAGES, getClerkErrorMessage } from './clerk-errors';

describe('getClerkErrorMessage', () => {
	it('maps a known error code to its default message', () => {
		expect(getClerkErrorMessage({ errors: [{ code: 'form_password_incorrect' }] })).toBe('Incorrect password');
	});

	it('falls back to the clerk-provided message for unknown codes', () => {
		expect(getClerkErrorMessage({ errors: [{ code: 'unknown_code', message: 'Raw clerk message' }] })).toBe(
			'Raw clerk message'
		);
	});

	it('falls back to a generic message when no code or message is present', () => {
		expect(getClerkErrorMessage({})).toBe('An error occurred. Please try again.');
		expect(getClerkErrorMessage(null)).toBe('An error occurred. Please try again.');
		expect(getClerkErrorMessage(undefined)).toBe('An error occurred. Please try again.');
	});

	it('lets overrides take precedence over defaults', () => {
		expect(
			getClerkErrorMessage(
				{ errors: [{ code: 'form_code_incorrect' }] },
				{ form_code_incorrect: 'Incorrect reset code. Please try again.' }
			)
		).toBe('Incorrect reset code. Please try again.');
	});

	it('does not mutate the default messages when overrides are provided', () => {
		getClerkErrorMessage({ errors: [{ code: 'form_code_incorrect' }] }, { form_code_incorrect: 'Other' });
		expect(DEFAULT_CLERK_ERROR_MESSAGES.form_code_incorrect).toBe('Incorrect verification code. Please try again.');
	});
});
