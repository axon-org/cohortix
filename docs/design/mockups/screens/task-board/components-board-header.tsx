"use client"

import { useState } from "react"
import { ChevronDown, Plus, Search, Bell } from "lucide-react"

const projects = [
  "Axon Platform v2",
  "Meridian Core",
  "Halo Design System",
]

export function BoardHeader() {
  const [projectOpen, setProjectOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState("Axon Platform v2")

  return (
    <header className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-20 flex-shrink-0">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[17px] font-semibold text-[var(--foreground)] tracking-tight leading-none">
          Task Board
        </h1>
        <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 leading-none">
          Sprint 14 · Mar 3 – Mar 17
        </p>
      </div>

      {/* Search */}
      <div className="hidden sm:flex items-center gap-1.5 bg-[var(--muted)] rounded-lg px-3 py-1.5 text-[13px] text-[var(--muted-foreground)] w-[180px]">
        <Search size={13} className="flex-shrink-0 opacity-60" />
        <input
          className="bg-transparent outline-none w-full placeholder:text-[var(--muted-foreground)] text-[var(--foreground)] text-[12px]"
          placeholder="Search tasks…"
          aria-label="Search tasks"
        />
      </div>

      {/* Project dropdown */}
      <div className="relative">
        <button
          onClick={() => setProjectOpen(!projectOpen)}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[12px] font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
          <span className="hidden sm:block truncate max-w-[130px]">{selectedProject}</span>
          <ChevronDown size={13} className="opacity-50" />
        </button>
        {projectOpen && (
          <div className="absolute right-0 top-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50 w-[200px]">
            {projects.map((p) => (
              <button
                key={p}
                onClick={() => { setSelectedProject(p); setProjectOpen(false) }}
                className="flex items-center gap-2 w-full px-3.5 py-2.5 text-[12px] hover:bg-[var(--muted)] transition-colors text-[var(--foreground)]"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p === "Axon Platform v2" ? "bg-indigo-500" : p === "Meridian Core" ? "bg-emerald-500" : "bg-amber-500"}`} />
                {p}
                {p === selectedProject && (
                  <span className="ml-auto text-[var(--brand-primary)] font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <button className="relative w-8 h-8 rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center justify-center text-[var(--muted-foreground)]">
        <Bell size={16} />
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
      </button>

      {/* New Task */}
      <button className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
        style={{ background: "var(--brand-primary)" }}>
        <Plus size={14} />
        <span className="hidden sm:inline">New Task</span>
      </button>
    </header>
  )
}
