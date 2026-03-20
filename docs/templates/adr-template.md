**ADR Template:**
```markdown
# ADR-{number}: {Title}

<!-- Purpose: [Why this doc exists] -->
<!-- Owner: @[agent-or-human] -->
<!-- Last Reviewed: YYYY-MM-DD -->
<!-- Read After: [prerequisite doc path] -->

> **Purpose:** Record an architecture decision and its rationale
> **Owner:** @[decision-maker]
> **Last Reviewed:** YYYY-MM-DD
> **Read After:** ARCHITECTURE.md

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Rejected | Deprecated | Superseded

## Context
Orders have complex state transitions and need full audit trail for compliance.

## Decision
Use event sourcing with Kafka as event store.

## Consequences
- (+) Complete audit trail
- (+) Easy to add new projections
- (-) Eventually consistent reads
- (-) Higher operational complexity

## Compliance Check
- DO NOT use direct DB updates for order status
- MUST use event versioning for schema changes
```
