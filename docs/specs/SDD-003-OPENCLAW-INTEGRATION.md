# System Design Document (SDD-003): OpenClaw Integration (BYOH-First)

**Status:** Draft (v1.1 — post-compatibility audit) **Date:** 2026-03-04
**Owner:** Alim (CEO) — to be assigned to Architect for review **Related:**
[PRD-003](./PRD-003-openclaw-integration.md),
[SDD-002](./SDD-002-COHORT-ARCHITECTURE.md),
[OpenClaw Gateway Audit](../research/openclaw-gateway-audit.md)

---

## 1. Scope & Goals

**Goal:** Define the system design for connecting Cohortix to user-hosted
OpenClaw Gateway instances (BYOH), enabling full bidirectional agent task
execution, workspace file management, health monitoring, and offline task
queuing.

### 1.1 PRD-003 Alignment (Phase 1 Coverage)

**In scope for this SDD:**

- BYOH connection wizard (Tailscale Funnel + direct URL)
- Engine Proxy layer (server-side gateway communication)
- Clone Foundation → Gateway workspace sync
- Agent provisioning on gateway via API
- Agent profile pages (view/edit workspace files)
- Task execution via @mention (parallel multi-agent)
- Session key scheme and per-task isolation
- Engine health monitoring + runtime status
- Offline task queuing with FIFO drain
- Error handling with retry + expandable details
- Gateway version check + connection diagnostics
- Existing agent discovery + merge flow

**Deferred (Phase 2+):**

- Managed hosting provisioning (Fly.io Machines)
- Direct chat with agents (non-task conversations)
- Sequential @mention chaining (agent A → agent B)
- Persistent WebSocket connections
- Cron jobs / scheduled tasks UI
- Multi-user shared cohorts with BYOH
- `openclaw cohortix connect` CLI command

### 1.2 Non-Goals

- OpenClaw source code modifications (we use the existing API surface)
- Channel management (Cohortix IS the channel)
- Custom LLM hosting or fine-tuning
- Billing/metering for engine usage
- Cross-cohort agent communication

---

## 2. System Context

```
┌──────────────────────────────────────────────────────────────┐
│                      Cohortix Cloud                          │
│                                                              │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────────┐   │
│  │ Next.js  │──▶│  API Routes  │──▶│   Engine Proxy     │   │
│  │ Frontend │   │  /api/v1/*   │   │   Service Layer    │   │
│  └──────────┘   └──────┬───────┘   └────────┬───────────┘   │
│                        │                     │               │
│                  ┌─────▼─────────────────────▼────────┐      │
│                  │         Supabase (RLS)             │      │
│                  │  cohorts | agents | task_sessions  │      │
│                  │  task_queue | engine_events        │      │
│                  │  comments | clone_foundation       │      │
│                  └───────────────────────────────────┘       │
└──────────────────────────────┬───────────────────────────────┘
                               │
                     HTTPS (Bearer Token)
                               │
              ┌────────────────▼─────────────────┐
              │    User's OpenClaw Gateway        │
              │    (Self-Hosted / BYOH)           │
              │                                   │
              │  POST /v1/responses    (agent)    │
              │  POST /tools/invoke    (tools)    │
              │  (No HTTP health — use tools)     │
              │                                   │
              │  ┌─────────┐  ┌─────────┐        │
              │  │ Agent 1 │  │ Agent 2 │  ...   │
              │  │ workspace│  │workspace│        │
              │  └─────────┘  └─────────┘        │
              └──────────────────────────────────┘
```

---

## 3. Database Changes

### 3.1 Schema Changes to Existing Tables

#### `cohorts` — Column Updates

```sql
-- Rename authTokenHash to authTokenEncrypted (we need to decrypt, not just verify)
ALTER TABLE cohorts RENAME COLUMN auth_token_hash TO auth_token_encrypted;

-- Add connection configuration
ALTER TABLE cohorts ADD COLUMN connection_config jsonb NOT NULL DEFAULT '{}';

-- Add minimum gateway version tracked
ALTER TABLE cohorts ADD COLUMN gateway_version varchar(50);
```

**`connectionConfig` JSON shape:**

```ts
type ConnectionConfig = {
  httpEndpoint: 'responses' | 'chatCompletions';
  healthCheckIntervalMs: number; // default: 60000
  maxRetries: number; // default: 3
  timeoutMs: number; // default: 30000
  lastError?: {
    code: string;
    message: string;
    at: string; // ISO timestamp
  };
};
```

### 3.2 New Table: `task_queue`

Queues task executions when engine is offline. Drained FIFO when engine
reconnects.

```ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { cohorts } from './cohorts';
import { tasks } from './tasks';
import { agents } from './agents';
import { comments } from './comments';

export const taskQueueStatusEnum = pgEnum('task_queue_status', [
  'queued',
  'processing',
  'completed',
  'failed',
  'expired',
]);

export const taskQueue = pgTable(
  'task_queue',
  {
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

    // The comment that triggered this execution (optional — could be direct assignment)
    commentId: uuid('comment_id').references(() => comments.id, {
      onDelete: 'set null',
    }),

    // Full prompt sent to the agent (includes task context)
    prompt: text('prompt').notNull(),

    // Session key for the gateway request
    sessionKey: varchar('session_key', { length: 255 }).notNull(),

    status: taskQueueStatusEnum('status').default('queued').notNull(),

    // Retry tracking
    attempts: integer('attempts').default(0).notNull(),
    maxAttempts: integer('max_attempts').default(3).notNull(),
    error: jsonb('error'),

    // Timestamps
    queuedAt: timestamp('queued_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }), // TTL: 24h default
  },
  (table) => ({
    cohortStatusIdx: index('idx_task_queue_cohort_status').on(
      table.cohortId,
      table.status
    ),
    queuedAtIdx: index('idx_task_queue_queued_at').on(table.queuedAt),
  })
);
```

### 3.3 New Table: `engine_events`

Tracks engine connection lifecycle for debugging and dashboards.

