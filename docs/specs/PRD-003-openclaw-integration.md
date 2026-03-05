# PRD-003: OpenClaw Integration (BYOH-First)

**Version:** 1.1 **Author:** Alim (CEO Agent) with Ahmad Ashfaq (Founder)
**Date:** 2026-03-04 **Status:** Draft **Depends On:**
[PRD-002: Cohort Architecture](./PRD-002-cohort-architecture.md),
[SDD-002: Cohort Architecture](./SDD-002-COHORT-ARCHITECTURE.md) **Technical
Research:** [OpenClaw Gateway Audit](../research/openclaw-gateway-audit.md)

---

## 1. Problem Statement

**Who has this problem?** Cohortix users who have signed up and set up their
Clone Foundation — but can't actually use their AI agents yet because there's no
runtime engine connected.

**What's the problem?** SDD-002 built the data model, UI shell, and RLS security
layer for Cohortix. But without an OpenClaw Gateway connection, agents are just
database records. They can't execute tasks, respond to @mentions, learn, or
evolve. The product is a dashboard without an engine.

**Why does it matter?** The entire value proposition of Cohortix — "AI agents
that help you achieve your goals" — depends on agents actually running. Every
day without engine integration is a day the product delivers zero core value.
Users who sign up today see a beautiful UI but can't do the one thing they
signed up for.

**Current state:**

- ✅ Data model complete (cohorts, agents, tasks, sessions, RLS)
- ✅ UI shell exists (dashboards, agent profiles, task management)
- ✅ Clone Foundation onboarding flow built
- ❌ No runtime engine connected
- ❌ Agents can't execute tasks
- ❌ No @mention → agent response pipeline
- ❌ No health monitoring or connection status

---

## 2. Goals & Success Metrics

### Goals

| #   | Goal                   | Description                                                                                    |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| G1  | **BYOH Connection**    | Users connect their self-hosted OpenClaw Gateway to Cohortix and it just works                 |
| G2  | **Agent Provisioning** | Creating an agent in Cohortix automatically configures it on the user's Gateway                |
| G3  | **Task Execution**     | @mentioning an agent in a task comment triggers a real agent session that responds             |
| G4  | **Engine Health**      | Users see real-time engine status; offline engines show graceful degradation with task queuing |
| G5  | **Clone Sync**         | Clone Foundation data flows from Cohortix DB to Gateway workspace files seamlessly             |
| G6  | **Full Parity**        | Everything a user can do in OpenClaw CLI, they can do through the Cohortix UI                  |

### Success Metrics

| Metric                                        | Target                     | Measurement                                |
| --------------------------------------------- | -------------------------- | ------------------------------------------ |
| Time from signup to first agent response      | < 10 minutes (BYOH)        | Analytics: onboarding → first task_session |
| BYOH connection success rate                  | ≥ 80% on first attempt     | Connection wizard completion rate          |
| Engine health check accuracy                  | 99%+ uptime detection      | Health probe vs actual reachability        |
| Task execution success rate                   | ≥ 90% (when engine online) | task_sessions completed / created          |
| Agent provisioning success rate               | ≥ 95%                      | Agent creation → Gateway config written    |
| Queued task processing (after engine returns) | < 60 seconds               | Queue drain time after reconnection        |

---

## 3. User Stories

### BYOH User (Primary — Phase 1)

- **US-1:** As a new user, I want to complete my Clone Foundation during
  onboarding before choosing an engine, so I can get invested in the product
  before technical setup.
- **US-2:** As a user, I want to choose between self-hosted (BYOH) or managed
  hosting for my cohort engine, so I have control over where my data lives.
- **US-3:** As a BYOH user, I want a step-by-step connection wizard that tells
  me exactly what to enable on my OpenClaw instance, so I don't have to guess.
- **US-4:** As a BYOH user, I want Cohortix to verify my gateway connection in
  real-time during setup, so I know it's working before I proceed.
- **US-5:** As a BYOH user, I want my Clone Foundation data to automatically
  sync to my gateway workspace (SOUL.md, IDENTITY.md, etc.), so my agents know
  who I am without manual file editing.
