import { CohortsTableClient } from '@/components/cohorts/cohorts-table-client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function CohortsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cohorts</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your cohorts performance.
          </p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          New Cohort
        </Button>
      </div>

      {/* Cohorts Table - Now using real API data */}
      <CohortsTableClient />
    </div>
  )
}
