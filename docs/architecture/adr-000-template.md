# ADR-000: [Title of Decision]

**Status:** Proposed | Accepted | Deprecated | Superseded  
**Date:** YYYY-MM-DD  
**Author:** [Agent Name]  
**Reviewers:** [Reviewer names]  
**Related ADRs:** [Links to related ADRs if any]

---

## Context

**What is the problem or situation that requires a decision?**

[Describe the architectural challenge, technical debt, or requirement that necessitates a decision. Provide enough context for someone reading this 6 months from now to understand why this decision was made.]

**Constraints:**
- [Constraint 1: e.g., Must support 10,000 concurrent users]
- [Constraint 2: e.g., Budget limited to $X/month for infrastructure]
- [Constraint 3: e.g., Must integrate with existing authentication system]

**Assumptions:**
- [Assumption 1: e.g., User traffic will grow 2x per year]
- [Assumption 2: e.g., Team has expertise in Technology X]

---

## Decision

**What is the change that we're proposing and/or doing?**

[State the decision clearly and unambiguously. Be specific.]

**Example:**  
"We will use PostgreSQL as our primary relational database instead of MongoDB."

**Rationale:**

1. **Reason 1:** [Why this option is the best choice]
2. **Reason 2:** [Supporting evidence, benchmarks, or research]
3. **Reason 3:** [How it aligns with project goals]

---

## Options Considered

### Option 1: [Option Name]

**Pros:**
- [Pro 1]
- [Pro 2]

**Cons:**
- [Con 1]
- [Con 2]

**Why not chosen:**  
[Explain why this option was rejected]

---

### Option 2: [Option Name] ✅ **SELECTED**

**Pros:**
- [Pro 1]
- [Pro 2]

**Cons:**
- [Con 1]
- [Con 2]

**Why chosen:**  
[Explain why this is the best option]

---

### Option 3: [Option Name]

**Pros:**
- [Pro 1]

**Cons:**
- [Con 1]
- [Con 2]

**Why not chosen:**  
[Explain why this option was rejected]

---

## Consequences

### Positive Consequences

**What are the benefits of this decision?**

- ✅ [Benefit 1: e.g., Improved performance by 50%]
- ✅ [Benefit 2: e.g., Reduced operational complexity]
- ✅ [Benefit 3: e.g., Better alignment with industry standards]

### Negative Consequences

**What are the trade-offs or downsides?**

- ❌ [Downside 1: e.g., Requires team training on new technology]
- ❌ [Downside 2: e.g., Migration cost estimated at X hours]
- ❌ [Downside 3: e.g., Vendor lock-in risk]

### Mitigation Strategies

**How do we address the negative consequences?**

- [Mitigation 1: e.g., Schedule 2-day training workshop]
- [Mitigation 2: e.g., Create migration runbook with rollback plan]
- [Mitigation 3: e.g., Use abstraction layer to reduce vendor lock-in]

---

## Implementation

### Action Items

**What needs to be done to implement this decision?**

- [ ] [Task 1: e.g., Set up PostgreSQL in production]
- [ ] [Task 2: e.g., Migrate existing data from MongoDB]
- [ ] [Task 3: e.g., Update documentation and developer guides]
- [ ] [Task 4: e.g., Train team on PostgreSQL best practices]

**Owner:** [Agent or person responsible]  
**Deadline:** [YYYY-MM-DD or "End of Sprint X"]

### Validation Criteria

**How will we know this decision was successful?**

- [ ] [Success metric 1: e.g., Query performance improves by 30%]
- [ ] [Success metric 2: e.g., Zero data loss during migration]
- [ ] [Success metric 3: e.g., Developer onboarding time reduced]

**Review Date:** [YYYY-MM-DD — When to reassess this decision]

---

## References

**Supporting Documents:**
- [Link to research doc, benchmark results, or external articles]
- [Link to related specs or RFCs]
- [Link to vendor documentation or best practices]

**Related Work:**
- [ADR-XXX: Related architectural decision]
- [Spec FEAT-XXX: Feature that depends on this decision]

---

## Status History

| Date | Status | Notes |
|------|--------|-------|
| YYYY-MM-DD | Proposed | Initial draft by [Author] |
| YYYY-MM-DD | Accepted | Approved by [Reviewer] |
| YYYY-MM-DD | Deprecated | Superseded by ADR-XXX |

---

## Notes

[Any additional context, discussions, or future considerations that don't fit above.]

---

*This template follows the Axon Codex v1.2 ADR Standards (§5.1.3).*
