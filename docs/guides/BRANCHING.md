# Cohortix Branching Strategy

**Model:** Trunk-based (GitHub Flow)

## Branch Roles

- **`main`** → **Production** (default branch)
- **`dev`** → **Staging** (long‑lived branch tracked by staging environment)
- **Feature branches** → Short‑lived branches from `main`, merged via PRs back
  into `main`

## Workflow

1. Create a feature branch from `main` (`feat/...`, `fix/...`, etc.).
2. Open a PR into `main`.
3. CI runs and a preview deployment is created for the PR.
4. After approval + green CI, merge into `main` → production deploy.
5. `dev` is used for staging validation (staging env tracks `dev`).

## Branch Protection (Verified)

`main` has protection rules enforced:

- **Required status checks:** `ci` (strict)
- **Required PR reviews:** 1 approval
- **Dismiss stale reviews:** enabled
- **Force pushes / deletions:** disabled

Verified via `gh api repos/ahmadashfq/cohortix/branches/main/protection`.

## Notes

- `main` is the GitHub default branch.
- `dev` remains long‑lived for staging only; it is **not** the default branch.
- Use PRs (no direct pushes) for production changes.
