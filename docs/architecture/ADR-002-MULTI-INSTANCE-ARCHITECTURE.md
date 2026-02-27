# ADR-002: Multi-Instance Architecture — OpenClaw as Cohortix Engine

**Status:** Proposed **Date:** 2026-02-24 **Author:** Alim (CEO Agent) with
Ahmad Ashfaq (Founder) **Reviewers:** Ahmad Ashfaq, Idris (Architect)
**Related:** ADR-001 (AI Integration — Hybrid Phased Approach)

---

## 1. Executive Summary

Cohortix uses OpenClaw as its core AI engine, providing each user and
organization with isolated OpenClaw instances ("Cohorts") that power
agent-driven task execution, vision planning, and life aspiration tracking. This
ADR defines the multi-instance architecture, data ownership model, security
boundaries, agent-human collaboration patterns, context management strategy, and
marketplace model.

**Key Decision:** Every user gets a personal Cohort (isolated AI workspace) tied
to their user account — NOT to any organization. Organizations are optional and
created explicitly when users want to collaborate. Orgs can create additional
shared Cohorts. Users can bring their own hardware or use Cohortix-managed cloud
instances. Cohortix is the GUI — users never see the underlying engine.

**Branding Rule (Non-Negotiable):** The term "OpenClaw" MUST NEVER appear
anywhere in the Cohortix product UI, marketing, or user-facing documentation.
Users see "Cohort" (their AI workspace). OpenClaw is the internal engine —
referenced only in technical architecture docs like this ADR. In code, use
abstractions like `CohortEngine`, `CohortRuntime`, never `OpenClawClient`.

---

## 2. Context & Problem Statement

### 2.1 What is Cohortix?

Cohortix is a life-and-work operating system built on the PPV (Purpose → Vision
→ Mission → Operation → Task) hierarchy. Users define life aspirations
(Visions), break them into achievable goals (Missions), plan work (Operations),
and execute (Tasks). AI agents assist at every level — from suggesting missions
to executing tasks autonomously.

### 2.2 What is OpenClaw?

OpenClaw is an open-source AI agent platform that provides:

- Multi-agent orchestration with isolated workspaces
- Session and memory management
- Tool/skill extensibility
- Gateway API for programmatic control
- Docker containerization support
- `--profile` flag for instance isolation
- Node pairing for remote hardware

### 2.3 The Problem

Cohortix needs AI agents that:

1. Execute tasks assigned by humans (code, research, design, writing)
2. Assist in planning (suggest missions, break down operations)
3. Collaborate with humans via comments and tagging
4. Maintain context across sessions without bloat
5. Stay isolated between users and organizations (security)
6. Scale from a solo user to a 500-person enterprise

No existing PM tool offers this. We're building it with OpenClaw as the engine.

### 2.4 Design Constraints

- Must support multi-tenant SaaS (orgs with multiple users)
- Personal data must be invisible to org admins
- Agent context must be scoped — no cross-Cohort data leakage
- Must support both cloud-hosted and self-hosted (BYOH) instances
- Must be cost-efficient at scale (idle instances shouldn't burn money)
- Must integrate with existing Cohortix stack (Next.js 14, Supabase, Clerk,
  Drizzle)

---

## 3. Decision

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    COHORTIX                          │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Next.js  │  │ Supabase │  │ Clerk Auth       │  │
│  │ Frontend │  │ Backend  │  │ (Users + Orgs)   │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │              │                 │            │
│       └──────────────┼─────────────────┘            │
│                      │                              │
│              ┌───────┴────────┐                     │
│              │ Orchestration  │                     │
│              │ Layer          │                     │
│              └───────┬────────┘                     │
└──────────────────────┼──────────────────────────────┘
                       │
          ┌────────────┼────────────────┐
          │            │                │
    ┌─────┴─────┐ ┌───┴─────┐  ┌──────┴──────┐
    │ Ahmad's   │ │ Sarah's │  │ Acme Corp   │
    │ Personal  │ │ Personal│  │ Engineering │
    │ Cohort    │ │ Cohort  │  │ (Shared)    │
    │           │ │         │  │ Cohort      │
    │ OpenClaw  │ │ OpenClaw│  │ OpenClaw    │
    │ Instance  │ │ Instance│  │ Instance    │
    └───────────┘ └─────────┘  └─────────────┘
```

### 3.2 Cohort Types

| Cohort Type                        | Created By       | Hosted On           | Accessible To                        | Purpose                                 |
| ---------------------------------- | ---------------- | ------------------- | ------------------------------------ | --------------------------------------- |
| **Personal**                       | Auto (on signup) | Cloud or BYOH       | Only the user                        | Personal visions, goals, private agents |
| **Shared**                         | Org admin        | Cloud or BYOH       | Assigned org members                 | Team collaboration, shared operations   |
| **BYOH (Bring Your Own Hardware)** | User             | User's Mac/Linux/Pi | Depends on type (personal or shared) | Data sovereignty, power users           |

**Critical: Personal Cohorts are USER-level, not org-level.** A user who belongs
to 3 organizations still has exactly ONE personal Cohort. It travels with them.
It is not inside any organization. Shared Cohorts belong to organizations;
personal Cohorts belong to users.

```
User: Ahmad
├── Personal Cohort (ONE, global, tied to user_id)
│   └── Personal visions, agents, knowledge — always accessible
│
├── Member of "Acme Corp" org
│   └── Can access: Acme Engineering Cohort (shared), Acme Marketing Cohort (shared)
│
├── Member of "Filmzya" org
│   └── Can access: Filmzya Production Cohort (shared)
│
└── No org needed to start using Cohortix
    └── Solo users just have their personal Cohort
    └── Creating an org is an explicit later action
```

**Signup Flow (No Org Required):**

1. User signs up via Clerk (email/social login)
2. Cohortix auto-provisions personal Cohort
3. User starts using Cohortix immediately (personal visions, tasks, agents)
4. Later: User goes to Settings → "Create Organization" when they want to
   collaborate
5. Org admin creates shared Cohorts and invites members
6. Invited users keep their existing personal Cohort, gain access to shared ones

### 3.3 Clone Foundation (First Agent = Your AI Clone)

Every user's first agent is their **Clone** — an AI version of themselves that
learns who they are, how they think, and what they care about.

**Onboarding Flow:**

```
1. User signs up → personal Cohort provisioned
2. First screen: "Let's create your Clone"
   ├── Name your Clone (default: first name + "AI")
   ├── Quick personality quiz (5-10 questions)
   │   ├── "How do you make decisions?" (gut / data / consensus)
   │   ├── "What matters most to you?" (select 3-5 values)
   │   ├── "What's your communication style?" (direct / diplomatic / detailed)
   │   └── "What are you working toward?" (free text → first Vision)
   └── Clone created with initial identity foundation
3. Starter tasks assigned (onboarding kit):
   ├── "Tell your Clone about your background" (builds expertise profile)
   ├── "Share your first Vision" (starts PPV hierarchy)
   └── "Assign your Clone its first task" (teaches the interaction model)
```

**Clone Identity Structure (stored in Cohort engine workspace):**

```
clone-foundation/
├── identity.md        — Who the user is (bio, role, background)
├── values.md          — What matters most to them
├── decision-making.md — How they think and decide
├── expertise.md       — What they know deeply
├── communication.md   — How they prefer to interact
└── aspirations.md     — Long-term goals (feeds into Visions)
```

The Clone evolves over time:

- User conversations update the foundation automatically
- Clone learns preferences from task interactions
- Correction events refine the Clone's understanding
- Users can manually edit any foundation file via the UI

**Why this matters:** The Clone is what makes Cohortix personal. It's not a
generic AI assistant — it's YOUR AI that knows YOU. This is the emotional hook
that drives retention and the foundation for meaningful Vision/Mission planning.

### 3.4 Hosting Models

**Managed Cloud (Default)**

- Cohortix provisions a Docker container per Cohort
- Infrastructure: Fly.io Machines (auto-sleep when idle, wake on request)
- Cost: ~$2-5/mo idle, ~$10-15/mo active per instance
- Zero setup for users

**Self-Hosted (BYOH)**

- User installs OpenClaw on their own hardware
- Connects to Cohortix via secure WebSocket (outbound only, no port forwarding)
- Tailscale/WireGuard for private networking
- User provides a connection token generated in Cohortix settings
- Health monitoring via periodic ping from Cohortix

**Hybrid**

- Mix of managed and self-hosted Cohorts within one org
- Example: Personal Cohorts on cloud, Engineering shared Cohort on company
  server

### 3.5 Instance Lifecycle

```
User signs up
    │
    ├── Clerk creates user + org
    ├── Cohortix provisions personal Cohort (cloud container)
    ├── OpenClaw Gateway starts, agents initialized
    └── User lands on dashboard — Cohort ready

Admin creates shared Cohort
    │
    ├── Choose: Cloud or "Connect my hardware"
    ├── If cloud → provision container, assign to org
    ├── If BYOH → generate connection token, user installs + connects
    ├── Admin assigns members
    └── Shared agents become available to members

User leaves org
    │
    ├── Personal Cohort → stays with user (untouched)
    ├── Shared Cohort access → revoked immediately
    ├── Tasks assigned to user → unassigned (admin reassigns)
    └── Contributions (comments, completed tasks) → preserved (audit trail)
```

---

## 4. Data Ownership Model

### 4.1 Scope Types

Every piece of data in Cohortix has an explicit scope:

```sql
scope_type ENUM('personal', 'cohort', 'org')
scope_id   UUID  -- references user_id, cohort_id, or org_id
```

| Data Type       | Scope                  | Visible To      | Example                     |
| --------------- | ---------------------- | --------------- | --------------------------- |
| Personal Vision | `personal` / `user_id` | Only that user  | "Retire by 45"              |
| Shared Mission  | `cohort` / `cohort_id` | Cohort members  | "Launch MVP by Q2"          |
| Org Vision      | `org` / `org_id`       | All org members | "Build the future of AI PM" |
| Personal Task   | `personal` / `user_id` | Only that user  | "Research K8s certs"        |
| Shared Task     | `cohort` / `cohort_id` | Cohort members  | "Review PR #42"             |

### 4.2 Database Schema (Scope Columns)

```sql
-- Visions table (existing, add scope)
ALTER TABLE visions ADD COLUMN scope_type VARCHAR(20) NOT NULL DEFAULT 'personal';
ALTER TABLE visions ADD COLUMN scope_id UUID NOT NULL;

-- Missions table
ALTER TABLE missions ADD COLUMN scope_type VARCHAR(20) NOT NULL DEFAULT 'personal';
ALTER TABLE missions ADD COLUMN scope_id UUID NOT NULL;

-- Operations table (already has organization_id, add cohort_id)
ALTER TABLE projects ADD COLUMN cohort_id UUID REFERENCES cohorts(id);

-- Tasks table (add cohort_id)
ALTER TABLE tasks ADD COLUMN cohort_id UUID REFERENCES cohorts(id);

-- New: Cohorts table
CREATE TABLE cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,  -- NULL for personal cohorts
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('personal', 'shared')),
    hosting VARCHAR(20) NOT NULL CHECK (hosting IN ('managed', 'self_hosted')),
    owner_user_id UUID REFERENCES users(id),  -- Set for personal cohorts, NULL for shared
    gateway_url TEXT,           -- Internal engine endpoint (never exposed to UI)
    auth_token_hash TEXT,       -- Hashed connection token
    status VARCHAR(20) DEFAULT 'provisioning',
    hardware_info JSONB,        -- For BYOH: { os, arch, ram, model }
    last_heartbeat TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints: personal = user-owned, shared = org-owned
    CONSTRAINT personal_has_user CHECK (
        (type = 'personal' AND owner_user_id IS NOT NULL AND organization_id IS NULL)
        OR (type = 'shared' AND organization_id IS NOT NULL)
    ),
    -- Each user gets exactly ONE personal cohort
    CONSTRAINT one_personal_per_user UNIQUE (owner_user_id)
        WHERE (type = 'personal')  -- Partial unique index
);

