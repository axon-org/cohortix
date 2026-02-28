/**
 * Onboarding API - start
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { startOnboarding } from '@/server/services/onboarding';

const onboardingRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

export const POST = withMiddleware(onboardingRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const { supabase, userId, organizationId } = await getAuthContext();

  const state = await startOnboarding({ supabase, userId, organizationId });

  return NextResponse.json({ data: state });
});
