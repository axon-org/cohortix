import { MissionsTableClient } from '@/components/missions/missions-table-client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function MissionsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Missions</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your projects from planning to completion.
          </p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          New Mission
        </Button>
      </div>
      <MissionsTableClient />
    </div>
  );
}
