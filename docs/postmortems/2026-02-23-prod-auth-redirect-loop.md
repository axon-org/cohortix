# Post-Mortem: Production Dashboard Redirect Loop

**Date:** 2026-02-22 to 2026-02-23
**Severity:** P0 — Production auth completely broken
**Duration:** ~24 hours
**Author:** Alim (CEO/AI)

## Summary

Users could not access the production dashboard at `app.cohortix.ai`. After Google sign-in, the app redirected infinitely between `/sign-in` and `/dashboard`.

## Root Causes (Multiple)

### 1. Supabase service_role permissions revoked (PRIMARY)
The `service_role` PostgreSQL role lost `GRANT` permissions on all tables in the `public` schema. This caused `getAuthContext()` in the dashboard layout to fail with `permission denied for table profiles`, throwing `UnauthorizedError`, which redirected to `/sign-in`. Since the user was authenticated, Clerk redirected back to `/dashboard` — creating an infinite loop.

**Fix:** `GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;`

### 2. Clerk domain misconfiguration (SECONDARY)
The Clerk instance was configured with `cohortix.ai` as the primary domain, but the app lives on `app.cohortix.ai`. This caused session cookies to be set on `cohortix.ai` — which `app.cohortix.ai` couldn't read (browsers don't send parent-domain cookies to subdomains unless explicitly scoped).

**Fix:** Changed Clerk domain to `app.cohortix.ai` as **Primary application**, keeping FAPI on `clerk.cohortix.ai`. Primary application sets cookies on `.cohortix.ai` (root), readable by all subdomains.

### 3. Clerk Organizations disabled
After fixing auth, users hit the onboarding page but couldn't create organizations because the feature was disabled in Clerk Dashboard.

**Fix:** Enabled Organizations in Clerk Dashboard with "Create first organization automatically" setting.

## Timeline

| Time | Action |
|------|--------|
| Feb 22, 10:00 | Issue reported — redirect loop on production |
| Feb 22, 10:30 | Identified cookie scoping as likely cause |
| Feb 22, 11:00 | Attempted proxy approach (`/clerkproxy`) — partially worked |
| Feb 22, 12:00 | Proxy route deployed, Clerk dashboard configured |
| Feb 22, 13:00 | Discovered trailing `\n` in ALL Vercel env vars corrupting headers |
| Feb 22, 14:00 | Fixed env vars, proxy working but Google OAuth still failing |
| Feb 22, 15:00 | Decided to do clean domain migration instead of proxy |
| Feb 22, 15:30 | Changed Clerk domain to `app.cohortix.ai` (Secondary) — wrong choice |
| Feb 22, 16:00 | Secondary domain cookies scoped to `clerk.app.cohortix.ai` — can't read from `app.cohortix.ai` |
| Feb 22, 16:30 | Changed to Primary application — FAPI on `clerk.cohortix.ai`, cookies on `.cohortix.ai` |
| Feb 23, 11:00 | Added debug logging to middleware |
| Feb 23, 11:40 | **KEY DISCOVERY:** Logs show middleware passes auth (userId present) but dashboard layout fails with `permission denied for table profiles` |
| Feb 23, 11:45 | Ran `GRANT ALL` on Supabase — redirect loop fixed |
| Feb 23, 11:50 | Enabled Clerk Organizations — onboarding working |
| Feb 23, 12:00 | Confirmed full auth flow working end-to-end |

## What Went Wrong

1. **We chased the wrong problem for hours.** The real issue was Supabase permissions, not Clerk cookies. We didn't have logging to see the actual error until late in the process.
2. **No structured logging in production.** Console.log statements only visible in Vercel runtime logs — no centralized logging, no alerts.
3. **Vercel env vars set via CLI heredoc had trailing `\n`** — corrupting headers and JWT tokens silently.
4. **Multiple Clerk domain changes** (cohortix.ai → app.cohortix.ai secondary → app.cohortix.ai primary) caused confusion and stale cookies.
5. **No automated tests** for the auth flow end-to-end.

## What Went Right

1. **Debug logging in middleware** finally revealed the real root cause (Supabase permissions, not Clerk).
2. **Browser testing** confirmed cookies were being set correctly.
3. **Vercel runtime logs** showed the exact error (`permission denied for table profiles`).

## Action Items

| Priority | Item | Owner |
|----------|------|-------|
| 🔴 | Add Drizzle migration to ensure `service_role` grants on all tables | Devi |
| 🔴 | Set up structured logging (Axiom or similar) | Devi |
| 🔴 | Add health check endpoint that verifies DB connectivity | Devi |
| 🟡 | Add E2E auth flow test (sign-in → dashboard) | Devi |
| 🟡 | Document Clerk domain architecture in project README | Devi |
| 🟡 | Fix env var setting process — always use `echo -n` to avoid trailing newlines | All |
| 🟡 | Clean up stale DNS records (old `clerk.app.cohortix.ai` CNAMEs) | Ahmad |
| 🟢 | Explore Clerk-Supabase native integration for JWT-based RLS | Devi |
| 🟢 | Remove deprecated `afterSignInUrl` env var usage | Devi |

## Lessons Learned

1. **Always add logging before debugging auth issues.** We would have found the Supabase error in 10 minutes instead of 24 hours.
2. **Clerk Primary vs Secondary domain matters for cookie scoping.** Primary = cookies on root domain. Secondary = cookies on subdomain only.
3. **Never set Vercel env vars via heredoc/pipe without `echo -n`.** Always verify with `vercel env pull` after setting.
4. **The dashboard layout's catch-all `redirect('/sign-in')` masks real errors.** It should distinguish between auth errors and data errors.
5. **Service role grants can be silently revoked by migrations.** Always include `GRANT` statements in migration files.

## Architecture (Final State)

```
cohortix.ai (root) → Reserved for marketing (not on Vercel)
app.cohortix.ai → Next.js app (Vercel)
clerk.cohortix.ai → Clerk FAPI (CNAME → frontend-api.clerk.services)
accounts.cohortix.ai → Clerk accounts portal
```

Clerk cookies set on `.cohortix.ai` → readable by `app.cohortix.ai` ✅