-- Cohort membership
CREATE TABLE cohort_members (
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (cohort_id, user_id)
);
```

### 4.3 Row-Level Security Policies

```sql
-- Personal scope: only the owner
CREATE POLICY personal_visions ON visions
    FOR ALL USING (
        scope_type = 'personal' AND scope_id = auth.uid()
    );

-- Cohort scope: only cohort members
CREATE POLICY cohort_visions ON visions
    FOR ALL USING (
        scope_type = 'cohort' AND scope_id IN (
            SELECT cohort_id FROM cohort_members WHERE user_id = auth.uid()
        )
    );

-- Org scope: all org members
CREATE POLICY org_visions ON visions
    FOR ALL USING (
        scope_type = 'org' AND scope_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );
```

### 4.4 Cross-Cohort Aggregation ("My Tasks" View)

Users see tasks from all their Cohorts in one view:

```sql
-- My Tasks: aggregate across all accessible scopes
SELECT t.*, p.name as operation_name, c.name as cohort_name
FROM tasks t
JOIN projects p ON t.operation_id = p.id
LEFT JOIN cohorts c ON t.cohort_id = c.id
WHERE t.assignee_id = auth.uid()
ORDER BY t.due_date ASC;
```

The "My Tasks" page groups by source:

```
My Tasks
├── Personal
│   └── "Research K8s certifications"
├── Engineering (shared Cohort)
│   └── "Review PR #42"
└── Marketing (shared Cohort)
    └── "Write blog post"