```ts
export const engineEventTypeEnum = pgEnum('engine_event_type', [
  'connected',
  'disconnected',
  'health_check_failed',
  'health_check_recovered',
  'auth_failed',
  'token_rotated',
  'agent_synced',
  'clone_synced',
  'queue_drained',
  'version_checked',
]);

export const engineEvents = pgTable(
  'engine_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    cohortId: uuid('cohort_id')
      .notNull()
      .references(() => cohorts.id, { onDelete: 'cascade' }),

    eventType: engineEventTypeEnum('event_type').notNull(),
    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    cohortCreatedIdx: index('idx_engine_events_cohort_created').on(
      table.cohortId,
      table.createdAt
    ),
    eventTypeIdx: index('idx_engine_events_type').on(table.eventType),
  })
);
```

### 3.4 New Table: `clone_foundation`

Stores Clone Foundation answers in Cohortix DB (source of truth) before syncing
to engine.

```ts
export const cloneFoundation = pgTable('clone_foundation', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Links to user, not org — clone is personal
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Structured clone data
  displayName: varchar('display_name', { length: 255 }).notNull(),
  values: jsonb('values').default([]).notNull(), // ["integrity", "growth", ...]
  decisionMaking: text('decision_making'), // How they make decisions
  expertise: jsonb('expertise').default([]).notNull(), // ["marketing", "engineering", ...]
  communicationStyle: text('communication_style'),
  aspirations: text('aspirations'),
  customFields: jsonb('custom_fields').default({}).notNull(), // Extensible

  // Sync tracking
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  syncedToCohortId: uuid('synced_to_cohort_id').references(() => cohorts.id, {
    onDelete: 'set null',
  }),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
```

### 3.5 RLS Policies

```sql
-- task_queue: scoped to cohort membership
ALTER TABLE task_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY task_queue_service_bypass ON task_queue FOR ALL
  USING (auth.role() = 'service_role');
CREATE POLICY task_queue_scoped_access ON task_queue FOR ALL
  USING (cohort_id IN (
    SELECT cohort_id FROM cohort_user_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM cohorts WHERE owner_user_id = auth.uid()
  ));

-- engine_events: same scoping
ALTER TABLE engine_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY engine_events_service_bypass ON engine_events FOR ALL
  USING (auth.role() = 'service_role');
CREATE POLICY engine_events_scoped_access ON engine_events FOR SELECT
  USING (cohort_id IN (
    SELECT cohort_id FROM cohort_user_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM cohorts WHERE owner_user_id = auth.uid()
  ));

-- clone_foundation: user-owned only
ALTER TABLE clone_foundation ENABLE ROW LEVEL SECURITY;
CREATE POLICY clone_foundation_service_bypass ON clone_foundation FOR ALL
  USING (auth.role() = 'service_role');
CREATE POLICY clone_foundation_user_access ON clone_foundation FOR ALL
  USING (user_id = auth.uid());
```

---

## 4. Engine Proxy Service Layer

The Engine Proxy is a server-side service layer that handles all communication
between Cohortix and the user's OpenClaw Gateway. **The frontend never
communicates with the gateway directly.**

### 4.1 Core Service: `EngineProxyService`

```ts
// apps/web/src/server/services/engine-proxy.ts

export class EngineProxyService {
  constructor(
    private gatewayUrl: string,
    private authToken: string,
    private options: {
      timeoutMs: number;
      maxRetries: number;
    }
  ) {}

  /**
   * Send a prompt to an agent via /v1/responses
   * Returns an SSE stream for real-time response
   */
  async sendToAgent(params: {
    agentId: string; // OpenClaw agent ID (externalId)
    sessionKey: string; // Deterministic session key
    input: string; // Full prompt with context
    stream?: boolean;
  }): Promise<ReadableStream | AgentResponse> {}

  /**
   * Invoke a tool directly via /tools/invoke
   */
  async invokeTool(params: {
    tool: string;
    args: Record<string, unknown>;
    sessionKey?: string;
  }): Promise<ToolResponse> {}

  /**
   * Read a file from agent workspace
   */
  async readFile(path: string): Promise<string> {}

  /**
   * Write a file to agent workspace
   */
  async writeFile(path: string, content: string): Promise<void> {}

  /**
   * Check gateway health and version.
   * NOTE: OpenClaw has NO HTTP health endpoint. We use /tools/invoke instead.
   * - Health: /tools/invoke { tool: "session_status" }
   * - Version: /tools/invoke { tool: "exec", args: { command: "openclaw --version" } }
   */
  async healthCheck(): Promise<HealthCheckResult> {
    // 1. Call session_status for liveness
    // 2. Call exec openclaw --version for version
    // 3. Return combined result
  }

  /**
   * Discover existing agents on the gateway.
   * Uses: /tools/invoke { tool: "exec", args: { command: "openclaw agents list --json" } }
   */
  async discoverAgents(): Promise<GatewayAgent[]> {}

  /**
   * Invoke a tool on a SPECIFIC agent's workspace (multi-agent support).
   * NOTE: /tools/invoke does NOT support x-openclaw-agent-id header.
   * Instead, use sessionKey: "agent:<agentId>:main" to target the right workspace.
   */
  async invokeToolForAgent(params: {
    agentExternalId: string;
    tool: string;
    args: Record<string, unknown>;
  }): Promise<ToolResponse> {
    return this.invokeTool({
      ...params,
      sessionKey: `agent:${params.agentExternalId}:main`,
    });
  }
}
```

### 4.2 Factory: `getEngineProxy(cohortId)`

```ts
// apps/web/src/server/services/engine-proxy-factory.ts

export async function getEngineProxy(
  cohortId: string
): Promise<EngineProxyService> {
  // 1. Fetch cohort from DB
  const cohort = await getCohortById(cohortId);
  if (!cohort.gatewayUrl || !cohort.authTokenEncrypted) {
    throw new EngineNotConnectedError(cohortId);
  }

  // 2. Decrypt auth token
  const authToken = decrypt(cohort.authTokenEncrypted);

  // 3. Merge connection config with defaults
  const config = {
    timeoutMs: cohort.connectionConfig?.timeoutMs ?? 30000,
    maxRetries: cohort.connectionConfig?.maxRetries ?? 3,
  };

  return new EngineProxyService(cohort.gatewayUrl, authToken, config);
}
```

### 4.3 Request Headers

**For `/v1/responses` (agent communication):**

