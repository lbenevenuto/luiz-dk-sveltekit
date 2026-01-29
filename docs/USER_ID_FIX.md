# Fix: User ID Not Saved When Shortening URLs

## Problem

When logged-in users shortened URLs, the `user_id` field in the database was `null` instead of containing their Clerk user ID.

## Root Cause

The `/api/v1/shorten` endpoint is a **public route** (to allow anonymous users), but when making client-side `fetch()` calls, the Clerk session token wasn't being included in the request headers.

**In hooks.server.ts:**

- Public routes still try to authenticate users if credentials are provided
- BUT the frontend wasn't sending authentication credentials with API requests

## Solution

### 1. Client-Side: Send Session Token with API Requests

**File:** `src/routes/shortener/+page.svelte`

```typescript
// Get Clerk session token if user is logged in
const headers: Record<string, string> = {
	'Content-Type': 'application/json'
};

if (window.Clerk?.session) {
	try {
		const token = await window.Clerk.session.getToken();
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}
	} catch (err) {
		console.warn('Failed to get Clerk session token:', err);
		// Continue without token - API supports anonymous users
	}
}

const response = await fetch('/api/v1/shorten', {
	method: 'POST',
	headers,
	body: JSON.stringify(body)
});
```

### 2. Server-Side: Verify Bearer Token

**File:** `src/hooks.server.ts`

Added Bearer token authentication for public routes:

```typescript
import { verifyToken } from '@clerk/backend';

// In the public route authentication section:
const authHeader = event.request.headers.get('Authorization');
const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

if (bearerToken) {
	// Verify the session token using Clerk's verifyToken
	const verifiedToken = await verifyToken(bearerToken, {
		secretKey: platform.env.CLERK_SECRET_KEY,
		authorizedParties: [platform.env.BASE_URL || 'http://localhost:5173']
	});

	const userId = verifiedToken.sub; // Subject claim contains userId

	if (userId) {
		// Fetch full user to get metadata
		const user = await clerkClient.users.getUser(userId);
		const role = (user.publicMetadata?.role as UserRole) || 'user';

		event.locals.auth = {
			userId,
			sessionId: verifiedToken.sid || null,
			user,
			role
		};
	}
}
```

## How It Works Now

### For Logged-In Users:

1. User clicks "Shorten URL" on `/shortener` page
2. Frontend gets Clerk session token via `window.Clerk.session.getToken()`
3. Token is sent in `Authorization: Bearer <token>` header
4. Server verifies token using `verifyToken()` from `@clerk/backend`
5. `event.locals.auth.userId` is populated with Clerk user ID
6. API endpoint passes `auth.userId` to `createShortUrl()`
7. Database saves URL with correct `user_id`

### For Anonymous Users:

1. No Clerk session → no Authorization header sent
2. Server authenticates as anonymous (`userId: null`)
3. Rate limiting applies
4. Database saves URL with `user_id: null` and `created_by_anonymous: true`

## Testing

### Test as Logged-In User:

1. Sign in at `/login`
2. Go to `/shortener`
3. Shorten a URL
4. Check database - `user_id` should be your Clerk user ID
5. Check console - should see: `[Auth] Authenticated via Bearer token: { userId: 'user_xxx', role: 'user' }`

### Test as Anonymous User:

1. Sign out
2. Go to `/shortener`
3. Shorten a URL
4. Check database - `user_id` should be `null`, `created_by_anonymous` should be `1`

## Files Modified

1. **src/routes/shortener/+page.svelte**
   - Added code to get Clerk session token
   - Includes token in Authorization header when available

2. **src/hooks.server.ts**
   - Added `import { verifyToken } from '@clerk/backend'`
   - Added Bearer token verification for public routes
   - Falls back to cookie-based auth if no Bearer token

## Dependencies Used

- `@clerk/backend` v2.29.5
  - `verifyToken()` function for JWT verification
  - Uses RS256 algorithm
  - Validates token signature, expiration, and authorized parties

## Environment Variables Required

- `CLERK_SECRET_KEY` - For verifying tokens
- `BASE_URL` (optional) - For authorizedParties validation (defaults to localhost:5173)

## Debug Logging

Added console logs to verify authentication:

- `[Auth] Authenticated via Bearer token:` - When API request includes valid token
- `[Auth] Authenticated via cookie:` - When cookie-based auth succeeds

## Security Notes

- Bearer tokens are verified using Clerk's secret key
- Tokens include signature validation to prevent tampering
- `authorizedParties` check prevents CSRF attacks
- Anonymous users still subject to rate limiting
- No credentials required for anonymous URL shortening (by design)

## Next Steps

Once tested and confirmed working, remove debug console.log statements:

- Line in `src/hooks.server.ts` with `console.log('[Auth] Authenticated via Bearer token...')`
- Line in `src/hooks.server.ts` with `console.log('[Auth] Authenticated via cookie...')`
