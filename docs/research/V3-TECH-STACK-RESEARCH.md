# Cohortix v3 Tech Stack Research

**Custom Agent Runtime (Native Execution Without OpenClaw)**

**Date:** 2026-02-11  
**Researched by:** Devi (AI Developer Specialist)  
**Stakeholder:** Ahmad (CEO)

---

## Executive Summary

Cohortix v3 requires a **complete agent runtime infrastructure** to run AI
agents natively without OpenClaw. This document provides comprehensive research
on the latest (2025-2026) technologies for building production-ready, scalable,
multi-agent systems.

**Key Finding:** v3 needs **7 new infrastructure components** beyond the current
v1 stack:

1. **Agent Orchestration Framework** → LangGraph (recommended)
2. **Agent Runtime Environment** → E2B + Firecracker
3. **LLM Gateway/Routing** → LiteLLM Proxy Server
4. **Knowledge Graph Database** → NebulaGraph or ArangoDB
5. **Message Queue** → NATS JetStream
6. **Vector Database** → Qdrant
7. **Background Job Processing** → Inngest

**Current v1 stack (Next.js 15, Supabase, Vercel) remains the foundation** —
we're adding agent runtime capabilities, not replacing the platform.

**Estimated Infrastructure Cost:** $800-1,500/month for 100 active agents
(excluding LLM API costs)  
**Complexity:** Moderate-High (6-9 months for full v3 implementation)

---

## Table of Contents

