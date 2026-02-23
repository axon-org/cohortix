# Backend Code Review — Sprint 4 (Mission Control)

**Project:** Cohortix  
**Branch:** `feature/sprint-4-mission-control`  
**Reviewer:** John (Backend Developer)  
**Date:** 2026-02-13  
**Overall Health Score:** **68/100** ⚠️

---

## Executive Summary

Sprint 4 introduces the Mission Control feature with Missions, Operations, and
enhanced PPV hierarchy support. While the core implementation is functional,
several critical issues were identified that require attention before production
deployment.

| Category         | Status                | Score      |
| ---------------- | --------------------- | ---------- |
| API Routes       | ⚠️ Needs Refactoring  | 65/100     |
| Database Layer   | 🔴 Critical Issues    | 55/100     |
| Backend Patterns | ⚠️ Inconsistent       | 70/100     |
| Security         | ⚠️ Documented Risks   | 75/100     |
| **Overall**      | **⚠️ Requires Fixes** | **68/100** |

---

## 1. API Routes Review

### 1.1 Missions Routes (`apps/web/src/app/api/v1/missions/`)

**File:** `route.ts`, `[id]/route.ts`

#### ✅ Strengths

- Proper input validation with Zod schemas
- Consistent error handling with `withErrorHandler`
- Correlation ID tracking for distributed tracing
- Pagination with proper metadata

#### ⚠️ Issues Found

**WARNING: Inconsistent Auth Helper Usage**

Each route file has its own `getAuthContext()` function instead of using the
centralized helper:

```typescript
// missions/route.ts - DUPLICATED PATTERN
async function getAuthContext() {
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.BYPASS_AUTH === 'true'
  ) {
    const { createClient: createSupabaseClient } =
      await import('@supabase/supabase-js');
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        /* ... */
      }
    );
    // ...
  }
  // ...
}
```

**Fix:** Import from `@/lib/auth-helper.ts` instead:

```typescript
import { getAuthContext } from '@/lib/auth-helper';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { supabase, organizationId, userId } = await getAuthContext();
  // ...
});
```

**Impact:** Medium — Maintenance burden, risk of divergence

---

### 1.2 Operations Routes (`apps/web/src/app/api/v1/operations/`)

**File:** `route.ts`, `[id]/route.ts`

#### ✅ Strengths

- Proper Supabase query patterns
- Good error handling with context
- Organization-scoped queries

#### ⚠️ Issues Found

**WARNING: Column Name Mismatch Between API and Drizzle**

The API uses `goal_id` for mission reference (legacy naming):

```typescript
// In POST:
goal_id: (data.missionId || null, // Comment: DB column still named 'goal_id'
  // In PATCH:
  (updateData.goal_id = data.missionId));
```

The Drizzle schema correctly maps this:

```typescript
// packages/database/src/schema/missions.ts
missionId: uuid('goal_id').references(() => missions.id, {
  onDelete: 'set null',
});
```

**Issue:** This is confusing and error-prone. The API should use consistent
naming.

**Recommendation:** Either:

1. Rename the column in the database to `mission_id`
2. Or update the API to use `missionId` throughout with proper mapping comment

---

### 1.3 Auth Helper Pattern (`apps/web/src/lib/auth-helper.ts`)

**✅ Centralized helper exists** but is **NOT consistently used** across routes.

#### Routes Using Centralized Helper

- (None found during review)

#### Routes With Duplicated Pattern

- `/api/v1/missions` ✅ (FIXED: has its own `getAuthContext`)
- `/api/v1/operations` ✅ (FIXED: has its own `getAuthContext`)
- `/api/v1/cohorts` (needs verification)
- All dashboard routes (needs verification)

---

## 2. Database Layer Review

### 2.1 Schema/Migration Mismatches — CRITICAL

**Finding:** Multiple tables have Drizzle schema definitions that don't match
Supabase migrations.

#### 2.1.1 Cohorts Table Mismatch

**Drizzle Schema** (`packages/database/src/schema/cohorts.ts`):

```typescript
export const cohorts = pgTable('cohorts', {
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  slug: varchar('slug', { length: 100 }).notNull(),
  createdBy: uuid('created_by').notNull(),
  // ...
});
```

