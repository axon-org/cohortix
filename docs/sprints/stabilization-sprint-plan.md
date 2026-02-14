# Stabilization Sprint Plan — Cohortix

**Project:** Cohortix  
**Sprint Type:** Stabilization (Bug Fixes & Tech Debt)  
**Branch:** `feature/sprint-4-mission-control`  
**Target Date:** 2026-02-20 (7 days)  
**Plan Created:** 2026-02-13  
**Planner:** August (Project Manager)

---

## 📊 Executive Summary

**Current State:**

- QA Score: 82/100 (⚠️ Auth bypass, rate limiting, docs gaps)
- Backend Score: 68/100 (🔴 Schema mismatches, RLS issues)
- Sprint 4 branch ready for stabilization
- No new features — focus on production readiness

**Sprint Goal:** Bring Cohortix to production-ready state by resolving all
critical security, database, and code quality issues identified in Sprint 4 QA
and Backend reviews.

**Success Criteria:**

- [ ] All 🔴 Critical issues resolved
- [ ] QA score ≥ 90/100
- [ ] Backend score ≥ 85/100
- [ ] Clean merge path: sprint-4 → dev → main
- [ ] Zero auth bypass logic in codebase
- [ ] All RLS policies organization-scoped

---

## 🎯 Task Breakdown

### Phase 1: Critical Database & Security (Priority: 🔴)

#### ~~Task 1.1: Fix Cohorts Schema Mismatch~~ ✅ RESOLVED (FALSE FINDING)

**Status:** ~~🔴 Critical~~ → ✅ No action needed  
**CEO Verification (2026-02-13):** Alim verified via Supabase REST API that ALL
columns exist: `slug`, `created_by`, `member_count`, `engagement_percent`,
`settings`. John's review incorrectly compared migration SQL with Drizzle schema
without checking the live DB.

~~**Problem:** Drizzle schema expects columns that don't exist in Supabase:

- `slug` (varchar 100)
- `created_by` (uuid)
- `member_count` (integer)
- `engagement_percent` (decimal)
- `settings` (jsonb)~~

**Tasks:**

1. Create migration file:
   `supabase/migrations/YYYYMMDDHHMMSS_fix_cohorts_schema.sql`
2. Add missing columns with appropriate defaults
3. Backfill `created_by` from audit trail or set to first org admin
4. Generate proper indexes for `slug` (unique per org)
5. Test Drizzle queries work with new columns
6. Run migration on local Supabase instance

**SQL Template:**

```sql
-- Add missing columns to cohorts table
ALTER TABLE cohorts
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_percent DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Add constraints
ALTER TABLE cohorts
  ADD CONSTRAINT cohorts_slug_org_unique UNIQUE (organization_id, slug);

-- Backfill created_by (set to first org admin as fallback)
-- Note: Adjust this query based on actual data
UPDATE cohorts c
SET created_by = (
  SELECT user_id
  FROM organization_memberships
  WHERE organization_id = c.organization_id
    AND role = 'admin'
  LIMIT 1
)
WHERE created_by IS NULL;

-- Make created_by NOT NULL after backfill
ALTER TABLE cohorts ALTER COLUMN created_by SET NOT NULL;
```

**Definition of Done:**

- [ ] Migration file created and committed
- [ ] Migration runs successfully on local Supabase
- [ ] All Drizzle schema columns present in DB
- [ ] `slug` has unique constraint per organization
- [ ] `created_by` backfilled and NOT NULL
- [ ] Unit test: Create cohort via API includes all new fields
- [ ] No TypeScript errors when accessing new columns

---

#### ~~Task 1.2: Fix Cohort Members Schema Mismatch~~ ✅ RESOLVED (FALSE FINDING)

**Status:** ~~🔴 Critical~~ → ✅ No action needed  
**CEO Verification (2026-02-13):** Alim verified the Drizzle schema for
`cohort_members` does NOT have `organization_id`. The DB matches the schema.
John's review was incorrect.

~~**Problem:** Drizzle schema expects `organization_id` column in
`cohort_members` table, but migration doesn't create it.~~

**Tasks:**

1. Add to same migration file as Task 1.1
2. Add `organization_id` column with FK to organizations
3. Backfill from parent cohort's `organization_id`
4. Add index for organization-scoped queries

**SQL Template:**