- **US-6:** As a user, I want to create agents in the Cohortix UI and have them
  automatically appear as configured agents on my gateway, so I never touch CLI
  config.
- **US-7:** As a user, I want to @mention an agent in a task comment and get a
  real response, so agent collaboration feels like working with a human
  teammate.
- **US-8:** As a user, I want to see my engine's status (online/offline/error)
  on my cohort dashboard, so I always know if my agents are available.
- **US-9:** As a BYOH user, when my machine goes offline, I want tasks to queue
  and execute automatically when the engine comes back online.
- **US-10:** As a user, I want to have multiple cohorts with different engine
  types (some BYOH, some managed), so I can mix and match based on my needs.

### Managed Hosting User (Phase 2 — Deferred)

- **US-11:** As a non-technical user, I want to select "Managed" during
  onboarding and have everything provisioned for me, so I never think about
  infrastructure.
- **US-12:** As a managed user, I want the same agent capabilities as BYOH
  users, so the experience is equal regardless of hosting choice.

### Power User

- **US-13:** As a power user, I want to see agent session logs and execution
  history, so I can debug issues or understand agent reasoning.
- **US-14:** As a power user, I want to configure which AI models each agent
  uses through the Cohortix UI, so I can optimize for cost or capability.
- **US-15:** As a power user, I want to manage agent skills (enable/disable)
  through the Cohortix UI, so I control what tools agents have access to.

---

## 4. Requirements

### Must Have (P0) — Phase 1: BYOH Connection & Task Execution

#### Onboarding & Connection

- [ ] **Engine selection UI** — during onboarding, after Clone Foundation, user
      chooses "Self-Hosted" or "Managed" (managed shows "Coming Soon" in
      Phase 1)
- [ ] **BYOH connection wizard** — step-by-step guide: (1) prerequisites check,
      (2) enable HTTP endpoint, (3) configure auth, (4) paste gateway URL +
      token, (5) verify connection
- [ ] **Real-time connection verification** — hit gateway `/v1/responses` with a
      health prompt during setup; show success/failure instantly
- [ ] **Gateway credential storage** — store `gatewayUrl` and `authTokenHash`
      (hashed, not plaintext) in cohorts table
- [ ] **Clone Foundation sync** — on engine connection, write SOUL.md,
      IDENTITY.md, USER.md to gateway workspace via `/tools/invoke`

#### Agent Provisioning

- [ ] **Agent → Gateway sync** — when user creates agent in Cohortix UI, write
      agent config to gateway via API (workspace files, agent settings)
- [ ] **Agent status sync** — periodically check agent availability on gateway
      and update `agents.status` in DB
- [ ] **Bidirectional agent discovery** — on first connection, read existing
      agents from gateway and offer to import them into Cohortix

#### Task Execution Pipeline

- [ ] **@mention → session creation** — parsing `@AgentName` in comments creates
      a `task_session` record and sends prompt to gateway
- [ ] **Gateway request routing** — send task to `POST /v1/responses` with
      correct `x-openclaw-agent-id` and `x-openclaw-session-key` headers
- [ ] **Session key scheme** — derive deterministic session keys:
      `cohortix:task:<taskId>:agent:<agentId>` for per-task isolation
- [ ] **Response streaming** — stream SSE response from gateway back to
      Cohortix; store final response as agent comment
- [ ] **Session status tracking** — update `task_sessions` status (running →
      completed/failed/cancelled)

#### Engine Health & Monitoring

- [ ] **Periodic health probe** — check gateway connectivity every 60 seconds
      when cohort is active; update `runtimeStatus` and `lastHeartbeatAt`
- [ ] **Engine status UI** — show online/offline/error badge on cohort dashboard
      and header
- [ ] **Graceful offline handling** — when engine offline: show "Engine Offline"
      banner, allow task creation, queue @mention executions
- [ ] **Task queue processing** — when engine comes back online, drain queued
      tasks in order (FIFO)
- [ ] **Connection error diagnostics** — on failure, show specific error (auth
      failed, unreachable, timeout, endpoint disabled)

#### Security

