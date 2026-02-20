# OpenClaw Integration Feasibility for Cohortix

**Date:** 2026‑02‑20  
**Author:** Devi (AI Developer Specialist)

## Executive Summary

OpenClaw already provides **inbound webhooks** for triggering agent runs and a
**generic HTTP tool invocation API**. It also has a **hooks system** (event
listeners) and a **plugin/extension model** that can register new HTTP handlers,
RPC methods, tools, and channels. This means Cohortix can integrate **without
forking** by combining:

- **Inbound webhooks** (`/hooks/agent`) to send tasks to agents
- **Hooks** to emit outbound status/completion updates to Cohortix
- **Plugins** (if needed) to add a stable, purpose‑built REST/WS surface or
  heartbeat endpoint

The main gap is **agent status/heartbeat**: OpenClaw does not document a stable
“agent online/offline” API or outbound webhook event for status transitions.
This can be solved with a **small plugin** or periodic hook that pushes
heartbeat info to Cohortix, without a fork. Forking would only be necessary if
Cohortix requires a first‑class, versioned public API with guaranteed backward
compatibility and deeper gateway internals.

**Recommendation:** Integrate using **webhooks + hooks + (optional) plugin**.
Avoid a fork initially; consider upstreaming a “Cohortix integration plugin” or
proposing a stable API upstream once the integration stabilizes.

---

## 1. Current OpenClaw API Capabilities (Evidence‑based)

### 1.1 Inbound Webhook API (Task Ingress)

OpenClaw exposes a webhook endpoint that external systems can call to trigger
agent work:

**Enable (config):**

```json5
{
  hooks: {
    enabled: true,
    token: 'shared-secret',
    path: '/hooks',
    allowedAgentIds: ['hooks', 'main'],
  },
}
```

- `hooks.token` required when enabled
- `hooks.path` defaults to `/hooks`

**Endpoints:**

- `POST /hooks/wake` — enqueue a system event; optionally trigger an immediate
  heartbeat
- `POST /hooks/agent` — run an isolated agent turn
- `POST /hooks/<name>` — custom mappings via `hooks.mappings`

**Payload for /hooks/agent (key fields):**

- `message` (required)
- `agentId`, `sessionKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`,
  `thinking`, `timeoutSeconds`

**Effect:** runs an isolated agent turn, posts summary into the main session,
optionally delivers to a channel.

Source: OpenClaw docs — Webhooks: `/hooks/wake`, `/hooks/agent`, mappings, auth,
and security guidance.  
<https://docs.openclaw.ai/automation/webhook>

### 1.2 Hooks (Outbound Event Listeners)

OpenClaw has a **hooks system** that runs inside the gateway when events fire.
Hooks can be used to send outbound notifications to Cohortix (e.g., completion,
message sent). Hooks can be bundled or installed via npm.

**Event types (examples):**

- `command:new`, `command:reset`, `command:stop`
- `agent:bootstrap`
- `gateway:startup`
- `message:received`, `message:sent`

**Hook handler receives:**

- `sessionKey`, `timestamp`, `context` (from/to/content/channelId), etc.

Source: Hooks documentation.  
<https://docs.openclaw.ai/automation/hooks>

> **Important:** Hooks are _inbound-only by default_; to send outbound webhooks,
> the hook handler must perform an HTTP request to Cohortix.

### 1.3 HTTP Tools Invoke API (Generic Tool Calls)

Gateway exposes a single tool invocation endpoint:

- **`POST /tools/invoke`** (always enabled; gated by gateway auth + tool policy)

