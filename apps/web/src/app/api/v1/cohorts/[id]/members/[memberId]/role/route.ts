/**
 * Cohort Membership API - update member role
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { createRateLimiter, withMiddleware } from '@/lib/rate-limit';
import { validateRequest, validateData, uuidSchema } from '@/lib/validation';
import { updateMemberRoleSchema } from '@/lib/validations/cohorts';
import { getCohortById, getCohortUserMembers } from '@/server/db/queries/cohorts';
import { updateMemberRole } from '@/server/db/mutations/cohorts';

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

const updateRoleRequestSchema = updateMemberRoleSchema.omit({ cohortId: true, memberId: true });

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

export const PATCH = withMiddleware(
  cohortRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id, memberId } = await context.params;
    const cohortId = validateData(uuidSchema, id);
    const targetId = validateData(uuidSchema, memberId);

    const validator = validateRequest(updateRoleRequestSchema, { target: 'body' });
    const data = await validator(request);

    const { userId } = await getAuthContext();
    await enforceUserRateLimit(request, userId);

    await ensureAdmin(cohortId, userId);

    const member = await updateMemberRole({
      cohortId,
      memberId: targetId,
      role: data.role,
      type: data.type,
    });

    return NextResponse.json({ data: member });
  }
);
