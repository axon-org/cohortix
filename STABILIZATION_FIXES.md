# Cohortix Stabilization Fixes

## Date: 2026-02-13

### RLS Policies for Cohorts & Cohort Members

**Issue**: RLS was ENABLED on `cohorts` and `cohort_members` tables but NO
policies existed, completely blocking non-service-role users from accessing
these tables.

**Fix**: Created comprehensive org-scoped RLS policies via SQL migration

#### Migration File

- `supabase/migrations/20260213200000_fix_cohorts_rls.sql`

#### Policies Added

**Cohorts Table:**

- Service role bypass (full access for API routes using service key)
- Users can view cohorts in their organization
- Users can create cohorts in their organization
- Users can update cohorts in their organization
- Admins can delete cohorts in their organization (owner/admin roles only)

**Cohort Members Table:**

- Service role bypass (full access for API routes using service key)
- Users can view cohort members (via organization membership through cohort)
- Users can add cohort members (if they're in the same org)
- Users can update cohort members (if they're in the same org)
- Admins can delete cohort members (owner/admin roles only)

#### Policy Design

- All policies are organization-scoped using `organization_memberships` table
- Service role gets full bypass for API routes that use the service key
- DELETE operations restricted to owners and admins for data safety
- Cohort members policies join through cohorts table for org verification

---

### Auth Bypass Removal

**Issue**: Development auth bypass (`BYPASS_AUTH=true`) was scattered throughout
the codebase, creating security risks and inconsistent behavior.

**Fix**: Completely removed all `BYPASS_AUTH` logic from the entire codebase.

#### Files Modified

**Environment:**

- `apps/web/.env.local` - Removed `BYPASS_AUTH=true`

**Middleware:**

- `apps/web/src/lib/supabase/middleware.ts` - Removed dev mode bypass block
- `apps/web/src/app/(dashboard)/layout.tsx` - Removed mock user injection

**API Routes (v1):**

- `apps/web/src/app/api/v1/missions/route.ts`
- `apps/web/src/app/api/v1/missions/[id]/route.ts`
- `apps/web/src/app/api/v1/allies/route.ts`
- `apps/web/src/app/api/v1/allies/[id]/route.ts`
- `apps/web/src/app/api/v1/operations/route.ts`
- `apps/web/src/app/api/v1/operations/[id]/route.ts`
- `apps/web/src/app/api/v1/cohorts/route.ts`
- `apps/web/src/app/api/v1/cohorts/[id]/route.ts`
- `apps/web/src/app/api/v1/dashboard/engagement-chart/route.ts`
- `apps/web/src/app/api/v1/dashboard/health-trends/route.ts`
- `apps/web/src/app/api/v1/dashboard/mission-control/route.ts`

**API Routes (cohorts):**

- `apps/web/src/app/api/cohorts/route.ts`
- `apps/web/src/app/api/cohorts/[id]/route.ts`
- `apps/web/src/app/api/cohorts/[id]/activity/route.ts`
- `apps/web/src/app/api/cohorts/[id]/members/route.ts`
- `apps/web/src/app/api/cohorts/[id]/timeline/route.ts`

**Query Utilities:**

- `apps/web/src/server/db/queries/dashboard.ts`
- `apps/web/src/server/db/queries/cohorts.ts`
- `apps/web/src/server/db/queries/cohort-members.ts`
- `apps/web/src/server/db/queries/operations.ts`

**Auth Helpers:**

- `apps/web/src/lib/auth-helper.ts` - Removed `isDevBypass` field and logic

**Test Routes (informational only):**

- `apps/web/src/app/api/test-env/route.ts` - Removed BYPASS_AUTH from output
- `apps/web/src/app/api/test-db/route.ts` - Removed BYPASS_AUTH from output

#### Changes Made

1. **Removed if-else blocks** that checked for
   `process.env.BYPASS_AUTH === 'true'`
2. **Removed service role client instantiation** that bypassed RLS
3. **Standardized auth flow** - all routes now use normal Supabase client with
   RLS
4. **Removed mock user data** - no more fake 'dev-bypass' users
5. **Simplified helper functions** - `getAuthContext()` now only uses real auth

#### Impact

- **More secure**: No auth bypass paths that could accidentally leak to
  production
- **Consistent behavior**: Development and production use the same auth flow
- **RLS reliance**: Now fully dependent on proper RLS policies (which we've
  added)
- **Better testing**: Tests will catch RLS issues instead of bypassing them

---

### Build Verification

**Status**: ✅ Build passed with 0 errors

```bash
cd ~/Projects/cohortix/apps/web && pnpm build
# ✓ Compiled successfully
```

All TypeScript compilation succeeded after removing 30+ instances of BYPASS_AUTH
logic across the codebase.

---

### Testing Recommendations

1. **Test RLS policies**:
   - Create test users in different organizations
   - Verify users can only see cohorts in their org
   - Verify admins can delete, regular users cannot
   - Verify cohort members are properly scoped

2. **Test API routes**:
   - All `/api/v1/*` endpoints should work with real auth
   - Service role routes should still work (using service key)
   - User-scoped queries should filter by organization

3. **Test dashboard**:
   - Verify dashboard loads with real user data
   - Verify all charts and KPIs load correctly
   - Verify cohort detail pages work

---

### Migration Notes

- Migration file follows Supabase naming convention:
  `YYYYMMDDHHMMSS_description.sql`
- Policies use `auth.uid()` and `auth.jwt()->>'role'` for security
- Service role bypass ensures API routes with service key continue working
- Organization scoping prevents cross-org data leaks

### Security Improvements

1. **No auth bypass**: Removed all development shortcuts
2. **Proper RLS**: Added comprehensive row-level security
3. **Organization isolation**: Users can only access data in their org
4. **Role-based access**: Admins vs regular users for destructive operations
5. **Service role separation**: API routes can still use service key when needed
