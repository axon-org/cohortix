# OpenClaw Gateway API Audit

**Date:** 2026-03-04 **Purpose:** Understand the full Gateway API surface for
Cohortix ↔ OpenClaw integration (BYOH-first) **OpenClaw Version:** 2026.3.2
(85377a2)

---

## 1. Gateway Overview

The OpenClaw Gateway is a **single long-running process** that serves as the
control plane for all agent operations. It multiplexes **WebSocket + HTTP** on a
single port (default `18789`).

- **One Gateway per host** (recommended)
- Owns: channel connections, session state, agent workspaces, auth profiles
- Bind modes: `loopback` (default), `lan`, `tailnet`, `custom`
- Auth required for non-loopback binds

---

## 2. HTTP API Endpoints (What Cohortix Can Call)

### 2.1 OpenAI Chat Completions — `POST /v1/chat/completions`

- **Status:** Disabled by default, enable via config
- **Auth:** Bearer token (gateway token/password)
- **Agent targeting:** `model: "openclaw:<agentId>"` or `x-openclaw-agent-id`
  header
- **Session control:** `x-openclaw-session-key` header for explicit session
  routing; `user` field for stable session derivation
- **Streaming:** SSE with `stream: true`
- **Stateless by default** — new session per request unless `user` or
  `x-openclaw-session-key` is set

### 2.2 OpenResponses API — `POST /v1/responses`

- **Status:** Disabled by default, enable via config
- **Auth:** Same as above
- **Agent targeting:** Same as above
- **Session control:** Same as above
- **Supports:** Text input, images (`input_image`), files (`input_file`),
  client-side function tools
- **Streaming:** SSE with richer event types (`response.created`,
  `response.output_text.delta`, etc.)
- **Better for Cohortix** — richer event model, supports files/images, tool call
  round-trips

### 2.3 Tools Invoke — `POST /tools/invoke`

- **Status:** Always enabled
- **Auth:** Bearer token
- **Purpose:** Invoke a single tool directly without running a full agent turn
- **Hard deny list:** `sessions_spawn`, `sessions_send`, `gateway`,
  `whatsapp_login` (configurable)
- **Useful for:** Reading files from agent workspace, checking session status,
  direct tool calls

### 2.4 Health — `GET /health` (via WS `call health`)

- **Returns:** Health snapshot including channel status, session counts, uptime

---

## 3. WebSocket Protocol (Full Control Plane)

### 3.1 Connection Handshake

```
Client → Gateway: connect { auth, role, scopes, device }
Gateway → Client: hello-ok { protocol, policy, presence, health }
```

### 3.2 Framing

- **Request:** `{type:"req", id, method, params}`
- **Response:** `{type:"res", id, ok, payload|error}`
- **Event:** `{type:"event", event, payload, seq?}`

### 3.3 Roles

- `operator` — control plane client (CLI/UI/automation) with scopes:
  `operator.read`, `operator.write`, `operator.admin`
- `node` — capability host (camera/screen/canvas) with caps/commands/permissions

### 3.4 Agent Runs (Two-Stage)

1. Immediate `accepted` ack
2. Streamed `agent` events → final `ok`/`error` response

### 3.5 Key RPC Methods

- `health` — gateway health snapshot
- `status` — detailed status
- `system-presence` — connected devices/clients
- `cron.*` — cron job management
- `tools.catalog` — list available tools for an agent
- `exec.approval.resolve` — approve/reject exec requests

---

## 4. Multi-Agent Architecture

### 4.1 Agent Isolation

Each agent has its own:

- **Workspace** (files, AGENTS.md, SOUL.md, etc.)
- **Agent directory** (`~/.openclaw/agents/<agentId>/agent/`) for auth profiles,
  model registry
- **Session store** (`~/.openclaw/agents/<agentId>/sessions/`)
- **Sandbox & tool policies** (configurable per-agent)

### 4.2 Routing (Bindings)

Inbound messages routed to agents via deterministic bindings:

1. Peer match (exact DM/group/channel id)
2. Guild/team match
3. Account match
4. Channel-wide match
5. Fallback to default agent

