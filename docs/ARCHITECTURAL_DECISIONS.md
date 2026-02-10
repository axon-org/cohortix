# Architectural Decisions: NeuroEngine Patterns → Cohortix

**Decision Date:** 2026-02-05  
**Decision Maker:** Architect (Idris)  
**Status:** Approved  
**Context:** Review of NeuroEngine archives to identify reusable patterns for Cohortix

---

## Executive Summary

After reviewing Devi's comprehensive analysis of the NeuroEngine archives, this document records formal ADOPT / ADAPT / SKIP decisions for each recommendation. The goal is to leverage proven patterns while avoiding cargo-culting solutions that don't fit Cohortix's ally-orchestration domain.

**Decision Summary:**
- **ADOPT (Direct Reuse):** 8 patterns
- **ADAPT (Modified Reuse):** 7 patterns
- **SKIP (Not Applicable):** 5 patterns

---

## Decision Framework

| Decision | Meaning | Criteria |
|----------|---------|----------|
| **ADOPT** | Use as-is or with minimal changes | Pattern directly solves Cohortix problem, low adaptation cost |
| **ADAPT** | Modify significantly for Cohortix context | Core concept valuable, but domain requires changes |
| **SKIP** | Do not implement | Not relevant to Cohortix, or better alternatives exist |

---

## Technical Architecture Decisions

### 1. JWKS (ES256) JWT Validation Pattern

**Decision:** ✅ **ADOPT**

**Source:** `NeuroEngine/docs/TECHNICAL_SPEC.md` (JWT section), `backend/app/auth.py`

**Rationale:**
- Clerk uses similar JWT infrastructure; understanding JWKS is critical for custom extensions
- ES256 asymmetric cryptography is industry standard (OAuth 2.0 / OpenID Connect)
- Key rotation via JWKS endpoint eliminates manual secret management
- Cohortix will need this pattern for service-to-service auth and API key validation

**Implementation Notes:**
- Clerk handles primary auth, but implement JWKS pattern for:
  - API key validation layer
  - Service-to-service communication (ally runtime ↔ Cohortix API)
  - Webhook signature verification
- Store in `packages/auth/` for shared usage across apps

**Cohortix Application:**
```typescript
// packages/auth/src/jwks.ts
// Validate ally runtime webhooks, API keys, service tokens
```

---

### 2. Cursor-Based Pagination

**Decision:** ✅ **ADOPT**

**Source:** `NeuroEngine/backend/app/utils/cursor.py`

**Rationale:**
- Cohortix will have millions of missions across thousands of HQs
- Offset pagination breaks at scale (duplicate results, slow queries)
- Cursor pagination is essential for:
  - Mission lists (filtered by campaign/ally)
  - Ally activity feeds
  - Intel search results
  - Audit logs

**Implementation Notes:**
- Implement in Drizzle ORM patterns
- Standard response format:
```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    cursor: string | null;
    hasMore: boolean;
    totalCount?: number; // Optional, expensive for large datasets
  };
}
```
- Default limit: 20, max limit: 100

**Cohortix Application:**
- `/api/v1/missions` — Mission listings
- `/api/v1/allies/{id}/activity` — Ally activity feeds
- `/api/v1/intel/search` — Semantic search results

---

### 3. Cost Tracking Schema

**Decision:** ✅ **ADOPT**

**Source:** `NeuroEngine/docs/TECHNICAL_SPEC.md` (llm_cost_tracking schema)

**Rationale:**
- Cohortix orchestrates allies that make LLM calls
- Cost attribution is critical for:
  - Per-ally budgets and quotas
  - Per-campaign cost caps
  - Per-HQ billing (future marketplace)
  - Cost optimization insights

**Implementation Notes:**
Adapt schema for ally context:

```sql
CREATE TABLE ally_cost_tracking (
  id BIGSERIAL PRIMARY KEY,
  hq_id UUID NOT NULL REFERENCES headquarters(id),
  ally_id UUID REFERENCES allies(id),
  mission_id UUID REFERENCES missions(id),
  campaign_id UUID REFERENCES campaigns(id),
  
  -- LLM details
  operation TEXT NOT NULL, -- 'chat', 'embedding', 'summarization'
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER,
  total_tokens INTEGER NOT NULL,
  estimated_cost_usd NUMERIC(10, 6) NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cost_hq_date ON ally_cost_tracking(hq_id, created_at);
CREATE INDEX idx_cost_ally ON ally_cost_tracking(ally_id);
CREATE INDEX idx_cost_mission ON ally_cost_tracking(mission_id);
```

