# RLS Policy Fix - Cohortix QA Issue

## Problem

- Activity endpoint returning 404
- Cohort members list empty
- Root cause: RLS policies blocking access when using anon key without
  authenticated user

## Solution Overview

### 1. Query Function Updates

Modified three query files to use service role client in dev bypass mode:

- `apps/web/src/server/db/queries/cohorts.ts`
- `apps/web/src/server/db/queries/cohort-members.ts`
- `apps/web/src/server/db/queries/dashboard.ts`

**Change:** Updated `createClient()` function to detect `BYPASS_AUTH=true` and
use service role key instead of anon key.

```typescript
async function createClient() {
  // DEV MODE: Use service role to bypass RLS when testing
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.BYPASS_AUTH === 'true'
  ) {
    const { createClient: createSupabaseClient } =
      await import('@supabase/supabase-js');
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  // Production: Use SSR client with cookies for auth
  // ... existing code ...
}
```

### 2. RLS Policy Migration (Optional Enhancement)

Created migration to add service role bypass policies:

- `migrations/0005_fix_rls_service_role_bypass.sql`
- `scripts/apply-migration-0005.ts`

This migration adds explicit service role bypass policies for future admin
operations.

## Testing

### Quick Test (Dev Bypass Mode)

1. Ensure `.env.local` has:

   ```
   NODE_ENV=development
   BYPASS_AUTH=true
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

2. Start the dev server:

   ```bash
   pnpm dev
   ```

3. Test endpoints:

   ```bash
   # Activity endpoint
   curl http://localhost:3000/api/cohorts/<cohort-id>/activity

   # Members endpoint
   curl http://localhost:3000/api/cohorts/<cohort-id>/members
   ```

4. Expected: Both should return data (not 404)

### Production Test (With Auth)

1. Remove or set `BYPASS_AUTH=false`
2. Log in as a user with organization membership
3. Test the same endpoints through the UI
4. Expected: Data loads correctly for cohorts in user's organization

## Applying RLS Migration

### Option A: Via Supabase SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Open `migrations/0005_fix_rls_service_role_bypass.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Run query

### Option B: Via Migration Script (When DB Access Available)

```bash
cd ~/Projects/cohortix
pnpm tsx scripts/apply-migration-0005.ts
```

## Verification

After applying changes, verify:

1. **Dev Mode:** Activity and members endpoints return data with
   `BYPASS_AUTH=true`
2. **Production Mode:** Endpoints work with authenticated users
3. **RLS Policies (after migration):**
   ```sql
   SELECT schemaname, tablename, policyname, roles, cmd
   FROM pg_policies
   WHERE tablename IN ('cohorts', 'cohort_members')
   ORDER BY tablename, policyname;
   ```
   Expected: `cohorts_service_role_all` and `cohort_members_service_role_all`
   policies exist

## Files Modified

- `apps/web/src/server/db/queries/cohorts.ts`
- `apps/web/src/server/db/queries/cohort-members.ts`
- `apps/web/src/server/db/queries/dashboard.ts`

## Files Added

- `migrations/0005_fix_rls_service_role_bypass.sql`
- `scripts/apply-migration-0005.ts`
- `RLS_FIX_SUMMARY.md` (this file)

## Notes

- Service role automatically bypasses RLS in Supabase
- Dev bypass mode is only active when `NODE_ENV=development` AND
  `BYPASS_AUTH=true`
- Production uses standard RLS policies with user authentication
- Migration adds explicit service role policies as best practice