1. [Current v1 Stack Analysis](#current-v1-stack-analysis)
2. [New Infrastructure Requirements](#new-infrastructure-requirements)
3. [Component Recommendations](#component-recommendations)
   - [Agent Orchestration Framework](#1-agent-orchestration-framework)
   - [Agent Runtime/Execution Environment](#2-agent-runtimeexecution-environment)
   - [LLM Gateway/Routing](#3-llm-gatewayrouting)
   - [Knowledge Graph Database](#4-knowledge-graph-database)
   - [Message Queue](#5-message-queue-agent-communication)
   - [Vector Database](#6-vector-database-agent-memory)
   - [Sandboxed Code Execution](#7-sandboxed-code-execution)
   - [Real-time Infrastructure](#8-real-time-infrastructure)
   - [Background Job Processing](#9-background-job-processing)
   - [Authentication/Authorization](#10-authenticationauthorization)
4. [System Architecture](#system-architecture)
5. [Cost Analysis](#cost-analysis)
6. [Complexity Assessment](#complexity-assessment)
7. [Migration Path](#migration-path-v1-to-v3)
8. [Recommendations](#recommendations--next-steps)

---

## Current v1 Stack Analysis

### What's Already There (Keep)

| Component     | Technology                       | Role in v3                      | Status  |
| ------------- | -------------------------------- | ------------------------------- | ------- |
| **Frontend**  | Next.js 15 + React 19            | UI/API layer, Server Components | ✅ Keep |
| **Database**  | Supabase (PostgreSQL + pgvector) | Relational data + embeddings    | ✅ Keep |
| **ORM**       | Drizzle ORM                      | Type-safe database access       | ✅ Keep |
| **Auth**      | Supabase Auth                    | User authentication             | ✅ Keep |
| **Real-time** | Supabase Realtime                | Live UI updates (websockets)    | ✅ Keep |
| **Hosting**   | Vercel                           | Edge network, CDN, deployments  | ✅ Keep |
| **Language**  | TypeScript                       | Type safety across stack        | ✅ Keep |

**Why Keep v1 Stack:**

- **Next.js 15** provides the perfect BFF (Backend-for-Frontend) pattern for
  UI + API
- **Supabase** handles auth, PostgreSQL, and basic realtime needs
- **Vercel** offers excellent Next.js deployment with edge functions
- **Existing codebase** — no need to rewrite UI/API layers

### What's Missing for v3 (Build)

Cohortix v1 is a **mission management UI** that TALKS TO agents (via Clawdbot
API).  
Cohortix v3 needs to **BE the agent runtime** — creating, managing, and
executing agents natively.

**Critical Gaps:**

1. ❌ **No agent lifecycle management** (start, stop, configure agents)
2. ❌ **No autonomous task execution** (agents can't execute LLM calls, tools,
   code)
3. ❌ **No agent-to-agent communication** (no message passing infrastructure)
4. ❌ **No knowledge graph** (only basic pgvector for RAG)
5. ❌ **No background processing** (agents can't work independently)
6. ❌ **No code execution sandbox** (can't safely run agent-generated code)
7. ❌ **No multi-LLM routing** (locked to specific providers)

---

## New Infrastructure Requirements

### What v3 Needs to Do (That v1 Doesn't)

From PRD analysis and AgentRuntime interface in CLAUDE.md:

```typescript
// From CLAUDE.md - Agent Runtime Abstraction
interface AgentRuntime {
  // Agent lifecycle
  createAgent(config: AgentConfig): Promise<Agent>;
  startAgent(agentId: string): Promise<void>;
  stopAgent(agentId: string): Promise<void>;

  // Task execution
  assignTask(agentId: string, action: Action): Promise<TaskExecution>;
  getTaskStatus(executionId: string): Promise<TaskStatus>;

  // Communication
  sendMessage(agentId: string, message: Message): Promise<Response>;
  subscribeToEvents(agentId: string, callback: EventCallback): Subscription;

  // Knowledge
  addKnowledge(agentId: string, knowledge: Knowledge): Promise<void>;
  queryKnowledge(agentId: string, query: string): Promise<Knowledge[]>;
}
```

**Requirements:**

1. **Create and manage agent lifecycles** (start, stop, configure)
2. **Execute tasks autonomously** (LLM calls, tool use, code execution)
3. **Handle agent-to-agent communication** (message passing, events)
4. **Manage agent memory/knowledge graphs** (persistent context)
5. **Run background processes** (agents working independently)
6. **Scale to many concurrent agents** (100s of agents per HQ)
7. **Sandbox agent code execution safely** (prevent malicious code)

---

## Component Recommendations

### 1. Agent Orchestration Framework

**Winner: LangGraph** (with LangChain ecosystem support)

#### Why LangGraph?

LangGraph models agent workflows as **directed graphs (DAGs)** with nodes for
agents, conditional logic, branching, parallel processing, retries, and state
management. It's the most production-ready framework for complex,
mission-critical agent pipelines.

**Strengths:**

- ✅ **Explicit workflow control** — Define agent behavior as graphs (vs.
  implicit role-based teams)
- ✅ **State management** — Built-in persistent state across agent steps
- ✅ **Conditional logic** — Branch based on agent outputs, errors, or context
- ✅ **Parallel execution** — Run multiple agents concurrently
- ✅ **LangSmith observability** — Best-in-class tracing and debugging
- ✅ **Production-proven** — Used by enterprises for logistics optimization,
  finance research assistants
- ✅ **Full LangChain ecosystem** — Access to 100+ integrations, tools, and
  memory systems

**Use Cases in Cohortix:**

- Mission workflows: Break down goals → missions → actions with conditional
  logic
- Agent collaboration: Research agents → analysis agents → execution agents in
  sequence
- Error handling: Retry failed steps, fallback to alternative agents
- Human-in-the-loop: Pause workflows for approval at critical checkpoints

**Alternatives Considered:**

| Framework             | Strengths                                  | Why Not Chosen                                                         |
| --------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| **CrewAI**            | Fast prototyping, role-based teams         | Less control, implicit behavior, harder to debug complex workflows     |
| **AutoGen**           | Conversational agents, Microsoft ecosystem | Less predictable, harder to scale, dialogue-based (not workflow-based) |
| **OpenAI Agents SDK** | OpenAI-native, simple swarms               | Too lightweight, limited state management, no complex orchestration    |
| **Mastra**            | TypeScript-native, strong DX               | Newer (less battle-tested), smaller ecosystem than LangChain           |

**Implementation:**

```bash
# Dependencies
pnpm add langchain @langchain/core langgraph langsmith

# Example: Mission workflow graph
import { StateGraph } from "@langchain/langgraph";

const workflow = new StateGraph({
  channels: {
    messages: { value: [] },
    currentAgent: { value: null },
    status: { value: "pending" }
  }
});

workflow
  .addNode("planner", plannerAgent)
  .addNode("researcher", researchAgent)
  .addNode("executor", executorAgent)
  .addConditionalEdges("planner", routeToNextAgent)
  .addEdge("researcher", "executor")
  .addEdge("executor", END);
```

**Cost:** Free (open-source, MIT license). LangSmith observability: $0 for 5K
traces/month, then $39/month.

---

### 2. Agent Runtime/Execution Environment

**Winner: E2B + Firecracker microVMs**

#### Why E2B?

E2B provides **production-ready sandboxed code execution environments** using
Firecracker microVMs (the same technology AWS Lambda uses). It's designed
specificagent for AI agents executing untrusted code.

**Strengths:**

- ✅ **Hardware-level isolation** — Firecracker microVMs via KVM virtualization
- ✅ **Fast startup** — ~150ms spin-up time (vs. seconds for containers)
- ✅ **Security** — Complete isolation prevents malicious code from affecting
  infrastructure
- ✅ **Scalability** — Auto-scaling for thousands of concurrent sandboxes
- ✅ **Session persistence** — Up to 24 hours active, 30 days paused
- ✅ **AI SDK integrations** — Native support for LangChain, OpenAI, Anthropic
- ✅ **Production-proven** — Powers Groq's Compound AI system, 88% of Fortune
  100 companies
- ✅ **Docker-based templates** — Pre-install dependencies for faster execution

**Use Cases in Cohortix:**

- **Code execution actions** — Agents write and run Python/JS/Bash scripts
- **Data processing** — Agents analyze CSVs, generate reports, transform data
- **Tool execution** — Safely run agent-generated code for external API calls
- **Testing environments** — Agents test code before deployment

**Alternatives Considered:**

| Platform                      | Strengths                       | Why Not Chosen                                                      |
| ----------------------------- | ------------------------------- | ------------------------------------------------------------------- |
| **Modal**                     | Python/ML workloads, fast       | gVisor containers (less isolation than Firecracker), Python-focused |
| **Firecracker (self-hosted)** | Full control, no vendor lock-in | High operational complexity, need to manage orchestration           |
| **Docker containers**         | Familiar, lightweight           | Less secure (shared kernel), slower startup                         |

**Implementation:**

```bash
# E2B SDK
pnpm add @e2b/code-interpreter

# Example: Execute agent-generated code
import { CodeInterpreter } from '@e2b/code-interpreter';

const sandbox = await CodeInterpreter.create();

const execution = await sandbox.notebook.execCell(`
import pandas as pd
df = pd.read_csv('data.csv')
print(df.describe())
`);

console.log(execution.logs.stdout); // Results
await sandbox.close();
```

**Cost:**

- Free tier: 100 hours/month
- Pro: $20/100 hours (~$0.20/hour per sandbox)
- Enterprise: Custom pricing for high volume

**Estimated for 100 agents:** ~$200-400/month (assuming 2-4 hours/day average
usage per agent)

---

### 3. LLM Gateway/Routing

**Winner: LiteLLM Proxy Server** (open-source)

#### Why LiteLLM?

LiteLLM is an **open-source LLM gateway** that routes requests across 100+ LLM
providers with a unified API. It adds only **3ms overhead** (vs. OpenRouter's
40ms) and offers advanced routing strategies.

**Strengths:**

- ✅ **Multi-provider support** — OpenAI, Anthropic, Google, Azure, AWS, local
  models
- ✅ **Advanced routing** — Latency-based, rate-limit-aware, least-busy,
  lowest-cost
- ✅ **Fallback logic** — Auto-retry alternative providers if one fails
- ✅ **Cost tracking** — Per-project/per-team budgets, token usage logging
- ✅ **Virtual API keys** — RBAC for organizations, teams, users
- ✅ **YAML configuration** — Declarative routing policies
- ✅ **Minimal latency** — 3ms overhead (vs. OpenRouter's 40ms)
- ✅ **Self-hosted** — Full control, no vendor lock-in

**Use Cases in Cohortix:**

- **Multi-LLM support** — Route to GPT-4o for complex reasoning, Claude for long
  context, Gemini Flash for cheap tasks
- **Cost optimization** — Route to cheapest available model for simple tasks
- **Reliability** — Fallback to alternative providers if primary is down
- **Budget control** — Set spending limits per HQ, per agent
- **Observability** — Track token usage, costs per mission/agent

**Alternatives Considered:**

| Gateway              | Strengths                           | Why Not Chosen                                                            |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| **OpenRouter**       | Managed service, built-in analytics | 40ms overhead (13x slower), limited routing customization, vendor lock-in |
| **Direct API calls** | Zero overhead                       | No fallback, no cost tracking, no multi-provider support                  |

**Implementation:**

```bash
# Self-hosted LiteLLM Proxy
docker run -p 4000:4000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  ghcr.io/berriai/litellm:main-latest \
  --config /path/to/config.yaml

# config.yaml example
model_list:
  - model_name: gpt-4-turbo
    litellm_params:
      model: gpt-4-turbo
      api_key: os.environ/OPENAI_API_KEY
  - model_name: claude-3-opus
    litellm_params:
      model: claude-3-opus-20240229
      api_key: os.environ/ANTHROPIC_API_KEY

router_settings:
  routing_strategy: latency-based-routing
  fallbacks:
    - ["gpt-4-turbo", "claude-3-opus"]
```

**Usage in agents:**

```typescript
// Agents call LiteLLM proxy instead of direct APIs
const response = await fetch('http://litellm:4000/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${LITELLM_VIRTUAL_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4-turbo', // LiteLLM routes automaticagent
    messages: [{ role: 'user', content: 'Analyze this mission' }],
  }),
});
```

**Cost:**

- Free (open-source, MIT license)
- Self-hosting: ~$50-100/month for compute (AWS/GCP VM)

---

### 4. Knowledge Graph Database

**Winner: NebulaGraph** (open-source, distributed)

#### Why NebulaGraph?

NebulaGraph is an **open-source, distributed graph database** designed for
knowledge graphs at scale. It's the first graph database to support **GraphRAG**
(knowledge graphs + LLMs for retrieval).

**Strengths:**

- ✅ **GraphRAG support** — First-in-industry integration of knowledge graphs
  with LLMs
- ✅ **Scalability** — Handles trillions of edges, shared-nothing architecture
- ✅ **Performance** — Millisecond latency for graph traversals
- ✅ **No bottlenecks** — No single-master write bottleneck (unlike Neo4j)
- ✅ **Hybrid search** — Graph + vector RAG for semantic + relational queries
- ✅ **Production-proven** — Used by Fortune 500 for fraud detection,
  recommendations
- ✅ **Cost-effective** — Open-source (vs. Neo4j Enterprise licensing)

**Use Cases in Cohortix:**

- **Knowledge graph relationships** — Connect concepts, learnings, decisions
  with typed edges
  - "Mission A `depends_on` Mission B"
  - "Insight X `related_to` Insight Y"
  - "Agent learned concept Z from mission M"
- **Cross-agent learning** — One agent's knowledge benefits others via graph
  traversal
- **Semantic + relational search** — "Find all missions related to API
  integrations that failed"
- **Knowledge evolution** — Track how knowledge supersedes/contradicts older
  entries

**Alternatives Considered:**

| Database                | Strengths                               | Why Not Chosen                                          |
| ----------------------- | --------------------------------------- | ------------------------------------------------------- |
| **Neo4j**               | Industry standard, mature               | Expensive licensing, scalability limits, no GraphRAG    |
| **ArangoDB**            | Multi-model (graph + document + vector) | Broader but less specialized for graph workloads        |
| **FalkorDB**            | Vector-native, faster for GraphRAG      | Newer, less battle-tested than NebulaGraph              |
| **pgvector (Supabase)** | Already have it, simple                 | Not a true graph database, limited relationship queries |

**Architecture Decision:** Use **NebulaGraph for knowledge graph
relationships** + **pgvector (Supabase) for basic vector embeddings**.

**Implementation:**

```bash
# Docker Compose for NebulaGraph
docker-compose up -d

# Create knowledge graph schema
CREATE SPACE cohortix_knowledge (vid_type=FIXED_STRING(32));
USE cohortix_knowledge;

CREATE TAG Concept(name string, description string, created_at timestamp);
CREATE TAG Insight(content string, agent_id string, mission_id string);
CREATE EDGE RELATED_TO(strength double, context string);
CREATE EDGE DEPENDS_ON(reason string);
CREATE EDGE SUPERSEDES(why string, updated_at timestamp);

# Query: Find all insights related to "API integration" failures
MATCH (i:Insight)-[r:RELATED_TO]->(c:Concept {name: "API integration"})
WHERE i.content CONTAINS "failed"
RETURN i, r, c;
```

**Cost:**

- Free (open-source, Apache 2.0 license)
- Self-hosting: ~$100-200/month for compute (3-node cluster on AWS/GCP)
- Cloud (managed): $500-1000/month for production scale

**Recommendation:** Start self-hosted, migrate to managed NebulaGraph Cloud at
scale.

---

### 5. Message Queue (Agent Communication)

**Winner: NATS JetStream**

#### Why NATS JetStream?

NATS JetStream is a **cloud-native messaging system** designed for real-time,
distributed systems. It's the fastest option for agent-to-agent communication
with minimal overhead.

**Strengths:**

- ✅ **Extreme performance** — 200,000-400,000 messages/second
- ✅ **Low latency** — <1ms in-memory, 1-5ms persistent
- ✅ **Lightweight** — Minimal resource footprint
- ✅ **Exactly-once delivery** — With deduplication via JetStream
- ✅ **Persistence** — RAFT replication for durability
- ✅ **Cloud-native** — Designed for Kubernetes, microservices
- ✅ **Multi-tenant** — Built-in account/user isolation

**Use Cases in Cohortix:**

- **Agent-to-agent communication** — Real-time coordination between agents
- **Event broadcasting** — Notify all agents of mission updates
- **Action dispatching** — Send tasks to specific agents via subject routing
- **Progress updates** — Agents publish status changes for Mission Control UI
- **Inter-agent handoffs** — Pass context between agents in workflows

**Alternatives Considered:**

| Queue             | Strengths                   | Why Not Chosen                                                                           |
| ----------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| **Redis Pub/Sub** | Simple, already using Redis | Ephemeral (no persistence), no transactional guarantees                                  |
| **RabbitMQ**      | Mature, reliable            | Slower (50k-100k msgs/sec), heavier, 5-20ms latency                                      |
| **Kafka**         | Highest throughput          | Overkill, heavy operational complexity, not designed for low-latency agent communication |

**Implementation:**

```bash
# Docker for NATS JetStream
docker run -p 4222:4222 -p 8222:8222 nats:latest -js

# TypeScript client
import { connect, StringCodec } from 'nats';

const nc = await connect({ servers: 'nats://localhost:4222' });
const js = nc.jetstream();

// Agent publishes task completion
const sc = StringCodec();
await js.publish('agent.task.completed', sc.encode(JSON.stringify({
  agentId: 'agent_123',
  taskId: 'task_456',
  result: { success: true }
})));

// Other agents subscribe to events
const sub = await js.subscribe('agent.task.*');
for await (const msg of sub) {
  const data = JSON.parse(sc.decode(msg.data));
  console.log('Received:', data);
}
```

**Subject Hierarchy for Cohortix:**

```
agent.{agentId}.task.assigned
agent.{agentId}.task.completed
agent.{agentId}.status.changed
mission.{missionId}.updated
hq.{hqId}.broadcast
```

**Cost:**

- Free (open-source, Apache 2.0 license)
- Self-hosting: ~$50-100/month for compute (3-node cluster)
- Managed (Synadia Cloud): $99-299/month

---

### 6. Vector Database (Agent Memory)

**Winner: Qdrant** (self-hosted or managed)

#### Why Qdrant?

Qdrant is a **high-performance vector database** optimized for AI agent memory
and RAG systems. It offers the best performance-to-cost ratio.

**Strengths:**

- ✅ **Best performance** — 8,000-15,000 QPS, 30-40ms p99 latency
- ✅ **Memory efficiency** — 30% less RAM than competitors
- ✅ **Advanced filtering** — Rich payload filters, quotas, multitenancy
- ✅ **Cost-effective** — Lowest infrastructure cost ($120-250/month for 10M
  vectors)
- ✅ **Multitenancy** — Collections and tenants for HQ isolation
- ✅ **Production-ready** — Used by enterprises for real-time agent recall
- ✅ **Hybrid search** — Vector + keyword search

**Use Cases in Cohortix:**

- **Agent memory** — Store conversation history, decisions, learnings as
  embeddings
- **RAG for missions** — Semantic search over mission context, goals, actions
- **Knowledge retrieval** — Agents query knowledge base for relevant insights
- **Duplicate detection** — Find similar missions, actions, or insights
- **Personalization** — Per-agent memory collections

**Alternatives Considered:**

| Database                | Strengths                             | Why Not Chosen                                                |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------- |
| **Pinecone**            | Fully managed, reliable               | More expensive ($200-400/month), vendor lock-in               |
| **Weaviate**            | Built-in knowledge graph capabilities | Slower (3,000-8,000 QPS), more complex for pure vector search |
| **pgvector (Supabase)** | Already have it                       | Slower, limited to PostgreSQL performance (~1K QPS)           |

**Architecture Decision:**

- **Qdrant** for high-performance agent memory and RAG
- **pgvector (Supabase)** for basic embeddings (already have it)
- **NebulaGraph** for knowledge graph relationships

**Implementation:**

```bash
# Docker for Qdrant
docker run -p 6333:6333 qdrant/qdrant

# TypeScript client
import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({ url: 'http://localhost:6333' });

// Create collection per HQ for isolation
await client.createCollection('hq_abc123_memory', {
  vectors: { size: 1536, distance: 'Cosine' }
});

// Store agent memory
await client.upsert('hq_abc123_memory', {
  points: [{
    id: 'mem_456',
    vector: embedding, // from OpenAI text-embedding-3-small
    payload: {
      agentId: 'agent_123',
      missionId: 'mission_789',
      content: 'Learned that API X requires rate limiting',
      timestamp: new Date().toISOString()
    }
  }]
});

// Query agent memory
const results = await client.search('hq_abc123_memory', {
  vector: queryEmbedding,
  limit: 5,
  filter: {
    must: [{ key: 'agentId', match: { value: 'agent_123' } }]
  }
});
```

**Cost:**

- Free tier: 1GB forever (sufficient for MVP)
- Self-hosting: ~$100-200/month for 10M vectors
- Qdrant Cloud: ~$120-250/month for 10M vectors

---

### 7. Sandboxed Code Execution

**Already covered in Agent Runtime (#2): E2B + Firecracker**

---

### 8. Real-time Infrastructure

**Winner: Supabase Realtime + Server-Sent Events (SSE)**

#### Why Keep Supabase Realtime + Add SSE?

**Supabase Realtime (WebSockets)** is already in v1 for live UI updates. For v3,
we add **Server-Sent Events (SSE)** for agent-to-UI streaming.

**Strengths:**

- ✅ **Already have it** — Supabase Realtime for database changes
- ✅ **WebSockets for bidirectional** — UI subscribes to agent events
- ✅ **SSE for agent streaming** — Agents push progress updates, partial outputs
- ✅ **Low latency** — Real-time updates for Mission Control dashboard
- ✅ **Built-in to Supabase** — No additional infrastructure

**Use Cases in Cohortix:**

- **Mission Control live updates** — See agent status changes in real-time
- **Agent progress streaming** — Watch agents execute tasks step-by-step
- **Notifications** — Real-time alerts for mission completions, errors
- **Presence** — See which agents are online/working

**Architecture:**

```
UI (Next.js)
  ↓ WebSockets (Supabase Realtime)
Database (Supabase)
  ↓ Database triggers
Agent Runtime
  ↓ SSE (Server-Sent Events)
UI (Next.js)
```

**Implementation:**

```typescript
// Client-side: Subscribe to agent events (Supabase Realtime)
const channel = supabase
  .channel(`agent:${agentId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'agents',
      filter: `id=eq.${agentId}`,
    },
    (payload) => {
      console.log('Agent status changed:', payload.new.status);
    }
  )
  .subscribe();

// Server-side: SSE for agent streaming
export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Agent executes task and streams progress
      for await (const update of agentTask) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(update)}\n\n`)
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

**Cost:**

- Already included in Supabase plan ($0-25/month for v1 scale)

---

### 9. Background Job Processing

**Winner: Inngest** (TypeScript-native)

#### Why Inngest?

Inngest is a **TypeScript-native background job platform** designed for AI
agents and durable workflows. It's purpose-built for Next.js integration.

**Strengths:**

- ✅ **TypeScript-first** — Perfect for our TypeScript stack
- ✅ **Durable execution** — Workflows resume after failures
- ✅ **Event-driven** — Trigger jobs from API routes, server actions
- ✅ **Cron scheduling** — Daily agent evolution sessions, maintenance
- ✅ **Concurrency control** — Rate limiting, parallel execution limits
- ✅ **Checkpoints** — Resume long-running agent workflows
- ✅ **Dashboard** — Monitor, retry, debug jobs
- ✅ **Next.js integration** — Drop-in support for App Router

**Use Cases in Cohortix:**

- **Daily agent evolution** — 9 AM daily learning sessions (from PRD)
- **Mission background processing** — Long-running mission execution
- **Knowledge graph updates** — Periodic knowledge decay, relevance scoring
- **Scheduled reports** — Daily/weekly mission summaries
- **Cleanup tasks** — Archive old missions, prune stale data

**Alternatives Considered:**

| Tool            | Strengths                          | Why Not Chosen                                      |
| --------------- | ---------------------------------- | --------------------------------------------------- |
| **BullMQ**      | High throughput (millions of jobs) | Requires Redis, lower-level API, more setup         |
| **Temporal**    | Complex workflows, battle-tested   | Heavy, overkill for our needs, steep learning curve |
| **Vercel Cron** | Native to Vercel                   | Limited to cron, no complex workflows or retries    |

**Implementation:**

```typescript
// Create Inngest client
import { Inngest } from 'inngest';

export const inngest = new Inngest({ id: 'cohortix' });

// Define background function
export const dailyAgentEvolution = inngest.createFunction(
  { id: 'daily-agent-evolution', name: 'Daily Agent Evolution' },
  { cron: '0 9 * * *' }, // 9 AM daily
  async ({ step }) => {
    const agents = await step.run('fetch-agents', async () => {
      return db.query.agents.findMany({ where: eq(agents.status, 'active') });
    });

    for (const agent of agents) {
      await step.run(`evolve-${agent.id}`, async () => {
        // Agent evolution logic (from PRD)
        await runEvolutionSession(agent);
      });
    }
  }
);

// API route to serve Inngest
// app/api/inngest/route.ts
import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { dailyAgentEvolution } from '@/lib/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [dailyAgentEvolution],
});
```

**Cost:**

- Free tier: 10,000 steps/month
- Pro: $20/50,000 steps (~$0.0004/step)
- Estimated for 100 agents: ~$50-100/month

---

### 10. Authentication/Authorization

**Winner: Keep Supabase Auth + Add Agent-Specific Auth**

#### Why Keep Supabase Auth?

Supabase Auth handles **human user authentication** perfectly. For v3, we add
**agent authentication** for secure agent-to-agent and agent-to-service
communication.

**Human Auth (Supabase Auth — Keep):**

- ✅ Email/password, OAuth (Google, GitHub), magic links
- ✅ Row-Level Security (RLS) for multi-tenant isolation
- ✅ JWT tokens for API authentication
- ✅ Already integrated with v1

**Agent Auth (Add for v3):**

- **Agent API keys** — Each agent gets a unique, scoped API key
- **Service-to-service auth** — Agents authenticate with LiteLLM, E2B, NATS
- **JWT tokens for agents** — Signed tokens with agent identity, permissions
- **Scope enforcement** — Agents can only access their HQ's data

**Implementation:**

```typescript
// Generate agent API key
import { randomBytes } from 'crypto';

const agentApiKey = `agent_${randomBytes(32).toString('hex')}`;

// Store in database
await db.insert(agentApiKeys).values({
  id: agentApiKey,
  agentId: agent.id,
  organizationId: agent.organizationId,
  scopes: ['read:missions', 'write:actions', 'execute:code'],
  createdAt: new Date(),
});

// Middleware to validate agent API key
export async function validateAgentAuth(req: Request) {
  const apiKey = req.headers.get('X-Agent-API-Key');

  const agentAuth = await db.query.agentApiKeys.findFirst({
    where: eq(agentApiKeys.id, apiKey),
  });

  if (!agentAuth) {
    throw new UnauthorizedError('Invalid agent API key');
  }

  return agentAuth;
}
```

**Cost:**

- Supabase Auth: Already included ($0-25/month for v1 scale)

---

## System Architecture

### High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                               │
│  Mission Control UI (Next.js) · Mobile PWA (future)            │
└─────────────────────────┬──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│                   VERCEL EDGE NETWORK                           │
│  CDN · DDoS Protection · SSL/TLS · Next.js Deployment          │
└─────────────────────────┬──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│               NEXT.JS APPLICATION LAYER (v1 + v3)               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FRONTEND (React 19 Server/Client Components)           │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                           │
│  ┌──────────────────▼───────────────────────────────────────┐  │
│  │  API ROUTES + SERVER ACTIONS                             │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                           │
│  ┌──────────────────▼───────────────────────────────────────┐  │
│  │  SERVICE LAYER (Business Logic)                          │  │
│  │  • MissionService  • AgentService  • KnowledgeService    │  │
│  └──────────────────┬───────────────────────────────────────┘  │
└───────────────────────┼───────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼────────┐ ┌───▼────────┐ ┌───▼──────────────┐
│  SUPABASE      │ │  LITELLM   │ │  AGENT RUNTIME   │
│  • PostgreSQL  │ │  GATEWAY   │ │  ORCHESTRATION   │
│  • Auth        │ │            │ │                  │
│  • Realtime    │ │  Routes to:│ │  ┌──────────────┐│
│  • pgvector    │ │  • OpenAI  │ │  │  LANGGRAPH   ││
└────────────────┘ │  • Claude  │ │  │  (Workflows) ││
                   │  • Gemini  │ │  └──────┬───────┘│
┌────────────────┐ │  • Local   │ │         │        │
│  QDRANT        │ └────────────┘ │  ┌──────▼───────┐│
│  (Vector DB)   │                │  │  INNGEST     ││
│  • Agent Memory│ ┌────────────┐ │  │  (Jobs)      ││
│  • RAG         │ │  E2B       │ │  └──────┬───────┘│
└────────────────┘ │  (Sandbox) │ │         │        │
                   │  • Execute │ │  ┌──────▼───────┐│
┌────────────────┐ │    Code    │ │  │  NATS        ││
│  NEBULAGRAPH   │ │  • Python  │ │  │  (Messaging) ││
│  (Knowledge    │ │  • JS/TS   │ │  └──────┬───────┘│
│   Graph)       │ │  • Bash    │ │         │        │
│  • Concepts    │ └────────────┘ │  ┌──────▼───────┐│
│  • Relations   │                │  │  E2B         ││
│  • GraphRAG    │                │  │  (Sandboxes) ││
└────────────────┘                └──┴──────────────┘│
                                     Agent Runtime    │
                                     Execution        │
                                     Environment      │
                                  └───────────────────┘
```

### Data Flow: Agent Executes a Mission

```
1. User creates mission in Mission Control (Next.js UI)
   ↓
2. Mission stored in Supabase (PostgreSQL)
   ↓
3. MissionService → AgentService.assignMission(agentId, missionId)
   ↓
4. AgentService publishes event to NATS: "agent.task.assigned"
   ↓
5. LangGraph workflow starts:
   • PlannerAgent: Break down mission into actions
   • ResearchAgent: Gather context from knowledge graph (NebulaGraph)
   • ExecutorAgent: Execute actions
   ↓
6. ExecutorAgent needs to run code:
   • Calls E2B sandbox with generated Python script
   • E2B executes in isolated Firecracker microVM
   • Returns results
   ↓
7. ExecutorAgent makes LLM calls:
   • Routes through LiteLLM gateway
   • LiteLLM selects optimal model (GPT-4o vs. Claude vs. Gemini)
   • Returns response
   ↓
8. Agent stores learnings:
   • Embeddings → Qdrant (vector search)
   • Concepts/relationships → NebulaGraph (knowledge graph)
   ↓
9. Agent publishes event to NATS: "agent.task.completed"
   ↓
10. Supabase Realtime pushes update to UI (WebSockets)
    ↓
11. Mission Control shows live status update
```

---

## Cost Analysis

### Monthly Infrastructure Costs (100 Active Agents)

| Component                | Service                   | Tier             | Estimated Cost  |
| ------------------------ | ------------------------- | ---------------- | --------------- |
| **Compute & Hosting**    | Vercel                    | Pro              | $20/month       |
| **Database**             | Supabase                  | Pro              | $25/month       |
| **Vector DB**            | Qdrant Cloud              | 10M vectors      | $150/month      |
| **Knowledge Graph**      | NebulaGraph (self-hosted) | 3-node cluster   | $150/month      |
| **Message Queue**        | NATS (self-hosted)        | 3-node cluster   | $100/month      |
| **Code Execution**       | E2B                       | ~200 hours/month | $300/month      |
| **LLM Gateway**          | LiteLLM (self-hosted)     | VM               | $50/month       |
| **Background Jobs**      | Inngest                   | Pro              | $100/month      |
| **Monitoring**           | LangSmith                 | Pro              | $39/month       |
| **Total Infrastructure** |                           |                  | **~$934/month** |

**Additional Variable Costs:**

- **LLM API calls:** $500-2,000/month (depends on usage)
  - GPT-4o: ~$10/1M output tokens
  - Claude Sonnet: ~$1.50/1M output tokens
  - Gemini Flash: ~$0.60/1M output tokens
- **Bandwidth:** Included in Vercel/Supabase plans
- **Storage:** ~$10-20/month for additional storage

**Total Estimated Cost for 100 Agents:** $1,500-3,000/month (infrastructure +
LLM APIs)

### Cost Optimization Strategies

1. **Use cheaper models for simple tasks** — Route via LiteLLM to Gemini Flash
   ($0.60/1M tokens)
2. **Cache LLM responses** — Implement semantic caching to reduce API calls
3. **Optimize E2B usage** — Reuse sandboxes, minimize spin-up times
4. **Self-host where possible** — NebulaGraph, NATS, LiteLLM (vs. managed
   services)
5. **Start small, scale up** — Use free tiers for MVP, upgrade at scale

**Projected Costs at Scale:**

| Scale      | Agents | Infrastructure | LLM APIs | Total/Month |
| ---------- | ------ | -------------- | -------- | ----------- |
| **MVP**    | 10     | $200           | $100     | $300        |
| **Beta**   | 50     | $600           | $500     | $1,100      |
| **Launch** | 100    | $950           | $1,000   | $1,950      |
| **Growth** | 500    | $2,500         | $5,000   | $7,500      |
| **Scale**  | 1,000  | $4,500         | $10,000  | $14,500     |

---

## Complexity Assessment

### Implementation Complexity (1-5 scale, 5 = highest)

| Component                 | Complexity | Estimated Time | Rationale                                   |
| ------------------------- | ---------- | -------------- | ------------------------------------------- |
| **LangGraph Integration** | 4/5        | 4-6 weeks      | Complex workflow design, state management   |
| **E2B Sandboxes**         | 3/5        | 2-3 weeks      | SDK integration, security policies          |
| **LiteLLM Gateway**       | 2/5        | 1-2 weeks      | Docker deployment, config file              |
| **NebulaGraph**           | 4/5        | 4-6 weeks      | Schema design, query optimization, GraphRAG |
| **NATS Messaging**        | 3/5        | 2-3 weeks      | Subject hierarchy, event schemas            |
| **Qdrant Vector DB**      | 2/5        | 1-2 weeks      | Collection setup, embedding integration     |
| **Inngest Jobs**          | 2/5        | 1-2 weeks      | Function definitions, triggers              |
| **Agent Runtime Core**    | 5/5        | 8-12 weeks     | Lifecycle management, state persistence     |
| **Testing & QA**          | 4/5        | 4-6 weeks      | Integration tests, load testing             |
| **Documentation**         | 3/5        | 2-3 weeks      | API docs, runbooks, troubleshooting         |

**Total Estimated Development Time:** **6-9 months** (with 2-3 developers)

### Risk Assessment

| Risk                         | Likelihood | Impact   | Mitigation                                                |
| ---------------------------- | ---------- | -------- | --------------------------------------------------------- |
| **LLM API cost overruns**    | High       | High     | Implement rate limiting, caching, budget alerts           |
| **Agent reliability issues** | Medium     | High     | Extensive testing, fallback mechanisms, human-in-the-loop |
| **Scalability bottlenecks**  | Medium     | Medium   | Load testing, horizontal scaling, monitoring              |
| **Security vulnerabilities** | Low        | Critical | E2B sandboxing, strict auth, security audits              |
| **Integration complexity**   | High       | Medium   | Phased rollout, prototype early, use managed services     |
| **Vendor lock-in**           | Low        | Medium   | Prefer open-source, avoid proprietary APIs                |

### Learning Curve

| Team Member      | New Tech to Learn                    | Estimated Ramp-Up |
| ---------------- | ------------------------------------ | ----------------- |
| **Backend Dev**  | LangGraph, NebulaGraph, NATS         | 2-3 weeks         |
| **AI/ML Dev**    | LangGraph, LiteLLM, E2B              | 1-2 weeks         |
| **DevOps**       | NebulaGraph, NATS, Qdrant deployment | 2-4 weeks         |
| **Frontend Dev** | Agent runtime APIs, SSE streaming    | 1 week            |

---

## Migration Path (v1 to v3)

### Phased Approach

#### **Phase 1: Foundation (Months 1-2)**

**Goal:** Set up core infrastructure without breaking v1

**Tasks:**

- [ ] Deploy LiteLLM Proxy Server (self-hosted)
- [ ] Set up Qdrant (managed or self-hosted)
- [ ] Deploy NATS JetStream cluster
- [ ] Set up Inngest for background jobs
- [ ] Create agent API authentication system

**Deliverable:** Infrastructure deployed, accessible via APIs

---

#### **Phase 2: Agent Runtime Core (Months 2-4)**

**Goal:** Build agent lifecycle management

**Tasks:**

- [ ] Implement AgentRuntime interface
- [ ] Agent creation, start, stop, configure
- [ ] Integrate E2B sandboxes for code execution
- [ ] Build agent state persistence
- [ ] Create agent event system (NATS)

**Deliverable:** Agents can be created and execute basic tasks

---

#### **Phase 3: Orchestration & Knowledge (Months 4-6)**

**Goal:** Add LangGraph workflows and knowledge graph

**Tasks:**

- [ ] Integrate LangGraph for workflows
- [ ] Deploy NebulaGraph cluster
- [ ] Build knowledge graph schema
- [ ] Implement GraphRAG for knowledge retrieval
- [ ] Connect agents to knowledge graph

**Deliverable:** Agents can execute complex workflows and learn from knowledge
graph

---

#### **Phase 4: Background Processing & Evolution (Months 6-7)**

**Goal:** Add autonomous agent capabilities

**Tasks:**

- [ ] Implement daily agent evolution (Inngest cron)
- [ ] Build agent-to-agent communication (NATS)
- [ ] Add background mission processing
- [ ] Implement agent memory (Qdrant)

**Deliverable:** Agents work autonomously, learn over time

---

#### **Phase 5: Testing & Optimization (Months 7-8)**

**Goal:** Ensure reliability and performance

**Tasks:**

- [ ] Integration testing across all components
- [ ] Load testing (100+ concurrent agents)
- [ ] Security audits
- [ ] Performance optimization
- [ ] Monitoring and observability (LangSmith)

**Deliverable:** Production-ready agent runtime

---

#### **Phase 6: Migration & Launch (Month 9)**

**Goal:** Migrate from OpenClaw to native runtime

**Tasks:**

- [ ] Parallel run (OpenClaw + native runtime)
- [ ] Migrate existing agents to native runtime
- [ ] Deprecate OpenClaw integration
- [ ] Full production launch

**Deliverable:** Cohortix v3 fully operational

---

### Backward Compatibility

**During migration (Phases 1-5):**

- v1 continues using OpenClaw (ClawdbotRuntime adapter)
- v3 components run in parallel
- UI remains unchanged (transparent backend upgrade)

**After migration (Phase 6):**

- OpenClaw integration removed
- All agents run on native runtime
- No breaking changes to UI/API

---

## Recommendations & Next Steps

### Primary Recommendation: Phased Adoption

**Start with minimal v3 components, scale up:**

1. **Quick Win (Month 1):** Deploy LiteLLM gateway to reduce LLM costs
   immediately
2. **Foundation (Months 2-3):** Set up Qdrant, NATS, Inngest
3. **Core Runtime (Months 4-6):** Build AgentRuntime with E2B and LangGraph
4. **Advanced Features (Months 7-9):** Add NebulaGraph knowledge graph, agent
   evolution

### Alternative Approaches

#### Option A: All-In on OpenAI Ecosystem

- Use OpenAI Agents SDK instead of LangGraph
- Use OpenAI Assistants API for agent memory
- Simpler, but vendor lock-in

**Pros:** Faster to build, less complexity  
**Cons:** Vendor lock-in, limited control, higher costs

#### Option B: Managed Services Only

- Use managed versions of everything (Qdrant Cloud, Synadia NATS, NebulaGraph
  Cloud)
- No self-hosting

**Pros:** Less DevOps overhead  
**Cons:** 2-3x higher monthly costs

#### Option C: Lightweight v3 (No Knowledge Graph)

- Skip NebulaGraph, use only pgvector + Qdrant
- Simpler relationships, less powerful knowledge system

**Pros:** Faster to build, lower complexity  
**Cons:** Limited knowledge graph capabilities

### Final Recommendation

**Go with the Primary Recommendation (Phased Adoption with Self-Hosting):**

- Best balance of cost, control, and capabilities
- Open-source foundations minimize vendor lock-in
- Can migrate to managed services later if needed
- Full knowledge graph capabilities for competitive advantage

### Immediate Next Steps

1. **Validate with stakeholders** — Review this document with Ahmad, Alim, Idris
2. **Prototype Phase 1** — Deploy LiteLLM, Qdrant, NATS in staging environment
3. **Design agent workflows** — Map out first LangGraph workflows for missions
4. **Set up monitoring** — Implement LangSmith, logging, metrics
5. **Create migration plan** — Detailed task breakdown for Phases 1-6

---

## Appendix: Further Research

### Resources for Deep Dives

**Agent Orchestration:**

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangSmith Observability](https://docs.smith.langchain.com/)
- [Multi-Agent Patterns (Google)](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/)

**Infrastructure:**

- [E2B Documentation](https://e2b.dev/docs)
- [LiteLLM Proxy Setup](https://docs.litellm.ai/docs/proxy/deploy)
- [NebulaGraph GraphRAG](https://www.nebula-graph.io/posts/graphrag)
- [NATS JetStream Guide](https://docs.nats.io/nats-concepts/jetstream)
- [Qdrant Production Guide](https://qdrant.tech/documentation/guides/production/)

**Cost Optimization:**

- [LLM Pricing Comparison](https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025)
- [Helicone Cost Tracking](https://www.helicone.ai/llm-cost)

### Open Questions for Ahmad

1. **Budget:** What's the acceptable monthly infrastructure cost for v3? ($1K?
   $5K? $10K?)
2. **Timeline:** Is 6-9 months acceptable for full v3 launch, or do we need
   faster MVP?
3. **Managed vs. Self-Hosted:** Preference for managed services (higher cost,
   less ops) or self-hosting (lower cost, more ops)?
4. **Knowledge Graph:** Is GraphRAG a must-have for v3, or can we defer to v3.1?
5. **Migration Strategy:** Big bang (full cutover) or gradual (parallel run for
   1-2 months)?

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-11  
**Next Review:** After stakeholder feedback

---

_This research provides the foundation for building Cohortix v3's custom agent
runtime. All technologies recommended are production-ready as of 2025-2026, with
active communities and enterprise adoption._
