# Cohortix Developer Workflow

This guide outlines the daily workflow for developers contributing to the
Cohortix project.

---

## 1. Starting a New Feature or Fix

Cohortix uses a trunk-based development model with short-lived feature branches.

1.  **Sync your local environment:**
    ```bash
    git checkout dev
    git pull origin dev
    ```
2.  **Create a feature branch:**
    ```bash
    # Format: feat/description or fix/description
    git checkout -b feat/my-new-feature
    ```
3.  **Install dependencies:**
    ```bash
    pnpm install
    ```

---

## 2. Local Development

- **Start the development server:** `pnpm dev`
- **Run tests locally:** `pnpm test`
- **Check types:** `pnpm type-check`
- **Lint code:** `pnpm lint`

---

## 3. Pull Request & Preview Testing

1.  **Push your branch:** `git push -u origin feat/my-new-feature`
2.  **Open a Pull Request** against the `main` branch.
3.  **Verify CI passes:** Wait for the "CI Pipeline" status checks to turn
    green.
4.  **Test the Preview:**
    - Wait for the "Preview Deployment" to complete.
    - Click the **Preview URL** commented on the PR by the GitHub Actions bot.
    - Log in using the **Clerk Development** credentials.
    - Verify your changes in the isolated preview environment (which has its own
      Supabase branch DB).

---

## 4. Merging to Production

Once your PR is approved and all checks (CI + Preview) have passed:

1.  **Merge the PR** (Squash and merge is preferred).
2.  **Monitor the Release:**
    - Watch the **Production Release** workflow in GitHub Actions.
    - The workflow will automatically:
      1. Run final tests.
      2. Apply database migrations (`pnpm db:migrate`).
      3. Deploy to Vercel production.
      4. Run production smoke tests.
3.  **Verify Production:** Visit [cohortix.com](https://cohortix.com) (or your
    production URL) and verify the changes.

---

## 5. Handling Failures & Rollbacks

### CI/Preview Failure

- Check the GitHub Actions logs for the specific failure.
- Fix the issue locally, commit, and push. The pipeline will re-run
  automatically.

### Production Deployment Failure

- The `release.yml` workflow will stop if any step fails (e.g., migrations or
  smoke tests).
- If a deployment fails during the build/deploy phase, Vercel will keep the
  previous deployment active.

### Production Incident (Rollback)

If a bug is discovered in production _after_ a successful deployment:

1.  **Instant Rollback (Vercel):**
    - Go to the Vercel Dashboard -> Deployments.
    - Find the previous stable deployment.
    - Click "Instant Rollback".
2.  **Git Revert:**
    - On the `main` branch: `git revert <commit_hash>`
    - Push to `main`: `git push origin main`
    - This will trigger a new deployment with the reverted code.
3.  **Database Migration Rollback:**
    - If a migration was destructive, you may need to restore from a Supabase
      backup or manually write a "down" migration (Drizzle does not handle
      automated rollbacks for all cases).

---

## 6. Definition of Done (Checklist)

- [ ] Code is linted and type-checked.
- [ ] Unit tests added/updated and passing.
- [ ] Feature verified in local environment.
- [ ] PR description explains _what_ and _why_.
- [ ] CI Pipeline is green.
- [ ] Preview deployment verified manually.
- [ ] E2E tests passing against preview.
