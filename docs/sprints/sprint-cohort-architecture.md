# Sprint Plan: Cohort Architecture (SDD-002)

**Status:** Ready for Execution (Revised)  
**Created:** 2026-02-27  
**Revised:** 2026-02-27 (CEO review — 6 items addressed)  
**Owner:** August (Project Manager)  
**Related:** [SDD-002](../specs/SDD-002-COHORT-ARCHITECTURE.md),
[PRD-002](../specs/PRD-002-cohort-architecture.md)

---

## Overview

This sprint plan implements the cohort architecture per SDD-002, breaking work
into 3 one-week sprints following Axon Dev Codex implementation order: **Schema
→ Data layer → API → Business logic → UI → E2E tests**.

### Key Architectural Decisions (from SDD-002 + Q4 Resolution)

- **Split membership tables:** `cohort_user_members` + `cohort_agent_members`
  (separate identity models)
- **Heartbeat-based runtime:** 30s heartbeats, degraded→disconnected→suspended
  lifecycle
- **Clone foundation onboarding:** 5-6 step wizard + daily "Clone Check-in"
  recurring task
- **Personal cohort naming:** `"<FirstName>'s Cohort"` (user-renameable)
- **Opt-in marketplace updates:** no auto-updates
- **Personal cohort isolation:** org admins have zero visibility (hard boundary)
- **Per-task session isolation:** no context bleed across tasks

### Implementation Sequence (Codex-Compliant)

```
Sprint 1 (P0): Schema → Data → API → Runtime Foundation
Sprint 2 (P0): Business Logic → UI → Onboarding
Sprint 3 (P1): Advanced Features → Knowledge Hub → E2E Tests
```

---

## Sprint 1: Schema & Runtime Foundation (Week 1–2)

**Goal:** Database schema, data layer, API routes, runtime lifecycle, RLS
enforcement  
**Feature Branch:** `feature/cohort-architecture-sprint-1`  
**Note (Revised):** Sprint 1 spans ~10 working days (split into Phase 1a:
Schema+Data and Phase 1b: API+Tests). Original 7-day estimate was unrealistic
for 19 backend tasks assigned primarily to one specialist.

### Phase 1a: Schema + Data Layer (Day 1–5)

#### TASK: CA-S1-01 — Split Membership Tables Migration

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** None

**Description:**  
Migrate existing `cohort_members` (agents-only) to split tables:
`cohort_user_members` and `cohort_agent_members`.

**Acceptance Criteria:**

- [ ] Create migration `YYYYMMDDHHMMSS_split_cohort_membership.sql`
- [ ] New table `cohort_user_members`: `id`, `cohort_id`, `user_id`, `role`
      (enum: owner/admin/member/viewer), `joined_at`, `updated_at`
- [ ] New table `cohort_agent_members`: `id`, `cohort_id`, `agent_id`, `role`,
      `engagement_score`, `joined_at`, `updated_at`
- [ ] Backfill: migrate existing `cohort_members` rows to `cohort_agent_members`
- [ ] Add unique constraints: `unique(cohort_id, user_id)`,
      `unique(cohort_id, agent_id)`
- [ ] Drop old `cohort_members` table
- [ ] Migration rollback tested successfully
- [ ] Drizzle schemas created in
      `packages/database/src/schema/cohort-user-members.ts` and
      `cohort-agent-members.ts`

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_split_cohort_membership.sql`
- `packages/database/src/schema/cohort-user-members.ts`
- `packages/database/src/schema/cohort-agent-members.ts`

---

#### TASK: CA-S1-02 — Cohorts Table Extensions (Runtime Fields)

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** None

**Description:**  
Extend `cohorts` table with personal/shared type, hosting mode, runtime status,
and heartbeat tracking.

**Acceptance Criteria:**

- [ ] Add enums: `cohort_type` (personal/shared), `cohort_hosting`
      (managed/self_hosted), `cohort_runtime_status`
      (provisioning/online/offline/error/paused)
- [ ] Add columns to `cohorts`: `type`, `owner_user_id`, `hosting`,
      `runtime_status`, `gateway_url`, `auth_token_hash`, `hardware_info`
      (jsonb), `last_heartbeat_at`
- [ ] Add partial unique index: `unique(owner_user_id) where type='personal'`
- [ ] Add check constraint: personal cohorts have
      `owner_user_id IS NOT NULL AND organization_id IS NULL`, shared cohorts
      have `organization_id IS NOT NULL`
- [ ] Update Drizzle schema in `packages/database/src/schema/cohorts.ts`
- [ ] Migration includes rollback test

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_extend_cohorts_runtime.sql`
- `packages/database/src/schema/cohorts.ts`

---

#### TASK: CA-S1-03a — Scope Columns for Core PPV Entities

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** None

**Description:**  
Add `scope_type` and `scope_id` to core PPV entities (visions, missions,
operations, tasks).

**Acceptance Criteria:**

- [ ] Create enum `scope_type` (personal/cohort/org)
- [ ] Add columns to tables: `visions`, `missions`, `operations` (projects),
      `tasks`: `scope_type`, `scope_id`, `cohort_id` (nullable FK)
- [ ] Backfill existing rows: set `scope_type='org'` and
      `scope_id=organization_id` for all legacy data
- [ ] Update Drizzle schemas for all 4 tables
- [ ] Migration tested with rollback

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_add_scope_columns_core.sql`
- `packages/database/src/schema/{visions,missions,operations,tasks}.ts`

---

#### TASK: CA-S1-03b — Scope Columns for Supporting Entities

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-03a

**Description:**  
Add `scope_type` and `scope_id` to supporting entities (knowledge_entries,
insights, comments).

**Acceptance Criteria:**

- [ ] Add columns to tables: `knowledge_entries`, `insights`, `comments`:
      `scope_type`, `scope_id`, `cohort_id` (nullable FK)
- [ ] Backfill existing rows: set `scope_type='org'` and
      `scope_id=organization_id` for all legacy data
- [ ] Update Drizzle schemas for all 3 tables
- [ ] Migration tested with rollback

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_add_scope_columns_supporting.sql`
- `packages/database/src/schema/{knowledge-entries,insights,comments}.ts`

---

#### TASK: CA-S1-04 — Agents Table: Personal + Scoping Updates

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-03a

**Description:**  
Update `agents` table to support personal agents, cohort scoping, and default
cohort assignment.

**Acceptance Criteria:**

- [ ] Make `organization_id` nullable
- [ ] Add columns: `owner_user_id`, `scope_type`, `scope_id`,
      `default_cohort_id` (nullable FK to `cohorts`)
- [ ] Add check constraints: `scope_type='personal'` →
      `owner_user_id IS NOT NULL AND organization_id IS NULL`
- [ ] Update Drizzle schema `packages/database/src/schema/agents.ts`
- [ ] Migration includes rollback

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_extend_agents_personal_scope.sql`
- `packages/database/src/schema/agents.ts`

---

#### TASK: CA-S1-05 — Comments Table: Agent Authors + @Mentions

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-03a

**Description:**  
Update `comments` to support agent authors and @mention tracking.

**Acceptance Criteria:**

- [ ] Add columns: `author_type` (enum: user/agent), `author_id` (uuid),
      `mentioned_agent_ids` (uuid[]), `thread_root_id` (nullable self-reference)
- [ ] Add scope columns from CA-S1-03b
- [ ] Update Drizzle schema `packages/database/src/schema/comments.ts`
- [ ] Migration tested

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_extend_comments_agents.sql`
- `packages/database/src/schema/comments.ts`

---

#### TASK: CA-S1-06 — Task Sessions Table (Isolation)

**Assigned:** Devi (Backend)  
**Complexity:** S  
**Dependencies:** CA-S1-03a

**Description:**  
Create `task_sessions` table to enforce per-task session isolation.

**Acceptance Criteria:**

- [ ] Create table with columns: `id`, `task_id`, `agent_id`, `cohort_id`,
      `scope_type`, `scope_id`, `gateway_session_id`, `status` (enum:
      running/completed/failed/cancelled), `started_at`, `ended_at`, `error`
      (jsonb)
