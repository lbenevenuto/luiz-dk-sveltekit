# Contributing to luiz.dk

## Development Setup

1. **Install Dependencies**:

   ```bash
   bun install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env` (if available) or ensure you have the required Cloudflare bindings setup in `.dev.vars` for local development.

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
