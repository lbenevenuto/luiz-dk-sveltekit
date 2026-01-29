# Contributing to luiz.dk

## Development Setup

1. **Install Dependencies**:

   ```bash
   bun install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env` for Vite dev, and `.dev.vars.example` to `.dev.vars` if you want to use `wrangler pages dev`.

3. **Run Development Server**:
   ```bash
   bun run dev
   ```

## Testing

We use Vitest for testing.

- **Run Unit Tests**:
  ```bash
  bun run test
  ```
  This runs all unit and integration tests.

## Code Quality

Ensure your code meets the project standards before committing.

- **Type Check**:

  ```bash
  bun run check
  ```

- **Linting**:

  ```bash
  bun run lint
  ```

- **Formatting**:
  ```bash
  bun run format
  ```

## Structure

- `src/lib/adapters`: Adapters for external services (DB, Analytics, ID generation).
- `src/routes/api`: API endpoints.
