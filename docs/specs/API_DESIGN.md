# Agent Command Center — API Design

> RESTful API specification with authentication, rate limiting, and real-time
> events

_Version: 1.0.0 | Last Updated: 2026-02-05_

---

## Overview

Agent Command Center exposes a RESTful API with the following characteristics:

- **Versioned**: All endpoints prefixed with `/api/v1/`
- **JSON**: Request and response bodies use JSON
- **Authenticated**: JWT-based authentication via Clerk
- **Rate Limited**: Tiered limits based on plan
- **Real-time**: Server-Sent Events for live updates

---

## Base URL

```
Production:  https://app.agentcommandcenter.com/api/v1
Staging:     https://staging.agentcommandcenter.com/api/v1
Development: http://localhost:3000/api/v1
```

---

## Authentication

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

 ┌────────┐              ┌──────────┐                 ┌─────────────┐
 │ Client │              │ Supabase │                 │     API     │
 └───┬────┘              └────┬─────┘                 └──────┬──────┘
     │                        │                              │
     │  1. Sign In            │                              │
     │  (email/OAuth/magic)   │                              │
     │───────────────────────▶│                              │
     │                        │                              │
     │  2. JWT + Session      │                              │
     │     (httpOnly cookie)  │                              │
     │◀───────────────────────│                              │
     │                        │                              │
     │  3. API Request with JWT cookie                       │
     │──────────────────────────────────────────────────────▶│
     │                        │                              │
     │                        │  4. Verify JWT via JWKS      │
     │                        │◀─────────────────────────────│
     │                        │                              │
     │                        │  5. JWT Valid + User Claims  │
     │                        │─────────────────────────────▶│
     │                        │                              │
     │                        │  6. RLS automatically filters│
     │                        │     based on auth.uid()      │
     │                        │                              │
     │  7. Response                                          │
     │◀──────────────────────────────────────────────────────│
```

### Request Headers

```http
Content-Type: application/json
Accept: application/json
X-Organization-ID: org_xxx  # Optional: Specify org context (if user has multiple)

# JWT is automatically sent via httpOnly cookie
# No Authorization header needed (more secure)
# For API keys (server-to-server): Authorization: Bearer <supabase_service_key>
```

### Authentication Errors

| Status | Code                | Description                      |
| ------ | ------------------- | -------------------------------- |
| 401    | `UNAUTHORIZED`      | Missing or invalid token         |
| 403    | `FORBIDDEN`         | Token valid but lacks permission |
| 403    | `ORG_ACCESS_DENIED` | User not member of organization  |

---

## Rate Limiting

### Limits by Plan

| Plan       | Requests/Min | Requests/Hour | Requests/Day |
| ---------- | ------------ | ------------- | ------------ |
| Free       | 60           | 1,000         | 10,000       |
| Pro        | 300          | 10,000        | 100,000      |
| Enterprise | 1,000        | 50,000        | Unlimited    |

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1706140800
X-RateLimit-Policy: 60;w=60
```

### Rate Limit Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 30 seconds.",
    "retryAfter": 30
  }
}
```

---

## Response Format

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-02-05T10:00:00.000Z"
  }
}
```

### Paginated Response

```json
{
  "data": [ ... ],
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-02-05T10:00:00.000Z"
  },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      },
      {
        "field": "dueDate",
        "message": "Due date must be in the future"
      }
    ]
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-02-05T10:00:00.000Z"
  }
}
```

### Error Codes

| Code                  | HTTP Status | Description                         |
| --------------------- | ----------- | ----------------------------------- |
| `VALIDATION_ERROR`    | 400         | Request validation failed           |
| `UNAUTHORIZED`        | 401         | Authentication required             |
| `FORBIDDEN`           | 403         | Permission denied                   |
| `NOT_FOUND`           | 404         | Resource not found                  |
| `CONFLICT`            | 409         | Resource conflict (e.g., duplicate) |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests                   |
| `INTERNAL_ERROR`      | 500         | Server error                        |

---

## API Endpoints

### Missions

#### List Missions

```http
GET /api/v1/missions
```

**Query Parameters:** | Parameter | Type | Default | Description |
|-----------|------|---------|-------------| | `page` | integer | 1 | Page
number | | `pageSize` | integer | 20 | Items per page (max: 100) | | `status` |
string | - | Filter by status | | `workspaceId` | uuid | - | Filter by workspace
| | `ownerId` | uuid | - | Filter by owner | | `ownerType` | string | - | `user`
or `agent` | | `search` | string | - | Search in name/description | | `sortBy` |
string | `createdAt` | Sort field | | `sortOrder` | string | `desc` | `asc` or
`desc` |

