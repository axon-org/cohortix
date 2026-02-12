# Clerk + Supabase Integration Guide

**Purpose:** Configure Clerk to work seamlessly with Supabase RLS policies

**Status:** Implementation guide ready for migration

---

## 🔑 Architecture Overview

```
User Sign In (Clerk)
       ↓
Clerk generates JWT with custom claims
       ↓
JWT sent to Supabase client
       ↓
Supabase validates JWT signature
       ↓
RLS policies check JWT claims (org_id, role)
       ↓
Database query executes with tenant isolation
```

---

## 🛠️ Step 1: Configure Clerk JWT Template

### Create Supabase JWT Template in Clerk

1. Go to Clerk Dashboard → **JWT Templates**
2. Click **New Template** → Choose "Supabase"
3. Configure the template:

```json
{
  "aud": "authenticated",
  "exp": "{{token.exp}}",
  "iat": "{{token.iat}}",
  "iss": "{{token.iss}}",
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "authenticated",
  "user_metadata": {
    "org_id": "{{org.id}}",
    "org_role": "{{org.role}}",
    "org_slug": "{{org.slug}}"
  },
  "app_metadata": {
    "provider": "clerk",
    "claims_admin": "{{user.public_metadata.is_admin}}"
  }
}
```

4. Copy the **JWT Template Name** (e.g., `supabase`)

---

## 🛠️ Step 2: Configure Supabase

### Add Clerk as JWT Issuer

1. Go to Supabase Dashboard → **Project Settings** → **Authentication**
2. Scroll to **JWT Settings**
3. Add Clerk's **JWKS URL**:
   ```
   https://[YOUR_CLERK_DOMAIN]/.well-known/jwks.json
   ```
   Example: `https://prepared-squirrel-12.clerk.accounts.dev/.well-known/jwks.json`

4. Set **JWT Secret** → Use "Custom JWT Secret" mode
5. Paste your Clerk **Publishable Key** as the issuer

---

## 🛠️ Step 3: Update Client Code

### Install Supabase Client

```bash
pnpm add @supabase/supabase-js
```

### Create Supabase Client with Clerk JWT

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';

export function useSupabaseClient() {
  const { getToken } = useAuth();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: async () => {
        const token = await getToken({ template: 'supabase' });
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    },
  });
}
```

### Usage in Components

```typescript
// app/dashboard/page.tsx
'use client';

import { useSupabaseClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const supabase = useSupabaseClient();
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    async function loadAgents() {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setAgents(data);
    }

    loadAgents();
  }, [supabase]);

  return (
    <div>
      <h1>Your Agents</h1>
      {/* Render agents */}
    </div>
  );
}
```

---

## 🛠️ Step 4: Create RLS Policies

### Helper Functions (Run Once in Supabase SQL Editor)

```sql
-- Function: Extract org_id from Clerk JWT
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'org_id',
    ''
  );
$$;

-- Function: Extract org_role from Clerk JWT
CREATE OR REPLACE FUNCTION auth.user_org_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'org_role',
    'member'
  );
$$;

-- Function: Check if user is org owner
CREATE OR REPLACE FUNCTION auth.is_org_owner()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT auth.user_org_role() = 'admin';
$$;

-- Function: Check if user is org admin or owner
CREATE OR REPLACE FUNCTION auth.is_org_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT auth.user_org_role() IN ('admin', 'basic_member');
$$;
```

### Example RLS Policies

```sql
-- Enable RLS on agents table
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read agents from their organization
CREATE POLICY "Users can read own org agents"
ON agents
FOR SELECT
USING (
  organization_id = auth.user_org_id()::uuid
);

-- Policy: Only org owners can create agents
CREATE POLICY "Org owners can create agents"
ON agents
FOR INSERT
WITH CHECK (
  organization_id = auth.user_org_id()::uuid
  AND auth.is_org_owner()
);