### 4.3 Per-Agent Configuration

```json5
{
  agents: {
    list: [
      {
        id: 'researcher',
        workspace: '~/.openclaw/workspace-researcher',
        model: 'anthropic/claude-sonnet-4-5',
        sandbox: { mode: 'all', scope: 'agent' },
        tools: {
          allow: ['read', 'web_search', 'web_fetch'],
          deny: ['exec', 'write'],
        },
      },
    ],
  },
}
```

---

## 5. Authentication Models

| Mode            | How                             | Best For                                 |
| --------------- | ------------------------------- | ---------------------------------------- |
| `token`         | `Authorization: Bearer <token>` | Programmatic access (Cohortix → Gateway) |
| `password`      | Shared password                 | Simple setups                            |
| `trusted-proxy` | Tailscale identity headers      | Tailnet-only access                      |
| Device pairing  | Keypair + challenge signing     | iOS/Android nodes                        |

**For BYOH:** Token auth is the clear choice. User generates a gateway token,
provides it to Cohortix.

---

## 6. Remote Access Options (Critical for BYOH)

### 6.1 Tailscale Serve (Recommended for BYOH)

- Gateway stays on loopback
- Tailscale provides HTTPS + routing within tailnet
- Config: `gateway.tailscale.mode: "serve"`
- Access: `https://<magicdns>/`

### 6.2 Tailscale Funnel (Public Internet)

- Exposes gateway to public internet via Tailscale
- Requires password auth
- Config: `gateway.tailscale.mode: "funnel"`
- Access: `https://<magicdns>/` (public)

### 6.3 SSH Tunnel (Universal Fallback)

- `ssh -N -L 18789:127.0.0.1:18789 user@host`
- Works anywhere with SSH access
- No new inbound ports needed

### 6.4 Direct Bind (LAN/Tailnet)

- `gateway.bind: "tailnet"` or `"lan"`
- Requires token auth
- Direct WebSocket/HTTP access

---

## 7. Discovery (How Cohortix Finds User's Gateway)

### 7.1 Bonjour/mDNS (LAN only)

- Service type: `_openclaw-gw._tcp`
- TXT records: `gatewayPort`, `tailnetDns`, `gatewayTls`, etc.
- **Not reliable cross-network** — LAN convenience only

### 7.2 Tailscale MagicDNS

- Stable `<hostname>.tailnet-name.ts.net` address
- Published as `tailnetDns` hint in Bonjour beacon

### 7.3 Manual Configuration

- User provides `wss://<host>:<port>` + auth token to Cohortix

---

## 8. Session Management

- **Main session:** `agent:<agentId>:main` — primary direct chat session
- **Per-channel sessions:** auto-keyed by channel + peer
- **DM scope modes:** `main`, `per-peer`, `per-channel-peer`,
  `per-account-channel-peer`
