/**
 * Onboarding API - status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { getOnboardingStatus } from '@/server/services/onboarding';

const onboardingRateLimit = {
  maxRequests: 60,
  windowMs: 60 * 1000,
};

export const GET = withMiddleware(onboardingRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const { supabase, userId, organizationId } = await getAuthContext();

  const state = await getOnboardingStatus({ supabase, userId, organizationId });

  return NextResponse.json({ data: state });
});
