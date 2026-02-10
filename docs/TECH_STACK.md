# Agent Command Center — Technology Stack

> Comprehensive technology decisions with rationale for enterprise-grade AaaS platform

*Version: 1.0.0 | Last Updated: 2026-02-05*

---

## Executive Summary

This document outlines every technology choice for Agent Command Center, including alternatives considered and final recommendations. The stack is optimized for:

- **Developer velocity** — Ship fast without sacrificing quality
- **Type safety** — End-to-end TypeScript
- **Scalability** — Handle enterprise load
- **Maintainability** — Clear patterns, minimal magic

---

## Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AGENT COMMAND CENTER STACK                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  FRONTEND                                                            │
│  ├── Framework:       Next.js 15 (App Router)                       │
│  ├── UI Library:      React 19 (Server Components)                  │
│  ├── Styling:         Tailwind CSS 4 + shadcn/ui                    │
│  ├── State:           Zustand + React Query (TanStack Query)        │
│  ├── Forms:           React Hook Form + Zod                         │
│  └── Real-time:       Server-Sent Events (SSE) / Ably              │
│                                                                      │
│  BACKEND                                                             │
│  ├── Runtime:         Next.js API Routes (Edge + Node.js)          │
│  ├── ORM:             Drizzle ORM                                   │
│  ├── Validation:      Zod                                           │
│  ├── Background Jobs: Inngest / Trigger.dev                         │
│  └── File Uploads:    Vercel Blob / AWS S3                         │
│                                                                      │
│  DATABASE                                                            │
│  ├── Primary:         PostgreSQL 16 (Neon / Supabase)              │
│  ├── Vector:          pgvector extension                            │
│  ├── Cache:           Redis (Upstash)                               │
│  └── Search:          PostgreSQL FTS → Meilisearch (future)        │
│                                                                      │
│  AUTHENTICATION                                                      │
│  └── Provider:        Clerk                                         │
│                                                                      │
│  INFRASTRUCTURE                                                      │
│  ├── Hosting:         Vercel                                        │
│  ├── CDN:             Vercel Edge Network                          │
│  ├── DNS:             Cloudflare                                    │
│  └── Monitoring:      Vercel Analytics + Sentry                    │
│                                                                      │
│  DEVELOPMENT                                                         │
│  ├── Language:        TypeScript 5.5+                               │
│  ├── Monorepo:        Turborepo                                     │
│  ├── Package Manager: pnpm                                          │
│  ├── Testing:         Vitest + Playwright                          │
│  ├── Linting:         ESLint + Prettier + Biome                    │
│  └── CI/CD:           GitHub Actions                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Frontend

### Framework: Next.js 15 (App Router)

**Decision**: Next.js 15 with App Router

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Next.js 15** | RSC, streaming, Vercel integration, massive ecosystem | Learning curve for App Router | ✅ **Selected** |
| Remix | Great forms, nested routes | Smaller ecosystem, less Vercel integration | ❌ |
| SvelteKit | Performance, DX | Smaller ecosystem, hiring pool | ❌ |
| Nuxt 4 | Vue ecosystem, good DX | Team prefers React, smaller enterprise adoption | ❌ |

**Rationale**:
- Native Vercel deployment optimization
- React Server Components reduce client bundle
- Excellent TypeScript support
- Largest ecosystem and talent pool
- Ahmad's team familiar with React

**Key Features Used**:
- App Router (file-based routing)
- Server Components (default)
- Server Actions (mutations)
- Streaming (Suspense boundaries)
- Middleware (auth, redirects)
- Route Handlers (API endpoints)

### UI Library: React 19

**Features Leveraged**:
- `use()` hook for promises
- Server Components
- Concurrent features (Suspense)
- Automatic batching
- `useOptimistic()` for instant UI feedback

### Styling: Tailwind CSS 4 + shadcn/ui

**Decision**: Tailwind CSS 4 with shadcn/ui component library

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Tailwind + shadcn** | Full control, accessible, copy-paste | Requires assembly | ✅ **Selected** |
| Chakra UI | Good DX, accessible | Runtime CSS-in-JS, larger bundle | ❌ |
| MUI (Material) | Enterprise features | Opinionated design, heavy | ❌ |
| Radix + custom | Maximum control | More work | ❌ Partial (via shadcn) |

**Rationale**:
- Zero runtime CSS (build-time)
- Full customization for ClickUp-like design
- shadcn/ui provides accessible primitives
- Easy dark mode implementation
- Excellent DX with Tailwind IntelliSense

**Component Strategy**:
```
src/components/
├── ui/                    # shadcn/ui components (button, card, etc.)
├── features/              # Feature-specific components
│   ├── tasks/
│   ├── projects/
│   └── agents/
├── layouts/               # Layout components
└── shared/                # Cross-feature components
```

