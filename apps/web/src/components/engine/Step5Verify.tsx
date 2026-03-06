'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { WizardData } from './types';
import { useState, useEffect } from 'react';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type VerificationStep = {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
};

export function Step5Verify({
  data,
  cohortId,
  onNext,
  onBack,
}: {
  data: WizardData;
  cohortId: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const [steps, setSteps] = useState<VerificationStep[]>([
    { id: 'connect', label: 'Connecting to gateway...', status: 'pending' },
    { id: 'auth', label: 'Checking authentication...', status: 'pending' },
    { id: 'endpoint', label: 'Verifying HTTP Responses endpoint...', status: 'pending' },
    { id: 'version', label: 'Checking gateway version...', status: 'pending' },
    { id: 'agents', label: 'Discovering agents...', status: 'pending' },
  ]);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Start verification on mount
    const verify = async () => {
      setHasError(false);
      setIsComplete(false);
      setSteps((prev) => prev.map((s) => ({ ...s, status: 'pending', message: undefined })));

      const update = (id: string, status: VerificationStep['status'], msg?: string) => {
        setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status, message: msg } : s)));
      };

      try {
        update('connect', 'running');

        const response = await fetch('/api/v1/engine/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cohortId,
            gatewayUrl: data.gatewayUrl,
            authToken: data.authToken,
            hosting: data.hosting,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          // Handle error response
          const errorType = result.error?.type || 'unknown';
          const errorMessage = result.error?.message || 'Connection failed';

          // Map error to appropriate step
          if (errorType === 'unreachable') {
            update('connect', 'error', errorMessage);
          } else if (errorType === 'auth_failed') {
            update('connect', 'success');
            update('auth', 'error', errorMessage);
          } else if (errorType === 'endpoint_disabled') {
            update('connect', 'success');
            update('auth', 'success');
            update('endpoint', 'error', errorMessage);
          } else if (errorType === 'version_mismatch') {
            update('connect', 'success');
            update('auth', 'success');
            update('endpoint', 'success');
            update('version', 'error', errorMessage);
          } else {
            update('connect', 'error', errorMessage);
          }

          setHasError(true);
          return;
        }

        // Success - update all steps
        update('connect', 'success');
        update('auth', 'success');
        update('endpoint', 'success');
        update('version', 'success', result.data.gatewayVersion);
        update(
          'agents',
          'success',
          `Found ${result.data.existingAgents.length} agent${result.data.existingAgents.length !== 1 ? 's' : ''}`
        );

        setIsComplete(true);
      } catch (err) {
        setHasError(true);
        update('connect', 'error', err instanceof Error ? err.message : 'Connection failed');
      }
    };

    verify();
  }, [retryCount, cohortId, data.gatewayUrl, data.authToken, data.hosting]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
              {step.status === 'pending' && (
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              )}
              {step.status === 'running' && (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              )}
              {step.status === 'success' && <Check className="w-4 h-4 text-green-500" />}
              {step.status === 'error' && <X className="w-4 h-4 text-destructive" />}
            </div>
            <div className="flex-1">
              <p
                className={cn(
                  'text-sm font-medium',
                  step.status === 'pending' && 'text-muted-foreground',
                  step.status === 'error' && 'text-destructive',
                  step.status === 'success' && 'text-foreground'
                )}
              >
                {step.label}
              </p>
              {step.message && (
                <p className="text-xs text-muted-foreground mt-0.5">{step.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasError && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm border border-destructive/20">
          <AlertCircle className="w-4 h-4" />
          <span>Verification failed. Check your connection details and try again.</span>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          {hasError && (
            <Button variant="secondary" onClick={() => setRetryCount((c) => c + 1)}>
              Retry
            </Button>
          )}
          <Button onClick={onNext} disabled={!isComplete}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
