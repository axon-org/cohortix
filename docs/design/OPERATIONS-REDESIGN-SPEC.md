# Operations Redesign Spec — Based on Reference App

**Source:** https://v0-project-workspace.vercel.app/
**Screenshots:** `docs/design/reference-app/01-06`
**Date:** 2026-02-14

## Context

Ahmad wants us to redesign the Cohortix Operations feature to match (or exceed) the Projects feature from this reference PM app. In Cohortix, "Operations" = "Projects" in this reference.

Key difference: Cohortix has both **human and AI agent** assignees.

---

## Reference App Breakdown

### 1. Projects Grid View (Operations List)
**Screenshot:** `01-projects-grid.png`

Each project card shows:
- **Title** (bold)
- **Client • Type • Duration** (e.g., "Acme Corp • MVP • 2 weeks")
- **Status badge** (Active / Planned / Completed / Backlog) — color-coded
- **Date** (calendar icon)
- **Priority** (icon + label: High / Medium / Low / Urgent)
- **Progress** — circular progress indicator + "X / Y Tasks"
- **Assignee avatar** (bottom right)
- **"+ Create new project"** card at the end

Top bar: Filter button, View toggle, "Ask AI" button, "+ Add Project"

### 2. Project Detail — Overview Tab
**Screenshot:** `02-project-overview.png`

**Header:**
- Title + Status badge (Active) + "Assigned to me" badge
- ID (#1), Priority (High), Location (Australia), Sprint info, Last sync time

**Tabs:** Overview | Workstream | Tasks | Notes | Assets & Files

**Overview content:**
- Description paragraph
- **In scope** / **Out of scope** — bullet lists side by side
- **Expected Outcomes** — bullet list with measurable targets
- **Key Features** — organized by priority (P0, P1, P2)
- **Expected Timeline** — inline Gantt chart (weekly view with task bars)

**Right sidebar:**
- **Time:** Estimate, Due Date, Days remaining (with progress bar)
- **Backlog:** Status, Group, Priority, Label, PIC (person in charge), Support
- **Client card:** Company name, contact person, email
- **Quick links:** Downloadable files (PDF, ZIP, Figma)

### 3. Workstream Tab
**Screenshot:** `03-project-workstream.png`

- "WORKSTREAM BREAKDOWN" heading
- Collapsible sections (like epics/phases):
  - "Processing documents for signing the deal" — 1/4 progress ring
  - "Client onboarding setup" — 0/3
  - "Product wireframe & review" — 0/2
  - "Demo UI Concept" — 0/1
  - "Feedback and iteration with stakeholders" — 0/1
- Each section expands to show tasks with: checkbox, title, due date, assignee avatar, menu
- Tasks with overdue dates shown in red ("Today" in red)
- "+" button to add tasks inline

### 4. Tasks Tab
**Screenshot:** `04-project-tasks.png`

- Flat task list with Filter and View buttons, "+ New Task"
- Each row: checkbox, task title, parent workstream (pill badge), status (Done/To do/In Progress), date, assignee avatar, menu
- Color-coded status labels
- Parent workstream shown as a gray pill for context

### 5. Notes Tab
**Screenshot:** `05-project-notes.png`

- **Recent notes** — card grid (icon, title, date)
- **All notes** — table with: checkbox, name, added by, date, status (Completed/Processing)
- Search + "+ Add notes"
- Note types have different icons (pinned, document, etc.)

### 6. Assets & Files Tab
**Screenshot:** `06-project-assets.png`

- **Recent Files** — card grid with file type icon, name, size
- **All files** — table with: checkbox, name (with size), added by, date
- File type icons (PDF, ZIP, Figma, etc.)
- Search + "+ Add File"

---

## Cohortix Adaptation (Operations = Projects)

### What to keep identical:
1. **Card grid layout** for Operations list
2. **5-tab detail view:** Overview, Workstream, Tasks, Notes, Assets & Files
3. **Right sidebar** with metadata (time, status, priority, etc.)
4. **Workstream breakdown** with collapsible task groups
5. **Inline Gantt/timeline** in Overview
6. **Quick links** / file attachments

### What to adapt for Cohortix:
1. **"Client" → "Mission"** — link to parent Mission instead of client
2. **Assignees: Human + AI Agent** — avatars should distinguish human vs AI (robot icon overlay or different border)
3. **"PIC" → "Lead"** — could be human or AI agent
4. **"Ask AI" button** — connects to Cohortix Intelligence (Smart Triage, Health Pulse, etc.)
5. **AI Activity feed** — in Workstream or as a 6th tab, show what AI agents did
6. **Status auto-inference** — Health Pulse sets status automatically (from ADR)
7. **"Sprint" → "Cycle"** — or keep Sprint, align with terminology doc

### New features (beyond reference):
1. **Agent assignment widget** — assign tasks to AI agents, not just humans
2. **AI-generated overview** — auto-write scope, outcomes from task data
3. **Activity log** — who did what (human + AI), like a combined changelog
4. **Generative subtasks** — "Break this down" button on any task
