# Terminology Migration Plan — PPV Pro Alignment

**Status:** IN PROGRESS  
**Date:** 2026-02-12  
**Owner:** Alim (CEO)  
**Source of Truth:** `/docs/TERMINOLOGY.md`

---

## Objective

Migrate all Cohortix documentation, source code, database schema, UI copy, and
agent knowledge to the approved PPV Pro-aligned terminology. Both humans and
agents use the same vocabulary.

---

## Terminology Map (OLD → NEW)

| Old Term              | New Term         | Scope Level                 |
| --------------------- | ---------------- | --------------------------- |
| Pillars               | **Domain**       | Core life/expertise area    |
| Life Aspirations      | **Vision**       | Emotional north star        |
| Goal (strategic)      | **Mission**      | Measurable outcome          |
| Project               | **Operation**    | Bounded initiative          |
| Mission (atomic task) | **Task**         | Atomic work unit            |
| Routine               | **Rhythm**       | Recurring habit             |
| Topic Vault           | **Intelligence** | Knowledge by topic          |
| NeuroBits             | **Insight**      | Individual learning capture |
| Cycle Reviews         | **Debrief**      | Reflection cadence          |

**⚠️ BREAKING:** "Mission" shifted from atomic task → measurable outcome. "Task"
is now atomic.

---

## Phase 1: Documentation (Owner: Lubna) ✅ COMPLETE

| File                                           | Status             | Notes                                       |
| ---------------------------------------------- | ------------------ | ------------------------------------------- |
| `docs/TERMINOLOGY.md`                          | ✅ Created         | Authoritative reference (new file)          |
| `docs/design/DDR-002-terminology-decisions.md` | ✅ Rewritten       | Full PPV hierarchy + dual human/agent model |
| `docs/PRD.md`                                  | ✅ Updated to v2.0 | All terminology + new feature specs         |
| `docs/BRAND_GUIDELINES.md`                     | ✅ Updated         | Terminology table overhauled                |
| `docs/design/DDR-001-*.md`                     | ✅ Updated         | UI examples corrected                       |
| `docs/design/DDR-003-*.md`                     | ✅ Updated         | Component references corrected              |
| `docs/design/DDR-004-*.md`                     | ✅ Updated         | Component names corrected                   |
| `docs/design/DESIGN_SYSTEM.md`                 | ✅ Updated         | Component naming conventions                |
| `docs/ARCHITECTURE.md`                         | ✅ Updated         | Hierarchy + diagrams                        |
| `docs/API_DESIGN.md`                           | ⚠️ Partial         | Endpoint naming needs deeper review         |
| `docs/FOLDER_STRUCTURE.md`                     | ⚠️ Partial         | Directory naming context unclear            |

## Phase 2: UI Mockups (Owner: Lubna) ✅ COMPLETE

| File                            | Status     | Notes                          |
| ------------------------------- | ---------- | ------------------------------ |
| `design/mockups/dashboard.html` | ✅ Updated | Nav + content                  |
| `design/mockups/agents.html`    | ✅ Updated | Labels + statuses              |
| `design/mockups/campaign.html`  | ✅ Updated | Task cards (was mission cards) |
| `design/mockups/knowledge.html` | ✅ Updated | Intelligence terminology       |
| `design/mockups/auth.html`      | ✅ Updated | Onboarding copy                |
| `design/mockups/index.html`     | ✅ Updated | Landing page copy              |

## Phase 3: Source Code (Owner: Devi) ✅ COMPLETE

### 3a. Schema & Types

| Item                                       | Status     | Notes                                   |
| ------------------------------------------ | ---------- | --------------------------------------- |
| `packages/database/src/schema/goals.ts`    | 🔄 Deleted | Was "Goal" → now handled by missions.ts |
| `packages/database/src/schema/actions.ts`  | 🔄 Deleted | Was atomic tasks → replaced             |
| `packages/database/src/schema/missions.ts` | 🔄 Updated | Now represents measurable outcomes      |
| `packages/database/src/schema/index.ts`    | 🔄 Updated | Exports updated                         |
| TypeScript interfaces/types                | ❌ TODO    | All type definitions need review        |

### 3b. API Routes

