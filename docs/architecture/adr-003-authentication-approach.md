# ADR-003: Supabase Auth with Multi-Tenant Row-Level Security

**Status:** Accepted  
**Date:** 2026-02-11  
**Author:** PM (Codex Compliance Initiative)  
**Reviewers:** Ahmad Ashfaq, Devi (ai-developer), Hafiz (guardian)  
**Related ADRs:** ADR-001 (Tech Stack), ADR-004 (Multi-Tenant Architecture -
future)

---

## Context

**What is the problem or situation that requires a decision?**

Cohortix is a multi-tenant SaaS application requiring:

- **User authentication:** Email/password + social OAuth (GitHub, Google)
- **Multi-tenant isolation:** Users in org A cannot access org B's data
- **Session management:** Secure, persistent sessions across devices
- **Authorization:** Role-based access control (Owner, Admin, Member)
- **Security:** Protection against common auth vulnerabilities (CSRF, XSS,
  session hijacking)
- **Developer experience:** Simple API, minimal boilerplate, TypeScript support

**Constraints:**

- Must integrate seamlessly with PostgreSQL database (same platform preferred)
- Must enforce tenant isolation at database level (not just application logic)
- Must support OAuth providers without complex setup
- Must work with Next.js App Router (Server Components + Server Actions)
- Budget-conscious (prefer included auth vs. separate service)

**Assumptions:**

- Row-Level Security (RLS) is sufficient for tenant isolation (vs.
  schema-per-tenant)
- Supabase Auth is production-ready and secure
- Social OAuth is critical for UX (reduce signup friction)

---

## Decision

**We will use Supabase Auth with PostgreSQL Row-Level Security (RLS) for
multi-tenant isolation.**

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                     USER REQUEST                             │
│  (Browser · Mobile · API Client)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                 SUPABASE AUTH LAYER                          │
│  • JWT token generation/validation                           │
│  • OAuth provider integration (GitHub, Google)               │
│  • Session management (refresh tokens)                       │
│  • Password hashing (bcrypt)                                 │
└────────────────────────┬────────────────────────────────────┘
                         │ (Sets auth.uid() in PostgreSQL)
                         │
