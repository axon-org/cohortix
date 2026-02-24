# COH-B1: Cohorts Database Schema & API - Specification

**Status:** In Development  
**Author:** Devi (AI Developer)  
**Date:** 2026-02-11  
**Priority:** P1 (Blocks Everything)  
**Axon Codex:** v1.2 Compliant

---

## 1. Overview

### Purpose

Implement the cohorts database schema and API routes to support the Cohortix
platform's core feature: managing groups of AI agents (cohorts) with engagement
tracking, status management, and multi-tenant access control.

### Scope

- **In Scope:**
  - Cohorts table schema with Drizzle ORM
  - CRUD API routes with Zod validation
  - Row-Level Security (RLS) policies for multi-tenant isolation
  - Mission Control dashboard KPI aggregation endpoints
  - Health trend data endpoints
  - Unit and integration tests for all routes
  - Structured logging and RFC 7807 error handling

- **Out of Scope:**
  - Frontend UI components (separate sprint)
  - Real-time websocket connections
  - Cohort member management (future iteration)
  - Advanced analytics/reporting

---

## 2. Data Model

### 2.1 Cohorts Table Schema

```typescript
export const cohortStatusEnum = pgEnum('cohort_status', [
  'active', // Actively running
  'paused', // Temporarily paused
  'at-risk', // Low engagement or issues
  'completed', // Finished/archived
]);

export const cohorts = pgTable('cohorts', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),

  // Multi-tenancy
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Core fields
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  status: cohortStatusEnum('status').default('active').notNull(),

  // Metrics (computed/cached values)
  memberCount: integer('member_count').default(0).notNull(),
  engagementPercent: decimal('engagement_percent', { precision: 5, scale: 2 })
    .default('0')
    .notNull(),

  // Dates
  startDate: date('start_date'),
  endDate: date('end_date'),

  // Audit fields
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),

  // Optional settings
  settings: jsonb('settings').default({}).notNull(),
});

// Unique constraint: slug per organization
// Index: organizationId for fast tenant filtering
// Index: status for dashboard queries
// Index: createdAt for sorting
```

### 2.2 Related Tables (Future)

**cohort_members** (not in this sprint):

- Links agents to cohorts
- Tracks individual engagement
- Enables many-to-many relationship

---

## 3. API Routes

### 3.1 Base Path

All cohort API routes use the base path: `/api/v1/cohorts`

### 3.2 Route Specifications

#### GET `/api/v1/cohorts`

**Purpose:** List all cohorts for the current organization

**Query Parameters:**

```typescript
{
  page?: number;           // Default: 1
  limit?: number;          // Default: 20, Max: 100
  status?: CohortStatus;   // Filter by status
  search?: string;         // Search by name/description
  sortBy?: 'name' | 'createdAt' | 'memberCount' | 'engagementPercent';
  sortOrder?: 'asc' | 'desc';
}
```

**Response (200):**

