# Ahmad's Clerk Setup Checklist

**Branch:** `feature/clerk-migration`  
**Time Required:** ~30 minutes

---

## Quick Start Checklist

### ☐ 1. Create Clerk Account (5 min)
- [ ] Go to [clerk.com](https://clerk.com)
- [ ] Sign up with your email
- [ ] Create application: "Cohortix"
- [ ] Choose auth methods: Email, Google, GitHub
- [ ] **Enable Organizations** (Settings → Organizations)

### ☐ 2. Get API Keys (2 min)
- [ ] Dashboard → API Keys
- [ ] Copy Publishable Key (`pk_test_...`)
- [ ] Copy Secret Key (`sk_test_...`)
- [ ] Create `apps/web/.env.local`:

```bash
# Copy these from Clerk Dashboard → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Copy these from .env.example
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Get this from Step 3 below
CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# Copy your existing Supabase vars from your current .env.local
NEXT_PUBLIC_SUPABASE_URL=your-existing-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-existing-key
SUPABASE_SERVICE_ROLE_KEY=your-existing-service-key
DATABASE_URL=your-existing-db-url

# Optional - for local dev without Clerk
BYPASS_AUTH=false
```

### ☐ 3. Configure Webhook (5 min)
- [ ] Clerk Dashboard → Webhooks → Add Endpoint
- [ ] URL: `http://localhost:3000/api/webhooks/clerk`
- [ ] Events to subscribe:
  - [ ] `user.created`
  - [ ] `user.updated`
  - [ ] `user.deleted`
  - [ ] `organization.created`
  - [ ] `organizationMembership.created`
- [ ] Copy Signing Secret (`whsec_...`)
- [ ] Add to `.env.local` as `CLERK_WEBHOOK_SECRET`

### ☐ 4. Run Database Migration (2 min)
```bash
cd /Users/alimai/Projects/cohortix
supabase db push
```

Or in Supabase Studio → SQL Editor:
- [ ] Open `supabase/migrations/20260214000000_add_clerk_integration.sql`
- [ ] Run the migration

### ☐ 5. Test Locally (10 min)
```bash
pnpm dev
```

- [ ] Visit `http://localhost:3000/sign-up`
- [ ] Create a test account
- [ ] Check Supabase Studio → `profiles` table
- [ ] Verify new row exists with `clerk_user_id` populated
- [ ] Sign out
- [ ] Sign in again
- [ ] Visit dashboard (should work)

### ☐ 6. Test Organization (Optional, 5 min)
- [ ] Click "Create Organization" (if Clerk component is visible)
- [ ] Create test organization
- [ ] Check Supabase Studio → `organizations` table
- [ ] Verify row with `clerk_org_id`

---

## Verification Steps

### ✅ Successful Setup Looks Like:

1. **Sign-up works**
   - User redirected to `/dashboard` after sign-up
   - No errors in browser console

2. **Webhook fires**
   - Check Clerk Dashboard → Webhooks → Logs
   - Should see successful `user.created` event

3. **Supabase sync works**
   - Supabase Studio → `profiles` table
   - New row exists with:
     - `clerk_user_id` = Clerk user ID
     - `email` = user's email
     - `first_name`, `last_name` (if provided)

4. **API routes work**
   - Visit `/dashboard` (or any protected route)
   - Page loads without 401 errors
   - User data displays correctly

---

## Troubleshooting

### Issue: "Webhook not firing"
**Check:**
- [ ] Webhook URL is `http://localhost:3000/api/webhooks/clerk`
- [ ] All 5 events are subscribed
- [ ] Webhook is enabled (toggle in Clerk Dashboard)

**Fix:**
- Clerk Dashboard → Webhooks → Your Endpoint → Send Test Event

### Issue: "User created in Clerk but not in Supabase"
**Check:**
- [ ] Webhook secret in `.env.local` matches Clerk
- [ ] Supabase service role key is correct
- [ ] Migration was applied (check `profiles` table has `clerk_user_id` column)

**Debug:**
- Check terminal logs when signing up
- Should see webhook POST request
- Look for any error messages

### Issue: "API routes return 401"
**Check:**
- [ ] User exists in Supabase `profiles` table
- [ ] `clerk_user_id` matches Clerk user ID
- [ ] `.env.local` has all required Clerk variables

**Debug:**
- Add `console.log` in `getAuthContext()` function
- Check what `clerkUserId` is
- Verify Supabase query finds user

---

## When Everything Works

### Next Steps:
1. [ ] Commit and push your `.env.local` setup notes (NOT the file itself)
2. [ ] Review the PR: `feature/clerk-migration`
3. [ ] Approve and merge to `dev`
4. [ ] Notify Noah (DevOps) to start Phase B (Pipeline setup)

---

## Production Setup (Later)

When ready to deploy to production:

1. **Create Clerk Production Application**
   - Separate from dev (best practice)
   - Production keys: `pk_live_`, `sk_live_`

2. **Update Vercel Env Vars**
   - Add production Clerk keys
   - Scope: Production only

3. **Update Webhook URL**
   - URL: `https://cohortix.com/api/webhooks/clerk`
   - Get new webhook secret for production

4. **Run Migration on Production DB**
   ```bash
   supabase db push --db-url PRODUCTION_URL
   ```

---

## Questions?

**Contact:** Devi via Alim

**Reference Docs:**
- Full migration summary: `docs/CLERK-MIGRATION-SUMMARY.md`
- Clerk docs: [docs.clerk.com](https://docs.clerk.com)

---

**Estimated time:** 30 minutes  
**Difficulty:** Easy  
**Prerequisites:** Clerk account, Supabase access
