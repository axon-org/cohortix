# Clerk-Compatible RLS Implementation - Option A

**Migration:** `20260217010000_rls_clerk_option_a_foundation.sql`  
**Date:** 2026-02-17  
**Status:** Enterprise-grade database-level security

---

## Overview

This migration implements **Option A** (full database-level security) for Clerk-compatible Row Level Security (RLS) on Cohortix's core tenant tables:

- `profiles` - User profiles with Clerk integration
- `organizations` - Multi-tenant organization data
- `organization_memberships` - User-organization relationships

### Security Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐     ┌──────────────┐     ┌─────────────────────────────────┐ │
│   │  Clerk   │────▶│  JWT Token   │────▶│  app.current_clerk_user_id      │ │
│   │   Auth   │     │   (sub)      │     │  (Session Config)               │ │
│   └──────────┘     └──────────────┘     └─────────────────────────────────┘ │
│                                                   │                          │
│                                                   ▼                          │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                     POSTGRESQL RLS POLICIES                         │  │
│   │                                                                       │  │
│   │   profiles.clerk_user_id = get_current_clerk_user_id()              │  │
│   │   organizations.id IN (user's org memberships)                      │  │
│   │   organization_memberships.organization_id IN (user's orgs)         │  │
│   │                                                                       │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│                              ▼                                               │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                      SERVICE ROLE BYPASS                              │  │
│   │   (Webhooks, Admin Operations, Dev Mode)                             │  │
│   │   Enabled when: get_current_clerk_user_id() IS NULL                  │  │
│   │              AND is_service_role() = true                            │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Files Created

### 1. Migration File
**Path:** `supabase/migrations/20260217010000_rls_clerk_option_a_foundation.sql`

Contains:
- Helper functions (`get_current_clerk_user_id`, `is_service_role`, `set_config`)
- RLS policies for all three foundation tables
- Service role bypass policies
- Performance indexes
- Documentation comments

### 2. Verification Script
**Path:** `supabase/migrations/20260217010000_rls_clerk_option_a_foundation_VERIFICATION.sql`

Run this after migration to verify:
- RLS is enabled and forced on all tables
- Policies are correctly created (no USING(true) policies)
- Service-role bypass exists for each table
- Helper functions exist and are granted

### 3. Updated Auth Helper (v2)
**Path:** `apps/web/src/lib/auth-helper-v2.ts`

New version that:
- Sets `app.current_clerk_user_id` for RLS
- Uses RLS-enabled clients for production
- Maintains service role bypass for webhooks/dev mode

---

## Applying the Migration

### Option A: Supabase SQL Editor (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/20260217010000_rls_clerk_option_a_foundation.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Run query

### Option B: CLI (if configured)

```bash
cd ~/Projects/cohortix
supabase db push
```

### Verification

```bash
# Run verification queries
psql $DATABASE_URL -f supabase/migrations/20260217010000_rls_clerk_option_a_foundation_VERIFICATION.sql
```

---

## Verification Checklist

Run these checks after migration:

### 1. RLS Status
```sql
SELECT tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'organizations', 'organization_memberships');
```
**Expected:** All show `t` (true) for both columns

### 2. Policy Count
```sql
SELECT tablename, count(*) 
FROM pg_policies 
WHERE tablename IN ('profiles', 'organizations', 'organization_memberships')
GROUP BY tablename;
```
**Expected:** Each table has 5 policies (1 service_role + 4 CRUD)

### 3. No USING(true) Policies (Security Check)
```sql
SELECT policyname, qual::text 
FROM pg_policies 
WHERE tablename IN ('profiles', 'organizations', 'organization_memberships')
  AND (qual::text ILIKE '%true%' OR qual::text ILIKE '%1=1%');
```
**Expected:** 0 rows (no permissive policies)

### 4. Service Role Policies
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'organizations', 'organization_memberships')
  AND policyname LIKE '%service_role%';
```
**Expected:** 3 rows (one per table)

---

## Updating Application Code

### auth-helper.ts Changes

Replace `createServiceClient()` usage with `createRLSClient()` for user operations:

```typescript
// OLD: Bypasses RLS entirely
const supabase = createServiceClient();

// NEW: Respects RLS with Clerk user context
const supabase = await createRLSClient(clerkUserId);
```

Keep `createServiceClient()` for:
- Webhook handlers
- Admin operations
- Dev bypass mode

### Migration Path

1. **Phase 1:** Deploy migration to database
2. **Phase 2:** Update auth-helper.ts to use RLS client
3. **Phase 3:** Test in staging with real Clerk auth
4. **Phase 4:** Monitor for any RLS-related errors
5. **Phase 5:** Remove old auth-helper.ts, rename v2

---

## Security Guarantees

### ✅ Enforced at Database Level
- All queries filtered by RLS, regardless of application code
- Tenant isolation enforced in PostgreSQL, not just application logic

### ✅ No Using(true) Policies
- No permissive policies that allow universal access
- Every policy has specific conditions

### ✅ Service Role Bypass Explicit
- Bypass only when both conditions met:
  1. `app.current_clerk_user_id IS NULL`
  2. `app.is_service_role = true`
- Requires intentional configuration

### ✅ Clerk JWT Bridge
- `app.current_clerk_user_id` set from Clerk JWT `sub` claim
- No dependency on Supabase Auth

---

## Performance

### Indexes Created
- `idx_profiles_clerk_user_id` - Profile lookups by Clerk ID
- `idx_organizations_clerk_org_id` - Org lookups by Clerk ID
- `idx_org_memberships_user_org` - Membership lookups
- `idx_org_memberships_org_role` - Role-based queries
- `idx_org_memberships_clerk_lookup` - Composite for RLS policies

### Policy Efficiency
- All policies use `EXISTS` with indexed lookups
- No full table scans in RLS conditions
- Service role bypass evaluated first (short-circuit)

---

## Troubleshooting

### Issue: "permission denied for table"
**Cause:** `app.current_clerk_user_id` not set  
**Fix:** Ensure auth-helper sets the session config before queries

### Issue: "function set_config does not exist"
**Cause:** Migration not applied  
**Fix:** Run migration to create helper functions

### Issue: Service role not bypassing RLS
**Cause:** `app.is_service_role` not set to `'true'`  
**Fix:** Call `set_config('app.is_service_role', 'true')` before operations

---

## Rollback

If needed, disable RLS:

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships DISABLE ROW LEVEL SECURITY;
```

---

## Related Documentation

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Clerk JWT Claims](https://clerk.com/docs/backend-requests/resources/jwt-claims)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

## Contact

**Implementation:** Backend Developer Agent (John)  
**Review:** Required before production deployment  
**Test:** Run full regression test suite after migration
