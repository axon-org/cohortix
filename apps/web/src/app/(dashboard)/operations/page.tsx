import { OperationsTableClient } from '@/components/operations/operations-table-client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function OperationsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operations</h1>
          <p className="text-muted-foreground mt-1">
            Manage bounded initiatives and projects that support your missions.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Operation
        </Button>
      </div>

      {/* Operations Table */}
      <OperationsTableClient />
    </div>
  )
}
