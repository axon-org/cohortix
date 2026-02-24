## Addendum (2026-02-24): Root Cause Identified

The original failure that led to building custom workflows was NOT a Vercel Git
Integration limitation. The actual root cause was a **git author email
mismatch**:

- Repo-level git config: `ahmadashfq@gmail.com`
- Vercel account email: `ahmad@madsgency.com`
- Vercel requires the commit author email to match a team member's account

**Fix:** `git config user.email "ahmad@madsgency.com"` in the repo.

**Lesson reinforced:** Always check the simplest explanations first (email
mismatch, permissions) before building complex workarounds. The entire day of
custom workflow debugging could have been avoided with one `git config` command.
