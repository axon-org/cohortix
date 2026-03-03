/**
 * Cohort Membership API - list members
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { validateData, uuidSchema } from '@/lib/validation';
import { ensureCohortMember } from '@/lib/auth-access';
import { getCohortAgentMembers, getCohortUserMembers } from '@/server/db/queries/cohorts';

const cohortRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withMiddleware(
  cohortRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const cohortId = validateData(uuidSchema, id);

    const { userId } = await getAuthContext();

    await ensureCohortMember(cohortId, userId);

    const [users, agents] = await Promise.all([
      getCohortUserMembers(cohortId),
      getCohortAgentMembers(cohortId),
    ]);

    return NextResponse.json({ data: { users, agents } });
  }
);