```ts
const headers = {
  Authorization: `Bearer ${authTokenOrPassword}`, // Works for both token and password auth modes
  'Content-Type': 'application/json',
  'x-openclaw-agent-id': agentExternalId, // Target agent (/v1/responses ONLY)
  'x-openclaw-session-key': sessionKey, // Per-task session (/v1/responses ONLY)
  'x-cohortix-request-id': crypto.randomUUID(), // Idempotency key
};
```

**For `/tools/invoke` (tool calls, file I/O, health):**

```ts
const headers = {
  Authorization: `Bearer ${authTokenOrPassword}`,
  'Content-Type': 'application/json',
};
// NOTE: /tools/invoke does NOT support x-openclaw-agent-id or x-openclaw-session-key headers.
// Agent targeting is done via the `sessionKey` field in the request BODY.
// Body: { tool, args, sessionKey: "agent:<agentId>:main" }
```

**Auth mode support:** OpenClaw supports two auth modes — both use the same
`Authorization: Bearer <value>` header:

- `gateway.auth.mode = "token"` → value is the gateway token
- `gateway.auth.mode = "password"` → value is the gateway password

Cohortix stores whichever credential the user provides during connection setup.
The connection wizard labels the field based on detected auth mode.

### 4.4 Error Classification

```ts
type EngineErrorType =
  | 'auth_failed' // 401/403 → token expired/changed
  | 'unreachable' // ECONNREFUSED, timeout → engine offline
  | 'endpoint_disabled' // 404 on /v1/responses → HTTP endpoint not enabled
  | 'rate_limited' // 429 → too many concurrent requests
  | 'agent_error' // 500 from agent execution
  | 'version_mismatch' // Gateway version too old
  | 'unknown'; // Unexpected errors

function classifyError(error: unknown): EngineErrorType {
  if (error instanceof Response) {
    if (error.status === 401 || error.status === 403) return 'auth_failed';
    if (error.status === 404) return 'endpoint_disabled';
    if (error.status === 429) return 'rate_limited';
    if (error.status >= 500) return 'agent_error';
  }
  if (error instanceof TypeError && error.message.includes('fetch'))
    return 'unreachable';
  return 'unknown';
}
```

---

## 5. API Routes

### 5.1 Engine Connection

#### `POST /api/v1/engine/connect`

Establishes connection between a cohort and a gateway.

```ts
// Request
{
  cohortId: string;
  gatewayUrl: string; // wss:// or https://
  authToken: string;
  hosting: 'self_hosted';
}

// Response (200)
{
  status: 'connected';
  runtimeStatus: 'online';
  gatewayVersion: '2026.3.2';
  existingAgents: [
    { id: 'main', name: 'Main', workspace: '~/.openclaw/workspace' },
    {
      id: 'researcher',
      name: 'Researcher',
      workspace: '~/.openclaw/workspace-researcher',
    },
  ];
}

// Response (400) — validation errors
// Response (422) — connection failed (with classified error)
```

**Flow:**

1. Validate input (URL format, non-empty token)
2. Normalize gateway URL (strip trailing slash, validate protocol)
3. Test connection:
   `POST <gatewayUrl>/tools/invoke { tool: "session_status", args: {} }`
4. Check gateway version:
   `POST <gatewayUrl>/tools/invoke { tool: "exec", args: { command: "openclaw --version" } }`
   → reject if below minimum
5. Discover existing agents:
   `POST <gatewayUrl>/tools/invoke { tool: "exec", args: { command: "openclaw agents list --json" } }`
6. Encrypt auth token → store in `cohorts.authTokenEncrypted`
7. Update `cohorts.runtimeStatus = 'online'`, `gatewayUrl`, `hosting`,
   `gatewayVersion`
8. Insert `engine_events` record (type: 'connected')
9. Return existing agents for import flow

#### `POST /api/v1/engine/verify`

Re-verify an existing connection (called from settings or dashboard).

```ts
// Request
{ cohortId: string }

// Response (200)
{
  reachable: boolean;
  latencyMs: number;
  gatewayVersion: string;
  runtimeStatus: 'online' | 'offline' | 'error';
  agentCount: number;
  error?: { type: EngineErrorType; message: string };
}
```

#### `POST /api/v1/engine/disconnect`

Disconnects a cohort from its gateway.

```ts
// Request
{
  cohortId: string;
}

// Flow:
// 1. Clear gatewayUrl, authTokenEncrypted
// 2. Set runtimeStatus = 'offline'
// 3. Insert engine_events record (type: 'disconnected')
// 4. Cancel all queued tasks (set status = 'expired')
```

#### `PUT /api/v1/engine/token`

Rotate gateway auth token without full reconnection wizard.

```ts
// Request
{
  cohortId: string;
  newToken: string;
}

// Flow:
// 1. Test new token against gateway
// 2. Encrypt and store
// 3. Insert engine_events record (type: 'token_rotated')
```

### 5.2 Task Execution

#### `POST /api/v1/engine/send`

Sends a prompt to an agent. Called when @mention is parsed.

```ts
// Request
{
  cohortId: string;
  agentId: string;          // Cohortix agent UUID
  taskId: string;           // Task UUID for session key derivation
  input: string;            // Full prompt (comment + task context)
  commentId?: string;       // Triggering comment
  stream?: boolean;         // Default: true
}

// Response (200) — streaming
Content-Type: text/event-stream

event: response.created
data: { "sessionKey": "cohortix:task:abc:agent:def" }

event: response.output_text.delta
data: { "delta": "Based on my research..." }

event: response.completed
data: { "text": "...", "usage": { ... } }

// Response (202) — queued (engine offline)
{
  status: 'queued';
  queueId: string;
  message: 'Agent will respond when engine is back online.';
}
```

**Flow:**

1. Resolve `agentId` → `externalId` (OpenClaw agent ID)
2. Derive session key: `cohortix:task:<taskId>:agent:<externalId>`
3. Create `task_sessions` record (status: 'running')
4. Check engine status:
   - **Online:** Proxy to gateway `POST /v1/responses` → stream response →
     insert comment → update task_session
   - **Offline:** Insert into `task_queue` → return 202

### 5.3 Clone Sync

#### `POST /api/v1/engine/clone/sync`

Writes Clone Foundation data to gateway workspace.

