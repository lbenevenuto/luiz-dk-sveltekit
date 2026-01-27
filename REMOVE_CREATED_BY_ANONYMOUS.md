# Cleanup: Removed `created_by_anonymous` Column

## Reason

The `created_by_anonymous` column was redundant. We can simply check if `user_id` is `NULL` to determine if a URL was created by an anonymous user.

```sql
-- Before: Two ways to check
SELECT * FROM urls WHERE created_by_anonymous = 1;
SELECT * FROM urls WHERE user_id IS NULL;

-- After: One simple way
SELECT * FROM urls WHERE user_id IS NULL;
```

## Changes Made

### 1. Updated Schema

**File:** `src/lib/server/db/schemas/urls.ts`

**Before:**

```typescript
{
  // ... other fields
  userId: text('user_id'),
  createdByAnonymous: integer('created_by_anonymous', { mode: 'boolean' }).default(false)
}
```

**After:**

```typescript
{
	// ... other fields
	userId: text('user_id');
	// Anonymous users have userId = NULL
}
```

### 2. Updated Insert Logic

**File:** `src/lib/utils/index.ts`

**Before:**

```typescript
await db.insert(urls).values({
	shortCode,
	originalUrl: url,
	userId,
	createdByAnonymous: userId === null // Redundant!
});
```

**After:**

```typescript
await db.insert(urls).values({
	shortCode,
	originalUrl: url,
	userId // NULL for anonymous, user ID for authenticated
});
```

### 3. Database Migration

**Generated migration:** `migrations/0002_early_king_cobra.sql`

```sql
ALTER TABLE `urls` DROP COLUMN `created_by_anonymous`;
```

**Applied to:**

- ✅ Local database (`wrangler d1 execute luiz_dk --local`)
- ✅ Remote database (`wrangler d1 execute luiz_dk --remote`)

## How to Check if URL is Anonymous

### In SQL:

```sql
-- Get all anonymous URLs
SELECT * FROM urls WHERE user_id IS NULL;

-- Get all authenticated URLs
SELECT * FROM urls WHERE user_id IS NOT NULL;

-- Count by type
SELECT
  CASE WHEN user_id IS NULL THEN 'Anonymous' ELSE 'Authenticated' END as type,
  COUNT(*) as count
FROM urls
GROUP BY type;
```

### In Code:

```typescript
// Check if URL was created anonymously
const isAnonymous = url.userId === null;

// Filter anonymous URLs
const anonymousUrls = await db.select().from(urls).where(isNull(urls.userId));

// Filter user URLs
const userUrls = await db.select().from(urls).where(isNotNull(urls.userId));
```

## Benefits

1. **Simpler schema** - One less column to maintain
2. **No data duplication** - `user_id IS NULL` is the source of truth
3. **Less code** - No need to set `createdByAnonymous` on insert
4. **Cleaner queries** - Standard NULL check instead of boolean flag
5. **Database normalization** - Removed derived/redundant data

## Database State

### Before Migration:

```
urls table:
- id
- short_code
- original_url
- created_at
- updated_at
- expires_at
- user_id
- created_by_anonymous  ❌ Redundant
```

### After Migration:

```
urls table:
- id
- short_code
- original_url
- created_at
- updated_at
- expires_at
- user_id  ✅ NULL = anonymous
```

## Deployment

- **Deployed to:** https://c63c08e5.luiz-dk-sveltekit.pages.dev
- **Production domain:** https://luiz.dk
- **Migration applied:** Both local and remote databases updated

## Testing

```bash
# Check current schema
wrangler d1 execute luiz_dk --remote --command "PRAGMA table_info(urls);"

# Should show 7 columns (no created_by_anonymous)
# Columns: id, short_code, original_url, created_at, updated_at, expires_at, user_id

# Check anonymous URLs
wrangler d1 execute luiz_dk --remote --command \
  "SELECT short_code, user_id FROM urls WHERE user_id IS NULL LIMIT 5;"

# Check authenticated URLs
wrangler d1 execute luiz_dk --remote --command \
  "SELECT short_code, user_id FROM urls WHERE user_id IS NOT NULL LIMIT 5;"
```

## Migration Files

1. `migrations/0001_new_mister_sinister.sql` - Added `user_id` and `created_by_anonymous`
2. `migrations/0002_early_king_cobra.sql` - Removed `created_by_anonymous` (this migration)

## No Breaking Changes

This is a **non-breaking change** because:

- Existing code only checks `userId` to determine authentication status
- No API responses include `createdByAnonymous`
- Database constraint is properly handled (NULL is valid for `user_id`)
- Code continues to work as before, just cleaner

## Related Documentation

- `USER_ID_FIX.md` - How we added Bearer token authentication
- `AUTHORIZED_PARTIES_FIX.md` - How we fixed production domain verification

All three changes work together to provide clean user tracking! ✅