```sql
-- Add organization_id to cohort_members
ALTER TABLE cohort_members
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Backfill from parent cohort
UPDATE cohort_members cm
SET organization_id = (
  SELECT organization_id
  FROM cohorts
  WHERE id = cm.cohort_id
)
WHERE organization_id IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE cohort_members ALTER COLUMN organization_id SET NOT NULL;

-- Add index for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_cohort_members_org_id ON cohort_members(organization_id);
```

**Definition of Done:**

- [ ] `organization_id` column added to `cohort_members`
- [ ] All existing rows have `organization_id` backfilled
- [ ] FK constraint to `organizations` table exists
- [ ] Index on `organization_id` created
- [ ] Drizzle queries for cohort members work without errors
- [ ] Unit test: Fetch cohort members filters by org correctly

---

#### Task 1.3: Fix Cohorts RLS Policies (Security Critical)

**Owner:** John (Backend Developer)  
**Priority:** 🔴 Critical  
**Effort:** M (3-4 hours)  
**Depends On:** None (Tasks 1.1/1.2 were false findings — schema already
matches)

**Problem:** RLS is ENABLED on cohorts/cohort_members but NO policies exist in
the live DB (the `USING (true)` policies from the migration file were never
applied). This means non-service-role users are fully blocked. We need proper
org-scoped policies so authenticated users can access their own org's data.

**Tasks:**

1. ~~Drop existing placeholder policies~~ (none exist — skip this step)
2. Create org-scoped policies for SELECT, INSERT, UPDATE, DELETE
3. Add admin-only policy for sensitive operations
4. Create similar policies for `cohort_members`
5. Test with multiple orgs/users to ensure isolation

**SQL Template:**

```sql
-- Drop placeholder policies
DROP POLICY IF EXISTS cohorts_select_policy ON cohorts;
DROP POLICY IF EXISTS cohorts_insert_policy ON cohorts;

-- SELECT: Users can view cohorts in their organization
CREATE POLICY "cohorts_select_policy" ON cohorts
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Admins/managers can create cohorts
CREATE POLICY "cohorts_insert_policy" ON cohorts
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
    )
  );

-- UPDATE: Admins/managers can update cohorts in their org
CREATE POLICY "cohorts_update_policy" ON cohorts
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
    )
  );

-- DELETE: Admins can delete cohorts in their org
CREATE POLICY "cohorts_delete_policy" ON cohorts
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Cohort Members Policies
DROP POLICY IF EXISTS cohort_members_select_policy ON cohort_members;
CREATE POLICY "cohort_members_select_policy" ON cohort_members
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- (Similar patterns for INSERT/UPDATE/DELETE on cohort_members)
```

**Definition of Done:**

- [ ] All placeholder `USING (true)` policies removed
- [ ] Org-scoped SELECT policy enforced
- [ ] Role-based INSERT/UPDATE/DELETE policies enforced
- [ ] `cohort_members` has matching policies
- [ ] Manual test: User A cannot access User B's org cohorts
- [ ] Manual test: Non-admin cannot create cohorts
- [ ] Integration test added to verify RLS isolation

---

#### Task 1.4: Remove BYPASS_AUTH Logic

**Owner:** John (Backend Developer)  
**Priority:** 🔴 Critical  
**Effort:** M (4-5 hours)  
**Depends On:** None (but test after DB fixes)

**Problem:** Dev bypass logic scattered across codebase:

- `apps/web/src/lib/supabase/middleware.ts`
- `apps/web/src/app/(dashboard)/layout.tsx`
- API routes (`missions/route.ts`, `operations/route.ts`, etc.)

**Tasks:**

1. Remove `BYPASS_AUTH` check from `middleware.ts`
2. Remove mock user injection from `(dashboard)/layout.tsx`
3. Remove service-role bypass from all API routes
4. Delete duplicated `getAuthContext()` functions in routes
5. Centralize auth via `@/lib/auth-helper.ts` (see Task 2.1)
6. Test all protected routes require real auth

**Files to Modify:**

```
apps/web/src/lib/supabase/middleware.ts
apps/web/src/app/(dashboard)/layout.tsx
apps/web/src/app/api/v1/missions/route.ts
apps/web/src/app/api/v1/missions/[id]/route.ts
apps/web/src/app/api/v1/operations/route.ts
apps/web/src/app/api/v1/operations/[id]/route.ts
apps/web/src/app/api/v1/cohorts/route.ts (verify)
apps/web/src/app/api/v1/allies/route.ts (verify)
```

**Pattern to Remove:**

