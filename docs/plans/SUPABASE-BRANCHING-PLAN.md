# Supabase Branching Plan (Assessment)

**Status:** Plan only — DO NOT execute until Ahmad approves.

---

## 1) Current State (from repo + envs)

- **Production Supabase project ref:** `qobvewyakovekbuvwjkt`  
  (from Vercel Production env + `.env.production.example`)
- **Staging Supabase project ref:** `lrgjattslacqfhmqexoe`  
  (from Vercel Preview env + `.env.staging.example`)
- **Local dev:** uses `.env.local` with developer‑specific project ref (not
  committed)
- **Supabase config file:** `supabase/config.toml` **not present** (only
  `supabase/migrations/` exists)

**Implication:** currently multiple Supabase projects (prod + staging). This
does **not** use branching today.

---

## 2) Goal

Move to **Supabase Branching 2.0** on a **single project** to provide:

- Persistent **staging branch** (mapped to `dev` git branch)
- Ephemeral PR branches for preview deployments
- Single source of truth for schemas, policies, and migrations

---

## 3) Can Branching Be Enabled via CLI?

**Yes — CLI supports branching (Supabase Branching 2.0).** From Supabase docs,
you can:

- Link a project: `supabase link --project-ref <ref>`
- Create branches: `supabase branches create <branch-name>`
- List branches: `supabase branches list`

Branching availability still depends on Supabase org/project plan + enablement
in dashboard.

**Key CLI commands (from docs):**

```bash
supabase login
supabase link --project-ref <prod-project-ref>

# persistent staging branch
supabase branches create staging --persistent --project-ref <prod-project-ref>

# list branch project IDs
supabase branches list
```

---

## 4) Proposed Migration Steps (Plan)

### A) Prep

1. **Update Supabase CLI** to latest.
2. **Confirm branching availability** in Supabase dashboard for the prod
   project.
3. Add `supabase/config.toml` (if required) to manage branching remotes and seed
   config.

### B) Create Branches

1. Link CLI to **production project**:
   ```bash
   supabase link --project-ref qobvewyakovekbuvwjkt
   ```
2. Create **persistent staging branch**:
   ```bash
   supabase branches create staging --persistent --project-ref qobvewyakovekbuvwjkt
   ```
3. Record the **branch project ID** from `supabase branches list`.

### C) Update Environments

1. **Vercel staging/preview env vars** should point to the staging branch
   project:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`
2. **Production env vars** remain on the prod project.
3. **Local dev** can either:
   - Use its own branch project, or
   - Use Supabase local via `supabase start` (if adopted).

### D) Migrations + Data

- Use `supabase db push` to apply migrations to branches.
- Decide whether to clone **production data** into staging (`--with-data`) or
  keep seed‑only.

### E) Decommission Old Staging Project

- After 1–2 stable release cycles, retire the current staging project
  (`lrgjatts...`).

---

## 5) Risks / Constraints

- **Branching is still evolving:** toolchain may change; some features are beta.
- **Resource parity:** storage buckets, edge functions, or custom roles may not
  fully replicate.
- **Data drift:** long‑lived branches can diverge; require disciplined migration
  flow.
- **Costs:** branching may increase usage; confirm billing impact.

---

## 6) Open Questions

- Is Supabase Branching enabled for the org plan?
- Do we want to clone prod data into staging?
- Should staging be persistent or rebuilt periodically?

---

## 7) Next Actions (Await Ahmad)

- Confirm branching availability and cost.
- Decide on data strategy (`--with-data` or seed‑only).
- Approve creating a persistent `staging` branch.
