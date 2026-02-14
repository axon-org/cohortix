# Git Workflow Enforcement for Multi-Agent AI Teams

> Making branch discipline **automatic, not aspirational**

**Version:** 1.0.0  
**Created:** 2026-02-14  
**For:** Cohortix + Multi-Agent AI Development Teams (15+ AI agents)  
**Problem:** Codex exists but agents only read it during compliance checks, not every session  
**Goal:** Make git-flow rules **enforced by tooling**, not just documented

---

## Executive Summary

### Current State
- **Documented Rules:** Axon Codex v1.2 defines clear branch discipline
- **Actual Behavior:** Agents read docs only during compliance checks
- **Result:** Stale branches, incorrect base branches, missed syncs

### Proposed Solution Stack (Ranked by Impact)

| # | Solution | Impact | Effort | ROI | Priority |
|---|----------|--------|--------|-----|----------|
| **1** | GitHub Actions PR Validation | 🔥 **Critical** | Medium | Very High | **MUST HAVE** |
| **2** | Agent Session Init Guards | 🔥 **Critical** | Low | Very High | **MUST HAVE** |
| **3** | Git Hooks (Client-side) | 🟡 Moderate | Low | Medium | **SHOULD HAVE** |
| **4** | Server-side Hooks (GitHub) | 🟢 Nice-to-Have | High | Low | **COULD HAVE** |
| **5** | Post-Merge Automation | 🟡 Moderate | Medium | High | **SHOULD HAVE** |

**Why this order?**
1. **GitHub Actions** catch violations BEFORE merge (100% enforcement, zero client config)
2. **Session Init Guards** make rules visible EVERY session (fixes "only read during compliance" problem)
3. **Git Hooks** provide fast local feedback (but can be bypassed with `--no-verify`)
4. **Server-side Hooks** require GitHub Enterprise (not practical for most teams)
5. **Post-Merge Automation** reduces toil but doesn't prevent violations

---

## 🔥 Priority 1: GitHub Actions PR Validation (MUST HAVE)

### Why This First?
- **100% Enforcement:** Cannot be bypassed (unlike client hooks)
- **Zero Agent Config:** No per-agent setup required
- **Immediate Feedback:** Fails fast on PR creation
- **Auditable:** All violations logged in GitHub

### What It Enforces
✅ PRs to `main` are **blocked** (only `dev` → `main` allowed)  
✅ Feature branches must target `dev`, not `main`  
✅ Feature branches must be based on latest `dev` (no stale branches)  
✅ Branch naming follows convention (`feat/`, `fix/`, etc.)  
✅ No force pushes to protected branches

### Implementation

**File:** `.github/workflows/branch-discipline.yml`