```typescript
// DELETE THIS:
if (
  process.env.NODE_ENV === 'development' &&
  process.env.BYPASS_AUTH === 'true'
) {
  // Service role bypass logic
}
```

**Definition of Done:**

- [ ] No `BYPASS_AUTH` references in codebase (grep confirms)
- [ ] No service role key usage in route files
- [ ] All routes require valid Supabase auth
- [ ] `middleware.ts` enforces auth on all protected paths
- [ ] Dashboard layout requires authenticated user
- [ ] Manual test: Unauthenticated request to `/api/v1/*` returns 401
- [ ] Manual test: Dashboard redirects to login when not authenticated

---

#### Task 1.5: Implement Rate Limiting

**Owner:** Devi (AI Developer) + John (Backend)  
**Priority:** 🔴 Critical  
**Effort:** L (6-8 hours)  
**Depends On:** None

**Problem:** No rate limiting on `/api/v1/` endpoints — vulnerable to DoS/abuse.

**Tasks:**

1. Choose rate limiting strategy (Upstash Redis or Vercel KV)
2. Install dependencies: `@upstash/ratelimit` or similar
3. Create rate limit middleware: `apps/web/src/lib/rate-limit.ts`
4. Apply to all API routes via wrapper
5. Configure limits: 100 req/min per user, 1000 req/hour per IP
6. Add rate limit headers to responses
7. Document in `BACKEND-PATTERNS.md`

**Implementation Pattern:**

```typescript
// apps/web/src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
});

// Wrapper for API routes
export async function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  identifier: string // user ID or IP
): Promise<Response> {
  const { success, limit, remaining, reset } =
    await rateLimiter.limit(identifier);

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }

  const response = await handler(req);
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  return response;
}
```

**Usage in Routes:**

```typescript
// apps/web/src/app/api/v1/missions/route.ts
import { withRateLimit } from '@/lib/rate-limit';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { userId } = await getAuthContext();

  return withRateLimit(async () => {
    // Existing route logic
  }, `user:${userId}`);
});
```

**Environment Variables Needed:**

