#### 1.4.2 Specification Template

```markdown
# Spec: [Feature Name]

<!-- Purpose: [Why this doc exists] -->
<!-- Owner: @[agent-or-human] -->
<!-- Last Reviewed: YYYY-MM-DD -->
<!-- Read After: [prerequisite doc path] -->

> **Purpose:** [One-line reason this spec exists]
> **Owner:** @[agent-or-human]
> **Last Reviewed:** YYYY-MM-DD
> **Read After:** PROJECT_BRIEF.md

**ID:** feat-XXX
**Status:** Draft | Under Review | Approved | In Progress | Complete
**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD

---

## Context
[Why this feature exists, what problem it solves — 2-3 sentences]

---

## Requirements

### Functional Requirements
- [ ] [Requirement 1] (MUST)
- [ ] [Requirement 2] (MUST)
- [ ] [Requirement 3] (SHOULD)
- [ ] [Requirement 4] (MAY)

### Non-Functional Requirements
- **Performance:** [e.g., Response time < 200ms for 95th percentile]
- **Security:** [e.g., Input validation, authentication requirements]
- **Scalability:** [e.g., Support 1000 concurrent users]
- **Accessibility:** [e.g., WCAG 2.1 AA compliance]

---

## Architecture

### Technology Stack
- [List technologies, frameworks, libraries]

### Data Models
[Define data structures, relationships, constraints]

### API Contracts
[Define endpoints, request/response formats]

### Security Boundaries
[Define authentication, authorization, data protection]

### Feature Flag
- **Flag name:** `release.<domain>.<feature-name>`
- **Rollout plan:** internal → 5% → 25% → 100%

---

## Design References
> Skip this section for backend-only features.

- **Approved mockups:** `docs/design/mockups/screens/<screen-name>/`
- **Screen specs:** `docs/design/screen-specs.md` (relevant sections)
- **Design tokens:** `docs/design/design-brief.md`

---

## Edge Cases
- What if [X] fails?
- What if user does [Y]?
- What if [external dependency] is unavailable?

---

## Dependencies

### Agent Dependencies
- **To Frontend (@agent-frontend):** [What they need to build]
- **To Backend (@agent-backend):** [What they need to build]
- **To QA (@agent-qa):** [Test plan creation]
- **To DevOps (@agent-devops):** [Deployment configuration]

### System Dependencies
- [External services, APIs, databases]

---

## Testing Strategy
- **Unit tests:** [What to cover]
- **Integration tests:** [What to cover]
- **E2E tests:** [Critical paths to cover]

---

## Acceptance Criteria
- [ ] AC1: Given [context], when [action], then [expected result]
- [ ] AC2: Given [context], when [action], then [expected result]
- [ ] All tests pass with >80% coverage
- [ ] Security scan clean (no high/critical vulnerabilities)
- [ ] Performance requirements met

---

## Timeline
- **Spec Approval:** YYYY-MM-DD
- **Implementation Complete:** YYYY-MM-DD
- **QA Complete:** YYYY-MM-DD
- **Production Deploy:** YYYY-MM-DD

---

## Notes
[Additional context, technical debt, future considerations]
```
