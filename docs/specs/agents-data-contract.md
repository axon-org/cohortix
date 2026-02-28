# Agents Data Contract (Sprint 1)

## Overview

Defines agent query outputs for personal/cohort/org scopes.

## Types

### Agent

- `id: string`
- `organizationId?: string | null`
- `ownerUserId?: string | null`
- `scopeType: "personal" | "cohort" | "org"`
- `scopeId: string`
- `defaultCohortId?: string | null`
- `name: string`
- `slug: string`
- `role?: string | null`
- `description?: string | null`
- `status: "active" | "idle" | "busy" | "offline" | "error"`
- `capabilities: string[]`
- `runtimeType: string`
- `runtimeConfig: object`
- `settings: object`

### AgentStats

```
{
  totalSessions: number,
  completedCount: number,
  successRate: number,
  avgResponseTimeMs: number
}
```

### EvolutionEvent

- `id: string`
- `agentId: string`
- `cohortId?: string | null`
- `scopeType: "personal" | "cohort" | "org"`
- `scopeId: string`
- `eventType: "learning" | "correction" | "milestone"`
- `summary: string`
- `metadata: object`
- `createdAt: string`

## Query Contracts

### `getAgents(scopeType, scopeId, filters)`

Returns agents scoped to personal/cohort/org.

### `getAgentById(id)`

Returns a single agent or `null`.

### `getAgentStats(id)`

Returns `AgentStats` summary.

### `getAgentEvolution(id, limit)`

Returns recent evolution events.

### `getAgentActiveMissions(id)`

Returns active tasks assigned to the agent with optional operation metadata.
