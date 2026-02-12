# Supabase Migration Summary

## Completed Tasks

### ✅ Task 1: Swapped Clerk for Supabase Packages
- **Removed from `apps/web/package.json`:**
  - `@clerk/nextjs: ^5.0.0`
  
- **Added to `apps/web/package.json`:**
  - `@supabase/supabase-js: ^2.45.0`
  - `@supabase/ssr: ^0.5.0`

- **Added to `packages/database/package.json`:**
  - `@supabase/supabase-js: ^2.45.0`
  - `@supabase/ssr: ^0.5.0`

### ✅ Task 2: Created Supabase Client Utilities
Created the following files in `packages/database/src/supabase/`:

1. **`client.ts`** - Browser client for client-side authentication
2. **`server.ts`** - Server-side client with cookie handling for server components
3. **`middleware.ts`** - Middleware session management with auth protection
4. **`index.ts`** - Barrel export for all Supabase utilities

**Type fixes applied:**
- Added proper type annotations for `cookiesToSet` parameters to resolve TypeScript errors

### ✅ Task 3: Created Next.js Middleware
- Created `apps/web/src/middleware.ts` with:
  - Auth protection for all routes except public paths
  - Automatic redirect to `/sign-in` for unauthenticated users
  - Static asset exclusions (images, fonts, etc.)

**Import fix applied:**
- Changed import from `@cohortix/database/supabase` to `@repo/database/supabase` to match the workspace naming convention

### ✅ Task 4: Updated Package Exports
- Updated `packages/database/package.json` exports to include:
  ```json
  "./supabase": "./src/supabase/index.ts"
  ```

### ✅ Task 5: Installed Dependencies
- Ran `pnpm install` successfully
- All Supabase packages installed without errors
- Note: Peer dependency warning for `lucide-react` with React 19 (unrelated to this migration)

### ✅ Task 6: Created PostgreSQL Extensions Migration
- Created `packages/database/src/migrations/001_enable_extensions.sql` with:
  - `uuid-ossp` - UUID generation
  - `pgcrypto` - Cryptographic functions
  - `vector` - pgvector for embeddings
  - `pg_trgm` - Trigram similarity for text search

## TypeScript Verification
- ✅ Database package type-check: **PASSED**
- ✅ Web app type-check: **PASSED**

## Next Steps

### 1. Configure Environment Variables
Add these to your `.env.local` files:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Run PostgreSQL Extensions Migration
Execute the SQL file via Supabase Dashboard or CLI:

```bash
# Via Supabase CLI
supabase db execute --file packages/database/src/migrations/001_enable_extensions.sql

# Or copy the contents and run in Supabase Dashboard SQL Editor
```

### 3. Update Authentication Components
- Remove Clerk-specific components (e.g., `<SignIn />`, `<UserButton />`)
- Replace with Supabase Auth UI components or custom forms
- Update any `useUser()` hooks to use Supabase's `supabase.auth.getUser()`

### 4. Update Protected Routes
- Review route protection logic
- Update any Clerk middleware configurations
- Test auth flows (sign in, sign up, sign out)

### 5. Database Schema (if using Clerk)
- If you were using Clerk's user metadata, migrate to Supabase's `auth.users` or custom user table
- Update any foreign key references from Clerk user IDs to Supabase user UUIDs

## Files Created/Modified

### Created:
- `packages/database/src/supabase/client.ts`
- `packages/database/src/supabase/server.ts`
- `packages/database/src/supabase/middleware.ts`
- `packages/database/src/supabase/index.ts`
- `apps/web/src/middleware.ts`
- `packages/database/src/migrations/001_enable_extensions.sql`

### Modified:
- `apps/web/package.json` - Removed Clerk, added Supabase
- `packages/database/package.json` - Added Supabase dependencies and export
- `pnpm-lock.yaml` - Updated with new dependencies

## Warnings & Notes

1. **Peer Dependency Warning**: `lucide-react` shows peer dependency warning with React 19. This is unrelated to the migration and can be safely ignored until lucide-react updates their peer dependencies.

2. **Cookie Options Type**: Used `any` type for cookie options as they're passed through from the framework. This is acceptable as the types are validated by the underlying libraries.

3. **Middleware Matcher**: The middleware excludes static assets but protects all other routes. Adjust the matcher pattern in `apps/web/src/middleware.ts` if you need different behavior.

## Testing Checklist

- [ ] Verify environment variables are set correctly
- [ ] Run the PostgreSQL extensions migration
- [ ] Test authentication flow (sign up)
- [ ] Test authentication flow (sign in)
- [ ] Test authentication flow (sign out)
- [ ] Test protected route access (authenticated)
- [ ] Test protected route redirect (unauthenticated)
- [ ] Test middleware on public routes
- [ ] Update authentication UI components
- [ ] Migrate user data (if applicable)

## Rollback Instructions

If you need to rollback:

1. Restore the original `package.json` files from git
2. Delete the `packages/database/src/supabase/` directory
3. Delete `apps/web/src/middleware.ts`
4. Run `pnpm install`

```bash
git checkout HEAD -- apps/web/package.json packages/database/package.json
rm -rf packages/database/src/supabase apps/web/src/middleware.ts
pnpm install
```