- [ ] **Token encryption at rest** — gateway auth tokens encrypted in DB (not
      just hashed — we need to decrypt to use them)
- [ ] **Token rotation UI** — users can update their gateway token without
      re-running the full wizard
- [ ] **Request signing** — all Cohortix → Gateway requests include an
      idempotency key to prevent duplicate execution
- [ ] **Scope enforcement** — Cohortix backend validates that the requesting
      user has access to the cohort before proxying to gateway

### Should Have (P1) — Phase 1 Enhancements

- [ ] **Agent model configuration UI** — set AI model per agent via Cohortix UI,
      write to gateway config
- [ ] **Agent skills management UI** — enable/disable skills per agent, sync to
      gateway
- [ ] **Session history viewer** — view past task sessions with full
      conversation log
- [ ] **Multi-cohort engine support** — one user can have multiple cohorts, each
      with its own engine (BYOH or managed)
- [ ] **Connection health history** — track uptime/downtime over time, show in
      dashboard
- [ ] **Retry logic** — automatic retry with exponential backoff for transient
      gateway failures

### Nice to Have (P2) — Future Phases

- [ ] **Managed hosting provisioning** — Fly.io Machines for cloud-hosted
      OpenClaw instances
- [ ] **One-command BYOH setup** — `openclaw cohortix connect` CLI command
      (requires OpenClaw collaboration)
- [ ] **WebSocket persistent connection** — maintain WS connection for real-time
      events instead of polling
- [ ] **Agent-to-agent task delegation** — one agent assigns subtasks to another
      within the same cohort
- [ ] **Workspace file browser** — view/edit agent workspace files through
      Cohortix UI
- [ ] **Bulk agent provisioning** — import/export agent configurations across
      cohorts
- [ ] **Gateway config sync** — Cohortix manages the full `openclaw.json` config
      for the user

---

## 5. Non-Requirements (Explicit Exclusions)

- **Managed hosting in Phase 1** — BYOH only. Managed comes in Phase 2 after
  proving the integration works.
- **Cross-cohort agent communication** — agents stay within their cohort
  boundary.
- **Direct gateway WebSocket management** — Cohortix uses HTTP APIs only in
  Phase 1; no persistent WS connections.
- **OpenClaw CLI modifications** — we work with the existing API surface; no
  upstream changes required for Phase 1.
- **Multi-user gateway sharing** — one gateway token = one operator. Shared
  cohorts with BYOH need architectural decisions deferred to Phase 2.
- **Custom LLM hosting** — users bring their own API keys; we don't host models.
- **Billing/metering for managed hosting** — deferred to billing PRD.

---

## 6. Architecture & Technical Design

### 6.1 Integration Model

```
┌─────────────────────────────────────────────────────────┐
│                    Cohortix Cloud                        │
│                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Next.js  │───▶│ Engine Proxy │───▶│  Task Queue  │  │
│  │ Frontend │    │ (API Routes) │    │  (DB-backed) │  │
│  └──────────┘    └──────┬───────┘    └──────┬───────┘  │
│                         │                    │          │
│                    ┌────▼────────────────────▼───┐      │
│                    │      Supabase (RLS)         │      │
│                    │  cohorts | task_sessions     │      │
│                    │  agents  | task_queue        │      │
│                    └────────────────────────────┘       │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS (Bearer Token)
                           │
              ┌────────────▼────────────────┐
              │   User's OpenClaw Gateway   │
              │                             │
              │  POST /v1/responses          │
              │  POST /tools/invoke          │
              │                             │
              │  Agent 1 ─── Workspace      │
              │  Agent 2 ─── Workspace      │
              │  Agent N ─── Workspace      │
              └─────────────────────────────┘
```

### 6.2 Engine Proxy Layer

All Cohortix → Gateway communication goes through a server-side **Engine Proxy**
(Next.js API routes). The frontend never talks to the gateway directly.

**Why:**

- Gateway token stays server-side (never exposed to browser)
- Cohortix can add RLS checks, rate limiting, request signing
- Enables task queuing when engine is offline
- Single point for logging/monitoring

**Key proxy routes:**