```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

**Definition of Done:**

- [ ] Upstash Redis account created (or Vercel KV)
- [ ] Rate limit library installed and configured
- [ ] `withRateLimit` middleware created
- [ ] Applied to all `/api/v1/*` routes
- [ ] Rate limit headers included in responses
- [ ] Manual test: Sending 101 requests in 1 min returns 429
- [ ] Manual test: Rate limit headers present in all API responses
- [ ] Documentation added to `BACKEND-PATTERNS.md`

---

### Phase 2: Code Quality & Consistency (Priority: ⚠️)

#### Task 2.1: Centralize Auth Helper Usage

**Owner:** John (Backend Developer)  
**Priority:** ⚠️ High  
**Effort:** M (3-4 hours)  
**Depends On:** Task 1.4 (BYPASS_AUTH removal)

**Problem:** Each API route has its own `getAuthContext()` function instead of
using `@/lib/auth-helper.ts`.

**Tasks:**

1. Review `@/lib/auth-helper.ts` — ensure it has no BYPASS logic
2. Update all API routes to import centralized helper
3. Delete duplicated `getAuthContext` functions from route files
4. Ensure consistent error handling across all routes
5. Test all routes still work with centralized helper

**Files to Refactor:**

```
apps/web/src/app/api/v1/missions/route.ts
apps/web/src/app/api/v1/missions/[id]/route.ts
apps/web/src/app/api/v1/operations/route.ts
apps/web/src/app/api/v1/operations/[id]/route.ts
apps/web/src/app/api/v1/cohorts/*.ts (verify)
apps/web/src/app/api/v1/allies/*.ts (verify)
```

**Before:**

```typescript
// missions/route.ts - DUPLICATED
async function getAuthContext() {
  const supabase = await createClient();
  // ... 20 lines of auth logic
}
```

**After:**

```typescript
// missions/route.ts - CENTRALIZED
import { getAuthContext } from '@/lib/auth-helper';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { supabase, organizationId, userId } = await getAuthContext();
  // ... route logic
});
```

**Definition of Done:**

- [ ] All routes import from `@/lib/auth-helper.ts`
- [ ] No duplicated `getAuthContext` functions in route files
- [ ] `@/lib/auth-helper.ts` has no BYPASS_AUTH logic
- [ ] All API routes return consistent auth errors (401, 403)
- [ ] Unit tests for all routes pass
- [ ] Manual test: Auth errors are consistent across endpoints

---

#### Task 2.2: Integrate Resilience Patterns in API Routes

**Owner:** Devi (AI Developer)  
**Priority:** ⚠️ Medium  
**Effort:** M (4-5 hours)  
**Depends On:** None

**Problem:** `resilience.ts` exists with retry, circuit breaker, timeout
patterns, but NO routes use them.

**Tasks:**

1. Audit `apps/web/src/lib/resilience.ts` — verify patterns are production-ready
2. Identify critical DB queries that should retry on failure
3. Wrap Supabase queries in `withRetry()` for transient failures
4. Add circuit breaker for external API calls (if any)
5. Document when to use each pattern in `BACKEND-PATTERNS.md`

**Critical Paths to Protect:**

- Missions list query (high traffic)
- Operations list query (high traffic)
- Cohorts creation (user-facing)
- Activity log writes (shouldn't lose data)

**Example Implementation:**

```typescript
// apps/web/src/app/api/v1/missions/route.ts
import { withRetry, circuitBreaker } from '@/lib/resilience';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { supabase, organizationId } = await getAuthContext();

  // Wrap query in retry logic
  const {
    data: missions,
    error,
    count,
  } = await withRetry(
    async () => {
      return await supabase
        .from('missions')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId);
    },
    {
      attempts: 3,
      delay: 1000,
      backoff: 'exponential',
    }
  );

  if (error) throw error;
  return NextResponse.json({ data: missions, meta: { total: count } });
});
```

**Patterns to Apply:** | Pattern | When to Use | Routes |
|---------|-------------|--------| | `withRetry()` | Supabase read queries | All
GET endpoints | | `circuitBreaker()` | External API calls | None currently | |
`withTimeout()` | Long-running operations | Analytics queries |

**Definition of Done:**

- [ ] All list endpoints (GET `/api/v1/*`) use `withRetry()`
- [ ] Critical write operations use retry with idempotency
- [ ] `BACKEND-PATTERNS.md` documents when to use each pattern
- [ ] Manual test: Simulated DB timeout triggers retry
- [ ] Manual test: 3 failed retries still return error (no infinite loop)

---

#### Task 2.3: Fix Operations API Naming (goal_id → missionId)

**Owner:** John (Backend Developer)  
**Priority:** ⚠️ Low  
**Effort:** S (2-3 hours)  
**Depends On:** None

**Problem:** Operations API uses `goal_id` internally (legacy PPV naming), but
exposes `missionId` externally. Confusing.

**Decision Required:** Choose ONE of:

1. **Option A:** Rename DB column from `goal_id` to `mission_id` (breaking
   change for DB, needs migration)
2. **Option B:** Document the mapping clearly and keep it (no DB change)

**Recommendation:** Option B (document the mapping) — less risk, no data
migration needed.

**Tasks (if Option B):**

1. Add clear comment in Drizzle schema explaining mapping
2. Update `BACKEND-PATTERNS.md` to document legacy column names
3. Ensure API always uses `missionId` externally
4. Add JSDoc to operations types explaining the mapping

**Drizzle Schema Fix:**

```typescript
// packages/database/src/schema/operations.ts
export const operations = pgTable('projects', {
  // ...

  // Legacy column name from PPV 1.0 (goal_id in DB, missionId in API)
  // DO NOT rename without migration — referenced in existing data
  missionId: uuid('goal_id').references(() => missions.id, {
    onDelete: 'set null',
  }),
});
```

**Definition of Done:**

- [ ] Decision documented in this sprint plan (Option A or B)
- [ ] If Option B: Clear comments in schema
- [ ] If Option B: `BACKEND-PATTERNS.md` updated
- [ ] API documentation shows `missionId` (not `goal_id`)
- [ ] No confusion in code reviews about naming

---

#### Task 2.4: Fix Null Safety in Kanban Components

**Owner:** Lubna (UI Designer)  
**Priority:** ⚠️ Medium  
**Effort:** S (2-3 hours)  
**Depends On:** None

**Problem:** Components assume optional fields are always present:

- `task.ownerId || 'NA'` — but what if `ownerId` is `null` from DB?
- `task.missionId?.slice(0, 8)` — safe, but fallback is "Unknown"
- Loading states missing for delayed data

**Tasks:**

1. Audit `apps/web/src/components/kanban/` components
2. Add explicit null checks with TypeScript `!` or optional chaining
3. Add loading skeletons for async data
4. Add empty states when no data exists
5. Test with missing data scenarios

**Files to Review:**

```
apps/web/src/components/kanban/KanbanCard.tsx
apps/web/src/components/kanban/KanbanColumn.tsx
apps/web/src/components/operations/* (any related components)
```

**Example Fix:**

```typescript
// BEFORE (risky):
<div>{task.ownerId || 'NA'}</div>

// AFTER (safe):
<div>{task.ownerId ?? 'Unassigned'}</div>
// Or with proper null handling:
{task.ownerId ? (
  <Avatar userId={task.ownerId} />
) : (
  <span className="text-muted">Unassigned</span>
)}
```

**Loading State Example:**

```typescript
// Add loading prop to component
interface KanbanCardProps {
  task: Task | null
  isLoading?: boolean
}

// Render skeleton when loading
{isLoading ? (
  <div className="animate-pulse bg-gray-200 h-24 rounded" />
) : task ? (
  <div>{task.title}</div>
) : (
  <div className="text-muted">No task data</div>
)}
```

**Definition of Done:**

- [ ] All `|| 'NA'` patterns replaced with `??` or proper null checks
- [ ] Loading skeletons added for async data
- [ ] Empty states added when no data exists
- [ ] TypeScript strict mode passes (no `any` types)
- [ ] Manual test: Remove `ownerId` from DB → UI doesn't break
- [ ] Manual test: Slow network → loading states appear

---

### Phase 3: Documentation & Compliance (Priority: ⚠️)

#### Task 3.1: Create OpenAPI Specification

**Owner:** Nina (QA Engineer) + John (Backend)  
**Priority:** ⚠️ High  
**Effort:** L (6-8 hours)  
**Depends On:** All API routes stable (after Tasks 1.4, 1.5, 2.1)

**Problem:** No OpenAPI/Swagger docs for `/api/v1/` endpoints. Blocks contract
testing and external integration.

**Tasks:**

1. Choose OpenAPI tooling: `swagger-jsdoc` or manual YAML
2. Document all endpoints: missions, operations, cohorts, allies
3. Include request/response schemas from Zod
4. Add authentication section (Supabase JWT)
5. Generate Swagger UI at `/api/docs`
6. Add to CI: validate OpenAPI schema on build

**Structure:**

```
apps/web/
  openapi/
    openapi.yaml         # Main OpenAPI 3.0 spec
    schemas/
      mission.yaml       # Mission object schema
      operation.yaml
      cohort.yaml
```

**Endpoints to Document:**

```
GET    /api/v1/missions
POST   /api/v1/missions
GET    /api/v1/missions/:id
PATCH  /api/v1/missions/:id
DELETE /api/v1/missions/:id

GET    /api/v1/operations
POST   /api/v1/operations
GET    /api/v1/operations/:id
PATCH  /api/v1/operations/:id
DELETE /api/v1/operations/:id

GET    /api/v1/cohorts
POST   /api/v1/cohorts
GET    /api/v1/cohorts/:id
PATCH  /api/v1/cohorts/:id
DELETE /api/v1/cohorts/:id

GET    /api/v1/allies
POST   /api/v1/allies
GET    /api/v1/allies/:id
PATCH  /api/v1/allies/:id
DELETE /api/v1/allies/:id
```

**Example OpenAPI Entry:**

```yaml
paths:
  /api/v1/missions:
    get:
      summary: List all missions
      tags: [Missions]
      security:
        - BearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Mission'
                  meta:
                    $ref: '#/components/schemas/Pagination'
        '401':
          $ref: '#/components/responses/Unauthorized'
```

**Definition of Done:**

- [ ] `openapi.yaml` created in `apps/web/openapi/`
- [ ] All 20+ endpoints documented
- [ ] Request/response schemas match Zod validators
- [ ] Swagger UI accessible at `/api/docs`
- [ ] CI validates OpenAPI schema (no errors)
- [ ] Documentation reviewed by Nina (QA)

---

#### Task 3.2: Write Feature Specifications

**Owner:** Nina (QA Engineer)  
**Priority:** ⚠️ Medium  
**Effort:** M (4-6 hours)  
**Depends On:** None

**Problem:** 80% of features lack specs in `docs/specs/`. Codex compliance
requires feature specs for all major features.

**Tasks:**

1. Create `docs/specs/` directory structure
2. Write specs for:
   - Mission Control (missions CRUD, hierarchy)
   - Operations (project management, kanban)
   - Cohorts (member management, engagement tracking)
   - Activity Log (audit trail)
3. Use template from Codex §1.4.1
4. Include user stories, acceptance criteria, edge cases

**Spec Template:**

```markdown
# Feature Spec: [Feature Name]

**Feature ID:** FEAT-XXX **Status:** Implemented | In Development | Planned
**Owner:** [Name] **Related PRs:** #3

---

## 1. Overview

Brief description of the feature and its business value.

## 2. User Stories

- As a [role], I want to [action] so that [benefit]

## 3. Requirements

### Functional

- [ ] Requirement 1
- [ ] Requirement 2

### Non-Functional

- [ ] Performance: Page load < 2s
- [ ] Security: RLS policies enforced

## 4. Acceptance Criteria

Given [context] When [action] Then [expected outcome]

## 5. Edge Cases

- What happens if [scenario]?

## 6. Dependencies

- Database tables: missions, operations
- APIs: /api/v1/missions

## 7. Open Questions

- TBD items requiring decisions
```

**Features to Document:**

1. `docs/specs/mission-control.md` — Missions CRUD, hierarchy, PPV alignment
2. `docs/specs/operations.md` — Project management, kanban board
3. `docs/specs/cohorts.md` — Cohort management, member tracking
4. `docs/specs/activity-log.md` — Audit trail, event tracking

**Definition of Done:**

- [ ] 4 feature specs created in `docs/specs/`
- [ ] Each spec includes all template sections
- [ ] Acceptance criteria match implemented behavior
- [ ] Edge cases documented
- [ ] Reviewed and approved by August (PM)

---

#### Task 3.3: Update BACKEND-PATTERNS.md

**Owner:** John (Backend Developer)  
**Priority:** ⚠️ Low  
**Effort:** S (1-2 hours)  
**Depends On:** Tasks 2.1, 2.2 (after auth + resilience patterns finalized)

**Problem:** Documentation describes centralized auth helper pattern that isn't
used. After refactoring, update docs to match reality.

**Tasks:**

1. Update §2 Authentication to reflect centralized helper usage
2. Add §3 Resilience Patterns with examples of when to use each
3. Document rate limiting pattern
4. Add troubleshooting section for common auth errors

**Sections to Add/Update:**

````markdown
## §2. Authentication & Authorization

### Centralized Auth Helper

All API routes MUST use the centralized auth helper:

```typescript
import { getAuthContext } from '@/lib/auth-helper';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { supabase, organizationId, userId } = await getAuthContext();
  // ...
});
```
````

**DO NOT** create route-specific `getAuthContext()` functions.

---

## §3. Resilience Patterns

### When to Use Retry

- All Supabase read queries (GET endpoints)
- Idempotent write operations

### When to Use Circuit Breaker

- External API calls (Stripe, SendGrid, etc.)
- Third-party integrations

### When to Use Timeout

- Analytics queries (> 5 seconds expected)
- Long-running background tasks

---

## §4. Rate Limiting

All `/api/v1/*` endpoints MUST use rate limiting:

```typescript
import { withRateLimit } from '@/lib/rate-limit';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { userId } = await getAuthContext();

  return withRateLimit(async () => {
    /* route logic */
  }, `user:${userId}`);
});
```

**Limits:**

- 100 requests/minute per user
- 1000 requests/hour per IP

````

**Definition of Done:**
- [ ] `BACKEND-PATTERNS.md` reflects actual implementation
- [ ] All new patterns (auth, resilience, rate limit) documented
- [ ] Code examples match current codebase
- [ ] Troubleshooting section added
- [ ] Reviewed by Devi (AI Dev) for technical accuracy

---

## 📋 Sprint Execution Plan

### Week 1 (Days 1-3): Critical Path
**Focus:** Database & Security

| Day | Tasks | Owner(s) |
|-----|-------|----------|
| Day 1 | 1.1 Cohorts Schema + 1.2 Cohort Members Schema | John |
| Day 2 | 1.3 RLS Policies + 1.4 Remove BYPASS_AUTH | John |
| Day 3 | 1.5 Rate Limiting Setup + Integration | Devi + John |

**Milestone:** All 🔴 Critical issues resolved, security locked down.

---

### Week 1 (Days 4-5): Code Quality
**Focus:** Refactoring & Resilience

| Day | Tasks | Owner(s) |
|-----|-------|----------|
| Day 4 | 2.1 Centralize Auth + 2.3 Naming Fix | John |
| Day 5 | 2.2 Resilience Integration + 2.4 Null Safety | Devi + Lubna |

**Milestone:** Code quality improved, patterns consistent.

---

### Week 2 (Days 6-7): Documentation & Polish
**Focus:** Compliance & Testing

| Day | Tasks | Owner(s) |
|-----|-------|----------|
| Day 6 | 3.1 OpenAPI Spec (start) + 3.2 Feature Specs | Nina + John |
| Day 7 | 3.1 OpenAPI Spec (finish) + 3.3 Update Patterns Doc | Nina + John |

**Milestone:** Documentation complete, Codex score ≥ 90.

---

## 🧪 Testing Strategy

### Pre-Merge Testing Checklist

#### Unit Tests
- [ ] All API routes have unit tests
- [ ] Auth helper has unit tests
- [ ] Rate limiter has unit tests
- [ ] Resilience patterns have unit tests

#### Integration Tests
- [ ] RLS policies tested with multiple orgs/users
- [ ] Auth flow tested end-to-end
- [ ] API endpoints tested with real Supabase

#### Manual Testing
- [ ] Unauthenticated user cannot access dashboard
- [ ] User A cannot access User B's organization data
- [ ] Rate limit returns 429 after threshold
- [ ] All new DB columns accessible via API
- [ ] Kanban components render with null data

#### Security Testing
- [ ] No `BYPASS_AUTH` in codebase (grep confirms)
- [ ] Service role key not exposed to client
- [ ] RLS policies prevent cross-org access
- [ ] Rate limiting prevents DoS

---

## 🔄 Git Merge Sequence

### Phase 1: Stabilization Branch
**Branch:** `stabilization/sprint-4-fixes`
**Created from:** `feature/sprint-4-mission-control`

1. Create stabilization branch:
   ```bash
   git checkout feature/sprint-4-mission-control
   git pull origin feature/sprint-4-mission-control
   git checkout -b stabilization/sprint-4-fixes
