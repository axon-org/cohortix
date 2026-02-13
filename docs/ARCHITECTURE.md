# Agent Command Center — System Architecture

> Enterprise-grade architecture for an Agents-as-a-Service (AaaS) platform

*Version: 1.0.0 | Last Updated: 2026-02-05*

---

## Executive Summary

Agent Command Center is a multi-tenant SaaS platform that enables organizations to orchestrate AI agents for mission management, action automation, and knowledge capture. The architecture is designed for:

- **Scale**: Support millions of actions across thousands of tenants
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
│  │  │  │  • Relational Data (Users, Orgs, Missions, Actions)          │    │    ││
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

### Client Entity Integration

The data model now includes a **Clients** entity that sits between Organizations and Missions:

```
Organization (Tenant)
    │
    ├─── Clients (1:many)
    │       │
    │       ├─── Missions (1:many, optional client_id)
    │       ├─── Goals (1:many, optional client_id)
    │       └─── Agent Assignments (many:many via agent_client_assignments)
    │
    ├─── Agents (1:many)
    │       └─── Client Assignments (which clients this agent works on)
    │
    └─── Knowledge Entries (1:many)
            ├─── Scope: Company-level (all agents see)
            ├─── Scope: Client-level (only agents assigned to client)
            └─── Scope: Mission-level (only agents assigned to mission)
```

