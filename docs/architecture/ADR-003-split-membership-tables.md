# ADR-003 — Split Membership Tables

**Date:** 2026-02-28 **Status:** Accepted

## Context

The original `cohort_members` table modeled only agent membership. Sprint 1
introduced separate identity systems for users and agents, each with distinct
roles, permissions, and lifecycle behavior. We need clearer access control and
RLS policies without ambiguity between user and agent identities.

## Decision

We will **split membership tables** into:

- `cohort_user_members`
- `cohort_agent_members`

Each table owns its identity semantics, with separate unique constraints:
`unique(cohort_id, user_id)` and `unique(cohort_id, agent_id)`.

## Rationale

- **Security & RLS clarity:** Policies are simpler and explicit per identity
  type.
- **Data integrity:** Avoids mixed identifier collisions and null workarounds.
- **Performance:** Direct joins for each member type without conditional logic.
- **Extensibility:** Separate permissions for agents vs users without schema
  churn.

## Alternatives Considered

1. **Single table with discriminator column** (`member_type`):
   - Rejected due to complex RLS predicates and mixed constraints.
2. **Join table + polymorphic ID**:
   - Rejected due to weak FK integrity and unclear indexing.

## Consequences

- Data migration required from legacy `cohort_members`.
- API and query layers must join from the correct membership table.
- RLS policies and documentation must explicitly reference both tables.