````

2. Apply all fixes from Tasks 1.1 - 3.3

3. Test thoroughly (see Testing Strategy)

4. Open PR: `stabilization/sprint-4-fixes` → `feature/sprint-4-mission-control`

---

### Phase 2: Merge to Dev

**After:** Stabilization PR approved

1. Merge stabilization to sprint-4 branch:

   ```bash
   git checkout feature/sprint-4-mission-control
   git merge stabilization/sprint-4-fixes
   ```

2. Close PR #3 (sprint-4 → dev) with updated commits

3. Merge to dev:
   ```bash
   git checkout dev
   git merge feature/sprint-4-mission-control
   git push origin dev
   ```

---

### Phase 3: Merge to Main (Production)

**After:** Dev deployment tested in staging

1. Check sprint-3 already merged to dev:

   ```bash
   git log dev --oneline | grep sprint-3
   ```

2. Merge dev to main:
   ```bash
   git checkout main
   git merge dev
   git tag v1.4.0  # Version bump
   git push origin main --tags
   ```

---

## ✅ Pre-Merge Checklist

### Code Quality

- [ ] No TypeScript errors (`pnpm build` succeeds)
- [ ] No ESLint errors (`pnpm lint` passes)
- [ ] No console.log or debug code
- [ ] All TODO comments have issue numbers

