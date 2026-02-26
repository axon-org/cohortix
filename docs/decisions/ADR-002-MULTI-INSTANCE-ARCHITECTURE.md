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

**Key Decision:** Every user gets a personal Cohort (OpenClaw instance).
Organizations can create additional shared Cohorts. Users can bring their own
hardware or use Cohortix-managed cloud instances. Cohortix is the GUI — users
never interact with OpenClaw directly.

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

### 3.3 Hosting Models

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

### 3.4 Instance Lifecycle

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
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('personal', 'shared')),
    hosting VARCHAR(20) NOT NULL CHECK (hosting IN ('managed', 'self_hosted')),
    owner_user_id UUID REFERENCES users(id),  -- NULL for shared cohorts
    gateway_url TEXT,           -- OpenClaw Gateway endpoint
    auth_token_hash TEXT,       -- Hashed connection token
    status VARCHAR(20) DEFAULT 'provisioning',
    hardware_info JSONB,        -- For BYOH: { os, arch, ram, model }
    last_heartbeat TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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

### 6.5 Summarization Cascade

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

### 7.3 Technical Integration

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

### 8.1 What Gets Sold

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

### 8.2 Installation Flow

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

### 8.3 Security for Marketplace Agents

| Control                    | Implementation                                                           |
| -------------------------- | ------------------------------------------------------------------------ |
| **Permission Declaration** | Pack manifest declares required scopes (like mobile app permissions)     |
| **Sandboxed Execution**    | Marketplace agents run within existing Cohort — no special access        |
| **Review Process**         | Cohortix team reviews packs before listing (code review + security scan) |
| **Audit Logging**          | All marketplace agent actions logged separately, viewable by user        |
| **Kill Switch**            | User can instantly uninstall — agents removed, data stays                |
| **Version Pinning**        | Users choose when to update; no silent changes                           |
| **Rating System**          | Community ratings + verified publisher badges                            |

### 8.4 Agent Sharing Between Cohorts

**Within an org (Personal → Shared or Shared → Shared):**

- Share as **template clone** — copies agent config, NOT memory or context
- Original owner controls updates (can "push" config changes)
- Receiving Cohort gets a fresh instance with its own memory
- No live bridging — clones are independent after creation

**Cross-org (Marketplace):**

- Template-only sharing — never live agents, never memory
- Published through marketplace review process
- Buyer gets a clean install, no connection to seller's data

### 8.5 Revenue Model

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

### Phase 3: BYOH & Advanced Features (Weeks 9-12)

**Goal:** Self-hosted support and advanced agent capabilities.

- [ ] BYOH connection flow (token generation, WebSocket pairing)
- [ ] Health monitoring for BYOH instances (heartbeat, offline handling)
- [ ] Agent memory UI (view/search/edit knowledge base)
- [ ] Scheduled tasks UI (cron management)
- [ ] Skills management UI (browse, install, toggle)
- [ ] Summarization cascade (task → operation → mission → vision rollups)
- [ ] Context injection optimization (measure token usage, tune scoping)

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
