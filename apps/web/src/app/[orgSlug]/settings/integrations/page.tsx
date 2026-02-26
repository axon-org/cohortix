import { Blocks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-muted/30">
      <div className="w-12 h-12 bg-background border border-border rounded-full flex items-center justify-center mb-4">
        <Blocks className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-lg font-medium">Integrations</h2>
        <Badge variant="secondary" className="text-xs">
          Coming Soon
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground max-w-sm">
        Connect your favorite tools like Slack, Discord, and GitHub. This feature is coming in a
        future update.
      </p>
    </div>
  );
}