**Migration** (`supabase/migrations/20260212163340_create_cohorts.sql`):

```sql
CREATE TABLE IF NOT EXISTS cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,  -- ✅ Present
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  start_date timestamptz,
  end_date timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
  -- ⚠️ MISSING: slug
  -- ⚠️ MISSING: created_by
  -- ⚠️ MISSING: member_count, engagement_percent, settings
);
```

**Impact:** CRITICAL — The application will fail if it tries to access these
columns.

#### 2.1.2 Cohort Members Table Mismatch

**Drizzle Schema** (`packages/database/src/schema/cohorts.ts`):

```typescript
export const cohortMembers = pgTable('cohort_members', {
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  // ...
});
```

**Migration:** No separate `cohort_members` table definition found in
migrations. The migration creates it inline:

```sql
CREATE TABLE IF NOT EXISTS cohort_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id uuid,
  agent_id uuid,
  -- ⚠️ MISSING: organization_id (required by Drizzle schema!)
  joined_at timestamptz DEFAULT now(),
  engagement_score numeric(5,2) DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  -- ...
);
```

**Impact:** CRITICAL — Drizzle queries will fail due to missing column.

#### 2.1.3 RLS Policies for Cohorts (Placeholder)

From migration file:

```sql
-- RLS Policies for cohorts (placeholder - adjust based on auth setup)
CREATE POLICY "cohorts_select_policy" ON cohorts
  FOR SELECT USING (true); -- TODO: Restrict to organization members

CREATE POLICY "cohorts_insert_policy" ON cohorts
  FOR INSERT WITH CHECK (true); -- TODO: Restrict to organization admins
```

**Impact:** HIGH — Currently allows any authenticated user to access ANY
organization's cohorts.

---

### 2.2 Operations Query File (`apps/web/src/server/db/queries/operations.ts`)

**✅ Was previously fixed** for the invalid `agents!projects_owner_id_fkey` join
issue.

Current implementation correctly uses organization-scoped queries:

```typescript
export async function getOperations() {
  const supabase = await createServerClient();
  const organizationId = await getOrganizationId();

  if (!organizationId) {
    return [];
  }

  const { data: operations, error } = await supabase
    .from('projects')
    .select(`*, tasks(id, status)`)
    .eq('organization_id', organizationId);
  // ...
}
```

**No FK join issues found** ✅

---

### 2.3 Missions Migration (`supabase/migrations/20260213185300_create_missions_table.sql`)

**✅ Properly structured** with:

- All required columns
- Proper indexes
- Complete RLS policies
- `updated_at` trigger

---

## 3. Backend Patterns Review

### 3.1 BACKEND-PATTERNS.md (`apps/web/BACKEND-PATTERNS.md`)

**✅ Document exists** and is **well-maintained**.

**However**, it describes a centralized auth helper pattern that isn't
consistently implemented:

> **§2. Authentication & Authorization**
>
> ```typescript
> import { getAuthContext } from '@/lib/auth-helper';
> ```

**Reality:** Routes are duplicating the `getAuthContext` function.

**Recommendation:** Either update the documentation to match reality, or
refactor routes to use the centralized helper.

---

### 3.2 Resilience Patterns (`apps/web/src/lib/resilience.ts`)

**✅ Comprehensive implementation** with:

- Retry with exponential backoff
- Circuit breaker
- Timeout patterns
- Semaphore (bulkhead pattern)

**❌ ISSUE: Not used in any API routes.**

No Supabase queries use `withRetry()` or circuit breaker patterns.

**Example where it should be used:**

```typescript
// In operations/route.ts - CURRENT (no resilience):
const { data: operations, error, count } = await queryBuilder;

// SHOULD BE (with resilience):
const {
  data: operations,
  error,
  count,
} = await withRetry(() => queryBuilder, { attempts: 3, delay: 1000 });
```

**Impact:** Medium — Database connection issues won't auto-retry.

---

### 3.3 Health Check Endpoints

#### `/api/health` ✅ Works

```typescript
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'cohortix-api',
    version: process.env.APP_VERSION || '1.0.0',
  });
}
```

