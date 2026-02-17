# Pipeline Setup Steps

This guide outlines the manual configuration steps required in external
dashboards (Supabase, Vercel, GitHub) to support the Cohortix deployment
pipeline.

---

## 1. Supabase: Enable Branching

Supabase branching allows for isolated database environments for every Pull
Request.

1.  Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select the **Cohortix** project.
3.  Go to **Project Settings** (gear icon) -> **Database**.
4.  Find the **Branching** section.
5.  Click **Enable Branching**.
6.  Follow the prompts to connect your GitHub repository
    (`ahmadashfq/cohortix`).
7.  **Important:** Once enabled, the `main` branch becomes the "Production"
    branch.

---

## 2. GitHub: Connect Repo to Supabase

If not already done during the branching setup:

1.  Go to the [Supabase GitHub Integration](https://github.com/apps/supabase)
    page.
2.  Install the app for the `ahmadashfq/cohortix` repository.
3.  In the Supabase Dashboard, verify the connection under **Settings** ->
    **Integrations**.

---

## 3. Vercel: Environment Variable Scoping

Environment variables must be scoped correctly to ensure the right keys are used
in each environment (Production, Preview, Development).

1.  Log in to [Vercel](https://vercel.com).
2.  Select the **Cohortix** project.
3.  Go to **Settings** -> **Environment Variables**.
4.  Configure the following variables:

### Clerk Authentication

| Variable Name                       | Value         | Scope                            |
| :---------------------------------- | :------------ | :------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Production                       |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Preview, Development             |
| `CLERK_SECRET_KEY`                  | `sk_live_...` | Production                       |
| `CLERK_SECRET_KEY`                  | `sk_test_...` | Preview, Development             |
| `CLERK_WEBHOOK_SECRET`              | `whsec_...`   | Production, Preview, Development |

### Supabase Branching (Preview Only)

To enable Supabase branching support in Vercel previews:

1.  Add a new variable: `SUPABASE_BRANCH_DB_URL`.
2.  Set its value to: `$SUPABASE_BRANCH_DB_URL` (this is a placeholder
    Vercel/Supabase integration uses).
3.  Scope it to **Preview** only.

---

## 4. GitHub: Branch Protection Rules

Protect the `main` branch to ensure stability.

1.  Go to your GitHub repository: `ahmadashfq/cohortix`.
2.  Go to **Settings** -> **Branches**.
3.  Click **Add rule** for branch name pattern: `main`.
4.  Enable the following:
    - [x] **Require a pull request before merging**
    - [x] **Require approvals** (Set to 1)
    - [x] **Require status checks to pass before merging**
      - Search and add: `CI Success`
      - Search and add: `Preview Success`
    - [x] **Require conversation resolution before merging**
    - [x] **Do not allow bypass settings** (Optional, but recommended for
          production)

---

## 5. Summary of Automated Workflows

- **CI Pipeline (`ci.yml`)**: Runs on every push to `main` and every PR.
  Performs linting, type-checking, unit tests, security scans, and build
  verification.
- **Preview Deployment (`preview.yml`)**: Runs on PRs to `main`. Deploys a
  preview to Vercel and runs E2E tests against the preview URL.
- **Production Release (`release.yml`)**: Runs when code is pushed/merged to
  `main`. Performs final checks, runs DB migrations, and deploys to production.
- **Lighthouse (`lighthouse.yml`)**: Runs on PRs to check performance,
  accessibility, and SEO.