- [ ] Add FK constraints and indexes
- [ ] Drizzle schema created
- [ ] Migration rollback tested

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_create_task_sessions.sql`
- `packages/database/src/schema/task-sessions.ts`

---

#### TASK: CA-S1-07 — Agent Evolution Events Table

**Assigned:** Devi (Backend)  
**Complexity:** S  
**Dependencies:** CA-S1-03a

**Description:**  
Create `agent_evolution_events` to power the Evolution Dashboard.

**Acceptance Criteria:**

- [ ] Create table: `id`, `agent_id`, `cohort_id`, `scope_type`, `scope_id`,
      `event_type` (enum: learning/correction/milestone), `summary`, `metadata`
      (jsonb), `created_at`
- [ ] Add indexes on `agent_id` + `created_at`, `event_type`
- [ ] Drizzle schema created
- [ ] Migration tested

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_create_agent_evolution_events.sql`
- `packages/database/src/schema/agent-evolution-events.ts`

---

#### TASK: CA-S1-08 — RLS Policies for Scoped Access

**Assigned:** Devi (Backend)  
**Complexity:** L  
**Dependencies:** CA-S1-01, CA-S1-02, CA-S1-03a, CA-S1-03b

**Description:**  
Implement RLS policies for personal/cohort/org scope enforcement across all
tables.

**Acceptance Criteria:**