```
POST /api/v1/engine/health          → Gateway: POST /tools/invoke { tool: "session_status" }
POST /api/v1/engine/send            → Gateway: POST /v1/responses (with agent/session headers)
POST /api/v1/engine/tools/invoke    → Gateway: POST /tools/invoke
POST /api/v1/engine/agents/sync     → Gateway: POST /tools/invoke { tool: "write" } (workspace files)
GET  /api/v1/engine/agents/discover → Gateway: POST /tools/invoke { tool: "sessions_list" }
```

### 6.3 Session Key Scheme

Every task execution gets a unique, deterministic session key:

```
cohortix:task:<taskId>:agent:<agentId>
```

This ensures:

- **Per-task isolation** — no context bleed between tasks
- **Deterministic** — retries hit the same session (idempotent)
- **Debuggable** — session key maps back to Cohortix task/agent

For ongoing agent conversations (non-task), use:

```
cohortix:chat:<cohortId>:agent:<agentId>
```

### 6.4 Task Execution Flow

```
User writes "@Researcher investigate pricing strategies"
    │
    ▼
Frontend: POST /api/v1/comments (with mentionedAgentIds)
    │
    ▼
Backend: Parse mentions → Create task_session → Check engine status
    │
    ├── Engine ONLINE:
    │       │
    │       ▼
    │   Engine Proxy: POST /v1/responses
    │       Headers: x-openclaw-agent-id: <agentId>
    │                x-openclaw-session-key: cohortix:task:<taskId>:agent:<agentId>
    │       Body: { model: "openclaw", stream: true, input: "<comment content>" }
    │       │
    │       ▼
    │   Stream SSE response → Update task_session status → Insert agent comment
    │
    └── Engine OFFLINE:
            │
            ▼
        Insert into task_queue (status: 'queued')
        Show "Agent will respond when engine is back online" in UI
```

### 6.5 Clone Foundation → Gateway Sync

Clone Foundation answers are stored in DB during onboarding. On engine
connection:

```
Clone Foundation Data (DB)          Gateway Workspace Files
─────────────────────────           ──────────────────────
clone.name                    →     IDENTITY.md (name, vibe, emoji)
clone.values                  →     SOUL.md (persona, boundaries, tone)
clone.decision_making         →     clone-foundation/decision-making.md
clone.expertise               →     clone-foundation/expertise.md
clone.communication_style     →     clone-foundation/communication.md
clone.aspirations             →     clone-foundation/aspirations.md
user.name, user.timezone      →     USER.md (user profile)
```

Written via
`/tools/invoke { tool: "write", args: { path: "SOUL.md", content: "..." } }`.

### 6.6 Agent Provisioning Flow

When user creates agent in Cohortix:

1. Insert `agents` record in DB (with scopeType, settings, etc.)
2. Generate agent workspace files from template (AGENTS.md, SOUL.md based on
   agent role)
3. Call gateway `/tools/invoke { tool: "write" }` for each workspace file
4. Call gateway
   `/tools/invoke { tool: "exec", args: { command: "openclaw agents add <id>" } }`
   — OR document that user needs to add the agent to their openclaw.json
   manually (depending on what the CLI supports)

**Open question:** Can we fully provision an agent via the HTTP API alone, or
does the user need to edit `openclaw.json` to register the agent? This needs
testing. If the latter, we provide copy-paste config snippets in the UI.

### 6.7 Health Monitoring

```
Every 60s (when cohort dashboard is open):
    Backend: POST /api/v1/engine/health
        → Proxy: POST <gatewayUrl>/tools/invoke { tool: "session_status" }
        → On success: Update cohorts.runtimeStatus = 'online', lastHeartbeatAt = now()
        → On failure: Increment failure counter
            → 3 consecutive failures: Update runtimeStatus = 'offline'
            → On recovery: Drain task_queue, update runtimeStatus = 'online'

Every 5m (background job for all active cohorts):
    Same health check but for all cohorts with a connected engine
    → Detect engines that went offline while no one was watching
```

### 6.8 Task Queue (DB-Backed)

New table: `task_queue`

