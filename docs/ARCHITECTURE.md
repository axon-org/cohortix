# Agent Command Center — System Architecture

> Enterprise-grade architecture for an Agents-as-a-Service (AaaS) platform

*Version: 1.0.0 | Last Updated: 2026-02-05*

---

## Executive Summary

Agent Command Center is a multi-tenant SaaS platform that enables organizations to orchestrate AI agents for project management, task automation, and knowledge capture. The architecture is designed for:

- **Scale**: Support millions of tasks across thousands of tenants
- **Security**: Enterprise-grade multi-tenant isolation
- **Flexibility**: Abstraction layer for agent runtime portability
- **Performance**: Sub-100ms response times for core operations
- **Reliability**: 99.9% uptime SLA target

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AGENT COMMAND CENTER                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                           CLIENT LAYER                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │   Web App    │  │  Mobile PWA  │  │   CLI Tool   │  │  Public API  │   │ │
│  │  │  (Next.js)   │  │  (Next.js)   │  │   (Future)   │  │   Clients    │   │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │ │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┼───────────┘ │
│            │                 │                 │                 │              │
│            └────────────────┬┴─────────────────┴─────────────────┘              │
│                             │                                                    │
│  ┌──────────────────────────▼──────────────────────────────────────────────────┐│
│  │                        API GATEWAY LAYER                                     ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐    ││
│  │  │                     Vercel Edge Network                              │    ││
│  │  │  • Edge Functions (Auth, Rate Limiting, Routing)                    │    ││
│  │  │  • CDN (Static Assets)                                               │    ││
│  │  │  • DDoS Protection                                                   │    ││
│  │  └─────────────────────────────────────────────────────────────────────┘    ││
│  └──────────────────────────┬──────────────────────────────────────────────────┘│
│                             │                                                    │
│  ┌──────────────────────────▼──────────────────────────────────────────────────┐│
│  │                      APPLICATION LAYER                                       ││
│  │                                                                              ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐    ││
│  │  │                    NEXT.JS APPLICATION                               │    ││
│  │  │                                                                      │    ││
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │    ││
│  │  │  │   Server    │ │   Server    │ │   Route     │ │  Middleware │   │    ││
│  │  │  │ Components  │ │  Actions    │ │  Handlers   │ │   (Auth)    │   │    ││
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │    ││
│  │  │                                                                      │    ││
│  │  │  ┌─────────────────────────────────────────────────────────────┐   │    ││
│  │  │  │              BACKEND-FOR-FRONTEND (BFF)                      │   │    ││
│  │  │  │  • API Route Handlers (/api/*)                              │   │    ││
│  │  │  │  • WebSocket Connections (via external service)             │   │    ││
│  │  │  │  • Server-Side Data Fetching                                │   │    ││
│  │  │  └─────────────────────────────────────────────────────────────┘   │    ││
│  │  └─────────────────────────────────────────────────────────────────────┘    ││
│  │                             │                                                ││
│  │  ┌──────────────────────────▼──────────────────────────────────────────┐    ││
│  │  │                   AGENT RUNTIME ABSTRACTION                          │    ││
│  │  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │    ││
│  │  │  │   Clawdbot     │  │  Custom Agent  │  │  Future Agent  │         │    ││
│  │  │  │   Adapter      │  │    Runtime     │  │    Runtime     │         │    ││
│  │  │  │   (Current)    │  │    (v2.0)      │  │    (v3.0+)     │         │    ││
│  │  │  └────────────────┘  └────────────────┘  └────────────────┘         │    ││
│  │  └─────────────────────────────────────────────────────────────────────┘    ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
│                             │                                                    │
│  ┌──────────────────────────▼──────────────────────────────────────────────────┐│
│  │                         DATA LAYER                                           ││
│  │                                                                              ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐    ││
│  │  │                    PRIMARY DATABASE                                  │    ││
│  │  │                                                                      │    ││
│  │  │  ┌────────────────────────────────────────────────────────────┐    │    ││
│  │  │  │              PostgreSQL + pgvector                          │    │    ││
│  │  │  │  • Relational Data (Users, Orgs, Projects, Tasks)          │    │    ││
│  │  │  │  • Vector Embeddings (Knowledge Base)                       │    │    ││
│  │  │  │  • Row-Level Security (Multi-tenant Isolation)              │    │    ││
│  │  │  │  • Full-Text Search (pg_trgm)                               │    │    ││
│  │  │  └────────────────────────────────────────────────────────────┘    │    ││
│  │  └─────────────────────────────────────────────────────────────────────┘    ││
│  │                                                                              ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             ││
│  │  │   Redis Cache   │  │   Blob Storage  │  │  Search Index   │             ││
│  │  │  • Sessions     │  │  • File uploads │  │  (Future:       │             ││
│  │  │  • Rate limits  │  │  • Attachments  │  │   Elasticsearch │             ││
│  │  │  • Real-time    │  │  • Agent assets │  │   or Meilisearch)│             ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────────┐│
│  │                      EXTERNAL INTEGRATIONS                                   ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          ││
│  │  │  GitHub  │ │  Figma   │ │  Slack   │ │ Telegram │ │  Google  │          ││
│  │  │   API    │ │   API    │ │   API    │ │   API    │ │Workspace │          ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Client Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Web Application** | Next.js 15 + React 19 | Primary interface for humans |
| **Mobile PWA** | Same Next.js app | Responsive mobile experience |
| **CLI Tool** | Node.js (Future v2.0) | Power user/developer access |
| **Public API Clients** | OpenAPI spec | Third-party integrations |

### 2. API Gateway Layer

Handled by **Vercel Edge Network**:

- **Edge Functions**: Auth verification, rate limiting, request routing
- **CDN**: Static asset caching with global distribution
- **DDoS Protection**: Automatic traffic analysis and mitigation
- **SSL/TLS**: End-to-end encryption

### 3. Application Layer

#### Next.js Application (Monolithic BFF Pattern)

The application uses a **Backend-for-Frontend (BFF)** pattern within Next.js:

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js Application                     │
│                                                          │
│  ┌───────────────────┐  ┌───────────────────┐           │
│  │  React Components │  │   Server Actions  │           │
│  │  (Client-Side)    │◄─┤  (Server-Side)    │           │
│  └───────────────────┘  └─────────┬─────────┘           │
│                                   │                      │
│  ┌───────────────────────────────▼───────────────────┐  │
│  │              API Route Handlers                    │  │
│  │  • /api/v1/projects/*   (CRUD operations)         │  │
│  │  • /api/v1/tasks/*      (Task management)         │  │
│  │  • /api/v1/agents/*     (Agent operations)        │  │
│  │  • /api/v1/knowledge/*  (Knowledge base)          │  │
│  │  • /api/v1/webhooks/*   (External triggers)       │  │
│  └───────────────────────────────┬───────────────────┘  │
│                                   │                      │
│  ┌───────────────────────────────▼───────────────────┐  │
│  │              Service Layer                         │  │
│  │  • Business Logic                                  │  │
│  │  • Validation                                      │  │
│  │  • Authorization                                   │  │
│  └───────────────────────────────┬───────────────────┘  │
│                                   │                      │
│  ┌───────────────────────────────▼───────────────────┐  │
│  │              Data Access Layer (Drizzle ORM)       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Agent Runtime Abstraction Layer

Critical for future-proofing. Allows swapping agent backends:

```typescript
// Abstract interface for agent runtime
interface AgentRuntime {
  // Agent lifecycle
  createAgent(config: AgentConfig): Promise<Agent>;
  startAgent(agentId: string): Promise<void>;
  stopAgent(agentId: string): Promise<void>;
  
  // Task execution
  assignTask(agentId: string, task: Task): Promise<TaskExecution>;
  getTaskStatus(executionId: string): Promise<TaskStatus>;
  
  // Communication
  sendMessage(agentId: string, message: Message): Promise<Response>;
  subscribeToEvents(agentId: string, callback: EventCallback): Subscription;
  
  // Knowledge
  addKnowledge(agentId: string, knowledge: Knowledge): Promise<void>;
  queryKnowledge(agentId: string, query: string): Promise<Knowledge[]>;
}

// Current implementation
class ClawdbotRuntime implements AgentRuntime {
  // Wraps Clawdbot API
}

// Future implementation
class CustomRuntime implements AgentRuntime {
  // Our own agent runtime
}
```

#### Agent Evolution Pipeline

**Purpose:** Systematic ally learning and expertise growth

```typescript
interface EvolutionPipeline {
  // Learning material management
  ingestLearningMaterial(material: LearningMaterial): Promise<void>;
  getLearningPath(agentId: string, targetSkill: string): Promise<Course[]>;
  
  // Daily evolution
  scheduleEvolutionSession(agentId: string, time: Date): Promise<void>;
  runEvolutionSession(agentId: string): Promise<EvolutionReport>;
  
  // Expertise tracking
  updateExpertise(agentId: string, skill: string, delta: number): Promise<void>;
  getExpertiseMatrix(agentId: string): Promise<SkillMatrix>;
  
  // Self-improvement
  identifyKnowledgeGaps(agentId: string): Promise<Gap[]>;
  proposeTraining(agentId: string, gap: Gap): Promise<TrainingProposal>;
}
```

**Evolution Session Flow:**
```
Daily 9 AM Evolution Session
         │
         ├──▶ Consume Learning Material (30 min)
         │    • Read course content
         │    • Process documentation
         │    • Extract key concepts
         │
         ├──▶ Reflection + Integration (15 min)
         │    • What did I learn?
         │    • How does this apply to my missions?
         │    • What questions remain?
         │
         ├──▶ Update Expertise Matrix
         │    • Increment skill proficiency
         │    • Add new capabilities
         │    • Mark learning milestones
         │
         └──▶ Identify Next Learning Goal
              • Analyze performance gaps
              • Review upcoming mission requirements
              • Propose next course/material
```

#### Bidirectional Goal Flow

**Architecture supports both human→agent AND agent→human goal initiation**

```
┌─────────────────────────────────────────────────────────┐
│              BIDIRECTIONAL GOAL FLOW                     │
│                                                          │
│  ┌─────────────────┐         ┌─────────────────┐        │
│  │  Human Proposes │────────▶│  Goal Created   │        │
│  │      Goal       │         │  (Approved)     │        │
│  └─────────────────┘         └────────┬────────┘        │
│                                       │                  │
│                                       ▼                  │
│  ┌─────────────────┐         ┌─────────────────┐        │
│  │  Agent Observes │────────▶│  Goal Proposal  │        │
│  │  Performance    │         │  (Pending)      │        │
│  │  Issues/Opps    │         └────────┬────────┘        │
│  └─────────────────┘                  │                  │
│                                       ▼                  │
│                              ┌─────────────────┐        │
│                              │ Human Reviews   │        │
│                              │ Approve/Reject/ │        │
│                              │ Modify          │        │
│                              └────────┬────────┘        │
│                                       │                  │
│                  Approved ────────────┼────────Rejected  │
│                      │                │            │     │
│                      ▼                │            ▼     │
│              ┌─────────────────┐      │      (Discard)  │
│              │  Goal Created   │      │                 │
│              │  (Agent-Init)   │      │                 │
│              └─────────────────┘      │                 │
│                                       │                  │
│                                       ▼                  │
│                              ┌─────────────────┐        │
│                              │ Campaign Created│        │
│                              │ Missions Assigned        │
│                              └─────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

**Key Components:**
- **Goal Source Tracking:** Every goal tagged with `source: 'human' | 'agent'`
- **Approval Workflow:** Agent proposals require human review
- **Justification System:** Agents must provide evidence for proposals
- **Modification Support:** Humans can adjust scope/priority before approval

### 4. Data Layer

#### Primary Database: PostgreSQL + pgvector

**Why PostgreSQL:**
- Battle-tested for enterprise workloads
- pgvector extension for semantic search (knowledge base)
- Row-Level Security (RLS) for multi-tenant isolation
- ACID compliance for data integrity
- JSON/JSONB for flexible schema where needed

**Multi-Tenant Strategy: Shared Database, Shared Schema with RLS**

```sql
-- Example: Row-Level Security policy
CREATE POLICY tenant_isolation ON projects
  USING (organization_id = current_setting('app.current_org_id')::uuid);

-- All queries automatically filtered by tenant
SET app.current_org_id = 'org_xyz123';
SELECT * FROM projects; -- Only returns org's projects
```

#### Supporting Data Stores

| Store | Technology | Purpose |
|-------|------------|---------|
| **Cache** | Redis (Upstash) | Sessions, rate limits, real-time pub/sub |
| **Blob Storage** | Vercel Blob / S3 | File attachments, agent assets |
| **Search** | PostgreSQL FTS (v1) → Meilisearch (v2) | Full-text search |

### 5. External Integrations

Webhook-based integrations with event-driven architecture:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  External       │────▶│  Webhook        │────▶│  Event          │
│  Service        │     │  Handler        │     │  Processor      │
│  (GitHub, etc.) │◀────│  /api/webhooks  │◀────│  (Background)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Data Flow Diagrams

### User Authentication Flow

```
┌────────┐    ┌────────────┐    ┌───────────┐    ┌─────────────┐
│  User  │───▶│   Clerk    │───▶│  Next.js  │───▶│  PostgreSQL │
│Browser │    │   Auth     │    │ Middleware│    │   (Users)   │
└────────┘    └────────────┘    └───────────┘    └─────────────┘
     │              │                 │                  │
     │  1. Login    │                 │                  │
     │─────────────▶│                 │                  │
     │              │                 │                  │
     │  2. JWT      │                 │                  │
     │◀─────────────│                 │                  │
     │              │                 │                  │
     │  3. Request with JWT           │                  │
     │───────────────────────────────▶│                  │
     │              │                 │                  │
     │              │  4. Verify JWT  │                  │
     │              │◀────────────────│                  │
     │              │                 │                  │
     │              │                 │  5. Get user +   │
     │              │                 │     org context  │
     │              │                 │─────────────────▶│
     │              │                 │                  │
     │              │                 │  6. Set RLS      │
     │              │                 │     context      │
     │              │                 │─────────────────▶│
```

### Task Creation Flow

```
┌─────────┐   ┌───────────┐   ┌─────────────┐   ┌──────────┐   ┌───────────┐
│  Human  │──▶│  Next.js  │──▶│   Service   │──▶│ Database │──▶│   Agent   │
│  (UI)   │   │   Action  │   │   Layer     │   │  (PG)    │   │  Runtime  │
└─────────┘   └───────────┘   └─────────────┘   └──────────┘   └───────────┘
     │              │                │                │               │
     │ 1. Create    │                │                │               │
     │    Task      │                │                │               │
     │─────────────▶│                │                │               │
     │              │ 2. Validate    │                │               │
     │              │    + Authorize │                │               │
     │              │───────────────▶│                │               │
     │              │                │ 3. Insert      │               │
     │              │                │    task        │               │
     │              │                │───────────────▶│               │
     │              │                │                │               │
     │              │                │ 4. Trigger     │               │
     │              │                │    webhook     │               │
     │              │                │───────────────────────────────▶│
     │              │                │                │               │
     │              │                │                │ 5. Agent      │
     │              │                │                │    notified   │
     │              │                │                │◀──────────────│
     │              │                │                │               │
     │ 6. Confirm   │                │                │               │
     │◀─────────────│                │                │               │
```

### Knowledge Base Semantic Search Flow

```
┌─────────┐   ┌───────────┐   ┌─────────────┐   ┌──────────────────┐
│  User   │──▶│  Search   │──▶│  Embedding  │──▶│  PostgreSQL      │
│  Query  │   │   API     │   │   Service   │   │  pgvector        │
└─────────┘   └───────────┘   └─────────────┘   └──────────────────┘
     │              │                │                    │
     │ 1. Search    │                │                    │
     │   "how to    │                │                    │
     │    deploy"   │                │                    │
     │─────────────▶│                │                    │
     │              │ 2. Generate    │                    │
     │              │    embedding   │                    │
     │              │───────────────▶│                    │
     │              │                │ 3. Vector         │
     │              │                │    similarity     │
     │              │                │    search         │
     │              │                │───────────────────▶│
     │              │                │                    │
     │              │                │ 4. Top K results  │
     │              │                │◀───────────────────│
     │              │                │                    │
     │ 5. Ranked    │                │                    │
     │    results   │                │                    │
     │◀─────────────│                │                    │
```

### Living Knowledge Base Architecture

**Not just logs — a continuously evolving knowledge system**

```
┌───────────────────────────────────────────────────────────────┐
│              LIVING KNOWLEDGE BASE                             │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐     │
│  │         CONTINUOUS KNOWLEDGE CAPTURE                  │     │
│  │  • Real-time capture during mission execution        │     │
│  │  • Proactive knowledge creation (not just post-task) │     │
│  │  • Agent-initiated knowledge entries                 │     │
│  └──────────────────────┬───────────────────────────────┘     │
│                         │                                      │
│                         ▼                                      │
│  ┌──────────────────────────────────────────────────────┐     │
│  │         KNOWLEDGE GRAPH (Relationships)               │     │
│  │                                                       │     │
│  │  Entry A ──depends-on──▶ Entry B                     │     │
│  │  Entry B ──related-to──▶ Entry C                     │     │
│  │  Entry C ──contradicts──▶ Entry D (deprecated)       │     │
│  │  Entry E ──supersedes──▶ Entry D                     │     │
│  │                                                       │     │
│  │  Relationship Types:                                 │     │
│  │  • depends-on (prerequisite knowledge)               │     │
│  │  • related-to (same domain)                          │     │
│  │  • contradicts (conflicting approaches)              │     │
│  │  • supersedes (newer/better knowledge)               │     │
│  │  • examples-of (concrete implementations)            │     │
│  └──────────────────────┬───────────────────────────────┘     │
│                         │                                      │
│                         ▼                                      │
│  ┌──────────────────────────────────────────────────────┐     │
│  │         KNOWLEDGE EVOLUTION (Versioning)              │     │
│  │                                                       │     │
│  │  Entry: "How to deploy Next.js to Vercel"           │     │
│  │                                                       │     │
│  │  v1 (2026-01-01) - Initial entry                     │     │
│  │  v2 (2026-02-01) - Added Edge Function details       │     │
│  │  v3 (2026-03-01) - Updated for Next.js 15           │     │
│  │  v4 (2026-04-01) - Deprecated (superseded by...)     │     │
│  │                                                       │     │
│  │  • Full version history                              │     │
│  │  • Attribution (who updated, when, why)              │     │
│  │  • Rollback capability                               │     │
│  │  • Deprecation workflow                              │     │
│  └──────────────────────┬───────────────────────────────┘     │
│                         │                                      │
│                         ▼                                      │
│  ┌──────────────────────────────────────────────────────┐     │
│  │         CROSS-ALLY KNOWLEDGE SHARING                  │     │
│  │                                                       │     │
│  │  Agent A learns → Knowledge entry created            │     │
│  │         ↓                                             │     │
│  │  Agent B searches → Finds Agent A's knowledge        │     │
│  │         ↓                                             │     │
│  │  Agent B refines → Updates entry (new version)       │     │
│  │         ↓                                             │     │
│  │  Agent C benefits → Uses refined knowledge           │     │
│  │                                                       │     │
│  │  • Shared knowledge pool (per HQ)                    │     │
│  │  • Attribution & reputation                          │     │
│  │  • Usage tracking (which knowledge is valuable?)     │     │
│  │  • Collaborative refinement                          │     │
│  └──────────────────────┬───────────────────────────────┘     │
│                         │                                      │
│                         ▼                                      │
│  ┌──────────────────────────────────────────────────────┐     │
│  │         SMART KNOWLEDGE SUGGESTIONS                   │     │
│  │                                                       │     │
│  │  Mission Context: "Implement auth with Clerk"        │     │
│  │         ↓                                             │     │
│  │  System suggests:                                    │     │
│  │  1. "Clerk integration guide" (v3, used 12 times)   │     │
│  │  2. "Common auth pitfalls" (related)                 │     │
│  │  3. "Environment setup" (prerequisite)               │     │
│  │                                                       │     │
│  │  • Context-aware recommendations                     │     │
│  │  • Popularity/usage-based ranking                    │     │
│  │  • Prerequisite knowledge surfacing                  │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Key Architectural Decisions:**

1. **Graph Storage:** Use PostgreSQL JSONB + foreign keys for relationships (not Neo4j)
   - Simpler ops, same database
   - Sufficient for knowledge graph at this scale
   - Can migrate to Neo4j if graph queries become complex

2. **Versioning:** Track full history with `knowledge_versions` table
   - Immutable audit trail
   - Git-like versioning model
   - Diffing capability for UI

3. **Deprecation Strategy:**
   - Soft delete (mark as deprecated, don't remove)
   - Link to superseding entry
   - Keep for historical reference

4. **Cross-Ally Sharing:** 
   - All knowledge visible to all allies in same HQ (tenant isolation)
   - Attribution tracking for reputation
   - Usage metrics for quality signals

---

## Multi-Tenant Architecture

### Tenant Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      PLATFORM                                │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 ORGANIZATION (Tenant)                │    │
│  │  • Isolated data via RLS                            │    │
│  │  • Custom branding (future)                         │    │
│  │  • Billing unit                                     │    │
│  │                                                      │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │              WORKSPACE (Optional)            │    │    │
│  │  │  • Team-level grouping                       │    │    │
│  │  │  • Project container                         │    │    │
│  │  │                                              │    │    │
│  │  │  ┌──────────────────────────────────────┐   │    │    │
│  │  │  │             PROJECT                   │   │    │    │
│  │  │  │  • Contains tasks, milestones         │   │    │    │
│  │  │  │  • Agent assignments                  │   │    │    │
│  │  │  │  • Knowledge scoping                  │   │    │    │
│  │  │  └──────────────────────────────────────┘   │    │    │
│  │  │                                              │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐                   │    │
│  │  │    USERS    │  │   AGENTS    │                   │    │
│  │  │  • Members  │  │  • Owned by │                   │    │
│  │  │  • Roles    │  │    org      │                   │    │
│  │  │  • Perms    │  │  • Assigned │                   │    │
│  │  └─────────────┘  └─────────────┘                   │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Isolation Strategy

1. **Row-Level Security (RLS)**: Every table with tenant data has `organization_id`
2. **Context Injection**: Middleware sets `app.current_org_id` per request
3. **Query Enforcement**: All queries automatically filtered
4. **Cross-Tenant Prevention**: Foreign keys enforce referential integrity

---

## Scalability Considerations

### Horizontal Scaling Path

```
Phase 1 (MVP - 2026)           Phase 2 (Growth - 2027)        Phase 3 (Enterprise - 2028+)
┌─────────────────────┐        ┌─────────────────────┐        ┌─────────────────────┐
│  Single Vercel      │        │  Vercel + External  │        │  Distributed        │
│  Deployment         │   ──▶  │  Background Workers │   ──▶  │  Microservices      │
│                     │        │                     │        │                     │
│  • PG single node   │        │  • PG read replicas │        │  • PG + Citus       │
│  • Redis single     │        │  • Redis cluster    │        │  • Kafka events     │
│  • Vercel functions │        │  • Queue workers    │        │  • K8s workers      │
└─────────────────────┘        └─────────────────────┘        └─────────────────────┘
```

### Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| API Response (P95) | < 100ms | Edge caching, connection pooling |
| Search Latency | < 200ms | pgvector HNSW index |
| Real-time Updates | < 50ms | Redis pub/sub |
| Page Load (LCP) | < 2.5s | Server components, streaming |
| Concurrent Users | 10K | Stateless design, horizontal scale |

---

## Deployment Architecture

### Environment Topology

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         VERCEL PLATFORM                                  │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   DEVELOPMENT   │  │    STAGING      │  │   PRODUCTION    │         │
│  │                 │  │                 │  │                 │         │
│  │  Branch: dev    │  │  Branch: staging│  │  Branch: main   │         │
│  │  URL: dev.acc.  │  │  URL: stg.acc.  │  │  URL: app.acc.  │         │
│  │                 │  │                 │  │                 │         │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │         │
│  │  │  Preview  │  │  │  │  Preview  │  │  │  │Production │  │         │
│  │  │   DB      │  │  │  │   DB      │  │  │  │   DB      │  │         │
│  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │         │
│  │                 │  │                 │  │                 │         │
│  │  Test/Seed data │  │  Prod-like data │  │  Real data      │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### Clawdbot Integration (Current Agent Runtime)

```typescript
// Webhook receiver for Clawdbot events
POST /api/webhooks/clawdbot
{
  "event": "task.completed",
  "agent_id": "ai-developer",
  "task_id": "task_xyz",
  "result": { ... },
  "knowledge_gained": [ ... ]
}

// Outbound: Assign task to agent
POST https://clawdbot.api/v1/tasks
{
  "agent": "ai-developer",
  "description": "Implement login page",
  "context": { ... }
}
```

### External Service Integrations

| Service | Integration Method | Data Flow |
|---------|-------------------|-----------|
| GitHub | OAuth + Webhooks | Bi-directional |
| Figma | OAuth + API | Read |
| Slack | OAuth + Events API | Bi-directional |
| Telegram | Bot API | Bi-directional |
| Google Workspace | OAuth + API | Bi-directional |

---

## Key Design Decisions

### 1. Monolithic BFF vs Microservices

**Decision**: Monolithic BFF within Next.js

**Rationale**:
- Faster time to market
- Simpler deployment (single Vercel project)
- Full-stack type safety with TypeScript
- Can extract microservices later if needed

### 2. PostgreSQL + pgvector vs Dedicated Vector DB

**Decision**: PostgreSQL with pgvector extension

**Rationale**:
- Single database to manage
- ACID transactions across relational + vector data
- Sufficient for millions of embeddings
- Lower operational complexity

### 3. Clerk vs NextAuth vs Custom Auth

**Decision**: Clerk (see TECH_STACK.md for full analysis)

**Rationale**:
- Enterprise SSO out of the box
- Organization/multi-tenant support built-in
- Faster implementation time
- Excellent Next.js integration

### 4. Multi-Tenant Strategy

**Decision**: Shared database with Row-Level Security

**Rationale**:
- Scales to millions of tenants
- Lower operational overhead
- Consistent schema across tenants
- Easy cross-tenant analytics for platform owner

---

## Disaster Recovery

### Backup Strategy

| Data | RPO | RTO | Method |
|------|-----|-----|--------|
| PostgreSQL | 1 hour | 4 hours | Automated snapshots + WAL archiving |
| Redis | N/A | 15 min | Ephemeral (rebuild from source) |
| Blob Storage | 0 | 1 hour | S3 cross-region replication |

### Failover Plan

1. **Database**: Automatic failover to read replica (promoted to primary)
2. **Application**: Vercel automatic multi-region failover
3. **DNS**: Cloudflare load balancing with health checks

---

## Appendix

### Technology Compatibility Matrix

| Component | Alternatives Considered | Selection |
|-----------|------------------------|-----------|
| Frontend | React, Vue, Svelte | Next.js (React) |
| Backend | FastAPI, Express, Hono | Next.js API Routes |
| Database | MySQL, MongoDB, Supabase | PostgreSQL + pgvector |
| ORM | Prisma, TypeORM | Drizzle ORM |
| Auth | NextAuth, Auth0, Custom | Clerk |
| Cache | Memcached, KeyDB | Redis (Upstash) |
| Hosting | AWS, GCP, Railway | Vercel |

---

*Document maintained by: Architecture Team*
*Next review: 2026-03-01*