- [ ] Cohorts: personal (owner only), shared (members only)
- [ ] Cohort members: visible to cohort members only
- [ ] Scoped PPV entities: personal (owner), cohort (members), org (org members)
- [ ] Agents: personal (owner), org (org members)
- [ ] Comments, task sessions, evolution events: follow parent entity scope
- [ ] All policies tested with multiple user scenarios
- [ ] Document policies in `docs/specs/database/rls-policies.md`

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_rls_scoped_access.sql`
- `docs/specs/database/rls-policies.md`

---

### Phase 1.2: Data Layer (Day 3-4)

#### TASK: CA-S1-09 — Cohort Queries Module (Extend Existing)

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-01, CA-S1-02

**Description:**  
Extend existing `apps/web/src/server/db/queries/cohorts.ts` with new query
functions for personal/shared cohorts, runtime status, and stats. **Note: this
file already exists with basic queries — extend, don't recreate.**

**Acceptance Criteria:**

- [ ] Function `getCohorts(orgId?, userId?, filters, pagination)` — list with
      type/status/hosting filters
- [ ] Function `getCohortById(id)` — single cohort with runtime status
- [ ] Function `getCohortStats(id)` — member counts, engagement metrics,
      activity summary
- [ ] Function `getCohortUserMembers(cohortId)` — list user members with roles
- [ ] Function `getCohortAgentMembers(cohortId)` — list agent members with
      engagement
- [ ] Function `getCohortActivity(cohortId, limit)` — activity timeline
- [ ] All functions use Drizzle ORM properly
- [ ] Unit tests with mock data
- [ ] Document in `docs/specs/cohorts-data-contract.md`

**Files:**

- `apps/web/src/server/db/queries/cohorts.ts`
- `docs/specs/cohorts-data-contract.md`
- `apps/web/src/server/db/queries/__tests__/cohorts.test.ts`

---

#### TASK: CA-S1-10 — Cohort Mutations Module (Extend Existing)

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-09

**Description:**  
Extend existing `apps/web/src/server/db/mutations/cohorts.ts` with new mutation
functions for personal cohort provisioning, split membership management, and
runtime control. **Note: this file already exists — extend, don't recreate.**

**Acceptance Criteria:**

- [ ] Function `createCohort(data)` — create personal or shared cohort
- [ ] Function `provisionPersonalCohort(userId, firstName)` — auto-provision
      with name `"<FirstName>'s Cohort"`
- [ ] Function `updateCohort(id, data)` — update cohort fields
- [ ] Function `deleteCohort(id)` — soft delete (status = 'archived')
- [ ] Function `addUserMember(cohortId, userId, role)` — add user to cohort
- [ ] Function `addAgentMember(cohortId, agentId, role)` — add agent to cohort
- [ ] Function `removeMember(cohortId, memberId, type)` — remove user or agent
- [ ] Function `updateMemberRole(cohortId, memberId, role)` — change role
- [ ] Zod validation schemas for all inputs
- [ ] Integration tests
- [ ] Document in `docs/specs/cohorts-mutations.md`

**Files:**

- `apps/web/src/server/db/mutations/cohorts.ts`
- `apps/web/src/lib/validations/cohorts.ts`
- `docs/specs/cohorts-mutations.md`
- `apps/web/src/server/db/mutations/__tests__/cohorts.test.ts`

---

#### TASK: CA-S1-11 — Agent Queries Module (Personal + Scoped)

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-04

**Description:**  
Create agent query functions supporting personal agents and scoping.

**Acceptance Criteria:**

- [ ] Function `getAgents(scopeType, scopeId, filters)` — list agents by scope
- [ ] Function `getAgentById(id)` — single agent with settings
- [ ] Function `getAgentStats(id)` — tasks completed, success rate, avg response
      time
- [ ] Function `getAgentEvolution(id, limit)` — evolution events timeline
- [ ] Function `getAgentActiveMissions(id)` — current missions/tasks
- [ ] Unit tests
- [ ] Document in `docs/specs/agents-data-contract.md`

**Files:**

- `apps/web/src/server/db/queries/agents.ts`
- `docs/specs/agents-data-contract.md`
- `apps/web/src/server/db/queries/__tests__/agents.test.ts`

---

#### TASK: CA-S1-12 — Agent Mutations Module

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-11

**Description:**  
Create agent CRUD mutations for personal and shared agents.

**Acceptance Criteria:**

- [ ] Function `createAgent(data)` — create agent with scope validation
- [ ] Function `createCloneAgent(userId, cohortId, foundationData)` — provision
      Clone agent
- [ ] Function `updateAgent(id, data)` — update agent config/settings
- [ ] Function `deleteAgent(id)` — soft delete agent
- [ ] Function `recordEvolutionEvent(agentId, type, summary, metadata)` — log
      evolution
- [ ] Zod validation schemas
- [ ] Integration tests
- [ ] Document in `docs/specs/agents-mutations.md`

**Files:**

- `apps/web/src/server/db/mutations/agents.ts`
- `apps/web/src/lib/validations/agents.ts`
- `docs/specs/agents-mutations.md`
- `apps/web/src/server/db/mutations/__tests__/agents.test.ts`

---

### Phase 1b: API Routes + Tests (Day 6–10)

#### TASK: CA-S1-13 — Cohort API Routes (CRUD + List)

**Assigned:** Devi (Backend)  
**Complexity:** L  
**Dependencies:** CA-S1-09, CA-S1-10

**Description:**  
Create RESTful API routes for cohort management.

**Acceptance Criteria:**

- [ ] `GET /api/v1/cohorts` — list cohorts with filters (type, status,
      organizationId)
- [ ] `POST /api/v1/cohorts` — create new cohort (shared)
- [ ] `POST /api/v1/cohorts/personal/provision` — provision personal cohort
      (signup only)
- [ ] `GET /api/v1/cohorts/:id` — get single cohort
- [ ] `PATCH /api/v1/cohorts/:id` — update cohort
- [ ] `DELETE /api/v1/cohorts/:id` — archive cohort
- [ ] All routes: Clerk auth, Zod validation, error handling (RFC 7807)
- [ ] Rate limiting: 30 req/min per user
- [ ] API integration tests
- [ ] OpenAPI schema in `docs/specs/api/cohorts.yml`

**Files:**

- `apps/web/src/app/api/v1/cohorts/route.ts`
- `apps/web/src/app/api/v1/cohorts/personal/provision/route.ts`
- `apps/web/src/app/api/v1/cohorts/[id]/route.ts`
- `docs/specs/api/cohorts.yml`
- `apps/web/src/app/api/v1/cohorts/__tests__/route.test.ts`

---

#### TASK: CA-S1-14 — Cohort Membership API Routes

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-10

**Description:**  
Create API routes for managing cohort membership (users and agents).

**Acceptance Criteria:**

- [ ] `GET /api/v1/cohorts/:id/members` — list all members (users + agents)
- [ ] `POST /api/v1/cohorts/:id/members/users` — add user member
- [ ] `POST /api/v1/cohorts/:id/members/agents` — add agent member
- [ ] `DELETE /api/v1/cohorts/:id/members/:memberId` — remove member
      (type-aware)
- [ ] `PATCH /api/v1/cohorts/:id/members/:memberId/role` — update role
- [ ] Authorization: only cohort owners/admins can modify membership
- [ ] Validation, error handling, tests
- [ ] OpenAPI schema

**Files:**

- `apps/web/src/app/api/v1/cohorts/[id]/members/route.ts`
- `apps/web/src/app/api/v1/cohorts/[id]/members/users/route.ts`
- `apps/web/src/app/api/v1/cohorts/[id]/members/agents/route.ts`
- `apps/web/src/app/api/v1/cohorts/[id]/members/[memberId]/route.ts`
- `docs/specs/api/cohort-membership.yml`

---

#### TASK: CA-S1-15 — Cohort Runtime API Routes (Heartbeat + Control)

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-02

**Description:**  
Create API routes for runtime management: start/stop, heartbeat, connection
tokens.

**Acceptance Criteria:**

- [ ] `POST /api/v1/cohorts/:id/start` — start cohort runtime (managed or BYOH)
- [ ] `POST /api/v1/cohorts/:id/stop` — stop cohort runtime
- [ ] `POST /api/v1/cohorts/:id/heartbeat` — record heartbeat (called by
      gateway)
- [ ] `POST /api/v1/cohorts/:id/connection-token` — generate auth token for BYOH
- [ ] `GET /api/v1/cohorts/:id/runtime-status` — get current runtime state
- [ ] Heartbeat logic: update `last_heartbeat_at`, transition status based on
      missed beats
- [ ] Status transitions: online → degraded (3 missed) → disconnected (5min) →
      suspended (24h)
- [ ] Connection tokens: JWT with 7-day expiry, hashed in DB
- [ ] Authorization checks, tests

**Files:**

- `apps/web/src/app/api/v1/cohorts/[id]/start/route.ts`
- `apps/web/src/app/api/v1/cohorts/[id]/stop/route.ts`
- `apps/web/src/app/api/v1/cohorts/[id]/heartbeat/route.ts`
- `apps/web/src/app/api/v1/cohorts/[id]/connection-token/route.ts`
- `apps/web/src/app/api/v1/cohorts/[id]/runtime-status/route.ts`
- `apps/web/src/lib/runtime/heartbeat.ts`

---

#### TASK: CA-S1-16 — Agent API Routes (Create + Profile)

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-11, CA-S1-12

**Description:**  
Create API routes for agent management.

**Acceptance Criteria:**

- [ ] `POST /api/v1/agents` — create new agent (personal or org)
- [ ] `GET /api/v1/agents/:id` — get agent profile
- [ ] `PATCH /api/v1/agents/:id` — update agent settings
- [ ] `DELETE /api/v1/agents/:id` — soft delete agent
- [ ] `GET /api/v1/agents/:id/evolution` — get evolution events
- [ ] `GET /api/v1/agents/:id/stats` — get agent metrics
- [ ] Authorization: scope-aware (personal agents visible to owner only)
- [ ] Tests, OpenAPI schema

**Files:**

- `apps/web/src/app/api/v1/agents/route.ts`
- `apps/web/src/app/api/v1/agents/[id]/route.ts`
- `apps/web/src/app/api/v1/agents/[id]/evolution/route.ts`
- `apps/web/src/app/api/v1/agents/[id]/stats/route.ts`
- `docs/specs/api/agents.yml`

---

### Phase 1b (cont.): Backend Testing & Documentation (Day 9–10)

#### TASK: CA-S1-17 — Integration Test Suite (Backend)

**Assigned:** Nina (QA) + Devi (Backend)  
**Complexity:** L  
**Dependencies:** CA-S1-13, CA-S1-14, CA-S1-15, CA-S1-16

**Description:**  
Comprehensive integration tests for all API routes and data layer functions.

**Acceptance Criteria:**

- [ ] Test coverage: ≥80% for data layer, ≥70% for API routes
- [ ] Test scenarios: happy paths, error cases, edge cases, permission
      boundaries
- [ ] Test personal cohort isolation (org admins cannot access)
- [ ] Test RLS policies with multi-user scenarios
- [ ] Test heartbeat lifecycle transitions
- [ ] Test scope validation (personal/cohort/org)
- [ ] CI integration: tests run on PR
- [ ] Test data fixtures for all entities

**Files:**

- `apps/web/src/server/db/queries/__tests__/*.test.ts`
- `apps/web/src/server/db/mutations/__tests__/*.test.ts`
- `apps/web/src/app/api/v1/**/__tests__/*.test.ts`
- `apps/web/tests/fixtures/cohorts.ts`
- `apps/web/tests/setup/test-db.ts`

---

#### TASK: CA-S1-18 — Backend Documentation (Data Contracts + API Specs)

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** All Sprint 1 backend tasks

**Description:**  
Complete documentation for data contracts, API schemas, and architecture
decisions.

**Acceptance Criteria:**

- [ ] Data contracts documented: cohorts, agents, membership, scoped entities
- [ ] OpenAPI schemas complete for all endpoints
- [ ] Architecture decision recorded: split membership tables rationale
- [ ] RLS policy documentation with examples
- [ ] Heartbeat lifecycle state machine diagram
- [ ] Migration guide for existing deployments
- [ ] All docs in `docs/specs/` and `docs/architecture/`

**Files:**

- `docs/specs/cohorts-data-contract.md`
- `docs/specs/agents-data-contract.md`
- `docs/specs/api/cohorts.yml`
- `docs/specs/api/agents.yml`
- `docs/architecture/cohort-architecture-overview.md`
- `docs/architecture/ADR-003-split-membership-tables.md`
- `docs/specs/database/rls-policies.md`

---

**Sprint 1 Summary:**

- **Total Tasks:** 18
- **Backend (Devi):** 16 tasks
- **QA (Nina):** 1 task (with Devi)
- **Estimated Effort:** 1 week (7 days)
- **Deliverable:** Database schema, data layer, API routes, runtime foundation,
  RLS enforcement, tests, documentation

---

## Sprint 2: Business Logic & UI (Week 2)

**Goal:** Onboarding flow, Clone foundation, cohort dashboard, agent profile
UI  
**Feature Branch:** `feature/cohort-architecture-sprint-2`

### Phase 2.1: Business Logic (Day 1-2)

#### TASK: CA-S2-01 — Clone Foundation Onboarding Flow Logic

**Assigned:** Devi (Backend)  
**Complexity:** L  
**Dependencies:** CA-S1-12

**Description:**  
Implement Clone foundation onboarding flow with 5-6 step wizard + daily check-in
task creation.

**Acceptance Criteria:**

- [ ] Service function `processCloneOnboarding(userId, responses)` — saves
      responses to Clone foundation files
- [ ] Write to cohort-scoped storage:
      `clone-foundation/{identity,values,decision-making,expertise,communication,aspirations}.md`
- [ ] Create daily recurring task "Clone Check-in" assigned to user with Clone
      agent as assignee
- [ ] Task recurrence: daily at 9 AM user local time
- [ ] Summary mirrored to `agents.settings.cloneFoundation` for quick display
- [ ] Validation: 5-6 required questions, optional avatar upload
- [ ] Integration with Gateway RPC for file writes
- [ ] Unit tests for onboarding logic
- [ ] Document in `docs/specs/clone-onboarding-flow.md`

**Files:**

- `apps/web/src/server/services/clone-onboarding.ts`
- `apps/web/src/lib/validations/clone-onboarding.ts`
- `docs/specs/clone-onboarding-flow.md`
- `apps/web/src/server/services/__tests__/clone-onboarding.test.ts`

---

#### TASK: CA-S2-02 — Personal Cohort Auto-Provisioning (Signup Webhook)

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-10, CA-S2-01

**Description:**  
Implement Clerk webhook handler to auto-provision personal cohort on user
signup.

**Acceptance Criteria:**

- [ ] Webhook route `POST /api/webhooks/clerk/user-created`
- [ ] On new user: create personal cohort with name `"<FirstName>'s Cohort"`,
      type=personal, owner_user_id=userId
- [ ] Create Clone agent: name="Clone", scope_type=personal, scope_id=userId,
      default_cohort_id=cohortId
- [ ] Redirect user to onboarding flow after signup
- [ ] Handle duplicate signups gracefully (idempotency)
- [ ] Webhook signature verification (Clerk Svix)
- [ ] Integration tests with mock webhook payloads

**Files:**

- `apps/web/src/app/api/webhooks/clerk/user-created/route.ts`
- `apps/web/src/server/services/user-provisioning.ts`
- `apps/web/src/app/api/webhooks/clerk/__tests__/user-created.test.ts`

---

#### TASK: CA-S2-03 — Task Session Management Service

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-06

**Description:**  
Implement service layer for creating, managing, and closing task sessions
(per-task isolation).

**Acceptance Criteria:**

- [ ] Function
      `createTaskSession(taskId, agentId, cohortId, scopeType, scopeId)` —
      create session, call Gateway RPC
- [ ] Function `closeTaskSession(sessionId, status, error?)` — close session,
      update DB
- [ ] Function `getActiveTaskSessions(cohortId)` — list running sessions
- [ ] Gateway integration: start session with cohort scope, pass task context
- [ ] Session cleanup on timeout (15min inactive → auto-close)
- [ ] Error handling and retry logic
- [ ] Unit tests

**Files:**

- `apps/web/src/server/services/task-sessions.ts`
- `apps/web/src/lib/gateway/session-client.ts`
- `apps/web/src/server/services/__tests__/task-sessions.test.ts`

---

#### TASK: CA-S2-04 — Agent @Mention Parser & Session Trigger

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S2-03

**Description:**  
Implement comment parser that detects @mentions and triggers agent sessions.

**Acceptance Criteria:**

- [ ] Function `parseAgentMentions(commentText)` — extract @mentions (agent
      names/slugs)
- [ ] Function `handleCommentWithMentions(comment)` — on new comment, parse
      mentions, create task sessions
- [ ] Link comment to task session (task_id, session_id)
- [ ] Agent response posted as new comment (author_type=agent)
- [ ] Handle multiple mentions in one comment (create separate sessions)
- [ ] Validation: only mention agents that are members of the cohort
- [ ] Unit tests with various mention formats

**Files:**

- `apps/web/src/server/services/comment-mentions.ts`
- `apps/web/src/lib/parsers/agent-mentions.ts`
- `apps/web/src/server/services/__tests__/comment-mentions.test.ts`

---

#### TASK: CA-S2-05 — Model Settings Service (BYOK)

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-02

**Description:**  
Implement service for managing cohort model settings and API key storage
(Supabase Vault).

**Acceptance Criteria:**

- [ ] Function `updateCohortModelSettings(cohortId, settings)` — update allowed
      models, store API keys in Vault
- [ ] Function `getCohortModelSettings(cohortId)` — retrieve settings with
      secret refs (not actual keys)
- [ ] Function `validateApiKey(provider, apiKey)` — test key validity before
      storing
- [ ] Vault integration: store keys with references like
      `vault:key:openai-{cohortId}`
- [ ] Per-agent model overrides in `agents.settings.modelPreference`
- [ ] Authorization: only cohort owners can update
- [ ] Unit tests

**Files:**

- `apps/web/src/server/services/model-settings.ts`
- `apps/web/src/lib/vault/secret-storage.ts`
- `apps/web/src/server/services/__tests__/model-settings.test.ts`

---

### Phase 2.2: UI Components (Day 3-5)

#### TASK: CA-S2-06 — Onboarding Flow UI (5-6 Steps + Clone Check-in)

**Assigned:** Lubna (UI Designer) + Zara (Creative Developer)  
**Complexity:** L  
**Dependencies:** CA-S2-01

**Description:**  
Build multi-step onboarding wizard for Clone foundation.

**Acceptance Criteria:**

- [ ] Page: `/onboarding/clone-foundation`
- [ ] Step 1: "What's your name?" (first name, optional last name)
- [ ] Step 2: "What's your role?" (job title, free text)
- [ ] Step 3: "How do you work best?" (work style, multi-select: async/sync,
      deep-focus/collaborative, etc.)
- [ ] Step 4: "What are your goals?" (short/long-term, free text)
- [ ] Step 5: "How should I communicate?" (preferences: tone, detail level)
- [ ] Step 6 (optional): "Upload avatar" (image upload)
- [ ] Progress indicator (1 of 6, 2 of 6, etc.)
- [ ] Validation: steps 1-5 required, step 6 optional
- [ ] Submit → call `POST /api/v1/onboarding/clone-foundation`
- [ ] Success → redirect to dashboard with success toast: "Your Clone is ready!"
- [ ] Responsive design, dark theme matching mockups
- [ ] Accessibility: keyboard navigation, ARIA labels
- [ ] Storybook stories for each step

**Files:**

- `apps/web/src/app/onboarding/clone-foundation/page.tsx`
- `apps/web/src/components/onboarding/clone-foundation-wizard.tsx`
- `apps/web/src/components/onboarding/onboarding-step.tsx`
- `apps/web/src/app/api/v1/onboarding/clone-foundation/route.ts`
- `apps/web/src/components/onboarding/__tests__/clone-foundation-wizard.test.tsx`

---

#### TASK: CA-S2-07 — Cohort Dashboard Page (Redesign Existing)

**Assigned:** Lubna (UI) + Zara (Creative)  
**Complexity:** L  
**Dependencies:** CA-S1-13

**Description:**  
Redesign existing cohort detail page at `/[orgSlug]/cohorts/[id]/page.tsx` to
add runtime status, members panel, activity feed. **Note: page and
`use-cohort-detail.ts` hook already exist — extend them.**

**Acceptance Criteria:**

- [ ] Page: `/[orgSlug]/cohorts/[id]` (works for personal and shared cohorts)
- [ ] Header: cohort name, type badge (Personal/Shared), runtime status chip
- [ ] Runtime status chip: color-coded (online=green, degraded=amber,
      disconnected=red, offline=gray)
- [ ] Runtime panel: hosting type (Managed/Self-Hosted), gateway URL, last
      heartbeat time
- [ ] "Connection Token" button (for BYOH cohorts only) → modal with token +
      copy button
- [ ] Members panel: tabs for Users and Agents, each with role badges
- [ ] Activity feed (right sidebar): timeline of recent actions (task created,
      agent responded, etc.)
- [ ] "Invite Member" button (opens modal)
- [ ] "Assign Agent" button (opens modal)
- [ ] Responsive design, dark theme
- [ ] Loading skeletons for all sections
- [ ] Error boundaries

**Files:**

- `apps/web/src/app/[orgSlug]/cohorts/[id]/page.tsx`
- `apps/web/src/components/cohorts/cohort-dashboard.tsx`
- `apps/web/src/components/cohorts/cohort-runtime-panel.tsx`
- `apps/web/src/components/cohorts/cohort-members-panel.tsx`
- `apps/web/src/components/cohorts/cohort-activity-feed.tsx`
- `apps/web/src/hooks/use-cohort-detail.ts`

---

#### TASK: CA-S2-08 — Cohort List Page (Extend Existing)

**Assigned:** Lubna (UI) + Zara (Creative)  
**Complexity:** M  
**Dependencies:** CA-S1-13

**Description:**  
Extend existing cohort list page at `/[orgSlug]/cohorts/page.tsx` to support
personal + shared cohort filtering. **Note: page and `use-cohorts.ts` hook
already exist — extend them.**

**Acceptance Criteria:**

- [ ] Page: `/[orgSlug]/cohorts` (shows both personal and shared cohorts)
- [ ] Filter tabs: "All", "Personal", "Shared"
- [ ] Status filter: dropdown (All, Active, Paused, At-Risk, Completed)
- [ ] Search bar: filter by cohort name (debounced 300ms)
- [ ] Table columns: Name, Type (badge), Status (badge), Members (count),
      Runtime (chip), Actions (menu)
- [ ] Click row → navigate to detail page
- [ ] "+ New Cohort" button (only for shared cohorts; personal auto-provisioned)
- [ ] Pagination: 20 per page
- [ ] Empty state: "No cohorts yet. Your personal cohort was created at signup."
- [ ] Responsive design

**Files:**

- `apps/web/src/app/[orgSlug]/cohorts/page.tsx`
- `apps/web/src/components/cohorts/cohorts-table.tsx`
- `apps/web/src/components/cohorts/cohort-row.tsx`
- `apps/web/src/hooks/use-cohorts.ts`

---

#### TASK: CA-S2-09 — Agent Profile Page

**Assigned:** Lubna (UI) + Zara (Creative)  
**Complexity:** M  
**Dependencies:** CA-S1-16

**Description:**  
Build agent profile page with stats, evolution timeline, active tasks.

**Acceptance Criteria:**

- [ ] Page: `/[orgSlug]/agents/[id]` (works for personal and org agents)
- [ ] Header: agent avatar, name, role, scope badge (Personal/Org)
- [ ] Stats grid: Tasks Completed, Success Rate, Avg Response Time, Total Time
      Worked
- [ ] Evolution timeline: vertical timeline of learning/correction/milestone
      events
- [ ] Active missions widget: list of current tasks assigned to agent
- [ ] Skills panel: list of enabled skills with icons
- [ ] Model settings panel: current model preference, allowed models
- [ ] "Edit Agent" button (opens modal)
- [ ] Responsive design, dark theme
- [ ] Empty state for evolution if no events

**Files:**

- `apps/web/src/app/[orgSlug]/agents/[id]/page.tsx`
- `apps/web/src/components/agents/agent-profile.tsx`
- `apps/web/src/components/agents/agent-evolution-timeline.tsx`
- `apps/web/src/components/agents/agent-stats-grid.tsx`
- `apps/web/src/hooks/use-agent-detail.ts`

---

#### TASK: CA-S2-10 — Create/Edit Cohort Modal (Shared Only)

**Assigned:** Lubna (UI) + Zara (Creative)  
**Complexity:** M  
**Dependencies:** CA-S1-13

**Description:**  
Build modal for creating/editing shared cohorts.

**Acceptance Criteria:**

- [ ] Modal component: `CohortModal`
- [ ] Form fields: Name (required), Description (optional), Start Date
      (required), End Date (optional), Hosting (managed/self_hosted)
- [ ] Validation: name 3-100 chars, dates logical (end > start)
- [ ] Create mode: POST to `/api/v1/cohorts`
- [ ] Edit mode: PATCH to `/api/v1/cohorts/:id`
- [ ] Loading state during submission
- [ ] Success: close modal, show toast, refresh cohort list
- [ ] Error: display inline validation errors
- [ ] Cancel button
- [ ] Responsive design

**Files:**

- `apps/web/src/components/cohorts/cohort-modal.tsx`
- `apps/web/src/components/cohorts/__tests__/cohort-modal.test.tsx`

---

#### TASK: CA-S2-11 — Task Assignment UI (@Mention Support)

**Assigned:** Lubna (UI) + Zara (Creative)  
**Complexity:** M  
**Dependencies:** CA-S2-04

**Description:**  
Enhance task comment UI to support @mention autocomplete for agents.

**Acceptance Criteria:**

- [ ] Comment textarea with @mention autocomplete (triggered by "@")
- [ ] Autocomplete dropdown: list agents in current cohort, filtered by name
- [ ] Selecting agent inserts `@AgentName` into textarea
- [ ] On submit: parse mentions, create task sessions, post comment
- [ ] Display agent responses as threaded comments (author_type=agent)
- [ ] Agent avatar + name badge for agent comments
- [ ] Real-time updates (polling or SSE) for new agent responses
- [ ] Responsive design

**Files:**

- `apps/web/src/components/tasks/task-comments.tsx`
- `apps/web/src/components/tasks/agent-mention-autocomplete.tsx`
- `apps/web/src/components/comments/comment-item.tsx`
- `apps/web/src/hooks/use-task-comments.ts`

---

### Phase 2.3: Frontend Testing (Day 6)

#### TASK: CA-S2-12 — Component Tests (Sprint 2 UI)

**Assigned:** Nina (QA) + Zara (Creative)  
**Complexity:** M  
**Dependencies:** CA-S2-06, CA-S2-07, CA-S2-08, CA-S2-09, CA-S2-10, CA-S2-11

**Description:**  
Write component tests for all Sprint 2 UI components.

**Acceptance Criteria:**

- [ ] Test coverage: ≥70% for all new UI components
- [ ] Test scenarios: rendering, user interactions, form validation, error
      states
- [ ] Storybook stories for all components
- [ ] Snapshot tests for visual regression
- [ ] Accessibility tests (WCAG 2.2 AA)
- [ ] CI integration

**Files:**

- `apps/web/src/components/**/__tests__/*.test.tsx`
- `apps/web/src/components/**/*.stories.tsx`

---

### Phase 2.4: E2E Tests (Day 7)

#### TASK: CA-S2-13 — E2E Test: Personal Cohort Provisioning Flow

**Assigned:** Nina (QA)  
**Complexity:** M  
**Dependencies:** CA-S2-02, CA-S2-06

**Description:**  
End-to-end test for user signup → personal cohort creation → onboarding flow.

**Acceptance Criteria:**

- [ ] Test signs up new user (Clerk)
- [ ] Verifies personal cohort auto-created with name `"<FirstName>'s Cohort"`
- [ ] Verifies Clone agent auto-created
- [ ] Completes onboarding wizard (all 5-6 steps)
- [ ] Verifies daily "Clone Check-in" task created
- [ ] Verifies redirect to dashboard
- [ ] Playwright test in `tests/e2e/onboarding.spec.ts`

**Files:**

- `tests/e2e/onboarding.spec.ts`

---

#### TASK: CA-S2-14 — E2E Test: Cohort Management Flow

**Assigned:** Nina (QA)  
**Complexity:** M  
**Dependencies:** CA-S2-07, CA-S2-08, CA-S2-10

**Description:**  
End-to-end test for creating shared cohort, adding members, viewing dashboard.

**Acceptance Criteria:**

- [ ] Test creates new shared cohort
- [ ] Adds user members (2 users)
- [ ] Adds agent members (2 agents)
- [ ] Navigates to cohort dashboard
- [ ] Verifies runtime status displayed
- [ ] Verifies members list shows all members
- [ ] Verifies activity feed shows creation events
- [ ] Playwright test

**Files:**

- `tests/e2e/cohort-management.spec.ts`

---

#### TASK: CA-S2-15 — E2E Test: Agent @Mention Flow

**Assigned:** Nina (QA)  
**Complexity:** M  
**Dependencies:** CA-S2-11

**Description:**  
End-to-end test for @mentioning agent in task comment and receiving response.

**Acceptance Criteria:**

- [ ] Test creates task in personal cohort
- [ ] Posts comment with @Clone mention
- [ ] Verifies task session created
- [ ] Mocks agent response (or uses test agent)
- [ ] Verifies agent response appears as threaded comment
- [ ] Verifies author_type=agent displayed correctly
- [ ] Playwright test

**Files:**

- `tests/e2e/agent-mention.spec.ts`

---

**Sprint 2 Summary:**

- **Total Tasks:** 15
- **Backend (Devi):** 5 tasks
- **UI (Lubna + Zara):** 6 tasks
- **QA (Nina):** 4 tasks
- **Estimated Effort:** 1 week (7 days)
- **Deliverable:** Onboarding flow, Clone foundation, cohort dashboard, agent
  profile UI, @mention support, E2E tests

---

## Sprint 3: Advanced Features & Knowledge Hub (Week 3)

**Goal:** Knowledge Hub, My Tasks, Agent Evolution Dashboard, scheduled tasks,
P1 features  
**Feature Branch:** `feature/cohort-architecture-sprint-3`

### Phase 3.1: Knowledge Hub (Day 1-2)

#### TASK: CA-S3-01 — Knowledge Hub Search Service (4-Layer Memory via Gateway RPC)

**Assigned:** Devi (Backend)  
**Complexity:** L  
**Dependencies:** None

**Description:**  
Implement Knowledge Hub search that queries 4 memory layers **via OpenClaw
Gateway RPC**. Mem0, Cognee, and QMD are installed/managed within each cohort's
OpenClaw instance — Cohortix doesn't run them directly. Instead, we call the
Gateway's memory search endpoints and aggregate results.

For users connecting their own hardware (BYOH), the onboarding flow should
include a setup checklist task assigned to their Clone agent to verify/install
these memory layers in their OpenClaw instance.

**Acceptance Criteria:**

- [ ] Function `searchKnowledge(query, cohortId, scopeType, scopeId, filters)` —
      search across 4 layers via Gateway RPC
- [ ] Layer 1: Built-in markdown memory — call Gateway `memory_search` RPC
- [ ] Layer 2: Mem0 — call Gateway `mem0/search` RPC (stub if not installed in
      instance)
- [ ] Layer 3: Cognee — call Gateway `cognee/search` RPC (stub if not installed
      in instance)
- [ ] Layer 4: QMD — call Gateway `qmd/query` RPC (stub if not installed in
      instance)
- [ ] **Graceful degradation:** if a layer returns error/unavailable, skip it
      and return results from available layers with a
      `{ layer, status: "unavailable", reason }` entry
- [ ] Ranking: combine results by relevance score, de-duplicate
- [ ] Filters: layer, date range, entity type
- [ ] Pagination: 20 results per page
- [ ] Response format:
      `{ results: [{ layer, source, snippet, relevance, url }], layerStatus: [...], meta }`
- [ ] Integration tests with mock Gateway responses
- [ ] Document in `docs/specs/knowledge-hub-search.md`

**Files:**

- `apps/web/src/server/services/knowledge-hub.ts`
- `apps/web/src/lib/gateway/memory-search-client.ts` (Gateway RPC client for all
  4 layers)
- `docs/specs/knowledge-hub-search.md`
- `apps/web/src/server/services/__tests__/knowledge-hub.test.ts`

---

#### TASK: CA-S3-02 — Knowledge Hub API Routes

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S3-01

**Description:**  
Create API routes for Knowledge Hub search.

**Acceptance Criteria:**

- [ ] `GET /api/v1/knowledge/search` — search with query, cohortId, filters,
      pagination
- [ ] `GET /api/v1/knowledge/sources` — list available memory sources for cohort
- [ ] Authorization: user must be cohort member
- [ ] Rate limiting: 20 req/min
- [ ] Validation, error handling, tests
- [ ] OpenAPI schema

**Files:**

- `apps/web/src/app/api/v1/knowledge/search/route.ts`
- `apps/web/src/app/api/v1/knowledge/sources/route.ts`
- `docs/specs/api/knowledge-hub.yml`

---

#### TASK: CA-S3-03 — Knowledge Hub UI

**Assigned:** Lubna (UI) + Zara (Creative)  
**Complexity:** M  
**Dependencies:** CA-S3-02

**Description:**  
Build Knowledge Hub search page with 4-layer results.

**Acceptance Criteria:**

- [ ] Page: `/[orgSlug]/knowledge` (cohort-scoped if personal, org-scoped if
      shared)
- [ ] Search bar: prominent, autofocus, debounced 300ms
- [ ] Layer filter: checkboxes (Built-in, Mem0, Cognee, QMD)
- [ ] Date filter: dropdown (Last 7 days, Last 30 days, All time)
- [ ] Results list: cards with layer badge, source, snippet, relevance score,
      click → full view
- [ ] Pagination: infinite scroll or "Load more" button
- [ ] Empty state: "No results found. Try a different query."
- [ ] Loading skeleton
- [ ] Responsive design, dark theme

**Files:**

- `apps/web/src/app/[orgSlug]/knowledge/page.tsx`
- `apps/web/src/components/knowledge/knowledge-search.tsx`
- `apps/web/src/components/knowledge/knowledge-result-card.tsx`
- `apps/web/src/hooks/use-knowledge-search.ts`

---

### Phase 3.2: My Tasks Aggregation (Day 3)

#### TASK: CA-S3-04 — My Tasks Aggregation Query

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-03a

**Description:**  
Implement query to aggregate tasks across personal and shared cohorts for a
user.

**Acceptance Criteria:**

- [ ] Function `getMyTasks(userId, filters, pagination)` — aggregate tasks from
      all accessible cohorts
- [ ] Include personal cohort tasks (scope_type=personal, scope_id=userId)
- [ ] Include shared cohort tasks (where user is member)
- [ ] Filters: status, priority, due date, cohort
- [ ] Sorting: by due date, priority, created date
- [ ] Pagination: 50 per page
- [ ] Return task with cohort context (cohort name, type)
- [ ] Unit tests

**Files:**

- `apps/web/src/server/db/queries/my-tasks.ts`
- `apps/web/src/server/db/queries/__tests__/my-tasks.test.ts`

---

#### TASK: CA-S3-05 — My Tasks API Route

**Assigned:** Devi (Backend)  
**Complexity:** S  
**Dependencies:** CA-S3-04

**Description:**  
Create API route for My Tasks aggregation.

**Acceptance Criteria:**

- [ ] `GET /api/v1/tasks/my` — get tasks for current user
- [ ] Query params: filters, pagination
- [ ] Authorization: user can only see their own tasks
- [ ] Tests, OpenAPI schema

**Files:**

- `apps/web/src/app/api/v1/tasks/my/route.ts`
- `docs/specs/api/my-tasks.yml`

---

#### TASK: CA-S3-06 — My Tasks Page UI (Global, Cross-Cohort)

**Assigned:** Lubna (UI) + Zara (Creative)  
**Complexity:** M  
**Dependencies:** CA-S3-05

**Description:**  
Redesign My Tasks as a **global page** (not org-scoped) that aggregates tasks
from the user's personal cohort + all org cohorts they belong to. **Note:
`/[orgSlug]/my-tasks/page.tsx` and `use-my-tasks.ts` hook already exist —
migrate to global route and extend.**

The existing org-scoped page at `/[orgSlug]/my-tasks` should redirect to
`/my-tasks?filter=org:{slug}`.

**Acceptance Criteria:**

- [ ] New global page: `/my-tasks` (outside `[orgSlug]` layout)
- [ ] Redirect: `/[orgSlug]/my-tasks` → `/my-tasks?filter=org:{slug}`
- [ ] Source filter dropdown: All | Personal Cohort | {Org Name 1} | {Org Name
      2} | ...
- [ ] Table columns: Task Name, Source (cohort/org badge), Status, Priority, Due
      Date, Assignee (agent), Actions
- [ ] Filters: Status, Priority, Source (cohort/org dropdown)
- [ ] Sorting: by due date, priority, created date
- [ ] Click row → navigate to task detail (correct org context)
- [ ] Source badge: color-coded (Personal=blue, Org=purple)
- [ ] Empty state: "No tasks yet. Create your first task in a cohort."
- [ ] Responsive design

**Files:**

- `apps/web/src/app/my-tasks/page.tsx` (new global route)
- `apps/web/src/app/[orgSlug]/my-tasks/page.tsx` (redirect to global)
- `apps/web/src/components/tasks/my-tasks-table.tsx`
- `apps/web/src/hooks/use-my-tasks.ts` (extend existing)

---

### Phase 3.3: Agent Evolution Dashboard (Day 4)

#### TASK: CA-S3-07 — Agent Evolution Dashboard UI

**Assigned:** Lubna (UI) + Zara (Creative)  
**Complexity:** M  
**Dependencies:** CA-S1-16

**Description:**  
Build Agent Evolution Dashboard on agent profile page.

**Acceptance Criteria:**

- [ ] Section on agent profile page: "Evolution Dashboard"
- [ ] Timeline: vertical timeline of evolution events (learning, correction,
      milestone)
- [ ] Event types: color-coded (learning=blue, correction=amber,
      milestone=green)
- [ ] Event cards: timestamp, summary, metadata (expandable)
- [ ] Metrics: total learnings, correction rate, growth milestones
- [ ] Correction rate chart: line chart showing corrections per week over time
- [ ] Filter: by event type
- [ ] Empty state: "No evolution events yet. Your agent is just getting
      started."
- [ ] Responsive design

**Files:**

- `apps/web/src/components/agents/agent-evolution-dashboard.tsx`
- `apps/web/src/components/agents/evolution-event-card.tsx`
- `apps/web/src/components/agents/correction-rate-chart.tsx`

---

### Phase 3.4: Scheduled Tasks & Skills Management (Day 5)

#### TASK: CA-S3-08 — Scheduled Tasks (Recurrence) Backend

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-03a

**Description:**  
Implement recurring task support (daily Clone Check-in + custom recurrence).

**Acceptance Criteria:**

- [ ] Add columns to `tasks`: `recurrence_rule` (cron expression),
      `next_occurrence_at`, `is_recurring` (boolean)
- [ ] Function `createRecurringTask(data)` — create task with recurrence rule
- [ ] Function `generateNextOccurrence(taskId)` — create next instance of
      recurring task
- [ ] Background job: run every hour, check `next_occurrence_at`, generate new
      tasks
- [ ] Clone Check-in task: daily at 9 AM user local time (cron: `0 9 * * *`)
- [ ] Update Drizzle schema
- [ ] Migration, tests

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_add_task_recurrence.sql`
- `packages/database/src/schema/tasks.ts`
- `apps/web/src/server/services/recurring-tasks.ts`
- `apps/web/src/server/jobs/task-recurrence-job.ts`

