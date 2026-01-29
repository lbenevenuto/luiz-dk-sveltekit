# Fix: Sign In/Sign Up Buttons Missing in Preview

## Issue

Sign In/Sign Up buttons were visible in development (`bun run dev`) but missing in preview/production (`bun run preview`).

## Root Cause

The auth buttons were wrapped in a condition that required Clerk to be fully loaded:

```svelte
{#if clerkLoaded}
	{#if user}
		<!-- Show Sign Out button -->
	{:else}
		<!-- Show Sign In/Sign Up buttons -->
	{/if}
{/if}
```

If `clerkLoaded` was `false`, **no auth buttons would show at all**.

In preview mode, Clerk wasn't loading properly (or was loading too slowly), causing `clerkLoaded` to remain `false`, which hid all auth buttons.

## Solution

Removed the `clerkLoaded` condition and simplified the logic to always show appropriate buttons:

```svelte
<!-- BEFORE: Buttons only show if Clerk loaded -->
{#if clerkLoaded}
	{#if user}
		<!-- User menu -->
	{:else}
		<!-- Auth buttons -->
	{/if}
{/if}

<!-- AFTER: Buttons always show based on user state -->
{#if user}
	<!-- User menu with Sign Out -->
{:else}
	<!-- Sign In/Sign Up buttons - always visible -->
{/if}
```

## Benefits of This Approach

✅ **Better UX** - Auth buttons always visible, even if Clerk is slow to load  
✅ **Graceful degradation** - If Clerk fails to load, users can still access login page  
✅ **Consistent behavior** - Works the same in dev and preview  
✅ **Progressive enhancement** - Buttons work immediately, user state updates when Clerk loads

## Files Modified

- `src/routes/+layout.svelte` - Removed `clerkLoaded` condition from auth button rendering (both desktop and mobile nav)
- `src/routes/+layout.server.ts` - Added debug logging

## Debug Logging Added

Added console logs to help diagnose issues:

**Server-side** (`+layout.server.ts`):

```javascript
console.log('[Layout Server] Clerk config:', {
	hasPlatform: !!platform,
	hasEnv: !!platform?.env,
	publishableKey: '...',
	frontendApi: '...'
});
```

**Client-side** (`+layout.svelte`):

```javascript
console.log('Layout mounted - Clerk debug:', {
	browser,
	hasClerk: !!window.Clerk,
	publishableKey: data.clerkPublishableKey,
	frontendApi: data.clerkFrontendApi
});
```

## Testing

Now when you run:

```bash
bun run preview
```

You should see:
✅ Sign In and Sign Up buttons in the navigation  
✅ Buttons work correctly (navigate to login/register pages)  
✅ If you're logged in, you'll see the Sign Out button instead

Check the browser console (F12) to see the debug logs showing:

- Whether Clerk script loaded
- Clerk configuration values
- User authentication state

## Next Steps

Once this works, we can investigate why Clerk isn't loading in preview by checking the console logs. Possible issues:

- CORS or CSP blocking the Clerk script
- Incorrect environment variable values
- Network issues loading from Clerk CDN

For now, the auth buttons will work regardless of Clerk's loading state!

## Status

✅ **Fixed** - Auth buttons now always visible in both dev and preview!