### State Management: Zustand + TanStack Query

**Decision**: Zustand for client state, TanStack Query for server state

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Zustand + TanStack Query** | Simple, performant, separation of concerns | Two libraries | ✅ **Selected** |
| Redux Toolkit + RTK Query | All-in-one, mature | Boilerplate, overkill for this | ❌ |
| Jotai | Atomic model, simple | Less ecosystem | ❌ Considered |
| React Context only | Built-in | Re-render issues at scale | ❌ |

**Rationale**:
- TanStack Query handles server state caching, background refetch
- Zustand is minimal (~1KB) for UI state
- Clear separation: server state vs client state
- Excellent devtools for both

**Usage Pattern**:
```typescript
// Server state (API data)
const { data: projects } = useQuery({
  queryKey: ['projects', orgId],
  queryFn: () => api.projects.list(orgId)
});

// Client state (UI state)
const { sidebarOpen, toggleSidebar } = useSidebarStore();
```

### Forms: React Hook Form + Zod

**Decision**: React Hook Form with Zod validation

**Rationale**:
- Uncontrolled inputs = performant
- Zod schemas shared with backend
- Excellent TypeScript inference
- Built-in error handling

### Real-time: Server-Sent Events (SSE) / Ably

**Decision**: SSE for simple updates, Ably for complex real-time

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **SSE (primary)** | Simple, HTTP-based, works with Vercel | Unidirectional | ✅ **Selected** |
| Ably | Scalable, presence, rooms | Cost, external dependency | ✅ For advanced features |
| Pusher | Simple API | Cost, limited free tier | ❌ |
| Socket.io | Full duplex | Doesn't work well with Vercel Edge | ❌ |
| Supabase Realtime | Postgres integration | Locks you into Supabase | ❌ |