Request body example:

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main"
}
```

**Notes:**

- Requires gateway auth token/password (Bearer)
- Default deny list includes: `sessions_spawn`, `sessions_send`, `gateway`,
  `whatsapp_login`
- Deny list can be modified via `gateway.tools` config

Source: Tools Invoke API docs.  
<https://docs.openclaw.ai/gateway/tools-invoke-http-api>

This endpoint is useful for **programmatic session inspection** and other
single‑tool operations, but it is **not a full REST API**.

### 1.4 Plugins/Extensions (Add New HTTP/RPC/Tools)

OpenClaw supports in‑process plugins that can register:

- **Gateway HTTP handlers**
- **Gateway RPC methods**
- **Agent tools**
- **CLI commands**
- **Background services**

Plugins are discovered from configured paths or installed via npm. They are
TypeScript modules with a manifest and runtime registration API.

Source: Plugins/Extensions docs.  
<https://docs.openclaw.ai/tools/plugin>

### 1.5 Session Store Ownership

OpenClaw states the **gateway is the source of truth** for session state. UI
clients should query the gateway for session lists and metadata instead of
reading files.

Source: Session Management docs.  
<https://docs.openclaw.ai/concepts/session>

### 1.6 NPM Package Exports

The `openclaw` NPM package exposes a **plugin SDK** (`./plugin-sdk`) for
extension development.

Source: `npm view openclaw --json`.

---

## 2. Gap Analysis: Cohortix Needs vs OpenClaw Capabilities

| Cohortix Requirement                      | OpenClaw Support              | Notes / Gaps                                                                                                                                 | Possible Solution                                                                                   |
| ----------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **1) Send tasks to agents**               | ✅ **Yes** via `/hooks/agent` | Supported; requires gateway hooks enabled + token                                                                                            | Use `/hooks/agent` as the primary ingress.                                                          |
| **2) Report task completion/status**      | ⚠️ **Partial**                | No native outbound webhook; hooks can listen to `message:sent` / `command` events but must _manually_ POST to Cohortix                       | Build a **hook** that posts completion/status events to Cohortix.                                   |
| **3) Online/offline heartbeat**           | ❓ **Not explicit**           | No documented endpoint for agent presence or gateway status events beyond `gateway:startup`                                                  | Implement a **plugin** that emits heartbeat to Cohortix, or poll gateway health + session activity. |
| **4) Bidirectional goal proposals**       | ⚠️ **Possible but custom**    | No built‑in “goal proposal” protocol                                                                                                         | Implement a **tool + hook** pair or custom plugin API endpoints for proposals.                      |
| **List/manage sessions programmatically** | ⚠️ **Limited**                | `/tools/invoke` can call tools like `sessions_list`, but default deny list blocks `sessions_send`/`sessions_spawn` unless explicitly allowed | Allowlist these tools or implement a plugin with explicit REST endpoints.                           |
| **Spawn runs from external triggers**     | ✅ **Yes**                    | `POST /hooks/agent` explicitly supports isolated runs                                                                                        | Use webhooks; can map to Cohortix tasks.                                                            |

**Key Gap:** There is no officially documented “agent heartbeat / presence” API
or webhook event. This is the main missing feature for Cohortix.

---

## 3. Integration Architecture (No Fork)

### 3.1 Ingress (Cohortix → OpenClaw)

- Cohortix sends task payloads to **`POST /hooks/agent`**
- Use `sessionKey` to map Cohortix task IDs to sessions (set
  `hooks.allowRequestSessionKey=true` and restrict prefixes like `task:`)
- Optionally use `name` for task labeling

### 3.2 Egress (OpenClaw → Cohortix)

- Install a **Cohortix hook** that listens for:
  - `message:sent` (agent output)
  - `command:new`/`command:reset` (task lifecycle)
- Hook handler posts JSON to Cohortix (task status updates)

### 3.3 Heartbeats

- **Option A (Plugin):** Register a background service in a plugin that pings
  Cohortix every N seconds with gateway health + agent config details
- **Option B (Polling):** Cohortix polls a lightweight endpoint exposed by a
  plugin or a reverse proxy health check

### 3.4 Goal Proposals (Future)

- Implement a **custom tool** (plugin or skill) named e.g.
  `cohortix_goal_propose`
- Agent uses tool to send structured proposals to Cohortix

---

## 4. Fork vs Integrate Analysis

### Integrate as‑is (Hooks + Webhooks + Plugins)

**Pros**

- No maintenance burden from upstream changes
- Uses supported extension mechanisms
- Fast to implement and deploy

**Cons**

- No stable, documented public REST API for sessions/agents
- Heartbeat/presence requires custom plugin
- Some tool invocations blocked by HTTP deny list unless explicitly allowed

**Risks**

- Private/undocumented gateway RPC may change
- Hook event semantics might evolve without versioned guarantees

**Mitigations**

- Encapsulate integration in Cohortix adapter service
- Use only documented endpoints (`/hooks/*`, `/tools/invoke`)
- Implement a plugin with explicit contract & versioning

### Fork OpenClaw

**Pros**

- Can add first‑class REST/WS API (sessions, agent status, heartbeats)
- Full control over event bus and stability guarantees

**Cons**

- High maintenance burden (OpenClaw is active; frequent releases)
- Security & compatibility risk diverging from upstream
- Harder upgrades, less community support

**Risks**

- Ongoing merge conflicts
- Security updates lagging

### Contribute Upstream

**Pros**

- Stability + community support
- Potential for official, versioned public API

**Cons**

- Slower iteration; approvals required
- Must align with maintainer priorities

---

## 5. Recommendation

**Do not fork initially.** Use OpenClaw’s **webhooks + hooks + plugin** model to
implement Cohortix integration.

**Rationale:**

- Task ingress is already supported via `/hooks/agent`.
- Completion/status can be emitted via hooks.
- Heartbeat and goal proposals can be implemented with a small plugin
  (registered HTTP handlers + background service), all without touching core.

If Cohortix later needs a **stable, public API surface**, propose an upstream
“Cohortix Integration API” plugin or RFC for a gateway REST API. Forking should
be a last resort if upstream refuses or if the integration requires deep
internal changes that are not feasible via plugins.

---

## 6. What Would a Fork Change? (If Needed Later)

If Cohortix must fork:

1. **Add a versioned REST API** (e.g., `/api/v1/sessions`, `/api/v1/agents`,
   `/api/v1/status`).
2. **Publish agent status events** (online/offline/idle) via webhooks or SSE.
3. **Expose a stable event stream** (WebSocket/SSE) for status + completions.
4. **Guarantee backward compatibility** with semantic versioning for API
   endpoints.

This is feasible but costly. A plugin can often achieve 80% of this with much
lower risk.

---

## 7. Evidence Links (Primary Sources)

- Webhooks (inbound): <https://docs.openclaw.ai/automation/webhook>
- Hooks (event listeners): <https://docs.openclaw.ai/automation/hooks>
- Tools Invoke API (`/tools/invoke`):
  <https://docs.openclaw.ai/gateway/tools-invoke-http-api>
- Plugins/Extensions: <https://docs.openclaw.ai/tools/plugin>
- Session Management (gateway is source of truth):
  <https://docs.openclaw.ai/concepts/session>

---

## 8. Action Plan (Next Steps)

1. **Prototype Cohortix → OpenClaw ingress** using `/hooks/agent` with a
   Cohortix task ID → `sessionKey` mapping.
2. **Create a Cohortix hook** (OpenClaw hook pack) to POST task completion
   updates to Cohortix.
3. **Draft a plugin skeleton** for heartbeat reporting + optional REST
   endpoints.
4. Decide whether to upstream a plugin or keep internal.

---

## Appendix: Key Endpoints

- `POST /hooks/agent` (task ingress)
- `POST /hooks/wake` (wake + heartbeat)
- `POST /hooks/<name>` (mapped webhook)
- `POST /tools/invoke` (single tool invocation; auth + policy gated)