**Cohortix Application:**
- Mission Control widget: "This month's ally costs"
- Ally profiles: Cost efficiency metrics
- Campaign views: Budget vs. actual spend

---

### 4. Error Taxonomy & Response Format

**Decision:** ✅ **ADOPT**

**Source:** `NeuroEngine/docs/TECHNICAL_DECISIONS.md` (Standard error response & codes)

**Rationale:**
- Consistent error handling is essential for:
  - Frontend error boundaries
  - API client libraries
  - Ally error recovery
  - Debugging and observability

**Implementation Notes:**
Use NeuroEngine's taxonomy with Cohortix extensions:

```typescript
// Standard error response
interface APIError {
  error: {
    code: string;        // 'RESOURCE_NOT_FOUND', 'VALIDATION_FAILED'
    message: string;     // Human-readable
    details?: Record<string, unknown>; // Dev mode only
    traceId: string;     // X-Request-ID
  };
}

// Error code patterns
const ERROR_PATTERNS = {
  'VALIDATION_*': 400,  // Request validation
  'AUTH_*': 401,        // Authentication
  'FORBIDDEN_*': 403,   // Authorization
  '*_NOT_FOUND': 404,   // Resource not found
  'CONFLICT_*': 409,    // State conflicts
  'RATE_LIMIT_*': 429,  // Rate limiting
  'ALLY_*': 422,        // Cohortix-specific: Ally errors
  'CAMPAIGN_*': 422,    // Cohortix-specific: Campaign errors
  'INTERNAL_*': 500,    // Server errors
};
```

**Cohortix Extensions:**
- `ALLY_UNAVAILABLE` — Ally is off duty or on another mission
- `ALLY_TIMEOUT` — Ally didn't respond within SLA
- `CAMPAIGN_BLOCKED` — Dependency not met
- `QUOTA_EXCEEDED` — HQ/ally budget limit reached

---

### 5. Supabase + RLS Security Posture

**Decision:** 🔄 **ADAPT**

**Source:** `NeuroEngine/docs/TECHNICAL_SPEC.md`, `docs/TECHNICAL_DECISIONS.md`

**Rationale:**
- Cohortix uses PostgreSQL (Neon) with Drizzle ORM, not Supabase
- But the hybrid security model concept is valuable:
  - RLS for critical isolation (HQ data)
  - Application layer for complex business logic

**Adaptation:**
- Implement RLS-equivalent isolation in Drizzle
- Use Clerk's organization context for HQ scoping
- Critical tables get RLS-like policies:
  - `campaigns` — `WHERE hq_id = current_hq_id`
  - `missions` — Via campaign relationship
  - `allies` — Per-HQ isolation

**Implementation Notes:**
```typescript
// middleware/hqContext.ts
export async function withHQContext<T>(
  hqId: string,
  fn: () => Promise<T>
): Promise<T> {
  // Set HQ context for all queries
  await db.execute(sql`SET app.current_hq_id = ${hqId}`);
  return fn();
}
```

---

### 6. Service Layer Architecture

**Decision:** ✅ **ADOPT**

**Source:** `NeuroEngine/SENIOR_DEV_AUDIT_REPORT.md`, Phase 2.2 refactoring

**Rationale:**
- NeuroEngine audit identified service layer as critical missing piece
- Cohortix should establish from day 1:
  - Clean separation: Route → Service → Repository
  - Testable business logic
  - Reusable across API routes, background jobs, webhooks

**Implementation Notes:**
```
packages/
├── services/
│   ├── mission.service.ts      # Mission business logic
│   ├── ally.service.ts         # Ally orchestration
│   ├── campaign.service.ts     # Campaign execution
│   └── intel.service.ts        # Intel operations
```

**Pattern:**
```typescript
// services/mission.service.ts
export class MissionService {
  constructor(
    private db: Database,
    private allyRuntime: AllyRuntime,
    private costTracker: CostTracker
  ) {}

  async createMission(input: CreateMissionInput): Promise<Mission> {
    // Business logic here, not in route handler
  }
}
```

---

