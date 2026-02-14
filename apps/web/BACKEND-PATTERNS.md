# Backend Patterns & Best Practices

**Project:** Cohortix  
**Last Updated:** February 13, 2026  
**Maintained By:** Backend Team

---

## Overview

This document captures established backend patterns in Cohortix. Follow these
patterns for consistency and maintainability.

---

## 1. API Route Structure

### Standard Route Template

```typescript
/**
 * Resource API Route - GET (list) and POST (create)
 * Axon Codex v1.2 compliant.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withErrorHandler } from '@/lib/errors';
import { validateRequest, validateData } from '@/lib/validation';
import { getAuthContext } from '@/lib/auth-helper';

// ============================================================================
// GET /api/v1/resources
// ============================================================================

export const GET = withErrorHandler(async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  // 1. Validate query parameters
  const searchParams = Object.fromEntries(
    request.nextUrl.searchParams.entries()
  );
  const query = validateData(querySchema, searchParams);

  // 2. Get authenticated context
  const { supabase, organizationId, userId } = await getAuthContext();

  // 3. Log the operation
  logger.info('Fetching resources', {
    correlationId,
    userId,
    organizationId,
    query,
  });

  // 4. Build and execute query
  let queryBuilder = supabase
    .from('resources')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId);

  // Apply filters, sorting, pagination
  // ...

  const { data, error, count } = await queryBuilder;

  if (error) {
    logger.error('Failed to fetch resources', { correlationId, error });
    throw error;
  }

  // 5. Return standardized response
  return NextResponse.json({
    data: data || [],
    meta: {
      page: query.page,
      limit: query.limit,
      total: count || 0,
      totalPages: count ? Math.ceil(count / query.limit) : 0,
    },
  });
});
```

### Key Principles

1. **Always use `withErrorHandler`** — Centralizes error handling
2. **Generate correlation ID first** — For distributed tracing
3. **Validate all inputs** — Never trust client data
4. **Get auth context** — Use centralized helper
5. **Log operations** — Info for success, error for failures
6. **Return consistent format** — Data + meta for lists, data only for singles

---

## 2. Authentication & Authorization

### Use Centralized Auth Helper

```typescript
import { getAuthContext } from '@/lib/auth-helper';

const { supabase, organizationId, userId } = await getAuthContext();
```

**Never duplicate auth logic.** The helper handles:

- Production auth (Supabase)
- Development auth bypass
- Organization membership verification
- Error handling

### Development Auth Bypass

For local testing without full auth:

```bash
# .env.local
NODE_ENV=development
BYPASS_AUTH=true
```

**⚠️ CRITICAL:** Never enable in production. CI should fail if
`BYPASS_AUTH=true` in production builds.

### Authorization Checks

Always scope queries to user's organization:

```typescript
// ✅ GOOD: Organization-scoped
.eq('organization_id', organizationId)

// ❌ BAD: Global query (security risk)
.select('*')
```

For resource updates/deletes, verify ownership:

```typescript
// Verify resource belongs to organization
const { data: existing } = await supabase
  .from('resources')
  .select('id')
  .eq('id', resourceId)
  .eq('organization_id', organizationId)
  .single();

if (!existing) throw new NotFoundError('Resource', resourceId);
```

---

## 3. Input Validation

### Zod Schemas

All endpoints MUST validate inputs with Zod:

```typescript
import { z } from 'zod';

export const createResourceSchema = z.object({
  name: z.string().min(3).max(255).trim(),
  description: z.string().max(10000).optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  settings: z.record(z.any()).optional(),
});

// Use in route
const validator = validateRequest(createResourceSchema, { target: 'body' });
const data = await validator(request);
```

### Common Validation Patterns

```typescript
// UUID validation
resourceId: z.string().uuid();

// Email validation
email: z.string().email();

// Date validation (YYYY-MM-DD)
startDate: z.string().date();

// Hex color validation
color: z.string()
  .regex(/^#[0-9a-fA-F]{6}$/)

  // Custom refinements
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
```

---

## 4. Error Handling

### RFC 7807 Problem Details

All errors use standardized format:

```typescript
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/lib/errors';

// Example usage
if (!user) throw new UnauthorizedError('Authentication required');
if (!membership) throw new ForbiddenError('Insufficient permissions');
if (!resource) throw new NotFoundError('Resource', resourceId);
```

### Error Response Format

```json
{
  "type": "https://cohortix.com/errors/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Resource with id 'abc-123' not found",
  "instance": "/api/v1/resources/abc-123"
}
```

### Logging Errors

```typescript
try {
  // Operation
} catch (error) {
  logger.error('Operation failed', { correlationId, error });
  throw error; // Let withErrorHandler convert to response
}
```

