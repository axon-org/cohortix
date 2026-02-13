# Supabase Migration Plan — Neon → Supabase

**Created:** 2026-02-10  
**Status:** Planning → Ready for Execution  
**Estimated Time:** 4-6 hours  
**Risk Level:** Low (no data to migrate yet)

---

## 🎯 Why We're Migrating

**Devi's Assessment:** 5/10 (Neon) → 9/10 (Supabase)

### Critical Advantages for Cohortix
1. **Real-time subscriptions** — Built-in via PostgreSQL logical replication
   - Agent activity feeds (live mission status)
   - Knowledge base updates
   - Goal proposals and approvals
2. **Superior RLS** — First-class row-level security with helper functions
3. **Integrated auth** — Can keep Clerk OR migrate to Supabase Auth later
4. **Edge Functions** — Deno runtime for agent webhook handlers
5. **Cost savings** — $25/mo vs $69/mo (Neon)

---

## 📋 Migration Checklist

### Phase 1: Setup Supabase Project
- [ ] Create Supabase project (use existing account Ahmad mentioned)
- [ ] Configure database region (closest to majority users)
- [ ] Enable pgvector extension
- [ ] Set up connection pooling (PgBouncer)
- [ ] Configure backup schedule

### Phase 2: Schema Migration
- [ ] Export current Drizzle schema
- [ ] Run Drizzle migrations on Supabase
- [ ] Add Supabase-specific RLS policies
- [ ] Test schema with sample data
- [ ] Verify vector search works (pgvector)

### Phase 3: Auth Integration (Clerk + Supabase)
- [ ] Configure Clerk JWT template for Supabase
- [ ] Add Supabase JWT verification in Clerk
- [ ] Create RLS policies that accept Clerk JWTs
- [ ] Test auth flow (sign in → database access)
- [ ] Document auth architecture

### Phase 4: Real-time Setup
- [ ] Enable real-time on critical tables:
  - `agent_activities`
  - `missions`
  - `knowledge_entries`
  - `goal_proposals`
- [ ] Configure publication rules
- [ ] Test subscriptions from client
- [ ] Add real-time error handling

### Phase 5: Environment Variables Update
- [ ] Update `.env` with Supabase credentials
- [ ] Update Vercel environment variables
- [ ] Update CI/CD secrets
- [ ] Document new env vars

### Phase 6: Testing & Validation
- [ ] Run full test suite
- [ ] Test agent data flows
- [ ] Test real-time subscriptions
- [ ] Load testing (simulate 100 concurrent users)
- [ ] Security audit (RLS policies)

### Phase 7: Deployment
- [ ] Deploy to staging first
- [ ] Smoke test all features
- [ ] Deploy to production
- [ ] Monitor for 24 hours
- [ ] Document any issues

---

## 🔐 Credentials Needed

**From Ahmad:**
1. **Supabase Account Access**
   - Project URL (or create new project)
   - Service role key (for migrations)
   - Anon key (for client)
2. **Vercel Access** (if not already available)
   - Deployment permissions
   - Environment variable write access

---

## 🛠️ Technical Implementation

### 1. Drizzle + Supabase Connection

**Update database connection:**
```typescript
// lib/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

// Connection pooling for edge/serverless
export const sql = postgres(connectionString, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sql);
```

**Environment variables:**
```bash
# .env.local
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-key]
```

### 2. Clerk + Supabase Auth Integration

**Configure Clerk JWT template:**
```json
{
  "aud": "authenticated",
  "exp": "{{token.exp}}",
  "iat": "{{token.iat}}",
  "iss": "{{token.iss}}",
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "authenticated",
  "app_metadata": {
    "provider": "clerk"
  }
}
```

**Supabase RLS policy (accepts Clerk JWTs):**
```sql
-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their org's agents
CREATE POLICY "Users can read own org agents"
ON agents
FOR SELECT
USING (
  auth.jwt()->>'org_id' = organization_id::text
);

-- Policy: Users can insert agents if they're org owner
CREATE POLICY "Org owners can create agents"
ON agents
FOR INSERT
WITH CHECK (
  auth.jwt()->>'org_id' = organization_id::text
  AND auth.jwt()->>'role' = 'owner'
);
```

### 3. Real-time Subscriptions

**Client-side subscription:**
```typescript
// hooks/useAgentActivity.ts
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export function useAgentActivity(agentId: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`agent_${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_activities',
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          setActivities((prev) => [payload.new as Activity, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  return activities;
}
```

### 4. RLS Helper Functions

**Supabase migration (add to schema):**
```sql
-- Function: Get current user's org_id from JWT
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt()->>'org_id',
    ''
  );
$$;

-- Function: Check if user is org owner
CREATE OR REPLACE FUNCTION auth.is_org_owner()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt()->>'role' = 'owner',
    false
  );
$$;
```

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Database connection
- [ ] RLS policies (test with different user roles)
- [ ] Real-time subscription setup

### Integration Tests
- [ ] Full auth flow (Clerk → Supabase)
- [ ] Agent CRUD operations
- [ ] Knowledge base operations
- [ ] Real-time updates end-to-end

### Load Tests
- [ ] 100 concurrent users reading agent activities
- [ ] 50 simultaneous real-time subscriptions
- [ ] Vector search performance (pgvector)

---

## 📊 Success Metrics

**Must Pass Before Production:**
1. **RLS works** — No cross-org data leakage
2. **Real-time works** — <100ms latency for updates
3. **Auth works** — Clerk JWTs validated correctly
4. **Performance** — Query times <50ms for typical reads
5. **Cost** — Within $25/mo Supabase Pro plan

---

## 🚨 Rollback Plan

If something goes catastrophically wrong:

1. **Keep Neon connection active** during migration
2. **Switch environment variable** back to Neon URL
3. **Redeploy previous commit**
4. **Document what failed** for retry

**Risk Assessment:** Very low — we have no production data yet.

---

## 📚 Documentation Updates Required

After migration:
- [ ] Update `docs/TECH_STACK.md` (Neon → Supabase)
- [ ] Update `docs/ARCHITECTURE.md` (real-time architecture)
- [ ] Update `README.md` (setup instructions)
- [ ] Create `docs/SUPABASE_SETUP.md` (for new devs)
- [ ] Update `.env.example` (new variables)

---

## ⏱️ Timeline

**Total: 4-6 hours**

| Phase | Time | Owner |
|-------|------|-------|
| Supabase project setup | 30 min | Alim |
| Schema migration | 1 hour | Alim |
| Clerk integration | 1 hour | Alim |
| Real-time setup | 1 hour | Alim |
| Testing | 1-2 hours | Alim + Ahmad |
| Deployment | 30 min | Alim |
| Monitoring | 24 hours | Alim |

---

## 🎬 Next Steps

**What I need from Ahmad:**
1. ✅ Supabase project URL (or permission to create new project)
2. ✅ Supabase service role key
3. ✅ Vercel environment variable access

**Once I have these, I will:**
1. Execute Phases 1-6 in sequence
2. Update all documentation
3. Report completion in #cohortix-dev channel

**Ready to proceed?** Just give me the credentials and I'll start immediately.

---

**Questions? Concerns? Push back?** — Let me know now before we commit.
