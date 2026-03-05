import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ExternalLink } from 'lucide-react';

export function Step1Prerequisites({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">OpenClaw CLI Installed</h3>
            <p className="text-muted-foreground text-sm">
              You need the OpenClaw CLI installed on your machine or server. Version 2026.1.29 or
              higher is required.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-2 rounded-full">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Engine Running</h3>
            <p className="text-muted-foreground text-sm">
              The OpenClaw gateway service must be running. Run{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">openclaw gateway status</code>{' '}
              to check.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg border border-border">
        <h4 className="font-medium text-sm mb-2">Not installed yet?</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Run this command in your terminal to install OpenClaw:
        </p>
        <pre className="bg-background p-3 rounded text-xs font-mono overflow-x-auto border">
          curl -fsSL https://openclaw.sh/install | sh
        </pre>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onNext}>I have OpenClaw ready</Button>
      </div>
    </div>
  );
}
