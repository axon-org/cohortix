# PPV Pro Migration Summary

**Date:** 2026-02-12  
**Migration:** `0006_ppv_terminology_alignment.sql`  
**Status:** ✅ READY FOR DEPLOYMENT

---

## Overview

Implemented complete PPV Pro hierarchy for Cohortix with dual human+agent
ownership. All entities support polymorphic `owner_type` (user/agent) and
`owner_id`.

---

## New Tables Created

### Alignment Zone (The Pyramid)

| Table     | PPV Pro Term      | User-Facing | Purpose                        | Key Fields                                   |
| --------- | ----------------- | ----------- | ------------------------------ | -------------------------------------------- |
| `domains` | Pillars & Purpose | Domain      | Core life/expertise areas      | name, color, icon, owner_type, owner_id      |
| `visions` | Life Aspirations  | Vision      | Emotional north stars          | title, why_statement, domain_id, status      |
| `rhythms` | Routines          | Rhythm      | Recurring habits (no end date) | name, frequency, mission_id, streak tracking |

### Knowledge Zone

| Table          | PPV Pro Term | User-Facing  | Purpose                      | Key Fields                                   |
| -------------- | ------------ | ------------ | ---------------------------- | -------------------------------------------- |
| `intelligence` | Topic Vault  | Intelligence | Knowledge organized by topic | name, parent_topic_id, insight_count         |
| `insights`     | NeuroBits    | Insight      | Individual learning captures | title, content, source_type, intelligence_id |

### Rhythm Zone (Reviews)

| Table      | PPV Pro Term              | User-Facing | Purpose                       | Key Fields                                          |
| ---------- | ------------------------- | ----------- | ----------------------------- | --------------------------------------------------- |
| `debriefs` | Daily/Weekly/Cycle Review | Debrief     | Reflection and review entries | type, period_start/end, wins, challenges, learnings |

---

## Modified Tables

### `goals` (missions table)

- **Added:** `vision_id UUID` — Links Missions to Visions
- **Index:** `idx_goals_vision`

### `tasks` table

- **Added:** `rhythm_id UUID` — Links Tasks to Rhythms
- **Modified:** `project_id` now nullable (tasks can belong to rhythms instead)
- **Constraint:** `tasks_project_or_rhythm_check` — Task must belong to EITHER
  project OR rhythm
- **Index:** `idx_tasks_rhythm`

---

## PPV Hierarchy

```
Domain (core area)
  └─ Vision (emotional north star)
      └─ Mission (measurable outcome)
          ├─ Operation (bounded initiative)
          │   └─ Task (atomic work)
          └─ Rhythm (recurring habit)
              └─ Task (atomic work)
```

### Knowledge Hierarchy

```
Intelligence (topic)
  ├─ Intelligence (sub-topic)
  └─ Insight (learning capture)
```

### Review Cadences

```
Debrief (standalone)
  ├─ Type: daily | weekly | cycle
  └─ Owner: human or agent
```

---

## Drizzle Schema Files

Created/Updated:

1. ✅ `packages/database/src/schema/domains.ts` (NEW)
2. ✅ `packages/database/src/schema/visions.ts` (NEW)
3. ✅ `packages/database/src/schema/rhythms.ts` (NEW)
4. ✅ `packages/database/src/schema/intelligence.ts` (NEW)
5. ✅ `packages/database/src/schema/insights.ts` (NEW)
6. ✅ `packages/database/src/schema/debriefs.ts` (NEW)
7. ✅ `packages/database/src/schema/missions.ts` (UPDATED - added vision_id
   comment)
8. ✅ `packages/database/src/schema/tasks.ts` (UPDATED - added rhythm_id field)
9. ✅ `packages/database/src/schema/index.ts` (UPDATED - exports all new tables)

---

## Security (RLS)

All new tables have comprehensive Row-Level Security:

- ✅ Service role bypass (for admin operations)
- ✅ Tenant isolation (organization-scoped access)
- ✅ SELECT, INSERT, UPDATE, DELETE policies