```

### 4.5 Hard Boundaries (Non-Negotiable)

| Boundary             | Rule                                                 | Enforcement                               |
| -------------------- | ---------------------------------------------------- | ----------------------------------------- |
| Personal → Anyone    | Never accessible to other users, INCLUDING org admin | RLS: `scope_id = auth.uid()`              |
| Personal → Shared    | Clone/reference only, explicit user consent required | Application logic + UI confirmation       |
| Shared → Members     | Only assigned Cohort members can access              | RLS: `cohort_members` join                |
| Agent → Cross-Cohort | Agent NEVER receives data from other Cohorts         | Orchestration layer scoping               |
| Admin → Personal     | Admin manages shared Cohorts, NOT personal ones      | RLS + no admin override on personal scope |
| User leaves org      | Personal Cohort stays, shared access revoked         | Cascade delete on `cohort_members`        |

---

## 5. Agent-Human Collaboration Model

### 5.1 How Agents and Humans Interact

Agents are first-class participants in Cohortix. They can be assigned tasks,
mentioned in comments, and produce deliverables — just like human team members.

```
Task: "Write API documentation"
├── Assigned to: DocBot (AI Agent)
├── Status: In Progress
│
├── Comment [DocBot]: "I've drafted the auth endpoints documentation.
│   @Ahmad please review the security section."
│
├── Comment [Ahmad]: "Looks good, but add rate limiting details.
│   @DocBot update section 3."
│
├── Comment [DocBot]: "Updated. Added rate limit headers and
│   429 response examples. Ready for final review."
│
└── Comment [Ahmad]: ✅ Approved. Marking as complete.
```

### 5.2 Mention System

```
@AgentName  → Routes to agent via Cohortix → OpenClaw session
@UserName   → Standard notification to human user
@Everyone   → Notifies all Cohort members (humans only, not agents)
```

When a human mentions an agent:

1. Cohortix creates or resumes an OpenClaw session for that Task
2. Injects scoped context (see Section 6)
3. Agent processes the request
4. Response is written back as a comment on the Task
5. Session sleeps when interaction completes

### 5.3 Agent Capabilities Per Role

| Action                  | Agent Can Do    | Requires Human Approval |
| ----------------------- | --------------- | ----------------------- |
| Read tasks/operations   | ✅ Always       | No                      |
| Comment on tasks        | ✅ Always       | No                      |
| Create subtasks         | ✅ If permitted | Configurable per Cohort |
| Update task status      | ✅ If permitted | Configurable            |
| Create operations       | ❌ Default off  | Yes (admin setting)     |
| Delete anything         | ❌ Never        | Always requires human   |
| Access external APIs    | ❌ Default off  | Yes (tool permissions)  |
| Modify visions/missions | ❌ Never        | Always requires human   |

### 5.4 Proactive Agent Behavior

Agents don't just respond — they proactively assist:

```
Cron: Every morning at 9 AM
├── Agent checks assigned tasks for the day
├── Posts status update: "3 tasks in progress, 1 blocked (waiting on design review)"
├── Flags overdue tasks: "Task 'Write tests' was due yesterday"
└── Suggests: "Operation 'Backend API' is 80% complete. Want me to draft the release notes?"

Cron: Weekly rollup
├── Agent summarizes each Operation's progress
├── Updates Mission health status (on_track / at_risk / critical)
└── Posts to org-wide channel: "Weekly progress: 2 missions on track, 1 at risk"
```

---

## 6. Context Management Strategy

### 6.1 The Problem

AI agents have limited context windows. A Cohort might have hundreds of tasks,
dozens of operations, and years of history. Dumping everything into context =
hallucination, slow responses, and wasted tokens.

### 6.2 Scoped Context Injection

When an agent is invoked (via mention, task assignment, or cron), Cohortix
injects ONLY relevant context:

**For a Task-level interaction:**

```
Injected:
  ✅ Task: title, description, status, assignee, due date
  ✅ Task comments: recent 20 (with authors)
  ✅ Parent Operation: name, description, status, health
  ✅ Parent Mission: name, goal (1-2 sentences)
  ✅ Parent Vision: title only (1 line)

NOT injected:
  ❌ Other tasks in the operation
  ❌ Other operations in the mission
  ❌ Other missions/visions
  ❌ Other Cohorts' data
  ❌ Other users' personal data
```

**Rule: Inject vertically (parent chain), not horizontally (siblings).**

**For an Operation-level status check:**

```
Injected:
  ✅ Operation: full details
  ✅ All tasks in operation: title, status, assignee, due date (summary)
  ✅ Parent Mission: name, goal
  ✅ Recent activity: last 10 comments across tasks

NOT injected:
  ❌ Full task descriptions (just titles + status)
  ❌ Other operations
  ❌ File contents
```

### 6.3 OpenClaw Memory Layer

Each Cohort's OpenClaw instance maintains persistent memory:

```
~/.openclaw-<cohort-id>/
├── MEMORY.md          → Long-term curated knowledge
├── memory/
│   ├── 2026-02-24.md  → Daily activity log
│   ├── decisions/     → Key decisions made
│   ├── lessons/       → Patterns learned
│   └── people/        → User preferences and working styles
```

**What goes in memory (persists across sessions):**

- User preferences: "Ahmad prefers bullet points over paragraphs"
- Decisions: "We chose Supabase over Firebase because..."
- Patterns: "Operations with >20 tasks should be split"
- Agent learnings: "Code reviews catch more bugs when tests are written first"

**What does NOT go in memory (stays in Supabase):**

- Task details (query fresh each time)
- Operation status (query fresh)
- Comments (query fresh)
- Files and assets

### 6.4 Session Management

Each interaction = one OpenClaw session. Sessions are scoped to a specific
context:

```
Session: task-<task_id>-<interaction_id>
├── Created when agent is mentioned on a task
├── Context: task + parent chain (see 6.2)
├── Persists for the duration of the conversation thread
├── Sleeps when no activity for 30 minutes
└── Resumes if agent is mentioned again on same task

Session: operation-status-<operation_id>
├── Created by cron for status rollups
├── Context: operation + all task summaries
├── One-shot: runs, reports, terminates
└── No persistent conversation
```

### 6.5 Knowledge Hub Architecture

Every Cohort has a Knowledge Hub — a structured, searchable repository of
everything learned by agents and contributed by humans within that Cohort.

#### 6.5.1 Knowledge Types

| Knowledge Type       | Owner            | Stored In                                           | Searchable By                                               |
| -------------------- | ---------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| **Agent Memory**     | Individual agent | OpenClaw `MEMORY.md` + `memory/`                    | That agent only (auto-recalled)                             |
| **Agent Expertise**  | Individual agent | OpenClaw `expertise/` folders                       | That agent + Cohort members (read-only UI)                  |
| **Agent Lessons**    | Individual agent | OpenClaw `memory/lessons/`                          | That agent + Cohort members (read-only UI)                  |
| **Agent Decisions**  | Individual agent | OpenClaw `memory/decisions/`                        | That agent + Cohort members (read-only UI)                  |
| **User Notes**       | Individual user  | Supabase `knowledge_items` table                    | Only that user (personal Cohort) or Cohort members (shared) |
| **Cohort Knowledge** | Shared Cohort    | Supabase `knowledge_items` + OpenClaw shared memory | All Cohort members + Cohort agents                          |
| **Org Knowledge**    | Organization     | Supabase `knowledge_items`                          | All org members                                             |

#### 6.5.2 OpenClaw Memory Stack (The Foundation)

Cohortix does NOT build a separate knowledge system. It wraps OpenClaw's
existing three-layer memory stack in a visual UI:

**Layer 1: OpenClaw Built-in Memory (File-based)**

```
~/.openclaw-<cohort-id>/
├── MEMORY.md              → Curated long-term knowledge (agent-maintained)
├── memory/
│   ├── YYYY-MM-DD.md      → Daily activity logs (append-only)
│   ├── lessons/           → Reusable learnings (searchable)
│   ├── decisions/         → Key decisions with rationale
│   └── people/            → User preferences and working styles
```

- **Search:** `memory_search` — semantic search over all markdown files
- **Recall:** `memory_get` — pull specific lines from memory files
- **Strengths:** Zero-cost storage, human-readable, git-friendly, auto-loaded
  into agent context
- **Use for:** Session continuity, curated knowledge, daily logs, structured
  learnings

**Layer 2: Mem0 (Auto-Deduplicating Agent Memory)**

```
CLI: /Users/alimai/bin/mem0-memory
├── search "query" --agent <agent-id>   → Find relevant memories
├── add "fact" --agent <agent-id>       → Store new knowledge
└── Auto-deduplication: newer facts update older ones
```

- **Strengths:** LLM-based fact extraction, automatic dedup, per-agent scoping
- **Use for:** Evolving facts ("user prefers X" → later "user now prefers Y"),
  conversational memory that self-maintains, cross-session insights
- **Each Cohort's agents get their own Mem0 scope** — agent ID includes Cohort
  ID for isolation

**Layer 3: Cognee (Knowledge Graph)**

```
CLI: /Users/alimai/bin/cognee-memory
├── search "query"    → Semantic search + graph traversal
├── add "content"     → Extract entities and relationships
└── Graph: concepts ←→ relationships ←→ entities
```

- **Strengths:** Entity relationships, concept mapping, graph-powered discovery
- **Use for:** "How does X relate to Y?", structured domain knowledge, expertise
  mapping
- **Each Cohort gets its own Cognee graph** — no cross-Cohort traversal

**Layer 4: QMD (Document Search + Vector Embeddings)**

```
CLI: /Users/alimai/.bun/bin/qmd
├── collection add [path] --name <name>  → Index a document collection
├── query "search term"                   → Combined BM25 + vector + reranking
├── vsearch "query"                       → Pure vector similarity search
├── search "query"                        → Full-text BM25 search
└── mcp                                   → MCP server for agent integration
```

- **Strengths:** Local-first (no API calls), hybrid search (BM25 + embeddings +
  reranking), document collections, line-level precision
- **Models:** embeddinggemma-300M (embedding), qwen3-reranker-0.6b (reranking),
  Qwen3-0.6B (generation) — all local
- **Use for:** Searching across large document sets (specs, guides, codebases),
  retrieving specific sections with line numbers, powering "search across all
  project docs"
- **Each Cohort has its own QMD index** — isolated document collections per
  Cohort

**How the four layers work together:**

```
Agent completes a task
    │
    ├── OpenClaw memory: logs to memory/YYYY-MM-DD.md (daily log)
    │   └── If reusable lesson → memory/lessons/
    │   └── If key decision → memory/decisions/
    │
    ├── Mem0: extracts key facts automatically
    │   └── "This codebase uses Drizzle ORM, not Prisma"
    │   └── Auto-deduplicates with existing memories
    │
    └── Cognee: builds knowledge graph relationships
        └── Node: "Drizzle ORM" → connects to → "PostgreSQL", "TypeScript", "Supabase"
        └── Enables: "What do we know about our database stack?" (graph query)