**Rationale**:
- SSE works natively with Vercel Edge Functions
- No WebSocket server to manage
- Ably for presence (who's viewing) and rooms (collaboration)

---

## Backend

### Runtime: Next.js API Routes

**Decision**: Next.js API Routes (not separate backend service)

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Next.js API Routes** | Same codebase, type sharing, Vercel native | Limited for heavy compute | ✅ **Selected** |
| FastAPI (Python) | Great for AI/ML, fast | Separate service, deployment complexity | ❌ For now |
| NestJS (Node.js) | Enterprise patterns, DI | Overkill, separate service | ❌ |
| Hono | Fast, edge-first | Newer, smaller ecosystem | ❌ Considered |

**Rationale**:
- Monolithic BFF reduces complexity
- Full-stack type safety
- Single Vercel deployment
- Can extract microservices later if needed

**When to Reconsider**:
- If we need heavy computation (custom agent runtime v3.0)
- If we need Python-specific AI/ML libraries
- If request volume exceeds Vercel function limits

### ORM: Drizzle ORM

**Decision**: Drizzle ORM

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Drizzle** | Type-safe, SQL-like, fast, edge-ready | Newer | ✅ **Selected** |
| Prisma | Mature, great DX | No edge runtime, slower queries | ❌ |
| Kysely | Type-safe SQL | More verbose | ❌ |
| Raw SQL | Maximum control | No type safety, error-prone | ❌ |

**Rationale**:
- Edge runtime compatible (critical for Vercel)
- SQL-like syntax (no magic)
- Excellent TypeScript inference
- Fast query execution
- Built-in migration system

**Example**:
```typescript
// Schema definition
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  status: projectStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type-safe query
const userProjects = await db
  .select()
  .from(projects)
  .where(eq(projects.organizationId, orgId))
  .orderBy(desc(projects.createdAt));
```

### Background Jobs: Inngest

**Decision**: Inngest for background jobs and workflows

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Inngest** | Serverless, Vercel native, workflows | Relatively new | ✅ **Selected** |
| Trigger.dev | Similar to Inngest, open source | Smaller community | ❌ Close second |
| BullMQ + Redis | Mature, flexible | Requires persistent server | ❌ |
| AWS SQS + Lambda | Scalable | AWS complexity | ❌ |

**Rationale**:
- Works with Vercel (no separate server)
- Built-in retries, scheduling, workflows
- Event-driven architecture
- Great local development experience

**Use Cases**:
- Agent task execution
- Email notifications
- Knowledge base indexing
- Webhook processing
- Scheduled reports

---

## Database

### Primary: PostgreSQL 16

**Decision**: PostgreSQL 16 with pgvector extension

**Hosting Options**:

| Provider | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Neon** | Serverless, branching, free tier | Newer | ✅ **Development** |
| **Supabase** | Postgres + more, good free tier | Vendor lock-in risk | ✅ **Alternative** |
| Railway | Simple, good DX | Less enterprise features | ❌ |
| AWS RDS | Enterprise, managed | More expensive, AWS complexity | ✅ **Production scale** |

**Decision**: Neon for development, evaluate Supabase or AWS RDS for production.

**Key Extensions**:
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Encryption
CREATE EXTENSION IF NOT EXISTS "vector";         -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Trigram similarity for search
```

### Vector Storage: pgvector

**Decision**: pgvector extension (not separate vector DB)

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **pgvector** | Same database, ACID, simple | Limited scale (but sufficient) | ✅ **Selected** |
| Pinecone | Purpose-built, scalable | Cost, separate service, vendor lock-in | ❌ |
| Weaviate | Open source, feature-rich | Operational complexity | ❌ |
| Qdrant | Open source, performant | Separate infrastructure | ❌ |
| ChromaDB | Simple, Python-focused | Less mature for production | ❌ |

**Rationale**:
- Single database for all data (simpler ops)
- ACID transactions across relational + vector
- Sufficient for millions of vectors
- HNSW index for fast similarity search
- Can migrate to dedicated vector DB later if needed

**Performance**:
- ~1M vectors: pgvector performs excellently
- ~10M vectors: Still viable with proper indexing
- ~100M+ vectors: Consider dedicated vector DB

### Knowledge Graph Support

**Decision**: PostgreSQL with JSONB + foreign keys (not Neo4j)

**Rationale**:
- Knowledge graph relationships stored as foreign keys in `knowledge_relationships` table
- Recursive CTEs for graph traversal (e.g., finding all prerequisites)
- JSONB for flexible metadata on relationships
- Simpler ops than running separate graph database
- Sufficient for knowledge graph scale (thousands of entries, tens of thousands of relationships)
- Can migrate to Neo4j if graph queries become complex (e.g., >100K relationships with deep traversals)

**Example Graph Traversal**:
```sql
-- Find all prerequisites for a knowledge entry
WITH RECURSIVE prerequisites AS (
  SELECT to_entry_id, 1 as depth
  FROM knowledge_relationships
  WHERE from_entry_id = 'entry_abc' AND relationship_type = 'depends_on'
  UNION
  SELECT kr.to_entry_id, p.depth + 1
  FROM knowledge_relationships kr
  JOIN prerequisites p ON kr.from_entry_id = p.to_entry_id
  WHERE kr.relationship_type = 'depends_on' AND depth < 5
)
SELECT ke.* FROM knowledge_entries ke
JOIN prerequisites p ON ke.id = p.to_entry_id;
```

### Cache: Redis (Upstash)

**Decision**: Upstash Redis (serverless)

**Rationale**:
- Serverless = no server management
- Pay-per-request pricing
- Global replication
- Works perfectly with Vercel Edge

**Use Cases**:
- Session storage
- Rate limiting
- Real-time pub/sub
- Temporary task state
- API response caching

---

## Authentication

### Provider: Clerk

**Decision**: Clerk for authentication and user management

**Detailed Comparison**:

| Feature | Clerk | NextAuth | Auth0 | Custom |
|---------|-------|----------|-------|--------|
| **Setup Time** | 1 hour | 4-8 hours | 2-4 hours | 40+ hours |
| **Multi-tenant / Orgs** | ✅ Built-in | ❌ DIY | ⚠️ Extra cost | ❌ DIY |
| **SSO (SAML/OIDC)** | ✅ Built-in | ❌ DIY | ✅ Extra cost | ❌ DIY |
| **User Management UI** | ✅ Built-in | ❌ DIY | ✅ Separate | ❌ DIY |
| **MFA** | ✅ Built-in | ⚠️ Limited | ✅ Built-in | ❌ DIY |
| **Impersonation** | ✅ Built-in | ❌ DIY | ✅ | ❌ DIY |
| **Compliance** | SOC2, GDPR | N/A | SOC2, GDPR | DIY |
| **Cost (1K MAU)** | Free | Free | Free | Free |
| **Cost (10K MAU)** | $25/mo | Free | $228/mo | Infra cost |
| **Cost (100K MAU)** | $250/mo | Free | $2,280/mo | Infra cost |
| **Next.js Integration** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Vendor Lock-in Risk** | Medium | Low | Medium | None |

**Decision: Clerk** ✅

**Rationale**:
1. **Multi-tenant out of the box**: Organizations feature matches our needs exactly
2. **Enterprise SSO included**: No extra work for SAML/OIDC
3. **Fastest implementation**: 40% faster than alternatives (per Clerk benchmark)
4. **Same-day Next.js 15 support**: First-class integration
5. **User management UI**: Don't need to build admin panels
6. **Cost-effective**: Competitive pricing for SaaS scale
7. **Impersonation**: Critical for support/debugging

**Mitigation for Vendor Lock-in**:
- Abstract Clerk behind our own `AuthService` interface
- Store user IDs as UUIDs in our database
- Can migrate to custom auth in v3.0 if needed

**Integration Pattern**:
```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});
```

---

## Infrastructure

### Hosting: Vercel

**Decision**: Vercel for all frontend and API hosting

**Rationale**:
- Native Next.js support (they made it)
- Edge Functions for global latency
- Preview deployments for every PR
- Automatic HTTPS, CDN
- Built-in analytics
- Team collaboration features

**Environment Configuration**:
```
Production:  app.agentcommandcenter.com   (main branch)
Staging:     staging.agentcommandcenter.com (staging branch)
Preview:     pr-123.agentcommandcenter.com  (PR previews)
Development: localhost:3000                  (local)
```

### Monitoring: Vercel Analytics + Sentry

**Decision**: Vercel Analytics for web vitals, Sentry for errors

**Vercel Analytics**:
- Core Web Vitals (LCP, FID, CLS)
- Real User Monitoring (RUM)
- Speed Insights

**Sentry**:
- Error tracking
- Performance monitoring
- Release tracking
- Source maps

---

## Development Tooling

### Language: TypeScript 5.5+

**Strict Configuration**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Monorepo: Turborepo

**Decision**: Turborepo with pnpm workspaces

**Rationale**:
- Vercel-native (same team)
- Fast incremental builds
- Remote caching
- Simple configuration

**Structure**:
```
/
├── apps/
│   ├── web/          # Next.js application
│   └── docs/         # Documentation site (future)
├── packages/
│   ├── ui/           # Shared UI components
│   ├── database/     # Drizzle schema + client
│   ├── config/       # Shared configs (ESLint, Tailwind)
│   └── types/        # Shared TypeScript types
└── tooling/
    ├── eslint/       # ESLint configuration
    └── typescript/   # TSConfig presets