---

#### TASK: CA-S3-09 — Scheduled Tasks UI (Recurrence Editor)

**Assigned:** Lubna (UI) + Zara (Creative)  
**Complexity:** M  
**Dependencies:** CA-S3-08

**Description:**  
Build recurrence editor for scheduled tasks.

**Acceptance Criteria:**

- [ ] Component: `TaskRecurrenceEditor`
- [ ] Options: None, Daily, Weekly, Monthly, Custom (cron)
- [ ] Daily: time picker (default 9 AM)
- [ ] Weekly: day selector + time
- [ ] Monthly: date selector + time
- [ ] Custom: cron expression input with validation
- [ ] Preview: "Next occurrence: Feb 28 at 9:00 AM"
- [ ] Used in task create/edit modal
- [ ] Validation: valid cron expressions
- [ ] Storybook story

**Files:**

- `apps/web/src/components/tasks/task-recurrence-editor.tsx`
- `apps/web/src/lib/utils/cron-validator.ts`
- `apps/web/src/components/tasks/__tests__/task-recurrence-editor.test.tsx`

---

#### TASK: CA-S3-10 — Skills Management UI (Per-Agent)

**Assigned:** Lubna (UI) + Zara (Creative)  
**Complexity:** M  
**Dependencies:** CA-S1-16

