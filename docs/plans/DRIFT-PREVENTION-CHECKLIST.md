# Drift Prevention & Detection Checklist

**Reference:** Axon Codex v1.2 §5.3 (Drift Prevention & Detection)  
**Frequency:** Weekly (Every Monday 9 AM)  
**Owner:** Guardian Agent + Platform Team  
**Last Updated:** 2026-02-11

---

## Purpose

Drift is the gradual divergence between documented standards and actual system
implementation. This checklist ensures the Cohortix platform remains aligned
with the Axon Codex and maintains consistency across all components.

**Types of Drift:**

- **Dependency Drift** — Outdated packages, security vulnerabilities
- **Configuration Drift** — Environment variables, TypeScript config, linting
  rules
- **Architectural Drift** — Undocumented API endpoints, pattern violations
- **Documentation Drift** — Stale docs, missing ADRs, outdated specs
- **Testing Drift** — Coverage degradation, missing tests, broken test pyramid

---

## Automated Drift Detection

### Run the Drift Detection Script

```bash
cd ~/Projects/cohortix
./scripts/drift-detection.sh
```

This script automaticagent checks:

- ✅ Outdated dependencies (`pnpm outdated`)
- ✅ Security vulnerabilities (`pnpm audit`)
- ✅ Environment variable alignment (`.env.example` vs `.env.local`)
- ✅ TypeScript strict mode compliance
- ✅ API documentation completeness
- ✅ File size violations (>500 lines)
- ✅ Test coverage threshold (80%+)
- ✅ Stale documentation (>90 days)

**Expected Output:**

- **Green (✅)** — No drift detected
- **Yellow (⚠️)** — Warnings (review but not blocking)
- **Red (🚨)** — Critical drift (requires immediate action)

---

## Manual Drift Checks

### 1. Dependency Drift (5 minutes)

**Weekly Actions:**

- [ ] Run `pnpm outdated` — review major version updates
- [ ] Run `pnpm audit` — check for security vulnerabilities
- [ ] Review Dependabot PRs — merge or dismiss with justification
- [ ] Check Snyk dashboard — verify no new high/critical issues

**Thresholds:**

- **Critical:** Any high/critical security vulnerabilities
- **Warning:** >10 minor version updates pending
- **Action:** Merge security patches within 7 days

**Escalate if:**

- Critical vulnerabilities with no patch available
- Major framework updates requiring migration (e.g., Next.js 15 → 16)

---

### 2. Configuration Drift (3 minutes)

**Weekly Actions:**

- [ ] Compare `.env.example` with `.env.local` — ensure all keys documented
- [ ] Verify `tsconfig.json` has `strict: true`
- [ ] Check `.eslintrc.js` includes all Codex-required rules
- [ ] Review `lighthouserc.json` thresholds — ensure aligned with Codex §3.5.1

**Thresholds:**

- **Critical:** TypeScript strict mode disabled, missing required env vars
- **Warning:** Extra env vars in `.env.local` not documented

**Escalate if:**

- Configuration changes required for production deployment
- Breaking changes to build/test configuration

---

### 3. Architectural Drift (10 minutes)

**Weekly Actions:**

- [ ] Scan `apps/web/app/api/` for new routes not in `docs/API_DESIGN.md`
- [ ] Check for components >300 lines — flag for refactoring
- [ ] Review recent commits for pattern violations (e.g., direct DB queries in
      components)
- [ ] Verify new features have corresponding specs in `docs/specs/`

**Thresholds:**

- **Critical:** API endpoints without OpenAPI specs, Server Components with
  `"use client"`
- **Warning:** Files >500 lines, undocumented new features

**Escalate if:**

- Architectural changes without ADR (e.g., new database, external API)
- Consistent pattern violations across multiple PRs

---

### 4. Documentation Drift (5 minutes)

**Weekly Actions:**

- [ ] Find docs not updated in 90+ days — review for accuracy
- [ ] Check for new packages without `README.md`
- [ ] Verify ADRs exist for recent major decisions
- [ ] Update `TECH-DEBT.md` with newly identified debt

**Thresholds:**

- **Critical:** Core docs (ARCHITECTURE.md, API_DESIGN.md) >6 months old
- **Warning:** Package docs >90 days old

**Escalate if:**

- Documentation contradicts actual implementation
- Missing specs for features in production

---

### 5. Testing Drift (5 minutes)

**Weekly Actions:**

- [ ] Run `pnpm test:coverage` — verify ≥80% coverage
- [ ] Check test pyramid distribution (70% unit / 20% integration / 10% E2E)
- [ ] Review for tests without assertions (`grep -L "expect"`)
- [ ] Verify critical user journeys have E2E tests

**Thresholds:**