```typescript
{
  data: Cohort[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

**Errors:**

- 401: Unauthorized (no session)
- 403: Forbidden (no org access)
- 500: Internal Server Error

---

#### GET `/api/v1/cohorts/:id`

**Purpose:** Get a single cohort by ID

**Path Parameters:**

- `id`: UUID of the cohort

**Response (200):**

```typescript
{
  data: Cohort;
}
```

**Errors:**

- 401: Unauthorized
- 403: Forbidden (wrong org)
- 404: Not Found
- 500: Internal Server Error

---

#### POST `/api/v1/cohorts`

**Purpose:** Create a new cohort

**Request Body:**

```typescript
{
  name: string;                    // Min 3, max 255 chars
  description?: string;            // Optional
  status?: CohortStatus;           // Default: 'active'
  startDate?: string;              // ISO 8601 date
  endDate?: string;                // ISO 8601 date
  settings?: Record<string, any>;  // Optional JSON
}
```

**Response (201):**

```typescript
{
  data: Cohort;
}
```

**Errors:**

- 400: Bad Request (invalid JSON)
- 401: Unauthorized
- 403: Forbidden
- 422: Validation Error (Zod)
- 500: Internal Server Error

---

#### PATCH `/api/v1/cohorts/:id`

**Purpose:** Update an existing cohort

**Path Parameters:**

- `id`: UUID of the cohort

**Request Body:** (all fields optional)

```typescript
{
  name?: string;
  description?: string;
  status?: CohortStatus;
  startDate?: string;
  endDate?: string;
  memberCount?: number;           // Computed field update
  engagementPercent?: number;     // Computed field update
  settings?: Record<string, any>;
}
```

**Response (200):**

```typescript
{
  data: Cohort;
}
```

**Errors:**

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error

---

#### DELETE `/api/v1/cohorts/:id`

**Purpose:** Delete a cohort (soft delete recommended, hard delete for now)

**Path Parameters:**

- `id`: UUID of the cohort

**Response (204):**

```
No content
```

**Errors:**

- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

---

### 3.3 Dashboard API Routes

#### GET `/api/v1/dashboard/mission-control`

**Purpose:** Get KPI aggregations for Mission Control dashboard

**Response (200):**

```typescript
{
  data: {
    kpis: {
      activeCohortsCount: number;
      totalAgents: number;
      avgEngagement: number; // Percentage (0-100)
      atRiskCount: number; // Cohorts with status='at-risk'
    }
    trends: {
      activeCohortsChange: number; // Percentage change from last period
      totalAgentsChange: number;
      avgEngagementChange: number;
      atRiskChange: number;
    }
  }
}
```

**Errors:**

- 401: Unauthorized
- 403: Forbidden
- 500: Internal Server Error

---

#### GET `/api/v1/dashboard/health-trends`

**Purpose:** Get engagement trends over time

**Query Parameters:**

```typescript
{
  period?: '30d' | '90d' | '1y';  // Default: '30d'
  interval?: 'day' | 'week' | 'month'; // Default: 'day'
}
```

**Response (200):**

```typescript
{
  data: {
    dataPoints: Array<{
      date: string; // ISO 8601
      avgEngagement: number; // Percentage
      activeCohorts: number;
      totalMembers: number;
    }>;
  }
}
```

**Errors:**

- 401: Unauthorized
- 403: Forbidden
- 422: Validation Error
- 500: Internal Server Error

---

## 4. Row-Level Security (RLS) Policies

### 4.1 Tenant Isolation Policy

```sql
-- Enable RLS
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access cohorts in their organization
CREATE POLICY tenant_isolation ON cohorts
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can only insert cohorts for their organization
CREATE POLICY tenant_insert ON cohorts
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can only update cohorts in their organization
CREATE POLICY tenant_update ON cohorts
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can only delete cohorts in their organization
CREATE POLICY tenant_delete ON cohorts
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );
```

### 4.2 Role-Based Access (Future Enhancement)

- Admin: Full CRUD
- Member: Read-only
- Owner: Full CRUD + delete

---

## 5. Validation Schemas (Zod)

### 5.1 Create Cohort

```typescript
export const createCohortSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must be less than 255 characters'),
  description: z.string().max(10000).optional(),
  status: z
    .enum(['active', 'paused', 'at-risk', 'completed'])
    .default('active'),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  settings: z.record(z.any()).optional(),
});
```

### 5.2 Update Cohort

```typescript
export const updateCohortSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  description: z.string().max(10000).optional(),
  status: z.enum(['active', 'paused', 'at-risk', 'completed']).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  memberCount: z.number().int().min(0).optional(),
  engagementPercent: z.number().min(0).max(100).optional(),
  settings: z.record(z.any()).optional(),
});
```

### 5.3 Query Parameters

```typescript
export const cohortQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['active', 'paused', 'at-risk', 'completed']).optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['name', 'createdAt', 'memberCount', 'engagementPercent'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
```

---

## 6. Error Handling

All API routes follow RFC 7807 Problem Details standard:

```typescript
{
  type: string;      // Error type URL
  title: string;     // Human-readable error title
  status: number;    // HTTP status code
  detail?: string;   // Specific error details
  instance?: string; // Request path
  errors?: Record<string, string[]>; // Validation errors
}
```

**Examples:**

**Validation Error:**

```json
{
  "type": "https://cohortix.com/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "Validation failed",
  "instance": "/api/v1/cohorts",
  "errors": {
    "name": ["Name must be at least 3 characters"],
    "endDate": ["End date must be after start date"]
  }
}
```

**Not Found:**

```json
{
  "type": "https://cohortix.com/errors/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Cohort with id 'abc-123' not found",
  "instance": "/api/v1/cohorts/abc-123"
}
```

---

## 7. Structured Logging

All API routes use JSON structured logging with correlation IDs:

```typescript
logger.info('Cohort created', {
  correlationId: req.correlationId,
  cohortId: cohort.id,
  organizationId: user.organizationId,
  userId: user.id,
  action: 'create_cohort',
});

logger.error('Failed to fetch cohorts', {
  correlationId: req.correlationId,
  error: {
    name: error.name,
    message: error.message,
    stack: error.stack,
  },
  organizationId: user.organizationId,
});
```

---

## 8. Testing Requirements

### 8.1 Unit Tests (Vitest)

- [x] Zod schema validation (valid/invalid inputs)
- [x] Slug generation utility
- [x] Engagement calculation utility

### 8.2 Integration Tests (Vitest + Supabase)

- [x] GET `/api/v1/cohorts` - list with pagination
- [x] GET `/api/v1/cohorts` - filter by status
- [x] GET `/api/v1/cohorts` - search by name
- [x] GET `/api/v1/cohorts/:id` - success
- [x] GET `/api/v1/cohorts/:id` - not found
- [x] POST `/api/v1/cohorts` - create success
- [x] POST `/api/v1/cohorts` - validation error
- [x] PATCH `/api/v1/cohorts/:id` - update success
- [x] PATCH `/api/v1/cohorts/:id` - not found
- [x] DELETE `/api/v1/cohorts/:id` - success
- [x] DELETE `/api/v1/cohorts/:id` - not found
- [x] Multi-tenant isolation (user cannot access other org's cohorts)

### 8.3 Dashboard Tests

- [x] GET `/api/v1/dashboard/mission-control` - KPI calculations
- [x] GET `/api/v1/dashboard/health-trends` - trend data

### 8.4 Coverage Target

- **Minimum:** 70% overall
- **Critical paths:** 80%+ (CRUD operations, RLS)

---

## 9. Implementation Plan

### Phase 1: Schema & Migrations ✅

1. Create `cohorts.ts` schema file
2. Add to `schema/index.ts` exports
3. Generate migration with `pnpm db:generate`
4. Apply migration with `pnpm db:push`
5. Add RLS policies in migration SQL

### Phase 2: Validation & Utils ✅

1. Create `cohort.ts` validation schemas
2. Add to `lib/validation.ts`
3. Create slug generation utility
4. Create engagement calculation utility

### Phase 3: API Routes ✅

1. Create `/api/v1/cohorts/route.ts` (GET, POST)
2. Create `/api/v1/cohorts/[id]/route.ts` (GET, PATCH, DELETE)
3. Apply validation, error handling, logging
4. Test manually with Postman/curl

### Phase 4: Dashboard Routes ✅

1. Create `/api/v1/dashboard/mission-control/route.ts`
2. Create `/api/v1/dashboard/health-trends/route.ts`
3. Implement KPI aggregations
4. Implement trend calculations

### Phase 5: Tests ✅

1. Write unit tests for schemas and utils
2. Write integration tests for all routes
3. Run tests: `pnpm test`
4. Generate coverage: `pnpm test:coverage`
5. Fix failing tests until 70%+ coverage

### Phase 6: Documentation & Review ✅

1. Update CLAUDE.md with cohorts implementation
2. Document learnings in Mem0
3. Update expertise files
4. Post to Discord #dev-general

---

## 10. Success Criteria

- [x] Cohorts table created with all required fields
- [x] RLS policies enforced (multi-tenant isolation)
- [x] All CRUD routes functional with validation
- [x] Dashboard KPI routes returning accurate data
- [x] All tests passing with 70%+ coverage
- [x] RFC 7807 error handling applied
- [x] Structured logging in all routes
- [x] No TypeScript errors
- [x] Axon Codex compliance (spec before code, tests required)

---

## 11. Future Enhancements (Not in This Sprint)

- [ ] Cohort member management (many-to-many with agents)
- [ ] Real-time updates via Supabase Realtime
- [ ] Advanced analytics (engagement breakdowns, trends)
- [ ] Soft delete with `deleted_at` column
- [ ] Role-based access control (admin/member/owner)
- [ ] Bulk operations (bulk delete, bulk status update)
- [ ] Cohort templates
- [ ] Export cohort data (CSV, JSON)
