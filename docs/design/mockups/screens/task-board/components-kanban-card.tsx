"use client"

import { useState } from "react"
import { MoreHorizontal, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

export type Priority = "low" | "medium" | "high" | "critical"

export interface TaskCard {
  id: string
  ticket: string
  title: string
  priority: Priority
  agent: { initials: string; color: string }
  due: string
  tags?: string[]
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: {
    label: "Low",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  medium: {
    label: "Medium",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  high: {
    label: "High",
    className: "bg-orange-50 text-orange-700 border border-orange-200",
  },
  critical: {
    label: "Critical",
    className: "bg-red-50 text-red-700 border border-red-200",
  },
}

const priorityDot: Record<Priority, string> = {
  low: "bg-emerald-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
}

function dueDateChip(dateStr: string) {
  const due = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: "Overdue", class: "bg-red-50 text-red-600 border border-red-200" }
  if (diff === 0) return { label: "Today", class: "bg-orange-50 text-orange-600 border border-orange-200" }
  if (diff <= 2) return { label: `${diff}d left`, class: "bg-amber-50 text-amber-700 border border-amber-200" }
  return {
    label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    class: "bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]",
  }
}

interface TaskCardProps {
  card: TaskCard
  elevated?: boolean
}

export function KanbanCard({ card, elevated }: TaskCardProps) {
  const p = priorityConfig[card.priority]
  const d = dueDateChip(card.due)

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-[var(--card)] p-3.5 cursor-grab active:cursor-grabbing",
        "transition-all duration-150 select-none",
        elevated
          ? "shadow-2xl shadow-indigo-200/60 ring-2 ring-[var(--brand-primary)]/25 rotate-[0.8deg] scale-[1.025] z-10"
          : "shadow-sm hover:shadow-md hover:-translate-y-0.5",
        "border-[var(--border)]"
      )}
    >
      {/* Drag handle (visible on hover) */}
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity">
        <GripVertical size={14} className="text-[var(--muted-foreground)]" />
      </div>

      {/* Top row: ticket + menu */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono font-semibold text-[var(--muted-foreground)] tracking-wider opacity-70">
          {card.ticket}
        </span>
        <button className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity rounded p-0.5 hover:bg-[var(--muted)]">
          <MoreHorizontal size={14} className="text-[var(--muted-foreground)]" />
        </button>
      </div>

      {/* Title */}
      <p className="text-[13px] font-medium text-[var(--foreground)] leading-snug mb-3 pr-2">
        {card.title}
      </p>

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {card.tags.map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--muted)] text-[var(--muted-foreground)] font-medium">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2 mt-1">
        {/* Priority badge */}
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5", p.className)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", priorityDot[card.priority])} />
          {p.label}
        </span>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Due date chip */}
          <span className={cn("text-[10px] font-medium rounded-full px-2 py-0.5", d.class)}>
            {d.label}
          </span>

          {/* Agent avatar */}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ring-2 ring-white"
            style={{ background: card.agent.color }}
            title={card.agent.initials}
          >
            {card.agent.initials}
          </div>
        </div>
      </div>

      {/* Elevated glow bar */}
      {elevated && (
        <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 opacity-60" />
      )}
    </div>
  )
}