```ts
export const taskQueue = pgTable('task_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  cohortId: uuid('cohort_id')
    .notNull()
    .references(() => cohorts.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  commentId: uuid('comment_id').references(() => comments.id, {
    onDelete: 'set null',
  }),
  prompt: text('prompt').notNull(),
  status: pgEnum('task_queue_status', [
    'queued',
    'processing',
    'completed',
    'failed',
  ])
    .default('queued')
    .notNull(),
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(3).notNull(),
  error: jsonb('error'),
  queuedAt: timestamp('queued_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});
```

### 6.9 BYOH Connection Wizard (UI Flow)

```
Step 1: Prerequisites
    "You'll need OpenClaw installed and running on your machine."
    [Check: Is OpenClaw installed?] → Link to install guide
    [Check: Is Gateway running?] → Show: openclaw gateway status

Step 2: Enable HTTP Endpoint
    "Run this command on your machine:"
    ┌──────────────────────────────────────────────────────┐
    │ openclaw config set gateway.http.endpoints.          │
    │   responses.enabled true                             │
    └──────────────────────────────────────────────────────┘
    [Copy button]

Step 3: Gateway URL & Token
    "Enter your gateway URL and auth token:"
    ┌──────────────────────────────────────┐
    │ Gateway URL: [wss://................]│
    │ Auth Token:  [••••••••••••••••••••••]│
    └──────────────────────────────────────┘
    Hint: "Find your token with: openclaw config get gateway.auth.token"

Step 4: Verify Connection
    [Verify Connection] → Real-time test
    ✅ "Connected! Your engine is online."
    ─── or ───
    ❌ "Connection failed: <specific error>"
       → Auth failed? Check your token.
       → Unreachable? Ensure Tailscale Funnel is enabled or your URL is accessible.
       → Endpoint disabled? Run the command from Step 2.

Step 5: Success
    "Your engine is connected! Your Clone is being synced..."
    [Progress: Writing SOUL.md... Writing IDENTITY.md... Done!]
    [Continue to Dashboard →]
```

---

## 7. Data Model Changes

### 7.1 New Table: `task_queue`

See Section 6.8 above.

### 7.2 Updated Table: `cohorts`

Existing columns already support this (from SDD-002):

- `hosting` (managed | self_hosted)
- `runtimeStatus` (provisioning | online | offline | error | paused)
- `gatewayUrl` (text)
- `authTokenHash` (text) — **rename to `authTokenEncrypted`** since we need to
  decrypt, not just verify

### 7.3 New Column: `cohorts.connectionConfig`

```ts
connectionConfig: jsonb('connection_config').default({}).notNull(),
// Shape:
// {
//   httpEndpoint: 'responses' | 'chatCompletions',
//   healthCheckIntervalMs: 60000,
//   maxRetries: 3,
//   timeoutMs: 30000,
//   lastError?: { code: string, message: string, at: string }
// }
```

### 7.4 New Table: `engine_events`

Track connection lifecycle for debugging:

```ts
export const engineEvents = pgTable('engine_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  cohortId: uuid('cohort_id')
    .notNull()
    .references(() => cohorts.id, { onDelete: 'cascade' }),
  eventType: pgEnum('engine_event_type', [
    'connected',
    'disconnected',
    'health_check_failed',
    'health_check_recovered',
    'token_rotated',
    'agent_synced',
    'clone_synced',
    'queue_drained',
  ]).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
```

---

## 8. API Design

### 8.1 Engine Connection

**POST `/api/v1/engine/connect`**

```json
{
  "cohortId": "uuid",
  "gatewayUrl": "wss://my-mac.tailnet:18789",
  "authToken": "token-here",
  "hosting": "self_hosted"
}
```

Response:
`{ "status": "connected", "runtimeStatus": "online", "agentsFound": 3 }`

**POST `/api/v1/engine/verify`**

```json
{ "cohortId": "uuid" }
```

Response:
`{ "reachable": true, "latencyMs": 45, "agentCount": 3, "version": "2026.3.2" }`

**POST `/api/v1/engine/disconnect`**

```json
{ "cohortId": "uuid" }
```