**Description:**  
Build skills management panel on agent profile page.

**Acceptance Criteria:**

- [ ] Section on agent profile: "Skills"
- [ ] List of enabled skills with icons, names, descriptions
- [ ] "Manage Skills" button → modal with skill selector
- [ ] Skill selector: searchable list, checkboxes, categories (Web, Research,
      Coding, etc.)
- [ ] Save → update `agents.settings.enabledSkills`
- [ ] Show skill count badge (e.g., "12 skills enabled")
- [ ] Empty state: "No skills enabled yet."
- [ ] Responsive design

**Files:**

- `apps/web/src/components/agents/agent-skills-panel.tsx`
- `apps/web/src/components/agents/skills-selector-modal.tsx`
- `apps/web/src/hooks/use-agent-skills.ts`

---

### Phase 3.5: Agent Permissions (Day 6)

#### TASK: CA-S3-11 — Agent Permissions Backend

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** CA-S1-04

**Description:**  
Implement per-agent permissions system (read/write/admin per action type).

**Acceptance Criteria:**

- [ ] Add `permissions` jsonb column to `cohort_agent_members`
- [ ] Schema:
      `{ tasks: { create: true, read: true, update: true, delete: false }, ... }`
- [ ] Function `checkAgentPermission(agentId, cohortId, resource, action)` —
      verify permission
