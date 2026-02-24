# ENVIRONMENT PLAN REVIEW — Cohortix

**Date:** 2026-02-19 **Reviewer:** ai-developer (subagent)

This review audits `/docs/plans/ENVIRONMENT-AUDIT-AND-FIX-PLAN.md` against repo
reality and known vendor constraints. Each area includes a verdict and
actionable recommendations.

---

## 1) Clerk Consolidation Risks

**Verdict: ⚠️ Needs Adjustment**

**Why:** Clerk apps are **not mergeable**; each app is a hard boundary for user
data, sessions, webhooks, OAuth configs, and instance-specific secrets. The plan
assumes a smooth consolidation without a migration path for existing users.

**Recommendations:**

- **Define an explicit user migration strategy** before decommissioning apps:
  - **Option A (hard cutover + re-auth):** Stand up the new single app (Dev+Prod
    instances), switch frontend keys, and **require users to re-auth**. Notify
    users, expect session loss. Fastest but breaking.
  - **Option B (soft migration):** Keep legacy apps running, **migrate users
    progressively** into the new app using Clerk Backend API. For password
    users, you **cannot import hashed passwords** (Clerk doesn’t accept hashes),
    so require **password reset** or **magic link** re-auth. For OAuth users,
    they must re-consent/sign-in on the new app.
  - **Option C (parallel apps):** Maintain multiple apps indefinitely if user
    migration risk is too high (least ideal).
- **Breakage points to document and plan for:**
  - **Webhook signing secrets** will change per app/instance — backend
    verification must be updated atomicagent.
  - **OAuth callback URLs** must be re-registered for the new Clerk
    app/instance.
  - **JWT/JWKS** endpoints and **session cookies** will change; all active
    sessions will be invalid.
  - **Domain allowlist / authorizedParties** must be updated when moving between
    apps/instances.
- **Add a migration checklist:** export user IDs from legacy apps, map to
  internal `user_id` in DB, plan for re-linking profile records, test
  webhook/event flows in staging.
- **Do NOT decommission old apps** until user login metrics show stable
  migration and webhook processing is verified.

---

## 2) Supabase Branching Readiness

**Verdict: ⚠️ Needs Adjustment**

**Why:** Branching 2.0 is still beta with known limitations: merges only into
main, schema/migration conflicts require manual resolution, feature gaps exist
for some resources. Risk depends on team tolerance.

**Recommendations:**

- **Treat branching as an opt-in, not mandatory** for production right now.
- **Safer fallback:** keep **prod + staging** as separate projects, and
  optionally use branching **only for previews**. This minimizes blast radius if
  branching tooling fails.
- If adopting branching now:
  - Start with **staging branch only** (persistent). Avoid auto-branch previews
    until stable.
  - Keep a **rollback path**: retain existing staging project for at least one
    release cycle.
  - Ensure all DB migrations are **idempotent** and maintain a **manual conflict
    resolution playbook**.
- Add clarity on **edge functions, storage buckets, auth settings** parity
  across branches if used.

---

## 3) Vercel Custom Staging Environment

**Verdict: ⚠️ Needs Adjustment**

**Why:** Repo does not indicate Vercel plan level; Pro plan is required for
custom environments. Workflows currently assume staging == Preview and manually
alias to `staging.cohortix.ai`.

**Findings from repo:**

- `.vercel/project.json` has no plan info.
- `deploy-staging.yml` uses `vercel pull --environment=preview` and manual
  aliasing.
- `preview.yml` also uses preview env and assumes preview keys.

**Recommendations:**

- **Verify plan in Vercel UI** (Billing → Plan). If not Pro, plan upgrade is
  required before custom env.
- If **custom staging env** is enabled:
  - Update CI to use `vercel pull --environment=staging`.
  - Update deploy step to use the staging environment (CLI supports
    `--environment` when deploying from prebuilt, verify CLI version).
  - Remove manual aliasing in `deploy-staging.yml`.
  - Add staging env vars in Vercel UI (not just Preview), and align GitHub
    environment name to `staging`.
