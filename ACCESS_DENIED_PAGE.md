# Improvement: Better Access Denied Page

## Before

When a non-admin user tried to access `/admin` routes, they got a plain text response:

```
Access Denied: Admin privileges required
```

This was ugly and didn't match the design system.

## After

Created a beautiful, user-friendly 403 error page that:

- ✅ Matches the dark theme design system
- ✅ Shows a clear icon and message
- ✅ Displays the attempted URL
- ✅ Provides navigation options (Go Home, Go Back)
- ✅ Includes helpful text about contacting an admin

## Changes Made

### 1. Created 403 Page

**File:** `src/routes/403/+page.svelte`

**Features:**

- Warning icon in red gradient ring
- Large "Access Denied" heading
- Clear explanation message
- Shows the attempted URL path
- Two action buttons:
  - **Go Home** (primary button, indigo gradient)
  - **Go Back** (secondary button, gray)
- Help text at bottom

**Design:**

- Dark theme: `bg-gray-900`
- Red accent for warning: `bg-red-500/10`, `ring-red-500/5`
- Indigo primary button: `bg-indigo-600 hover:bg-indigo-700`
- Responsive layout with Flexbox
- Icons from Heroicons

### 2. Updated Hooks to Redirect

**File:** `src/hooks.server.ts`

**Before:**

```typescript
if (event.locals.auth.role !== 'admin') {
	return new Response('Access Denied: Admin privileges required', { status: 403 });
}
```

**After:**

```typescript
if (event.locals.auth.role !== 'admin') {
	// Redirect to 403 page with attempted URL
	return new Response(null, {
		status: 307,
		headers: { location: `/403?url=${encodeURIComponent(url.pathname)}` }
	});
}
```

### 3. Added /403 to Public Routes

**File:** `src/hooks.server.ts`

Added `/403` to `PUBLIC_ROUTES` array so the error page is accessible without authentication.

```typescript
const PUBLIC_ROUTES = [
	'/',
	'/about',
	'/login',
	'/register',
	'/forgot-password',
	'/403', // Access denied page ← NEW
	'/shortener',
	'/api/v1/shorten',
	'/api/webhooks/clerk'
];
```

## User Flow

### Non-Admin User Tries to Access Admin Page:

1. User navigates to `/admin/analytics` (while logged in as regular user)
2. Hooks check: `auth.role !== 'admin'`
3. User redirected to `/403?url=/admin/analytics`
4. Beautiful error page shows:
   - ⚠️ Warning icon
   - "Access Denied" heading
   - "You don't have permission to access this page. Admin privileges are required."
   - Box showing: "Attempted to access: /admin/analytics"
   - Buttons: "Go Home" | "Go Back"
   - Help text: "If you believe you should have access, please contact an administrator."

### Logged Out User Tries to Access Admin Page:

1. User navigates to `/admin/analytics` (not logged in)
2. Hooks check: `!auth.userId`
3. User redirected to `/login?redirect_url=/admin/analytics`
4. After login:
   - **If admin:** Redirected to `/admin/analytics` ✅
   - **If not admin:** Redirected to `/403?url=/admin/analytics` ⚠️

## Visual Design

```
┌─────────────────────────────────────┐
│                                     │
│         ⚠️ (Red warning icon)        │
│                                     │
│       Access Denied                 │
│                                     │
│  You don't have permission to       │
│  access this page. Admin            │
│  privileges are required.           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Attempted to access:          │  │
│  │ /admin/analytics              │  │
│  └───────────────────────────────┘  │
│                                     │
│  [🏠 Go Home]  [← Go Back]          │
│                                     │
│  If you believe you should have     │
│  access, please contact an admin.   │
│                                     │
└─────────────────────────────────────┘
```

## Color Palette

- **Background:** `bg-gray-900` (page), `bg-gray-800/50` (card)
- **Warning Icon:** `text-red-500` with `bg-red-500/10` background
- **Text:** `text-white` (headings), `text-gray-400` (body), `text-gray-500` (help)
- **Code:** `text-indigo-400` (attempted URL)
- **Primary Button:** `bg-indigo-600 hover:bg-indigo-700`
- **Secondary Button:** `bg-gray-800 hover:bg-gray-700 border-gray-700`

## Testing

### Test as Regular User:

1. Sign in at https://luiz.dk/login (with non-admin account)
2. Try to access https://luiz.dk/admin/analytics
3. Should see beautiful 403 page with proper styling

### Test as Logged Out:

1. Sign out
2. Try to access https://luiz.dk/admin/users
3. Should redirect to login
4. After login (as non-admin): see 403 page

### Direct Access:

Visit https://luiz.dk/403 to see the page (without attempted URL parameter)

## Files Modified

1. **src/routes/403/+page.svelte** (NEW) - Access denied page
2. **src/hooks.server.ts**
   - Added `/403` to PUBLIC_ROUTES
   - Changed admin access check to redirect to 403 page

## Deployment

- **Deployed to:** https://b059d7e0.luiz-dk-sveltekit.pages.dev
- **Production domain:** https://luiz.dk

## Benefits

1. **Better UX** - Clear visual feedback instead of plain text
2. **Consistent design** - Matches the dark theme throughout the app
3. **Helpful** - Shows what page they tried to access
4. **Actionable** - Clear navigation options
5. **Professional** - Polished error handling
6. **Accessible** - Semantic HTML, proper headings, ARIA labels

## Responsive Design

The page is fully responsive:

- **Mobile:** Stacked buttons, centered content
- **Desktop:** Side-by-side buttons, wider layout
- Uses Tailwind's `sm:` breakpoint for responsive behavior

---

**No more ugly plain text errors!** ✨