### Security

- [ ] No `BYPASS_AUTH` in codebase
- [ ] No hardcoded secrets
- [ ] Service role key only in `.env` (not committed)
- [ ] RLS policies enforced on all tables

### Database

- [ ] All migrations run successfully
- [ ] Schema matches Drizzle definitions
- [ ] Indexes exist for all foreign keys
- [ ] RLS policies tested with multiple users

### API

- [ ] All endpoints have error handling
- [ ] All endpoints have rate limiting
- [ ] All endpoints return consistent format
- [ ] Auth required on all protected routes

### Documentation

- [ ] OpenAPI spec complete
- [ ] Feature specs written
- [ ] `BACKEND-PATTERNS.md` updated
- [ ] README updated (if needed)

### Testing

- [ ] Unit tests pass (≥ 80% coverage)
- [ ] Integration tests pass
- [ ] Manual testing complete (see checklist)
- [ ] No regressions in existing features

### Deployment

- [ ] Environment variables documented
- [ ] Migration plan documented
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured (if applicable)

---

## 🚨 Risk Mitigation

### High-Risk Changes

| Risk                                    | Mitigation                               | Owner |
| --------------------------------------- | ---------------------------------------- | ----- |
| Schema migration breaks existing data   | Backfill all columns with safe defaults  | John  |
| RLS policies too strict, break features | Test with multiple user roles            | Nina  |
| Rate limiting too aggressive            | Start with high limits, tune down        | Devi  |
| BYPASS removal breaks local dev         | Document proper local setup              | John  |
| Auth centralization introduces bugs     | Incremental refactoring, test each route | John  |

