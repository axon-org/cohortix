# CI/CD Security Gates — Assessment & Enhancement

**Date:** 2026-02-11  
**Author:** Guardian (Hafiz)  
**Codex Reference:** Axon Codex v1.2 §4.9 (Security Gates)

---

## Current State Assessment

### ✅ Existing Security Scanning (As of 2026-02-11)

| Tool           | Stage        | Coverage                                      | Status    |
| -------------- | ------------ | --------------------------------------------- | --------- |
| **TruffleHog** | Commit Stage | Secret scanning (all commits)                 | ✅ Active |
| **Semgrep**    | PR Stage     | SAST (security-audit, secrets, JS, TS, React) | ✅ Active |
| **pnpm audit** | PR Stage     | Dependency vulnerability scan                 | ✅ Active |
| **ESLint**     | Commit Stage | Code quality & security linting               | ✅ Active |

### ❌ Missing Security Scanning

| Tool                           | Purpose                                                | Priority | Action                        |
| ------------------------------ | ------------------------------------------------------ | -------- | ----------------------------- |
| **Snyk**                       | Comprehensive dependency scanning + container scanning | **HIGH** | Add to PR stage               |
| **Container Scanning (Trivy)** | Docker image vulnerability scanning                    | Medium   | Future enhancement            |
| **DAST**                       | Runtime vulnerability testing                          | Medium   | Future (staging env required) |

---

## Enhancement Plan

### 1. Add Snyk Dependency Scanning

**Why Snyk over just pnpm audit?**

- Snyk provides **vulnerability database** with detailed remediation advice
- **License compliance** checking
- **Continuous monitoring** (beyond just CI/CD)
- **Auto-fix PRs** for known vulnerabilities
- **OWASP Agentic Top 10** awareness (AI/ML dependencies)

**Implementation:**

```yaml
# Add to .github/workflows/ci.yml (PR Stage)

snyk-scan:
  name: Snyk Security Scan
  runs-on: ubuntu-latest
  timeout-minutes: 10
  if: github.event_name == 'pull_request'
  needs: [lint, type-check, unit-test, secret-scan]
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}

    - name: Run Snyk to check for vulnerabilities
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high --fail-on=upgradable
```

**Required Setup:**

1. Sign up for Snyk account (free tier supports OSS projects)
2. Generate Snyk API token
3. Add `SNYK_TOKEN` to GitHub Secrets
4. Configure Snyk project in dashboard

**Severity Threshold:**

- **Commit Stage:** Skip (too slow for fast feedback)
- **PR Stage:** High/Critical only (fail CI)
- **Scheduled:** All severities (weekly monitoring)

---

### 2. Enhanced Secret Scanning Configuration

**Current TruffleHog Config:**

```yaml
- name: TruffleHog OSS
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.repository.default_branch }}
    head: HEAD
    extra_args: --debug --only-verified
```

**Enhancement Recommendation:**

```yaml
# Add custom entropy rules for API keys specific to our stack

- name: TruffleHog OSS (Enhanced)
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.repository.default_branch }}
    head: HEAD
    extra_args: >-
      --debug --only-verified --json --fail
```

**Additional Custom Checks:**

- Clerk API keys (`sk_live_`, `pk_live_`)
- Supabase keys (`eyJhbGciOi...`)
- OpenAI API keys (`sk-proj-...`, `sk-...`)
- GitHub tokens (`ghp_`, `gho_`)

---

### 3. Semgrep SAST Enhancement

**Current Config:**

```yaml
config: >-
  p/security-audit p/secrets p/javascript p/typescript p/react
```

**Enhanced Config (Add OWASP & Supply Chain Rules):**

```yaml
config: >-
  p/security-audit p/secrets p/javascript p/typescript p/react p/owasp-top-ten
  p/supply-chain p/xss p/sql-injection
```

**Why:** Aligns with Codex §2.5 (Security Standards) and §2.12 (AI Security /
OWASP Agentic Top 10).

---

### 4. Supply Chain Security (Provenance)

**Add SLSA Provenance Tracking:**

```yaml
# Generate provenance attestation for builds
- name: Generate provenance
  uses: actions/attest-build-provenance@v1
  with:
    subject-path: 'dist/**'
```

**Purpose:**

- Track source of every build artifact
- Verify no tampering in supply chain
- Required for SOC 2 compliance (future)

---

## Security Gate Quality Thresholds

### Commit Stage (<5 minutes — Fast Feedback)

| Gate       | Threshold              | Action on Failure              |
| ---------- | ---------------------- | ------------------------------ |
| ESLint     | Zero errors            | Block commit (pre-commit hook) |
| Prettier   | Must pass format check | Block commit (pre-commit hook) |
| TruffleHog | Zero verified secrets  | Block commit (fail CI)         |
| Unit Tests | 100% pass              | Block commit (fail CI)         |

### PR Stage (<15 minutes — Comprehensive Check)

| Gate              | Threshold                          | Action on Failure                  |
| ----------------- | ---------------------------------- | ---------------------------------- |
| Full Test Suite   | ≥80% coverage, 100% pass           | Block merge                        |
| Semgrep SAST      | Zero high/critical issues          | Block merge                        |
| Snyk Dependencies | Zero high/critical vulnerabilities | Block merge (with override option) |
| pnpm audit        | Zero high/critical vulnerabilities | Block merge                        |
| Type Check        | Zero TypeScript errors             | Block merge                        |

**Override Policy:**

