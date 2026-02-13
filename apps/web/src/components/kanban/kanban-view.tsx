'use client'

import React, { useState } from 'react'
import { KanbanBoard, type GroupBy } from '@/components/kanban/kanban-board'
import { Plus, ListFilter, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { type Operation } from '@/lib/api/client'

interface KanbanViewProps {
  initialTasks: Operation[]
}

export function KanbanView({ initialTasks }: KanbanViewProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('status')

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kanban</h1>
          <p className="text-sm text-muted-foreground">
            Manage your operations across the workflow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ListFilter className="w-4 h-4" />
                Group by: {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Swimlanes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setGroupBy('status')}>
                By Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('mission')}>
                By Mission
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('owner')}>
                By Ally
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            New Operation
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard initialTasks={initialTasks} groupBy={groupBy} />
      </div>
    </div>
  )
}