### Rollback Plan

If critical issues found after merge:

1. **Immediate:** Revert merge commit on `dev`

   ```bash
   git revert -m 1 <merge-commit-sha>
   git push origin dev
   ```

2. **Database:** Run rollback migration (create before merging)

   ```sql
   -- rollback_stabilization.sql
   ALTER TABLE cohorts DROP COLUMN IF EXISTS slug;
   -- ... revert all schema changes
   ```

3. **Communication:** Notify team in `#dev-general`

4. **Analysis:** Identify root cause, fix in new PR

---

## 📊 Success Metrics

### Target Scores

- **QA Score:** 82 → 92+ (Goal: ≥ 90)
- **Backend Score:** 68 → 88+ (Goal: ≥ 85)
- **Codex Score:** 73 → 90+ (Goal: ≥ 90)

### Key Indicators

- [ ] Zero auth bypass logic in codebase
- [ ] 100% of tables have org-scoped RLS
- [ ] 100% of API endpoints have rate limiting
- [ ] All critical DB columns exist in migrations
- [ ] OpenAPI spec covers all endpoints

---

## 📅 Timeline

**Start Date:** 2026-02-14 (Friday)  
**End Date:** 2026-02-20 (Thursday)  
**Duration:** 7 days

**Critical Path:** Days 1-3 → Database & Security (blocks everything) Days 4-5 →
Code Quality (depends on Day 3) Days 6-7 → Documentation (depends on Day 5)

