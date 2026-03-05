import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Copy } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Step2EnableEndpoint({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const command = 'openclaw config set gateway.http.endpoints.responses.enabled true';

  const copyCommand = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Enable HTTP Responses</h3>
        <p className="text-muted-foreground text-sm">
          Cohortix needs the HTTP response endpoint enabled on your OpenClaw Engine to send and
          receive tasks.
        </p>

        <Alert variant="default" className="bg-muted border-primary/20">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Run this command</AlertTitle>
          <AlertDescription className="mt-2 flex items-center justify-between gap-4 bg-background p-3 rounded font-mono text-xs border">
            <code className="break-all">{command}</code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 hover:bg-muted"
              onClick={copyCommand}
            >
              <Copy
                className={cn(
                  'h-4 w-4 transition-all',
                  copied ? 'text-green-500 scale-110' : 'text-muted-foreground'
                )}
              />
            </Button>
          </AlertDescription>
        </Alert>

        <p className="text-xs text-muted-foreground">
          This allows Cohortix to send tasks via HTTP POST requests to your engine. Restart your
          gateway after changing config:{' '}
          <code className="bg-muted px-1 py-0.5 rounded">openclaw gateway restart</code>
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next: Connectivity</Button>
      </div>
    </div>
  );
}
