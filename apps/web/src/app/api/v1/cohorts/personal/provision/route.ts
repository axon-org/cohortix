/**
 * Personal Cohort Provisioning Route
 * POST /api/v1/cohorts/personal/provision
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@clerk/nextjs/server';
import { getAuthContextBasic } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { createRateLimiter, withMiddleware } from '@/lib/rate-limit';
import { validateRequest } from '@/lib/validation';
import { provisionPersonalCohort } from '@/server/db/mutations/cohorts';

const cohortRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

const shouldSkipRateLimit = () =>
  process.env.NODE_ENV === 'test' ||
  process.env.E2E_SKIP_AUTH === 'true' ||
  process.env.BYPASS_AUTH === 'true';

async function enforceUserRateLimit(request: NextRequest, userId: string) {
  if (shouldSkipRateLimit()) return;
  const limiter = createRateLimiter({
    ...cohortRateLimit,
    keyGenerator: () => `user:${userId}`,
  });
  await limiter(request);
}

const provisionSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
});

export const POST = withMiddleware(cohortRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const validator = validateRequest(provisionSchema, { target: 'body' });
  const data = await validator(request);

  const { userId } = await getAuthContextBasic();
  await enforceUserRateLimit(request, userId);

  const clerkUser = await currentUser();
  const firstName = data.firstName || clerkUser?.firstName || 'Personal';

  logger.info('Provisioning personal cohort', { correlationId, userId, firstName });

  const cohort = await provisionPersonalCohort(userId, firstName);

  return NextResponse.json({ data: cohort }, { status: 201 });
});