```

### Package Manager: pnpm

**Rationale**:
- Fast installs
- Disk space efficient
- Strict by default
- Works well with Turborepo

### Testing: Vitest + Playwright

**Unit/Integration**: Vitest
- Fast (Vite-powered)
- Jest-compatible API
- Native TypeScript
- Watch mode

**E2E**: Playwright
- Cross-browser
- Auto-wait
- Tracing for debugging
- Component testing

### Code Quality: ESLint + Prettier + Biome

**ESLint**: Linting (code quality)
**Prettier**: Formatting (style)
**Biome**: Fast alternative for large codebase (evaluating)

---

## Version Summary

| Technology | Version | Release Date | Notes |
|------------|---------|--------------|-------|
| Next.js | 15.x | 2024 | Latest App Router |
| React | 19.x | 2024 | Server Components |
| TypeScript | 5.5+ | 2024 | Strict mode |
| Tailwind CSS | 4.x | 2025 | Latest features |
| PostgreSQL | 16 | 2023 | LTS |
| Drizzle ORM | Latest | - | Active development |
| Clerk | Latest | - | Regular updates |
| pnpm | 9.x | 2024 | Latest |
| Turborepo | 2.x | 2024 | Vercel maintained |

---

## Migration Path

### Phase 1 → Phase 2 (Potential Changes)

| Current | Potential Future | Trigger |
|---------|-----------------|---------|
| Next.js API Routes | Separate FastAPI service | Heavy ML workloads |
| pgvector | Pinecone / Weaviate | 10M+ vectors |
| SSE | Full WebSocket | Complex collaboration |
| Inngest | Temporal | Complex workflows |
| Clerk | Custom auth | Enterprise requirements |

### Abstraction Strategy

Keep abstractions thin but present:
```typescript
// Don't do this (over-abstraction)
interface IUserRepository extends IRepository<User> { ... }

// Do this (pragmatic abstraction)
// auth/service.ts
export const authService = {
  getCurrentUser: () => currentUser(),  // Clerk wrapper
  getOrganization: () => organization(), // Easy to swap
};
```

---

## Cost Estimation (MVP Phase)

| Service | Free Tier | Estimated (1K users) | Estimated (10K users) |
|---------|-----------|---------------------|----------------------|
| Vercel | Hobby free | Pro $20/mo | Pro $20/mo |
| Clerk | 10K MAU | $0 | $25/mo |
| Neon | 500MB | $0-19/mo | $19-69/mo |
| Upstash Redis | 10K/day | $0 | $10/mo |
| Vercel Blob | 1GB | $0 | $5/mo |
| Inngest | 25K events | $0 | $25/mo |
| Sentry | 5K errors | $0 | $26/mo |
| **Total** | - | **~$40/mo** | **~$180/mo** |

---

*Document maintained by: Architecture Team*
*Next review: 2026-03-01*