**Key Design Points:**
- **Optional Client Association:** Missions and goals can optionally belong to a client
- **Agent-Client Assignment:** Tracks which agents work on which client accounts
- **Client Metadata:** Industry, contact info, custom fields for client context
- **Knowledge Segregation:** RLS policies ensure agents only see knowledge for clients they're assigned to

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
│  │  • /api/v1/missions/*   (CRUD operations)         │  │
│  │  • /api/v1/actions/*      (Action management)         │  │
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
  
  // Action execution
  assignTask(agentId: string, action: Action): Promise<TaskExecution>;
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
         │    • How does this apply to my operations?
         │    • What questions remain?
         │
         ├──▶ Update Expertise Matrix
         │    • Increment skill proficiency
         │    • Add new capabilities
         │    • Mark learning milestones
         │
         └──▶ Identify Next Learning Goal
              • Analyze performance gaps
              • Review upcoming operation requirements
              • Propose next course/material
```

#### Bidirectional Mission Flow

**Architecture supports both human→agent AND agent→human mission initiation**

```
┌─────────────────────────────────────────────────────────┐
│           BIDIRECTIONAL MISSION FLOW                     │
│                                                          │
│  ┌─────────────────┐         ┌─────────────────┐        │
│  │  Human Proposes │────────▶│ Mission Created │        │
│  │     Mission     │         │  (Approved)     │        │
│  └─────────────────┘         └────────┬────────┘        │
│                                       │                  │
│                                       ▼                  │
│  ┌─────────────────┐         ┌─────────────────┐        │
│  │  Agent Observes │────────▶│ Mission Proposal│        │
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
│                              │ Goal Created│        │
│                              │ Missions Assigned        │
│                              └─────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

**Key Components:**
- **Mission Source Tracking:** Every mission tagged with `source: 'human' | 'agent'`
- **Approval Workflow:** Agent proposals require human review
- **Justification System:** Agents must provide evidence for proposals
- **Modification Support:** Humans can adjust scope/priority before approval

### 4. Data Layer

#### Primary Database: PostgreSQL + pgvector

**Why PostgreSQL:**
- Battle-tested for enterprise workloads
- pgvector extension for semantic search (intelligence base)
- Row-Level Security (RLS) for multi-tenant isolation
- ACID compliance for data integrity
- JSON/JSONB for flexible schema where needed

**Multi-Tenant Strategy: Shared Database, Shared Schema with RLS**

```sql
-- Example: Row-Level Security policy
CREATE POLICY tenant_isolation ON missions
  USING (organization_id = current_setting('app.current_org_id')::uuid);

-- All queries automatically filtered by tenant
SET app.current_org_id = 'org_xyz123';
SELECT * FROM missions; -- Only returns org's missions
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
│  User  │───▶│  Supabase  │───▶│  Next.js  │───▶│  PostgreSQL │
│Browser │    │    Auth    │    │ Middleware│    │ (Supabase)  │
└────────┘    └────────────┘    └───────────┘    └─────────────┘
     │              │                 │                  │
     │  1. Sign In  │                 │                  │
     │  (email/OAuth)                 │                  │
     │─────────────▶│                 │                  │
     │              │                 │                  │
     │  2. JWT +    │                 │                  │
     │     Session  │                 │                  │
     │◀─────────────│                 │                  │
     │              │                 │                  │
     │  3. Request with JWT (httpOnly cookie)            │
     │───────────────────────────────▶│                  │
     │              │                 │                  │
     │              │  4. Verify JWT  │                  │
     │              │     via JWKS    │                  │
     │              │◀────────────────│                  │
     │              │                 │                  │
     │              │  5. JWT Valid   │                  │
     │              │─────────────────▶│                  │
     │              │                 │                  │
     │              │                 │  6. Query with   │
     │              │                 │     auth.uid()   │
     │              │                 │     (RLS active) │
     │              │                 │─────────────────▶│
     │              │                 │                  │
     │              │                 │  7. Filtered data│
     │              │                 │     (RLS applied)│
     │              │                 │◀─────────────────│
```

### Action Creation Flow

```
┌─────────┐   ┌───────────┐   ┌─────────────┐   ┌──────────┐   ┌───────────┐
│  Human  │──▶│  Next.js  │──▶│   Service   │──▶│ Database │──▶│   Agent   │
│  (UI)   │   │   Action  │   │   Layer     │   │  (PG)    │   │  Runtime  │
└─────────┘   └───────────┘   └─────────────┘   └──────────┘   └───────────┘
     │              │                │                │               │
     │ 1. Create    │                │                │               │
     │    Action      │                │                │               │
     │─────────────▶│                │                │               │
     │              │ 2. Validate    │                │               │
     │              │    + Authorize │                │               │
     │              │───────────────▶│                │               │
     │              │                │ 3. Insert      │               │
     │              │                │    action        │               │
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
│  │  • Proactive knowledge creation (not just post-action) │     │
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

### Scoped Knowledge Base Architecture

**Three-tier knowledge scoping for client data segregation:**

```
┌──────────────────────────────────────────────────────────────────┐
│                    SCOPED KNOWLEDGE BASE                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │         COMPANY-LEVEL KNOWLEDGE (scope_level='company')    │  │
│  │  • Deployment procedures                                   │  │
│  │  • Coding standards                                        │  │
│  │  • Internal tools & processes                              │  │
│  │  • Onboarding documentation                                │  │
│  │                                                             │  │
│  │  Visibility: ALL agents in organization                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │        CLIENT-LEVEL KNOWLEDGE (scope_level='client')        │ │
│  │  • Client X brand guidelines                                │ │
│  │  • Client X API documentation                               │ │
│  │  • Client X specific requirements                           │ │
│  │  • Client X historical context                              │ │
│  │                                                              │ │
│  │  Visibility: Only agents assigned to Client X               │ │
│  │             (via agent_client_assignments)                  │ │
│  └──────────────────────────▼────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │       MISSION-LEVEL KNOWLEDGE (scope_level='mission')       │ │
│  │  • Mission Y architecture decisions                         │ │
│  │  • Mission Y deployment config                              │ │
│  │  • Mission Y tech stack specifics                           │ │
│  │  • Mission Y learnings                                      │ │
│  │                                                              │ │
│  │  Visibility: Only agents assigned to Mission Y              │ │
│  │             (via agent_assignments)                         │ │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Scope Resolution Algorithm:**

1. **Agent searches knowledge** → Query includes agent_id
2. **System checks scope permissions:**
   - Company-level: Always included
   - Client-level: Only if agent assigned to that client
   - Mission-level: Only if agent assigned to that mission
3. **Results prioritized by scope specificity:**
   - Mission-level (most specific) ranked first
   - Client-level ranked second
   - Company-level (most general) ranked third
4. **Semantic similarity** applied within each scope tier

**Implementation via RLS + Custom Function:**

```sql
-- RLS policy ensures scope enforcement at database level
CREATE POLICY knowledge_client_scope ON knowledge_entries
  FOR SELECT USING (
    scope_level = 'company'
    OR (scope_level = 'client' AND scope_id IN (...agent's clients...))
    OR (scope_level = 'mission' AND scope_id IN (...agent's missions...))
  );

-- Semantic search function respects scope hierarchy
SELECT * FROM search_knowledge_semantic(
  embedding, org_id, agent_id
) ORDER BY scope_level, similarity DESC;
```

---

### Knowledge Retrieval Flow (Scoped)

```
┌─────────────────────────────────────────────────────────────────────┐
│              AGENT KNOWLEDGE SEARCH FLOW                             │
│                                                                      │
│  Agent Query: "How do we deploy to production?"                     │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  1. Generate Query Embedding (OpenAI/Anthropic)          │       │
│  └──────────────────┬───────────────────────────────────────┘       │
│                     │                                                │
│                     ▼                                                │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  2. Retrieve Agent Context                               │       │
│  │     • agent_id from session                              │       │
│  │     • Assigned clients from agent_client_assignments     │       │
│  │     • Assigned missions from agent_assignments           │       │
│  └──────────────────┬───────────────────────────────────────┘       │
│                     │                                                │
│                     ▼                                                │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  3. Query Knowledge Base (search_knowledge_semantic)     │       │
│  │     • Vector similarity search                           │       │
│  │     • Scope filtering (RLS + function)                   │       │
│  │     • Relevance score filter (> 0.3)                     │       │
│  └──────────────────┬───────────────────────────────────────┘       │
│                     │                                                │
│                     ▼                                                │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  4. Scope-Prioritized Results                            │       │
│  │                                                           │       │
│  │  [1] Mission: "Deploy Mission Y to Vercel" (0.92 sim)   │       │
│  │  [2] Client: "Client X deployment checklist" (0.88 sim) │       │
│  │  [3] Company: "General deployment guide" (0.85 sim)     │       │
│  │  [4] Company: "CI/CD best practices" (0.80 sim)         │       │
│  │                                                           │       │
│  │  ❌ Filtered out: Client Z knowledge (not assigned)      │       │
│  └──────────────────┬───────────────────────────────────────┘       │
│                     │                                                │
│                     ▼                                                │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  5. Return to Agent + Track Usage                        │       │
│  │     • Increment access_count                             │       │
│  │     • Update last_accessed_at                            │       │
│  │     • Log usage in knowledge_usage table                 │       │
│  └──────────────────────────────────────────────────────────┘       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Security Features:**
- **Database-level enforcement** via PostgreSQL RLS (can't bypass in app code)
- **Agent context in session** variable (`app.current_agent_id`)
- **Audit trail** in knowledge_usage table
- **No cross-client leakage** even if app has bugs

---

### Memory Decay Pipeline (Phase 2)

**Purpose:** Prevent knowledge base pollution from outdated/irrelevant entries

```
┌─────────────────────────────────────────────────────────────────────┐
│              MEMORY DECAY SYSTEM (Phase 2 Active)                    │
│                                                                      │
│  Phase 1 (MVP): Schema fields present, no active decay              │
│  Phase 2 (Post-MVP): Background jobs implement decay logic          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  DECAY SIGNALS (Tracked in knowledge_entries)            │       │
│  │  • access_count (how often accessed)                     │       │
│  │  • last_accessed_at (recency)                            │       │
│  │  • helpful_count (positive feedback)                     │       │
│  │  • unhelpful_count (negative feedback)                   │       │
│  │  • decay_disabled (manual evergreen flag)                │       │
│  └──────────────────┬───────────────────────────────────────┘       │
│                     │                                                │
│                     ▼                                                │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  DECAY ALGORITHM (Daily Background Job)                  │       │
│  │                                                           │       │
│  │  FOR each knowledge_entry WHERE decay_disabled = FALSE:  │       │
│  │                                                           │       │
│  │    days_since_access = NOW() - last_accessed_at          │       │
│  │    helpfulness_ratio = helpful / (helpful + unhelpful)   │       │
│  │                                                           │       │
│  │    decay_factor = CASE                                   │       │
│  │      WHEN days_since_access < 30  THEN 1.0  (no decay)   │       │
│  │      WHEN days_since_access < 90  THEN 0.95              │       │
│  │      WHEN days_since_access < 180 THEN 0.85              │       │
│  │      WHEN days_since_access < 365 THEN 0.70              │       │
│  │      ELSE 0.50                                           │       │
│  │    END                                                    │       │
│  │                                                           │       │
│  │    helpfulness_boost = helpfulness_ratio * 0.2           │       │
│  │                                                           │       │
│  │    new_relevance = MIN(                                  │       │
│  │      decay_factor + helpfulness_boost,                   │       │
│  │      1.0                                                  │       │
│  │    )                                                      │       │
│  │                                                           │       │
│  │    UPDATE knowledge_entries                              │       │
│  │    SET relevance_score = new_relevance                   │       │
│  │                                                           │       │
│  └──────────────────┬───────────────────────────────────────┘       │
│                     │                                                │
│                     ▼                                                │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  SEARCH FILTERING (relevance_score > 0.3 threshold)      │       │
│  │  • Entries below threshold excluded from search          │       │
│  │  • Not deleted (audit trail preserved)                   │       │
│  │  • Can be manually re-enabled if needed                  │       │
│  └──────────────────────────────────────────────────────────┘       │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  EVERGREEN KNOWLEDGE (decay_disabled = TRUE)             │       │
│  │  • Onboarding documentation                              │       │
│  │  • Core processes & standards                            │       │
│  │  • Critical compliance info                              │       │
│  │  • Never decays regardless of access patterns            │       │
│  └──────────────────────────────────────────────────────────┘       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Phase 1 (MVP) Implementation:**
- Schema fields exist and tracked
- `relevance_score` defaults to 1.0
- `access_count` and `last_accessed_at` updated on search
- `helpful_count` / `unhelpful_count` updated via feedback UI
- No background decay jobs (manual review only)

**Phase 2 (Post-MVP) Implementation:**
- Daily cron job applies decay algorithm
- Notification system alerts when knowledge falls below threshold
- Admin UI for reviewing low-relevance knowledge
- Agents can flag outdated knowledge for review

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
│  │  │  • Mission container                         │    │    │
│  │  │                                              │    │    │
│  │  │  ┌──────────────────────────────────────┐   │    │    │
│  │  │  │             MISSION                   │   │    │    │
│  │  │  │  • Contains actions, milestones         │   │    │    │
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
  "event": "action.completed",
  "agent_id": "ai-developer",
  "task_id": "task_xyz",
  "result": { ... },
  "knowledge_gained": [ ... ]
}

// Outbound: Assign action to agent
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
- Simpler deployment (single Vercel mission)
- Full-stack type safety with TypeScript
- Can extract microservices later if needed

### 2. PostgreSQL + pgvector vs Dedicated Vector DB

**Decision**: PostgreSQL with pgvector extension

**Rationale**:
- Single database to manage
- ACID transactions across relational + vector data
- Sufficient for millions of embeddings
- Lower operational complexity

### 3. Supabase Auth vs NextAuth vs Custom Auth

**Decision**: Supabase Auth (see TECH_STACK.md for full analysis)

**Rationale**:
- Integrated with database (same service)
- Native Row-Level Security (RLS) support
- OAuth + magic links built-in
- JWT-based authentication
- Realtime authentication state changes
- Cost-effective (included in Supabase)

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
