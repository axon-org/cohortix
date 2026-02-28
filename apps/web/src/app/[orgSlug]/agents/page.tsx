import { AgentsTableClient } from '@/components/agents/agents-table-client';
import { PlaceholderButton } from '@/components/ui/placeholder-button';

export default function AgentsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground mt-1">
            Manage your AI agents and their capabilities.
          </p>
        </div>
        <PlaceholderButton label="New Agent" />
      </div>
      <AgentsTableClient />
    </div>
  );
}
