"use client"

import { Sidebar } from "./sidebar"
import { BoardHeader } from "./board-header"
import { KanbanColumn } from "./kanban-column"
import { TaskCard } from "./kanban-card"

// ─── Sample Data ───────────────────────────────────────────────────────────────

const inboxCards: TaskCard[] = [
  {
    id: "i1",
    ticket: "AXN-041",
    title: "Audit all API rate limiting configurations across services",
    priority: "high",
    agent: { initials: "TK", color: "#6366f1" },
    due: "2026-03-22",
    tags: ["API", "Infra"],
  },
  {
    id: "i2",
    ticket: "AXN-042",
    title: "Design new onboarding flow for enterprise tier",
    priority: "medium",
    agent: { initials: "LS", color: "#10b981" },
    due: "2026-03-28",
    tags: ["UX", "Enterprise"],
  },
  {
    id: "i3",
    ticket: "AXN-043",
    title: "Investigate memory leak in ingestion pipeline",
    priority: "critical",
    agent: { initials: "RN", color: "#f43f5e" },
    due: "2026-03-20",
    tags: ["Backend"],
  },
  {
    id: "i4",
    ticket: "AXN-044",
    title: "Update third-party dependency versions (Q1 sweep)",
    priority: "low",
    agent: { initials: "PW", color: "#f59e0b" },
    due: "2026-04-02",
    tags: ["Maintenance"],
  },
]

const assignedCards: TaskCard[] = [
  {
    id: "a1",
    ticket: "AXN-031",
    title: "Implement dark mode token system across all UI components",
    priority: "medium",
    agent: { initials: "MR", color: "#8b5cf6" },
    due: "2026-03-25",
    tags: ["Design", "Frontend"],
  },
  {
    id: "a2",
    ticket: "AXN-032",
    title: "Write integration tests for Payments v3 module",
    priority: "high",
    agent: { initials: "JD", color: "#0ea5e9" },
    due: "2026-03-21",
    tags: ["QA"],
  },
  {
    id: "a3",
    ticket: "AXN-033",
    title: "Sync product analytics events with warehouse schema",
    priority: "low",
    agent: { initials: "LS", color: "#10b981" },
    due: "2026-03-30",
    tags: ["Data"],
  },
]

const inProgressCards: TaskCard[] = [
  {
    id: "p1",
    ticket: "AXN-021",
    title: "Refactor authentication middleware to use JWT RS256",
    priority: "critical",
    agent: { initials: "RN", color: "#f43f5e" },
    due: "2026-03-20",
    tags: ["Auth", "Security"],
  },
  {
    id: "p2",
    ticket: "AXN-022",
    title: "Build real-time collaboration cursor overlay for canvas",
    priority: "high",
    agent: { initials: "MR", color: "#8b5cf6" },
    due: "2026-03-23",
    tags: ["Collab", "Frontend"],
  },
  {
    id: "p3",
    ticket: "AXN-023",
    title: "Migrate legacy search indexing from Elastic to Typesense",
    priority: "medium",
    agent: { initials: "TK", color: "#6366f1" },
    due: "2026-03-27",
    tags: ["Search", "Infra"],
  },
]

const reviewCards: TaskCard[] = [
  {
    id: "r1",
    ticket: "AXN-011",
    title: "Add CSV export to all analytics dashboard tables",
    priority: "medium",
    agent: { initials: "PW", color: "#f59e0b" },
    due: "2026-03-21",
    tags: ["Analytics"],
  },
  {
    id: "r2",
    ticket: "AXN-012",
    title: "Accessibility audit and WCAG 2.2 remediation pass",
    priority: "high",
    agent: { initials: "JD", color: "#0ea5e9" },
    due: "2026-03-22",
    tags: ["A11y", "Frontend"],
  },
]

const doneCards: TaskCard[] = [
  {
    id: "d1",
    ticket: "AXN-001",
    title: "Scaffold new monorepo workspace with Turborepo",
    priority: "medium",
    agent: { initials: "TK", color: "#6366f1" },
    due: "2026-03-10",
    tags: ["Infra"],
  },
  {
    id: "d2",
    ticket: "AXN-002",
    title: "Design system: set up Storybook with Chromatic CI",
    priority: "low",
    agent: { initials: "MR", color: "#8b5cf6" },
    due: "2026-03-11",
    tags: ["Design"],
  },
  {
    id: "d3",
    ticket: "AXN-003",
    title: "Implement feature flag service with gradual rollout",
    priority: "high",
    agent: { initials: "RN", color: "#f43f5e" },
    due: "2026-03-12",
    tags: ["Platform"],
  },
  {
    id: "d4",
    ticket: "AXN-004",
    title: "Set up error tracking and alerting with Sentry DSN",
    priority: "medium",
    agent: { initials: "LS", color: "#10b981" },
    due: "2026-03-13",
    tags: ["Ops"],
  },
  {
    id: "d5",
    ticket: "AXN-005",
    title: "Configure RBAC roles for multi-tenant workspace access",
    priority: "critical",
    agent: { initials: "JD", color: "#0ea5e9" },
    due: "2026-03-14",
    tags: ["Auth", "Security"],
  },
]

// ─── Column Definitions ────────────────────────────────────────────────────────

const columns = [
  {
    title: "Inbox",
    cards: inboxCards,
    accentClass: "bg-slate-400",
    accentBg: "bg-slate-100 text-slate-600",
  },
  {
    title: "Assigned",
    cards: assignedCards,
    accentClass: "bg-blue-400",
    accentBg: "bg-blue-50 text-blue-700",
  },
  {
    title: "In Progress",
    cards: inProgressCards,
    accentClass: "bg-amber-400",
    accentBg: "bg-amber-50 text-amber-700",
    elevatedId: "p2",
  },
  {
    title: "Review",
    cards: reviewCards,
    accentClass: "bg-violet-400",
    accentBg: "bg-violet-50 text-violet-700",
  },
  {
    title: "Done",
    cards: doneCards,
    accentClass: "bg-emerald-400",
    accentBg: "bg-emerald-50 text-emerald-700",
  },
]

// ─── Board ─────────────────────────────────────────────────────────────────────

export function KanbanBoard() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--brand-bg)" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <BoardHeader />

        {/* Kanban scroll area */}
        <main className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 h-full px-5 py-5 items-start">
            {columns.map((col) => (
              <KanbanColumn
                key={col.title}
                title={col.title}
                count={col.cards.length}
                cards={col.cards}
                accentClass={col.accentClass}
                accentBg={col.accentBg}
                elevatedId={col.elevatedId}
              />
            ))}
            {/* Add column button */}
            <button
              className="min-w-[200px] h-10 rounded-xl border-2 border-dashed border-[var(--border)] text-[12px] font-medium text-[var(--muted-foreground)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-all flex items-center justify-center gap-1.5 flex-shrink-0 mt-0.5"
            >
              + Add column
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
