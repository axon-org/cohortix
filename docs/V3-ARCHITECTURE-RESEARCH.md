# Cohortix v3.0 Architecture Research & Design

**Version:** 1.0  
**Date:** 2026-02-11  
**Author:** Idris (Architect)  
**Status:** Research Complete — Awaiting Review

---

## Executive Summary

Cohortix v3.0 represents a strategic shift from a Clawdbot-dependent UI to a **fully autonomous agent runtime platform** with an integrated **Ally Marketplace**. This document presents research on state-of-the-art agent platforms and proposes a production-ready architecture supporting:

- **Custom agent runtime** (platform independence from OpenClaw/Clawdbot)
- **Multi-tenant agent execution** (100s of concurrent agents per tenant)
- **Ally Marketplace** (sell, rent, deploy pre-built agents)
- **Scalable infrastructure** beyond Next.js/Vercel limitations

**Key Finding:** The current Next.js/Vercel/Supabase stack is **insufficient** for v3's agent execution requirements. A dedicated **agent runtime backend** is required, while the Next.js frontend can remain on Vercel.

---

## Table of Contents

1. [Research Findings: State-of-the-Art Agent Platforms](#1-research-findings-state-of-the-art-agent-platforms)
2. [Proposed v3 Architecture](#2-proposed-v3-architecture)
3. [Infrastructure Assessment: What Changes](#3-infrastructure-assessment-what-changes)
4. [Implementation Roadmap](#4-implementation-roadmap)
5. [Open Questions & Recommendations](#5-open-questions--recommendations)

---

## 1. Research Findings: State-of-the-Art Agent Platforms

### 1.1 OpenAI Platform Evolution (2025-2026)

**Key Insight:** OpenAI deprecated the Assistants API (August 2026) in favor of the **Responses API** + **Conversations API**.

**Architecture Pattern:**
```
┌─────────────────────────────────────────────────────┐
│  RESPONSES API (Execution Primitive)                │
│  - Send input items → Receive output items          │
│  - Fewer client round-trips (vs polling)            │
│  - Per-request tool configuration                   │
│  - Background mode for async jobs                   │
└─────────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────────┐
│  CONVERSATIONS API (State Primitive)                │
│  - Durable thread-like object                       │
│  - Stores messages, tool calls, reasoning           │
│  - Replayable state across sessions                 │
│  - Compaction for long conversations                │
└─────────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────────┐
│  PROMPTS (Configuration)                            │
│  - Dashboard-managed, versioned configs             │
│  - Replace static Assistant objects                 │
└─────────────────────────────────────────────────────┘
```

**What This Means for Cohortix:**
- ✅ **Separate execution from state** (Responses vs Conversations)
- ✅ **Structured Outputs** with JSON Schema guarantees
- ✅ **Compaction workflow** for long-running ally conversations
- ✅ **MCP (Model Context Protocol)** for tool/connector integration

---

### 1.2 Anthropic Claude Agent SDK

**Key Insight:** Built on **Claude Code** runtime with an **agent harness** pattern.

**Agent Loop Pattern:**
```
Context → Thought → Action → Observation (repeat)
```

**Agent Harness Components:**
- **Tools** — Functions the agent can call
- **Prompts** — Behavior instructions
- **File System** — State management + persistence
- **Skills** — Reusable specialized behaviors (~1,500+ tokens overhead)
- **Sub-agents** — Specialized agents for complex tasks
- **Memory** — Cross-turn state tracking

**Multi-Agent Architecture:**
- **Orchestrator-Worker Pattern** — Lead agent coordinates, parallel workers execute
- **Separate context windows** — More capacity than single-window approach
- **Checkpoint-based resumption** — Graceful error recovery

**What This Means for Cohortix:**
- ✅ **Filesystem-based agent state** (not just database)
- ✅ **Skills as reusable capabilities** (marketplace potential)
- ✅ **Sub-agent delegation** for complex missions
- ✅ **Checkpoint + resume** for long-running tasks

---

### 1.3 LangGraph Cloud

**Key Insight:** **DAG-based orchestration** with **centralized state management**.

**Architecture:**
```
┌──────────────────────────────────────────────────┐
│  NODES (Python functions encoding agent logic)   │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│  STATE (Shared immutable data structure)         │
│  - Typed schemas (prevent race conditions)       │
│  - Agents read state → Return updated state      │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│  EDGES (Control flow logic)                      │
│  - Conditional edges (evaluate state → route)    │
│  - Parallel execution (coordinated via state)    │
└──────────────────────────────────────────────────┘
```

**Production Features:**
- **Double-texting handling** — Strategies: reject, queue, interrupt, rollback
- **Async background jobs** — Long-running tasks with polling/webhooks
- **Cron jobs** — Scheduled agent executions
- **Persistent state** + **checkpointing** (Postgres-backed)
- **Horizontal scaling** — Task queues + servers

**What This Means for Cohortix:**
- ✅ **Graph-based mission workflows** (vs linear pipelines)
- ✅ **State-driven coordination** (vs direct agent-to-agent messaging)
- ✅ **Postgres checkpointer** for reliability
- ✅ **Double-texting handling** (critical for multi-tenant)

---

### 1.4 CrewAI Enterprise

**Key Insight:** **Flows + Crews** architecture with **centralized management platform**.

**Components:**
- **Flows** — Deterministic, stateful, event-driven workflows (the "manager")
- **Crews** — Autonomous teams of agents with roles/goals
- **AMP (Agent Management Platform)** — Control plane for dev/deploy/monitor/scale
- **Observability** — Real-time tracing (per application, model, agent)
- **Self-hosted or SaaS** — Deployment flexibility

**What This Means for Cohortix:**
- ✅ **Mission Control = AMP equivalent** (centralized control plane)
- ✅ **Flows for deterministic missions** + **Crews for autonomous work**
- ✅ **Real-time observability** at agent/mission/org levels
- ✅ **Containerized agents** for isolation

---

### 1.5 Agent Marketplace Patterns

**Research Finding:** Emerging marketplaces follow this architecture:

```
┌─────────────────────────────────────────────────────┐
│  DISCOVERY LAYER                                    │
│  - Listings, search, filtering, ratings, reviews    │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  DEPLOYMENT LAYER                                   │
│  - Standardized packaging (containers + manifests)  │
│  - API-based delivery (vendor-hosted)               │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  ORCHESTRATION LAYER                                │
│  - Task delegation, multi-agent collaboration       │
│  - Hierarchical routing or auction-based assignment │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  GOVERNANCE LAYER                                   │
│  - Security, explainability, compliance             │
│  - Billing, usage tracking, revenue sharing         │
└─────────────────────────────────────────────────────┘
```

**Pricing Models:**
- **Commission-based** (20% platform fee on transactions)
- **Enterprise licensing** (flat annual bulk access)
- **Pay-per-mission** (usage-based execution)
- **Subscription** (monthly access to agent)

**What This Means for Cohortix:**
- ✅ **Standardized ally packaging** (Docker containers + JSON manifest)
- ✅ **API-first deployment** (rent ally = API key access)
- ✅ **Revenue sharing model** (platform takes 20%)
- ✅ **Focus on 10-15 core categories** (depth over breadth)

---

### 1.6 Agent Sandboxing & Multi-Tenant Isolation

**Critical Security Threats:**
- **Prompt injection** — Adversarial inputs manipulating behavior
- **Resource exhaustion** — Compute/memory abuse
- **Data exfiltration** — Unauthorized data access
- **Lateral movement** — Compromised agent pivoting to other systems
- **Tool misuse** — API/privilege abuse

**Isolation Technologies:**

| Control Layer | Purpose | Implementation |
|---------------|---------|----------------|
| **MicroVMs** | Strongest isolation (assume escapes) | Firecracker, gVisor |
| **Containers** | Moderate isolation (lighter than VMs) | Docker, Kubernetes |
| **Network Segmentation** | Prevent lateral movement | VPCs, security groups |
| **Secrets Management** | Runtime credential injection | HashiCorp Vault, AWS Secrets |
| **Rate Limiting** | Prevent resource exhaustion | Per-agent quotas |
| **Circuit Breakers** | Prevent cascading failures | Timeout + retry logic |
| **RBAC/ABAC** | Enforce least privilege | Scoped API tokens |

**What This Means for Cohortix:**
- ✅ **Container-per-agent** for multi-tenant isolation
- ✅ **MicroVMs for high-security allies** (finance, healthcare use cases)
- ✅ **Per-agent resource quotas** (prevent abuse)
- ✅ **Secrets injection** (not env vars)
- ✅ **Behavioral monitoring** for anomaly detection

---

### 1.7 Agent Memory Architecture

**Research Finding:** Hybrid per-agent + shared knowledge patterns.

```
┌─────────────────────────────────────────────────────┐
│  PER-AGENT MEMORY (Local, Fast)                    │
│  - Short-term cache (recent thoughts, tool traces)  │
│  - Task-specific context (current mission state)    │
│  - Temporal knowledge graphs (Graphiti, Mem0)       │
│  - Automatic consolidation (merge related facts)    │
└─────────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────────┐
│  SHARED KNOWLEDGE (Collaborative)                   │
│  - Vector databases (semantic search)               │
│  - Knowledge graphs (relationships, provenance)     │
│  - Blackboard systems (read/write coordination)     │
│  - Coherence protocols (avoid overwrites)           │
└─────────────────────────────────────────────────────┘
```

**Memory Hierarchy (Computer Architecture-Inspired):**
1. **Agent I/O Layer** — Modality inputs (text, images, audio)
2. **Agent Cache** — Short-term working memory
3. **Agent Memory Layer** — Dialogue history, long-term latents
4. **Shared Memory Pool** — Cross-agent knowledge base
5. **External Storage** — Databases, document stores

**What This Means for Cohortix:**
- ✅ **3-tier knowledge scoping** (already in PRD: company → client → mission)
- ✅ **Embedding storage** in pgvector (already planned)
- ✅ **Per-agent consolidation** (extract insights automatically)
- ✅ **Knowledge graph relationships** (depends-on, supersedes, etc.)
- ✅ **Memory decay** (reduce irrelevant knowledge over time)

---

### 1.8 Agent Execution Pipeline Patterns

**Sequential Pipeline:**
```
Input → Agent1 → Agent2 → Agent3 → Output
```

**Fanout Pipeline (Parallel):**
```
                  ┌─→ Agent1 ─┐
Input → Splitter ─┼─→ Agent2 ─┼→ Aggregator → Output
                  └─→ Agent3 ─┘
```

**State-Driven (LangGraph-style):**
```
         ┌────────────────┐
         │  Shared State  │
         └────────────────┘
          ↑      ↑      ↑
    Agent1  Agent2  Agent3
      ↓        ↓        ↓
         ┌────────────────┐
         │  Updated State │
         └────────────────┘
```

**What This Means for Cohortix:**
- ✅ **Missions as DAGs** (not just linear task lists)
- ✅ **Parallel action execution** (multiple allies working simultaneously)
- ✅ **State-driven coordination** (mission state = source of truth)

---

### 1.9 Agent-to-Agent Communication

**Google A2A Protocol (2025 Standard):**

**Communication Patterns:**
1. **Synchronous request/response** — Direct, immediate
2. **Asynchronous polling** — Periodic check for results
3. **Server-Sent Events (SSE)** — Push updates
4. **Webhooks** — Callback notifications

**Message Format (JSON-RPC 2.0):**
```json
{
  "jsonrpc": "2.0",
  "method": "task.execute",
  "params": {
    "sender": {
      "role": "researcher",
      "id": "ally_abc123"
    },
    "message": {
      "id": "msg_xyz",
      "threadId": "thread_123",
      "parts": [
        {"type": "text", "content": "Research topic X"},
        {"type": "json", "content": {"context": "..."}}
      ]
    }
  },
  "id": "req_456"
}
```

**Features:**
- **Modality-agnostic** (text, images, audio, JSON, binary)
- **Threaded conversations** (parent IDs, context preservation)
- **State machines** (submitted → working → completed)
- **Security by default** (every exchange protected)

**What This Means for Cohortix:**
- ✅ **A2A protocol adoption** for inter-ally communication
- ✅ **JSON-RPC 2.0** as message format
- ✅ **Threaded mission conversations** (ally-to-ally coordination)
- ✅ **Multi-modal support** (future: voice, video allies)

---

## 2. Proposed v3 Architecture

### 2.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                     │
│  Web (Next.js) · Mobile (React Native) · CLI · Public API              │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓ HTTPS/WebSocket
┌─────────────────────────────────────────────────────────────────────────┐
│                     API GATEWAY & EDGE LAYER                            │
│  Vercel Edge Network (Frontend) · Cloudflare Workers (Routing)          │
│  - Rate limiting, DDoS protection, SSL/TLS                              │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│               COHORTIX CONTROL PLANE (Next.js on Vercel)                │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  MISSION CONTROL UI                                               │ │
│  │  - React Server Components + Client Components                    │ │
│  │  - Real-time updates (Supabase Realtime)                          │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                  ↓                                      │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  API LAYER (Next.js API Routes)                                   │ │
│  │  - /api/v1/missions, /actions, /allies, /knowledge                │ │
│  │  - Auth middleware (Supabase Auth)                                │ │
│  │  - Validation (Zod)                                               │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                  ↓                                      │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  SERVICE LAYER                                                     │ │
│  │  - Business logic (mission management, ally assignment)            │ │
│  │  - Data access (Supabase client + Drizzle ORM)                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓ gRPC/HTTP
┌─────────────────────────────────────────────────────────────────────────┐
│          🆕 COHORTIX AGENT RUNTIME (Dedicated Backend Service)          │
│                    (AWS ECS/Fargate or Kubernetes)                      │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  RUNTIME ORCHESTRATOR                                             │ │
│  │  - Receives mission assignments from Control Plane                │ │
│  │  - Routes actions to appropriate allies                           │ │
│  │  - Manages execution state (DAG-based workflows)                  │ │
│  │  - Handles double-texting (queue, interrupt, rollback)            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                  ↓                                      │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  ALLY POOL (Containerized Agents)                                 │ │
│  │                                                                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │ │
│  │  │  Ally 1  │  │  Ally 2  │  │  Ally 3  │  │  Ally N  │         │ │
│  │  │ (Docker) │  │ (Docker) │  │ (Docker) │  │ (Docker) │         │ │
│  │  │          │  │          │  │          │  │          │         │ │
│  │  │  Tools   │  │  Tools   │  │  Tools   │  │  Tools   │         │ │
│  │  │  Memory  │  │  Memory  │  │  Memory  │  │  Memory  │         │ │
│  │  │  Skills  │  │  Skills  │  │  Skills  │  │  Skills  │         │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │ │
│  │                                                                   │ │
│  │  - Resource quotas (CPU, memory, network)                        │ │
│  │  - Sandboxed filesystem (per-ally)                               │ │
│  │  - Network isolation (inter-ally communication via A2A protocol) │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                  ↓                                      │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  ALLY LIFECYCLE MANAGER                                           │ │
│  │  - Create, start, stop, pause, resume allies                      │ │
│  │  - Health monitoring, auto-restart on failure                     │ │
│  │  - Checkpoint + restore state                                     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                  ↓                                      │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  EXECUTION ENGINE                                                 │ │
│  │  - Action execution pipeline (receive → plan → execute → report) │ │
│  │  - Tool invocation (filesystem, API calls, code execution)        │ │
│  │  - Streaming responses (SSE to Control Plane)                     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                  ↓                                      │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  KNOWLEDGE & MEMORY SERVICE                                       │ │
│  │  - Per-ally working memory (Redis cache)                          │ │
│  │  - Shared knowledge base (pgvector queries)                       │ │
│  │  - Context assembly (fetch relevant memories)                     │ │
│  │  - Memory consolidation (extract + merge insights)                │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  PRIMARY DATABASE (Supabase PostgreSQL + pgvector)               │  │
│  │  - Multi-tenant data (orgs, users, missions, actions)            │  │
│  │  - RLS policies (organization isolation)                         │  │
│  │  - Vector embeddings (knowledge base)                            │  │
│  │  - Full-text search (pg_trgm)                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  RUNTIME STATE STORE (Redis or PostgreSQL)                        │  │
│  │  - Agent execution state (checkpoints, resumable workflows)       │  │
│  │  - Per-ally short-term memory (working context)                   │  │
│  │  - Task queues (background jobs, scheduled actions)               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  BLOB STORAGE (Vercel Blob or S3)                                 │  │
│  │  - Agent artifacts (generated files, code, images)                │  │
│  │  - Knowledge attachments (PDFs, videos for learning)              │  │
│  │  - Ally configurations (packaged allies for marketplace)          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    🆕 ALLY MARKETPLACE LAYER                            │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  MARKETPLACE API                                                  │  │
│  │  - List allies, search, filter, ratings                           │  │
│  │  - Purchase/rent ally (transaction handling)                      │  │
│  │  - Deployment API (provision ally to buyer's org)                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ALLY REGISTRY                                                     │  │
│  │  - Standardized ally packages (Docker image + manifest.json)      │  │
│  │  - Versioning, changelogs, dependencies                           │  │
│  │  - Certification/verification badges                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  BILLING & REVENUE SHARING                                        │  │
│  │  - Commission tracking (20% platform fee)                         │  │
│  │  - Usage-based billing (pay-per-mission)                          │  │
│  │  - Payout automation (Stripe Connect)                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                     OBSERVABILITY & MONITORING                          │
│  - Application Metrics (Vercel Analytics, Prometheus)                  │
│  - Agent Tracing (OpenTelemetry, Honeycomb)                            │
│  - Logs (CloudWatch, Datadog)                                          │
│  - Error Tracking (Sentry)                                             │
│  - Security Monitoring (Behavioral anomaly detection)                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Agent Lifecycle Management

**State Machine:**
```
created → configured → starting → ready → executing → paused → stopped → destroyed
                           ↓                ↓
                        failed          error → recovery
```

**Lifecycle Operations:**

| Operation | Description | API Endpoint |
|-----------|-------------|--------------|
| **Create** | Provision ally from template or marketplace | `POST /runtime/v1/allies` |
| **Configure** | Set tools, prompts, memory scope, resource limits | `PATCH /runtime/v1/allies/:id/config` |
| **Start** | Boot ally container, load context | `POST /runtime/v1/allies/:id/start` |
| **Stop** | Graceful shutdown, save checkpoint | `POST /runtime/v1/allies/:id/stop` |
| **Pause** | Suspend execution (keep state) | `POST /runtime/v1/allies/:id/pause` |
| **Resume** | Continue from checkpoint | `POST /runtime/v1/allies/:id/resume` |
| **Monitor** | Health checks, resource usage | `GET /runtime/v1/allies/:id/health` |
| **Destroy** | Delete ally + cleanup resources | `DELETE /runtime/v1/allies/:id` |

**Health Monitoring:**
- **Heartbeat checks** (every 30s)
- **Resource usage** (CPU, memory, network)
- **Error rate** (failed actions per hour)
- **Response time** (P50, P95, P99)
- **Auto-restart** on failure (max 3 retries)

---

### 2.3 Task Execution Pipeline

**Flow (DAG-Based Workflow):**
```
┌─────────────────────────────────────────────────────────────┐
│  1. RECEIVE TASK (from Mission Control)                    │
│     - Mission assignment or action update                   │
│     - Priority, deadline, dependencies                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  2. ROUTE TO ALLY                                           │
│     - Orchestrator checks ally availability                 │
│     - Load balancing (round-robin or least-busy)            │
│     - Queue if all allies busy                              │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  3. CONTEXT ASSEMBLY                                        │
│     - Fetch mission details from Supabase                   │
│     - Retrieve relevant knowledge from pgvector             │
│     - Load ally's short-term memory from Redis              │
│     - Assemble prompt with tools + context                  │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  4. PLANNING (Ally Reasoning)                               │
│     - Ally analyzes action                                  │
│     - Breaks down into steps if complex                     │
│     - Decides which tools to use                            │
│     - Creates execution plan                                │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  5. EXECUTION LOOP (Agent Harness Pattern)                  │
│                                                             │
│     Context → Thought → Action → Observation (repeat)       │
│                                                             │
│     - Call tools (filesystem, APIs, code execution)         │
│     - Stream progress updates (SSE to Control Plane)        │
│     - Handle errors (retry with backoff)                    │
│     - Save checkpoints (every N steps)                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  6. REPORT RESULTS                                          │
│     - Update action status in Supabase                      │
│     - Save artifacts to blob storage                        │
│     - Extract knowledge insights                            │
│     - Update ally memory (consolidate learnings)            │
│     - Notify next ally if dependencies exist                │
└─────────────────────────────────────────────────────────────┘
```

**Double-Texting Handling (LangGraph-inspired):**

| Strategy | When to Use | Implementation |
|----------|-------------|----------------|
| **Reject** | High-priority ongoing task | Return 429 "Ally is busy" |
| **Queue** | Multiple tasks can be queued | Add to ally's task queue |
| **Interrupt** | User override | Cancel current task, start new one |
| **Rollback** | User correction | Revert to last checkpoint, re-execute |

---

### 2.4 Agent-to-Agent Communication

**Protocol:** Google A2A (Agent-to-Agent) using JSON-RPC 2.0

**Communication Flow:**
```
┌──────────────┐                              ┌──────────────┐
│   Ally A     │                              │   Ally B     │
│ (Researcher) │                              │ (Developer)  │
└──────────────┘                              └──────────────┘
       │                                             │
       │  1. Send task.delegate request              │
       │─────────────────────────────────────────────>│
       │                                             │
       │  {                                          │
       │    "method": "task.delegate",               │
       │    "params": {                              │
       │      "task": "Implement feature X",         │
       │      "context": {...},                      │
       │      "threadId": "thread_abc"               │
       │    }                                        │
       │  }                                          │
       │                                             │
       │  2. Acknowledge receipt                     │
       │<─────────────────────────────────────────────│
       │  { "result": { "status": "accepted" } }     │
       │                                             │
       │  3. Subscribe to progress updates (SSE)     │
       │<─────────────────────────────────────────────│
       │  event: progress                            │
       │  data: { "status": "working", "step": 1 }   │
       │                                             │
       │  4. Task completion webhook                 │
       │<─────────────────────────────────────────────│
       │  { "result": { "status": "completed" } }    │
       │                                             │
```

**A2A Message Format:**
```json
{
  "jsonrpc": "2.0",
  "method": "task.delegate",
  "params": {
    "sender": {
      "role": "researcher",
      "id": "ally_abc123",
      "organizationId": "org_xyz"
    },
    "receiver": {
      "role": "developer",
      "id": "ally_def456"
    },
    "message": {
      "id": "msg_789",
      "threadId": "thread_mission_123",
      "parentId": "msg_parent_456",
      "parts": [
        {
          "type": "text",
          "content": "Please implement the user authentication feature based on this research."
        },
        {
          "type": "json",
          "content": {
            "requirements": [...],
            "references": [...]
          }
        }
      ]
    },
    "state": {
      "status": "submitted",
      "priority": "high",
      "deadline": "2026-02-15T18:00:00Z"
    }
  },
  "id": "req_abc"
}
```

**State Machine (Task Lifecycle):**
```
submitted → queued → working → input_required → completed
                         ↓           ↓
                      failed     cancelled
```

**Implementation:**
- **Message Bus:** Redis Pub/Sub or RabbitMQ
- **Routing:** Orchestrator routes based on ally role/capability
- **Persistence:** All messages logged to PostgreSQL (audit trail)
- **Security:** JWT tokens for inter-ally auth

---

### 2.5 Multi-Tenant Isolation

**Isolation Layers:**

```
┌─────────────────────────────────────────────────────────────┐
│  DATABASE LAYER (RLS Policies)                              │
│  - Every query filtered by organization_id                  │
│  - No cross-tenant data leaks                               │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  RUNTIME LAYER (Container Isolation)                        │
│  - Each org gets dedicated ally pool                        │
│  - Network isolation (no cross-org ally communication)      │
│  - Resource quotas per org (prevent noisy neighbors)        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  KNOWLEDGE LAYER (Scoped Embeddings)                        │
│  - Knowledge queries filtered by org + client + mission     │
│  - No cross-tenant knowledge access                         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  SECRETS LAYER (Vault-Injected Credentials)                 │
│  - Per-org API keys, tokens injected at runtime             │
│  - Rotated automatically                                    │
│  - Never stored in env vars                                 │
└─────────────────────────────────────────────────────────────┘
```

**Resource Quotas (Per Organization):**

| Resource | Free Tier | Pro | Enterprise |
|----------|-----------|-----|------------|
| **Max Concurrent Allies** | 5 | 50 | 500 |
| **CPU per Ally** | 0.5 cores | 1 core | 2 cores |
| **Memory per Ally** | 512 MB | 1 GB | 2 GB |
| **Storage** | 1 GB | 50 GB | Unlimited |
| **API Calls/Hour** | 1,000 | 10,000 | Unlimited |
| **Missions/Month** | 100 | 1,000 | Unlimited |

**Security Controls:**
- ✅ **MicroVMs for high-security orgs** (finance, healthcare)
- ✅ **Network segmentation** (VPC per org or shared VPC with security groups)
- ✅ **Secrets injection** (HashiCorp Vault or AWS Secrets Manager)
- ✅ **Behavioral monitoring** (anomaly detection, kill switches)
- ✅ **Audit logging** (every ally action logged with org context)

---

### 2.6 Knowledge & Memory Architecture

**3-Tier Scoping (Already in PRD):**

```
┌─────────────────────────────────────────────────────────────┐
│  COMPANY-LEVEL KNOWLEDGE                                    │
│  - Available to ALL allies in the organization              │
│  - Examples: "How we deploy apps", "Company values"         │
│  - Storage: pgvector with scope = 'company'                 │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  CLIENT-LEVEL KNOWLEDGE                                     │
│  - Only for allies assigned to this client                  │
│  - Examples: "Client X brand guidelines", "Client APIs"     │
│  - Storage: pgvector with scope = 'client' + client_id      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  MISSION-LEVEL KNOWLEDGE                                    │
│  - Specific to a mission within a client                    │
│  - Examples: "Mission Y's API structure", "Sprint notes"    │
│  - Storage: pgvector with scope = 'mission' + mission_id    │
└─────────────────────────────────────────────────────────────┘
```

**Knowledge Retrieval (Scope Resolution):**
```typescript
async function retrieveKnowledge(query: string, context: {
  organizationId: string,
  clientId?: string,
  missionId?: string
}): Promise<Knowledge[]> {
  // Query in order: mission → client → company
  // Most specific knowledge surfaces first
  
  const results = await vectorSearch({
    query,
    filters: {
      organizationId: context.organizationId,
      OR: [
        { scope: 'mission', missionId: context.missionId },
        { scope: 'client', clientId: context.clientId },
        { scope: 'company' }
      ]
    },
    limit: 10
  });
  
  return results;
}
```

**Per-Ally Memory (Short-Term Cache):**
```
┌─────────────────────────────────────────────────────────────┐
│  REDIS CACHE (Per Ally)                                     │
│  Key: ally:{allyId}:memory                                  │
│                                                             │
│  {                                                          │
│    "currentMission": "mission_abc",                         │
│    "recentActions": [...],                                  │
│    "toolTraces": [...],                                     │
│    "thoughts": [...],                                       │
│    "lastUpdated": "2026-02-11T10:00:00Z"                    │
│  }                                                          │
│                                                             │
│  TTL: 24 hours (auto-refresh on activity)                   │
└─────────────────────────────────────────────────────────────┘
```

**Memory Consolidation (Background Job):**
```
Every 6 hours or on mission completion:
1. Extract insights from ally's recent actions
2. Identify recurring patterns or learnings
3. Merge related facts (deduplicate)
4. Store in knowledge base with provenance
5. Update relevance scores
```

**Memory Decay (Phase 2 - Active):**
```
Daily background job:
1. Calculate relevance score = f(access_count, recency, helpfulness)
2. Decay score for unused knowledge (exponential decay)
3. Archive knowledge with score < 0.3
4. Delete knowledge with score < 0.1 after 90 days
```

---

### 2.7 Marketplace Architecture

**Ally Package Format:**
```
cohortix-ally-package/
├── manifest.json          # Metadata, versioning, dependencies
├── Dockerfile             # Container definition
├── config/
│   ├── prompts.yaml       # System prompts, instructions
│   ├── tools.yaml         # Tool definitions
│   └── skills/            # Bundled skills
├── tests/
│   └── integration.test.ts
└── README.md              # Documentation
```

**manifest.json Example:**
```json
{
  "name": "Sales Outreach Ally",
  "id": "ally_sales_outreach_v1",
  "version": "1.2.3",
  "author": {
    "name": "John Doe",
    "organization": "org_abc123"
  },
  "category": "sales",
  "tags": ["outreach", "email", "crm"],
  "pricing": {
    "model": "subscription",
    "monthlyPrice": 49.99,
    "commission": 0.20
  },
  "capabilities": [
    "email-composition",
    "crm-integration",
    "follow-up-automation"
  ],
  "requirements": {
    "cpu": "1 core",
    "memory": "1 GB",
    "tools": ["gmail-api", "hubspot-api"]
  },
  "certification": {
    "verified": true,
    "securityAudit": "2026-01-15",
    "performanceScore": 92
  }
}
```

**Marketplace Workflow:**

```
┌────────────────────────────────────────────────────────────┐
│  SELLER: Publish Ally                                      │
│  1. Package ally (Docker + manifest)                       │
│  2. Submit to marketplace (manual review)                  │
│  3. Automated tests (security scan, performance test)      │
│  4. Certification (optional, paid)                         │
│  5. Listing goes live                                      │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│  BUYER: Discover & Purchase                                │
│  1. Search marketplace by category/tags                    │
│  2. View ally details (ratings, reviews, pricing)          │
│  3. Try demo (free trial for 7 days)                       │
│  4. Purchase or subscribe                                  │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│  DEPLOYMENT: Provision to Buyer's Org                      │
│  1. Clone ally package to buyer's org                      │
│  2. Create isolated container in buyer's ally pool         │
│  3. Configure with buyer's credentials (via Vault)         │
│  4. Assign to mission (buyer's Mission Control)            │
│  5. Start execution                                        │
└────────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│  BILLING: Usage Tracking & Payout                          │
│  1. Track usage (missions executed, hours active)          │
│  2. Calculate charges (monthly subscription + overages)    │
│  3. Stripe charges buyer                                   │
│  4. Platform takes 20% commission                          │
│  5. Payout to seller (Stripe Connect)                      │
└────────────────────────────────────────────────────────────┘
```

**Revenue Sharing Model:**
```
Buyer pays $50/month for Sales Outreach Ally
├── Platform fee (20%): $10
└── Seller payout (80%): $40

For pay-per-mission:
Buyer pays $5 per mission execution
├── Platform fee (20%): $1
└── Seller payout (80%): $4
```

**Quality Assurance:**
- ✅ **Automated security scanning** (container vulnerability scan)
- ✅ **Performance benchmarking** (latency, resource usage)
- ✅ **Certification program** (verified badge for audited allies)
- ✅ **Ratings & reviews** (buyer feedback)
- ✅ **Dispute resolution** (refunds for broken allies)

---

### 2.8 Scalability: 100s of Concurrent Agents

**Horizontal Scaling Pattern:**

```
┌─────────────────────────────────────────────────────────────┐
│  LOAD BALANCER (ALB or Nginx)                               │
│  - Distributes traffic across Runtime instances             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  RUNTIME ORCHESTRATOR (Replicas: 3-10)                      │
│  - Stateless orchestrator instances                         │
│  - Share task queue (Redis)                                 │
│  - Leader election for coordination (etcd)                  │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  ALLY POOL (Auto-Scaling)                                   │
│  - Kubernetes or ECS auto-scaling based on CPU/queue depth  │
│  - Scale 0 → 500 allies per org                             │
│  - Horizontal pod autoscaling (HPA)                         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  SHARED STATE (Redis Cluster or Postgres)                   │
│  - Checkpoints, task queues, short-term memory              │
│  - Replicated for high availability                         │
└─────────────────────────────────────────────────────────────┘
```

**Scaling Metrics:**

| Metric | Threshold | Action |
|--------|-----------|--------|
| **Task Queue Depth** | >100 | Scale out +10 ally containers |
| **CPU Utilization** | >70% | Scale out runtime orchestrators |
| **Response Time P95** | >5s | Scale out + investigate |
| **Error Rate** | >5% | Alert + circuit breaker |

**Performance Targets:**

| Scenario | Target | Notes |
|----------|--------|-------|
| **Concurrent allies per org** | 100-500 | With auto-scaling |
| **Action assignment latency** | <500ms | From Control Plane to ally |
| **Agent startup time** | <10s | Container boot + context load |
| **Knowledge retrieval** | <200ms | pgvector query P95 |
| **A2A message latency** | <100ms | Redis Pub/Sub |

**Cost Optimization:**
- ✅ **Spot instances** for non-critical allies (70% cost reduction)
- ✅ **Scale to zero** for idle allies (pay only for active time)
- ✅ **Resource quotas** prevent runaway costs
- ✅ **Caching** reduces LLM API calls (30% cost savings)

---

## 3. Infrastructure Assessment: What Changes

### 3.1 What Stays (Next.js/Vercel/Supabase)

✅ **Next.js Frontend on Vercel:**
- Mission Control UI (React Server + Client Components)
- API routes for CRUD operations (missions, actions, allies)
- Supabase Auth integration
- Real-time UI updates (Supabase Realtime)
- Edge caching for static assets

**Why:** Vercel is excellent for frontend and lightweight API routes. No need to change what works.

✅ **Supabase PostgreSQL + pgvector:**
- Multi-tenant data storage (orgs, users, missions, actions)
- RLS policies for tenant isolation
- Vector embeddings (knowledge base)
- Realtime subscriptions
- Full-text search

**Why:** Supabase provides managed Postgres with batteries included. Keep it for data layer.

✅ **Current Tech Stack:**
- **Tailwind CSS** + **shadcn/ui** (design system)
- **Zod** (validation)
- **TanStack Query** (server state)
- **Drizzle ORM** (type-safe queries)

---

### 3.2 What Changes (New Backend Infrastructure)

❌ **Vercel Cannot Handle Agent Execution:**

**Limitations:**
- **Timeout:** 10s (Hobby) or 60s (Pro) — Agents need hours
- **No persistent processes** — Agents require long-lived workers
- **No containers** — Agents need sandboxed environments
- **Stateless only** — Agents need stateful execution
- **Cold starts** — Agents need warm, always-ready instances

**Verdict:** Vercel is great for request-response, terrible for long-running agent execution.

---

🆕 **Required: Dedicated Agent Runtime Backend**

**Options:**

| Platform | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **AWS ECS Fargate** | Managed containers, auto-scaling, no K8s overhead | AWS complexity, vendor lock-in | ✅ **Recommended for MVP** |
| **Kubernetes (EKS/GKE)** | Full control, portable, ecosystem | Steep learning curve, ops overhead | For later (v4.0+) |
| **Fly.io** | Simple, global edge deployment, containers | Newer, smaller ecosystem | Alternative to ECS |
| **Railway** | Developer-friendly, simple deployment | Less mature, pricing unclear at scale | For prototyping |

**Architecture Choice: AWS ECS Fargate**

**Why:**
- ✅ Managed (no server management)
- ✅ Auto-scaling (0 → 500 containers)
- ✅ Pay-per-use (no idle costs)
- ✅ VPC networking (security)
- ✅ ECS Service Connect (A2A communication)
- ✅ IAM roles (secrets management)
- ✅ CloudWatch (logging/monitoring)

**Stack:**
```
┌─────────────────────────────────────────────────────────────┐
│  CONTROL PLANE (Next.js on Vercel)                          │
│  - Mission Control UI                                       │
│  - API routes (missions, allies, marketplace)               │
└─────────────────────────────────────────────────────────────┘
                        ↓ gRPC or HTTP
┌─────────────────────────────────────────────────────────────┐
│  AGENT RUNTIME (AWS ECS Fargate)                            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Runtime Orchestrator Service                        │  │
│  │  - Node.js or Python                                 │  │
│  │  - Receives tasks from Control Plane                 │  │
│  │  - Routes to ally containers                         │  │
│  │  - Manages execution state                           │  │
│  │  - Replicas: 3-10 (auto-scaling)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Ally Container Pool                                 │  │
│  │  - Docker images with ally code                      │  │
│  │  - Tools, skills, memory loaded                      │  │
│  │  - Resource limits (CPU, memory)                     │  │
│  │  - Network isolation (security groups)               │  │
│  │  - Auto-scaling (HPA based on queue depth)           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  DATA LAYER (Shared)                                        │
│  - Supabase PostgreSQL (primary data)                       │
│  - ElastiCache Redis (state + queues)                       │
│  - S3 (blob storage)                                        │
└─────────────────────────────────────────────────────────────┘
```

---

🆕 **New Services Required:**

| Service | Purpose | Technology | Hosting |
|---------|---------|------------|---------|
| **Runtime Orchestrator** | Route tasks to allies, manage execution | Node.js/Python | ECS Fargate |
| **Ally Containers** | Isolated agent execution environments | Docker | ECS Fargate |
| **Task Queue** | Async job processing | Redis or SQS | ElastiCache / AWS SQS |
| **State Store** | Checkpoints, resumable workflows | Redis or Postgres | ElastiCache / Supabase |
| **Secrets Manager** | Runtime credential injection | HashiCorp Vault or AWS Secrets | AWS Secrets Manager |
| **Message Bus** | A2A communication | Redis Pub/Sub or RabbitMQ | ElastiCache |
| **Blob Storage** | Agent artifacts | S3 or Vercel Blob | AWS S3 |
| **Observability** | Tracing, metrics, logs | OpenTelemetry + Datadog | Datadog / CloudWatch |

---

### 3.3 Communication: Control Plane ↔ Runtime

**Protocol:** gRPC (efficient binary protocol) or HTTP/REST

**Endpoints:**

| Control Plane → Runtime | Runtime → Control Plane |
|-------------------------|-------------------------|
| `createAlly(config)` | `updateActionStatus(status)` |
| `startAlly(allyId)` | `streamProgress(event)` |
| `assignTask(allyId, actionId)` | `reportError(error)` |
| `pauseAlly(allyId)` | `requestKnowledge(query)` |
| `stopAlly(allyId)` | `saveArtifact(blob)` |

**Example Flow:**
```
1. User creates mission in Mission Control (Next.js)
2. Next.js API route calls Runtime Orchestrator via gRPC
   POST /runtime/v1/allies/:id/tasks
   {
     "actionId": "action_abc",
     "missionId": "mission_xyz",
     "context": {...}
   }
3. Runtime Orchestrator routes to available ally
4. Ally executes action
5. Ally streams progress updates via SSE
   event: progress
   data: {"status": "working", "step": 2/5}
6. On completion, ally calls Control Plane API
   PATCH /api/v1/actions/action_abc
   { "status": "completed", "result": {...} }
7. Supabase Realtime pushes update to UI
8. User sees updated action status in Mission Control
```

---

### 3.4 Database Changes

**Supabase Schema (Minimal Changes):**

Most tables stay the same. Add a few for runtime coordination:

**New Tables:**

```sql
-- Agent runtime state (checkpoints, resumable workflows)
CREATE TABLE ally_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ally_id UUID NOT NULL REFERENCES allies(id),
  action_id UUID NOT NULL REFERENCES actions(id),
  state JSONB NOT NULL,           -- Execution state (step, context)
  checkpoint_at TIMESTAMPTZ,       -- Last checkpoint time
  status execution_status NOT NULL, -- running, paused, completed, failed
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  error TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id)
);

-- Ally-to-ally messages (A2A protocol)
CREATE TABLE ally_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id TEXT NOT NULL,
  parent_id UUID REFERENCES ally_messages(id),
  sender_id UUID NOT NULL REFERENCES allies(id),
  receiver_id UUID REFERENCES allies(id), -- NULL for broadcast
  method TEXT NOT NULL,                   -- task.delegate, task.complete, etc.
  params JSONB NOT NULL,
  response JSONB,
  state a2a_state NOT NULL,               -- submitted, working, completed, failed
  created_at TIMESTAMPTZ NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id)
);

-- Marketplace listings
CREATE TABLE marketplace_allies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  author_id UUID NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  pricing_model TEXT NOT NULL,            -- subscription, pay-per-mission
  monthly_price DECIMAL(10, 2),
  per_mission_price DECIMAL(10, 2),
  commission_rate DECIMAL(3, 2) DEFAULT 0.20,
  docker_image TEXT NOT NULL,             -- Registry URL
  manifest JSONB NOT NULL,
  certification JSONB,                    -- Verified badge, security audit, etc.
  rating DECIMAL(2, 1),                   -- Average rating (0-5)
  downloads INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Marketplace transactions
CREATE TABLE marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_org_id UUID NOT NULL REFERENCES organizations(id),
  ally_id UUID NOT NULL REFERENCES marketplace_allies(id),
  transaction_type TEXT NOT NULL,         -- purchase, subscription, rental
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  seller_payout DECIMAL(10, 2) NOT NULL,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL
);
```

---

### 3.5 Cost Estimate (v3 Infrastructure)

**Monthly Costs (100 Concurrent Allies):**

| Service | Specification | Cost/Month |
|---------|---------------|------------|
| **Vercel (Frontend)** | Pro plan | $20 |
| **Supabase (Database)** | Pro plan (50 GB, 10M queries) | $25 |
| **AWS ECS Fargate (Orchestrator)** | 3 tasks, 1 vCPU, 2 GB each | ~$60 |
| **AWS ECS Fargate (Allies)** | 100 tasks avg, 1 vCPU, 1 GB each | ~$2,000 |
| **ElastiCache Redis** | cache.t4g.medium | $50 |
| **AWS S3 (Blob Storage)** | 100 GB + requests | $10 |
| **CloudWatch Logs** | 50 GB logs | $25 |
| **Datadog (Observability)** | 10 hosts, 10M logs | $150 |
| **LLM API Costs (OpenAI/Anthropic)** | Variable (est. 100M tokens) | $1,000 |
| **Total** | | **~$3,340/month** |

**At Scale (500 Concurrent Allies):**
- ECS Fargate (Allies): ~$10,000
- LLM API: ~$5,000
- **Total: ~$15,500/month**

**Revenue Required to Break Even (20% Commission):**
- 100 allies: $16,700/month revenue
- 500 allies: $77,500/month revenue

---

## 4. Implementation Roadmap

### Phase 1: Runtime Prototype (Months 1-2)
**Goal:** Prove agent runtime works

- [ ] Set up AWS ECS Fargate cluster
- [ ] Build Runtime Orchestrator service (Node.js)
- [ ] Containerize single ally (simple echo ally)
- [ ] Implement task queue (Redis)
- [ ] Basic lifecycle (create, start, stop ally)
- [ ] Control Plane → Runtime gRPC communication
- [ ] Test: Assign action → Ally executes → Report back

**Deliverable:** Working prototype with 1 ally executing actions.

---

### Phase 2: Multi-Ally Execution (Months 3-4)
**Goal:** Multiple allies working in parallel

- [ ] Ally pool auto-scaling (ECS HPA)
- [ ] A2A protocol implementation (JSON-RPC 2.0)
- [ ] Ally-to-ally messaging (Redis Pub/Sub)
- [ ] State management (checkpoints, resume)
- [ ] Knowledge integration (pgvector queries)
- [ ] Memory consolidation (background jobs)
- [ ] Double-texting handling (queue, interrupt)

**Deliverable:** 10+ allies collaborating on missions.

---

### Phase 3: Marketplace MVP (Months 5-6)
**Goal:** Launch Ally Marketplace

- [ ] Marketplace database schema
- [ ] Ally packaging format (Docker + manifest)
- [ ] Submission workflow (upload, test, publish)
- [ ] Discovery UI (search, filter, ratings)
- [ ] Purchase flow (Stripe integration)
- [ ] Deployment automation (buyer gets ally in their org)
- [ ] Revenue sharing (Stripe Connect payouts)
- [ ] Launch with 10-15 curated allies

**Deliverable:** Public marketplace with 10+ buyable allies.

---

### Phase 4: Scalability & Observability (Months 7-8)
**Goal:** Production-grade reliability

- [ ] Horizontal scaling (0 → 500 allies per org)
- [ ] Full observability (OpenTelemetry + Datadog)
- [ ] Security hardening (MicroVMs, secrets rotation)
- [ ] Performance optimization (caching, query tuning)
- [ ] Load testing (simulate 100s of concurrent allies)
- [ ] Disaster recovery (backup, restore procedures)
- [ ] Documentation (API docs, runbooks)

**Deliverable:** Platform ready for enterprise customers.

---

### Phase 5: Advanced Features (Months 9-12)
**Goal:** Differentiation & stickiness

- [ ] Advanced agent skills (code execution, browser control)
- [ ] Multi-modal allies (voice, video capabilities)
- [ ] Agent evolution system (self-improvement, learning)
- [ ] Knowledge graph visualization
- [ ] White-label deployment (self-hosted for enterprises)
- [ ] Advanced marketplace features (bundles, teams of allies)

**Deliverable:** Feature-complete v3.0 platform.

---

## 5. Open Questions & Recommendations

### 5.1 Open Questions

**Technical:**
1. **Runtime Language:** Node.js (faster to build) vs Python (better AI ecosystem)?
2. **Container Orchestration:** ECS Fargate (simpler) vs Kubernetes (more control)?
3. **Message Bus:** Redis Pub/Sub (simple) vs RabbitMQ (more features)?
4. **Secrets Management:** AWS Secrets Manager (integrated) vs HashiCorp Vault (OSS)?
5. **Observability:** Datadog (commercial) vs OpenTelemetry + Grafana (OSS)?

**Business:**
1. **Marketplace Launch:** Invite-only beta or public launch?
2. **Commission Rate:** 20% (industry standard) or higher/lower?
3. **Certification Program:** Required for all allies or optional?
4. **Free Tier:** How many free marketplace allies to include?
5. **White-Label:** Offer self-hosted option for enterprises? (High margin but ops overhead)

**Product:**
1. **Ally Portability:** Can users export allies and take them to other platforms?
2. **Multi-Model Support:** Support OpenAI + Anthropic + OSS models?
3. **Agent Templates:** Provide low-code ally builder for non-developers?
4. **Live Monitoring:** Real-time "watch ally work" feature?

---

### 5.2 Recommendations

**Immediate Next Steps:**

1. ✅ **Build Runtime Prototype (Phase 1)** — De-risk the biggest unknown
   - Start with AWS ECS Fargate (simplest path)
   - Use Node.js for orchestrator (team familiarity)
   - Containerize a single Claude-based ally
   - Prove task assignment → execution → reporting works

2. ✅ **Keep Control Plane on Vercel/Supabase** — No need to change what works
   - Next.js frontend stays on Vercel
   - Supabase handles auth, data, realtime
   - Control Plane communicates with Runtime via gRPC

3. ✅ **Focus on 10-15 Ally Categories** (Marketplace)
   - Don't launch with 100s of generic allies
   - Go deep in validated niches: Sales, Dev, Research, Design, Marketing
   - Quality > quantity for initial marketplace

4. ✅ **Adopt A2A Protocol (Google Standard)** — Future-proof
   - JSON-RPC 2.0 for inter-ally messages
   - Modality-agnostic (supports text, images, audio, JSON)
   - Industry standard (interoperability with other platforms)

5. ✅ **Security First** — Multi-tenant isolation is critical
   - Container-per-ally (minimum)
   - MicroVMs for high-security use cases
   - Secrets injection (never env vars)
   - Behavioral monitoring + kill switches

6. ⚠️ **Defer Kubernetes** — ECS Fargate is simpler for MVP
   - K8s adds complexity without clear ROI early on
   - Move to K8s in Phase 5 if portability or advanced orchestration needed

7. ⚠️ **Defer Multi-Model Support** — Focus on Claude (Anthropic) initially
   - Cohortix already uses Claude SDK patterns
   - Multi-model adds complexity (different APIs, prompts, costs)
   - Add OpenAI/OSS models in Phase 5

---

### 5.3 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Runtime complexity underestimated** | High | High | Build prototype ASAP to de-risk |
| **LLM costs spiral** | Medium | High | Aggressive caching, quotas, monitoring |
| **Security breach (multi-tenant)** | Low | Critical | MicroVMs, audits, monitoring |
| **Marketplace low adoption** | Medium | Medium | Curate high-quality allies, marketing |
| **Scaling bottlenecks** | Medium | High | Load testing, horizontal scaling patterns |
| **Vendor lock-in (AWS)** | Low | Medium | Abstract with Terraform, consider K8s later |

---

## Conclusion

**Cohortix v3.0 is architecturally feasible and strategically sound.**

The research shows a clear path:
1. **Custom agent runtime** is required (Vercel can't handle long-running agents)
2. **AWS ECS Fargate** is the recommended platform (managed, scalable, cost-effective)
3. **State-of-the-art patterns exist** (LangGraph, CrewAI, Claude SDK)
4. **Marketplace architecture is proven** (standardized packaging, revenue sharing)
5. **Multi-tenant isolation is critical** (containers, RLS, secrets management)

**The current Next.js/Vercel/Supabase stack remains valuable for the Control Plane (UI + API).** The new Agent Runtime backend complements it, not replaces it.

**Estimated Timeline:** 8-12 months to production-ready v3.0

**Estimated Cost:** $3,500-$15,000/month at scale (100-500 concurrent allies)

**Next Step:** Build Runtime Prototype (Phase 1) to validate the architecture.

---

**Document prepared by:** Idris (Architect)  
**Date:** 2026-02-11  
**Status:** Ready for Ahmad's review

---

## References

1. OpenAI Platform for Developers 2025 (Responses API deprecation)
2. Anthropic Claude Agent SDK documentation
3. LangGraph Cloud architecture patterns
4. CrewAI Enterprise platform overview
5. Google A2A (Agent-to-Agent) Protocol
6. OWASP Top 10 for Agentic Applications
7. AWS ECS Fargate best practices
8. Agent marketplace development patterns (AWS, Azure)

---

*End of Document*
