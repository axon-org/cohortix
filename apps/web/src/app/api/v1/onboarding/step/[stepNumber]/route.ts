/**
 * Onboarding API - process step
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { validateData } from '@/lib/validation';
import { processOnboardingStep } from '@/server/services/onboarding';

const onboardingRateLimit = {
  maxRequests: 60,
  windowMs: 60 * 1000,
};

const stepParamSchema = z.object({
  stepNumber: z.coerce.number().int().min(1).max(5),
});

interface RouteContext {
  params: Promise<{ stepNumber: string }>;
}

export const POST = withMiddleware(
  onboardingRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { stepNumber } = await context.params;
    const parsed = validateData(stepParamSchema, { stepNumber });

    const body = await request.json().catch(() => ({}));

    const { supabase, userId, organizationId } = await getAuthContext();

    const state = await processOnboardingStep(
      { supabase, userId, organizationId },
      parsed.stepNumber,
      body
    );

    return NextResponse.json({ data: state });
  }
);
