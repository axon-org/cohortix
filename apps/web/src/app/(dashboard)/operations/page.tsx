'use client';

import { useState } from 'react'
import { OperationsTableClient } from '@/components/operations/operations-table-client'
import { OperationModal } from '@/components/operations/operation-modal'
import { OperationsGrid } from '@/components/operations/operations-grid'
import { OperationsToolbar, type ViewMode } from '@/components/operations/operations-toolbar'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { useOperations } from '@/hooks/use-operations'
import type { OperationStatus } from '@/components/ui/operation-status-chip'

export default function OperationsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [view, setView] = useState<ViewMode>('grid')
  const [filters, setFilters] = useState<{
    status: OperationStatus[]
    priority: string[]
    assignee: string[]
  }>({
    status: [],
    priority: [],
    assignee: [],
  })

  const { data, isLoading } = useOperations({ limit: 100 })

  // Filter operations based on selected filters
  const filteredOperations =
    data?.data?.filter((op) => {
      if (filters.status.length > 0 && !filters.status.includes(op.status)) {
        return false
      }
      if (filters.priority.length > 0) {
        const opPriority = op.settings?.priority as string
        if (!opPriority || !filters.priority.includes(opPriority)) {
          return false
        }
      }
      if (filters.assignee.length > 0) {
        const opOwnerId = op.ownerId
        if (!opOwnerId || !filters.assignee.includes(opOwnerId)) {
          return false
        }
      }
      return true
    }) || []

  const handleAskAI = () => {
    // TODO: Implement Ask AI functionality
    console.log('Ask AI clicked')
  }

  return (
    <>
      <div className="space-y-6 h-full flex flex-col">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Operations</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage bounded initiatives and projects that support your missions.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <OperationsToolbar
          view={view}
          onViewChange={setView}
          filters={filters}
          onFiltersChange={setFilters}
          onAskAI={handleAskAI}
          onAddOperation={() => setModalOpen(true)}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {view === 'grid' ? (
            <OperationsGrid
              operations={filteredOperations}
              isLoading={isLoading}
              onCreateClick={() => setModalOpen(true)}
            />
          ) : view === 'kanban' ? (
            isLoading ? (
              <div className="flex gap-6 h-full overflow-x-auto pb-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-[320px] bg-muted/20 rounded-lg animate-pulse h-full min-h-[500px]"
                  />
                ))}
              </div>
            ) : (
              <KanbanBoard initialTasks={filteredOperations} />
            )
          ) : (
            <OperationsTableClient />
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <OperationModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
