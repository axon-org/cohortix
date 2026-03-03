/**
 * Cohort Membership API - remove member
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import { ensureCohortAdmin } from '@/lib/auth-access';
import { logger } from '@/lib/logger';
import { createRateLimiter, withMiddleware } from '@/lib/rate-limit';
import { validateData, uuidSchema } from '@/lib/validation';
import {
  removeMember,
  updateCohortEngagement,
  updateCohortMemberCount,
} from '@/server/db/mutations/cohorts';

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

const removeQuerySchema = z.object({
  type: z.enum(['user', 'agent']),
});

interface RouteContext {
  params: Promise<{ id: string; memberId: string }>;
}

export const DELETE = withMiddleware(
  cohortRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id, memberId } = await context.params;
    const cohortId = validateData(uuidSchema, id);
    const targetId = validateData(uuidSchema, memberId);

    const query = validateData(
      removeQuerySchema,
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    const { userId } = await getAuthContext();
    await enforceUserRateLimit(request, userId);

    await ensureCohortAdmin(cohortId, userId);

    const member = await removeMember({
      cohortId,
      memberId: targetId,
      type: query.type,
    });

    await updateCohortMemberCount(cohortId);
    if (query.type === 'agent') {
      await updateCohortEngagement(cohortId);
    }

    return NextResponse.json({ data: member });
  }
);