```

**Cohortix Knowledge Hub = UI for all three layers:**

```
Knowledge Hub UI
├── Search bar → queries ALL three layers simultaneously
│   ├── OpenClaw memory_search (semantic over markdown)
│   ├── Mem0 search (fact recall)
│   └── Cognee search (graph + semantic)
│   └── Results merged, deduplicated, ranked by relevance
│
├── Browse by Agent
│   ├── Agent's MEMORY.md (rendered as rich text)
│   ├── Agent's lessons (filterable list)
│   ├── Agent's decisions (timeline view)
│   ├── Agent's Mem0 facts (searchable list)
│   └── Agent's knowledge graph (visual node map via Cognee)
│
├── Browse by Topic
│   └── Cognee graph visualization — explore concepts and relationships
│
└── Contribute
    ├── Add note (human → stored in Supabase + optionally pushed to Cognee)
    ├── Correct agent memory (human edits → updates Mem0/MEMORY.md)
    └── Pin important knowledge (bookmarks for quick access)
```

#### 6.5.3 Agent Knowledge Lifecycle

Agents continuously learn — just like our Axon agents do today:

```
Agent executes task
    │
    ├── Encounters error → lesson in OpenClaw memory/lessons/
    ├── Makes a decision → logged in memory/decisions/
    ├── Learns user preference → Mem0 auto-extracts and stores
    ├── Discovers domain relationship → Cognee builds graph edge
    ├── Develops expertise → updates expertise/ folder
    └── Daily summary → memory/YYYY-MM-DD.md

Over time, agent becomes:
    ├── Better at tasks (Mem0 recalls past solutions)
    ├── Aware of team patterns (memory preferences)
    ├── A searchable knowledge repository (all four layers via UI)
    ├── Connected to domain concepts (Cognee graph)
    └── A document expert (QMD indexes all project docs for retrieval)
```

**In Cohortix UI, this surfaces as:**

```
Agent Profile: "Devi (Backend Dev)"
├── Overview: Role, skills, assigned tasks
├── Knowledge Tab:
│   ├── Learnings: "Use batch inserts for >100 rows" (OpenClaw lesson)
│   ├── Decisions: "Chose Drizzle over Prisma because..." (OpenClaw decision)
│   ├── Facts: "Codebase has 47 API endpoints" (Mem0)
│   ├── Expertise Graph: PostgreSQL ←→ Supabase ←→ RLS (Cognee visualization)
│   └── Activity: Recent daily logs (OpenClaw memory/)
└── Settings: Permissions, model, tools
```

#### 6.5.4 Agent Evolution Tracking

Every learning event is tracked with metadata so Cohortix can show **when**,
**what**, and **from where** an agent learned.

**Evolution Event Schema:**

```sql
CREATE TABLE agent_evolution_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) NOT NULL,  -- OpenClaw agent identifier

    -- What happened
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN (
        'learning',      -- Agent learned something new
        'correction',    -- Human corrected the agent
        'decision',      -- Agent made/recorded a decision
        'expertise_gain', -- Expertise score increased
        'self_reflection' -- Self-evolution loop finding
    )),

    -- The knowledge
    title VARCHAR(500) NOT NULL,       -- "RLS needs explicit policy per scope"
    description TEXT,                   -- Detailed explanation

    -- Where it came from
    source_type VARCHAR(30) NOT NULL CHECK (source_type IN (
        'task_execution',   -- Learned while doing a task
        'human_correction', -- Human said "actually..."
        'self_evolution',   -- Weekly self-review / reflection loop
        'agent_collaboration', -- Learned from another agent in same Cohort
        'knowledge_import'  -- Imported from marketplace/shared knowledge
    )),
    source_task_id UUID REFERENCES tasks(id),  -- NULL if not from a task
    source_user_id UUID,                        -- Who corrected (if human_correction)

    -- Expertise tracking
    expertise_area VARCHAR(100),       -- e.g., "PostgreSQL", "React", "API Design"
    expertise_before SMALLINT,         -- Score before (0-100)
    expertise_after SMALLINT,          -- Score after (0-100)

    -- Storage references (where the knowledge was persisted)
    memory_ref TEXT,     -- OpenClaw memory file path (e.g., "memory/lessons/2026-02-24-rls.md")
    mem0_ref TEXT,       -- Mem0 memory ID
    cognee_ref TEXT,     -- Cognee entity/relationship ID

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for timeline queries
CREATE INDEX evolution_agent_time_idx ON agent_evolution_events(cohort_id, agent_id, created_at DESC);

-- Index for source analysis
CREATE INDEX evolution_source_idx ON agent_evolution_events(source_type, created_at DESC);

-- RLS: same Cohort scoping
CREATE POLICY cohort_evolution ON agent_evolution_events
    FOR ALL USING (cohort_id IN (
        SELECT cohort_id FROM cohort_members WHERE user_id = auth.uid()
    ));
```

**How events are captured:**

```
Task-based learning:
  Agent completes task → self-improvement protocol triggers →
  Logs lesson/decision to OpenClaw memory →
  Cohortix webhook receives event →
  Creates agent_evolution_events row with source_task_id

Human correction:
  Human comments "@Devi actually, use X not Y" →
  Agent processes correction → updates Mem0 →
  Logs correction event with source_user_id

Self-evolution loop (cron):
  Weekly cron triggers agent self-review →
  Agent analyzes past week's tasks →
  Identifies patterns, updates expertise scores →
  Logs self_reflection events with before/after scores

Agent collaboration:
  Agent reads shared Cohort knowledge →
  Incorporates into own context →
  Logs knowledge_import event
