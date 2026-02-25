import { Button } from '@/components/ui/button';
import { Compass, Plus } from 'lucide-react';

export default function VisionsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visions</h1>
          <p className="text-muted-foreground mt-1">
            Your north stars. Define what matters most, then align everything to it.
          </p>
        </div>
        <Button variant="outline" disabled>
          <Plus className="w-4 h-4 mr-2" />
          Add Vision
        </Button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Compass className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No visions yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Visions are your long-term life aspirations — the emotional north stars that guide
          everything. Each vision connects to missions, operations, and tasks that bring it to life.
        </p>
        <p className="text-xs text-muted-foreground mt-4">Coming soon</p>
      </div>
    </div>
  );
}