### 7. Planning Methodology (ROADMAP/STATE/PROJECT)

**Decision:** ✅ **ADOPT**

**Source:** `NeuroEngine/.planning/ROADMAP.md`, `STATE.md`, `PROJECT.md`

**Rationale:**
- GSD-style planning prevents execution drift
- Three-file system provides:
  - ROADMAP: Where we're going (phases, milestones)
  - STATE: Where we are now (current phase, blockers)
  - PROJECT: What we're building (requirements, constraints)
- Proved effective for NeuroEngine's 10-phase plan

**Implementation Notes:**
Create `.planning/` directory with Cohortix-adapted structure:
- ROADMAP.md — Ally-focused phases
- STATE.md — Current execution state
- PROJECT.md — Living requirements

---

### 8. Design System Phased Formalization

**Decision:** 🔄 **ADAPT**

**Source:** `NeuroEngine/.planning/decisions/DESIGN_SYSTEM_STRATEGY.md`

**Rationale:**
- Phase 4/5 checkpoint concept is valuable
- But Cohortix has different UI complexity curve:
  - NeuroEngine: RAG chat UI → Studio → Marketplace
  - Cohortix: Mission Control → Ally views → Campaign builder

**Adaptation:**
- Checkpoints at different phases:
  - **Phase 2 (Ally Directory):** Formalize card patterns, status badges
  - **Phase 4 (Mission Control):** Formalize Kanban, List, Timeline components
  - **Phase 6 (Intel Base):** Formalize search, feed components

**Implementation Notes:**
- Use shadcn/ui + Tailwind (already in tech stack)
- Create `docs/DESIGN_SYSTEM.md` with checkpoints
- Budget 4-8 hours per checkpoint (not 11 hours like NeuroEngine)

---

### 9. CI/CD from Day 1

**Decision:** ✅ **ADOPT**

**Source:** `NeuroEngine/.github/workflows/ci-cd.yml`, Audit findings

**Rationale:**
- NeuroEngine audit identified CI/CD as critical gap
- Cohortix should have from day 1:
  - Automated testing on PR
  - Type checking
  - Linting
  - Preview deployments
  - Production deployment gates

**Implementation Notes:**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check
      
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
```

---

### 10. SSE Streaming Pattern

**Decision:** ✅ **ADOPT**

**Source:** `NeuroEngine/docs/TECHNICAL_SPEC.md` (SSE streaming format)

**Rationale:**
- Cohortix will stream ally activity in real-time
- SSE works with Vercel Edge Functions
- Pattern proven in NeuroEngine's chat interface

**Implementation Notes:**
```typescript
// SSE event types for Cohortix
type SSEEvent = 
  | { type: 'ally.deployed'; allyId: string; missionId: string }
  | { type: 'ally.progress'; message: string; progress: number }
  | { type: 'ally.log'; level: 'info' | 'warn' | 'error'; content: string }
  | { type: 'ally.accomplished'; result: MissionResult }
  | { type: 'ally.failed'; error: string }
  | { type: 'cost.update'; cost: CostUpdate };
