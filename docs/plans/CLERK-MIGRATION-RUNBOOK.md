# Clerk Consolidation Runbook (Hard Cutover)

**Status:** Plan only — DO NOT execute until Ahmad approves.  
**Scope:** Consolidate Clerk apps into single **Cohortix** app with Dev + Prod
instances. Delete `cohortix-production` + `cohortix-staging` after cutover.

---

## 0) Current State (from repo)

**Env vars used:**

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` `/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` `/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` `/dashboard`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` `/onboarding`

**Webhook endpoint:**

- `POST /api/webhooks/clerk` (file:
  `apps/web/src/app/api/webhooks/clerk/route.ts`)

**Middleware:**

- `apps/web/src/middleware.ts` uses `clerkMiddleware` with **no**
  `authorizedParties` configuration currently.

**Domains observed:**

- Production: `https://cohortix.ai` (from Vercel Production env)
- Staging: `https://staging.cohortix.ai` (from `.env.staging.example`)
- Local: `http://localhost:3000` (from `.env.local.example`)

---

## 1) Pre‑cutover Checklist

- [ ] Confirm **no real users** in any Clerk app (approved by Ahmad).
- [ ] Snapshot current Clerk settings for all three apps:
  - OAuth providers + callback URLs
  - Webhooks + signing secrets
  - Domains/allowed origins
  - JWT/JWKS settings
- [ ] Export existing env vars from Vercel (already available via
      `vercel env pull`).
- [ ] Ensure staging domain `staging.cohortix.ai` is ready (DNS + Vercel alias).

---

## 2) Target Architecture (Locked)

- **Single Clerk app:** `Cohortix`
- **Instances:**
  - **Dev instance** → used by local + preview/staging
  - **Prod instance** → used by production
- **Delete apps:** `cohortix-production`, `cohortix-staging`

---

## 3) Clerk Dashboard Steps (Dev + Prod instances)

1. Open **Cohortix** app in Clerk dashboard.
2. Ensure **Dev** and **Prod** instances exist.
3. Configure **Dev instance**:
   - Add allowed origins / redirect URLs:
     - `http://localhost:3000`
     - `https://staging.cohortix.ai`
     - (Optional) Vercel preview domains if used
   - Create/update webhook endpoint(s):
     - `https://staging.cohortix.ai/api/webhooks/clerk`
     - (Optional) `http://localhost:3000/api/webhooks/clerk` for local testing
4. Configure **Prod instance**:
   - Allowed origins / redirect URLs:
     - `https://cohortix.ai`
   - Webhook endpoint:
     - `https://cohortix.ai/api/webhooks/clerk`
5. Rotate **webhook signing secrets** for both instances.
6. Capture **API keys** for each instance:
   - Dev: `pk_test_*`, `sk_test_*`
   - Prod: `pk_live_*`, `sk_live_*`

---

## 4) Env Var Changes (Exact)

> Update **Vercel** env vars only — no code changes yet.

### Production (Vercel Production)

Set to **Prod instance** keys:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_*`
- `CLERK_SECRET_KEY=sk_live_*`
- `CLERK_WEBHOOK_SECRET=whsec_*` (Prod webhook)

### Staging / Preview (Vercel Preview)

Set to **Dev instance** keys:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_*`
- `CLERK_SECRET_KEY=sk_test_*`
- `CLERK_WEBHOOK_SECRET=whsec_*` (Dev webhook)

### Development (Vercel Development)

Set to **Dev instance** keys:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_*`
- `CLERK_SECRET_KEY=sk_test_*`
- `CLERK_WEBHOOK_SECRET=whsec_*`

> If local `.env.local` is used, mirror Dev instance keys there too.

---

## 5) Middleware Security: `authorizedParties`

Add `authorizedParties` to `clerkMiddleware` so tokens are only accepted from
expected origins.

**File:** `apps/web/src/middleware.ts`

**Target config (example):**

```ts
export default clerkMiddleware(
  async (auth, request) => {
    /* existing logic */
  },
  {
    authorizedParties: [
      'http://localhost:3000',
      'https://staging.cohortix.ai',
      'https://cohortix.ai',
    ],
  }
);
```

> If `authorizedParties` is not supported in `clerkMiddleware` for current SDK
> version, apply it in the backend token verification layer instead.

---

## 6) OAuth Provider Updates

For each OAuth provider (Google/GitHub/etc.) update **authorized redirect
URLs**:

- **Dev instance**
  - `http://localhost:3000/sign-in`
  - `http://localhost:3000/sign-up`
  - `https://staging.cohortix.ai/sign-in`
  - `https://staging.cohortix.ai/sign-up`
- **Prod instance**
  - `https://cohortix.ai/sign-in`
  - `https://cohortix.ai/sign-up`

> If the app uses Clerk’s default redirect URLs, validate the exact callback
> paths in Clerk’s OAuth settings and update providers accordingly.

---

## 7) Cutover Steps (Execution Sequence)

1. **Pause** traffic if needed (optional — not required for hard cutover).
2. Update **Vercel Production** env vars to Prod instance keys.
3. Update **Vercel Preview + Development** env vars to Dev instance keys.
4. Deploy:
   - Merge to `main` → production deploy
   - Push to `dev` → staging deploy
5. Validate:
   - Sign‑in / sign‑up
   - OAuth flow
   - Webhook delivery (check `webhook_events` table)
6. After stable validation, delete old Clerk apps:
   - `cohortix-production`
   - `cohortix-staging`

---

## 8) Verification Checklist

- [ ] `sign-in` and `sign-up` work on `https://cohortix.ai`
- [ ] `sign-in` and `sign-up` work on `https://staging.cohortix.ai`
- [ ] OAuth providers redirect correctly in all envs
- [ ] Webhook events are accepted (no signature errors)
- [ ] `authorizedParties` blocks unauthorized domains (if configured)
- [ ] Supabase `profiles` table receives Clerk webhook updates

---

## 9) Rollback Plan

- Revert Vercel env vars to previous keys
- Re-deploy `main` + `dev`
- (If deleted) recreate old Clerk apps from backup settings (not recommended
  unless rollback is necessary)

---

## Notes / Risks

- Hard cutover **invalidates all sessions**; users must re‑auth.
- Webhook secrets must be rotated to match new app instance.
- OAuth providers are common failure points; update before deploy.