#### `/api/ready` ✅ Works

```typescript
export async function GET() {
  const checks = { database: false, auth: false };
  // ... database connection check
  return NextResponse.json({ status: 'ready', checks });
}
```

---

## 4. Security Review

### 4.1 Auth Bypass in Middleware (`apps/web/src/middleware.ts`)

**⚠️ Documented Risk** in `AUTH_BYPASS_AUDIT.md` ✅

```typescript
export async function updateSession(request: NextRequest) {
  // DEV MODE: Bypass auth entirely when testing
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.BYPASS_AUTH === 'true'
  ) {
    return NextResponse.next({ request });
  }
  // ... production auth flow
}
```

**Risk Assessment:**

| Aspect            | Status                | Notes                             |
| ----------------- | --------------------- | --------------------------------- |
| Documentation     | ✅ Complete           | `AUTH_BYPASS_AUDIT.md` exists     |
| Environment Check | ✅ Secure             | Only works in development         |
| Production Safety | ✅ Protected          | `NODE_ENV=development` check      |
| CI/CD Safety      | ⚠️ Needs verification | Ensure CI fails if bypass enabled |

**Recommendation:** Add CI check to fail if `BYPASS_AUTH=true` in
non-development builds.

---

### 4.2 Service Role Key Exposure

**✅ No exposure found** to client-side code.

**Usage Pattern (Server-Side Only):**

- Service role key only accessed in:
  - `apps/web/src/lib/auth-helper.ts` (dev bypass)
  - Individual route files (dev bypass)
  - `apps/web/src/server/db/queries/operations.ts` (dev bypass)

**All usages are server-side** and properly gated:

```typescript
if (
  process.env.NODE_ENV === 'development' &&
  process.env.BYPASS_AUTH === 'true'
) {
  // Only in dev mode
  process.env.SUPABASE_SERVICE_ROLE_KEY!;
}
```

---

### 4.3 RLS Policies

#### Missions Table ✅ Good

From migration `20260213185300_create_missions_table.sql`:

```sql
CREATE POLICY "Users can view missions in their organization" ON missions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );
```

#### Cohorts Table ❌ Incomplete

**Issue:** Placeholder policies allow full access:

```sql
CREATE POLICY "cohorts_select_policy" ON cohorts
  FOR SELECT USING (true);  -- ANY user can read ANY cohort!
```

**Fix Required:**

```sql
-- Proper organization-scoped policy
CREATE POLICY "cohorts_select_policy" ON cohorts
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );
```

---

## 5. Findings Summary

### 🔴 Critical Issues (Must Fix)

| #   | Finding                                                                                                  | Location                            | Fix                                  |
| --- | -------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------ |
| 1   | Cohorts migration missing `slug`, `created_by`, `member_count`, `engagement_percent`, `settings` columns | `20260212163340_create_cohorts.sql` | Add missing columns via migration    |
| 2   | Cohort members migration missing `organization_id` column                                                | `20260212163340_create_cohorts.sql` | Add `organization_id` column         |
| 3   | Cohorts RLS policies allow universal access                                                              | `20260212163340_create_cohorts.sql` | Implement proper org-scoped policies |

### ⚠️ Warnings (Should Fix)

| #   | Finding                                              | Location                                   | Impact                          |
| --- | ---------------------------------------------------- | ------------------------------------------ | ------------------------------- |
| 1   | Auth helper duplicated across routes                 | `missions/route.ts`, `operations/route.ts` | Maintenance burden              |
| 2   | Resilience patterns not used in routes               | API routes                                 | No automatic retry on DB issues |
| 3   | Operations API uses `goal_id` instead of `missionId` | `operations/route.ts`                      | Confusing naming                |
| 4   | BACKEND-PATTERNS.md describes unused pattern         | `auth-helper.ts` vs actual usage           | Documentation drift             |

### ✅ Good Practices Found