```ts
// Request
{
  cohortId: string;
}

// Flow:
// 1. Fetch clone_foundation for requesting user
// 2. Resolve target agent (clone agent) and its externalId
// 3. Generate workspace files from templates
// 4. For each file, call engine proxy invokeToolForAgent(agentExternalId, "write", { path, content })
//    This uses sessionKey: "agent:<externalId>:main" to write to the correct workspace
// 5. Update clone_foundation.lastSyncedAt
// 6. Insert engine_events record (type: 'clone_synced')
```

**File generation templates:**

```ts
function generateSoulMd(clone: CloneFoundation): string {
  return `# SOUL.md - ${clone.displayName}

## Identity
I am ${clone.displayName} — your AI clone.

## Values
${clone.values.map((v) => `- ${v}`).join('\n')}

## Decision Making
${clone.decisionMaking || 'Adaptive and context-aware.'}

## Communication Style
${clone.communicationStyle || 'Clear, direct, and helpful.'}

## Expertise
${clone.expertise.map((e) => `- ${e}`).join('\n')}

## Aspirations
${clone.aspirations || ''}

---
*Managed by Cohortix. Edits sync automatically.*
`;
}

function generateIdentityMd(clone: CloneFoundation): string {
  return `# IDENTITY.md

- **Name:** ${clone.displayName}
- **Creature:** AI Clone
- **Vibe:** ${clone.communicationStyle || 'Helpful and direct'}
`;
}

function generateUserMd(user: User): string {
  return `# USER.md - About Your Human

- **Name:** ${user.name}
- **Timezone:** ${user.timezone || 'UTC'}
`;
}
```

### 5.4 Agent Sync

#### `POST /api/v1/engine/agents/sync`

Provisions or updates an agent on the gateway.

```ts
// Request
{
  cohortId: string;
  agentId: string; // Cohortix agent UUID
  action: 'provision' | 'update' | 'delete';
}

// Flow (provision):
// 1. Fetch agent record from DB
// 2. Generate workspace files (AGENTS.md, SOUL.md for this agent's role)
// 3. Attempt: POST /tools/invoke { tool: "exec", args: { command: "openclaw agents add <id> --non-interactive --workspace ~/.openclaw/workspace-<id> --model <model>" } }
//    - If exec is denied over HTTP (user restricted tool policy), fall back to providing config snippet
//    - NOTE: exec is NOT in the HTTP hard deny list, so this works by default
// 4. Write workspace files via /tools/invoke { tool: "write", sessionKey: "agent:<id>:main" }
// 5. Update agent.externalId with the OpenClaw agentId
// 6. Insert engine_events record (type: 'agent_synced')
```

#### `POST /api/v1/engine/agents/discover`

Discovers existing agents on the gateway.

```ts
// Request
{
  cohortId: string;
}

// Flow:
// 1. Call /tools/invoke { tool: "exec", args: { command: "openclaw agents list --json --bindings" } }
// 2. Parse agent list (JSON output includes id, workspace, model, bindings)
// 3. Return agents not yet imported into Cohortix

// Response
{
  agents: [
    {
      externalId: 'main',
      name: 'Main',
      model: 'anthropic/claude-opus-4-6',
      workspace: '~/.openclaw/workspace',
      imported: false,
    },
  ];
}
```

#### `POST /api/v1/engine/agents/import`

Imports an existing gateway agent into Cohortix.

```ts
// Request
{
  cohortId: string;
  externalId: string; // OpenClaw agent ID to import
  asClone: boolean; // If true, merge Clone Foundation data
}

// Flow:
// 1. Read agent's workspace files from gateway (SOUL.md, IDENTITY.md, etc.)
// 2. Create agent record in DB with externalId
// 3. If asClone: merge Clone Foundation data into SOUL.md (append, never overwrite)
// 4. Update agent profile page with imported data
```

### 5.5 Workspace File Management

#### `GET /api/v1/engine/files/:path`

Read a workspace file from the gateway.

```ts
// Example: GET /api/v1/engine/files/SOUL.md?cohortId=xxx&agentId=yyy
// → Resolves agent's externalId from DB
// → Proxies to /tools/invoke { tool: "read", args: { path: "SOUL.md" }, sessionKey: "agent:<externalId>:main" }
// NOTE: sessionKey targets the correct agent's workspace in multi-agent setups
```

#### `PUT /api/v1/engine/files/:path`

Write/update a workspace file on the gateway.

```ts
// Request body: { content: string, cohortId: string, agentId: string }
// → Resolves agent's externalId from DB
// → Proxies to /tools/invoke { tool: "write", args: { path, content }, sessionKey: "agent:<externalId>:main" }
// NOTE: sessionKey targets the correct agent's workspace in multi-agent setups
```

### 5.6 Health Check

#### `GET /api/v1/engine/health`

```ts
// Query param: ?cohortId=xxx
//
// Implementation:
// 1. POST <gatewayUrl>/tools/invoke { tool: "session_status", args: {} }  → liveness check
// 2. If liveness succeeds: POST /tools/invoke { tool: "exec", args: { command: "openclaw --version" } }
// 3. Measure round-trip latency
//
// NOTE: OpenClaw has NO dedicated HTTP health endpoint.
// All health probing goes through /tools/invoke (always enabled, no config needed).

// Response (200)
{
  status: 'online' | 'offline' | 'error';
  latencyMs: number;
  gatewayVersion: string;
  lastHeartbeat: string;      // ISO timestamp
  consecutiveFailures: number;
  error?: { type: EngineErrorType; message: string };
}
```

---

## 6. Task Execution Pipeline (Detailed)

### 6.1 @Mention Parsing

When a comment is created with `mentionedAgentIds`:

```ts
// apps/web/src/server/services/task-execution.ts

export async function handleAgentMention(params: {
  commentId: string;
  taskId: string;
  cohortId: string;
  mentionedAgentIds: string[]; // Cohortix agent UUIDs
  commentText: string;
}) {
  // 1. Build full prompt with PPV context
  const prompt = await buildTaskPrompt(params.taskId, params.commentText);

  // 2. Create parallel task_sessions (one per mentioned agent)
  const sessions = await Promise.all(
    params.mentionedAgentIds.map((agentId) =>
      createTaskExecution({
        cohortId: params.cohortId,
        taskId: params.taskId,
        agentId,
        commentId: params.commentId,
        prompt,
      })
    )
  );

  return sessions;
}
```