-- Policy: Org admins can update agents
CREATE POLICY "Org admins can update agents"
ON agents
FOR UPDATE
USING (
  organization_id = auth.user_org_id()::uuid
  AND auth.is_org_admin()
);

-- Policy: Only org owners can delete agents
CREATE POLICY "Org owners can delete agents"
ON agents
FOR DELETE
USING (
  organization_id = auth.user_org_id()::uuid
  AND auth.is_org_owner()
);
```

---

## 🛠️ Step 5: Test Auth Flow

### Manual Testing Checklist

- [ ] Sign in with Clerk
- [ ] Inspect JWT (use jwt.io to decode)
- [ ] Verify `user_metadata.org_id` is present
- [ ] Verify `user_metadata.org_role` is correct
- [ ] Query Supabase from client
- [ ] Verify RLS filters results by org
- [ ] Test with different org roles (owner, admin, member)
- [ ] Test cross-org access (should fail)

### Automated Tests

```typescript
// __tests__/auth/rls.test.ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('RLS Policies', () => {
  it('should only show agents from user org', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${TEST_USER_JWT}`,
          },
        },
      }
    );

    const { data } = await supabase.from('agents').select('*');

    // All agents should belong to test user's org
    expect(data?.every(agent => agent.organization_id === TEST_ORG_ID)).toBe(true);
  });

  it('should prevent creating agents for other orgs', async () => {
    const { error } = await supabase.from('agents').insert({
      organization_id: 'other-org-id', // Different org
      name: 'Malicious Agent',
    });

    expect(error).toBeTruthy();
    expect(error?.code).toBe('42501'); // Insufficient privilege
  });
});
```

---

## 🔐 Security Considerations

### ✅ Do's

1. **Always validate JWT on server** — Never trust client
2. **Use RLS for ALL tables** — No exceptions for tenant data
3. **Test cross-org access** — Ensure isolation
4. **Monitor failed auth attempts** — Could indicate attack
5. **Use service role key only server-side** — Never expose to client

### ❌ Don'ts

1. **Never bypass RLS with service key in client** — Security disaster
2. **Don't trust `org_id` from client** — Always get from JWT
3. **Don't hard-code org_id in queries** — Use `auth.user_org_id()`
4. **Don't skip RLS on "admin-only" tables** — Still need isolation

---

## 🐛 Troubleshooting

### Issue: "No rows returned" (but data exists)

**Cause:** JWT not being sent to Supabase

**Fix:**
1. Check JWT template name matches in client code
2. Verify `getToken({ template: 'supabase' })` is correct
3. Inspect network request — `Authorization` header should be present

### Issue: "Row-level security policy violation"

**Cause:** User doesn't have access OR JWT claims missing

**Fix:**
1. Decode JWT (jwt.io) — check `user_metadata.org_id`
2. Verify RLS policy logic — test with SQL:
   ```sql
   SELECT auth.user_org_id(); -- Should return user's org_id
   ```
3. Check if user actually belongs to the org in Clerk

### Issue: "JWT expired"

**Cause:** Clerk JWT has default 60s expiry

**Fix:**
1. Go to Clerk Dashboard → **JWT Templates** → Edit template
2. Set **Lifetime** to `3600` (1 hour) or longer
3. Client will auto-refresh via `@clerk/nextjs`

### Issue: Real-time subscriptions not working

**Cause:** JWT not configured for Supabase Realtime

**Fix:**
1. Verify JWT is passed when creating channel:
   ```typescript
   const channel = supabase
     .channel('agents')
     .on('postgres_changes', { ... }, (payload) => { ... })
     .subscribe((status) => {
       console.log('Subscription status:', status);
     });
   ```
2. Check Supabase logs for auth errors

---

## 📚 References

- [Clerk JWT Templates Docs](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [Supabase Auth with Third-Party Providers](https://supabase.com/docs/guides/auth/social-login/auth-third-party)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Created:** 2026-02-10  
**Last Updated:** 2026-02-10  
**Maintained by:** Alim (CEO Agent)
