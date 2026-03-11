# AGENTS.md

> Guidelines for AI coding agents operating in this repository.

## CRITICAL RULES - NEVER SKIP

### Important Restrictions - NO EXCEPTIONS

- **NEVER** skip writing tests for new features
- **NEVER** make code changes that aren't directly related to your assigned task
- **NEVER** create files unless absolutely necessary for achieving goals
- **NEVER** proactively create documentation files (`*.md`) or README files unless explicitly requested
- **NEVER** over-engineer solutions — build only what's explicitly requested
- **NEVER** disable ESLint rules with `eslint-disable` comments — fix the underlying issues instead
- **NEVER** use `any` type — define proper types

### Required Commands - ALWAYS Execute

- **ALWAYS** read all links provided in prompts before beginning implementation
- **ALWAYS** run `bun run lint && bun run test` before completing any task
- **ALWAYS** check Context7 for latest docs when working with external libraries
- **ALWAYS** check and update `AGENTS.md` after any change to ensure it stays in sync with the codebase

### Commit Message Format

Follow [semantic-release](https://semantic-release.gitbook.io/semantic-release/) conventional commit format:

```
feat: add URL expiration support
fix: correct rate limit window calculation
chore: update dependencies
refactor: extract validation logic into utility
test: add coverage for redirect handler
docs: update API usage examples
```

### Pull Request Format

- Keep PR descriptions **super concise**
- **NEVER** add "Generated with Claude Code" or any AI attribution/signature to PR descriptions

---

## Tech Stack

- **Framework**: SvelteKit (Svelte 5 with runes) on Cloudflare Pages
- **Runtime**: Bun (package manager + scripts), Node 24.x for Wrangler tooling
- **Database**: Drizzle ORM on SQLite (local dev) / Cloudflare D1 (production)
- **Auth**: Clerk (server-side via `@clerk/backend`, client-side via Clerk JS SDK)
- **Styling**: Tailwind CSS v4 (utility-first, no component-scoped styles)
- **Validation**: Zod v4 (`zod` import path)
- **Monitoring**: Sentry (`@sentry/sveltekit`)
- **Cloudflare Bindings**: D1 (DB), KV (CACHE), Analytics Engine (ANALYTICS), Durable Objects (GLOBAL_COUNTER_DO)

## Commands

| Task                     | Command                                              |
| ------------------------ | ---------------------------------------------------- |
| Install                  | `bun install`                                        |
| Dev server               | `bun run dev`                                        |
| Build                    | `bun run build`                                      |
| Lint (prettier + eslint) | `bun run lint`                                       |
| Format                   | `bun run format`                                     |
| Typecheck                | `bun run check`                                      |
| Run all tests            | `bun run test`                                       |
| Run tests in watch mode  | `bun run test:unit`                                  |
| Run a single test file   | `bunx vitest run src/lib/adapters/analytics.test.ts` |
| Run tests matching name  | `bunx vitest run -t "should handle errors"`          |
| Tests with coverage      | `bun run test -- --coverage`                         |
| Generate DB migrations   | `bun run db:generate`                                |
| Apply migrations (local) | `bun run db:migrate`                                 |
| Deploy                   | `bun run deploy`                                     |

### CI Pipeline (`.github/workflows/ci.yml`)

Runs on push to `main` and all PRs: lint -> typecheck -> test (with coverage thresholds) -> build.

### Pre-commit Hook

Husky runs `lint-staged` on commit: prettier + eslint on `*.{js,ts,svelte,json}` files.

## Code Style

### Formatting (Prettier)

- **Tabs** for indentation (not spaces)
- **Single quotes**, no trailing commas
- **Print width**: 120 characters
- Plugins: `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`

### Imports

- Use `$lib/` alias for all library imports, `$app/` for SvelteKit internals
- Use `import type` for type-only imports
- Group order: framework (`@sveltejs/kit`) -> external libs -> `$lib/server` -> `$lib/` -> relative
- Zod is imported as `import { z } from 'zod'`

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createShortUrl } from '$lib/utils';
import { logger } from '$lib/server/logger';
import { z } from 'zod';
```

### TypeScript

- **Strict mode** enabled (`"strict": true`)
- Prefer type inference where obvious; explicit types for function signatures
- Use `interface` for object shapes, `type` for unions/aliases
- Drizzle schema types via `$inferSelect` / `$inferInsert`
- Avoid `as any` — when unavoidable in tests, use `eslint-disable` comment on the line
- Never use `@ts-ignore` or `@ts-expect-error`

### Naming Conventions

| Item                      | Convention                | Example                                    |
| ------------------------- | ------------------------- | ------------------------------------------ |
| Files (lib/utils)         | kebab-case                | `rate-limit.ts`, `auth-handle.ts`          |
| Svelte components         | PascalCase                | `FormInput.svelte`, `SEO.svelte`           |
| Svelte stores             | kebab-case + `.svelte.ts` | `toast.svelte.ts`                          |
| Functions                 | camelCase                 | `createShortUrl`, `requireAuth`            |
| Variables                 | camelCase                 | `shortCode`, `userId`                      |
| Types/Interfaces          | PascalCase                | `ClickData`, `Toast`, `UserRole`           |
| Constants (regex, config) | UPPER_SNAKE_CASE          | `CUSTOM_CODE_REGEX`                        |
| DB columns                | snake_case                | `short_code`, `original_url`               |
| Test files                | colocated, `*.test.ts`    | `analytics.test.ts` next to `analytics.ts` |

### Error Handling

- **API endpoints**: Return `json({ error: string }, { status: number })` for client errors
- **Auth guards**: Throw SvelteKit `error(401, { message })` or `error(403, { message })`
- **Redirects**: Throw SvelteKit `redirect(302, '/path')`
- **Custom errors**: Extend `Error` with `name` property and typed fields
- **Validation**: Zod `safeParse()` -> return 400 with `z.prettifyError()`
- **Infrastructure errors**: Try-catch, log with `logger.error()`, fail-open when appropriate
- **Never** use empty catch blocks — always log or re-throw

```typescript
// Custom error class pattern
export class ShortCodeConflictError extends Error {
	public readonly shortCode: string;
	constructor(shortCode: string) {
		super(`Short code "${shortCode}" is already taken`);
		this.name = 'ShortCodeConflictError';
		this.shortCode = shortCode;
	}
}
```

## Svelte 5 Patterns

This project uses **Svelte 5 runes** exclusively. No legacy `$:`, `export let`, or stores API.

- **Props**: `let { prop1, prop2 = default }: PropsType = $props()`
- **State**: `let value = $state<Type>(initial)`
- **Derived**: `const computed = $derived(expression)`
- **Bindable props**: `value = $bindable('')` for two-way binding
- **Component props type**: Define inline or as a separate `interface`, destructure in `$props()`

## Server-Side Patterns

### Route Handlers (`+server.ts`)

Export typed handlers: `export const GET: RequestHandler = async ({ platform, request, locals }) => { ... }`

- Access Cloudflare bindings via `platform.env`
- Access auth state via `locals.auth` (populated by hooks)
- Always validate input with Zod before processing

### Load Functions (`+page.server.ts`)

Export typed load: `export const load: PageServerLoad = async ({ platform, locals }) => { ... }`

- Auth checks first: `if (!locals.auth.userId) throw redirect(302, '/login')`
- Use `requireAuth(locals)` / `requireAdmin(locals)` from `$lib/server/auth`

### Database Access

- Get DB via adapter factory: `const db = await getDb(platform)` or `getDatabaseAdapter(platform)`
- Drizzle query builder: `db.select().from(urls).where(eq(urls.shortCode, code))`
- Schemas in `src/lib/server/db/schemas/` — barrel export from `index.ts`

### Logging

Use structured logger from `$lib/server/logger`:

```typescript
logger.info('event.name', { key: 'value' });
logger.warn('warning.name', { context });
logger.error('error.name', { error: err instanceof Error ? err.message : String(err) });
```

## Testing

- **Framework**: Vitest with `node` environment
- **Assertions required**: `expect.requireAssertions` is enabled — every test MUST have at least one `expect()`
- **Mocking**: Use `vi.mock()` for module mocks, `vi.fn()` for function mocks, `vi.spyOn()` for spies
- **Test colocation**: Tests live next to source files (`foo.ts` -> `foo.test.ts`)
- **SvelteKit mocks**: Mock `$lib/*` and `$app/*` paths via `vi.mock()`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import type { RequestEvent } from '@sveltejs/kit';

vi.mock('$lib/server/rate-limit', () => ({
	checkAnonymousRateLimit: vi.fn()
}));

describe('POST /api/v1/shorten', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return 429 if rate limit exceeded', async () => {
		// ...setup mocks, call handler, assert response
		expect(response.status).toBe(429);
	});
});
```

## Architecture Notes

- **Adapter pattern**: `src/lib/adapters/` provides swappable implementations (Cloudflare vs local dev)
- **Factory functions**: `src/lib/adapters/factory.ts` resolves correct adapter based on `dev` flag
- **Platform check**: Always guard `platform` access — it's `undefined` during SSR/prerender
- **Env vars**: Accessed via `platform.env` (Cloudflare bindings), NOT `process.env` (except Sentry DSN fallback)
- **Hooks chain**: `initialHook` -> `sentryInitHandle` -> `sentryHandle` -> `authHandle` -> `securityHeadersHandle`