- High/Critical vulnerabilities: Requires PM approval + documented exception
- Medium vulnerabilities: Can merge with tracking issue created
- Low/Info vulnerabilities: Log only, no blocking

---

## OWASP Top 10 (2021) Alignment

| OWASP Risk                         | Mitigated By                                         | Status             |
| ---------------------------------- | ---------------------------------------------------- | ------------------ |
| **A01: Broken Access Control**     | Supabase RLS + RBAC checks                           | ✅ Implemented     |
| **A02: Cryptographic Failures**    | TLS everywhere, Supabase encryption                  | ✅ Implemented     |
| **A03: Injection**                 | Semgrep (SQL injection rules), Parameterized queries | ✅ Scanned         |
| **A04: Insecure Design**           | Spec-driven development, Threat modeling (TODO)      | ⚠️ Partial         |
| **A05: Security Misconfiguration** | Security headers in middleware, Snyk config scan     | ✅ Implemented     |
| **A06: Vulnerable Components**     | Snyk, pnpm audit, Dependabot                         | ✅ Enhanced (Snyk) |
| **A07: Authentication Failures**   | Supabase Auth + MFA, Session management              | ✅ Implemented     |
| **A08: Software/Data Integrity**   | TruffleHog, Provenance attestation                   | ✅ Enhanced        |
| **A09: Logging Failures**          | Structured logging (see OBSERVABILITY.md)            | ⏳ In Progress     |
| **A10: SSRF**                      | Semgrep SSRF rules, Input validation                 | ✅ Scanned         |

---

## OWASP Agentic Top 10 (AI-Specific Risks)

| Risk                                    | Mitigated By                         | Status          |
| --------------------------------------- | ------------------------------------ | --------------- |
| **LLM01: Prompt Injection**             | Input sanitization, Prompt templates | 🔍 To Audit     |
| **LLM02: Insecure Output Handling**     | Output validation, XSS prevention    | ✅ Implemented  |
| **LLM03: Training Data Poisoning**      | N/A (using hosted models)            | ✅ N/A          |
| **LLM04: Model Denial of Service**      | Rate limiting, Token budgets         | 🔍 To Implement |
| **LLM05: Supply Chain Vulnerabilities** | Snyk, Semgrep supply-chain rules     | ✅ Enhanced     |
| **LLM06: Sensitive Info Disclosure**    | PII filtering, Logging sanitization  | 🔍 To Audit     |
| **LLM07: Insecure Plugin Design**       | N/A (no plugins yet)                 | ✅ N/A          |
| **LLM08: Excessive Agency**             | Agent permission boundaries          | 🔍 To Audit     |
| **LLM09: Overreliance**                 | Human-in-the-loop for critical ops   | 🔍 To Implement |
| **LLM10: Model Theft**                  | N/A (using hosted models)            | ✅ N/A          |

**Action Items:**

- [ ] Audit prompt injection vectors in agent input forms
- [ ] Implement token budget monitoring (see OBSERVABILITY.md)
- [ ] Define agent permission boundaries (RBAC for agents)
- [ ] Add human approval gates for high-risk agent actions

---

## Implementation Checklist

### Week 2 (Current Sprint) — Security Gates

- [x] Document existing security scanning
- [x] Assess gaps (Snyk, OWASP alignment)
- [ ] Add Snyk to CI/CD pipeline
- [ ] Enhance Semgrep with OWASP rules
- [ ] Test security gate failure scenarios
- [ ] Document override procedures

### Week 3 — Supply Chain Security

- [ ] Add SLSA provenance generation
- [ ] Enable Dependabot alerts
- [ ] Configure Snyk continuous monitoring
- [ ] Set up weekly dependency update workflow

### Month 2 — Advanced Security

- [ ] Add container scanning (Trivy) when Docker is introduced
- [ ] Implement DAST when staging environment is ready
- [ ] Set up security dashboard (aggregate all scan results)

---

## Monitoring & Alerts

**Security Scan Failure Alerts:**

- **Slack Channel:** `#security-alerts` (to be created)
- **Trigger:** Any high/critical vulnerability detected
- **Escalation:** Immediate notification to Guardian + Dev team

**Weekly Security Report:**

- Summary of all scan results
- Trend analysis (improving/degrading)
- Open vulnerabilities requiring remediation

---

## Success Metrics

| Metric                                                | Target      | Current | Status        |
| ----------------------------------------------------- | ----------- | ------- | ------------- |
| **Secrets exposed in commits**                        | 0           | 0       | ✅ On Track   |
| **High/Critical vulnerabilities in production**       | 0           | TBD     | 🔍 To Measure |
| **Mean time to remediate (MTTR) for vulnerabilities** | <7 days     | TBD     | 🔍 To Measure |
| **Security scan coverage**                            | 100% of PRs | 100%    | ✅ On Track   |
| **False positive rate**                               | <10%        | TBD     | 🔍 To Measure |

---

## References

- **Axon Codex v1.2 §4.9:** Security Gates
- **Axon Codex v1.2 §2.5:** Security Standards (OWASP Top 10)
- **Axon Codex v1.2 §2.12:** AI Security (OWASP Agentic Top 10)
- **Snyk Documentation:** https://docs.snyk.io/
- **Semgrep Rules:** https://semgrep.dev/explore
- **TruffleHog:** https://github.com/trufflesecurity/trufflehog

---

_Document maintained by: Guardian (Hafiz)_  
_Next review: 2026-03-01 (Monthly security review)_
