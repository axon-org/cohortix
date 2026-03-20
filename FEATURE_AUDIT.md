# Cohortix Feature Audit

<!-- Purpose: Audit of features carried over from Mission Control fork -->
<!-- Owner: Team -->
<!-- Last Reviewed: 2026-03-20 -->
<!-- Read After: PROJECT_BRIEF.md -->

> Auto-generated from codebase inspection. Last updated: 2026-03-18

## Section 1: API Routes (134 endpoints)

- `/api/activities`
- `/api/adapters`
- `/api/agents/:id/attribution`
- `/api/agents/:id/diagnostics`
- `/api/agents/:id/files`
- `/api/agents/:id/heartbeat`
- `/api/agents/:id/keys`
- `/api/agents/:id/memory`
- `/api/agents/:id`
- `/api/agents/:id/soul`
- `/api/agents/:id/wake`
- `/api/agents/comms`
- `/api/agents/evals`
- `/api/agents/message`
- `/api/agents/optimize`
- `/api/agents/register`
- `/api/agents`
- `/api/agents/sync`
- `/api/alerts`
- `/api/audit`
- `/api/auth/access-requests`
- `/api/auth/google/disconnect`
- `/api/auth/google`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/auth/users`
- `/api/backup`
- `/api/channels`
- `/api/chat/conversations`
- `/api/chat/messages/:id`
- `/api/chat/messages`
- `/api/chat/session-prefs`
- `/api/claude-tasks`
- `/api/claude/sessions`
- `/api/cleanup`
- `/api/connect`
- `/api/cron`
- `/api/debug`
- `/api/diagnostics`
- `/api/docs/content`
- `/api/docs`
- `/api/docs/search`
- `/api/docs/tree`
- `/api/events`
- `/api/exec-approvals`
- `/api/export`
- `/api/gateway-config`
- `/api/gateways/connect`
- `/api/gateways/discover`
- `/api/gateways/health/history`
- `/api/gateways/health`
- `/api/gateways`
- `/api/github`
- `/api/github/sync`
- `/api/gnap`
- `/api/hermes/memory`
- `/api/hermes`
- `/api/hermes/tasks`
- `/api/index`
- `/api/integrations`
- `/api/local/agents-doc`
- `/api/local/flight-deck`
- `/api/local/terminal`
- `/api/logs`
- `/api/memory/context`
- `/api/memory/graph`
- `/api/memory/health`
- `/api/memory/links`
- `/api/memory/process`
- `/api/memory`
- `/api/mentions`
- `/api/nodes`
- `/api/notifications/deliver`
- `/api/notifications`
- `/api/onboarding`
- `/api/openclaw/doctor`
- `/api/openclaw/update`
- `/api/openclaw/version`
- `/api/pipelines`
- `/api/pipelines/run`
- `/api/projects/:id/agents`
- `/api/projects/:id`
- `/api/projects/:id/tasks`
- `/api/projects`
- `/api/quality-review`
- `/api/releases/check`
- `/api/releases/update`
- `/api/schedule-parse`
- `/api/scheduler`
- `/api/search`
- `/api/security-audit`
- `/api/security-scan/agent`
- `/api/security-scan/fix`
- `/api/security-scan`
- `/api/sessions/:id/control`
- `/api/sessions/continue`
- `/api/sessions`
- `/api/sessions/transcript/aggregate`
- `/api/sessions/transcript/gateway`
- `/api/sessions/transcript`
- `/api/settings`
- `/api/setup`
- `/api/skills/registry`
- `/api/skills`
- `/api/spawn`
- `/api/standup`
- `/api/status`
- `/api/super/os-users`
- `/api/super/provision-jobs/:id`
- `/api/super/provision-jobs/:id/run`
- `/api/super/provision-jobs`
- `/api/super/tenants/:id/decommission`
- `/api/super/tenants`
- `/api/tasks/:id/branch`
- `/api/tasks/:id/broadcast`
- `/api/tasks/:id/comments`
- `/api/tasks/:id`
- `/api/tasks/outcomes`
- `/api/tasks/queue`
- `/api/tasks/regression`
- `/api/tasks`
- `/api/tokens/by-agent`
- `/api/tokens/rotate`
- `/api/tokens`
- `/api/webhooks/deliveries`
- `/api/webhooks/retry`
- `/api/webhooks`
- `/api/webhooks/test`
- `/api/webhooks/verify-docs`
- `/api/workflows`
- `/api/workload`
- `/api/workspaces/:id`
- `/api/workspaces`

## Section 2: UI Panels (39 panels)

- `activity-feed-panel`
- `agent-comms-panel`
- `agent-cost-panel`
- `agent-detail-tabs`
- `agent-history-panel`
- `agent-squad-panel`
- `agent-squad-panel-phase3`
- `alert-rules-panel`
- `audit-trail-panel`
- `channels-panel`
- `chat-page-panel`
- `cost-tracker-panel`
- `cron-management-panel`
- `debug-panel`
- `documents-panel`
- `exec-approval-panel`
- `gateway-config-panel`
- `github-sync-panel`
- `integrations-panel`
- `local-agents-doc-panel`
- `log-viewer-panel`
- `memory-browser-panel`
- `memory-graph`
- `multi-gateway-panel`
- `nodes-panel`
- `notifications-panel`
- `office-panel`
- `orchestration-bar`
- `pipeline-tab`
- `security-audit-panel`
- `session-details-panel`
- `settings-panel`
- `skills-panel`
- `standup-panel`
- `super-admin-panel`
- `task-board-panel`
- `token-dashboard-panel`
- `user-management-panel`
- `webhook-panel`

## Section 3: Database Tables (9 tables)

- **tasks**
- **agents**
- **comments**
- **activities**
- **notifications**
- **task_subscriptions**
- **standup_reports**
- **quality_reviews**
- **gateway_health_logs**

## Section 4: Features Summary

### Already Built (from Mission Control)
- **Task Management** — Kanban board, drag-drop, comments, quality gates (Aegis), branching, broadcasting, recurring tasks
- **Agent Management** — Registration, heartbeats, SOUL system, memory graph, optimization, diagnostics, API keys, evals
- **Chat & Collaboration** — Multi-session chat, message history, transcript aggregation
- **Memory & Context** — Memory browser, links, context snapshots, knowledge graph visualization
- **Security** — Built-in auth (session + API key), RBAC (viewer/operator/admin), security scans, audit logs, exec approvals
- **Orchestration** — Cron scheduler, pipelines, standup reports, background jobs
- **Integrations** — Multi-gateway, GitHub sync, webhooks (with retry + circuit breaker), adapters (OpenClaw/CrewAI/LangGraph/AutoGen/Claude SDK)
- **Administration** — Super-admin panel, tenant provisioning, user management, settings
- **Developer Tools** — Debug panel, log viewer, docs browser, version self-update
- **i18n** — 10 languages (ar, de, en, es, fr, ja, ko, pt, ru, zh)
- **Onboarding** — 5-step guided wizard with security scan

### NOT Yet Built (Cohortix-specific)
- **Cohorts** — Groups of agents + humans (core differentiator)
- **PPV Hierarchy** — Domains → Visions → Missions → Operations/Rhythms → Tasks
- **Cohortix Terminology** — User-friendly language layer (Deploy, Recruit, Stand Down, etc.)
- **Everyday People UX** — Simplified flows, guided experiences, reduced complexity