- [ ] Default permissions: member role has read/write, admin role has full
      access
- [ ] Permissions enforced in API routes (task create, comment post, etc.)
- [ ] Update Drizzle schema
- [ ] Migration, tests

**Files:**

- `supabase/migrations/YYYYMMDDHHMMSS_add_agent_permissions.sql`
- `packages/database/src/schema/cohort-agent-members.ts`
- `apps/web/src/server/services/agent-permissions.ts`
- `apps/web/src/server/services/__tests__/agent-permissions.test.ts`

---

#### TASK: CA-S3-12 — Agent Permissions UI

**Assigned:** Lubna (UI) + Zara (Creative)  
**Complexity:** M  
**Dependencies:** CA-S3-11

**Description:**  
Build agent permissions editor in cohort member management.

**Acceptance Criteria:**

- [ ] Section in cohort members panel: "Agent Permissions"
- [ ] Table: Agent, Role, Permissions (expandable row)
- [ ] Permissions editor: checkboxes for each resource/action (Tasks:
      Create/Read/Update/Delete, Comments: Post/Edit/Delete, etc.)
- [ ] Save button → update permissions
- [ ] Only cohort owners/admins can edit
- [ ] Validation: at least read permission for all resources
- [ ] Responsive design

**Files:**

- `apps/web/src/components/cohorts/agent-permissions-editor.tsx`
- `apps/web/src/hooks/use-agent-permissions.ts`