```yaml
name: Branch Discipline Enforcement

on:
  pull_request:
    types: [opened, synchronize, reopened, edited]
    branches:
      - main
      - dev

jobs:
  enforce-branch-rules:
    name: Validate Branch Discipline
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Need full history for base branch checks
      
      - name: Validate PR target branch
        id: validate-target
        run: |
          set -e
          
          TARGET_BRANCH="${{ github.event.pull_request.base.ref }}"
          SOURCE_BRANCH="${{ github.event.pull_request.head.ref }}"
          
          echo "🔍 Validating PR from '$SOURCE_BRANCH' → '$TARGET_BRANCH'"
          
          # Rule 1: Only dev → main PRs allowed to target main
          if [[ "$TARGET_BRANCH" == "main" ]]; then
            if [[ "$SOURCE_BRANCH" != "dev" ]]; then
              echo "❌ ERROR: PRs to 'main' can only come from 'dev'"
              echo "::error::Invalid PR target. Feature branches must target 'dev', not 'main'."
              echo "error=true" >> $GITHUB_OUTPUT
              exit 1
            fi
            echo "✅ Valid: dev → main promotion"
          fi
          
          # Rule 2: Feature/fix branches must target dev
          if [[ "$SOURCE_BRANCH" =~ ^(feat|fix|chore|refactor|docs)/ ]]; then
            if [[ "$TARGET_BRANCH" != "dev" ]]; then
              echo "❌ ERROR: Feature branch '$SOURCE_BRANCH' must target 'dev', not '$TARGET_BRANCH'"
              echo "::error::Feature branches must target 'dev'. Change PR base to 'dev'."
              echo "error=true" >> $GITHUB_OUTPUT
              exit 1
            fi
            echo "✅ Valid: Feature branch targeting dev"
          fi
          
          echo "error=false" >> $GITHUB_OUTPUT
      
      - name: Validate branch naming convention
        id: validate-naming
        run: |
          set -e
          
          SOURCE_BRANCH="${{ github.event.pull_request.head.ref }}"
          
          echo "🔍 Validating branch name: '$SOURCE_BRANCH'"
          
          # Allowed patterns: feat/, fix/, chore/, refactor/, docs/, hotfix/, dev, main
          VALID_PATTERNS="^(feat|fix|chore|refactor|docs|hotfix)/[a-z0-9-]+$|^(dev|main)$"
          
          if [[ "$SOURCE_BRANCH" =~ $VALID_PATTERNS ]]; then
            echo "✅ Branch name follows convention"
            echo "error=false" >> $GITHUB_OUTPUT
          else
            echo "❌ ERROR: Branch name '$SOURCE_BRANCH' doesn't follow convention"
            echo "::error::Branch must match pattern: <type>/<description> (e.g., feat/user-auth, fix/login-bug)"
            echo "::notice::Valid types: feat, fix, chore, refactor, docs, hotfix"
            echo "error=true" >> $GITHUB_OUTPUT
            exit 1
          fi
      
      - name: Check if branch is based on latest dev
        id: validate-base
        if: github.event.pull_request.base.ref == 'dev'
        run: |
          set -e
          
          SOURCE_BRANCH="${{ github.event.pull_request.head.ref }}"
          
          # Fetch latest dev
          git fetch origin dev:dev
          
          # Find merge base (common ancestor)
          MERGE_BASE=$(git merge-base HEAD origin/dev)
          LATEST_DEV=$(git rev-parse origin/dev)
          
          echo "🔍 Checking if branch is based on latest dev"
          echo "   Merge base: $MERGE_BASE"
          echo "   Latest dev: $LATEST_DEV"
          
          # Allow if merge base is recent (within last 10 commits)
          COMMITS_BEHIND=$(git rev-list --count $MERGE_BASE..origin/dev)
          
          if [[ $COMMITS_BEHIND -gt 10 ]]; then
            echo "⚠️ WARNING: Branch is $COMMITS_BEHIND commits behind dev"
            echo "::warning::Branch is $COMMITS_BEHIND commits behind dev. Consider rebasing."
            echo "warning=true" >> $GITHUB_OUTPUT
          else
            echo "✅ Branch is based on recent dev (within $COMMITS_BEHIND commits)"
            echo "warning=false" >> $GITHUB_OUTPUT
          fi
      
      - name: Post violation comment
        if: steps.validate-target.outputs.error == 'true' || steps.validate-naming.outputs.error == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const targetError = '${{ steps.validate-target.outputs.error }}' === 'true';
            const namingError = '${{ steps.validate-naming.outputs.error }}' === 'true';
            
            let body = '## ❌ Branch Discipline Violation\n\n';
            
            if (targetError) {
              body += '### Invalid PR Target\n';
              body += '- ❌ Feature branches must target `dev`, not `main`\n';
              body += '- ℹ️ Only `dev` → `main` PRs are allowed\n\n';
              body += '**Fix:** Change the base branch of this PR to `dev`\n\n';
            }
            
            if (namingError) {
              body += '### Invalid Branch Name\n';
              body += 'Branch must follow pattern: `<type>/<description>`\n\n';
              body += '**Valid types:** `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`, `hotfix/`\n\n';
              body += '**Examples:**\n';
              body += '- ✅ `feat/user-authentication`\n';
              body += '- ✅ `fix/login-redirect-bug`\n';
              body += '- ✅ `chore/update-dependencies`\n\n';
              body += '**Fix:** Rename your branch and create a new PR\n\n';
            }
            
            body += '---\n';
            body += '📚 **Reference:** [Axon Codex v1.2 - Branch Discipline](../docs/GIT_WORKFLOW.md)\n';
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

### Rollout Plan
1. **Week 1:** Deploy to staging repo first
2. **Week 2:** Monitor for false positives, tune rules
3. **Week 3:** Deploy to production repos
4. **Week 4:** Enable as required check in branch protection

### Escape Hatches
- **Emergency override:** Repo admins can bypass (logged in audit trail)
- **Hotfix exception:** `hotfix/*` branches can target `main` directly

---

## 🔥 Priority 2: Agent Session Init Guards (MUST HAVE)

### Why This Second?
- **Solves root cause:** "Agents only read during compliance checks"
- **100% Visibility:** Every agent session sees the rules
- **Low effort:** Just file placement, no complex code
- **Immediate impact:** Works today, no CI/CD changes

### What It Does
- Display branch rules **at session start** (before any work begins)
- Inject into agent's "working memory" for the session
- Provide quick reference commands

### Implementation

**File 1:** `~/Projects/cohortix/.agent-session-init.md`

This file is read by agents **every session** (enforced by agent framework).

```markdown
# 🚦 Git Workflow Discipline — Read Before Starting

**MANDATORY EVERY SESSION:** These rules are **enforced by CI/CD**, not optional.

## Branch Flow (Enforced by GitHub Actions)

```
main ← dev ← feat/your-feature
```

**Rules:**
1. ✅ **Always branch from `dev`** — Never from `main` or stale branches
2. ✅ **PRs to `dev` only** — Feature branches CANNOT target `main`
3. ✅ **After merge to main** — Immediately sync `dev` with `main`
4. ✅ **Delete after merge** — Delete feature branch (local + remote)

## Quick Commands (Copy-Paste)

### Starting New Work
```bash
# 1. Get latest dev
git checkout dev && git pull origin dev

# 2. Create feature branch
git checkout -b feat/your-feature-name

# 3. Verify you're on the right branch
git branch --show-current  # Should show: feat/your-feature-name
```

### Before Creating PR
```bash
# 1. Ensure you're based on latest dev
git fetch origin dev
git rebase origin/dev

# 2. Push your branch
git push origin feat/your-feature-name

# 3. Create PR targeting 'dev' (NOT main!)
```

### After Your PR Merges to Main (If you're the merger)
```bash
# CRITICAL: Sync dev immediately!
git checkout dev
git pull origin main
git push origin dev
```

### Clean Up After Merge
```bash
# Delete local branch
git branch -d feat/your-feature-name

# Delete remote branch (if not auto-deleted)
git push origin --delete feat/your-feature-name
```

## What Happens If You Violate?

- ❌ **PR to main from feature branch** → GitHub Actions BLOCKS it
- ❌ **Invalid branch name** → GitHub Actions BLOCKS it
- ⚠️ **Branch 10+ commits behind dev** → GitHub Actions WARNS you

## Why This Matters

**For AI agents:** Stale branches = merge conflicts = wasted compute
**For the team:** Clean git history = easier debugging and rollbacks
**For you:** Following rules = faster PR approval

---

**📚 Full Spec:** `~/Projects/cohortix/docs/GIT_WORKFLOW.md`  
**🤖 Automation:** `.github/workflows/branch-discipline.yml`

**Last Updated:** 2026-02-14 | **Enforcement:** Active ✅
```

**File 2:** Add to `~/Projects/cohortix/AGENTS.md`

```markdown
## 🚦 Git Workflow (ENFORCED)

**Read FIRST every session:** `.agent-session-init.md`

These rules are **not suggestions** — they're enforced by CI/CD:

1. Branch from `dev`, never `main`
2. PR to `dev`, never `main` (except `dev` → `main` promotions)
3. After merge to `main`, sync `dev` immediately
4. Delete branches after merge

**Violations = Blocked PRs.** No exceptions.
```

**File 3:** Add to `~/Projects/cohortix/CONTRIBUTING.md` (for agents who check it)

```markdown
## Git Workflow Discipline (Enforced)

See `.agent-session-init.md` for **mandatory** branch discipline rules.

**TL;DR:**
- Branch from `dev`
- PR to `dev`
- Sync `dev` after `main` merges
- Delete branches after merge

**Enforcement:** GitHub Actions will block non-compliant PRs.
```

### Rollout Plan
1. **Day 1:** Add `.agent-session-init.md` to all repos
2. **Day 2:** Update `AGENTS.md` with reference
3. **Day 3:** Train agents: "Read `.agent-session-init.md` at session start"
4. **Week 1:** Monitor compliance, refine wording

### Agent Framework Integration
If using a custom agent framework, inject this check:

```python
# In agent session initialization
def init_session(agent, repo_path):
    """Initialize agent work session."""
    
    # Force-read git workflow rules
    init_file = os.path.join(repo_path, ".agent-session-init.md")
    if os.path.exists(init_file):
        with open(init_file) as f:
            rules = f.read()
        
        # Inject into agent's system prompt for this session
        agent.inject_working_memory("GIT_WORKFLOW_RULES", rules)
        
        print("✅ Git workflow rules loaded into session memory")
    else:
        print("⚠️ WARNING: No .agent-session-init.md found!")
```

---

## 🟡 Priority 3: Git Hooks (Client-Side) (SHOULD HAVE)

### Why Third?
- **Fast local feedback** (fails before push, saves CI time)
- **Can be bypassed** (`--no-verify` flag)
- **Requires setup** (each agent workspace needs hooks installed)

### What It Enforces
- Pre-push: Validate branch name and target
- Post-merge: Remind to sync `dev` after `main` merge
- Pre-commit: Block commits to `main` directly

### Implementation

**File:** `~/Projects/cohortix/.githooks/pre-push`

```bash
#!/bin/bash
# Pre-push hook: Validate branch discipline before push
# Install: ln -sf ../../.githooks/pre-push .git/hooks/pre-push

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Validating branch discipline...${NC}"

# Get current branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)

# Rule 1: Block direct pushes to main
if [[ "$CURRENT_BRANCH" == "main" ]]; then
  echo -e "${RED}❌ BLOCKED: Direct pushes to 'main' are not allowed${NC}"
  echo -e "${YELLOW}📚 Use: git checkout dev && git pull origin main && git push origin dev${NC}"
  exit 1
fi

# Rule 2: Validate branch naming convention
VALID_PATTERNS="^(feat|fix|chore|refactor|docs|hotfix)/[a-z0-9-]+$|^dev$"

if ! [[ "$CURRENT_BRANCH" =~ $VALID_PATTERNS ]]; then
  echo -e "${RED}❌ BLOCKED: Invalid branch name '$CURRENT_BRANCH'${NC}"
  echo -e "${YELLOW}📚 Valid format: <type>/<description>${NC}"
  echo -e "${YELLOW}   Examples: feat/user-auth, fix/login-bug${NC}"
  echo -e "${YELLOW}   Valid types: feat, fix, chore, refactor, docs, hotfix${NC}"
  exit 1
fi

# Rule 3: Check if feature branch is based on recent dev
if [[ "$CURRENT_BRANCH" =~ ^(feat|fix|chore|refactor|docs)/ ]]; then
  # Fetch latest dev (silent)
  git fetch origin dev:refs/remotes/origin/dev --quiet 2>/dev/null || true
  
  # Check how far behind dev we are
  MERGE_BASE=$(git merge-base HEAD origin/dev 2>/dev/null || echo "unknown")
  
  if [[ "$MERGE_BASE" != "unknown" ]]; then
    COMMITS_BEHIND=$(git rev-list --count $MERGE_BASE..origin/dev 2>/dev/null || echo "0")
    
    if [[ $COMMITS_BEHIND -gt 10 ]]; then
      echo -e "${YELLOW}⚠️ WARNING: Your branch is $COMMITS_BEHIND commits behind 'dev'${NC}"
      echo -e "${YELLOW}   Consider rebasing: git fetch origin dev && git rebase origin/dev${NC}"
      # Warning only, don't block
    fi
  fi
fi

echo -e "${GREEN}✅ Branch discipline checks passed${NC}"
exit 0
```

**File:** `~/Projects/cohortix/.githooks/post-merge`

```bash
#!/bin/bash
# Post-merge hook: Remind to sync dev after merging to main
# Install: ln -sf ../../.githooks/post-merge .git/hooks/post-merge

set -e

CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
MERGED_BRANCH=$(git reflog -1 | grep -oP '(?<=refs/heads/)\S+' || echo "unknown")

# If we just merged into main, remind to sync dev
if [[ "$CURRENT_BRANCH" == "main" ]]; then
  echo ""
  echo "🚨 REMINDER: You just merged into 'main'"
  echo "📋 Next step: Sync 'dev' immediately!"
  echo ""
  echo "   git checkout dev"
  echo "   git pull origin main"
  echo "   git push origin dev"
  echo ""
fi
```

**File:** `~/Projects/cohortix/.githooks/install.sh`

```bash
#!/bin/bash
# Install git hooks for this repository

set -e

HOOKS_DIR=".githooks"
GIT_HOOKS_DIR=".git/hooks"

echo "🔧 Installing git hooks..."

# Create symlinks for each hook
for hook in pre-push post-merge; do
  if [ -f "$HOOKS_DIR/$hook" ]; then
    ln -sf "../../$HOOKS_DIR/$hook" "$GIT_HOOKS_DIR/$hook"
    chmod +x "$HOOKS_DIR/$hook"
    echo "✅ Installed: $hook"
  fi
done

echo "✅ Git hooks installed successfully!"
echo ""
echo "To bypass hooks (emergency only): git push --no-verify"
```

### Rollout Plan
1. **Week 1:** Add hooks to repo, document in README
2. **Week 2:** Add hook installation to agent onboarding checklist
3. **Week 3:** Run `scripts/install-hooks.sh` on all agent workspaces
4. **Ongoing:** Include in agent workspace setup scripts

### Bypass Protection
**Problem:** Agents can run `git push --no-verify`  
**Solution:** GitHub Actions (Priority 1) catches violations server-side

---

## 🟢 Priority 4: Server-Side Hooks (GitHub) (COULD HAVE)

### Why Fourth?
- **Requires GitHub Enterprise** (or self-hosted GitHub)
- **High setup complexity** (custom server, deployment)
- **Redundant with GitHub Actions** (which we already have)

### What It Would Do
- **pre-receive hook:** Block pushes that violate rules (before refs update)
- **update hook:** Validate each ref update individually

### Implementation (GitHub Enterprise Only)

**File:** `hooks/pre-receive`

```bash
#!/bin/bash
# Pre-receive hook (server-side)
# Blocks pushes that violate branch discipline

while read oldrev newrev refname; do
  BRANCH=$(echo "$refname" | sed 's/refs\/heads\///')
  
  # Block direct pushes to main (except from CI or release automation)
  if [[ "$BRANCH" == "main" ]]; then
    if [[ -z "$GITHUB_ACTIONS" ]]; then
      echo "❌ ERROR: Direct pushes to 'main' are not allowed"
      echo "   Use pull requests through 'dev' branch"
      exit 1
    fi
  fi
  
  # Validate branch naming
  if ! [[ "$BRANCH" =~ ^(feat|fix|chore|refactor|docs|hotfix)/[a-z0-9-]+$|^(dev|main)$ ]]; then
    echo "❌ ERROR: Invalid branch name '$BRANCH'"
    echo "   Valid format: <type>/<description>"
    exit 1
  fi
done

exit 0
```

### Recommendation
**Skip this.** GitHub Actions provides equivalent enforcement without Enterprise requirement.

**Only consider if:**
- You already have GitHub Enterprise
- You need pre-push blocking (not just PR blocking)
- You want to prevent agents from even creating non-compliant branches remotely

---

## 🟡 Priority 5: Post-Merge Automation (SHOULD HAVE)

### Why Fifth?
- **Reduces toil** (auto-sync dev after main merge)
- **Doesn't prevent violations** (just cleans up after)
- **Can be done manually** (not critical for discipline)

### What It Automates
- Auto-sync `dev` with `main` after PR merge
- Auto-delete feature branches after merge
- Notify agents of sync completion

### Implementation

**File:** `.github/workflows/post-merge-automation.yml`

```yaml
name: Post-Merge Automation

on:
  pull_request:
    types: [closed]
    branches:
      - main
      - dev

jobs:
  sync-dev-after-main-merge:
    name: Sync dev ← main
    if: |
      github.event.pull_request.merged == true &&
      github.event.pull_request.base.ref == 'main' &&
      github.event.pull_request.head.ref == 'dev'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          ref: dev
          fetch-depth: 0
      
      - name: Sync dev with main
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          
          # Merge main into dev (fast-forward)
          git fetch origin main
          git merge origin/main --ff-only
          
          # Push updated dev
          git push origin dev
      
      - name: Notify team
        uses: slackapi/slack-github-action@v1
        if: success()
        with:
          payload: |
            {
              "text": "✅ Auto-synced: dev is now up-to-date with main",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "✅ *Auto-sync complete*\n`dev` branch synced with `main` after PR merge"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  delete-merged-branch:
    name: Delete merged feature branch
    if: |
      github.event.pull_request.merged == true &&
      github.event.pull_request.base.ref == 'dev'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    
    steps:
      - name: Delete feature branch
        run: |
          BRANCH="${{ github.event.pull_request.head.ref }}"
          
          # Only delete feature branches (not dev or main)
          if [[ "$BRANCH" =~ ^(feat|fix|chore|refactor|docs)/ ]]; then
            echo "🗑️ Deleting merged branch: $BRANCH"
            gh api \
              --method DELETE \
              "/repos/${{ github.repository }}/git/refs/heads/$BRANCH" \
              || echo "Branch already deleted"
          fi
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Rollout Plan
1. **Week 1:** Deploy automation workflow
2. **Week 2:** Monitor for issues, tune timing
3. **Week 3:** Add Slack notifications (optional)

### Escape Hatches
- **Manual override:** If automation fails, agents still know to sync manually
- **Rollback:** Disable workflow in emergency

---

## 📊 Enforcement Coverage Matrix

| Violation | GitHub Actions | Session Init | Git Hooks | Server Hooks | Automation |
|-----------|:--------------:|:------------:|:---------:|:------------:|:----------:|
| PR to main from feature | ✅ Blocked | 📖 Warned | ⚠️ Warned | ✅ Blocked | - |
| Branch from stale dev | ⚠️ Warned | 📖 Warned | ⚠️ Warned | - | - |
| Invalid branch name | ✅ Blocked | 📖 Warned | ⚠️ Warned | ✅ Blocked | - |
| Forgot to sync dev | - | 📖 Reminded | 📖 Reminded | - | ✅ Auto-fixed |
| Forgot to delete branch | - | 📖 Reminded | - | - | ✅ Auto-fixed |
| Direct push to main | ✅ Blocked* | - | ⚠️ Warned | ✅ Blocked | - |

*Protected by branch protection rules + GitHub Actions

**Legend:**
- ✅ **Blocked** = Hard stop, cannot proceed
- ⚠️ **Warned** = Shown warning, can bypass
- 📖 **Reminded** = Documentation/education
- **Auto-fixed** = Automated resolution

---

## 🏭 Industry Patterns & Best Practices

### What Leading Teams Do

#### 1. **Trunk-Based Development** (Google, Facebook)
- Short-lived feature branches (< 2 days)
- Merge to `main` frequently
- Feature flags for incomplete work
- **For AI agents:** Reduces merge conflicts, faster iteration

#### 2. **Git-Flow** (Traditional, what we use)
- `main` = production
- `dev` = integration
- `feature/*` = work in progress
- **For AI agents:** Clear promotion path, safer rollbacks

#### 3. **GitHub Flow** (GitHub, Vercel)
- Only `main` + feature branches
- Deploy from PRs directly
- **For AI agents:** Simpler, but requires strong CI/CD

### Multi-Agent Specific Challenges

| Challenge | Industry Solution | Our Implementation |
|-----------|------------------|-------------------|
| **Agents don't read docs** | Automation > documentation | Session init guards + CI |
| **Stale branches** | Auto-delete after merge | GitHub Actions automation |
| **Concurrent work** | Branch per task/agent | git-worktree (future enhancement) |
| **Merge conflicts** | Rebase before merge | GitHub Actions staleness check |
| **Forgotten syncs** | Automated promotion | Post-merge dev sync |

### Lessons from AI Coding Teams

**From OpenAI Codex team:**
- "Documentation is for humans. Enforcement is for AI."
- Use CI/CD as source of truth, not markdown files

**From GitHub Copilot team:**
- Branch per feature, merge fast
- Automated cleanup is non-negotiable
- Let humans review, let machines enforce

**From Anthropic (Claude):**
- Agents will optimize for merging, not for discipline
- Make the "right way" the "easy way"
- Block violations, don't warn

---

## 🚫 Anti-Patterns: What NOT to Do

### ❌ Don't: Rely on Documentation Alone
**Why:** Agents optimize for task completion, not reading docs  
**Do instead:** Enforce with CI/CD + inject rules into session memory

### ❌ Don't: Use Only Client-Side Hooks
**Why:** Can be bypassed with `--no-verify`  
**Do instead:** GitHub Actions as final gatekeeper

### ❌ Don't: Over-Engineer Server-Side Hooks
**Why:** Requires GitHub Enterprise, high maintenance  
**Do instead:** Use GitHub Actions (same enforcement, zero infra)

### ❌ Don't: Manual Branch Cleanup
**Why:** Agents forget, branches pile up  
**Do instead:** Auto-delete via GitHub Actions

### ❌ Don't: Warning-Only Enforcement
**Why:** Agents will ignore warnings  
**Do instead:** Hard blocks (PR cannot merge)

### ❌ Don't: One-Time Training
**Why:** Agents don't have long-term memory persistence  
**Do instead:** Session init guards (every session)

---

## 📁 File Placement Guide

### Where Each Piece Goes

```
cohortix/
├── .github/
│   └── workflows/
│       ├── branch-discipline.yml        # Priority 1: PR validation
│       └── post-merge-automation.yml    # Priority 5: Auto-sync/delete
│
├── .githooks/                           # Priority 3: Client hooks
│   ├── pre-push
│   ├── post-merge
│   └── install.sh
│
├── .agent-session-init.md               # Priority 2: Session guard (ROOT)
│
├── AGENTS.md                            # Add reference to .agent-session-init.md
├── CONTRIBUTING.md                      # Add reference to workflow rules
│
└── docs/
    ├── GIT_WORKFLOW.md                  # Existing workflow doc
    └── guides/
        └── GIT-WORKFLOW-ENFORCEMENT.md  # This document
```

### Integration with Existing Docs

**Update `docs/GIT_WORKFLOW.md`:**
```markdown
## Enforcement

See [docs/guides/GIT-WORKFLOW-ENFORCEMENT.md](./guides/GIT-WORKFLOW-ENFORCEMENT.md) for:
- GitHub Actions enforcement rules
- Agent session init guards
- Git hooks setup
```

**Update `README.md`:**
```markdown
## Git Workflow

**IMPORTANT:** Branch discipline is enforced by CI/CD. See `.agent-session-init.md` at session start.

Quick commands: [.agent-session-init.md](./.agent-session-init.md)
```

---

## 🎯 Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Add `.github/workflows/branch-discipline.yml`
- [ ] Add `.agent-session-init.md` to all repos
- [ ] Update `AGENTS.md` with reference
- [ ] Test on staging repo first

### Phase 2: Rollout (Week 2)
- [ ] Enable branch-discipline workflow on production repos
- [ ] Add as required check in branch protection
- [ ] Train agents: "Read `.agent-session-init.md` at session start"
- [ ] Monitor violations, tune rules

### Phase 3: Automation (Week 3)
- [ ] Add `.github/workflows/post-merge-automation.yml`
- [ ] Enable auto-sync of `dev` ← `main`
- [ ] Enable auto-delete of merged feature branches
- [ ] Add Slack notifications (optional)

### Phase 4: Local Tooling (Week 4)
- [ ] Add `.githooks/` to repos
- [ ] Create `scripts/install-hooks.sh`
- [ ] Run on all agent workspaces
- [ ] Add to agent onboarding checklist

### Phase 5: Metrics & Iteration (Ongoing)
- [ ] Track violation rate (GitHub Actions logs)
- [ ] Survey agents: "Do you see `.agent-session-init.md`?"
- [ ] Measure time-to-merge improvement
- [ ] Refine rules based on feedback

---

## 📈 Success Metrics

### Leading Indicators (Week 1-2)
- **Violation detection rate:** How many PRs blocked by GitHub Actions?
- **Agent awareness:** % of agents who read `.agent-session-init.md`
- **Time to fix:** How long from violation to correction?

### Lagging Indicators (Week 4+)
- **Stale branch count:** Trending down?
- **Merge conflict rate:** Fewer conflicts from stale branches?
- **Time to merge:** Faster due to fewer re-reviews?
- **Dev/main sync lag:** Time between main merge and dev sync?

### Target Goals (Month 1)
- ✅ 95%+ of PRs follow branch discipline (no violations)
- ✅ 100% of dev ← main syncs automated (no manual intervention)
- ✅ 90%+ of agents read session init at start
- ✅ 80%+ reduction in stale branches (> 10 commits behind)

---

## 🛠️ Troubleshooting

### "GitHub Actions says my PR is invalid, but I think it's correct"

**Check:**
1. Is your PR targeting `dev` (not `main`)?
2. Is your branch name valid? (e.g., `feat/user-auth`)
3. Did you branch from latest `dev`?

**If still blocked:**
- Check GitHub Actions logs for exact error
- Ask in #dev-help channel
- Emergency override: Contact repo admin

### "I need to bypass the rules for a hotfix"

**Valid exceptions:**
- `hotfix/*` branches CAN target `main` directly
- Repo admins can override branch protection (logged in audit)

**Process:**
1. Create `hotfix/your-fix` branch
2. PR to `main` (allowed for hotfix/*)
3. After merge, backport to `dev` immediately

### "Session init file not loading"

**Check:**
1. File exists: `.agent-session-init.md` in repo root
2. Agent framework configured to read it
3. Check agent logs for "Git workflow rules loaded"

**Fix:**
- Manually read file at session start
- Update agent framework init script

---

## 🔄 Maintenance

### Monthly Review
- Review GitHub Actions logs for patterns
- Check for false positives
- Tune staleness threshold (currently 10 commits)
- Update `.agent-session-init.md` based on common violations

### Quarterly Audit
- Survey agents: "What's painful about git workflow?"
- Measure improvement in metrics
- Update this document with learnings
- Consider new automation opportunities

### When Rules Change
1. Update `.agent-session-init.md` FIRST
2. Update `branch-discipline.yml` to match
3. Announce in team channel
4. Update this document

---

## 📚 References

### Internal Docs
- [Axon Codex v1.2](../GIT_WORKFLOW.md) - Official workflow spec
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contribution guide
- [AGENTS.md](../../AGENTS.md) - Agent operating instructions

### Git Documentation
- [Git Hooks](https://git-scm.com/docs/githooks) - Client-side and server-side hooks
- [GitHub Actions - PR Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

### Industry Resources
- [Trunk-Based Development](https://trunkbaseddevelopment.com/)
- [Git-Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

## 🤝 Contributing

Found a violation pattern not covered? Open a PR to update:
1. `.github/workflows/branch-discipline.yml` (add check)
2. `.agent-session-init.md` (add documentation)
3. This document (update coverage matrix)

---

**Maintained by:** Platform Team  
**Last Updated:** 2026-02-14  
**Version:** 1.0.0  
**Status:** 🟢 Active Enforcement

---

## Appendix: Quick Reference Cards

### For Agents: Git Workflow Cheat Sheet

```bash
# 🚀 Starting new work
git checkout dev && git pull origin dev
git checkout -b feat/my-feature

# 💾 During development
git add . && git commit -m "feat: description"
git push origin feat/my-feature

# 🔄 Before creating PR
git fetch origin dev && git rebase origin/dev
# Create PR targeting 'dev' (NOT main!)

# ✅ After PR merges
# If you merged dev → main:
git checkout dev && git pull origin main && git push origin dev

# Clean up
git branch -d feat/my-feature
git push origin --delete feat/my-feature
```

### For Reviewers: PR Checklist

- [ ] Branch name follows convention (`feat/`, `fix/`, etc.)
- [ ] PR targets `dev` (not `main`, unless it's `dev` → `main`)
- [ ] Branch is based on recent `dev` (< 10 commits behind)
- [ ] All CI checks pass (including branch-discipline workflow)
- [ ] Code quality meets standards

### For Admins: Emergency Override

```bash
# Bypass branch protection (GitHub UI)
Settings → Branches → Edit rule → Temporarily disable

# Manual dev sync (if automation fails)
git checkout dev
git pull origin main
git push origin dev

# Manual branch cleanup
git push origin --delete feat/abandoned-branch
```

---

**End of Document**
