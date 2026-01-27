# Clerk Authentication Setup Guide

This project now has **Clerk authentication** integrated with role-based access control (RBAC), rate limiting for anonymous users, and user management features.

## Features Implemented

✅ **Authentication**

- Sign in / Sign up pages
- Server-side authentication middleware
- Client-side Clerk integration
- Protected routes (/admin/\* requires authentication)

✅ **Role-Based Access Control (RBAC)**

- Two roles: `admin` and `user`
- Roles stored in Clerk's `publicMetadata`
- Admin-only routes and features
- Admin user management page

✅ **Rate Limiting**

- Anonymous users: 10 URLs per hour
- Authenticated users: Unlimited
- Cloudflare Rate Limiting API integration

✅ **User Tracking**

- URLs are associated with user IDs
- Anonymous URLs are flagged
- User management dashboard for admins

✅ **Webhooks**

- Automatic role assignment on user creation
- User lifecycle event handling

---

## Quick Start

### 1. Set Up Clerk Account

1. Go to https://dashboard.clerk.com
2. Create a new application
3. Choose authentication methods (Email, Google, GitHub, etc.)
4. Note your API keys from the **API Keys** page

### 2. Configure Environment Variables

Update `.env` with your Clerk keys:

```env
# Clerk Authentication
CLERK_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"
CLERK_SECRET_KEY="sk_test_YOUR_KEY_HERE"
CLERK_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET_HERE"
CLERK_FRONTEND_API="clerk.your-app.12345.lcl.dev"
```

**Get these values:**