┌────────────────────────▼────────────────────────────────────┐
│              NEXT.JS MIDDLEWARE                              │
│  • Verify session on every request                           │
│  • Redirect unauthenticated users to /sign-in                │
│  • Set user context for Server Components                    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              POSTGRESQL ROW-LEVEL SECURITY                   │
│                                                              │
│  CREATE POLICY tenant_isolation ON missions                 │
│    USING (                                                   │
│      organization_id IN (                                    │
│        SELECT organization_id FROM organization_memberships  │
│        WHERE user_id = auth.uid()                            │
│      )                                                       │
│    );                                                        │
│                                                              │
│  → Every query automatically filtered by user's org(s)       │
└──────────────────────────────────────────────────────────────┘
```

**Key Components:**

1. **Supabase Auth:** Manages user accounts, sessions, OAuth flows
2. **JWT tokens:** Secure, stateless authentication (stored in HTTP-only
   cookies)
3. **RLS policies:** Enforce tenant isolation at database level (cannot be
   bypassed by application bugs)
4. **organization_memberships table:** Maps users to organizations with roles

**Rationale:**

1. **Database-level isolation:** RLS policies run in PostgreSQL (cannot be
   bypassed by application logic errors). Even if an API bug exposes data, RLS
   prevents cross-tenant leaks.

2. **Zero-config OAuth:** Supabase Auth includes GitHub/Google OAuth with
   minimal setup (no need to manage OAuth apps separately).

3. **Unified platform:** Auth + database in one service (Supabase). Simpler than
   Clerk (auth) + Neon (database).

4. **Next.js integration:** Supabase provides official Next.js SDK with Server
   Components support.

5. **Security best practices:** Supabase handles password hashing, CSRF
   protection, secure session storage, rate limiting.

---

## Options Considered

### Option 1: Clerk + Neon + Application-Level Isolation

**Pros:**

- Clerk has beautiful pre-built UI components
- Excellent developer experience (webhooks, user management dashboard)
- Neon provides top-tier PostgreSQL performance

**Cons:**

- **No database-level isolation:** Must implement tenant filtering in every
  query (bug-prone)
- **Two services to integrate:** Clerk for auth, Neon for database (more
  complexity)
- **Higher cost:** $20/mo Clerk + $19/mo Neon = $39/mo (vs. $25/mo Supabase)
- **User ID sync:** Must sync Clerk user IDs to database (webhook complexity)

**Why not chosen:**  
Lack of database-level isolation is a critical security risk. Application bugs
could leak data across tenants.

---

### Option 2: NextAuth.js (Auth.js) + Neon + Application-Level Isolation

**Pros:**

- Open-source, no vendor lock-in
- Highly customizable
- Good Next.js integration

**Cons:**

- **Requires self-management:** Must handle password hashing, session storage,
  OAuth setup
- **No database-level isolation:** Same risk as Option 1
- **More boilerplate:** Must set up OAuth apps manually for each provider
- **Email sending:** Must integrate separate email service (Resend, SendGrid)

**Why not chosen:**  
Too much operational overhead for a startup. Supabase Auth provides the same
features with less code.

---

### Option 3: Supabase Auth + RLS ✅ **SELECTED**

**Pros:**

- **Database-level isolation:** RLS policies enforce tenant boundaries in
  PostgreSQL (cannot be bypassed)
- **Unified platform:** Auth + database + realtime in one service ($25/mo)
- **Zero-config OAuth:** GitHub/Google OAuth works out of the box
- **Security by default:** Password hashing, CSRF protection, rate limiting
  included
- **Next.js SDK:** Official library with Server Components support
- **Magic links:** Passwordless auth for better UX

**Cons:**

- **Vendor lock-in:** Supabase-specific auth API (harder to migrate than
  NextAuth)
- **UI not included:** Must build own sign-in/sign-up forms (vs. Clerk's
  pre-built components)
- **RLS complexity:** Policies can be tricky to debug if written incorrectly

**Why chosen:**  
Database-level isolation is a hard requirement for multi-tenant SaaS. Supabase
is the only option that provides auth + RLS in one platform. Cost savings ($39
vs. $25/mo) is a bonus.

---

## Consequences

### Positive Consequences

- ✅ **Maximum security:** RLS enforces tenant isolation at database level
  (cannot be bypassed)
- ✅ **Zero-trust architecture:** Application bugs cannot leak data across
  tenants
- ✅ **Simple API:** `auth.getUser()` returns current user, RLS filters queries
  automatically
- ✅ **OAuth included:** GitHub/Google OAuth with zero setup
- ✅ **Cost-effective:** Auth + DB + realtime for $25/mo
- ✅ **Audit trail:** Supabase logs all auth events (sign-in, sign-up, password
  resets)

### Negative Consequences

- ❌ **Vendor lock-in:** Supabase-specific auth API (migration would require
  rewriting auth logic)
- ❌ **RLS debugging:** Policy errors can be cryptic (must check PostgreSQL
  logs)
- ❌ **UI development:** Must build auth UI ourselves (vs. Clerk's drop-in
  components)

### Mitigation Strategies

- **Vendor lock-in:** Abstract auth behind interface (see implementation below).
  PostgreSQL RLS is standard SQL (portable to any PostgreSQL provider).
- **RLS debugging:** Document RLS policies in `docs/DATABASE_SCHEMA.md`. Add
  unit tests for policies (`pnpm db:test-rls`).
- **UI development:** Use shadcn/ui components for consistent design. Auth forms
  are ~200 lines total (manageable).

---

## Implementation

### Action Items

- [x] Set up Supabase project + enable auth
- [x] Configure OAuth providers (GitHub, Google)
- [x] Create auth tables (organization_memberships, roles)
- [x] Write RLS policies for all tables with organization_id
- [x] Build auth UI (sign-in, sign-up, password reset)
- [x] Set up Next.js middleware for auth verification
- [x] Test RLS policies (verify cross-tenant isolation)
- [x] Document auth flows in CLAUDE.md

**Owner:** Devi (ai-developer)  
**Completed:** February 10, 2026

### Validation Criteria

- [x] Users can sign in with email/password
- [x] Users can sign in with GitHub/Google OAuth
- [x] RLS policies prevent cross-tenant data access (tested with 2 orgs)
- [x] Session persists across page refreshes
- [x] Unauthenticated users redirected to /sign-in
- [x] Password reset flow works end-to-end

**Review Date:** 2026-05-01 (After 3 months of production use)

---

## RLS Policy Examples

**Tenant Isolation Policy:**

```sql
-- All users can only see data from their own organization(s)
CREATE POLICY tenant_isolation ON missions
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );
```

**Role-Based Access Control:**

```sql
-- Only admins and owners can delete missions
CREATE POLICY admin_delete ON missions
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_memberships
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );
```

**User-Level Isolation:**

```sql
-- Users can only see their own profile
CREATE POLICY own_profile ON user_profiles
  FOR ALL
  USING (user_id = auth.uid());
```

---

## Auth Abstraction Layer

To reduce vendor lock-in, we abstract Supabase auth behind an interface:

```typescript
// lib/auth/interface.ts
export interface AuthProvider {
  getUser(): Promise<User | null>;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  signInWithOAuth(provider: 'github' | 'google'): Promise<void>;
}

// lib/auth/supabase.ts (current implementation)
export class SupabaseAuth implements AuthProvider {
  async getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }
  // ... other methods
}

// Usage in app
import { auth } from '@/lib/auth';
const user = await auth.getUser(); // Works with any provider
```

**Migration path:** If we move away from Supabase, we only need to implement a
new `AuthProvider` class. Application code using the interface remains
unchanged.

---

## References

**Supporting Documents:**

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

**Related Work:**

- ADR-001: Tech stack selection (Supabase chosen)
- `docs/DATABASE_SCHEMA.md` — RLS policies documentation
- `docs/SECURITY.md` — Security architecture

---

## Status History

| Date       | Status     | Notes                                                 |
| ---------- | ---------- | ----------------------------------------------------- |
| 2026-02-05 | Proposed   | Chosen during tech stack selection                    |
| 2026-02-10 | Accepted   | Implemented and tested by Devi                        |
| 2026-02-11 | Documented | Formalized as ADR-003 during Codex compliance rollout |

---

## Notes

**Alternative: Schema-Per-Tenant**

We considered schema-per-tenant isolation (each org gets its own PostgreSQL
schema). Rejected because:

- **Operational complexity:** Creating/managing thousands of schemas
- **Migration challenges:** Must run migrations on every schema
- **Connection pooling:** Need separate pool per schema
- **PostgreSQL limits:** 100-1000 schemas per database (scalability concern)

**RLS is sufficient** for our use case. If we need stronger isolation later, we
can move to schema-per-tenant or database-per-tenant.

**Security Audits:**

We will conduct quarterly security audits including:

- RLS policy review (ensure no gaps)
- Penetration testing (attempt cross-tenant data access)
- Supabase security updates (monitor CVEs)

---

_This ADR follows the Axon Codex v1.2 ADR Standards (§5.1.3)._
