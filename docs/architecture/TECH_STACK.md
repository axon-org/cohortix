# Agent Command Center — Technology Stack

> Comprehensive technology decisions with rationale for enterprise-grade AaaS
> platform

_Version: 1.0.0 | Last Updated: 2026-02-05_

---

## Executive Summary

This document outlines every technology choice for Agent Command Center,
including alternatives considered and final recommendations. The stack is
optimized for:

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
│  └── File Storage:    Supabase Storage (S3-compatible)              │
│                                                                      │
│  DATABASE                                                            │
│  ├── Primary:         PostgreSQL 16 (Supabase)                      │
│  ├── Vector:          pgvector extension                            │
│  ├── Cache:           Redis (Upstash)                               │
│  └── Search:          PostgreSQL FTS → Meilisearch (future)        │
│                                                                      │
│  AUTHENTICATION & REALTIME                                           │
│  ├── Auth:            Supabase Auth (email + Google OAuth + magic)  │
│  ├── Realtime:        Supabase Realtime (WebSocket subscriptions)   │
│  └── Edge Functions:  Supabase Edge Functions (agent runtime)       │
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

| Option         | Pros                                                  | Cons                                            | Verdict         |
| -------------- | ----------------------------------------------------- | ----------------------------------------------- | --------------- |
| **Next.js 15** | RSC, streaming, Vercel integration, massive ecosystem | Learning curve for App Router                   | ✅ **Selected** |
| Remix          | Great forms, nested routes                            | Smaller ecosystem, less Vercel integration      | ❌              |
| SvelteKit      | Performance, DX                                       | Smaller ecosystem, hiring pool                  | ❌              |
| Nuxt 4         | Vue ecosystem, good DX                                | Team prefers React, smaller enterprise adoption | ❌              |

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

