'use client';

import React, { useState, useMemo } from 'react';
import { MyTasksTable } from '@/components/tasks/my-tasks-table';
import { useMyTasks } from '@/hooks/use-my-tasks';
import type { MyTasksQueryParams } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckSquare, Filter, ChevronDown, ArrowUpDown, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const STATUS_FILTERS = [
  { label: 'All Status', value: 'all' },
  { label: 'Backlog', value: 'backlog' },
  { label: 'Todo', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Review', value: 'review' },
  { label: 'Done', value: 'done' },
];

const PRIORITY_FILTERS = [
  { label: 'All Priority', value: 'all' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

const GROUP_BY_OPTIONS = [
  { label: 'Status', value: 'status' },
  { label: 'Priority', value: 'priority' },
  { label: 'Cohort', value: 'cohort' },
];

export default function GlobalMyTasksPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [groupBy, setGroupBy] = useState('status');

  const queryParams = useMemo(
    () => ({
      status: statusFilter === 'all' ? undefined : (statusFilter as MyTasksQueryParams['status']),
      priority:
        priorityFilter === 'all' ? undefined : (priorityFilter as MyTasksQueryParams['priority']),
    }),
    [statusFilter, priorityFilter]
  );

  const { data, isLoading, error } = useMyTasks(queryParams);

  // Mock cohorts for the filter - in real app this would come from a useCohorts hook
  const sources = [
    { id: 'all', name: 'All Sources' },
    { id: 'personal', name: 'Personal Cohort' },
    { id: 'org1', name: 'Madsgency' },
    { id: 'org2', name: 'Filmzya' },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CheckSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-muted-foreground text-sm">
              Aggregated view of tasks across your personal and organization cohorts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {sources.find((s) => s.id === sourceFilter)?.name}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Source</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sources.map((source) => (
                <DropdownMenuItem key={source.id} onClick={() => setSourceFilter(source.id)}>
                  {source.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Group by: {GROUP_BY_OPTIONS.find((g) => g.value === groupBy)?.label}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {GROUP_BY_OPTIONS.map((option) => (
                <DropdownMenuItem key={option.value} onClick={() => setGroupBy(option.value)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2 pb-2 overflow-x-auto no-scrollbar">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(filter.value)}
            className="rounded-full px-4 h-8 text-xs"
          >
            {filter.label}
          </Button>
        ))}
        <div className="w-px h-4 bg-border mx-2" />
        {PRIORITY_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={priorityFilter === filter.value ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setPriorityFilter(filter.value)}
            className="rounded-full px-4 h-8 text-xs"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-destructive/5 rounded-xl border border-destructive/10">
          <p className="text-destructive font-medium">Failed to load aggregated tasks</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      ) : (
        <MyTasksTable tasks={data?.data || []} groupBy={groupBy} />
      )}
    </div>
  );
}