### 6.2 Prompt Building

```ts
async function buildTaskPrompt(
  taskId: string,
  commentText: string
): Promise<string> {
  const task = await getTaskById(taskId);
  const operation = task.operationId
    ? await getOperationById(task.operationId)
    : null;

  let prompt = '';

  // Task context
  prompt += `## Task: ${task.title}\n`;
  if (task.description) prompt += `${task.description}\n\n`;
  prompt += `**Status:** ${task.status}\n`;
  if (task.dueDate) prompt += `**Due:** ${task.dueDate}\n`;

  // Operation context (if available)
  if (operation) {
    prompt += `\n## Operation: ${operation.name}\n`;
    if (operation.description) prompt += `${operation.description}\n`;
    // Future: include operation's cohortix.md content here
  }

  // The actual request
  prompt += `\n## Request\n${commentText}\n`;

  // Instructions
  prompt += `\n---\nIf you need more context about this task or operation, ask. `;
  prompt += `Post your response as a comment on this task.`;

  return prompt;
}
```

### 6.3 Execution Flow (Online)

```ts
async function executeOnEngine(params: {
  cohortId: string;
  agentId: string;
  taskId: string;
  commentId: string;
  prompt: string;
}): Promise<void> {
  const agent = await getAgentById(params.agentId);
  const proxy = await getEngineProxy(params.cohortId);
  const sessionKey = `cohortix:task:${params.taskId}:agent:${agent.externalId}`;

  // Create task_session record
  const session = await createTaskSession({
    taskId: params.taskId,
    agentId: params.agentId,
    cohortId: params.cohortId,
    status: 'running',
    gatewaySessionId: sessionKey,
  });

  try {
    // Send to gateway
    const response = await proxy.sendToAgent({
      agentId: agent.externalId!,
      sessionKey,
      input: params.prompt,
      stream: false, // For v1: non-streaming. v1.1: add streaming.
    });

    // Insert agent's response as a comment
    await createComment({
      taskId: params.taskId,
      entityType: 'task',
      entityId: params.taskId,
      authorType: 'agent',
      authorId: params.agentId,
      content: response.text,
      organizationId: agent.organizationId,
      scopeType: agent.scopeType,
      scopeId: agent.scopeId,
    });

    // Update task_session status
    await updateTaskSession(session.id, {
      status: 'completed',
      endedAt: new Date(),
    });
  } catch (error) {
    const errorType = classifyError(error);

    await updateTaskSession(session.id, {
      status: 'failed',
      endedAt: new Date(),
      error: { type: errorType, message: String(error) },
    });

    // Insert error comment (with retry button data)
    await createComment({
      taskId: params.taskId,
      entityType: 'task',
      entityId: params.taskId,
      authorType: 'agent',
      authorId: params.agentId,
      content: `⚠️ I couldn't complete this task. Error: ${errorType}`,
      organizationId: agent.organizationId,
      scopeType: agent.scopeType,
      scopeId: agent.scopeId,
      metadata: {
        isError: true,
        errorType,
        errorDetails: String(error),
        retryable:
          errorType !== 'auth_failed' && errorType !== 'version_mismatch',
        taskSessionId: session.id,
      },
    });
  }
}
```

### 6.4 Execution Flow (Offline → Queue)

```ts
async function queueForLater(params: {
  cohortId: string;
  agentId: string;
  taskId: string;
  commentId: string;
  prompt: string;
}): Promise<TaskQueueEntry> {
  const agent = await getAgentById(params.agentId);
  const sessionKey = `cohortix:task:${params.taskId}:agent:${agent.externalId}`;

  const entry = await insertTaskQueue({
    cohortId: params.cohortId,
    taskId: params.taskId,
    agentId: params.agentId,
    commentId: params.commentId,
    prompt: params.prompt,
    sessionKey,
    status: 'queued',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h TTL
  });

  // Insert a placeholder comment
  await createComment({
    taskId: params.taskId,
    entityType: 'task',
    entityId: params.taskId,
    authorType: 'agent',
    authorId: params.agentId,
    content: "⏳ Engine is offline. I'll respond as soon as it's back online.",
    organizationId: agent.organizationId,
    scopeType: agent.scopeType,
    scopeId: agent.scopeId,
    metadata: { isQueued: true, queueId: entry.id },
  });

  return entry;
}
```

### 6.5 Queue Drain (On Engine Recovery)

```ts
async function drainTaskQueue(cohortId: string): Promise<void> {
  const queuedTasks = await getQueuedTasks(cohortId); // FIFO order

  for (const entry of queuedTasks) {
    // Check if expired
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      await updateTaskQueue(entry.id, { status: 'expired' });
      continue;
    }

    // Check max attempts
    if (entry.attempts >= entry.maxAttempts) {
      await updateTaskQueue(entry.id, { status: 'failed' });
      continue;
    }

    // Attempt execution
    await updateTaskQueue(entry.id, {
      status: 'processing',
      attempts: entry.attempts + 1,
    });

    try {
      await executeOnEngine({
        cohortId: entry.cohortId,
        agentId: entry.agentId,
        taskId: entry.taskId,
        commentId: entry.commentId,
        prompt: entry.prompt,
      });

      await updateTaskQueue(entry.id, {
        status: 'completed',
        processedAt: new Date(),
      });
    } catch (error) {
      await updateTaskQueue(entry.id, {
        status: entry.attempts + 1 >= entry.maxAttempts ? 'failed' : 'queued',
        error: { type: classifyError(error), message: String(error) },
      });
    }
  }

  // Log drain event
  await insertEngineEvent(cohortId, 'queue_drained', {
    processed: queuedTasks.length,
  });
}
```

---

## 7. Health Monitoring Service

### 7.1 How Health Checks Work (OpenClaw-Specific)

**OpenClaw does NOT expose a dedicated HTTP health endpoint.**

All health probing uses `/tools/invoke` which is **always enabled** (no user
config needed):

- **Liveness:** `POST /tools/invoke { tool: "session_status", args: {} }` → if
  200, gateway is alive
- **Version:**
  `POST /tools/invoke { tool: "exec", args: { command: "openclaw --version" } }`
  → returns version string
- **Auth check:** Any 401/403 response = auth failure (token changed/expired)
- **Endpoint check:** 404 on `/tools/invoke` = should never happen (always
  enabled) vs 404 on `/v1/responses` = user didn't enable HTTP endpoint

This approach is more reliable than a `/health` endpoint because `/tools/invoke`
is the **only** endpoint that's always on by default.

### 7.2 Active Health Check (Dashboard Open)

When a user has the cohort dashboard open, health checks run every 60 seconds
via a React Query poll:

```ts
// apps/web/src/hooks/use-engine-health.ts

