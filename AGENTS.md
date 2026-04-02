# AGENTS.md

> Guidelines for AI coding agents operating in this repository.

## CRITICAL RULES — NEVER SKIP

- **Never commit or push** without explicit user instruction
- **Never skip writing tests** — all new code requires test coverage
- **Never make unrelated changes** — stick strictly to the assigned task
- **Never use `any` type** — define proper TypeScript types
- **Never disable ESLint rules** — fix the underlying issue instead (exception: external lib typedefs in `app.d.ts`)
- **Never create files** unless absolutely necessary
- **Never proactively create documentation** unless explicitly requested
- **Never over-engineer** — build only what's requested

### Required Workflow

- Use **GitHub MCP tools** for PRs/issues/branches (not CLI commands)
- Use **Context7** for library documentation lookups
- Add **Copilot as reviewer** on PRs, assign PR to author
- Keep PR descriptions **concise** — no AI attribution
- Read **all links** in prompts before implementing
- Run `bun run lint && bun run check && bun run test` before completing tasks
- Use **Conventional Commits** for semantic-release
- Update **AGENTS.md** after changes that affect conventions

#### Verification Required

**AFTER each workflow step, VERIFY it succeeded:**

| Workflow Item        | Verification Action                                       |
| -------------------- | --------------------------------------------------------- |
| Create PR            | Read PR to confirm it exists with correct title/body      |
| Add Copilot reviewer | Read PR to confirm `requested_reviewers` includes Copilot |
| Assign PR to author  | Read PR to confirm `assignees` includes PR author         |
| Run lint/check/test  | Confirm exit code 0, do not proceed on failure            |

**Never assume a command succeeded — always verify the result.**

---

## Commit Convention

