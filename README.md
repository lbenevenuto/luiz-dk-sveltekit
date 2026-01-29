# luiz.dk

Personal URL shortener and playground for serverless tooling. Built with SvelteKit, Bun, and Cloudflare Pages, with Drizzle ORM on SQLite/D1.

## Features

- Short URLs with optional expiry and normalized URLs
- Clerk auth with admin area
- D1 + KV + Durable Object counter
- Analytics via Cloudflare Analytics Engine
- Sentry error tracking (optional)

## Requirements

- Bun (see `package.json` "packageManager")
- Node (see `.node-version`) for Wrangler tooling

## Environment

See `.env.example` for the full list of variables. Copy it to `.env` for local dev. For Cloudflare Pages preview, use `.dev.vars.example`.

## Local development

```sh
bun install
cp .env.example .env
bun run db:migrate
bun run dev
```

Local data lives in `./data/local.db`.

## Cloudflare preview (Pages)

```sh
bun run build
cp .dev.vars.example .dev.vars
bun run preview
```

## Database and migrations

- Generate migrations: `bun run db:generate`
- Apply locally: `bun run db:migrate`
- Apply to production D1: `bun run db:migrate:prod` (requires Cloudflare env vars)

## Scripts

- Lint: `bun run lint`
- Typecheck: `bun run check`
- Test: `bun run test`
- Deploy: `bun run deploy`

## Docs

- `docs/README.md`
- `CONTRIBUTING.md`