- `CLERK_PUBLISHABLE_KEY`: Dashboard → API Keys → Copy "Publishable Key"
- `CLERK_SECRET_KEY`: Dashboard → API Keys → Copy "Secret Key"
- `CLERK_FRONTEND_API`: Dashboard → API Keys → "Frontend API" (without https://)
- `CLERK_WEBHOOK_SECRET`: Created in step 4 below

### 3. Update Wrangler Configuration

Update `wrangler.jsonc` with production values:

```jsonc
{
	"vars": {
		"CLERK_PUBLISHABLE_KEY": "pk_live_YOUR_PRODUCTION_KEY",
		"CLERK_FRONTEND_API": "clerk.luiz.dk"
	}
}
```

**Add secret key to Cloudflare:**

```bash
wrangler secret put CLERK_SECRET_KEY
# Paste your production secret key when prompted

wrangler secret put CLERK_WEBHOOK_SECRET
# Paste your webhook secret when prompted
```

### 4. Configure Webhook

1. Go to **Clerk Dashboard → Webhooks**
2. Click **Add Endpoint**
3. Enter URL: `https://luiz.dk/api/webhooks/clerk`
4. Subscribe to events:
   - `user.created`
   - `user.deleted`
   - `user.updated`
5. Copy the **Signing Secret** to `CLERK_WEBHOOK_SECRET`

### 5. Configure Allowed Domains

In Clerk Dashboard → **Domains**:

**Development:**

- Add `localhost:5173`

**Production:**

- Add `luiz.dk`
- Add `*.luiz.dk` (if using subdomains)

### 6. Run Database Migration

Apply the new schema to add `userId` fields:

```bash
# Local development
bun run db:push

# Production (Cloudflare D1)
wrangler d1 migrations apply luiz_dk --remote
```

### 7. Set Your First Admin User

After deploying and signing up with your account:

**Option A: Via Clerk Dashboard**

1. Go to **Clerk Dashboard → Users**
2. Click on your user
3. Go to **Metadata → Public**
4. Add: `{ "role": "admin" }`

**Option B: Via Wrangler Script**

```bash
# Replace USER_ID with your Clerk user ID
echo "Your Clerk User ID is in the Clerk dashboard under your user profile"
```

Then use Clerk API or dashboard to set metadata.

---

## Project Structure

### New Files Created

```
src/
├── lib/
│   ├── server/
│   │   ├── clerk.ts           # Clerk client utility
│   │   ├── auth.ts             # Auth helper functions
│   │   └── rate-limit.ts       # Rate limiting utility
│   └── types/
│       └── auth.ts             # Auth type definitions (in app.d.ts)
├── routes/
│   ├── +layout.server.ts       # Pass Clerk keys to client
│   ├── sign-in/+page.svelte    # Sign in page
│   ├── sign-up/+page.svelte    # Sign up page
│   ├── admin/
│   │   └── users/
│   │       ├── +page.server.ts # User management server logic
│   │       └── +page.svelte    # User management UI
│   └── api/webhooks/clerk/
│       └── +server.ts          # Clerk webhook handler
└── app.d.ts                    # Updated with auth types
```

### Modified Files

- `src/hooks.server.ts` - Authentication middleware
- `src/routes/+layout.svelte` - Added Clerk client + auth UI
- `src/lib/server/db/schemas/urls.ts` - Added `userId` field
- `src/lib/utils/index.ts` - Updated `createShortUrl` to accept `userId`
- `src/routes/api/v1/shorten/+server.ts` - Rate limiting + user tracking
- `src/routes/api/v1/test/+server.ts` - User tracking
- `src/routes/api/v1/reset/+server.ts` - Admin-only protection
- `wrangler.jsonc` - Rate limiter binding + Clerk vars
- `.env` - Clerk environment variables

---

## Authentication Flow

### 1. Server-Side (hooks.server.ts)

```typescript
// On every request:
1. Extract Clerk session token from cookies/headers
2. Verify token with Clerk using clerkClient.authenticateRequest()
3. Fetch full user object including publicMetadata
4. Extract role from publicMetadata
5. Attach to event.locals.auth

// Protect routes:
- /admin/* → Requires role === 'admin'
- /api/v1/reset → Requires admin
- /api/v1/shorten → Rate limited for anonymous users
```

### 2. Client-Side (+layout.svelte)

```typescript
1. Load Clerk.js from CDN
2. Initialize with publishableKey
3. Listen for user state changes
4. Show Sign In/Sign Up buttons OR user menu
5. Display Admin link if user.publicMetadata.role === 'admin'
```

### 3. Rate Limiting

**Anonymous Users:**

- Key: `anon:${IP_ADDRESS}`
- Limit: 10 requests per hour
- Uses Cloudflare Rate Limiting API

**Authenticated Users:**

- No rate limit
- Unlimited URL creation

---

## API Reference

### Auth Helpers (`src/lib/server/auth.ts`)

```typescript
// Throw 401 if not authenticated
requireAuth(locals);

// Throw 403 if not admin
requireAdmin(locals);

// Check if user is authenticated
if (isAuthenticated(locals)) {
}

// Check if user has a specific role
if (hasRole(locals, 'admin')) {
}
```

### Usage Example

```typescript
import { requireAuth } from '$lib/server/auth';

export const POST = async ({ locals, platform }) => {
	requireAuth(locals); // Throws 401 if not logged in

	const userId = locals.auth.userId;
	const role = locals.auth.role;
	const user = locals.auth.user;

	// Your logic here
};
```

---

## Role Management

### Default Role Assignment

When a user signs up:

1. Clerk webhook fires `user.created` event
2. Webhook endpoint `/api/webhooks/clerk` receives it
3. Automatically sets `publicMetadata.role = 'user'`

### Changing Roles

**Via Admin Dashboard (`/admin/users`):**

- View all users
- Promote user to admin
- Demote admin to user

**Via Clerk Dashboard:**

1. Go to Users → Select user
2. Metadata → Public
3. Edit: `{ "role": "admin" }` or `{ "role": "user" }`

**Via Clerk API:**

```typescript
const clerkClient = getClerkClient(platform.env);
await clerkClient.users.updateUserMetadata(userId, {
	publicMetadata: { role: 'admin' }
});
```

---

## Rate Limiting Configuration

Rate limiter is configured in `wrangler.jsonc`:

```jsonc
"ratelimits": [
  {
    "name": "URL_SHORTENER_RATE_LIMITER",
    "namespace_id": "1001",
    "simple": {
      "limit": 10,        // 10 requests
      "period": 3600      // per hour (in seconds)
    }
  }
]
```

**To adjust limits:**

- Change `limit` value
- Change `period` (must be 10 or 60 seconds, or use advanced mode)

---

## Testing

### Local Development

```bash
# Start dev server
bun run dev

# Test authentication flow:
1. Visit http://localhost:5173
2. Click "Sign Up" → Create account
3. You'll be logged in automatically
4. Try creating a URL (should work - no rate limit locally)

# Test admin features:
1. Set your user to admin via Clerk Dashboard
2. Visit http://localhost:5173/admin/users
3. Should see user management page
```

### Testing Rate Limiting

**Note:** Rate limiting only works in production (Cloudflare Workers).

Local dev bypasses rate limits for easier testing.

---

## Deployment

```bash
# 1. Apply database migration
wrangler d1 migrations apply luiz_dk --remote

# 2. Set Clerk secrets
wrangler secret put CLERK_SECRET_KEY
wrangler secret put CLERK_WEBHOOK_SECRET

# 3. Deploy
bun run deploy

# 4. Configure webhook URL in Clerk Dashboard
# URL: https://luiz.dk/api/webhooks/clerk

# 5. Test in production
# - Sign up at https://luiz.dk/sign-up
# - Create URLs (rate limited to 10/hour as anonymous)
# - Sign in and create more (unlimited)
```

---

## Troubleshooting

### "Clerk is not defined" errors

**Cause:** Clerk.js hasn't loaded yet

**Fix:** The code already handles this with loading states. If you see this error:

1. Check browser console for network errors
2. Verify `CLERK_FRONTEND_API` is correct
3. Check Clerk Dashboard → Domains for allowed domains

### Webhook not receiving events

1. Check webhook URL is correct: `https://luiz.dk/api/webhooks/clerk`
2. Verify `CLERK_WEBHOOK_SECRET` matches Clerk Dashboard
3. Check Cloudflare logs: `wrangler tail`
4. Test webhook in Clerk Dashboard → Webhooks → Test

### Rate limiting not working

Rate limiting only works in production with Cloudflare Workers.

Local dev allows all requests.

To test:

1. Deploy to Cloudflare
2. Create 10 URLs without signing in
3. 11th request should return 429

### Admin routes return 403

1. Verify your user has `role: "admin"` in Clerk metadata
2. Check Clerk Dashboard → Your User → Metadata → Public
3. Should see: `{ "role": "admin" }`
4. Sign out and sign back in to refresh the session

---

## Security Best Practices

✅ **Secrets Management**

- Never commit `.env` to git
- Use `wrangler secret` for production
- Rotate keys periodically

✅ **Webhook Verification**

- Webhook signature is always verified using Svix
- Invalid signatures are rejected with 400

✅ **Rate Limiting**

- Anonymous users are rate limited by IP
- Uses Cloudflare's native rate limiting (not bypassable)

✅ **Role Verification**

- Roles are verified server-side on every request
- Client-side role checks are UI-only, not security

✅ **HTTPS Only**

- Clerk requires HTTPS in production
- Cloudflare provides TLS automatically

---

## Next Steps

**Optional Enhancements:**

1. **User Dashboard** (`/dashboard/urls`)
   - List user's created URLs
   - Edit/delete own URLs
   - View click statistics

2. **Analytics per User**
   - Track which user's URLs get the most clicks
   - User-specific analytics

3. **Organizations/Teams**
   - Clerk supports organizations out of the box
   - Share URLs within a team
   - Team-level analytics

4. **Custom Claims**
   - Add more metadata (plan, quota, etc.)
   - Implement tiered pricing

5. **Email Notifications**
   - Send email when URL expires
   - Weekly usage reports

---

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk SvelteKit Guide](https://clerk.com/docs/references/backend/overview)
- [Cloudflare Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Drizzle ORM](https://orm.drizzle.team/)

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Cloudflare logs: `wrangler tail`
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly

**Common Issues:**

- TypeScript errors about `window.Clerk` → These are type-only errors and won't affect runtime
- LSP warnings in Svelte files → Can be safely ignored, Svelte 5 is newer than some type definitions

---

**Clerk Integration Complete!** 🎉

Your URL shortener now has:

- ✅ User authentication
- ✅ Admin/User roles
- ✅ Rate limiting for anonymous users
- ✅ User management dashboard
- ✅ Webhook integration
- ✅ User-owned URLs