Uses [semantic-release](https://semantic-release.gitbook.io/semantic-release/) — commits directly control versioning.

| Commit message                                         | Release type |
| ------------------------------------------------------ | ------------ |
| `fix(scope): description`                              | Patch        |
| `feat(scope): description`                             | Minor        |
| `perf(scope): description` + `BREAKING CHANGE:` footer | Major        |

---

## Tech Stack

- **Framework:** SvelteKit (Svelte 5 runes) on Cloudflare Pages
- **Runtime:** Bun (package manager), Node (for Wrangler, see `.node-version`)
- **Database:** Drizzle ORM on SQLite (local) / Cloudflare D1 (prod)
- **Auth:** Clerk (`@clerk/backend` server-side, JS SDK client-side)
- **Styling:** Tailwind CSS v4 (utility-first)
- **Validation:** Zod v4
- **Monitoring:** Sentry (`@sentry/sveltekit`)
- **Cloudflare Bindings:** D1 (DB), KV (CACHE), Analytics Engine, Durable Objects

---

## Commands

| Task               | Command                                              |
| ------------------ | ---------------------------------------------------- |
| Install            | `bun install`                                        |
| Dev                | `bun run dev`                                        |
| Build              | `bun run build`                                      |
| Preview            | `bun run preview`                                    |
| Lint               | `bun run lint`                                       |
| Format             | `bun run format`                                     |
| Typecheck          | `bun run check`                                      |
| Test (all)         | `bun run test`                                       |
| Test (watch)       | `bun run test:unit`                                  |
| Test (single file) | `bunx vitest run src/lib/adapters/analytics.test.ts` |
| Test (by name)     | `bunx vitest run -t "should handle errors"`          |
| Test (coverage)    | `bun run test -- --coverage`                         |
| DB generate        | `bun run db:generate`                                |
| DB migrate (local) | `bun run db:migrate`                                 |
| DB migrate (prod)  | `bun run db:migrate:prod`                            |
| Deploy             | `bun run deploy`                                     |

**CI:** Runs `lint -> check -> test -> build` on push to `main` and all PRs.

**Pre-commit:** Husky + lint-staged runs prettier + eslint on `*.{js,ts,svelte,json}`.

---

## Code Style

### Formatting (Prettier)

- **Tabs** for indentation
- **Single quotes**, no trailing commas
- **Print width:** 120
- Plugins: `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`

### Imports

- Use `$lib/` for library imports, `$app/` for SvelteKit internals
- Use `import type` for type-only imports
- Group order: framework → external libs → `$lib/server` → `$lib/` → relative
- Zod: `import { z } from 'zod'`

### TypeScript

- **Strict mode** enabled (`"strict": true`)
- Prefer inference where obvious; explicit types for function signatures
- Use `interface` for object shapes, `type` for unions/aliases
- Drizzle types: `typeof table.$inferSelect` / `$inferInsert`
- Never use `as any`, `@ts-ignore`, `@ts-expect-error` (except external lib typedefs)

### Naming Conventions

| Item                | Convention                | Example                    |
| ------------------- | ------------------------- | -------------------------- |
| Files (lib/utils)   | kebab-case                | `rate-limit.ts`            |
| Svelte components   | PascalCase                | `FormInput.svelte`         |
| Svelte stores       | kebab-case + `.svelte.ts` | `toast.svelte.ts`          |
| Functions/variables | camelCase                 | `createShortUrl`, `userId` |
| Types/Interfaces    | PascalCase                | `ClickData`, `UserRole`    |
| Constants           | UPPER_SNAKE_CASE          | `CUSTOM_CODE_REGEX`        |
| DB columns          | snake_case                | `short_code`               |
| Test files          | colocated, `*.test.ts`    | `analytics.test.ts`        |

### Error Handling

- **API endpoints:** Return `json({ error: string }, { status })` for client errors
- **Auth guards:** Throw `error(401, { message })` or `error(403, { message })`
- **Redirects:** Throw `redirect(302, '/path')`
- **Validation:** Zod `safeParse()` → return 400 with error details
- **Infrastructure:** Try-catch, log with `logger.error()`, fail-open when appropriate
- **Never** use empty catch blocks

---

## Svelte 5 Patterns

Uses **Svelte 5 runes exclusively** — no legacy `$:`, `export let`, or stores API.

- **Props:** `let { prop1, prop2 = default }: PropsType = $props()`
- **State:** `let value = $state<Type>(initial)`
- **Derived:** `const computed = $derived(expression)`
- **Bindable:** `value = $bindable('')` for two-way binding

---

## Server-Side Patterns

### Route Handlers (`+server.ts`)

Export typed handlers: `export const GET: RequestHandler = async ({ platform, request, locals }) => { ... }`. Access Cloudflare bindings via `platform.env`, auth via `locals.auth`, and always validate input with Zod.

### Load Functions (`+page.server.ts`)

Export typed load: `export const load: PageServerLoad = async ({ platform, locals }) => { ... }`. Do auth checks first: `if (!locals.auth.userId) throw redirect(302, '/login')`. Use `requireAuth(locals)` / `requireAdmin(locals)` from `$lib/server/auth`.

### Database Access

Get DB via `getDb(platform)` from `$lib/server/db` or `getDatabaseAdapter(platform)` from `$lib/adapters/factory`. Drizzle query builder: `db.select().from(urls).where(eq(urls.shortCode, code))`. Schemas in `src/lib/server/db/schemas/` with barrel export from `index.ts`.

### Logging

Use structured logger from `$lib/server/logger`:

```typescript
logger.info('event.name', { key: 'value' });
logger.error('error.name', { error: err instanceof Error ? err.message : String(err) });
```

---

## Testing

- **Framework:** Vitest with `node` environment (workspace project config in `vite.config.ts`)
- **Assertions required:** `expect.requireAssertions` is enabled — every test MUST have at least one `expect()`
- **Mocking:** Use `vi.mock()` for module mocks, `vi.fn()` for function mocks, `vi.spyOn()` for spies
- **Test colocation:** Tests live next to source files (`foo.ts` -> `foo.test.ts`)
- **Route tests:** Named `server.test.ts` in the route directory
- **SvelteKit mocks:** Mock `$lib/*` and `$app/*` paths via `vi.mock()`

---

## Architecture Notes

- **Adapter pattern:** `src/lib/adapters/` provides swappable implementations (Cloudflare vs local dev)
- **Factory functions:** `src/lib/adapters/factory.ts` resolves correct adapter based on `dev` flag
- **Platform check:** Always guard `platform` access — it's `undefined` during SSR/prerender
- **Env vars:** Accessed via `platform.env` (Cloudflare bindings), NOT `process.env` (except Sentry DSN fallback)
- **Hooks chain:** `initialHook` -> `sentryInitHandle` -> `Sentry.sentryHandle()` -> `authHandle` -> `securityHeadersHandle`