export function useEngineHealth(cohortId: string) {
  return useQuery({
    queryKey: ['engine-health', cohortId],
    queryFn: () =>
      fetch(`/api/v1/engine/health?cohortId=${cohortId}`).then((r) => r.json()),
    refetchInterval: 60_000, // 60s when window focused
    refetchIntervalInBackground: false, // Stop when tab not visible
    staleTime: 30_000,
  });
}
```

### 7.3 Background Health Check (All Active Cohorts)

A cron job (or Supabase Edge Function) runs every 5 minutes for all cohorts with
a connected engine:

```ts
// apps/web/src/server/cron/engine-health-check.ts

export async function checkAllEngines(): Promise<void> {
  const connectedCohorts = await getCohortsWithEngine(); // WHERE gateway_url IS NOT NULL

  for (const cohort of connectedCohorts) {
    try {
      const proxy = await getEngineProxy(cohort.id);
      const health = await proxy.healthCheck();

      if (cohort.runtimeStatus !== 'online') {
        // Engine recovered!
        await updateCohort(cohort.id, {
          runtimeStatus: 'online',
          lastHeartbeatAt: new Date(),
        });
        await insertEngineEvent(cohort.id, 'health_check_recovered', {
          latencyMs: health.latencyMs,
        });
        await drainTaskQueue(cohort.id); // Process queued tasks
      } else {
        await updateCohort(cohort.id, { lastHeartbeatAt: new Date() });
      }
    } catch (error) {
      const errorType = classifyError(error);

      if (errorType === 'auth_failed') {
        await updateCohort(cohort.id, { runtimeStatus: 'error' });
        await insertEngineEvent(cohort.id, 'auth_failed', {
          error: String(error),
        });
      } else {
        // Track consecutive failures
        const recentFailures = await countRecentEngineEvents(
          cohort.id,
          'health_check_failed',
          15
        );
        if (recentFailures >= 2) {
          await updateCohort(cohort.id, { runtimeStatus: 'offline' });
        }
        await insertEngineEvent(cohort.id, 'health_check_failed', {
          error: String(error),
        });
      }
    }
  }
}
```

### 7.4 Status Transitions

```
provisioning → online        (first successful connection)
online → offline             (3 consecutive health check failures)
online → error               (auth failure detected)
offline → online             (health check succeeds → drain queue)
error → online               (token updated + health check succeeds)
any → offline                (user disconnects engine)
```

---

## 8. BYOH Connection Wizard (UI Components)

### 8.1 Component Tree

```
<EngineSetupWizard>
  <Step1Prerequisites />          — Check OpenClaw installed + running
  <Step2EnableEndpoint />         — Show command to enable HTTP endpoint
  <Step3Connectivity />           — Choose Tailscale or Direct URL
  <Step4Credentials />            — Enter gateway URL + auth token
  <Step5Verify />                 — Real-time connection test
  <Step6DiscoverAgents />         — Show existing agents, offer import
  <Step7CloneSync />              — Sync Clone Foundation to workspace
  <Step8Success />                — Done, go to dashboard
</EngineSetupWizard>
```

### 8.2 Step 5: Verification Logic

```ts
async function verifyConnection(gatewayUrl: string, authToken: string) {
  // All verification uses /tools/invoke (always enabled) and /v1/responses (must be enabled)
  const steps = [
    { name: 'Connecting to gateway...',
      test: () => testReachability(gatewayUrl, authToken),
      // POST /tools/invoke { tool: "session_status" } — tests network + auth in one call
    },
    { name: 'Checking authentication...',
      test: () => testAuth(gatewayUrl, authToken),
      // Already verified by step 1 (401 = bad auth, 200 = good)
    },
    { name: 'Verifying Responses endpoint...',
      test: () => testResponsesEndpoint(gatewayUrl, authToken),
      // POST /v1/responses { model: "openclaw", input: "ping" } — tests if endpoint is enabled
      // If 404: user needs to enable gateway.http.endpoints.responses.enabled
    },
    { name: 'Checking gateway version...',
      test: () => checkVersion(gatewayUrl, authToken),
      // POST /tools/invoke { tool: "exec", args: { command: "openclaw --version" } }
    },
    { name: 'Discovering agents...',
      test: () => discoverAgents(gatewayUrl, authToken),
      // POST /tools/invoke { tool: "exec", args: { command: "openclaw agents list --json" } }
    },
  ];

  for (const step of steps) {
    yield { status: 'running', step: step.name };
    try {
      const result = await step.test();
      yield { status: 'passed', step: step.name, result };
    } catch (error) {
      yield { status: 'failed', step: step.name, error: classifyError(error) };
      return;
    }
  }
}
```

---

## 9. Agent Profile Page

### 9.1 Route: `/[orgSlug]/agents/[id]/profile`

Shows agent workspace files with inline editing:

```
┌──────────────────────────────────────────────────────┐
│ Agent: Researcher                    [Online] [Edit] │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ┌─ SOUL.md ──────────────────────────────────────┐   │
│ │ # SOUL.md - Researcher                         │   │
│ │                                                │   │
│ │ ## Identity                                    │   │
│ │ I am Researcher — a deep research specialist.  │   │
│ │                                                │   │
│ │ ## Values                                      │   │
│ │ - Accuracy                                     │   │
│ │ - Thoroughness                                 │   │
│ │                                     [Save] ✏️  │   │
│ └────────────────────────────────────────────────┘   │
│                                                      │
│ ┌─ IDENTITY.md ──────────────────────────────────┐   │
│ │ - Name: Researcher                             │   │
│ │ - Emoji: 🔬                                    │   │
│ │                                     [Save] ✏️  │   │
│ └────────────────────────────────────────────────┘   │
│                                                      │
│ ┌─ Configuration ────────────────────────────────┐   │
│ │ Model: anthropic/claude-sonnet-4-5             │   │
│ │ Status: Online                                 │   │
│ │ Tasks Completed: 47                            │   │
│ │ Last Active: 2 hours ago                       │   │
│ └────────────────────────────────────────────────┘   │
│                                                      │
│ ┌─ Evolution Timeline ───────────────────────────┐   │
│ │ 📚 Learned about pricing models (2h ago)       │   │
│ │ 🔄 Corrected: use USD not EUR (1d ago)         │   │
│ │ 🏆 Milestone: 50 tasks completed (3d ago)      │   │
│ └────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### 9.2 File Edit Flow