- If **not on Pro**, keep current Preview + alias approach and document
  limitations.

---

## 4) Git Strategy (main/dev)

**Verdict: ⚠️ Needs Adjustment**

**Why:** Current state uses `dev` as default branch but production deploys from
`main`. This is workable but confusing; plan needs migration steps if moving to
trunk-based flow.

**Recommendations (migration path if switching to trunk-based GitHub Flow):**

1. **Set default branch to `main`** in GitHub.
2. Protect `main` (required checks, reviews, no direct pushes).
3. Convert `dev` to **short-lived** (or remove). Use feature branches + PRs →
   `main`.
4. Update **preview workflow** to trigger on PRs into `main` (already). If
   removing `dev`, update staging to track `main` or a `release/*` branch.
5. Update docs and CI references to `dev` only if keeping it.

**What breaks if you change:**

- Staging deployment currently triggers on `dev` push. Changing default branch
  without updating workflows will stall staging.
- Any automation relying on `origin/HEAD → dev` (e.g., local scripts, CI
  assumptions) will need updates.

---

## 5) Ordering & Dependencies (Phases A–D)

**Verdict: ⚠️ Needs Adjustment**

**Why:** Some phases depend on earlier strategic decisions (branching strategy,
Vercel custom env). Current order risks rework.

**Suggested ordering:**

1. **Phase D: Branch strategy alignment** (decide `main` vs `dev` now; impacts
   staging env and workflows).
2. **Phase B: Vercel env hygiene** (depends on branch tracking and plan level).
3. **Phase C: Supabase rationalization** (depends on stable staging env +
   workflows for env vars).
4. **Phase A: Clerk consolidation** (largest blast radius; do after infra env
   alignment + rollout plan).

**Hidden dependencies:**

- Clerk webhook secrets and OAuth redirects depend on final domains and env
  assignments.
- Supabase branching requires correct GitHub/Vercel env var wiring and preview
  workflow behavior.

---

## 6) Missing Items / Gaps

**Verdict: ⚠️ Needs Adjustment**

Add explicit coverage for the following:

### Security & Secrets

- **Secrets rotation plan** after moving Clerk/Supabase keys.
- Ensure `BYPASS_AUTH=false` enforced in all non-local envs (already noted,
  needs verification).

### Cutover & Downtime

- **Downtime window** (especiagent for Clerk user/session migration).
- **DNS propagation time** for `staging.cohortix.ai` and any domain moves.

### Rollback & Verification

- Rollback steps per phase (not just production deploy). Example: how to revert
  to old Clerk app or old Supabase project quickly.
- Smoke test checklist per environment after each phase (auth flow, webhook
  delivery, basic data ops).

### Testing Strategy

- **Per-phase validation steps** with owners and success criteria.
- For Clerk: sign-in/out, OAuth, webhooks, session tokens, `authorizedParties`
  config.
- For Supabase: migrations, RLS policies, connection strings, runtime query
  tests.

### Data / User Mapping

- If Clerk migration: strategy for mapping legacy Clerk user IDs to internal
  user records in Supabase.

---

## Summary Recommendations (TL;DR)

- **Clerk consolidation needs a real migration plan** (users don’t merge across
  apps). Add cutover + reauth strategy and webhook/OAuth update steps.
- **Supabase branching is optional**; keep a safe fallback or delay full
  adoption.
- **Vercel custom env depends on Pro**; verify billing before changing
  workflows.
- **Decide branch strategy first**; it gates Vercel env setup and staging
  behavior.
- Add missing operational details: secrets rotation, DNS timing, downtime,
  rollback, test checklists.

---

## Repo Notes / Evidence

- `deploy-staging.yml` uses `vercel pull --environment=preview` + manual alias
  to `staging.cohortix.ai`.
- `preview.yml` uses preview env and generic Clerk secrets.
- `.env.production.example` and `.env.staging.example` still reference separate
  Clerk apps (not instances).
- No `middleware.ts` found at repo root (verify if it exists under apps/).
