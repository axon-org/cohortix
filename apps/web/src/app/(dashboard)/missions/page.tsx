import { MissionsTableClient } from '@/components/missions/missions-table-client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function MissionsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operations</h1>
          <p className="text-muted-foreground mt-1">
            Bounded initiatives with start/end dates that achieve your Missions.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Operation
        </Button>
      </div>
      <MissionsTableClient />
    </div>
  )
}