### 8.2 Engine Proxy

**POST `/api/v1/engine/send`**

```json
{
  "cohortId": "uuid",
  "agentId": "uuid",
  "sessionKey": "cohortix:task:abc:agent:def",
  "input": "Investigate pricing strategies for SaaS products",
  "stream": true
}
```

Response: SSE stream (proxied from gateway)

**POST `/api/v1/engine/tools`**

```json
{
  "cohortId": "uuid",
  "tool": "read",
  "args": { "path": "SOUL.md" }
}
```

### 8.3 Agent Sync

**POST `/api/v1/engine/agents/sync`**

```json
{
  "cohortId": "uuid",
  "agentId": "uuid",
  "action": "provision"
}
```

**POST `/api/v1/engine/agents/discover`**

```json
{ "cohortId": "uuid" }
```

Response: `{ "agents": [{ "id": "main", "workspace": "...", "model": "..." }] }`

### 8.4 Clone Sync

**POST `/api/v1/engine/clone/sync`**

```json
{ "cohortId": "uuid" }
```

Writes all Clone Foundation files to gateway workspace.

---

## 9. Onboarding Flow (Updated)

The onboarding flow from PRD-002 is updated to integrate engine selection:

```
1. Sign Up (Clerk)
        │
        ▼
2. Clone Foundation (5–7 questions)
   - "What's your name?"
   - "What do you value most?"
   - "How do you make decisions?"
   - "What are your areas of expertise?"
   - "What are your aspirations?"
   → Stored in DB (profiles + clone_foundation table)
        │
        ▼
3. Engine Selection
   ┌──────────────────────────────────┐
   │  How would you like to run       │
   │  your AI agents?                 │
   │                                  │
   │  [🖥️ Self-Hosted]               │
   │  Run on your own machine.        │
   │  Full control. Your data stays   │
   │  with you.                       │
   │                                  │
   │  [☁️ Managed] (Coming Soon)      │
   │  We handle everything.           │
   │  Zero setup required.            │
   └──────────────────────────────────┘
        │
        ▼ (Self-Hosted selected)
4. BYOH Connection Wizard (Section 6.9)
        │
        ▼
5. Clone Sync → Write files to gateway
        │
        ▼
6. First Agent Setup
   - Clone agent auto-created
   - User can create additional agents
        │
        ▼
7. First Task
   - Guided: "Try assigning a task to your Clone"
   - "@Clone research the best productivity frameworks"
        │
        ▼
8. Dashboard (onboarding complete)
```

**Key insight:** Clone Foundation data is stored in Cohortix DB first (step 2),
then synced to the engine workspace (step 5). This means:

- Users get invested before hitting technical setup
- If engine connection fails, they don't lose their progress
- Clone data is always in Cohortix (source of truth) and mirrored to the engine

---

## 10. Resolved Design Decisions

Decisions made during requirements discovery with Ahmad (2026-03-04):

### D1: Agent Identity Mapping

**Decision:** Use `externalId` field on the `agents` table to store the OpenClaw
`agentId` string (e.g., "main", "researcher"). Mapping is cohort-scoped — two
different cohorts can both have `externalId: "main"` without conflict since they
point to different gateways.

### D2: Clone Foundation Updates & Agent Profiles

**Decision:** Each agent gets a **profile page** in the Cohortix UI showing:

- SOUL.md content (editable inline)
- IDENTITY.md content (editable inline)
- Memory files (viewable, searchable)
- Agent config (model, skills, tools)
- Evolution timeline

When a user edits any workspace file in the Cohortix UI, changes sync to the
gateway immediately. Cohortix becomes the visual editor for OpenClaw workspace
files.

### D3: Source of Truth

**Decision:** Cohortix is always the source of truth for agent configuration.
CLI changes on the gateway may be **overwritten on next Cohortix sync.**
Mitigations:

- Warn in BYOH docs: "Cohortix manages your agent config. CLI changes may be
  overwritten."
- Detect config drift during health checks → show "Config out of sync" warning
- Never auto-overwrite without user clicking "Sync now"

### D4: Task Execution Context

