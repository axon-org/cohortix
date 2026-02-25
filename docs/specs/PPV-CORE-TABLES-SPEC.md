# PPV Core Tables — Specification

**Branch:** `fix/create-core-tables` **Date:** 2026-02-25 **Status:** Approved
by Ahmad

---

## Context

Cohortix follows the PPV Pro (Pillars, Pipelines & Vaults) methodology by August
Bradley. The core hierarchy maps as:

```
PPV Term            → Cohortix Term    → DB Table
─────────────────────────────────────────────────
Pillars & Purpose   → Domain           → domains
Life Aspirations    → Vision           → visions
Goals               → Mission          → missions (exists, needs vision_id)
Projects            → Operation        → operations (exists as 'projects')
Routines            → Recurring Task   → tasks (recurrence JSONB field)
Actions             → Task             → tasks (exists)
```

### Ownership Model

| Entity    | Owner         | Notes                                     |
| --------- | ------------- | ----------------------------------------- |
| Domain    | Human only    | Life pillars — set once, rarely changed   |
| Vision    | Human only    | Strategic north stars with timeline view  |
| Mission   | Human + Agent | Goals. Agents can propose, humans approve |
| Operation | Human + Agent | Projects under Missions                   |
| Task      | Human + Agent | Atomic work units, optional recurrence    |

### Key Design Decision

**No `rhythms` table.** Recurring behaviors are modeled as tasks with a
`recurrence` JSONB field. This simplifies the schema while preserving PPV's "two
engines" concept (Projects + Routines achieve Goals).

---

## What Exists Today

### Tables that exist in Supabase (production):

- `organizations`, `users`, `org_memberships`
- `projects` (= Operations), `tasks`, `agents`, `cohorts`, `cohort_members`
- `agent_assignments`, `actions`, `comments`, `audit_logs`
- `clients`, `workspaces`, `knowledge_entries`, `insights`, `time_entries`

### Drizzle schemas that exist but have NO tables in Supabase:

- `domains.ts`, `visions.ts`, `missions.ts` (as goals), `milestones.ts`,
  `rhythms.ts`

### Enums that exist:

- `owner_type` ('human', 'agent') — in goals.ts
- `project_status` ('planning', 'active', 'on_hold', 'completed', 'archived')
- `task_status`, `task_priority` — in tasks.ts

---

## Tasks

### Task 1: SQL Migration — Create Core Tables

**File:** `supabase/migrations/20260225000001_ppv_core_tables.sql`

Create the following tables (idempotent with `IF NOT EXISTS`):

#### 1.1 `domains` table

```sql
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_type owner_type NOT NULL DEFAULT 'human',
  owner_id UUID NOT NULL,
  created_by_type owner_type NOT NULL DEFAULT 'human',
  created_by_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7),            -- Hex color (#FF5733)
  icon VARCHAR(50),            -- Icon identifier
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- RLS policy: org-scoped read/write
- Index on `organization_id`
- Unique constraint: `(organization_id, name)`

#### 1.2 `visions` table

```sql
CREATE TABLE IF NOT EXISTS visions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  owner_type owner_type NOT NULL DEFAULT 'human',
  owner_id UUID NOT NULL,
  created_by_type owner_type NOT NULL DEFAULT 'human',
  created_by_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status vision_status NOT NULL DEFAULT 'active',
  -- Timeline fields for roadmap view
  target_date DATE,
  review_date DATE,            -- Next quarterly review
  -- Progress (rolled up from missions)
  progress INTEGER DEFAULT 0,  -- 0-100, calculated
  -- Visual
  color VARCHAR(7),
  icon VARCHAR(50),
  order_index INTEGER NOT NULL DEFAULT 0,
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- Enum: `vision_status` ('active', 'on_hold', 'achieved', 'archived')
- RLS policy: org-scoped
- Indexes: `organization_id`, `domain_id`, `status`

#### 1.3 `missions` table (rename from `goals`)

The existing `goals.ts` schema defines a `goals` table. We need to create this
as `missions` in the database:

```sql
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vision_id UUID REFERENCES visions(id) ON DELETE SET NULL,
  owner_type owner_type NOT NULL DEFAULT 'human',
  owner_id UUID NOT NULL,
  created_by_type owner_type NOT NULL DEFAULT 'human',
  created_by_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status mission_status NOT NULL DEFAULT 'not_started',
  priority task_priority DEFAULT 'medium',
  -- Timeline
  start_date DATE,
  target_date DATE,
  completed_date DATE,
  -- Progress (rolled up from operations)
  progress INTEGER DEFAULT 0,
  -- Metrics
  success_criteria JSONB DEFAULT '[]'::jsonb,
  key_results JSONB DEFAULT '[]'::jsonb,
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- Enum: `mission_status` ('not_started', 'active', 'on_hold', 'completed',
  'abandoned')
- RLS policy: org-scoped
- Indexes: `organization_id`, `vision_id`, `status`, `owner_id`

#### 1.4 Alter `projects` (Operations) table

Add `mission_id` foreign key to link Operations → Missions:

```sql
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS mission_id UUID REFERENCES missions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_mission_id ON projects(mission_id);
```

#### 1.5 Alter `tasks` table

Add recurrence support and operation link:

```sql
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence JSONB;
  -- recurrence shape: { frequency: 'daily'|'weekly'|'monthly', days?: string[], endDate?: string }