| Option                | Pros                                 | Cons                             | Verdict                 |
| --------------------- | ------------------------------------ | -------------------------------- | ----------------------- |
| **Tailwind + shadcn** | Full control, accessible, copy-paste | Requires assembly                | ✅ **Selected**         |
| Chakra UI             | Good DX, accessible                  | Runtime CSS-in-JS, larger bundle | ❌                      |
| MUI (Material)        | Enterprise features                  | Opinionated design, heavy        | ❌                      |
| Radix + custom        | Maximum control                      | More work                        | ❌ Partial (via shadcn) |

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
│   ├── actions/
│   ├── missions/
│   └── agents/
├── layouts/               # Layout components
└── shared/                # Cross-feature components
```

### State Management: Zustand + TanStack Query

**Decision**: Zustand for client state, TanStack Query for server state

**Alternatives Considered**:

| Option                       | Pros                                       | Cons                           | Verdict         |
| ---------------------------- | ------------------------------------------ | ------------------------------ | --------------- |
| **Zustand + TanStack Query** | Simple, performant, separation of concerns | Two libraries                  | ✅ **Selected** |
| Redux Toolkit + RTK Query    | All-in-one, mature                         | Boilerplate, overkill for this | ❌              |
| Jotai                        | Atomic model, simple                       | Less ecosystem                 | ❌ Considered   |
| React Context only           | Built-in                                   | Re-render issues at scale      | ❌              |

**Rationale**:

- TanStack Query handles server state caching, background refetch
- Zustand is minimal (~1KB) for UI state
- Clear separation: server state vs client state
- Excellent devtools for both

**Usage Pattern**:

```typescript
// Server state (API data)
const { data: missions } = useQuery({
  queryKey: ['missions', orgId],
  queryFn: () => api.projects.list(orgId),
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

### Real-time: Supabase Realtime (Primary) + SSE Fallback

**Decision**: Supabase Realtime for database subscriptions, SSE for custom
events

**Alternatives Considered**:

| Option                | Pros                                                   | Cons                                   | Verdict                           |
| --------------------- | ------------------------------------------------------ | -------------------------------------- | --------------------------------- |
| **Supabase Realtime** | Postgres integration, no extra cost, built-in presence | Couples to Supabase                    | ✅ **Primary (selected)**         |
| SSE                   | Simple, HTTP-based, works with Vercel                  | Unidirectional, manual state sync      | ✅ **Fallback for custom events** |
| Ably                  | Scalable, presence, rooms                              | Cost ($29-99+/mo), external dependency | ❌                                |
| Pusher                | Simple API                                             | Cost, limited free tier                | ❌                                |
| Socket.io             | Full duplex                                            | Doesn't work well with Vercel Edge     | ❌                                |

**Rationale** (Updated after Supabase decision):

- **Supabase Realtime** handles database-driven updates automaticagent (agent
  activities, missions, knowledge)
- Built on PostgreSQL logical replication (extremely reliable)
- No extra cost (included in Supabase Pro)
- Client library handles reconnection, buffering, and offline support
- SSE remains useful for non-database events (custom notifications, webhooks)

---

## Backend

### Runtime: Next.js API Routes

**Decision**: Next.js API Routes (not separate backend service)

**Alternatives Considered**:

| Option                 | Pros                                       | Cons                                    | Verdict         |
| ---------------------- | ------------------------------------------ | --------------------------------------- | --------------- |
| **Next.js API Routes** | Same codebase, type sharing, Vercel native | Limited for heavy compute               | ✅ **Selected** |
| FastAPI (Python)       | Great for AI/ML, fast                      | Separate service, deployment complexity | ❌ For now      |
| NestJS (Node.js)       | Enterprise patterns, DI                    | Overkill, separate service              | ❌              |
| Hono                   | Fast, edge-first                           | Newer, smaller ecosystem                | ❌ Considered   |

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

| Option      | Pros                                  | Cons                            | Verdict         |
| ----------- | ------------------------------------- | ------------------------------- | --------------- |
| **Drizzle** | Type-safe, SQL-like, fast, edge-ready | Newer                           | ✅ **Selected** |
| Prisma      | Mature, great DX                      | No edge runtime, slower queries | ❌              |
| Kysely      | Type-safe SQL                         | More verbose                    | ❌              |
| Raw SQL     | Maximum control                       | No type safety, error-prone     | ❌              |

**Rationale**:

- Edge runtime compatible (critical for Vercel)
- SQL-like syntax (no magic)
- Excellent TypeScript inference
- Fast query execution
- Built-in migration system

**Example**:

```typescript
// Schema definition
export const missions = pgTable('missions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  status: projectStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type-safe query
const userProjects = await db
  .select()
  .from(missions)
  .where(eq(missions.organizationId, orgId))
  .orderBy(desc(missions.createdAt));
```

### Background Jobs: Inngest

**Decision**: Inngest for background jobs and workflows

**Alternatives Considered**:

| Option           | Pros                                 | Cons                       | Verdict         |
| ---------------- | ------------------------------------ | -------------------------- | --------------- |
| **Inngest**      | Serverless, Vercel native, workflows | Relatively new             | ✅ **Selected** |
| Trigger.dev      | Similar to Inngest, open source      | Smaller community          | ❌ Close second |
| BullMQ + Redis   | Mature, flexible                     | Requires persistent server | ❌              |
| AWS SQS + Lambda | Scalable                             | AWS complexity             | ❌              |

**Rationale**:

- Works with Vercel (no separate server)
- Built-in retries, scheduling, workflows
- Event-driven architecture
- Great local development experience

**Use Cases**:

- Agent action execution
- Email notifications
- Knowledge base indexing
- Webhook processing
- Scheduled reports

---

## Database

### Primary: PostgreSQL 16

**Decision**: PostgreSQL 16 with pgvector extension (hosted on Supabase)

**Hosting Options Evaluated**:

| Provider     | Pros                                                                 | Cons                                    | Recommendation  |
| ------------ | -------------------------------------------------------------------- | --------------------------------------- | --------------- |
| **Supabase** | Real-time subscriptions, built-in RLS, auth, storage, edge functions | Slight vendor coupling                  | ✅ **SELECTED** |
| Neon         | Serverless, branching, free tier                                     | No built-in real-time, missing features | ❌              |
| Railway      | Simple, good DX                                                      | Less enterprise features                | ❌              |
| AWS RDS      | Enterprise, managed                                                  | More expensive, AWS complexity          | ❌ (overkill)   |

**Final Decision**: **Supabase Pro** — Based on Devi's (AI Developer Specialist)
recommendation.

**Why Supabase over Neon (Devi's Assessment: 9/10 vs 5/10)**:

**Critical Advantages**:

1. **Real-time subscriptions via Postgres logical replication** — Essential for:
   - Agent activity feeds (live mission status)
   - Knowledge base updates
   - Goal proposal notifications
   - Live collaboration features
2. **Superior Row-Level Security (RLS)** — First-class with helper functions
3. **Integrated Storage** — S3-compatible object storage (no separate service
   needed)
4. **Edge Functions** — Deno runtime for agent webhook handlers
5. **Built-in Authentication** — Supabase Auth handles user management, OAuth,
   magic links
6. **Cost savings** — $25/mo includes auth + DB + realtime + storage (vs
   separate services)

**What we lose from Neon**:

- Database branching (not critical for our use case)
- Slightly less serverless scaling (but Supabase scales well enough)

**Migration Status**: Planned for Week 1 of development (see
`MIGRATION_PLAN_SUPABASE.md`)

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

| Option       | Pros                        | Cons                                   | Verdict         |
| ------------ | --------------------------- | -------------------------------------- | --------------- |
| **pgvector** | Same database, ACID, simple | Limited scale (but sufficient)         | ✅ **Selected** |
| Pinecone     | Purpose-built, scalable     | Cost, separate service, vendor lock-in | ❌              |
| Weaviate     | Open source, feature-rich   | Operational complexity                 | ❌              |
| Qdrant       | Open source, performant     | Separate infrastructure                | ❌              |
| ChromaDB     | Simple, Python-focused      | Less mature for production             | ❌              |

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

- Knowledge graph relationships stored as foreign keys in
  `knowledge_relationships` table
- Recursive CTEs for graph traversal (e.g., finding all prerequisites)
- JSONB for flexible metadata on relationships
- Simpler ops than running separate graph database
- Sufficient for knowledge graph scale (thousands of entries, tens of thousands
  of relationships)
- Can migrate to Neo4j if graph queries become complex (e.g., >100K
  relationships with deep traversals)

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
- Temporary action state
- API response caching

---

## Authentication & Authorization

### Provider: Supabase Auth

**Decision**: Supabase Auth for authentication and authorization

**Detailed Comparison**:

| Feature                  | Supabase Auth        | Clerk       | NextAuth    | Auth0         |
| ------------------------ | -------------------- | ----------- | ----------- | ------------- |
| **Setup Time**           | 1-2 hours            | 1 hour      | 4-8 hours   | 2-4 hours     |
| **Multi-tenant / Orgs**  | ✅ Via RLS           | ✅ Built-in | ❌ DIY      | ⚠️ Extra cost |
| **SSO (SAML/OIDC)**      | ✅ Built-in          | ✅ Built-in | ❌ DIY      | ✅ Extra cost |
| **OAuth Providers**      | ✅ 20+ providers     | ✅ Many     | ✅ Many     | ✅ Many       |
| **Magic Links**          | ✅ Built-in          | ✅ Built-in | ⚠️ Custom   | ✅            |
| **MFA**                  | ✅ TOTP, SMS         | ✅ Built-in | ⚠️ Limited  | ✅ Built-in   |
| **Row-Level Security**   | ✅ Native PostgreSQL | ❌          | ❌          | ❌            |
| **Database Integration** | ✅ Same DB           | ❌ Separate | ❌ Separate | ❌ Separate   |
| **Realtime Integration** | ✅ Built-in          | ❌          | ❌          | ❌            |
| **Cost (1K MAU)**        | Free                 | Free        | Free        | Free          |
| **Cost (10K MAU)**       | Free                 | $25/mo      | Free        | $228/mo       |
| **Cost (100K MAU)**      | $25/mo               | $250/mo     | Free        | $2,280/mo     |
| **Next.js Integration**  | ⭐⭐⭐⭐             | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐    | ⭐⭐⭐        |
| **Vendor Lock-in Risk**  | Low                  | Medium      | Low         | Medium        |

**Decision: Supabase Auth** ✅

**Rationale**:

1. **All-in-one platform**: Auth + DB + Realtime + Storage in one service
2. **Native RLS**: PostgreSQL Row-Level Security for multi-tenant isolation
3. **Cost-effective**: Free up to 50K MAU, then $25/mo (vs Clerk's $250/mo at
   100K)
4. **Database-native auth**: User table in same DB as application data
5. **JWT-based**: Standard JWT tokens work with any client
6. **OAuth providers**: Email, Google, GitHub, and 20+ more out of the box
7. **Magic links**: Passwordless auth built-in
8. **Self-hostable**: Can self-host entire Supabase stack if needed (future)

**Auth Methods Enabled**:

- Email + Password
- Google OAuth
- Magic Links (passwordless)
- MFA (TOTP via authenticator apps)

**Key Features**:

- Session management with automatic refresh
- Server-side auth via `createServerClient` (Next.js middleware)
- Client-side auth via `createBrowserClient`
- JWT tokens with user metadata
- Email verification
- Password reset flows

**Integration Pattern**:

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          request.cookies.set({ name, value, ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

// Server Component
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function Page() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookies().get(name)?.value,
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  return <div>Welcome, {user?.email}</div>;
}
```

**Row-Level Security Example**:

```sql
-- Enable RLS on missions table
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their organization's missions
CREATE POLICY "Users can access org missions" ON missions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );
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

**ESLint**: Linting (code quality) **Prettier**: Formatting (style) **Biome**:
Fast alternative for large codebase (evaluating)

---

## Version Summary

| Technology   | Version | Release Date | Notes                          |
| ------------ | ------- | ------------ | ------------------------------ |
| Next.js      | 15.x    | 2024         | Latest App Router              |
| React        | 19.x    | 2024         | Server Components              |
| TypeScript   | 5.5+    | 2024         | Strict mode                    |
| Tailwind CSS | 4.x     | 2025         | Latest features                |
| PostgreSQL   | 16      | 2023         | LTS                            |
| Drizzle ORM  | Latest  | -            | Active development             |
| Supabase     | Latest  | -            | Auth + DB + Realtime + Storage |
| pnpm         | 9.x     | 2024         | Latest                         |
| Turborepo    | 2.x     | 2024         | Vercel maintained              |

---

## Migration Path

### Phase 1 → Phase 2 (Potential Changes)

| Current            | Potential Future            | Trigger                     |
| ------------------ | --------------------------- | --------------------------- |
| Next.js API Routes | Separate FastAPI service    | Heavy ML workloads          |
| pgvector           | Pinecone / Weaviate         | 10M+ vectors                |
| Supabase Realtime  | Dedicated WebSocket service | Ultra-high concurrency      |
| Inngest            | Temporal                    | Complex workflows           |
| Supabase Auth      | Custom auth + Keycloak      | Enterprise SSO requirements |

### Abstraction Strategy

Keep abstractions thin but present:

```typescript
// Don't do this (over-abstraction)
interface IUserRepository extends IRepository<User> { ... }

// Do this (pragmatic abstraction)
// lib/auth/service.ts
import { createServerClient } from '@supabase/ssr';

export const authService = {
  async getCurrentUser() {
    const supabase = createServerClient(/* ... */);
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getOrganization(userId: string) {
    // Query organization membership via Supabase
    const { data } = await supabase
      .from('organization_memberships')
      .select('organization_id, role')
      .eq('user_id', userId)
      .single();
    return data;
  },
};
```

---

## Cost Estimation (MVP Phase)

| Service       | Free Tier            | Estimated (1K users) | Estimated (10K users) |
| ------------- | -------------------- | -------------------- | --------------------- |
| Vercel        | Hobby free           | Pro $20/mo           | Pro $20/mo            |
| Supabase      | 500MB + 50K MAU free | $0                   | Pro $25/mo            |
| Upstash Redis | 10K/day              | $0                   | $10/mo                |
| Inngest       | 25K events           | $0                   | $25/mo                |
| Sentry        | 5K errors            | $0                   | $26/mo                |
| **Total**     | -                    | **~$20/mo**          | **~$106/mo**          |

**Note**: Supabase includes auth + database + realtime + storage (replaces
Neon + Clerk + Vercel Blob). **Cost savings: ~$50/mo at 10K users vs Neon +
Clerk stack.**

---

_Document maintained by: Architecture Team_ _Next review: 2026-03-01_