| #   | Finding                                | Location                         |
| --- | -------------------------------------- | -------------------------------- |
| 1   | Input validation with Zod schemas      | All API routes                   |
| 2   | Error handling with `withErrorHandler` | All API routes                   |
| 3   | Correlation ID tracking                | All API routes                   |
| 4   | Pagination with metadata               | List endpoints                   |
| 5   | Organization-scoped queries            | All API routes                   |
| 6   | Health check endpoints                 | `/api/health`, `/api/ready`      |
| 7   | Service role key server-side only      | Auth helper, routes              |
| 8   | Comprehensive resilience.ts            | `apps/web/src/lib/resilience.ts` |

---

## 6. Recommendations

### Immediate (Before Production)

1. **Fix Cohort Schema Mismatch**

   ```sql
   -- Add missing columns to cohorts table
   ALTER TABLE cohorts ADD COLUMN slug VARCHAR(100) NOT NULL DEFAULT 'temporary';
   ALTER TABLE cohorts ADD COLUMN created_by UUID NOT NULL;
   ALTER TABLE cohorts ADD COLUMN member_count INTEGER DEFAULT 0;
   ALTER TABLE cohorts ADD COLUMN engagement_percent DECIMAL(5,2) DEFAULT 0;
   ALTER TABLE cohorts ADD COLUMN settings JSONB DEFAULT '{}';

   -- Add organization_id to cohort_members
   ALTER TABLE cohort_members ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
   ```

2. **Fix Cohorts RLS Policies**
   ```sql
   DROP POLICY IF EXISTS cohorts_select_policy ON cohorts;
   CREATE POLICY "cohorts_select_policy" ON cohorts
     FOR SELECT
     USING (
       organization_id IN (
         SELECT organization_id
         FROM organization_memberships
         WHERE user_id = auth.uid()
       )
     );
   -- Similar for INSERT, UPDATE, DELETE
   ```

### Short-Term (Sprint 5)

1. **Refactor Routes to Use Centralized Auth Helper**
   - Update all routes to import from `@/lib/auth-helper`
   - Remove duplicated `getAuthContext` functions

2. **Add Resilience to Critical Paths**
   - Wrap Supabase queries in `withRetry()`
   - Add circuit breaker for external service calls

3. **Update BACKEND-PATTERNS.md**
   - Either document current decentralized pattern
   - Or refactor to use centralized helper

### Long-Term

1. **Generate Migrations from Drizzle Schema**
   - Use `drizzle-kit` to generate migrations
   - Prevent schema/migration drift

2. **Add Integration Tests for RLS**
   - Verify users can't access other orgs' data

---

## 7. Appendix: Files Reviewed

| Category   | Files                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API Routes | `apps/web/src/app/api/v1/missions/route.ts`, `apps/web/src/app/api/v1/missions/[id]/route.ts`, `apps/web/src/app/api/v1/operations/route.ts`, `apps/web/src/app/api/v1/operations/[id]/route.ts`                                                                                                                                                              |
| Auth       | `apps/web/src/lib/auth-helper.ts`, `apps/web/src/middleware.ts`, `apps/web/src/lib/supabase/server.ts`, `apps/web/src/lib/supabase/middleware.ts`                                                                                                                                                                                                             |
| Database   | `packages/database/src/schema/missions.ts`, `packages/database/src/schema/operations.ts`, `packages/database/src/schema/cohorts.ts`, `packages/database/src/schema/comments.ts`, `packages/database/src/schema/activity-log.ts`, `packages/database/src/schema/goals.ts`, `packages/database/src/schema/insights.ts`, `packages/database/src/schema/index.ts` |
| Migrations | `supabase/migrations/20260212163340_create_cohorts.sql`, `supabase/migrations/20260213140000_sprint_4_backend.sql`, `supabase/migrations/20260213185300_create_missions_table.sql`                                                                                                                                                                            |
| Health     | `apps/web/src/app/api/health/route.ts`, `apps/web/src/app/api/ready/route.ts`                                                                                                                                                                                                                                                                                 |
| Patterns   | `apps/web/BACKEND-PATTERNS.md`, `apps/web/src/lib/resilience.ts`                                                                                                                                                                                                                                                                                              |
| Audit      | `AUTH_BYPASS_AUDIT.md`                                                                                                                                                                                                                                                                                                                                        |

---

**Review Completed:** 2026-02-13  
**Next Review:** Sprint 5