```

#### 1.6 Triggers

Add `updated_at` auto-update triggers for all new tables:

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Apply to: `domains`, `visions`, `missions`.

---

### Task 2: Update Drizzle Schemas

Update the existing schema files to match the migration exactly:

- **`packages/database/src/schema/domains.ts`** — verify matches migration
- **`packages/database/src/schema/visions.ts`** — add timeline fields, verify
  enums
- **Create `packages/database/src/schema/missions.ts`** — new file (separate
  from goals.ts), or update `goals.ts` to be `missions.ts`
- **`packages/database/src/schema/operations.ts`** — add `mission_id` column
- **`packages/database/src/schema/tasks.ts`** — add `is_recurring`, `recurrence`
- **`packages/database/src/schema/index.ts`** — export all new schemas
- **Remove `packages/database/src/schema/rhythms.ts`** — no longer needed
- **Remove `packages/database/src/schema/goals.ts`** — replaced by missions.ts

**Important:** Ensure all Drizzle types match SQL exactly. Use `$inferSelect`
and `$inferInsert` exports for each table.

---

### Task 3: Update Sidebar Navigation

**File:** `apps/web/src/components/dashboard/sidebar.tsx`

Update navigation structure:

```typescript
// Strategy
{ type: 'separator', label: 'Strategy' },
{ name: 'Visions', href: `/${orgSlug}/visions`, icon: Compass },
{ name: 'Missions', href: `/${orgSlug}/missions`, icon: Target },

// Execution
{ type: 'separator', label: 'Execution' },
{ name: 'Operations', href: `/${orgSlug}/operations`, icon: FolderKanban },
{ name: 'My Tasks', href: `/${orgSlug}/my-tasks`, icon: CheckSquare },
{ name: 'Inbox', href: `/${orgSlug}/inbox`, icon: InboxIcon, badge: 'Soon' },

// Team
{ type: 'separator', label: 'Team' },
{ name: 'Cohorts', href: `/${orgSlug}/cohorts`, icon: Users },
{ name: 'Agents', href: `/${orgSlug}/agents`, icon: Bot },
```

Also remove Dashboard from top-level (Mission Control IS the dashboard at `/`).

---

### Task 4: Create Visions Placeholder Page

**File:** `apps/web/src/app/(dashboard)/[orgSlug]/visions/page.tsx`

Create a placeholder page with:

- Page title: "Visions"
- Empty state: "Your north stars. Define what matters most, then align
  everything to it."
- "+ Add Vision" button (disabled/coming soon)
- Basic layout matching existing pages

---

### Task 5: Create Missions Placeholder Page

**File:** `apps/web/src/app/(dashboard)/[orgSlug]/missions/page.tsx`

Verify/update the existing Missions page. If it doesn't exist or references old
`goals` terminology, create/fix it:

- Page title: "Missions"
- Empty state: "Set measurable goals aligned to your Visions."
- "+ Add Mission" button (disabled/coming soon)

---

### Task 6: Cleanup Stale Schemas

Remove files that are no longer needed:

- `packages/database/src/schema/rhythms.ts` — replaced by task recurrence
- `packages/database/src/schema/goals.ts` — replaced by missions.ts
- `packages/database/src/schema/milestones.ts` — can be added later if needed
- Update all imports that reference removed files

---

### Task 7: TypeScript & Lint Validation

After all changes:

```bash
pnpm type-check    # 0 errors
pnpm lint          # 0 errors (run lint:fix if needed)
pnpm build         # succeeds
```

Format all changed files:

```bash
npx prettier --write <all-changed-files>
```

---

## Acceptance Criteria

- [ ] Migration runs successfully (`supabase db push` or migration apply)
- [ ] `domains`, `visions`, `missions` tables created with RLS
- [ ] `projects` table has `mission_id` column
- [ ] `tasks` table has `is_recurring` + `recurrence` columns
- [ ] All Drizzle schemas match SQL exactly
- [ ] `rhythms.ts` and `goals.ts` removed, `missions.ts` created
- [ ] Sidebar shows Strategy/Execution/Team sections
- [ ] Visions page renders (placeholder)
- [ ] 0 TypeScript errors, 0 lint errors, build passes
- [ ] All changes committed with conventional commits
- [ ] Branch pushed to remote

---

## Dependencies

- **Blocks:** Operations redesign, My Tasks page, any mission/vision features
- **Blocked by:** Nothing — this is foundational

---

## References

- PPV Course: NeuroBits `ppv_pro_course`
- Existing schemas: `packages/database/src/schema/`
- Terminology guide: `docs/guides/TERMINOLOGY.md`
- CLAUDE.md (Axon Dev Codex): project root
