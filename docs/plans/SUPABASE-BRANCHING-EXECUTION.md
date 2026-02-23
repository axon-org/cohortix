# Supabase Branching 2.0 Execution Plan — Cohortix

**Date:** 2026-02-19 **Owner:** Platform / Backend **Scope:** Migrate from
3-project setup (dev/staging/prod) to **one Supabase project with branches**
using Branching 2.0. Integrate with Vercel (dev → staging → production), and
create a durable developer workflow.

---

## 0) Executive Summary

- **Recommendation:** **Branch off the existing production project**
  (`qobvewyakovekbuvwjkt`) rather than starting a brand-new project. Production
  is the source of truth for schema & data. The current dev project is
  `MIGRATIONS_FAILED`, so it’s unreliable. Branching from prod avoids drift and
  rework, and preserves production state.
- **Outcome:** One primary Supabase project (prod) + persistent **staging
  branch** + ephemeral preview branches for PRs. Local dev continues using
  `supabase start` (local dev DB) with migrations tracked in
  `supabase/migrations`.

---

## 1) Architecture Decision

### Option A — Branch off production (RECOMMENDED)

**Pros**

- Production schema is the authoritative source of truth.
- Branching 2.0 is designed to branch from the primary project (prod).
- No need to reconstruct or guess schema from a broken dev project.
- No data loss risk for production.

**Cons**

- Must ensure migrations folder matches prod schema before branching.

### Option B — Create a fresh new project and branch from that

**Pros**

- Clean slate.

**Cons**

- Requires full re-seeding + reapplication of prod schema; risk of drift.
- Higher operational risk and time.

**Decision:** **Use production project `qobvewyakovekbuvwjkt` as the root
branch** and create a persistent **staging branch** from it. Fix local
migrations to match prod (if needed) before enabling CI branch flow.

---

## 2) Step-by-Step Migration (CLI + Config)

> All commands below assume Supabase CLI v2.75.0 and authenticated session.

### A) Link repo to production project

```bash
cd /Users/alimai/Projects/cohortix
supabase link --project-ref qobvewyakovekbuvwjkt
```

### B) (Recommended) Align migrations with production schema

If there’s any drift between prod and `supabase/migrations/`, pull the prod
schema and reconcile.

```bash
# Create a baseline schema dump in supabase/migrations
supabase db pull --schema public
```

- If this generates a new migration, validate it doesn’t conflict with existing
  `20260211...20260218` migrations.
- If conflicts exist, consider **squashing migrations** into a single baseline
  migration and re-applying future migrations on top.

### C) Create a persistent staging branch from production

```bash
# Create branch named "staging" off prod
supabase branches create staging --project-ref qobvewyakovekbuvwjkt
```

### D) (Optional) Create preview branches for PRs

Preview branches can be created on-demand in CI when PRs open:

```bash
supabase branches create pr-123 --project-ref qobvewyakovekbuvwjkt
```

### E) Push migrations to staging branch

```bash
# Apply migrations to staging branch
supabase db push --project-ref qobvewyakovekbuvwjkt --branch staging
```

### F) Validate staging branch health

```bash
# Check current branch status
supabase branches list --project-ref qobvewyakovekbuvwjkt
```

---

## 3) `supabase/config.toml` (Full File)

> Place at `/Users/alimai/Projects/cohortix/supabase/config.toml`

```toml
# supabase/config.toml
# Cohortix — Supabase Branching 2.0 config

[project]
# Primary project (production)
# NOTE: this is the "root" project for branches
ref = "qobvewyakovekbuvwjkt"

[db]
# Local dev settings
# These are for `supabase start` (local docker)
port = 54322
schema = "public"

[auth]
# Local dev only; Vercel uses Supabase project keys
site_url = "http://localhost:3000"
additional_redirect_urls = [
  "http://localhost:3000/auth/callback",
  "https://staging.cohortix.com/auth/callback",
  "https://cohortix.com/auth/callback"
]

[studio]
port = 54323

# Optional: storage, edge functions, etc.
[storage]
# Example
# file_size_limit = "50MB"

[functions]
# NOTE: Branching 2.0 currently overwrites functions on pull
# Keep functions in version control as the source of truth
```