**Decision:** Option C — full PPV context. Prompt includes:

- The @mention comment text
- Task title + description + status
- Operation context (summary from operation's cohortix.md when available)
- Instruction: "If you need more context, check the operation's file directory
  or ask."

**Future hook:** Operations will have a file directory system with a living
`cohortix.md` that contains project summary, progress, memory, and references.
Agents reference this for maximum context. (Separate feature — noted here for
architecture alignment.)

### D5: Multiple @Mentions in One Comment

**Decision:** Parallel independent sessions (Phase 1).

- Multiple @mentions → create **separate parallel task_sessions**, one per
  mentioned agent
- Each agent gets the full comment as context (aware other agents were
  mentioned)
- Sessions run independently — no output sharing
- Each agent posts its own response comment

**Phase 2:** Sequential chaining support — agent A's output feeds to agent B,
explicit workflow definition, agent-to-agent delegation.

Research basis: Parallel execution is 60-80% faster for independent tasks.
Dependency detection and sequential chaining add significant complexity —
deferred to Phase 2.

### D6: Error Visibility

**Decision:** Retry button + expandable error details.

- Primary: "Agent couldn't complete this task" with [Retry] button
- Expandable: full error details (gateway error, timeout info, attempt count)
- Clean for non-technical users, debuggable for power users

### D7: Connection Security — Token Lifecycle

**Decision:** Distinguish auth failures from network failures in UI.

- Auth error (401/403) → "Your engine token has changed or expired. Please
  update your token in Settings."
- Network error (timeout/unreachable) → "Engine offline. Tasks will queue and
  execute when it's back."
- Token rotation UI available in cohort settings without re-running the full
  wizard.

### D8: First-Time User with No OpenClaw

**Decision:** Embedded install guide + managed fallback.

- Connection wizard includes OS detection → shows the right install commands
  inline
- If user is not technical enough → option to switch to "Managed (Coming
  Soon)" + join waitlist
- Once managed hosting is live, this becomes the primary recommendation for
  non-technical users

### D9: Multi-Cohort Same Gateway

**Decision:** Allowed. Two cohorts can share a gateway URL with different agent
bindings.

- OpenClaw's multi-agent routing already supports multiple isolated agents per
  gateway
- Each cohort stores its own `externalId` → `agentId` mappings
- No conflict because agent isolation is handled by the gateway

### D10: Workspace File Conflicts (BYOH with Existing Agents)

**Decision:** Never overwrite. The flow is:

1. BYOH user connects → Cohortix discovers existing agents on their gateway
2. User sees: "We found these agents on your engine: [Main, Researcher, Coder]"
3. **Option A:** "Select an existing agent as your Clone" → merge Clone
   Foundation data into that agent's SOUL.md (append, never overwrite)
4. **Option B:** "Create a new Clone agent" → fresh agent, no conflict, write
   new files User always has the final say on what gets written where.

### D11: Connectivity Options

**Decision:** Support both Tailscale and direct URLs.

- **Tailscale Funnel:** Recommended for users already on Tailscale. Public
  HTTPS, no port forwarding. Wizard detects if available.
- **Direct URL:** Any `wss://` or `https://` endpoint (ngrok, Cloudflare
  Tunnels, static IPs, etc.). User pastes the URL.
- Wizard guides user to the best option based on their setup.

### D12: Gateway Version Check

**Decision:** Yes — check during connection wizard.

- Query gateway version during verification step
- Reject versions below minimum with: "Your OpenClaw version X.X is too old.
  Please update to at least Y.Y" + update command
- Minimum version TBD during implementation (based on required HTTP API
  features)

---

## 11. Open Questions (Remaining)

1. **Agent provisioning via API** — Can we fully add an agent to OpenClaw via
   HTTP (`/tools/invoke` + `openclaw agents add`)? Needs testing during sprint.
   Fallback: provide copy-paste config snippets.

2. **Token encryption** — Should we encrypt gateway tokens with a per-user key
   derived from Clerk auth, or use Supabase Vault? The token needs to be
   decryptable since we use it for API calls.

