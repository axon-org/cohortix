'use client';

import React, { useState } from 'react';
import { KanbanBoard, type GroupBy } from '@/components/kanban/kanban-board';
import { Plus, ListFilter, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { type Operation } from '@/lib/api/client';

type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string;
  projectId?: string;
  projects?: { id: string; name: string; status: string };
  createdAt: string;
  updatedAt?: string;
};

interface KanbanViewProps {
  initialTasks: Operation[] | Task[];
  viewType?: 'tasks' | 'operations';
}

export function KanbanView({ initialTasks, viewType = 'operations' }: KanbanViewProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('status');

  const isTasksView = viewType === 'tasks';
  const title = isTasksView ? 'Tasks' : 'Kanban';
  const subtitle = isTasksView
    ? 'Manage your tasks across the workflow.'
    : 'Manage your operations across the workflow.';
  const buttonText = isTasksView ? 'New Task' : 'New Operation';

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
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
              <DropdownMenuItem onClick={() => setGroupBy('status')}>By Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('mission')}>By Mission</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('owner')}>By Agent</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" variant="primary" className="gap-2">
            <Plus className="w-4 h-4" />
            {buttonText}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard initialTasks={initialTasks} groupBy={groupBy} />
      </div>
    </div>
  );
}
