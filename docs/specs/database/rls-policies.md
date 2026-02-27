# RLS Policies — Cohort Architecture (CA-S1-08)

**Status:** Implemented in `20260227114400_rls_scoped_access.sql`

This document captures the scoped-access RLS model for Cohortix. All policies
use **Clerk Option A** identity resolution via:

```
profiles.id WHERE profiles.clerk_user_id = get_current_clerk_user_id()
```

Service role bypass is allowed for all tables:

```
auth.role() = 'service_role'
OR (get_current_clerk_user_id() IS NULL AND is_service_role())
```

---

## 1. Cohorts

- **Personal cohorts:** only the owner (`owner_user_id`) can access.
- **Shared cohorts:** only cohort members (via `cohort_user_members`) can access.

Policies:
- `cohorts_select_scoped`
- `cohorts_insert_scoped` (personal: owner only; shared: org members)
- `cohorts_update_scoped`
- `cohorts_delete_scoped`

---

## 2. Cohort Membership Tables

Tables:
- `cohort_user_members`
- `cohort_agent_members`

**Rule:** visible/modifiable to users who are members of the cohort.

Policies:
- `cohort_user_members_scoped`
- `cohort_agent_members_scoped`

---

## 3. Scoped PPV Entities

Tables:
- `visions`
- `projects` (operations)
- `tasks`
- `comments`
- `knowledge_entries`
- `insights`

**Scope enforcement (applies to ALL operations):**

- **Personal:** `scope_type = 'personal'` AND `scope_id = current_user_id`
- **Cohort:** `scope_type = 'cohort'` AND `scope_id IN cohort_user_members`
- **Org:** `scope_type = 'org'` AND `scope_id IN organization_memberships`

Policies:
- `{table}_scoped_access`

---

## 4. Agents

Table: `agents`

**Rule:** agents follow the same scoped access model (`scope_type` + `scope_id`).

Policy:
- `agents_scoped_access`

---

## 5. Task Sessions

Table: `task_sessions`

**Rule:** sessions inherit the scope of their parent task (`scope_type` + `scope_id`).

Policy:
- `task_sessions_scoped_access`

---

## 6. Agent Evolution Events

Table: `agent_evolution_events`

**Rule:** events inherit the agent scope (`scope_type` + `scope_id`).

Policy:
- `agent_evolution_events_scoped_access`

---

## Notes & Assumptions

- Cohort membership is determined only via `cohort_user_members`.
- Org access is determined via `organization_memberships`.
- Personal scope always maps `scope_id` to the current user profile ID.
- **Personal cohort isolation:** org admins are NOT implicitly granted access.
- The API should validate scope_type/scope_id before insert to avoid accidental scope leakage.