1. User clicks edit on SOUL.md
2. Inline markdown editor opens
3. User modifies content → clicks Save
4. Frontend: `PUT /api/v1/engine/files/SOUL.md` with
   `{ content, cohortId, agentId }`
5. Backend: Resolves agent's `externalId` →
   `EngineProxy.invokeToolForAgent(externalId, "write", { path: "SOUL.md", content })`
6. Gateway:
   `/tools/invoke { tool: "write", args: { path: "SOUL.md", content }, sessionKey: "agent:<externalId>:main" }`
7. UI shows "Saved ✓" confirmation

---

## 10. Token Encryption

### 10.1 Approach: AES-256-GCM with Per-Cohort Key

```ts
// apps/web/src/server/lib/encryption.ts

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const MASTER_KEY = process.env.COHORTIX_ENCRYPTION_KEY!; // 32-byte hex string

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    'aes-256-gcm',
    Buffer.from(MASTER_KEY, 'hex'),
    iv
  );
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    Buffer.from(MASTER_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return decipher.update(encryptedHex, 'hex', 'utf8') + decipher.final('utf8');
}
```

**`COHORTIX_ENCRYPTION_KEY`** stored as Vercel environment variable (never in
repo).

---

## 11. OpenClaw Compatibility & Security Requirements

### 11.1 Minimum Gateway Version: `2026.1.29`

Based on security audit research, **2026.1.29 is the hard minimum** due to
critical CVE patches:

| CVE            | Severity               | Description                                                                                                                  | Fixed In  |
| -------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------- |
| CVE-2026-25253 | 🔴 Critical (CVSS 8.8) | Auth token theft via WebSocket hijacking — attacker crafts malicious URL, victim's OpenClaw sends token to attacker's server | 2026.1.29 |
| CVE-2026-24763 | 🟡 High                | Command injection in Docker sandbox via PATH handling                                                                        | 2026.1.29 |
| CVE-2026-27486 | 🟡 High                | Privilege escalation/DoS in CLI on shared hosts                                                                              | 2026.2.14 |

**Our connection wizard MUST reject versions below 2026.1.29** with a clear
message and update instructions.

### 11.2 Required User Configuration for BYOH

Users must enable these settings for Cohortix integration:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: true }, // Required: disabled by default
      },
    },
    // For remote access (one of these):
    bind: 'loopback', // Default + use Tailscale Funnel
    // OR
    bind: 'tailnet', // Direct Tailscale access
    auth: {
      mode: 'token', // Required for non-loopback
      // token is auto-generated or user-specified
    },
  },
}
```

**Non-loopback binding REQUIRES token/password auth.** The gateway refuses to
start without it.

### 11.3 Known Compatibility Risks

#### Risk A: `/tools/invoke` sessionKey Workspace Routing (⚠️ Needs Testing)

The SDD assumes `sessionKey: "agent:researcher:main"` makes `/tools/invoke` tool
calls (read, write, exec) operate in the researcher's workspace directory. **The
docs confirm sessionKey determines which agent's tool POLICIES apply, but do not
explicitly confirm it changes the tool's working directory (CWD).**

- **If it works:** Multi-agent file management works as designed.
- **If it doesn't:** We need to use absolute paths
  (`~/.openclaw/workspace-researcher/SOUL.md`) instead of relative paths, or use
  `/v1/responses` with a file-write instruction for agent-specific workspace
  writes.
- **Action:** Test during Week 1 sprint. This is a **blocking verification**.

#### Risk B: `exec` Tool PATH in Gateway Context

When calling `openclaw agents add` via `/tools/invoke { tool: "exec" }`, the
gateway process may not have the same PATH as the user's shell. The `openclaw`
binary might not be found.

- **Mitigation:** Use the full path to the binary. During connection
  verification, detect the OpenClaw binary path via
  `/tools/invoke { tool: "exec", args: { command: "which openclaw || command -v openclaw" } }`
  and store it in `connectionConfig`.

#### Risk C: User's Tool Policy May Restrict exec

If a user has configured `tools.deny: ["exec"]` on their agent or globally,
agent provisioning via `openclaw agents add` will fail (404 from
`/tools/invoke`).

- **Detection:** During connection wizard Step 5, attempt a harmless exec
  (`openclaw --version`). If it returns 404, inform user that exec tool access
  is needed for full integration.
- **Fallback:** Provide copy-paste config snippets for manual agent setup.

### 11.4 Minimum System Requirements (for BYOH Users)

From OpenClaw documentation:

- **Node.js:** 22.0.0+ (auto-installed by OpenClaw installer)
- **RAM:** 2 GB minimum (8 GB recommended)
- **Disk:** 20 GB minimum
- **OS:** macOS, Linux native; Windows via WSL2 only
- **Network:** Tailscale (recommended) or any method to expose port 18789

### 11.5 Managed Hosting Architecture Notes (Phase 2 Reference)

For future managed hosting, research confirms Fly.io is viable:

- **Docker image:** `alpine/openclaw:2026.3.2` (linux/amd64 + arm64, ~1GB)
- **Persistent volumes:** Mount at `/data/.openclaw` with
  `OPENCLAW_HOME=/data/.openclaw`
- **Auto-sleep:** Configurable via `auto_stop_machines` (disable for 24/7
  operation)
- **Programmatic control:** Fly.io Machines API supports
  create/start/stop/restart
- **Secrets:** API keys via `fly secrets set` (injected at runtime)
- **Provisioning flow:** Cohortix backend → Fly.io Machines API → create app →
  attach volume → launch machine → run `openclaw onboard` → configure auth →
  store gateway URL + token

This validates the Phase 2 managed hosting design. No changes needed to the BYOH
integration design — the Engine Proxy treats both hosting types identically once
`gatewayUrl` + `authToken` are stored.

---

## 12. Feature Flag

```
release.engine.byoh-connection     — BYOH connection wizard
release.engine.task-execution      — @mention → agent execution pipeline
release.engine.agent-profiles      — Agent profile page with file editing
release.engine.health-monitoring   — Engine health probes + status UI
release.engine.task-queue          — Offline task queuing
```

Rollout: internal → 10% → 50% → 100%

---

## 13. Migration Plan

### Step 1: Schema Migration

```sql
-- 1. Rename column
ALTER TABLE cohorts RENAME COLUMN auth_token_hash TO auth_token_encrypted;