---

## 5. Structured Logging

### Correlation IDs

Every request gets a unique correlation ID:

```typescript
const correlationId = logger.generateCorrelationId();
logger.setContext({ correlationId });

logger.info('Operation started', { correlationId, userId, resourceId });
logger.error('Operation failed', { correlationId, error });
```

### Log Levels

- **`debug`** — Verbose development info (only in NODE_ENV=development)
- **`info`** — Normal operations (fetch, create, update)
- **`warn`** — Recoverable issues (validation failed, retry attempt)
- **`error`** — Failures requiring attention
- **`fatal`** — Critical failures causing shutdown

### Structured Context

```typescript
logger.info('Resource created', {
  correlationId,
  userId,
  organizationId,
  resourceId: resource.id,
  resourceType: 'mission',
});
```

**Always include:**

- `correlationId` — Request tracking
- `userId` — Who performed the action
- `organizationId` — Tenant isolation
- Operation-specific context

---

## 6. Database Patterns

### UUID Primary Keys

```typescript
export const resources = pgTable('resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  // ✅ GOOD: UUID
  // ❌ BAD: serial('id').primaryKey()
});
```

### Timestamps

```typescript
createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
```

### Foreign Keys with Cascade

```typescript
organizationId: uuid('organization_id')
  .notNull()
  .references(() => organizations.id, { onDelete: 'cascade' }),
```

### Indexes

```typescript
// Foreign key indexes
(table) => ({
  orgIdx: index('idx_resources_org').on(table.organizationId),
})

// Composite indexes for queries
(table) => ({
  entityIdx: index('idx_comments_entity').on(table.entityType, table.entityId),
})
```

### Connection Pooling

Configuration in `packages/database/src/client.ts`:

```typescript
const poolConfig = {
  max: 20, // Maximum pool size
  idle_timeout: 30, // Close idle connections after 30s
  connect_timeout: 10, // Connection timeout
  max_lifetime: 60 * 30, // Close connections after 30 min
};
```

---

## 7. N+1 Query Prevention

### Eager Loading

```typescript
// ❌ BAD: N+1 query (fetches owner for each mission)
const missions = await supabase.from('missions').select('*');
for (const mission of missions) {
  const owner = await supabase
    .from('users')
    .select('*')
    .eq('id', mission.owner_id);
}

// ✅ GOOD: Single query with join
const missions = await supabase
  .from('missions')
  .select('*, owner:users(id, name, email)');
```

### Batch Loading

```typescript
// ❌ BAD: Multiple queries
for (const missionId of missionIds) {
  await supabase.from('tasks').select('*').eq('mission_id', missionId);
}

// ✅ GOOD: Single query with IN clause
const tasks = await supabase
  .from('tasks')
  .select('*')
  .in('mission_id', missionIds);
```

---

## 8. Pagination Standards

### Query Parameters

```typescript
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
```

### Response Format

```typescript
return NextResponse.json({
  data: [...],
  meta: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8, // IMPORTANT: Include for client-side page controls
  },
})
```

### Implementation

```typescript
const start = (query.page - 1) * query.limit;
const end = start + query.limit - 1;

queryBuilder = queryBuilder.range(start, end);
```

---

## 9. Polymorphic Relationships

### Pattern

For entities that can belong to multiple parent types (e.g., comments on
tasks/operations/missions):

```typescript
export const comments = pgTable(
  'comments',
  {
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    // ...
  },
  (table) => ({
    entityIdx: index('idx_comments_entity').on(
      table.entityType,
      table.entityId
    ),
  })
);
```

### Best Practice: Add CHECK Constraint

```sql
ALTER TABLE comments
ADD CONSTRAINT entity_type_check
CHECK (entity_type IN ('task', 'operation', 'mission'));
```

### Querying

```typescript
// Get all comments for a mission
const comments = await supabase
  .from('comments')
  .select('*')
  .eq('entity_type', 'mission')
  .eq('entity_id', missionId);
```

---

## 10. API Versioning

### Current Version: v1

All routes under `/api/v1/`

### Breaking Changes

When introducing breaking changes:

1. Create new version: `/api/v2/`
2. Maintain v1 for 12 months
3. Document deprecation in v1 responses

### Non-Breaking Changes

Safe to add to existing version:

- New optional fields
- New endpoints
- Additional query parameters (with defaults)

---

## 11. HTTP Status Codes

