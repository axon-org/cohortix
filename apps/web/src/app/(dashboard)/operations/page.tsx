'use client'

import { useState } from 'react'
import { OperationsTableClient } from '@/components/operations/operations-table-client'
import { OperationModal } from '@/components/operations/operation-modal'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { useOperations } from '@/hooks/use-operations'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function OperationsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [view, setView] = useState<'list' | 'kanban'>('kanban')
  const { data, isLoading } = useOperations({ limit: 100 })

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
          <div className="flex items-center gap-3">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList className="grid w-[160px] grid-cols-2">
                <TabsTrigger value="kanban" className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Operation
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {view === 'kanban' ? (
            isLoading ? (
              <div className="flex gap-6 h-full overflow-x-auto pb-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-[320px] bg-muted/20 rounded-lg animate-pulse h-full min-h-[500px]" />
                ))}
              </div>
            ) : (
              <KanbanBoard initialTasks={data?.data || []} />
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