-- 2. Add new columns
ALTER TABLE cohorts ADD COLUMN connection_config jsonb NOT NULL DEFAULT '{}';
ALTER TABLE cohorts ADD COLUMN gateway_version varchar(50);

-- 3. Create new tables
-- task_queue (see Section 3.2)
-- engine_events (see Section 3.3)
-- clone_foundation (see Section 3.4)

-- 4. Create enums
CREATE TYPE task_queue_status AS ENUM ('queued', 'processing', 'completed', 'failed', 'expired');
CREATE TYPE engine_event_type AS ENUM ('connected', 'disconnected', 'health_check_failed', 'health_check_recovered', 'auth_failed', 'token_rotated', 'agent_synced', 'clone_synced', 'queue_drained', 'version_checked');

-- 5. Add RLS policies (see Section 3.5)

-- 6. Add indexes (see table definitions)
```

### Step 2: Implement Engine Proxy Service

### Step 3: Add API Routes

### Step 4: Build Connection Wizard UI

### Step 5: Implement Task Execution Pipeline

### Step 6: Build Agent Profile Page

### Step 7: Implement Health Monitoring

### Step 8: Wire Feature Flags

---

## 14. Testing Strategy

### Unit Tests

- `EngineProxyService` — mock fetch, test all error classifications
- `buildTaskPrompt` — test context assembly with various task/operation
  combinations
- `encrypt`/`decrypt` — round-trip encryption
- Session key derivation — deterministic output
- Queue drain logic — FIFO order, TTL expiry, retry limits

### Integration Tests

- Engine connection flow (mock gateway)
- Task execution pipeline (mock gateway, verify DB state)
- Health check → status transitions
- Queue drain after engine recovery
- Clone Foundation sync → verify files written

### E2E Tests (Critical Paths)

- [ ] Full onboarding: signup → clone foundation → BYOH connect → first task
- [ ] @mention agent → receive response comment
- [ ] Engine goes offline → task queued → engine recovers → task executes
- [ ] Token rotation → verify connection persists
- [ ] Agent profile edit → save → verify file on gateway

---

## 15. Acceptance Criteria

- [ ] **AC1:** User completes BYOH connection wizard and sees "Engine Online" on
      dashboard
- [ ] **AC2:** @mentioning an agent in a task comment produces an agent response
      comment within 30s
- [ ] **AC3:** When engine is offline, task is queued and user sees "Agent will
      respond when engine is back online"
- [ ] **AC4:** When engine comes back online, queued tasks execute within 60s
      (FIFO)
- [ ] **AC5:** Clone Foundation data from onboarding appears in agent's SOUL.md
      on the gateway workspace
- [ ] **AC6:** Editing SOUL.md on the agent profile page syncs changes to the
      gateway within 5s
- [ ] **AC7:** Auth failure shows specific "Token changed" message (not generic
      "Connection lost")
- [ ] **AC8:** Multiple @mentions in one comment create parallel task_sessions
      (one per agent)
- [ ] **AC9:** Error comments include retry button and expandable error details
- [ ] **AC10:** Gateway version below minimum is rejected with update
      instructions during connection wizard
- [ ] **AC11:** Existing agents on gateway are discovered and offered for import
      during connection
- [ ] **AC12:** Two cohorts can share the same gateway URL with different agent
      bindings
- [ ] **AC13:** Gateway versions below 2026.1.29 are rejected during connection
      with clear update instructions
- [ ] **AC14:** Connection wizard detects if `exec` tool is blocked and falls
      back to config snippet instructions
- [ ] **AC15:** Both token and password auth modes work for gateway connection

---

## 16. Implementation Order (Sprint Plan)

Following the Axon Dev Codex implementation order:

```
Week 1-2: Foundation
  1. Schema migration (new tables + column changes)
  2. RLS policies
  3. Token encryption utilities
  4. EngineProxyService (core HTTP client)
  5. Error classification system
  Unit tests for all above

Week 3-4: Connection & Sync
  6. Engine connection API routes (/connect, /verify, /disconnect, /token)
  7. BYOH Connection Wizard UI (8 steps)
  8. Clone Foundation table + sync service
  9. Agent discovery + import flow
  Integration tests

Week 5-6: Task Execution
  10. @mention parsing + task execution pipeline
  11. Prompt builder (task + operation context)
  12. Task queue (offline queuing + drain)
  13. Comment creation for agent responses + errors
  14. Retry mechanism
  Integration + E2E tests

Week 7-8: Monitoring & Polish
  15. Health monitoring service (active + background)
  16. Engine status UI (dashboard badge, banner)
  17. Agent profile page (file viewing/editing)
  18. Feature flag wiring
  19. E2E test suite
  20. Documentation
```

**Estimated total: 8 weeks**

---

## 17. Approval

- [ ] PM (August) reviewed
- [ ] Architect reviewed
- [x] CEO Agent (Alim) drafted
- [ ] **Ahmad approved**

---

_This SDD implements [PRD-003](./PRD-003-openclaw-integration.md). Schema
changes build on [SDD-002](./SDD-002-COHORT-ARCHITECTURE.md). OpenClaw API
surface documented in the
[Gateway Audit](../research/openclaw-gateway-audit.md)._
