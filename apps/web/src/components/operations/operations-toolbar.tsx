'use client'

import { Filter, LayoutGrid, List, Sparkles, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { OperationStatus } from '@/components/ui/operation-status-chip'

export type ViewMode = 'grid' | 'list' | 'kanban'

interface FilterState {
  status: OperationStatus[]
  priority: string[]
  assignee: string[]
}

interface OperationsToolbarProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onAskAI?: () => void
  onAddOperation?: () => void
}

const statusOptions: { value: OperationStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

const priorityOptions = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

// Mock assignee options - would come from API in real app
const assigneeOptions = [
  { value: 'user-1', label: 'John Doe', type: 'human' },
  { value: 'user-2', label: 'Jane Smith', type: 'human' },
  { value: 'agent-1', label: 'AI Assistant', type: 'ai' },
  { value: 'agent-2', label: 'Task Automator', type: 'ai' },
]

export function OperationsToolbar({
  view,
  onViewChange,
  filters,
  onFiltersChange,
  onAskAI,
  onAddOperation,
}: OperationsToolbarProps) {
  const handleStatusToggle = (status: OperationStatus) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status]
    onFiltersChange({ ...filters, status: newStatus })
  }

  const handlePriorityToggle = (priority: string) => {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority]
    onFiltersChange({ ...filters, priority: newPriority })
  }

  const handleAssigneeToggle = (assignee: string) => {
    const newAssignee = filters.assignee.includes(assignee)
      ? filters.assignee.filter((a) => a !== assignee)
      : [...filters.assignee, assignee]
    onFiltersChange({ ...filters, assignee: newAssignee })
  }

  const activeFilterCount = 
    filters.status.length + 
    filters.priority.length + 
    filters.assignee.length

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left: Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {/* Status Filters */}
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          {statusOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={filters.status.includes(option.value)}
              onCheckedChange={() => handleStatusToggle(option.value)}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />

          {/* Priority Filters */}
          <DropdownMenuLabel>Priority</DropdownMenuLabel>
          {priorityOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={filters.priority.includes(option.value)}
              onCheckedChange={() => handlePriorityToggle(option.value)}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />

          {/* Assignee Filters */}
          <DropdownMenuLabel>Assignee</DropdownMenuLabel>
          {assigneeOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={filters.assignee.includes(option.value)}
              onCheckedChange={() => handleAssigneeToggle(option.value)}
            >
              <span className="flex items-center gap-2">
                {option.label}
                {option.type === 'ai' && (
                  <span className="text-xs text-blue-500">(AI)</span>
                )}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Right: View Toggle, Ask AI, Add Operation */}
      <div className="flex items-center gap-3">
        {/* View Toggle */}
        <Tabs value={view} onValueChange={(v) => onViewChange(v as ViewMode)}>
          <TabsList className="grid w-[200px] grid-cols-3">
            <TabsTrigger value="grid" className="flex items-center gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Grid</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-1.5">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              <span className="hidden sm:inline">Board</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Ask AI Button */}
        {onAskAI && (
          <Button
            onClick={onAskAI}
            variant="outline"
            size="sm"
            className="gap-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20"
          >
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="hidden sm:inline">Ask AI</span>
          </Button>
        )}

        {/* Add Operation Button */}
        {onAddOperation && (
          <Button onClick={onAddOperation} variant="primary" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Operation
          </Button>
        )}
      </div>
    </div>
  )
}