**Buffer:** 1 day built into schedule for unexpected issues.

---

## 👥 Owner Assignments Summary

| Owner              | Tasks                                           | Total Effort |
| ------------------ | ----------------------------------------------- | ------------ |
| **John (Backend)** | 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 3.1 (assist), 3.3 | ~25 hours    |
| **Devi (AI Dev)**  | 1.5, 2.2                                        | ~12 hours    |
| **Nina (QA)**      | 3.1, 3.2                                        | ~12 hours    |
| **Lubna (UI)**     | 2.4                                             | ~3 hours     |

**Total:** ~52 hours across 4 specialists over 7 days.

---

## 📞 Communication Plan

### Daily Standup (Discord #dev-general)

**Time:** 10:00 AM PKT  
**Format:**

- What I completed yesterday
- What I'm working on today
- Any blockers

### Blocker Escalation

- **< 2 hours stuck:** Ask in #dev-general
- **> 2 hours stuck:** Notify August (PM)
- **> 4 hours stuck:** August escalates to Alim (CEO)

### Status Updates

- **End of Day 3:** Critical issues completion report
- **End of Day 5:** Code quality completion report
- **End of Day 7:** Final sprint summary

---

## 🎯 Definition of Done (Sprint)

This stabilization sprint is DONE when:

✅ **All Critical Issues Resolved**

- [ ] Cohorts schema matches Drizzle (1.1, 1.2)
- [ ] RLS policies org-scoped (1.3)
- [ ] No BYPASS_AUTH logic (1.4)
- [ ] Rate limiting on all endpoints (1.5)

✅ **Code Quality Improved**

- [ ] Centralized auth helper used (2.1)
- [ ] Resilience patterns integrated (2.2)
- [ ] Naming consistency achieved (2.3)
- [ ] Null safety in components (2.4)

✅ **Documentation Complete**

- [ ] OpenAPI spec published (3.1)
- [ ] Feature specs written (3.2)
- [ ] BACKEND-PATTERNS.md updated (3.3)

✅ **Testing Complete**

- [ ] All checklists passed
- [ ] QA score ≥ 90
- [ ] Backend score ≥ 85

✅ **Git Merged**

- [ ] Stabilization → sprint-4 → dev → main
- [ ] Production deployment successful

---

**Plan Approved By:** August (Project Manager)  
**Review Required:** Alim (CEO)  
**Execution Start:** 2026-02-14

---

_This is a PLANNING document. No code execution during planning phase. Execution
begins after CEO approval._
