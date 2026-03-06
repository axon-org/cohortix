'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function Step8Success({ cohortId }: { cohortId: string }) {
  const [showTick, setShowTick] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowTick(true), 300);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
      <div className="relative transform transition-all duration-700 ease-out scale-100">
        <div
          className={`bg-green-100 p-4 rounded-full transition-all duration-500 ${showTick ? 'scale-110 opacity-100' : 'scale-50 opacity-0'}`}
        >
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-semibold tracking-tight">Engine Connected!</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Your Cohort is now powered by your OpenClaw Engine. You can now assign tasks to your
          agents and they will execute on your local machine.
        </p>
      </div>

      <div className="pt-4">
        <Link href={`/cohorts/${cohortId}`}>
          <Button size="lg" className="gap-2">
            Go to Cohort Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
