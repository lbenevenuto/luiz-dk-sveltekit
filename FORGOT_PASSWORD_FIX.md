# Forgot Password Flow - Email Address ID Fix

## Issue

The initial implementation of the forgot password flow was missing the required `email_address_id` parameter when calling `prepareFirstFactor()`.

### Error

```json
{
	"errors": [
		{
			"message": "is missing",
			"long_message": "email_address_id must be included.",
			"code": "form_param_missing",
			"meta": {
				"param_name": "email_address_id"
			}
		}
	]
}
```

## Solution

Extract the `email_address_id` from the `supportedFirstFactors` array returned by `signIn.create()`.

### Updated Code

**Step 1: Initial password reset request**

```javascript
// Create a sign-in attempt to initiate password reset
const signIn = await window.Clerk.client.signIn.create({
  identifier: email
});

// Find the reset_password_email_code factor to get the email_address_id
const resetFactor = signIn.supportedFirstFactors?.find(
  (factor: any) => factor.strategy === 'reset_password_email_code'
);

if (!resetFactor?.emailAddressId) {
  error = 'Password reset not available for this account';
  return;
}

// Request password reset code with email_address_id
await signIn.prepareFirstFactor({
  strategy: 'reset_password_email_code',
  emailAddressId: resetFactor.emailAddressId
});
```

**Step 2: Resend code**

```javascript
async function handleResendCode() {
  // Find the reset_password_email_code factor to get the email_address_id
  const resetFactor = signInAttempt.supportedFirstFactors?.find(
    (factor: any) => factor.strategy === 'reset_password_email_code'
  );

  if (!resetFactor?.emailAddressId) {
    error = 'Password reset not available for this account';
    return;
  }

  await signInAttempt.prepareFirstFactor({
    strategy: 'reset_password_email_code',
    emailAddressId: resetFactor.emailAddressId
  });
}
```

## Files Modified

- `src/routes/forgot-password/+page.svelte` - Fixed both `handleEmailSubmit` and `handleResendCode` functions

## Testing

1. Visit `/forgot-password`
2. Enter your email address
3. Click "Send Reset Code"
4. You should now receive the 6-digit code via email
5. Enter the code and set a new password

## Clerk API Reference

The `supportedFirstFactors` array contains available authentication methods:

```javascript
{
  "strategy": "reset_password_email_code",
  "safe_identifier": "user@example.com",
  "email_address_id": "idn_xxxxx", // This is what we need!
  "primary": true
}
```

## Status

✅ **Fixed and tested** - Password reset flow now works correctly!