---

### Phase 3.6: Organization Creation (Explicit) (Day 7)

#### TASK: CA-S3-13 — Organization Creation Backend

**Assigned:** Devi (Backend)  
**Complexity:** M  
**Dependencies:** None

**Description:**  
Implement explicit organization creation (separate from Clerk orgs).

**Acceptance Criteria:**

- [ ] Function `createOrganization(name, slug, ownerId)` — create org in
      `organizations` table
- [ ] Sync with Clerk: create Clerk org, link via `clerk_org_id`
- [ ] Auto-add creator as owner in `organization_memberships`
- [ ] Validation: unique slug, name 3-100 chars
- [ ] API route: `POST /api/v1/organizations`
- [ ] Tests, OpenAPI schema

**Files:**

- `apps/web/src/server/db/mutations/organizations.ts`
- `apps/web/src/app/api/v1/organizations/route.ts`
- `docs/specs/api/organizations.yml`

---

#### TASK: CA-S3-14 — Organization Creation UI

**Assigned:** Lubna (UI) + Zara (Creative)  
**Complexity:** S  
**Dependencies:** CA-S3-13

**Description:**  
Build organization creation modal.

**Acceptance Criteria:**

- [ ] Modal: `CreateOrganizationModal`
- [ ] Form fields: Name (required), Slug (auto-generated from name, editable)
- [ ] Slug validation: lowercase, alphanumeric + hyphens, unique check
      (debounced)
- [ ] Submit → `POST /api/v1/organizations`
- [ ] Success: close modal, redirect to new org dashboard
- [ ] Responsive design

**Files:**

- `apps/web/src/components/organizations/create-organization-modal.tsx`
- `apps/web/src/hooks/use-create-organization.ts`

---

### Phase 3.7: Final E2E Tests (Day 7)

#### TASK: CA-S3-15 — E2E Test: Knowledge Hub Search

**Assigned:** Nina (QA)  
**Complexity:** M  
**Dependencies:** CA-S3-03

**Description:**  
End-to-end test for Knowledge Hub search across 4 layers.

**Acceptance Criteria:**

- [ ] Test navigates to Knowledge Hub
- [ ] Enters search query
- [ ] Verifies results from multiple layers displayed
- [ ] Filters by layer (select Mem0 only)
- [ ] Verifies filtered results
- [ ] Playwright test

**Files:**

