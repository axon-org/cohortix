"use client"

import { Plus, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { KanbanCard, TaskCard } from "./kanban-card"

interface KanbanColumnProps {
  title: string
  count: number
  cards: TaskCard[]
  accentClass: string
  accentBg: string
  elevatedId?: string
}

export function KanbanColumn({
  title,
  count,
  cards,
  accentClass,
  accentBg,
  elevatedId,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[272px] w-[272px] flex-shrink-0 h-full">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", accentClass)} />
        <h2 className="text-[13px] font-semibold text-[var(--foreground)] tracking-tight">
          {title}
        </h2>
        <span
          className={cn(
            "ml-1 text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none",
            accentBg
          )}
        >
          {count}
        </span>
        <button className="ml-auto opacity-40 hover:opacity-80 transition-opacity rounded p-0.5 hover:bg-[var(--muted)]">
          <MoreHorizontal size={14} className="text-[var(--foreground)]" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          "flex-1 rounded-xl p-2 space-y-2.5 overflow-y-auto",
          "bg-[var(--muted)]/50 border border-dashed border-[var(--border)] min-h-[120px]"
        )}
      >
        {cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            elevated={card.id === elevatedId}
          />
        ))}

        {/* Add card button */}
        <button className="flex items-center gap-1.5 w-full rounded-lg px-3 py-2 text-[12px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors group">
          <Plus size={13} className="opacity-50 group-hover:opacity-100 transition-opacity" />
          Add task
        </button>
      </div>
    </div>
  )
}