| Item                                 | Status       | Notes                                    |
| ------------------------------------ | ------------ | ---------------------------------------- |
| `/api/v1/missions/`                  | 🔄 Updated   | Now means strategic missions (was tasks) |
| `/api/v1/operations/`                | ✅ Created   | New route for bounded initiatives        |
| `/api/v1/agents/`                    | ✅ No change | Already correct                          |
| `/api/v1/cohorts/`                   | ✅ No change | Already correct                          |
| `/api/v1/domains/`                   | ❌ TODO      | New PPV layer                            |
| `/api/v1/visions/`                   | ❌ TODO      | New PPV layer                            |
| `/api/v1/tasks/`                     | ❌ TODO      | Atomic work units                        |
| `/api/v1/rhythms/`                   | ❌ TODO      | Recurring habits                         |
| `/api/v1/intelligence/`              | ❌ TODO      | Knowledge system                         |
| `/api/v1/insights/`                  | ❌ TODO      | Learning captures                        |
| `/api/v1/debriefs/`                  | ❌ TODO      | Review cadences                          |
| `/api/v1/dashboard/mission-control/` | ✅ No change | Correct usage                            |

### 3c. UI Components

| Item                        | Status     | Notes                 |
| --------------------------- | ---------- | --------------------- |
| `mission-status-chip.tsx`   | 🔄 Updated | Labels updated        |
| `missions-table.tsx`        | 🔄 Updated | Column headers + copy |
| `missions-table-client.tsx` | 🔄 Updated | Client-side labels    |
| `recent-activity.tsx`       | 🔄 Updated | Activity feed copy    |
| `sidebar.tsx`               | 🔄 Updated | Nav labels            |
| Dashboard page components   | ❌ TODO    | Full audit needed     |
| Agent profile components    | ❌ TODO    | PPV stack display     |

### 3d. Tests

| Item                           | Status     | Notes               |
| ------------------------------ | ---------- | ------------------- |
| `e2e/mission-creation.spec.ts` | 🔄 Updated | Test labels updated |
| `validation.test.ts`           | 🔄 Updated | Schema validation   |
| `mission.ts` (validation)      | 🔄 Updated | Validation schemas  |
| All other test files           | ❌ TODO    | Full audit needed   |

## Phase 4: Database Migration ❌ TODO

| Item                         | Status  | Notes                                                                               |
| ---------------------------- | ------- | ----------------------------------------------------------------------------------- |
| Schema design for new tables | ❌ TODO | domains, visions, rhythms, tasks, intelligence, insights, debriefs                  |
| Migration script (SQL)       | ❌ TODO | `0006_ppv_terminology_migration.sql`                                                |
| Rename existing tables       | ❌ TODO | goals→missions, missions→? (careful — missions table now means something different) |
| RLS policies update          | ❌ TODO | All row-level security policies                                                     |
| Seed data update             | ❌ TODO | If any seed data references old terms                                               |

## Phase 5: Agent Knowledge Update ❌ TODO

| Item                      | Status  | Notes                                      |
| ------------------------- | ------- | ------------------------------------------ |
| All agent SOUL.md files   | ❌ TODO | Must reference TERMINOLOGY.md              |
| All agent workspace docs  | ❌ TODO | Consistent vocabulary                      |
| Mem0 entries              | ❌ TODO | Store terminology as org-wide learning     |
| Agent correction protocol | ❌ TODO | Agents correct incorrect terminology usage |

## Phase 6: Final Audit ❌ TODO

| Check                                | Status  | Notes                                             |
| ------------------------------------ | ------- | ------------------------------------------------- |
| `grep` for old terms across codebase | ❌ TODO | No "Goal" (strategic), no "Mission" (atomic task) |
| UI visual review                     | ❌ TODO | Screenshot all pages, verify labels               |
| API response format check            | ❌ TODO | JSON keys match new terms                         |
| Test suite passes                    | ❌ TODO | `pnpm test` clean                                 |
| E2E tests pass                       | ❌ TODO | All flows work with new terms                     |
| Cross-reference TERMINOLOGY.md       | ❌ TODO | Every term used correctly                         |
| Agent terminology quiz               | ❌ TODO | Spawn each agent, ask terminology questions       |

---

## Execution Order

```
Phase 1 ✅ → Phase 2 ✅ → Phase 3 🔄 → Phase 4 → Phase 5 → Phase 6
(docs)       (mockups)     (code)        (DB)       (agents)   (audit)
```

**Phase 3 must complete before Phase 4** (code changes inform DB migration
needs). **Phase 5 can run in parallel with Phase 4.** **Phase 6 is the final
gate — nothing ships without it.**

---

## Agents & Responsibilities

| Agent                   | Phases                          | Status         |
| ----------------------- | ------------------------------- | -------------- |
| **Alim (CEO)**          | Plan, coordinate, Phase 6 audit | 🔄 Active      |
| **Lubna (UI Designer)** | Phase 1, 2                      | ✅ Complete    |
| **Devi (AI Developer)** | Phase 3, 4                      | 🔄 In progress |
| **All specialists**     | Phase 5                         | ❌ Pending     |
| **Hafiz (Guardian)**    | Phase 6 assist                  | ❌ Pending     |

---

_Last updated: 2026-02-12 19:30 PKT_