**Response:**

```json
{
  "data": [
    {
      "id": "proj_abc123",
      "name": "Agent Command Center",
      "slug": "agent-command-center",
      "description": "Main mission for ACC development",
      "status": "active",
      "ownerType": "user",
      "ownerId": "user_xyz",
      "owner": {
        "id": "user_xyz",
        "name": "Ahmad",
        "avatarUrl": "https://..."
      },
      "workspaceId": "ws_123",
      "color": "#4F46E5",
      "icon": "rocket",
      "startDate": "2026-02-01",
      "targetDate": "2026-06-01",
      "taskCounts": {
        "total": 50,
        "completed": 20,
        "inProgress": 10
      },
      "createdAt": "2026-02-01T10:00:00.000Z",
      "updatedAt": "2026-02-05T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### Get Mission

```http
GET /api/v1/missions/:projectId
```

**Response:**

```json
{
  "data": {
    "id": "proj_abc123",
    "name": "Agent Command Center",
    "slug": "agent-command-center",
    "description": "Main mission for ACC development",
    "status": "active",
    "ownerType": "user",
    "ownerId": "user_xyz",
    "owner": {
      "id": "user_xyz",
      "name": "Ahmad",
      "avatarUrl": "https://..."
    },
    "workspaceId": "ws_123",
    "workspace": {
      "id": "ws_123",
      "name": "Engineering"
    },
    "goalId": "goal_456",
    "goal": {
      "id": "goal_456",
      "title": "Launch ACC MVP"
    },
    "color": "#4F46E5",
    "icon": "rocket",
    "startDate": "2026-02-01",
    "targetDate": "2026-06-01",
    "settings": {},
    "agents": [
      {
        "id": "agent_dev",
        "name": "Devi",
        "role": "contributor"
      }
    ],
    "taskCounts": {
      "total": 50,
      "backlog": 10,
      "todo": 8,
      "inProgress": 10,
      "review": 2,
      "done": 20,
      "cancelled": 0
    },
    "createdAt": "2026-02-01T10:00:00.000Z",
    "updatedAt": "2026-02-05T10:00:00.000Z"
  }
}
```

#### Create Mission

```http
POST /api/v1/missions
```

**Request Body:**

```json
{
  "name": "New Mission",
  "description": "Mission description",
  "workspaceId": "ws_123",
  "ownerType": "user",
  "ownerId": "user_xyz",
  "color": "#4F46E5",
  "icon": "folder",
  "startDate": "2026-02-01",
  "targetDate": "2026-06-01",
  "goalId": "goal_456"
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": "proj_new123",
    "name": "New Mission",
    "slug": "new-mission",
    ...
  }
}
```

#### Update Mission

```http
PATCH /api/v1/missions/:projectId
```

**Request Body:** (partial update)

```json
{
  "name": "Updated Name",
  "status": "completed"
}
```

#### Delete Mission

```http
DELETE /api/v1/missions/:projectId
```

**Response:** `204 No Content`

---

### Actions

#### List Actions

```http
GET /api/v1/actions
GET /api/v1/missions/:projectId/actions
```

**Query Parameters:** | Parameter | Type | Default | Description |
|-----------|------|---------|-------------| | `projectId` | uuid | - | Filter
by project | | `status` | string | - | Filter by status (comma-separated) | |
`priority` | string | - | Filter by priority | | `assigneeId` | uuid | - |
Filter by assignee | | `assigneeType` | string | - | `user`, `agent`, or
`unassigned` | | `dueDate[gte]` | date | - | Due date after | | `dueDate[lte]` |
date | - | Due date before | | `tags` | string | - | Filter by tags
(comma-separated) | | `includeSubtasks` | boolean | false | Include subtasks |

**Response:**

```json
{
  "data": [
    {
      "id": "task_abc123",
      "projectId": "proj_abc123",
      "parentTaskId": null,
      "title": "Design database schema",
      "description": "Create comprehensive DB schema...",
      "status": "in_progress",
      "priority": "high",
      "assigneeType": "agent",
      "assigneeId": "agent_architect",
      "assignee": {
        "id": "agent_architect",
        "name": "Architect",
        "avatarUrl": "https://...",
        "type": "agent"
      },
      "dueDate": "2026-02-10T18:00:00.000Z",
      "startedAt": "2026-02-05T09:00:00.000Z",
      "completedAt": null,
      "orderIndex": 1,
      "estimatedHours": 8,
      "actualHours": 4.5,
      "tags": ["architecture", "database"],
      "subtaskCount": 3,
      "commentCount": 5,
      "dependencies": {
        "blockedBy": [],
        "blocks": ["task_xyz"]
      },
      "createdAt": "2026-02-01T10:00:00.000Z",
      "updatedAt": "2026-02-05T10:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

#### Get Action

```http
GET /api/v1/actions/:taskId
```

**Query Parameters:** | Parameter | Type | Default | Description |
|-----------|------|---------|-------------| | `includeComments` | boolean |
false | Include comments | | `includeSubtasks` | boolean | true | Include
subtasks | | `includeTimeEntries` | boolean | false | Include time entries |

#### Create Action

```http
POST /api/v1/actions
POST /api/v1/missions/:projectId/actions
```

**Request Body:**

```json
{
  "projectId": "proj_abc123",
  "parentTaskId": null,
  "title": "Implement login page",
  "description": "Create login page with...",
  "status": "todo",
  "priority": "high",
  "assigneeType": "agent",
  "assigneeId": "agent_dev",
  "dueDate": "2026-02-15T18:00:00.000Z",
  "estimatedHours": 4,
  "tags": ["frontend", "auth"],
  "milestoneId": "ms_123"
}
```

#### Update Action

```http
PATCH /api/v1/actions/:taskId
```

#### Delete Action

```http
DELETE /api/v1/actions/:taskId
```

#### Reorder Actions (Kanban)

```http
POST /api/v1/actions/:taskId/reorder
```

**Request Body:**

```json
{
  "status": "in_progress",
  "orderIndex": 2,
  "afterTaskId": "task_xyz"
}
```

#### Add Action Dependency

```http
POST /api/v1/actions/:taskId/dependencies
```

**Request Body:**

```json
{
  "dependsOnTaskId": "task_xyz",
  "dependencyType": "blocked_by"
}
```

#### Remove Action Dependency

```http
DELETE /api/v1/actions/:taskId/dependencies/:dependencyId
```

---

### Comments

#### List Comments

```http
GET /api/v1/actions/:taskId/comments
```

**Response:**

```json
{
  "data": [
    {
      "id": "comment_abc123",
      "taskId": "task_abc123",
      "parentCommentId": null,
      "authorType": "user",
      "authorId": "user_xyz",
      "author": {
        "id": "user_xyz",
        "name": "Ahmad",
        "avatarUrl": "https://..."
      },
      "content": "Great progress! @agent_dev can you also...",
      "contentHtml": "<p>Great progress! <span data-mention='agent_dev'>@Devi</span> can you also...</p>",
      "mentions": [{ "type": "agent", "id": "agent_dev", "name": "Devi" }],
      "attachments": [
        {
          "id": "att_123",
          "name": "screenshot.png",
          "url": "https://...",
          "type": "image/png",
          "size": 102400
        }
      ],
      "editedAt": null,
      "replies": [
        {
          "id": "comment_def456",
          "authorType": "agent",
          "authorId": "agent_dev",
          "author": {
            "id": "agent_dev",
            "name": "Devi",
            "avatarUrl": "https://..."
          },
          "content": "Sure, I'll add that feature...",
          "createdAt": "2026-02-05T11:00:00.000Z"
        }
      ],
      "createdAt": "2026-02-05T10:00:00.000Z",
      "updatedAt": "2026-02-05T10:00:00.000Z"
    }
  ]
}
```

#### Create Comment

```http
POST /api/v1/actions/:taskId/comments
```

**Request Body:**

```json
{
  "content": "This looks good! @agent_dev can you review?",
  "parentCommentId": null,
  "mentions": [{ "type": "agent", "id": "agent_dev" }],
  "attachments": [
    {
      "name": "spec.pdf",
      "url": "https://...",
      "type": "application/pdf",
      "size": 204800
    }
  ]
}
```

#### Update Comment

```http
PATCH /api/v1/comments/:commentId
```

#### Delete Comment

```http
DELETE /api/v1/comments/:commentId
```

---

### Agents

#### List Agents

```http
GET /api/v1/agents
```

**Query Parameters:** | Parameter | Type | Default | Description |
|-----------|------|---------|-------------| | `status` | string | - | Filter by
status | | `capability` | string | - | Filter by capability |

**Response:**

```json
{
  "data": [
    {
      "id": "agent_dev",
      "name": "Devi",
      "slug": "ai-developer",
      "avatarUrl": "https://...",
      "role": "AI Developer",
      "description": "Full-stack developer agent...",
      "status": "active",
      "capabilities": ["coding", "debugging", "testing"],
      "runtimeType": "clawdbot",
      "totalTasksCompleted": 150,
      "totalTimeWorkedMs": 864000000,
      "lastActiveAt": "2026-02-05T10:00:00.000Z",
      "currentTask": {
        "id": "task_xyz",
        "title": "Implement API endpoints"
      },
      "createdAt": "2026-01-01T10:00:00.000Z"
    }
  ]
}
```

#### Get Agent

```http
GET /api/v1/agents/:agentId
```

#### Get Agent Actions

```http
GET /api/v1/agents/:agentId/actions
```

#### Get Agent Knowledge

```http
GET /api/v1/agents/:agentId/knowledge
```

#### Get Agent Performance

```http
GET /api/v1/agents/:agentId/performance
```

**Query Parameters:** | Parameter | Type | Default | Description |
|-----------|------|---------|-------------| | `period` | string | `30d` | Time
period (`7d`, `30d`, `90d`, `year`) |

**Response:**

```json
{
  "data": {
    "period": "30d",
    "actionsCompleted": 25,
    "actionsInProgress": 3,
    "averageCompletionTime": 14400000,
    "totalTimeWorked": 432000000,
    "knowledgeEntriesCreated": 15,
    "timeline": [
      { "date": "2026-02-01", "actionsCompleted": 2, "timeWorked": 28800000 },
      { "date": "2026-02-02", "actionsCompleted": 3, "timeWorked": 36000000 }
    ]
  }
}
```

---

### Knowledge Base

#### Search Knowledge

```http
GET /api/v1/knowledge/search
```

**Query Parameters:** | Parameter | Type | Default | Description |
|-----------|------|---------|-------------| | `q` | string | - | Search query
(required) | | `type` | string | `hybrid` | Search type: `text`, `semantic`,
`hybrid` | | `agentId` | uuid | - | Filter by agent | | `projectId` | uuid | - |
Filter by project | | `category` | string | - | Filter by category | | `limit` |
integer | 10 | Max results |

**Response:**

```json
{
  "data": [
    {
      "id": "knowledge_abc123",
      "title": "PostgreSQL pgvector Setup",
      "content": "To set up pgvector...",
      "summary": "Guide for setting up pgvector extension...",
      "category": "technical",
      "tags": ["postgresql", "vector", "database"],
      "agentId": "agent_architect",
      "agent": {
        "id": "agent_architect",
        "name": "Architect"
      },
      "sourceType": "action",
      "sourceId": "task_xyz",
      "projectId": "proj_abc123",
      "relevanceScore": 0.92,
      "createdAt": "2026-02-05T10:00:00.000Z"
    }
  ]
}
```

#### List Knowledge Entries

```http
GET /api/v1/knowledge
```

#### Get Knowledge Entry

```http
GET /api/v1/knowledge/:entryId
```

#### Create Knowledge Entry

```http
POST /api/v1/knowledge
```

**Request Body:**

```json
{
  "title": "How to configure Drizzle ORM",
  "content": "## Configuration\n\nTo configure Drizzle...",
  "category": "technical",
  "tags": ["drizzle", "orm", "database"],
  "agentId": "agent_dev",
  "projectId": "proj_abc123",
  "sourceType": "manual"
}
```

---

### Missions (Strategic Outcomes)

> **⚠️ API Terminology Note:** These endpoints currently use `/api/v1/goals` in
> the implementation but represent **Missions** (strategic outcomes) in Cohortix
> terminology. This is technical debt - future API versions should use
> `/api/v1/missions`.

#### List Missions

```http
GET /api/v1/goals  # TODO v2: /api/v1/missions
```

#### Get Mission

```http
GET /api/v1/goals/:goalId  # TODO v2: /api/v1/missions/:missionId
```

#### Create Mission

```http
POST /api/v1/goals  # TODO v2: /api/v1/missions
```

**Request Body:**

```json
{
  "title": "Launch ACC MVP",
  "description": "Complete and launch the minimum viable product...",
  "ownerType": "agent",
  "ownerId": "agent_dev",
  "targetDate": "2026-06-01",
  "keyResults": [
    { "title": "Complete core features", "target": 100, "current": 0 },
    { "title": "Pass security audit", "target": 1, "current": 0 }
  ]
}
```

#### Update Mission Progress

```http
PATCH /api/v1/goals/:goalId/progress  # TODO v2: /api/v1/missions/:missionId/progress
```

**Request Body:**

```json
{
  "progressPercent": 45,
  "keyResults": [
    { "id": "kr_1", "current": 60 },
    { "id": "kr_2", "current": 0 }
  ]
}
```

---

### Mission Proposals (Bidirectional Mission Setting)

> **Note:** Agents can propose new strategic missions for human approval,
> enabling bottom-up initiative.

#### List Mission Proposals

```http
GET /api/v1/goal-proposals  # TODO v2: /api/v1/mission-proposals
```

**Query Parameters:** | Parameter | Type | Default | Description |
|-----------|------|---------|-------------| | `status` | string | - | Filter by
status (`pending`, `approved`, `rejected`) | | `agentId` | uuid | - | Filter by
proposing agent |

**Response:**

```json
{
  "data": [
    {
      "id": "gp_abc123",
      "agentId": "agent_dev",
      "agent": {
        "id": "agent_dev",
        "name": "Devi",
        "avatarUrl": "https://..."
      },
      "title": "Improve test coverage for API routes",
      "description": "Current test coverage for API routes is below 70%. Propose mission to increase to 85%.",
      "justification": "Recent analysis shows 15 API routes lack tests. This creates risk for regressions.",
      "evidence": {
        "currentCoverage": 68,
        "targetCoverage": 85,
        "untestedRoutes": 15
      },
      "status": "pending",
      "suggestedPriority": "high",
      "targetDate": "2026-03-15",
      "createdAt": "2026-02-05T10:00:00.000Z"
    }
  ]
}
```

#### Get Mission Proposal

```http
GET /api/v1/goal-proposals/:proposalId  # TODO v2: /api/v1/mission-proposals/:proposalId
```

#### Create Mission Proposal (Agent-initiated)

```http
POST /api/v1/goal-proposals  # TODO v2: /api/v1/mission-proposals
```

**Request Body:**

```json
{
  "agentId": "agent_dev",
  "title": "Improve test coverage for API routes",
  "description": "Current test coverage is below target. Propose systematic testing improvement.",
  "justification": "Analysis shows coverage gaps creating risk.",
  "evidence": {
    "currentCoverage": 68,
    "targetCoverage": 85,
    "untestedRoutes": 15,
    "recentBugs": 3
  },
  "suggestedPriority": "high",
  "targetDate": "2026-03-15"
}
```

#### Approve Mission Proposal

```http
POST /api/v1/goal-proposals/:proposalId/approve  # TODO v2: /api/v1/mission-proposals/:proposalId/approve
```

**Request Body:**

```json
{
  "comments": "Approved. Let's prioritize the auth routes first.",
  "modifications": {
    "priority": "urgent",
    "targetDate": "2026-03-01"
  }
}
```

**Response:**

```json
{
  "data": {
    "proposal": { ... },
    "resultingMission": {
      "id": "goal_xyz789",  // TODO v2: mission_xyz789
      "title": "Improve test coverage for API routes",
      "source": "agent",
      "proposalId": "gp_abc123",
      ...
    }
  }
}
```

#### Reject Mission Proposal

```http
POST /api/v1/goal-proposals/:proposalId/reject  # TODO v2: /api/v1/mission-proposals/:proposalId/reject
```

**Request Body:**

```json
{
  "reason": "Coverage is acceptable for MVP phase. Will revisit post-launch."
}
```

> **Terminology Note:** The term "Mission" in Cohortix refers to strategic
> measurable outcomes (equivalent to PPV "Goals"). The term "Operation" refers
> to bounded initiatives (equivalent to PPV "Projects"). "Tasks" are atomic
> units of work (equivalent to PPV "Actions").

---

### Knowledge Graph & Relationships

#### Get Knowledge Entry with Relationships

```http
GET /api/v1/knowledge/:entryId/relationships
```

**Response:**

```json
{
  "data": {
    "entry": {
      "id": "knowledge_abc123",
      "title": "Implementing Auth with Clerk",
      ...
    },
    "relationships": {
      "dependsOn": [
        {
          "id": "knowledge_xyz",
          "title": "Environment Variables Setup",
          "relationshipType": "depends_on"
        }
      ],
      "relatedTo": [
        {
          "id": "knowledge_def",
          "title": "NextAuth Migration Guide",
          "relationshipType": "related_to"
        }
      ],
      "supersedes": [],
      "examplesOf": []
    }
  }
}
```

#### Create Knowledge Relationship

```http
POST /api/v1/knowledge/:entryId/relationships
```

**Request Body:**

```json
{
  "toEntryId": "knowledge_xyz",
  "relationshipType": "depends_on",
  "notes": "Must understand environment setup before configuring Clerk"
}
```

#### Get Knowledge Version History

```http
GET /api/v1/knowledge/:entryId/versions
```

**Response:**

```json
{
  "data": [
    {
      "id": "kv_v3",
      "versionNumber": 3,
      "changeType": "updated",
      "title": "Implementing Auth with Clerk",
      "changedBy": {
        "type": "agent",
        "id": "agent_dev",
        "name": "Devi"
      },
      "changeNotes": "Updated for Next.js 15 App Router",
      "createdAt": "2026-02-05T10:00:00.000Z"
    },
    {
      "id": "kv_v2",
      "versionNumber": 2,
      "changeType": "refined",
      "changedBy": {
        "type": "agent",
        "id": "agent_architect",
        "name": "Architect"
      },
      "changeNotes": "Added middleware configuration details",
      "createdAt": "2026-02-01T10:00:00.000Z"
    },
    {
      "id": "kv_v1",
      "versionNumber": 1,
      "changeType": "created",
      "changedBy": {
        "type": "agent",
        "id": "agent_dev",
        "name": "Devi"
      },
      "createdAt": "2026-01-28T10:00:00.000Z"
    }
  ]
}
```

#### Get Specific Knowledge Version

```http
GET /api/v1/knowledge/:entryId/versions/:versionNumber
```

#### Update Knowledge Entry (Creates New Version)

```http
PATCH /api/v1/knowledge/:entryId
```

**Request Body:**

```json
{
  "content": "Updated content...",
  "changeNotes": "Added section on error handling"
}
```

#### Deprecate Knowledge Entry

```http
POST /api/v1/knowledge/:entryId/deprecate
```

**Request Body:**

```json
{
  "reason": "Outdated approach. Clerk 5.0 has better patterns.",
  "supersededByEntryId": "knowledge_new123"
}
```

#### Track Knowledge Usage

```http
POST /api/v1/knowledge/:entryId/usage
```

**Request Body:**

```json
{
  "taskId": "task_abc",
  "wasHelpful": true,
  "feedback": "This guide was perfect for implementing the feature."
}
```

---

### Learning Materials & Agent Evolution

#### List Learning Materials

```http
GET /api/v1/learning-materials
```

**Query Parameters:** | Parameter | Type | Default | Description |
|-----------|------|---------|-------------| | `type` | string | - | Filter by
type (`course`, `documentation`, etc.) | | `skillDomain` | string | - | Filter
by skill domain | | `difficulty` | string | - | Filter by difficulty | |
`status` | string | `active` | Filter by status |

**Response:**

```json
{
  "data": [
    {
      "id": "lm_abc123",
      "title": "Next.js 15 App Router Fundamentals",
      "description": "Complete guide to Next.js 15 App Router...",
      "type": "course",
      "skillDomain": "frontend",
      "difficulty": "intermediate",
      "durationMinutes": 180,
      "status": "active",
      "tags": ["nextjs", "react", "app-router"],
      "prerequisiteMaterials": ["lm_react_basics"],
      "createdAt": "2026-01-15T10:00:00.000Z"
    }
  ]
}
```

#### Get Learning Material

```http
GET /api/v1/learning-materials/:materialId
```

#### Create Learning Material

```http
POST /api/v1/learning-materials
```

**Request Body:**

```json
{
  "title": "PostgreSQL Performance Tuning",
  "description": "Advanced techniques for optimizing PostgreSQL queries...",
  "type": "documentation",
  "skillDomain": "database",
  "difficulty": "advanced",
  "content": "# PostgreSQL Performance Tuning\n\n...",
  "durationMinutes": 120,
  "tags": ["postgresql", "optimization", "performance"],
  "prerequisiteMaterials": ["lm_sql_basics", "lm_pg_fundamentals"]
}
```

#### Assign Learning Material to Agent

```http
POST /api/v1/agents/:agentId/learning-materials/:materialId
```

**Request Body:**

```json
{
  "targetCompletionDate": "2026-03-01",
  "priority": "high",
  "notes": "Focus on query optimization sections"
}
```

---

### Agent Evolution Sessions

#### List Evolution Sessions

```http
GET /api/v1/agents/:agentId/evolution-sessions
```

**Query Parameters:** | Parameter | Type | Default | Description |
|-----------|------|---------|-------------| | `status` | string | - | Filter by
status | | `startDate` | date | - | Sessions after this date | | `endDate` |
date | - | Sessions before this date |

**Response:**

```json
{
  "data": [
    {
      "id": "es_abc123",
      "agentId": "agent_dev",
      "sessionType": "daily",
      "status": "completed",
      "materialId": "lm_nextjs_fundamentals",
      "materialTitle": "Next.js 15 App Router Fundamentals",
      "scheduledAt": "2026-02-05T09:00:00.000Z",
      "startedAt": "2026-02-05T09:02:00.000Z",
      "completedAt": "2026-02-05T09:47:00.000Z",
      "durationMs": 2700000,
      "keyLearnings": "Learned about Server Actions and form handling...",
      "questionsRaised": "How do Server Actions handle file uploads?",
      "confidenceBefore": 40,
      "confidenceAfter": 70,
      "knowledgeEntriesCreated": 3,
      "createdAt": "2026-02-04T10:00:00.000Z"
    }
  ]
}
```

#### Schedule Evolution Session

```http
POST /api/v1/agents/:agentId/evolution-sessions
```

**Request Body:**

```json
{
  "sessionType": "daily",
  "materialId": "lm_nextjs_fundamentals",
  "scheduledAt": "2026-02-06T09:00:00.000Z"
}
```

#### Trigger Immediate Evolution Session

```http
POST /api/v1/agents/:agentId/evolution-sessions/immediate
```

**Request Body:**

```json
{
  "materialId": "lm_security_best_practices",
  "reason": "Security vulnerability detected - immediate training needed"
}
```

#### Get Evolution Session Details

```http
GET /api/v1/evolution-sessions/:sessionId
```

---

### Agent Expertise

#### Get Agent Expertise Matrix

```http
GET /api/v1/agents/:agentId/expertise
```

**Response:**

```json
{
  "data": {
    "agentId": "agent_dev",
    "agentName": "Devi",
    "expertise": [
      {
        "skillDomain": "nextjs",
        "skillCategory": "frontend",
        "proficiencyScore": 75,
        "previousScore": 65,
        "growth": 10,
        "totalMissionsCompleted": 45,
        "successfulMissions": 42,
        "totalLearningHours": 12.5,
        "level": "intermediate",
        "milestones": {
          "beginnerAchievedAt": "2026-01-10T10:00:00.000Z",
          "intermediateAchievedAt": "2026-01-25T10:00:00.000Z",
          "expertAchievedAt": null
        },
        "lastPracticedAt": "2026-02-05T10:00:00.000Z"
      },
      {
        "skillDomain": "postgresql",
        "skillCategory": "database",
        "proficiencyScore": 55,
        "previousScore": 45,
        "growth": 10,
        "totalMissionsCompleted": 15,
        "successfulMissions": 14,
        "totalLearningHours": 8.0,
        "level": "beginner",
        "lastPracticedAt": "2026-02-04T10:00:00.000Z"
      }
    ],
    "overallGrowthRate": 15.2,
    "topSkills": ["nextjs", "react", "typescript"]
  }
}
```

#### Update Agent Expertise

```http
PATCH /api/v1/agents/:agentId/expertise/:skillDomain
```

**Request Body:**

```json
{
  "proficiencyScore": 80,
  "notes": "Completed advanced course and applied in 3 production missions"
}
```

#### Get Agent Learning Paths

```http
GET /api/v1/agents/:agentId/learning-paths
```

**Response:**

```json
{
  "data": [
    {
      "id": "lp_abc123",
      "pathName": "Frontend Mastery Track",
      "targetSkillDomain": "frontend",
      "status": "in_progress",
      "progress": {
        "currentMaterialIndex": 2,
        "totalMaterials": 5,
        "completedMaterials": 2,
        "percentComplete": 40
      },
      "materials": [
        {
          "id": "lm_1",
          "title": "React Fundamentals",
          "status": "completed",
          "completedAt": "2026-01-20T10:00:00.000Z"
        },
        {
          "id": "lm_2",
          "title": "Next.js App Router",
          "status": "completed",
          "completedAt": "2026-02-05T10:00:00.000Z"
        },
        {
          "id": "lm_3",
          "title": "Advanced State Management",
          "status": "in_progress",
          "startedAt": "2026-02-06T09:00:00.000Z"
        },
        {
          "id": "lm_4",
          "title": "Performance Optimization",
          "status": "not_started"
        },
        {
          "id": "lm_5",
          "title": "Testing Strategies",
          "status": "not_started"
        }
      ],
      "assignedBy": {
        "id": "user_xyz",
        "name": "Ahmad"
      },
      "startedAt": "2026-01-15T10:00:00.000Z",
      "targetCompletionDate": "2026-03-15"
    }
  ]
}
```

#### Create Learning Path for Agent

```http
POST /api/v1/agents/:agentId/learning-paths
```

**Request Body:**

```json
{
  "pathName": "Backend Mastery Track",
  "targetSkillDomain": "backend",
  "materialIds": [
    "lm_node_fundamentals",
    "lm_api_design",
    "lm_database_fundamentals",
    "lm_performance_optimization"
  ],
  "targetCompletionDate": "2026-04-01"
}
```

---

### Webhooks (Incoming)

#### Clawdbot Webhook

```http
POST /api/v1/webhooks/clawdbot
```

**Headers:**

```http
X-Webhook-Secret: <configured_secret>
X-Webhook-Event: action.completed
```

**Event Types:**

- `agent.status_changed`
- `task.started`
- `task.completed`
- `task.failed`
- `knowledge.created`
- `message.received`

**Example Payload (action.completed):**

```json
{
  "event": "action.completed",
  "timestamp": "2026-02-05T10:00:00.000Z",
  "data": {
    "agentId": "ai-developer",
    "taskExternalId": "task_xyz",
    "result": {
      "status": "success",
      "output": "Implemented login page with email/password authentication...",
      "artifacts": [
        { "type": "code", "path": "src/app/(auth)/sign-in/page.tsx" }
      ]
    },
    "timeWorked": 14400000,
    "knowledge": [
      {
        "title": "Next.js Auth Patterns",
        "content": "When implementing auth in Next.js 15...",
        "category": "technical"
      }
    ]
  }
}
```

#### GitHub Webhook

```http
POST /api/v1/webhooks/github
```

**Handled Events:**

- `push`
- `pull_request`
- `issues`
- `issue_comment`

---

## Real-Time Events (Supabase Realtime)

### Subscribe to Database Changes

Cohortix uses **Supabase Realtime** for all real-time features. The
WebSocket-based subscriptions automatically sync database changes to clients.

**Client-Side Implementation:**

```typescript
'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export function useTaskSubscription(projectId: string) {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Subscribe to action changes in this mission
    const channel = supabase
      .channel(`project:${projectId}:tasks`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'actions',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('Action changed:', payload);
          // Update UI state
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);
}

// Subscribe to comment additions
export function useCommentSubscription(taskId: string) {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`task:${taskId}:comments`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          console.log('New comment:', payload.new);
          // Refetch comments or optimisticagent update
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);
}
```

### Presence (Online Users)

```typescript
// Track who's viewing a mission
const channel = supabase.channel('mission-room:abc123', {
  config: { presence: { key: userId } },
});

// Subscribe to presence
channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    console.log('Online users:', Object.keys(state));
  })
  .on('presence', { event: 'join' }, ({ key }) => {
    console.log(`User ${key} joined`);
  })
  .on('presence', { event: 'leave' }, ({ key }) => {
    console.log(`User ${key} left`);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ online_at: new Date().toISOString() });
    }
  });
```

### Broadcast (Custom Messages)

```typescript
// Send custom messages (not tied to database)
const channel = supabase.channel('team-chat');

// Send message
channel.send({
  type: 'broadcast',
  event: 'cursor-move',
  payload: { x: 100, y: 200 },
});

// Receive messages
channel.on('broadcast', { event: 'cursor-move' }, (payload) => {
  console.log('Cursor moved:', payload);
});
```

### Event Types

| Event              | Trigger                 | Use Case                                  |
| ------------------ | ----------------------- | ----------------------------------------- |
| `postgres_changes` | DB INSERT/UPDATE/DELETE | Sync action/mission/comment changes       |
| `presence`         | User join/leave channel | Show who's online                         |
| `broadcast`        | Custom client messages  | Cursors, typing indicators, notifications |

---

## API Versioning

### Version Strategy

- URL-based versioning: `/api/v1/`, `/api/v2/`
- Major versions for breaking changes
- Backward compatibility within major version
- Deprecation warnings in headers

### Deprecation

```http
Deprecation: true
Sunset: Sat, 01 Jun 2027 00:00:00 GMT
Link: </api/v2/missions>; rel="successor-version"
```

---

## SDK (Future)

### JavaScript/TypeScript SDK

```typescript
import { AgentCommandCenter } from '@agent-command-center/sdk';

const acc = new AgentCommandCenter({
  apiKey: 'acc_sk_xxx',
  organizationId: 'org_xxx',
});

// List missions
const projects = await acc.projects.list({ status: 'active' });

// Create action
const task = await acc.tasks.create({
  projectId: 'proj_xxx',
  title: 'New action',
  assigneeType: 'agent',
  assigneeId: 'agent_dev',
});

// Subscribe to events
acc.events.subscribe({
  projectId: 'proj_xxx',
  onTaskUpdated: (event) => console.log('Action updated:', event),
  onCommentCreated: (event) => console.log('New comment:', event),
});
```

---

## OpenAPI Specification

Full OpenAPI 3.1 spec available at:

```
GET /api/v1/openapi.json
GET /api/v1/openapi.yaml
```

Interactive documentation:

```
GET /api/docs
```

---

_Document maintained by: Architecture Team_ _Next review: 2026-03-01_
