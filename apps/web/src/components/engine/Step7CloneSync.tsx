import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Step7CloneSync({ cohortId, onNext }: { cohortId: string; onNext: () => void }) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'done'>('idle');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const sync = async () => {
      setStatus('syncing');
      await new Promise((r) => setTimeout(r, 2000));
      setStatus('done');
      timeoutId = setTimeout(onNext, 1000);
    };
    sync();
    return () => clearTimeout(timeoutId);
  }, [onNext]);

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75"></div>
        <div className="relative bg-background p-4 rounded-full border-2 border-primary">
          {status === 'done' ? (
            <FileText className="h-8 w-8 text-primary" />
          ) : (
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          )}
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">Syncing Clone Foundation</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          We&apos;re writing your values, voice, and expertise to the agent&apos;s workspace files
          (SOUL.md).
        </p>
      </div>

      <div className="w-full max-w-xs bg-muted rounded-full h-2 overflow-hidden">
        <div className="h-full bg-primary transition-all duration-[2000ms] ease-out w-full origin-left animate-[grow_2s_ease-out]" />
      </div>
    </div>
  );
}