```

---

## Planning & Process Decisions

### 11. Phase Checkpoints with Verification Lists

**Decision:** ✅ **ADOPT**

**Source:** `NeuroEngine/.planning/ROADMAP.md` (Phase 3/4 warnings, verification checklists)

**Rationale:**
- NeuroEngine identified Phase 3 as critical failure point (42% of RAG failures)
- Cohortix has similar inflection points:
  - Phase 2 (Ally Integration): Ally runtime abstraction must be correct
  - Phase 4 (Mission Control): UI complexity spike
  - Phase 6 (Intel Base): Embedding strategy must be correct

**Implementation Notes:**
- Create verification checklists for each phase
- Explicit "STOP and verify" gates before proceeding
- Document "failure rate" concepts for risky phases

---

### 12. Audit Rubric as Quality Gate Template

**Decision:** ✅ **ADOPT**

**Source:** `NeuroEngine/SENIOR_DEV_AUDIT_REPORT.md`, `AUDIT_FIXES_ACTION_PLAN.md`

**Rationale:**
- Audit format is comprehensive (10 categories, 100 points)
- Provides baseline quality bar
- Can be used for:
  - Pre-Phase-2 self-audit
  - Pre-launch readiness check
  - Team onboarding reference

**Implementation Notes:**
Create `docs/QUALITY_GATES.md` adapted for Cohortix:
- Security (secrets, auth, RLS)
- Testing (coverage, integration)
- Documentation (README, API docs)
- CI/CD (automated checks)
- Architecture (service layer, patterns)

---

## Decisions to SKIP

### 13. Marketplace/Monetization Architecture

**Decision:** ❌ **SKIP**

**Source:** `NeuroEngine/docs/TECHNICAL_SPEC.md` (NeuronMarket, Stripe Connect)

**Rationale:**
- Cohortix's marketplace is v3.0+ (far future)
- NeuroEngine's Neuron marketplace ≠ Cohortix's Ally marketplace
- Different economics:
  - NeuroEngine: Sell knowledge bases (content)
  - Cohortix: Rent allies (services)
- Premature to architect payment flows now

**Future Reference:**
- Save Stripe Connect patterns for when marketplace is in scope
- Ally rental model requires different billing (usage-based, not purchase)

---

### 14. GraphRAG / Knowledge Graph Architecture

**Decision:** ❌ **SKIP** (for now)

**Source:** `NeuroEngine/docs/TECHNICAL_SPEC.md` (Neo4j, entity extraction)

**Rationale:**
- Cohortix's intel base is simpler than NeuroEngine's
- Focus is operational (mission history, learnings), not semantic (entity relationships)
- pgvector is sufficient for MVP semantic search
- Neo4j adds operational complexity not justified by Cohortix's use case

**Future Reference:**
- Revisit if Cohortix needs:
  - Ally relationship graphs
  - Campaign dependency visualization
  - Complex intel reasoning

---

### 15. Content Ingestion Pipeline (Qdrant, Celery, chunking)

**Decision:** ❌ **SKIP**

**Source:** `NeuroEngine/docs/TECHNICAL_SPEC.md` (Phase 3: Content Ingestion)

**Rationale:**
- Cohortix doesn't ingest documents like NeuroEngine
- Intel entries come from:
  - Ally mission completion summaries
  - Manual human entries
  - Structured learnings (not PDFs/YouTube)
- Simpler pipeline: Mission complete → Extract learnings → Embed → Store

**Adaptation:**
- Use pgvector for semantic search
- Simple embedding on write (no chunking needed)
- Background jobs via Inngest (not Celery)

---

### 16. YouTube/PDF/Audio Processing

**Decision:** ❌ **SKIP**

**Source:** `NeuroEngine/docs/TECHNICAL_SPEC.md` (Phase 5: Advanced Ingestion)

**Rationale:**
- Not relevant to Cohortix's ally orchestration focus
- Intel comes from ally outputs, not external content
- If needed later, use third-party services (not custom pipeline)

---

### 17. Notion-like UI Aesthetic

**Decision:** ❌ **SKIP**

**Source:** Design system references in NeuroEngine

**Rationale:**
- Cohortix needs ops/console aesthetic, not content/notes aesthetic
- Focus on:
  - Status indicators (ally states, mission progress)
  - Data density (mission tables, activity feeds)
  - Alerting/monitoring (health dashboards)
- ClickUp/Linear are better reference points than Notion

---

## Implementation Priority

### Phase 1 (Immediate - Before Development Starts)

1. ✅ Planning structure (ROADMAP, STATE, PROJECT)
2. ✅ CI/CD setup (GitHub Actions)
3. ✅ Error taxonomy (implement in shared package)
4. ✅ Service layer architecture (establish patterns)

### Phase 2 (With MVP Development)

5. 🔄 Cursor pagination (implement with first list endpoints)
6. 🔄 Cost tracking schema (implement with ally integration)
7. 🔄 RLS-equivalent security (with multi-tenant features)

### Phase 3 (Post-MVP Enhancement)

8. 🔄 Design system formalization checkpoints
9. 🔄 SSE streaming (with real-time features)
10. 🔄 Quality gate audits (pre-launch)

---

## Cross-References

- **Devi's Analysis:** `docs/NEUROENGINE_ANALYSIS.md`
- **Planning Structure:** `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/PROJECT.md`
- **Quality Gates:** `docs/QUALITY_GATES.md` (to be created)
- **NeuroEngine Archives:** `archives/NeuroEngine/`

---

*This document will be updated as decisions are implemented or revised during development.*
