/**
 * Cohort Membership API - add agent member
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { validateRequest, validateData, uuidSchema } from '@/lib/validation';
import { addAgentMemberSchema } from '@/lib/validations/cohorts';
import { ensureCohortAdmin } from '@/lib/auth-access';
import {
  addAgentMember,
  updateCohortEngagement,
  updateCohortMemberCount,
} from '@/server/db/mutations/cohorts';

const cohortRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

const addAgentRequestSchema = addAgentMemberSchema.omit({ cohortId: true });

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withMiddleware(
  cohortRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const cohortId = validateData(uuidSchema, id);

    const validator = validateRequest(addAgentRequestSchema, { target: 'body' });
    const data = await validator(request);

    const { userId } = await getAuthContext();

    await ensureCohortAdmin(cohortId, userId);

    const member = await addAgentMember({
      cohortId,
      agentId: data.agentId,
      role: data.role,
    });

    await Promise.all([updateCohortMemberCount(cohortId), updateCohortEngagement(cohortId)]);

    return NextResponse.json({ data: member }, { status: 201 });
  }
);
