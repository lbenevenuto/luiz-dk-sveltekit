# Authentication Implementation - Quick Reference

## Routes

### Login

- **URL:** `/login`
- **Features:** Email + password, forgot password link, redirect support
- **Component:** `src/routes/login/+page.svelte`

### Register

- **URL:** `/register`
- **Features:** 2-step flow (registration → email verification), password confirmation
- **Component:** `src/routes/register/+page.svelte`

## Reusable Components

### FormInput

```svelte
<FormInput
	type="email"
	label="Email"
	bind:value={email}
	placeholder="you@example.com"
	required
	error={emailError}
	disabled={loading}
/>
```

### SubmitButton

```svelte
<SubmitButton loading={isLoading} text="Sign In" loadingText="Signing in..." />
```

## Clerk API Usage

### Login

```typescript
const result = await window.Clerk.client.signIn.create({
	identifier: email,
	password
});

if (result.status === 'complete') {
	await window.Clerk.setActive({ session: result.createdSessionId });
}
```

### Register

```typescript
// Step 1: Create account
const signUp = await window.Clerk.client.signUp.create({
	emailAddress: email,
	password
});

// Step 2: Send verification code
await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

// Step 3: Verify code
const result = await signUp.attemptEmailAddressVerification({ code });

if (result.status === 'complete') {
	await window.Clerk.setActive({ session: result.createdSessionId });
}
```

## Error Messages

Common Clerk error codes mapped to user-friendly messages:

| Code                        | Message                              |
| --------------------------- | ------------------------------------ |
| `form_identifier_not_found` | No account found with this email     |
| `form_password_incorrect`   | Incorrect password                   |
| `form_param_format_invalid` | Invalid email format                 |
| `form_password_pwned`       | Password compromised, choose another |
| `form_identifier_exists`    | Account already exists               |
| `form_code_incorrect`       | Incorrect verification code          |

## Protected Routes

Admin routes automatically redirect unauthenticated users to `/login?redirect_url=/admin/...`

After login, users are redirected back to the original URL.

## Customization Examples

### Add a field to registration

```svelte
<FormInput type="text" label="Username" bind:value={username} required />
```

Then update Clerk call:

```typescript
const signUp = await window.Clerk.client.signUp.create({
	emailAddress: email,
	password,
	username // Add here
});
```

### Change button styling

Edit `src/lib/components/SubmitButton.svelte`:

```svelte
class="... bg-gradient-to-r from-blue-500 to-cyan-600 ..."
```

### Add OAuth providers

```typescript
// Fallback to Clerk modal for OAuth
window.Clerk.openSignIn(); // Shows all OAuth options
```

## Common Tasks

### Test locally

```bash
bun run dev
# Visit http://localhost:5173/login or /register
```

### Check code quality

```bash
bun run lint     # Check linting
bun run format   # Auto-format
bun run check    # Type check
```

### Deploy

```bash
bun run build    # Build for production
wrangler deploy  # Deploy to Cloudflare
```

## File Locations

| Purpose              | File Path                                |
| -------------------- | ---------------------------------------- |
| Login page           | `src/routes/login/+page.svelte`          |
| Register page        | `src/routes/register/+page.svelte`       |
| Form input component | `src/lib/components/FormInput.svelte`    |
| Submit button        | `src/lib/components/SubmitButton.svelte` |
| Route protection     | `src/hooks.server.ts`                    |
| Navigation links     | `src/routes/+layout.svelte`              |
| Type definitions     | `src/app.d.ts`                           |

## Key Features

✅ **Fully custom UI** - No Clerk modals
✅ **Type-safe** - TypeScript everywhere
✅ **Accessible** - WCAG compliant
✅ **Responsive** - Mobile + desktop
✅ **Error handling** - User-friendly messages
✅ **Loading states** - Visual feedback
✅ **Validation** - Client-side + server-side
✅ **Redirect support** - Return to original URL
✅ **Forgot password** - Opens Clerk modal
✅ **Email verification** - 2-step registration

## Troubleshooting

### "window.Clerk is undefined"

Wait for Clerk to load. The pages show a loading spinner until `window.Clerk` is available.

### "Authentication service is not ready"

Check that `CLERK_PUBLISHABLE_KEY` is set in environment variables and Clerk script is loaded in layout.

### Redirects not working

Ensure `PUBLIC_ROUTES` in `hooks.server.ts` includes `/login` and `/register`.

### Styling doesn't match

All components use Tailwind classes matching the existing design system. Check that Tailwind is processing the new files.

---

For complete documentation, see `AUTHENTICATION_UPDATE.md`
