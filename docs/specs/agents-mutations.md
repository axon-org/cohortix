# Agents Mutations (Sprint 1)

## Overview

Write operations for agents using Drizzle ORM. Inputs validated via
`apps/web/src/lib/validations/agents.ts`.

## Mutations

### `createAgent(data)`

Creates a new agent with scope validation (personal/cohort/org).

### `createCloneAgent(userId, cohortId, foundationData)`

Provisions the default Clone agent for a user and assigns default cohort.

### `updateAgent(id, data)`

Updates agent configuration/settings.

### `deleteAgent(id)`

Soft deletes an agent by setting status to `offline`.

### `recordEvolutionEvent(agentId, type, summary, metadata)`

Logs an evolution event (learning/correction/milestone).