> **Note:** Supabase CLI Branching 2.0 uses `--branch` flags rather than
> separate config blocks. The `project.ref` remains the primary (prod) project.

---

## 4) Environment Variable Changes

### A) Local `.env.local`

Point local dev to local Supabase (`supabase start`) or to a branch if needed.

```env
# Local dev (recommended): use local Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon key>
SUPABASE_SERVICE_ROLE_KEY=<local service role>

# If you need to point local to staging branch instead:
# NEXT_PUBLIC_SUPABASE_URL=https://<branch-ref>.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<branch anon>
# SUPABASE_SERVICE_ROLE_KEY=<branch service role>
```

### B) Vercel Staging Env Vars

Update staging env vars to target **staging branch** instead of the old staging
project.

```env
NEXT_PUBLIC_SUPABASE_URL=https://<staging-branch-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-branch-anon>
SUPABASE_SERVICE_ROLE_KEY=<staging-branch-service>
```

> You’ll retrieve `<staging-branch-ref>` from `supabase branches list`.

### C) Vercel Production Env Vars

Remain pointing to production project (root):

```env
NEXT_PUBLIC_SUPABASE_URL=https://qobvewyakovekbuvwjkt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod anon>
SUPABASE_SERVICE_ROLE_KEY=<prod service>
```

### D) GitHub Actions

For previews, create ephemeral branches (optional). Example snippet:

```yaml
- name: Create Supabase branch
  run: |
    supabase branches create pr-${{ github.event.number }} --project-ref qobvewyakovekbuvwjkt

- name: Apply migrations to PR branch
  run: |
    supabase db push --project-ref qobvewyakovekbuvwjkt --branch pr-${{ github.event.number }}
```

Then inject the branch’s URL + anon key into preview deployment envs.

---

## 5) Developer Workflow (Local → Staging → Prod)

1. **Local development**
   - Run `supabase start` to spin local DB
   - Add migrations via `supabase migration new <name>`
   - Apply locagent: `supabase db push`

2. **Push to `dev` branch (staging)**
   - CI runs `supabase db push --branch staging`
   - Vercel staging uses staging branch URL/keys

3. **Promote to production (`main`)**
   - Merge to `main`
   - CI runs `supabase db push` (no branch flag = prod)
   - Production Vercel uses prod URL/keys

4. **PR previews (optional)**
   - CI creates ephemeral branch per PR
   - Apply migrations to that branch
   - Destroy branch on PR close

---

## 6) Rollback Plan (Back to 3 Projects)

1. **Keep old dev + staging projects alive for 2–3 weeks.**
2. If branching fails:
   - Re-point Vercel env vars to original staging project
     `lrgjattslacqfhmqexoe`.
   - Restore `.env.local` to dev project `rfwscvklcokzuofyzqwx`.
   - Stop using `--branch` in CI; push migrations directly to dev/staging/prod
     projects as before.
3. **Backup:** Export migrations and schema snapshots before switching.

---

## 7) Risks & Gotchas (Branching 2.0)

- **Branching 2.0 is still beta** — use with caution.
- **No branch-to-branch merge**; only “rebase” by re-applying migrations.
- **Functions are overwritten on pull**; keep functions in Git as source of
  truth.
- **Branch resources** cost money; clean up ephemeral branches.
- **Branch schema may drift** if migrations are not applied consistently.
- **Prod data is NOT cloned** by default; branches are schema-only unless
  configured.

---

## 8) Timeline to Retire Old Projects

**Week 0 (Now)**

- Create staging branch off prod
- Update Vercel staging envs → staging branch
- Keep old staging project alive

**Week 1**

- Validate staging branch stability
- Run full QA on staging branch

**Week 2**

- If stable, freeze old staging project and stop writes

**Week 3–4**

- Decommission old dev + staging projects

---

## 9) References

- Supabase Branching 2.0 docs:
  https://supabase.com/docs/guides/platform/branching
- Supabase CLI: https://supabase.com/docs/reference/cli

---

## Next Actions (Immediate)

1. Run `supabase link --project-ref qobvewyakovekbuvwjkt`
2. Create staging branch:
   `supabase branches create staging --project-ref qobvewyakovekbuvwjkt`
3. Update Vercel staging env vars to the new branch
4. Test staging deployment + migrations
