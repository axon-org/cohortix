import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { Step1Prerequisites } from './Step1Prerequisites';
import { Step2EnableEndpoint } from './Step2EnableEndpoint';
import { Step3Connectivity } from './Step3Connectivity';
import { Step4Credentials } from './Step4Credentials';
import { Step5Verify } from './Step5Verify';
import { Step6DiscoverAgents } from './Step6DiscoverAgents';
import { Step7CloneSync } from './Step7CloneSync';
import { Step8Success } from './Step8Success';

import { WizardData } from './types';

const STEPS = [
  { id: 'prereqs', title: 'Prerequisites' },
  { id: 'endpoint', title: 'Enable Endpoint' },
  { id: 'connectivity', title: 'Connectivity' },
  { id: 'credentials', title: 'Credentials' },
  { id: 'verify', title: 'Verify' },
  { id: 'discover', title: 'Discover Agents' },
  { id: 'sync', title: 'Sync Clone' },
  { id: 'success', title: 'Done' },
];

export function EngineSetupWizard({ cohortId }: { cohortId: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    gatewayUrl: '',
    authToken: '',
    hosting: 'self_hosted',
    connectionType: 'tailscale',
  });

  const nextStep = useCallback(
    () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1)),
    []
  );
  const prevStep = useCallback(() => setCurrentStep((prev) => Math.max(prev - 1, 0)), []);

  const updateData = (updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1Prerequisites onNext={nextStep} />;
      case 1:
        return <Step2EnableEndpoint onNext={nextStep} onBack={prevStep} />;
      case 2:
        return (
          <Step3Connectivity
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <Step4Credentials
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return <Step5Verify data={data} cohortId={cohortId} onNext={nextStep} onBack={prevStep} />;
      case 5:
        return <Step6DiscoverAgents data={data} cohortId={cohortId} onNext={nextStep} />;
      case 6:
        return <Step7CloneSync cohortId={cohortId} onNext={nextStep} />;
      case 7:
        return <Step8Success cohortId={cohortId} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-2xl w-full space-y-8 p-6">
      {/* Progress Stepper */}
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
          {STEPS.map((step, stepIdx) => (
            <li
              key={step.id}
              className={cn(stepIdx !== STEPS.length - 1 ? 'pr-8 sm:pr-20' : '', 'relative')}
            >
              {stepIdx < currentStep ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-primary" />
                  </div>
                  <a
                    href="#"
                    className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary hover:bg-primary/90"
                  >
                    <Check className="h-5 w-5 text-white" aria-hidden="true" />
                    <span className="sr-only">{step.title}</span>
                  </a>
                </>
              ) : stepIdx === currentStep ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-muted" />
                  </div>
                  <a
                    href="#"
                    className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background"
                    aria-current="step"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                    <span className="sr-only">{step.title}</span>
                  </a>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-muted" />
                  </div>
                  <a
                    href="#"
                    className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background hover:border-gray-400"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{step.title}</span>
                  </a>
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {STEPS.length}: Configure your OpenClaw Engine
          </CardDescription>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>
    </div>
  );
}
