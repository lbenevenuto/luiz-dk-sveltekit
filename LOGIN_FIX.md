# Login Flow - Two-Step Authentication Fix

## Issue

Login was failing with "Incorrect password" even when using the correct password set in Clerk Dashboard.

## Root Cause

The login implementation was trying to authenticate in a single step by passing both `identifier` and `password` to `signIn.create()`:

```javascript
// ❌ WRONG - Single step (doesn't work)
const result = await window.Clerk.client.signIn.create({
	identifier: email,
	password // Can't include password here
});
```

However, Clerk's client-side authentication requires a **two-step process**:

1. Create sign-in attempt with identifier
2. Attempt first factor with password

## Solution

Split the authentication into two steps using `attemptFirstFactor()`:

```javascript
// ✅ CORRECT - Two-step process

// Step 1: Create sign-in attempt with identifier only
const signIn = await window.Clerk.client.signIn.create({
	identifier: email
});

// Step 2: Attempt first factor (password authentication)
const result = await signIn.attemptFirstFactor({
	strategy: 'password',
	password
});

// Step 3: Set active session if successful
if (result.status === 'complete') {
	await window.Clerk.setActive({ session: result.createdSessionId });
	goto(redirectUrl);
}
```

## Why This Pattern?

This is the same pattern used in:

- **Registration flow** (`/register`) - Email verification
- **Password reset flow** (`/forgot-password`) - Reset code verification

Clerk uses a multi-step authentication flow to support:

- Multiple authentication strategies (password, email code, OAuth, etc.)
- Two-factor authentication (2FA)
- Progressive authentication requirements

## Files Modified

- `src/routes/login/+page.svelte` - Updated `handleSubmit()` to use two-step authentication

## Testing

1. Visit `/login`
2. Enter your email: `luiz.benevenuto+clerk@gmail.com`
3. Enter your password
4. Click "Sign In"
5. ✅ **Should now work correctly!**

## Clerk API Flow

```
User submits form
     ↓
1. signIn.create({ identifier: email })
   → Returns SignIn object with available authentication methods
     ↓
2. signIn.attemptFirstFactor({ strategy: 'password', password })
   → Attempts password authentication
     ↓
3. Check result.status === 'complete'
   → If complete, session is created
     ↓
4. Clerk.setActive({ session: result.createdSessionId })
   → Activates the session
     ↓
5. Redirect to destination
```

## Status

✅ **Fixed and ready to test** - Login should now work with correct passwords!

## All Auth Flows Updated

All three authentication flows now use the correct two-step pattern:

- ✅ `/login` - Two-step: identifier → password
- ✅ `/register` - Two-step: signup → email verification
- ✅ `/forgot-password` - Two-step: identifier → reset code → new password