3. **Rate limiting** — How many concurrent agent sessions can a single OpenClaw
   gateway handle? We may need to rate-limit task execution per cohort.

4. **Shared cohorts + BYOH** — If a team cohort uses BYOH, whose machine hosts
   the gateway? The org admin's? A dedicated server? (Deferred to Phase 2
   multi-user design.)

5. **Queue limits** — How many tasks can queue while engine is offline?
   Unlimited? Time-based expiry (e.g., 24h TTL)?

6. **Operations file directory** — Exact structure of the living `cohortix.md`
   per operation. (Separate feature — architecture hook noted in D4.)

---

## 12. Risks & Mitigations

| Risk                                                 | Impact                              | Likelihood | Mitigation                                                                                      |
| ---------------------------------------------------- | ----------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| BYOH setup too complex                               | Users abandon onboarding            | High       | Step-by-step wizard with real-time verification; future `openclaw cohortix connect` CLI command |
| Gateway goes offline frequently (laptop users)       | Poor UX, queued tasks pile up       | High       | Clear offline status, task queue with TTL, push notification when engine is back                |
| Token = full operator access                         | Security concern for shared cohorts | Medium     | Phase 1: personal cohorts only. Phase 2: design proxy auth layer for shared cohorts             |
| OpenClaw API doesn't support full agent provisioning | Manual CLI steps required           | Medium     | Test during sprint; provide copy-paste config snippets as fallback                              |
| Network latency for remote gateways                  | Slow agent responses                | Low        | SSE streaming for real-time feel; timeout with retry logic                                      |
| Clone sync overwrites user's existing workspace      | Data loss                           | Medium     | Check for existing files first; prompt user to merge or overwrite                               |

---

## 13. Phasing

### Phase 1: BYOH Connection & Task Execution (This PRD — 6-8 weeks)

- BYOH connection wizard (Tailscale + direct URL support)
- Clone Foundation → Gateway sync (with existing agent discovery + merge flow)
- Agent provisioning via API (with config snippet fallback)
- Agent profile pages (view/edit workspace files — SOUL.md, IDENTITY.md, etc.)
- Task execution via @mention (full pipeline with parallel multi-agent support)
- Engine health monitoring + offline task queuing
- Error handling with retry + expandable details
- Gateway version check + connection diagnostics

### Phase 2: Managed Hosting & Advanced Interactions (Next after Phase 1)

> **This is the next PRD after Phase 1 is shipped.** These features build
> directly on the BYOH foundation.

- **Managed hosting provisioning** — Fly.io Machines for cloud-hosted OpenClaw
  instances
- **Direct chat with agents** — conversation mode (not task-bound) for
  brainstorming, Q&A
- **Sequential @mention chaining** — agent A's output feeds to agent B
  ("@Researcher investigate, then @Writer draft")
- **Agent-to-agent delegation** — one agent can spawn subtasks for another
  within the same cohort
- **Persistent WebSocket connection** — real-time events instead of polling for
  engine status
- **Cron jobs / scheduled tasks UI** — recurring agent jobs configured through
  Cohortix
- **Multi-user shared cohorts** — team members sharing a BYOH or managed engine
- **`openclaw cohortix connect` CLI command** — one-command BYOH setup (requires
  OpenClaw collaboration)

### Phase 3: Marketplace & Ecosystem (Future)

> **Builds on Phase 1 + 2.** Deferred until core product is proven.

- Skills marketplace integration
- Operations file directory system (living cohortix.md per operation)
- Full workspace file browser/editor
- Gateway config management via Cohortix UI
- Node/device management
- Bulk agent provisioning (import/export across cohorts)

---

## 14. Approval

- [ ] PM (August) reviewed
- [ ] Architect (Idris) reviewed
- [x] CEO Agent (Alim) drafted
- [ ] **Ahmad approved**

---

_This PRD depends on [PRD-002](./PRD-002-cohort-architecture.md) for the data
model and [SDD-002](./SDD-002-COHORT-ARCHITECTURE.md) for schema details. The
[OpenClaw Gateway Audit](../research/openclaw-gateway-audit.md) contains the
full technical research backing this spec._