- **Critical:** Coverage <80%, no E2E tests for payment flow
- **Warning:** Coverage trending downward (>5% drop in 2 weeks)

**Escalate if:**

- Coverage below 70% (blocking issue)
- E2E tests consistently failing or flaky

---

## Drift Remediation Workflow

When drift is detected:

### 1. Assess Severity

- **Critical (P0):** Blocks next deployment, requires immediate fix
- **High (P1):** Must fix within current sprint
- **Medium (P2):** Schedule for next sprint
- **Low (P3):** Track in tech debt log

### 2. Create Tracking Issue

```markdown
Title: [DRIFT] [Category] Brief description

**Type:** Dependency / Config / Architectural / Documentation / Testing
**Severity:** Critical / High / Medium / Low **Detected:** YYYY-MM-DD

**Description:** [What drifted and how]

**Impact:** [Risk if not addressed]

**Remediation Plan:**

- [ ] Step 1
- [ ] Step 2

**Target Resolution:** [Date]
```

### 3. Assign Owner

- **Dependency Drift** → DevOps / Guardian
- **Config Drift** → Platform Team
- **Architectural Drift** → Tech Lead / Architect
- **Documentation Drift** → Agent who created the feature
- **Testing Drift** → QA / Original developer

### 4. Implement Fix

- Follow Codex standards (§5.1 Change Management)
- Create ADR if architectural change required
- Update documentation
- Add tests to prevent regression

### 5. Verify Resolution

- Re-run drift detection script
- Confirm green status
- Update tracking issue
- Store learning in Mem0

---

## Drift Prevention Best Practices

### During Development

- **Pre-commit:** Run linters and type-check
- **Before PR:** Run full test suite and coverage check
- **During Code Review:** Verify specs exist and are accurate
- **Before Merge:** Ensure CI passes all security gates

### During Sprint Planning

- Allocate 10% of sprint capacity to drift remediation
- Review tech debt log and prioritize fixes
- Schedule dependency updates quarterly

### During Retrospectives

- Review drift metrics (trend over time)
- Identify root causes of recurring drift
- Update this checklist with new prevention measures

---

## Metrics & Reporting

### Weekly Drift Report

**Template:**

```markdown
# Drift Detection Report — [YYYY-MM-DD]

## Summary

- **Critical Issues:** X
- **Warnings:** Y
- **Status:** 🟢 Healthy / 🟡 Needs Attention / 🔴 Critical

## Details

### Dependency Drift

[Findings]

### Configuration Drift

[Findings]

### Architectural Drift

[Findings]

### Documentation Drift

[Findings]

### Testing Drift

[Findings]

## Recommendations

1. [Action item 1]
2. [Action item 2]

## Follow-up

- Issues created: [Links]
- Target resolution: [Date]
```

**Distribution:**

- Post to `#platform-health` (Discord)
- Email to Platform Team
- Store in `docs/drift-reports/YYYY-MM-DD.md`

### Monthly Trend Analysis

Track over time:

- Drift incident count (by category)
- Mean time to remediation (MTTR)
- Recurring drift patterns
- Effectiveness of prevention measures

**Goal:** Reduce drift incidents by 20% quarter-over-quarter.

---

## Tool Integration

### Automated Monitoring

**Dependabot (GitHub):**

- Enabled: ✅
- Alert on: High/Critical vulnerabilities
- Auto-merge: Patch updates only

**Snyk (CI/CD):**

- Enabled: ✅
- Scan frequency: Every PR
- Fail threshold: High/Critical vulnerabilities

**Lighthouse CI:**

- Enabled: ✅
- Budgets enforced: LCP, INP, CLS, bundle size
- Fail on regression: Yes

### Scheduled Cron Jobs

**Recommended:**

```bash
# Weekly drift detection (Mondays 9 AM)
0 9 * * 1 cd ~/Projects/cohortix && ./scripts/drift-detection.sh | tee -a logs/drift-$(date +\%Y-\%m-\%d).log

# Daily dependency audit (weekdays 6 AM)
0 6 * * 1-5 cd ~/Projects/cohortix && pnpm audit --audit-level=high
```

---

## Escalation Path

| Severity     | First Response     | Escalate To         | Timeline      |
| ------------ | ------------------ | ------------------- | ------------- |
| **Critical** | Guardian Agent     | CEO + Platform Team | Immediate     |
| **High**     | Platform Team      | Tech Lead           | Within 24h    |
| **Medium**   | Original Developer | Team Lead           | Within 1 week |
| **Low**      | Track in Tech Debt | Sprint Planning     | Next sprint   |

---

## Revision History

| Date       | Change                    | Author           |
| ---------- | ------------------------- | ---------------- |
| 2026-02-11 | Initial checklist created | Guardian (Hafiz) |

---

_Next Review: 2026-03-11 (Monthly review)_