```

**Cohortix UI — Agent Evolution Dashboard:**

```
┌─────────────────────────────────────────────────┐
│ Agent: Devi (Backend Dev)              [Active] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Evolution Timeline                    [Filter] │
│  ─────────────────                              │
│  Today                                          │
│  🧠 Learned: "RLS needs explicit policy..."     │
│     └─ From: Task #47 "Fix RLS policies"        │
│  ⚠️ Corrected: "batch_size 500, not 1000"       │
│     └─ From: Ahmad (comment on Task #43)        │
│                                                 │
│  Yesterday                                      │
│  🧠 Learned: "Use JSONB for flexible columns"   │
│     └─ From: Task #45                           │
│  📝 Decision: "UUID over serial for new PKs"    │
│     └─ From: Self-reflection (pattern in 5 tasks)│
│                                                 │
├─────────────────────────────────────────────────┤
│  Learning Sources          Expertise Growth     │
│  ┌──────────┐             ┌──────────────┐      │
│  │ ████ 60% │ Tasks       │ PostgreSQL 78%│ ↑6  │
│  │ ██   25% │ Self-review │ Drizzle    65%│ ↑4  │
│  │ █    10% │ Corrections │ Supabase   70%│ ↑8  │
│  │ ▪     5% │ Collab      │ API Design 55%│ new │
│  └──────────┘             └──────────────┘      │
│                                                 │
│  This month: +34 learnings │ Correction rate: 4%│
└─────────────────────────────────────────────────┘
```

**Correction rate** is a key metric — it shows how often humans need to correct
the agent. A decreasing correction rate = agent is genuinely improving. This is
visible to Cohort members and gives confidence that agents are trustworthy.

#### 6.5.5 Knowledge Segmentation Rules

Each Cohort's OpenClaw instance has its own isolated memory stack:

```
Personal Cohort (Ahmad's)
├── OpenClaw memory/     → ONLY Ahmad's agents recall this
├── Mem0 scope           → --agent <personal-cohort-agent-id> (isolated)
├── Cognee graph         → Separate graph instance, personal context only
├── User's personal notes → ONLY Ahmad (Supabase, personal scope)
└── Nothing flows out without explicit user action

Shared Cohort (Engineering)
├── OpenClaw memory/     → Shared agents recall this, members browse via UI
├── Mem0 scope           → --agent <shared-cohort-agent-id> (isolated to Cohort)
├── Cognee graph         → Shared graph, Cohort-scoped entities
├── Team notes/wiki      → All Cohort members (Supabase, cohort scope)
└── Agents learn from shared context, NOT from members' personal Cohorts

Org-wide Knowledge
├── Supabase knowledge_items (org scope) → All org members
├── Curated exports from Cohort graphs   → Admin-reviewed before publishing
├── No direct Mem0/Cognee access         → Org knowledge is explicit, not auto-extracted
└── Curated by org admin
```

**Key isolation rule:** Each Cohort's Mem0 and Cognee instances are scoped by
Cohort ID. An agent in the Engineering Cohort calling
`mem0-memory search "database"` will ONLY get results from Engineering's memory,
never from Ahmad's personal Cohort or Marketing's Cohort. This is enforced by
the `--agent` flag scoping in Mem0 and separate graph namespaces in Cognee.

#### 6.5.6 Knowledge Sharing Mechanisms

**Within a Cohort (automatic):**

- Agents in a shared Cohort naturally learn from the work they do there
- Their memory and expertise grow organically within that Cohort's scope
- All Cohort members can browse agent knowledge via the Knowledge Hub UI

**Personal → Shared Cohort (explicit, user-initiated):**

```
User action: "Share this note with Engineering Cohort"
    │
    ├── Note is COPIED (not linked) to shared Cohort knowledge
    ├── Original stays in personal Cohort
    ├── No ongoing sync — it's a snapshot
    └── User can update shared copy independently
```

**Agent knowledge sharing (template-based):**

When an agent template is shared/cloned between Cohorts:

- **Config + skills** → copied (this is the template)
- **Memory + expertise** → NOT copied (starts fresh)
- **Rationale:** Memory contains context-specific learnings that may include
  sensitive data from the source Cohort

**Optional: Curated knowledge export:**

```
Admin action: "Export Devi's PostgreSQL expertise to Org Knowledge"
    │
    ├── Admin selects specific knowledge entries to export
    ├── Entries are reviewed (no sensitive task data included)
    ├── Exported to Org Knowledge base
    └── Available to all org members and their agents
```

#### 6.5.7 Knowledge Hub Database Schema

```sql
-- Knowledge items (user-contributed notes, wiki entries)
CREATE TABLE knowledge_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_type VARCHAR(20) NOT NULL,  -- 'personal', 'cohort', 'org'
    scope_id UUID NOT NULL,
    cohort_id UUID REFERENCES cohorts(id),

    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'note',  -- note, wiki, decision, lesson, reference
    tags TEXT[] DEFAULT '{}',

    created_by_type VARCHAR(20) NOT NULL,  -- 'human', 'agent'
    created_by_id UUID NOT NULL,

    source_type VARCHAR(50),  -- 'manual', 'agent_memory', 'agent_lesson', 'imported'
    source_ref TEXT,           -- reference to original (e.g., memory file path)

    is_pinned BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX knowledge_items_search_idx ON knowledge_items
    USING gin(to_tsvector('english', title || ' ' || content));

-- Scope + type index for filtered queries
CREATE INDEX knowledge_items_scope_idx ON knowledge_items(scope_type, scope_id, content_type);

-- RLS policies (same pattern as other scoped tables)
CREATE POLICY personal_knowledge ON knowledge_items
    FOR ALL USING (scope_type = 'personal' AND scope_id = auth.uid());

CREATE POLICY cohort_knowledge ON knowledge_items
    FOR ALL USING (scope_type = 'cohort' AND scope_id IN (
        SELECT cohort_id FROM cohort_members WHERE user_id = auth.uid()
    ));

CREATE POLICY org_knowledge ON knowledge_items
    FOR ALL USING (scope_type = 'org' AND scope_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));
```

#### 6.5.8 Knowledge Hub UI

```
Knowledge Hub (in sidebar navigation)
│
├── My Knowledge (personal Cohort)
│   ├── My Notes
│   ├── My Agents' Learnings (browse agent memory/expertise)
│   └── Saved Items (bookmarked from shared/org)
│
├── [Cohort Name] Knowledge (per shared Cohort)
│   ├── Team Wiki
│   ├── Decisions Log
│   ├── Agent Insights (what agents have learned)
│   └── Shared Resources
│
└── Company Knowledge (org-wide)
    ├── Standards & Guidelines
    ├── Cross-team Insights
    └── Onboarding Materials
```

**Search spans all accessible scopes** — a user searching "PostgreSQL
optimization" would see results from their personal notes, their shared Cohorts'
agent learnings, and org-wide knowledge, with clear scope labels on each result.

### 6.6 Summarization Cascade

Progress rolls up through the hierarchy using summarization, not raw data:

```
Task level:    "8/10 subtasks complete, blocked on design review"
    ↑ summarize
Operation:     "Backend API: 🟢 On track (80% complete, 1 blocker)"
    ↑ summarize
Mission:       "Launch MVP: 🟡 At risk (2/3 operations on track, UI delayed)"
    ↑ summarize
Vision:        "Build profitable SaaS: 34% progress"
```

Each level gets a 1-3 sentence summary, not the raw data from below. This keeps
context lean at every level.

---

## 7. Cohortix as GUI for OpenClaw

### 7.1 Principle

Users never see OpenClaw. They never edit config files, run CLI commands, or
know the engine exists. Cohortix provides the visual interface for everything
OpenClaw offers.

### 7.2 Feature Mapping

| OpenClaw Capability            | Cohortix UI                                                 |
| ------------------------------ | ----------------------------------------------------------- |
| `openclaw agents add`          | "Create New Agent" form (name, role, personality, skills)   |
| `openclaw agents list`         | Agents page — card grid with status, activity               |
| `SOUL.md` / `AGENTS.md`        | Agent editor — rich text personality and behavior config    |
| `openclaw.json` providers      | Settings → API Keys — add/manage LLM provider keys          |
| `openclaw agents set-identity` | Agent profile — name, avatar, emoji picker                  |
| Skills in `~/.agents/skills/`  | Skills Marketplace — browse, install, toggle on/off         |
| `TOOLS.md`                     | Agent Permissions — checkboxes for what tools agent can use |
| `openclaw sessions`            | Activity Feed — see agent conversations and actions         |
| `openclaw cron`                | Scheduled Tasks — UI for creating recurring agent jobs      |
| `openclaw health`              | Cohort Dashboard — green/red status, uptime, resource usage |
| `openclaw gateway start/stop`  | Start/Stop Cohort — power button in settings                |
| `openclaw memory`              | Knowledge Base — view/edit agent memory and learnings       |

### 7.3 Complete Engine Feature Mapping (21 Systems)

The Cohort engine exposes 21 subsystems. Each needs a Cohortix GUI equivalent:

| #   | Engine System                                                    | Cohortix UI                                                | Priority | Phase |
| --- | ---------------------------------------------------------------- | ---------------------------------------------------------- | -------- | ----- |
| 1   | **Agents** (create, list, delete, identity, routing)             | Agents page — CRUD, profile editor, avatar, routing rules  | P0       | 1     |
| 2   | **Config** (21 sections: models, tools, bindings, session, etc.) | Settings pages — organized by category                     | P0       | 1     |
| 3   | **Skills** (152+ available, install/enable/disable)              | Skills Marketplace — browse, install, toggle               | P1       | 2     |
| 4   | **Plugins** (channel adapters, extensions)                       | Integrations page — enable/configure plugins               | P1       | 2     |
| 5   | **Cron** (scheduled jobs)                                        | Scheduled Tasks — create, edit, enable/disable, logs       | P1       | 2     |
| 6   | **Hooks** (boot-md, command-logger, etc.)                        | Advanced Settings — hook configuration                     | P2       | 3     |
| 7   | **Nodes** (device pairing, camera, canvas, invoke)               | Devices page — pair, manage, invoke commands               | P1       | 3     |
| 8   | **Channels** (Discord, Telegram, WhatsApp, etc.)                 | Connections page — connect/disconnect messaging platforms  | P2       | 3     |
| 9   | **Sessions** (conversation management)                           | Activity Feed — browse sessions, view history              | P0       | 1     |
| 10  | **Memory** (search, reindex)                                     | Knowledge Hub — search, browse, manage                     | P0       | 1     |
| 11  | **Sandbox** (Docker agent isolation)                             | Security Settings — sandbox config                         | P2       | 3     |
| 12  | **Browser** (managed browser for agents)                         | Agent Tools — browser access toggle                        | P2       | 3     |
| 13  | **Models** (discover, scan, configure LLM providers)             | AI Models page — add providers, set keys, assign to agents | P0       | 1     |
| 14  | **Gateway** (start/stop/health/status)                           | Cohort Dashboard — power toggle, health indicators         | P0       | 1     |
| 15  | **Security** (audits, config checks)                             | Security Audit page — run checks, view results             | P2       | 3     |
| 16  | **Approvals** (exec approval management)                         | Permissions page — approve/deny agent actions              | P1       | 2     |
| 17  | **DNS** (Tailscale + CoreDNS)                                    | Network Settings — discovery config (BYOH)                 | P2       | 3     |
| 18  | **Dashboard** (control UI)                                       | IS the Cohortix UI itself                                  | P0       | 1     |
| 19  | **Pairing** (secure DM pairing)                                  | Device Setup wizard                                        | P2       | 3     |
| 20  | **System** (events, heartbeat, presence)                         | System Status — events log, uptime                         | P1       | 2     |
| 21  | **Logs** (gateway file logs)                                     | Logs page — real-time log viewer with filters              | P1       | 2     |

**Phase 1 (P0):** 7 systems — enough for basic Cohort management **Phase 2
(P1):** 7 systems — skills, cron, channels, approvals **Phase 3 (P2):** 7
systems — advanced (sandbox, browser, DNS, security)

### 7.4 BYOH Bootstrap Package (Cohortix Compatibility Kit)

When a user connects their own hardware, their engine instance may not have the
required tools. Cohortix runs a compatibility check and offers automated
installation:

**Required Tools (must-have for Cohortix integration):**

| Tool                    | Purpose                            | Install Method                     | Size                     |
| ----------------------- | ---------------------------------- | ---------------------------------- | ------------------------ |
| **Mem0**                | Agent memory with auto-dedup       | `pip install mem0ai` + CLI wrapper | ~50MB                    |
| **Cognee**              | Knowledge graph                    | `pip install cognee` + CLI wrapper | ~100MB                   |
| **QMD**                 | Document search + embeddings       | `bun install -g qmd`               | ~500MB (includes models) |
| **Cohortix Agent Hook** | Webhook bridge to Cohortix backend | npm package                        | ~5MB                     |

**Optional Tools (enhanced features):**

| Tool           | Purpose                   | When Needed                       |
| -------------- | ------------------------- | --------------------------------- |
| **NeuroBits**  | Learning materials search | If using learning/course features |
| **Notion RAG** | Notion workspace search   | If Notion integration enabled     |
| **n8n**        | Workflow automation       | If using automation features      |

**Bootstrap Flow:**

```
1. User connects BYOH instance → Cohortix sends compatibility check request
2. Engine Gateway responds with installed tools list
3. Cohortix compares against required tools
4. If missing tools:
   a. Show user: "Your Cohort needs 2 additional tools to work with Cohortix"
   b. User clicks "Install" → Cohortix sends install commands via Gateway
   c. Progress bar shows installation
   d. Verification check confirms tools work
5. If all tools present: "Your Cohort is ready! ✅"
```

**Version Compatibility:**

- Cohortix maintains a compatibility matrix (engine version ↔ required tool
  versions)
- BYOH instances that fall behind get a notification: "Update available for your
  Cohort"
- Critical security updates can be flagged as mandatory

### 7.5 Technical Integration

Cohortix communicates with OpenClaw via the Gateway's WebSocket RPC interface:

```typescript
// Cohortix backend → OpenClaw Gateway
class CohortGatewayClient {
  constructor(
    private gatewayUrl: string,
    private authToken: string
  ) {}

  // Agent management
  async listAgents(): Promise<Agent[]>;
  async createAgent(config: AgentConfig): Promise<Agent>;
  async updateAgent(id: string, config: Partial<AgentConfig>): Promise<Agent>;
  async deleteAgent(id: string): Promise<void>;

  // Session management
  async sendMessage(sessionKey: string, message: string): Promise<Response>;
  async getSessionHistory(sessionKey: string): Promise<Message[]>;
  async listSessions(filters?: SessionFilters): Promise<Session[]>;

  // Health & monitoring
  async getHealth(): Promise<HealthStatus>;
  async getMetrics(): Promise<CohortMetrics>;

  // Cron management
  async listCronJobs(): Promise<CronJob[]>;
  async createCronJob(config: CronConfig): Promise<CronJob>;

  // Memory
  async searchMemory(query: string): Promise<MemoryResult[]>;
}
```

### 7.4 User Experience Flow

```
1. User signs up for Cohortix
2. Clerk creates user account + default org
3. Cohortix auto-provisions personal Cohort (cloud container)
4. User lands on dashboard — sees "Your AI Workspace is ready"
5. Guided setup: "Add your first agent" → agent creation form
6. User creates a Vision → AI suggests Missions
7. User creates Operations → AI breaks into Tasks
8. Tasks get assigned to humans and agents
9. Agents execute, comment, report — all visible in Cohortix UI
10. User never touches a terminal
```

---

## 8. Marketplace Model

### 8.1 What Gets Sold — Operational Systems (Not Just Agents)

The marketplace sells **complete operational systems** — living packages of
frameworks, agents, skills, and evolution loops that represent entire ways of
working.

**Evolution of the concept:**

- ❌ Old model: Individual agents or simple agent packs
- ✅ New model: Full operational systems — framework + agents + skills +
  evolution, continuously improving

**An Operational System includes:**

| Component           | What It Is                                  | Example (Axon Dev Codex)                                               |
| ------------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| **Framework**       | Methodology docs, standards, conventions    | 7 codex documents (core, backend, frontend, QA, DevOps, design, AI/ML) |
| **Agents**          | Pre-configured specialists with identities  | 14 agents (PM, Backend Dev, Frontend Dev, QA Engineer, etc.)           |
| **Skills**          | Agent capabilities mapped to roles          | 50+ skills (drizzle-orm, shadcn-ui, vitest, clerk, etc.)               |
| **Evolution Loops** | Cron jobs that keep agents learning         | Daily evolution, weekly reviews, self-improvement protocols            |
| **Conventions**     | Governance rules, file structure, workflows | AGENTS.md, CONVENTIONS.md, git workflow, PR templates                  |

**The key differentiator:** These are LIVING products. The agents evolve
through:

- Daily evolution cron loops (self-reflection and learning)
- Task-based learning (improving from every task they execute)
- Skill updates (new skills added, existing ones refined)
- Framework updates (methodology improves over time)

Buyers don't just get a static template — they get a system that keeps getting
better.

**Anyone can create and sell operational systems:**

```
Examples:
├── "Axon Dev Codex" — Full software development team + methodology
│   └── By: Axon (us) — 14 agents, 50+ skills, 7 framework docs
│
├── "Content Machine" — Content marketing operation
│   └── By: Marketing agency — Writer, Editor, SEO, Social agents + content strategy
│
├── "Legal Eagle" — Contract review and compliance workflow
│   └── By: Law firm — Reviewer, Analyst, Compliance agents + legal framework
│
├── "FitOS" — Personal training and nutrition coaching
│   └── By: Fitness coach — Trainer, Nutritionist, Accountability agents + programs
│
└── "Startup Launch Kit" — Idea to MVP operational system
    └── By: Accelerator — PM, Developer, Designer agents + lean startup framework
```

### 8.2 What Gets Sold (Detailed)

The marketplace offers **Agent Packs** — bundles of agent configurations,
skills, and roadmaps:

```
Marketplace Listing: "Axon Dev Codex"
├── Description: Full software development team (7 agents)
├── Includes:
│   ├── Agent Templates: PM, Frontend Dev, Backend Dev, QA, DevOps, Designer, AI Dev
│   ├── Skills: 7 skill packs (codex-core, codex-frontend, etc.)
│   ├── Roadmap Template: "Build a SaaS MVP" (pre-built operations + tasks)
│   └── Configuration: Inter-agent communication rules, escalation paths
├── Price: $49/mo or $399/yr
├── Reviews: ⭐ 4.8 (127 reviews)
└── Install: One-click → deploys into user's Cohort
```

### 8.3 Installation Flow

```
User clicks "Install" on marketplace
    │
    ├── Cohortix reads agent pack manifest
    ├── Validates compatibility with user's Cohort
    ├── Shows permission request: "This pack needs: task write, operation read"
    ├── User approves
    ├── Agent templates copied into Cohort's OpenClaw instance
    ├── Skills installed into instance workspace
    ├── Roadmap template available in "Templates" section
    └── Agents appear in user's Agents page, ready to assign tasks
```

### 8.4 Security for Marketplace Agents

| Control                    | Implementation                                                           |
| -------------------------- | ------------------------------------------------------------------------ |
| **Permission Declaration** | Pack manifest declares required scopes (like mobile app permissions)     |
| **Sandboxed Execution**    | Marketplace agents run within existing Cohort — no special access        |
| **Review Process**         | Cohortix team reviews packs before listing (code review + security scan) |
| **Audit Logging**          | All marketplace agent actions logged separately, viewable by user        |
| **Kill Switch**            | User can instantly uninstall — agents removed, data stays                |
| **Version Pinning**        | Users choose when to update; no silent changes                           |
| **Rating System**          | Community ratings + verified publisher badges                            |

### 8.5 Agent Sharing Between Cohorts

**Within an org (Personal → Shared or Shared → Shared):**

- Share as **template clone** — copies agent config, NOT memory or context
- Original owner controls updates (can "push" config changes)
- Receiving Cohort gets a fresh instance with its own memory
- No live bridging — clones are independent after creation

**Cross-org (Marketplace):**

- Template-only sharing — never live agents, never memory
- Published through marketplace review process
- Buyer gets a clean install, no connection to seller's data

**Sanitized Knowledge Export (for marketplace agents with valuable learnings):**

An agent that has evolved significantly has valuable knowledge. The seller can
optionally include curated learnings:

```
"Prepare for Marketplace" flow:
1. Seller selects agent to publish
2. System extracts:
   ✅ SHARED: Skills, config, system prompt, tool permissions
   ✅ SHARED: Expertise topics ("knows PostgreSQL, Drizzle, RLS")
   ✅ OPTIONAL: Curated lessons (seller reviews each one)
      → Auto-strips: org names, user names, task IDs, project names
      → Keeps: generic patterns ("batch inserts > 100 rows use transactions")
   ❌ NEVER: Raw Mem0 facts, daily logs, Cognee graph, task history, comments
3. Seller reviews sanitized package
4. Submitted to marketplace review
5. Buyer installs: gets template + sanitized expertise, starts fresh memory
```

This means a buyer purchasing "Axon Dev Codex Backend Agent" gets:

- Agent config + personality + skills ✅
- Generic backend development lessons (sanitized) ✅
- Knowledge that "Drizzle ORM works well with Supabase" ✅
- NOT: "Ahmad's Cohortix project uses table X with column Y" ❌

### 8.5 Revenue Model (DRAFT — Pending Financial Modeling with Malik)

| Revenue Stream                 | Pricing                                                            | Who Pays |
| ------------------------------ | ------------------------------------------------------------------ | -------- |
| Cohortix Platform              | Free tier (1 personal Cohort, 3 agents) → $29/mo Pro → $99/mo Team | User/Org |
| Managed Cohort Compute         | Included in plan (limits per tier)                                 | User/Org |
| LLM Usage                      | BYOK (user's own API keys)                                         | User     |
| Marketplace Agent Packs        | Set by publisher, Cohortix takes 20%                               | Buyer    |
| Enterprise (BYOH support, SLA) | Custom pricing                                                     | Org      |

---

## 9. Security Threat Model

### 9.1 Identified Threats & Mitigations

| Threat                                    | Severity | Mitigation                                                                                             |
| ----------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| **Cross-Cohort data leakage**             | Critical | RLS policies enforce scope; orchestration layer never sends cross-Cohort data to agents                |
| **Prompt injection via task content**     | High     | Sanitize user input before injecting into agent context; agents cannot escalate permissions            |
| **Admin accessing personal Cohort**       | High     | Hard RLS boundary — `scope_type = 'personal'` ONLY matches `auth.uid()`, no admin override             |
| **Compromised BYOH instance**             | Medium   | Treat as untrusted client; validate all data from BYOH instances; scoped auth tokens                   |
| **Malicious marketplace agent**           | Medium   | Review process, sandboxed permissions, audit logging, kill switch                                      |
| **Agent performing unauthorized actions** | Medium   | Action permission system (Section 5.3); destructive actions always require human approval              |
| **Session context leaking between tasks** | Medium   | Each task = isolated session; no shared state between task sessions                                    |
| **Cost abuse (spinning up many Cohorts)** | Low      | Tier limits on number of Cohorts; rate limiting on provisioning API                                    |
| **Token/key exfiltration**                | Low      | Auth tokens hashed in DB; API keys encrypted at rest (AES-256-GCM); BYOK means we don't store LLM keys |

### 9.2 Security Architecture Principles

1. **Defense in depth** — RLS + application logic + agent scoping. No single
   layer is trusted alone.
2. **Least privilege** — Agents start read-only, write permissions are opt-in
   per Cohort.
3. **Explicit scope** — Every data item has `scope_type` + `scope_id`. No
   inference, no defaults.
4. **Personal is sacred** — No admin, no agent, no system process can access
   personal scope except the owner.
5. **Validate everything from BYOH** — Self-hosted instances are treated as
   untrusted clients.
6. **Audit everything** — Every agent action is logged with who, what, when, and
   which Cohort.

---

## 10. Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

**Goal:** Single-user Cohortix with one personal Cohort powered by OpenClaw.

- [ ] Create `cohorts` and `cohort_members` tables
- [ ] Add `scope_type` / `scope_id` to visions, missions, operations, tasks
- [ ] RLS policies for personal scope
- [ ] Provision single OpenClaw Docker container per user (Fly.io)
- [ ] `CohortGatewayClient` — basic health, sendMessage, listSessions
- [ ] Agent creation UI (name, role, personality)
- [ ] Task → agent assignment flow
- [ ] Comment → agent mention → OpenClaw session → response → comment
- [ ] BYOK API key settings page

### Phase 2: Multi-User & Shared Cohorts (Weeks 5-8)

**Goal:** Organizations with multiple users and shared Cohorts.

- [ ] Shared Cohort provisioning (admin creates, assigns members)
- [ ] RLS policies for cohort scope and org scope
- [ ] "My Tasks" aggregation across Cohorts
- [ ] Agent permissions system (read/write/admin per action type)
- [ ] Cron-based agent status reports
- [ ] Activity feed (all agent actions in a Cohort)
- [ ] Cohort settings page (start/stop, health, resource usage)
- [ ] Knowledge Hub: `knowledge_items` table + RLS + full-text search
- [ ] Knowledge Hub UI: personal notes, Cohort wiki, org knowledge
- [ ] Agent Knowledge browsing (view agent memory/expertise/lessons via UI)

### Phase 3: BYOH & Advanced Features (Weeks 9-12)

**Goal:** Self-hosted support and advanced agent capabilities.

- [ ] BYOH connection flow (token generation, WebSocket pairing)
- [ ] Health monitoring for BYOH instances (heartbeat, offline handling)
- [ ] Agent memory UI (view/search/edit knowledge base)
- [ ] Scheduled tasks UI (cron management)
- [ ] Skills management UI (browse, install, toggle)
- [ ] Summarization cascade (task → operation → mission → vision rollups)
- [ ] Context injection optimization (measure token usage, tune scoping)
- [ ] Knowledge sharing: personal → shared Cohort (copy mechanism)
- [ ] Curated knowledge export: agent expertise → org knowledge
- [ ] Cross-scope knowledge search (search across all accessible scopes)

### Phase 4: Marketplace (Weeks 13-16)

**Goal:** Agent marketplace for selling/buying agent packs.

- [ ] Marketplace listing schema + publisher registration
- [ ] Agent pack manifest format (agents, skills, roadmap templates)
- [ ] Install flow with permission approval
- [ ] Review/approval pipeline for new listings
- [ ] Rating and review system
- [ ] Revenue sharing (Stripe Connect for publishers)
- [ ] Agent template sharing within org (clone system)
- [ ] Axon Dev Codex as first marketplace listing

---

## 11. Alternatives Considered

### 11.1 Shared Single OpenClaw Instance (Rejected)

All orgs share one OpenClaw instance with namespace isolation.

**Why rejected:** Single point of failure, complex isolation logic, one bug =
cross-org data leak. The per-Cohort model eliminates this entire class of
vulnerability.

### 11.2 Build Custom Agent Engine (Rejected)

Build our own agent runtime instead of using OpenClaw.

**Why rejected:** Massive engineering effort (6-12 months), OpenClaw already
solves orchestration/memory/tools. Our value-add is the GUI and PM workflow, not
the agent runtime.

### 11.3 LLM API Only, No Agent Engine (Rejected)

Just call OpenAI/Anthropic APIs directly, no persistent agents.

**Why rejected:** No memory, no tool use, no session management, no multi-agent
orchestration. Would result in stateless, single-turn AI that can't execute
complex tasks.

### 11.4 BYOK-First Without OpenClaw (Original ADR-001 Phase 1)

Start with BYOK where users provide API keys for simple AI features.

**Why superseded by this ADR:** Ahmad decided to lead with OpenClaw as the
engine from day one. BYOK remains the model for LLM keys (users bring their own
provider keys), but OpenClaw handles orchestration. ADR-001's phased approach is
subsumed by this architecture.

---

## 12. Open Questions

1. **Cohort naming:** Is "Cohort" the right user-facing term for an OpenClaw
   instance? Or should it be "Workspace", "Hub", "Pod"?
2. **Free tier limits:** How many agents and task executions per month on the
   free personal Cohort?
3. **BYOH minimum specs:** What hardware is required to run a self-hosted
   Cohort? (Likely: 2GB RAM, 2 cores, Docker)
4. **Offline task queuing:** When a BYOH Cohort is offline, should Cohortix
   queue tasks and replay when it comes back online?
5. **Agent-to-agent communication across Cohorts:** Should agents in different
   shared Cohorts within the same org be able to message each other? (Current
   answer: no, to maintain isolation. Revisit later.)
6. **Data residency:** For enterprise customers, can we guarantee Cohort data
   stays in a specific region?

---

## 13. References

- [OpenClaw Architecture Overview](https://ppaolo.substack.com/p/openclaw-system-architecture-overview)
- [OpenClaw Docker Deployment](https://docs.openclaw.ai/install/docker)
- [Docker Sandboxes for OpenClaw](https://www.docker.com/blog/run-openclaw-securely-in-docker-sandboxes/)
- [Cohortix PRD](/docs/specs/PRD.md)
- [ADR-001: AI Integration — Hybrid Phased Approach](/docs/decisions/ADR-AI-INTEGRATION.md)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Clerk Organizations](https://clerk.com/docs/organizations/overview)
- [Fly.io Machines](https://fly.io/docs/machines/)

---

**Decision Status:** Proposed — awaiting review from Ahmad Ashfaq and Idris
(Architect).

_This ADR will be amended as Ahmad adds further requirements. It is a living
document until status changes to Accepted._