| Code                        | Use Case                         | Example                    |
| --------------------------- | -------------------------------- | -------------------------- |
| `200 OK`                    | Successful GET, PUT, PATCH       | Resource fetched/updated   |
| `201 Created`               | Successful POST                  | Resource created           |
| `204 No Content`            | Successful DELETE                | Resource deleted           |
| `400 Bad Request`           | Client error, invalid input      | Missing required field     |
| `401 Unauthorized`          | Authentication required          | No auth token              |
| `403 Forbidden`             | Authenticated but not authorized | User not in organization   |
| `404 Not Found`             | Resource doesn't exist           | Invalid ID                 |
| `409 Conflict`              | Resource conflict                | Duplicate slug             |
| `422 Unprocessable Entity`  | Validation error                 | End date before start date |
| `429 Too Many Requests`     | Rate limited                     | Exceeded API quota         |
| `500 Internal Server Error` | Server error                     | Database connection failed |

---

## 12. Resilience Patterns

### Retry with Exponential Backoff

```typescript
import { withRetry } from '@/lib/resilience';

const data = await withRetry(() => fetch('https://external-api.com/data'), {
  attempts: 3,
  delay: 1000,
});
```

### Circuit Breaker

```typescript
import { CircuitBreaker } from '@/lib/resilience';

const breaker = new CircuitBreaker({ failureThreshold: 5 });

const result = await breaker.execute(async () => {
  return await fetch('https://flaky-service.com/data');
});
```

### Timeout

```typescript
import { withTimeout } from '@/lib/resilience';

const data = await withTimeout(() => fetch('https://slow-api.com/data'), {
  timeoutMs: 5000,
});
```

---

## 13. Health Checks

### Endpoints

- **`/api/health`** — Liveness (is service running?)
- **`/api/ready`** — Readiness (can service handle requests?)

### Usage

Load balancers and monitoring tools should:

- Check `/health` for liveness probes
- Check `/ready` for readiness probes
- Consider service unhealthy if `/ready` returns 503

---

## 14. Common Anti-Patterns

### ❌ Duplicated Auth Logic

```typescript
// BAD: Auth logic in every route
if (
  process.env.NODE_ENV === 'development' &&
  process.env.BYPASS_AUTH === 'true'
) {
  // 20 lines of setup
}
```

**Fix:** Use `getAuthContext()` helper

### ❌ Unsafe Polymorphic Foreign Keys

```typescript
// BAD: No constraint on entity_type
entityType: varchar('entity_type', { length: 50 }).notNull(),
```

**Fix:** Add CHECK constraint limiting allowed types

### ❌ Missing Connection Pool Limits

```typescript
// BAD: No pool configuration
const client = postgres(connectionString);
```

**Fix:** Explicit pool limits (see §6)

### ❌ No Input Validation

```typescript
// BAD: Trust client data
const { name } = await request.json();
```

**Fix:** Always use Zod schemas (see §3)

### ❌ Hardcoded Secrets

```typescript
// BAD: Secret in code
const API_KEY = 'sk-abc123...';
```

**Fix:** Use environment variables

---

## 15. Testing Patterns

### Unit Tests

Test business logic in isolation:

```typescript
import { describe, it, expect } from 'vitest';
import { validateMission } from './validation';

describe('Mission validation', () => {
  it('should accept valid mission data', () => {
    const result = validateMission({ name: 'Test Mission' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid data', () => {
    const result = validateMission({ name: '' });
    expect(result.success).toBe(false);
  });
});
```

### Integration Tests

Test API endpoints with real database:

```typescript
import { describe, it, expect } from 'vitest';

describe('Missions API', () => {
  it('should create a mission', async () => {
    const response = await fetch('/api/v1/missions', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Test Mission' }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.data.name).toBe('Test Mission');
  });
});
```

---

## 16. Performance Tips

### Use Select Sparingly

```typescript
// ✅ GOOD: Only fetch needed fields
.select('id, name, status')

// ⚠️ ACCEPTABLE: All fields (if you need them)
.select('*')

// ❌ BAD: Fetching unused fields
.select('*') // but only using id and name
```

### Index Your Queries

If you filter/sort on a column, add an index:

```sql
CREATE INDEX idx_missions_status ON missions(status);
```

### Limit Result Sets

Always paginate large result sets:

```typescript
.range(start, end) // Supabase pagination
```

---

## 17. Deployment Checklist

Before deploying new API routes:

- [ ] All endpoints have input validation
- [ ] All endpoints check authorization
- [ ] Errors use RFC 7807 format
- [ ] Logging includes correlation IDs
- [ ] Database queries are indexed
- [ ] N+1 queries avoided
- [ ] Integration tests pass
- [ ] Health checks work

---

**Maintained By:** Backend Team  
**Questions?** Ask in #backend channel or review Axon Codex v1.2