Pattern:

```sql
-- Service role can access all
CREATE POLICY {table}_service_role_all ON {table}
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Regular users scoped to their organization
CREATE POLICY {table}_tenant_select ON {table}
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
  ));
```

---

## Indexes Created

### Performance Optimization

Each table has strategic indexes for common query patterns:

**Domains:**

- Organization lookup
- Owner lookup (polymorphic)
- Ordering within owner

**Visions:**

- Organization, owner, domain, status

**Rhythms:**

- Organization, owner, mission, status, next_occurrence

**Intelligence:**

- Organization, owner, parent (for nested topics)

**Insights:**

- Organization, owner, intelligence, source_type

**Debriefs:**

- Organization, owner, type, period range

---

## Backwards Compatibility

### Legacy Aliases in Schema Files

All new schema files export legacy aliases for gradual migration:

```typescript
// Example: domains.ts
export const pillars = domains;
export type Pillar = Domain;

// Example: visions.ts
export const aspirations = visions;
export type Aspiration = Vision;
```

### Table Naming

- `goals` table → "Mission" in user-facing terminology
- `projects` table → "Operation" in user-facing terminology
- All other tables use new PPV-aligned names directly

---

## Deployment Checklist

### Pre-Deployment

- [ ] Review migration SQL for syntax errors
- [ ] Verify Drizzle schema files match migration
- [ ] Test migration on staging database
- [ ] Backup production database

### Deployment

- [ ] Run migration: `psql -f migrations/0006_ppv_terminology_alignment.sql`
- [ ] Verify tables created: Check verification queries in migration file
- [ ] Test RLS policies: Ensure tenant isolation works
- [ ] Regenerate Drizzle types: `npm run db:generate` (or equivalent)

### Post-Deployment

- [ ] Update API routes to use new terminology
- [ ] Update UI components to use new terminology
- [ ] Update GraphQL schema (if applicable)
- [ ] Update documentation
- [ ] Train team on new terminology

### Verification Queries

Run these manuagent to verify migration success:

```sql
-- Verify all new tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('domains', 'visions', 'rhythms', 'intelligence', 'insights', 'debriefs')
ORDER BY tablename;

-- Verify column additions
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'goals' AND column_name = 'vision_id';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tasks' AND column_name = 'rhythm_id';

-- Verify RLS policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('domains', 'visions', 'rhythms', 'intelligence', 'insights', 'debriefs')
ORDER BY tablename, policyname;
```

---

## Next Steps (Implementation)

### Phase 1: Core CRUD Operations

1. Create API endpoints for new entities (domains, visions, rhythms, etc.)
2. Implement service layer with business logic
3. Add GraphQL mutations/queries (if using GraphQL)

### Phase 2: UI Components

1. Domain management UI
2. Vision board/tracking
3. Rhythm scheduler with streak tracking
4. Intelligence topic browser
5. Insight capture form
6. Debrief templates (daily/weekly/cycle)

### Phase 3: Integration

1. Link existing missions to visions
2. Convert recurring tasks to rhythms
3. Migrate knowledge entries to intelligence/insights structure
4. Build debrief automation (scheduled prompts)

### Phase 4: Advanced Features

1. AI-powered vision-mission alignment suggestions
2. Rhythm completion reminders
3. Intelligence topic auto-categorization
4. Insight relationship mapping
5. Debrief analytics and trends

---

## Reference

- **Authoritative Source:**
  `/Users/alimai/Projects/cohortix/docs/TERMINOLOGY.md`
- **Migration File:**
  `/Users/alimai/Projects/cohortix/migrations/0006_ppv_terminology_alignment.sql`
- **Schema Files:**
  `/Users/alimai/Projects/cohortix/packages/database/src/schema/`

---

**Migration designed by:** AI Sub-Agent (terminology-phase4-db)  
**Approved by:** [Pending Ahmad's review]  
**Applied to production:** [Pending]
