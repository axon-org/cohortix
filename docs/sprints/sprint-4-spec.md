# Sprint 4: Mission Control & Intel Foundation

## Goal

Establish the primary workspace for managing execution (Kanban) and the
foundation for organizational memory (Intelligence).

## Duration

Feb 16, 2026 – Feb 27, 2026 (2 Weeks)

## Team

- **Devi (Backend):** Intel Schema, Vector DB setup, Kanban API extensions.
- **Lubna (UI):** Kanban Board UI, Task Detail Views, List View filtering.
- **Zara (Creative):** Intelligence branding, empty states, and iconography.

## Tasks

### 1. Kanban Board (Phase 3)

- **[UI]** Interactive Kanban board with columns: Todo, In Progress, Review,
  Done. (Lubna)
- **[UI]** Drag-and-drop support for status transitions using `dnd-kit`. (Lubna)
- **[BE]** API endpoints for bulk status updates and position persistence.
  (Devi)
- **[UI]** Swimlanes by Domain or Ally. (Lubna)

### 2. Task Card Detail View

- **[UI]** Slide-over / Modal for detailed Task view. (Lubna)
- **[BE]** Comments/Activity Feed API (CRUD). (Devi)
- **[UI]** Rich text description (Markdown) and activity log. (Lubna)
- **[Creative]** Custom status icons and priority badges. (Zara)

### 3. List View & Filtering

- **[UI]** High-density table view for bulk management. (Lubna)
- **[BE]** Advanced filtering API (by Domain, Vision, Mission, Ally, Status).
  (Devi)

### 4. Knowledge Base / Intel Foundation (Phase 4)

- **[BE]** Intelligence and Insight schema implementation in Supabase. (Devi)
- **[BE]** Initial Vector DB (pgvector) setup for semantic search. (Devi)
- **[UI]** "Global Intel Feed" component for the dashboard. (Lubna)
- **[Creative]** "Intelligence Zone" visual identity and empty state
  illustrations. (Zara)

## Acceptance Criteria

- Tasks can be dragged between status columns with immediate persistence.
- Task detail view shows a functional comment thread and history.
- Users can filter the List View by at least 3 different criteria.
- Insights can be manually added via a Task and are viewable in a global feed.
