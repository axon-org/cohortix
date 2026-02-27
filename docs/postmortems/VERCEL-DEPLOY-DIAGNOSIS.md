# Vercel Git Deploy Diagnosis — Cohortix

## TL;DR (Most Likely Causes)

1. **GitHub webhooks are missing** → `gh api repos/ahmadashfq/cohortix/hooks`
   returned `[]` (no Vercel webhook). Without the webhook, Vercel never receives
   push/PR events.
2. **Git deployments explicitly disabled in `apps/web/vercel.json`** →
   `deploymentEnabled: false` (this likely overrides the root config when
   rootDirectory is `apps/web`).

Both conditions independently prevent Git-triggered deployments.

---

## Evidence & Findings

### 1) GitHub Webhooks (Critical)

- Command: `gh api repos/ahmadashfq/cohortix/hooks`
- **Result:** `[]` (no webhooks configured)
- **Impact:** Vercel Git Integration relies on a webhook to receive push/PR
  events. Without it, no builds are triggered.

### 2) `deploymentEnabled` Conflicts

- **Root config:** `vercel.json` at repo root sets
  `git.deploymentEnabled: true`.
- **App-level config:** `apps/web/vercel.json` sets
  `git.deploymentEnabled: false`.
- **Impact:** With `rootDirectory` set to `apps/web`, Vercel likely reads config
  from **apps/web** and disables deployments.
- Note: Docs confirm this was intentional when GitHub Actions handled
  deployments (`docs/guides/STAGING-SETUP.md`). There are currently **no deploy
  workflows**, so this now blocks deployments.

### 3) No `.vercelignore`

- Searched repo → **none found**.
- Not a blocker.

### 4) rootDirectory

- `vercel.json` contains `"rootDirectory": "apps/web"`.
- In Vercel, rootDirectory is typically configured in **Project Settings**, not
  always via `vercel.json`. If Vercel ignores this, it may build from repo root
  (bad for monorepo).
- **Action:** verify in Vercel project settings that root directory is set to
  `apps/web`.

### 5) GitHub Actions Deployments

- `.github/workflows/` has no Vercel deploy workflow.
- Docs mention a previous workflow for `vercel deploy --prebuilt` but it is no
  longer present.
- With Git deployments disabled and no workflow, **deployments never happen**.

---

## Fixes I Made (Code/Config)

- **Branch:** `fix/vercel-git-deploy`
- **Change:** `apps/web/vercel.json` → `deploymentEnabled: true`

```json
{
  "git": {
    "deploymentEnabled": true
  }
}
```

This aligns with the root `vercel.json` and re-enables Git deploys if the
project is correctly connected.

---

## Manual Actions Required (Ahmad)

These cannot be fixed from code; must be done in Vercel/GitHub:

1. **Install or re-connect the Vercel GitHub App**
   - Go to Vercel → Project → Settings → Git
   - Ensure repo `ahmadashfq/cohortix` is connected
   - If not connected: re-link, which will also re-create the webhook

2. **Verify GitHub webhook exists**
   - GitHub → Repo Settings → Webhooks
   - There should be a Vercel webhook entry. Currently there is none.

3. **Confirm Production Branch**
   - Vercel → Project → Settings → Git → Production Branch = `main`

4. **Enable Auto Deployments**
   - Vercel → Project → Settings → Git
   - Ensure deployments enabled for `main` and preview deploys for PRs

5. **Root Directory Setting**
   - Vercel → Project → Settings → General
   - Set **Root Directory** to `apps/web`

6. **Check for Ignored Build Step**
   - Vercel → Project → Settings → Git / Build & Deployment
   - Ensure **Ignored Build Step** is empty and not skipping all builds

---

## Notes & Recommendations

- Current docs say `deploymentEnabled: false` was intentional for GitHub
  Actions-based deploys. Since those workflows are absent, either:
  - **Re-enable GitHub Actions deploys**, or
  - **Enable Git deployments (recommended)** and keep the config above.

- If you want a dedicated staging environment (dev branch → staging URL), use
  **Vercel Git Branch Aliases** instead of custom GH Actions unless governance
  requires CLI-based deploys.

---

## Next Steps (Suggested)

1. Ahmad reconnects Vercel Git integration (creates webhook).
2. Merge branch `fix/vercel-git-deploy`.
3. Push a test commit to `dev` and `main` to confirm deployments trigger.
4. If still not triggering, check Vercel project logs for ignored build
   conditions or auth errors.
