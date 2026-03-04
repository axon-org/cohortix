# Cohorts Mutations (Sprint 1)

## Overview

Write operations for cohorts using Drizzle ORM. All inputs validated via
`apps/web/src/lib/validations/cohorts.ts`.

## Mutations

### `createCohort(data)`

Creates a personal or shared cohort.

- Personal: `type="personal"`, `ownerUserId` required, `organizationId` null.
- Shared: `type="shared"`, `organizationId` required.

### `provisionPersonalCohort(userId, firstName)`

Creates a personal cohort named `"<FirstName>'s Cohort"`.

### `updateCohort(id, data)`

Updates cohort fields (name, description, status, hosting, runtimeStatus,
start/end dates, settings).

### `deleteCohort(id)`

Soft-delete cohort by setting `status="completed"`.

### `addUserMember({ cohortId, userId, role })`

Adds a user member to cohort.

### `addAgentMember({ cohortId, agentId, role })`

Adds an agent member to cohort.

### `removeMember({ cohortId, memberId, type })`

Removes a user or agent member.

### `updateMemberRole({ cohortId, memberId, role, type })`

Updates role for a user or agent member.
