# Cohorts Data Contract (Sprint 1)

## Overview
Defines server-side data layer outputs for cohort queries. All data is scoped by
personal/shared access rules and uses Drizzle ORM.

## Types

### Cohort
- `id: string`
- `organizationId?: string | null` (null for personal)
- `type: "personal" | "shared"`
- `ownerUserId?: string | null`
- `name: string`
- `slug: string`
- `description?: string | null`
- `status: "active" | "paused" | "at-risk" | "completed"`
- `hosting: "managed" | "self_hosted"`
- `runtimeStatus: "provisioning" | "online" | "offline" | "error" | "paused"`
- `gatewayUrl?: string | null`
- `lastHeartbeatAt?: string | null`
- `startDate?: string | null`
- `endDate?: string | null`
- `memberCount: number`
- `engagementPercent: number`

### CohortUserMember
- `id: string`
- `cohortId: string`
- `userId: string`
- `role: "owner" | "admin" | "member" | "viewer"`
- `joinedAt: string`
- `updatedAt: string`
- `name?: string | null`
- `email?: string | null`
- `avatarUrl?: string | null`

### CohortAgentMember
- `id: string`
- `cohortId: string`
- `agentId: string`
- `role: "owner" | "admin" | "member" | "viewer"`
- `engagementScore: number`
- `joinedAt: string`
- `updatedAt: string`
- `name?: string | null`
- `slug?: string | null`
- `avatarUrl?: string | null`
- `status?: string | null`

## Query Contracts

### `getCohorts(orgId?, userId?, filters, pagination)`
Returns paginated cohorts for shared org or personal owner.

Response:
```
{
  cohorts: Cohort[],
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
}
```

Filters: `type`, `status`, `hosting`, `runtimeStatus`, `search`, `startDateFrom`, `startDateTo`, `sortBy`, `sortOrder`.

### `getCohortById(id)`
Returns a single Cohort or `null` if not found.

### `getCohortStats(id)`
```
{
  memberCount: number,
  engagementPercent: number,
  daysActive: number,
  status: string,
  startDate?: string | null,
  endDate?: string | null,
  activitySummary: {
    count: number,
    lastActivityAt: string | null
  }
}
```

### `getCohortUserMembers(cohortId)`
Returns `CohortUserMember[]`.

### `getCohortAgentMembers(cohortId)`
Returns `CohortAgentMember[]`.

### `getCohortActivity(cohortId, limit)`
Returns recent entries from `activity_log` for the cohort.