- `tests/e2e/knowledge-hub.spec.ts`

---

#### TASK: CA-S3-16 — E2E Test: My Tasks Aggregation

**Assigned:** Nina (QA)  
**Complexity:** S  
**Dependencies:** CA-S3-06

**Description:**  
End-to-end test for My Tasks page showing tasks from multiple cohorts.

**Acceptance Criteria:**

- [ ] Test creates tasks in personal cohort and shared cohort
- [ ] Navigates to My Tasks
- [ ] Verifies both tasks displayed
- [ ] Filters by cohort
- [ ] Verifies filtered results
- [ ] Playwright test

**Files:**

- `tests/e2e/my-tasks.spec.ts`

---

#### TASK: CA-S3-17 — E2E Test: Scheduled Task Creation

**Assigned:** Nina (QA)  
**Complexity:** S  
**Dependencies:** CA-S3-09

**Description:**  
End-to-end test for creating recurring task with daily recurrence.

**Acceptance Criteria:**

- [ ] Test creates task with daily recurrence (9 AM)
- [ ] Verifies recurrence rule saved
- [ ] Verifies "Next occurrence" displayed correctly
- [ ] Playwright test

**Files:**

- `tests/e2e/scheduled-tasks.spec.ts`

---

**Sprint 3 Summary:**

- **Total Tasks:** 17
- **Backend (Devi):** 9 tasks
- **UI (Lubna + Zara):** 5 tasks
- **QA (Nina):** 3 tasks
- **Estimated Effort:** 1 week (7 days)
- **Deliverable:** Knowledge Hub, My Tasks, Agent Evolution Dashboard, scheduled
  tasks, agent permissions, org creation, E2E tests

---

## Overall Sprint Summary

### Total Effort (3 Sprints)

- **Total Tasks:** 51 (CA-S1-03 split into 03a + 03b)
- **Backend Tasks (Devi):** 31
- **UI Tasks (Lubna + Zara):** 11 + 6 shared = 17
- **QA Tasks (Nina):** 8
- **Duration:** 4 weeks (Sprint 1 expanded to ~10 days, Sprints 2-3 remain 7
  days each)

### Feature Branches

- Sprint 1: `feature/cohort-architecture-sprint-1`
- Sprint 2: `feature/cohort-architecture-sprint-2`
- Sprint 3: `feature/cohort-architecture-sprint-3`

### Dependencies Between Sprints

- Sprint 2 depends on: CA-S1-02, CA-S1-04, CA-S1-06, CA-S1-09, CA-S1-10,
  CA-S1-11, CA-S1-12, CA-S1-13, CA-S1-16
- Sprint 3 depends on: CA-S1-03a, CA-S1-16, CA-S2-04

### Key Deliverables by Sprint

**Sprint 1 (P0):**

- ✅ Database schema (split membership, runtime fields, scope columns, RLS)
- ✅ Data layer (queries + mutations for cohorts, agents, membership)
- ✅ API routes (cohorts, agents, runtime, membership)
- ✅ Backend tests + documentation

**Sprint 2 (P0):**

- ✅ Clone foundation onboarding flow (5-6 steps + daily check-in task)
- ✅ Personal cohort auto-provisioning
- ✅ Cohort dashboard UI (runtime status, members, activity)
- ✅ Agent profile UI
- ✅ Task @mention support
- ✅ E2E tests (onboarding, cohort management, agent mention)

**Sprint 3 (P1):**

- ✅ Knowledge Hub (4-layer search)
- ✅ My Tasks aggregation
- ✅ Agent Evolution Dashboard
- ✅ Scheduled tasks (recurrence)
- ✅ Agent permissions
- ✅ Organization creation
- ✅ E2E tests (knowledge hub, my tasks, scheduled tasks)

---

## Execution Rules

1. **Specs before code** — Every task starts with a spec document (data
   contract, API schema, or component spec)
2. **Tests required** — No PR merges without tests (unit, integration, or E2E as
   appropriate)
3. **Complexity estimates:**
   - **S (Small):** 2-4 hours, single file/component
   - **M (Medium):** 4-8 hours, multiple files, moderate complexity
   - **L (Large):** 8-16 hours, cross-cutting changes, high complexity
4. **Feature branch naming:** `feature/cohort-architecture-sprint-{1|2|3}`
5. **PR naming:** `[CA-S{sprint}-{task}] {Title}` (e.g.,
   `[CA-S1-01] Split membership tables migration`)
6. **Daily standup:** Each specialist posts progress in Discord #cohortix-dev
   channel
7. **Task status tracking:** Update task status in Linear/GitHub Projects (or
   this document)
8. **Blockers:** Escalate immediately to August (PM) or Alim (CEO)

---

## Definition of Done (Per Task)

- [ ] Spec document written (if applicable)
- [ ] Code implemented following Axon Dev Codex
- [ ] Tests written and passing (unit/integration/E2E)
- [ ] Code reviewed (peer or AI review)
- [ ] TypeScript strict mode: no `any` types
- [ ] Accessibility: WCAG 2.2 AA compliance (for UI tasks)
- [ ] Documentation updated (API specs, data contracts, README)
- [ ] Learning captured in agent memory (Mem0, lessons)
- [ ] PR merged to feature branch
- [ ] Task marked as complete

---

## Risk Mitigation

### Identified Risks

1. **Gateway RPC integration complexity** (runtime provisioning, heartbeat,
   session management)
   - Mitigation: Allocate extra time in Sprint 1 for integration testing with
     OpenClaw Gateway
2. **Memory layer integration** (Mem0, Cognee, QMD)
   - Mitigation: Mock memory sources in Sprint 3 if integrations not ready;
     implement progressive enhancement
3. **Split membership table migration** (backfilling existing data)
   - Mitigation: Test migration rollback thoroughly; use feature flag to toggle
     new schema
4. **Clerk webhook reliability** (personal cohort provisioning)
   - Mitigation: Implement idempotency checks, retry logic, dead-letter queue
     for failed webhooks

### Contingency Plans

- If Sprint 1 overruns: defer CA-S1-17 (integration tests) to Sprint 2 Day 1
- If Sprint 2 overruns: defer CA-S2-11 (@mention UI) to Sprint 3 (backend
  already complete)
- If Sprint 3 overruns: defer CA-S3-13/14 (org creation) to post-launch backlog
  (not critical for P0/P1)

---

## Success Metrics

### Sprint 1 (Backend Foundation)

- [ ] All migrations applied successfully without rollback
- [ ] 100% of API routes return 200/201 for valid requests
- [ ] RLS policies tested with 10+ user scenarios, zero leaks
- [ ] Test coverage: ≥80% data layer, ≥70% API routes

### Sprint 2 (Onboarding & UI)

- [ ] Onboarding flow completion rate: ≥90% (no drop-offs)
- [ ] Personal cohort provisioning: 100% success rate on signup
- [ ] Agent @mention response time: <5s from comment to session start
- [ ] UI component test coverage: ≥70%

### Sprint 3 (Advanced Features)

- [ ] Knowledge Hub search: <2s response time for 90th percentile
- [ ] My Tasks aggregation: supports 100+ tasks without pagination lag
- [ ] Scheduled task generation: 100% accuracy (no missed occurrences)
- [ ] E2E test suite: 100% pass rate

---

## Post-Sprint Checklist

After completing all 3 sprints:

- [ ] Final regression test suite (all E2E tests pass)
- [ ] Load testing (cohort runtime heartbeat under 100 concurrent cohorts)
- [ ] Security audit (RLS policies, BYOK secrets, personal cohort isolation)
- [ ] Documentation review (all specs, ADRs, API schemas complete)
- [ ] Changelog generated (conventional commits → semantic versioning)
- [ ] Feature flag rollout plan (gradual rollout to production)
- [ ] Rollback plan documented
- [ ] Lessons captured in agent memory (Mem0 + workspace skills)
- [ ] Demo prepared for Ahmad (CEO)

---

**Status:** Ready for execution. All tasks are self-contained and handed off to
specialists.

**Last Updated:** 2026-02-27  
**Next Review:** After Sprint 1 completion (Week 1 retrospective)