- **Session keys are stable** — derived from routing context
- **`x-openclaw-session-key`** header allows explicit session targeting
- **Transcripts:** JSONL files at
  `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

---

## 9. Heartbeat & Health Monitoring

### Heartbeat System

- Periodic agent turns (default 30m)
- Configurable per-agent: interval, target, active hours
- Returns `HEARTBEAT_OK` or alert content
- **Not designed for Cohortix polling** — this is the agent's own self-check

### Health Probing

- `openclaw gateway call health` or `openclaw health --json`
- Returns: linked creds, channel probes, session summary, uptime
- Exit non-zero if unreachable

### For Cohortix

- Use HTTP `GET /health` or WS `call health` for liveness/readiness
- Implement Cohortix-side heartbeat polling (POST to `/v1/responses` with a
  health check prompt, or call `/tools/invoke` with `sessions_list`)

---

## 10. Workspace File Contract (What Cohortix Writes)

For Clone Foundation and agent configuration, Cohortix needs to write files to
the agent workspace:

| File           | Purpose                   |
| -------------- | ------------------------- |
| `AGENTS.md`    | Operating instructions    |
| `SOUL.md`      | Persona, boundaries, tone |
| `USER.md`      | User profile              |
| `IDENTITY.md`  | Agent name/vibe/emoji     |
| `TOOLS.md`     | Tool usage notes          |
| `HEARTBEAT.md` | Heartbeat checklist       |
| `MEMORY.md`    | Long-term memory          |
| `memory/*.md`  | Daily/typed memory files  |

**How to write:** Via `/tools/invoke` calling the `write` tool, or via
`/v1/responses` asking the agent to write files.

---

## 11. Key Limitations & Constraints

1. **HTTP endpoints are full operator access** — a valid gateway token =
   owner-level access. There's no per-user scope model on the HTTP API.
2. **No built-in user management** — OpenClaw doesn't have a concept of "users"
   with different permission levels. One gateway = one operator.
3. **Session keys are gateway-internal** — Cohortix needs to derive or store
   session keys for per-task isolation.
4. **Tool invocation over HTTP has a hard deny list** — `sessions_spawn`,
   `sessions_send` are blocked by default (configurable).
5. **No webhook/callback mechanism** — Gateway doesn't push events to external
   HTTP endpoints. Cohortix must poll or maintain a WS connection.
6. **File writes via HTTP require the `write` tool** — which is allowed by
   default but can be denied per-agent.

---

## 12. BYOH Integration Architecture (Proposed)

### Connection Flow

```
User's Machine                          Cohortix Cloud
┌──────────────┐                     ┌──────────────────┐
│ OpenClaw GW  │◄────Tailscale───────│ Cohortix Backend │
│ (loopback)   │   Funnel/Serve      │                  │
│              │   + Bearer Token     │                  │
│  Agent 1     │                     │  Cohort Record   │
│  Agent 2     │                     │  (gatewayUrl,    │
│  Agent N     │                     │   authTokenHash) │
└──────────────┘                     └──────────────────┘
```

### What Cohortix Stores Per Cohort

- `gatewayUrl` — user's gateway endpoint (Tailscale Funnel URL or direct)
- `authTokenHash` — hashed bearer token for gateway auth
- `runtimeStatus` — online/offline/error (from periodic health checks)
- `lastHeartbeatAt` — last successful health probe

### API Calls Cohortix Makes

1. **Health check:** `GET /health` or
   `POST /tools/invoke { tool: "session_status" }`
2. **Send task to agent:** `POST /v1/responses` with
   `x-openclaw-agent-id: <agentId>` and
   `x-openclaw-session-key: <task-session-key>`
3. **Read agent response:** Stream SSE from the same request
4. **Write workspace files:**
   `POST /tools/invoke { tool: "write", args: { path, content } }`
5. **List sessions:** `POST /tools/invoke { tool: "sessions_list" }`

### Configuration User Must Enable

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: true }, // or chatCompletions
      },
    },
    tailscale: { mode: 'funnel' }, // or "serve" for tailnet-only
    auth: {
      mode: 'token',
      token: '<generated-token>', // user provides this to Cohortix
    },
  },
}
```

---

## 13. Open Questions for PRD-003

1. **Tailscale dependency** — Is Tailscale a hard requirement for BYOH, or do we
   support raw `wss://` endpoints too?
2. **Connection persistence** — Do we maintain a persistent WS connection per
   cohort, or use stateless HTTP calls?
3. **Agent provisioning** — Does Cohortix configure agents on the user's
   gateway, or does the user set them up manually?
4. **Session key scheme** — How do we derive task-specific session keys?
   (`cohortix:task:<taskId>:agent:<agentId>`?)
5. **Offline handling** — What happens when the user's machine is
   asleep/offline? Queue tasks? Show "offline"?
6. **Security model** — Gateway token = full operator access. Do we need a
   proxy/middleware layer for multi-user cohorts?
7. **Event streaming** — How does Cohortix get real-time agent activity? Poll,
   long-poll, or maintain WS?
8. **Rate limiting** — Gateway has auth rate limiting. How does Cohortix handle
   multiple concurrent tasks?
