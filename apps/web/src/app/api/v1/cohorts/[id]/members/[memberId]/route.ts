/**
 * Cohort Membership API - remove member
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { createRateLimiter, withMiddleware } from '@/lib/rate-limit';
import { validateData, uuidSchema } from '@/lib/validation';
import { getCohortById, getCohortUserMembers } from '@/server/db/queries/cohorts';
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

async function ensureAdmin(cohortId: string, userId: string) {
  const cohort = await getCohortById(cohortId);
  if (!cohort) throw new NotFoundError('Cohort', cohortId);

  if (cohort.type === 'personal') {
    if (cohort.ownerUserId !== userId) throw new ForbiddenError('Not allowed');
    return cohort;
  }

  const members = await getCohortUserMembers(cohortId);
  const member = members.find((m) => m.userId === userId);
  if (!member || !['owner', 'admin'].includes(member.role)) {
    throw new ForbiddenError('Only cohort owners/admins can modify membership');
  }

  return cohort;
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

    await ensureAdmin(cohortId, userId);

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
