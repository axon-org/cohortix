/**
 * Cohort Membership API - add user member
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { validateRequest, validateData, uuidSchema } from '@/lib/validation';
import { addUserMemberSchema } from '@/lib/validations/cohorts';
import { ensureCohortAdmin } from '@/lib/auth-access';
import { addUserMember, updateCohortMemberCount } from '@/server/db/mutations/cohorts';

const addUserRequestSchema = addUserMemberSchema.omit({ cohortId: true });

const cohortRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

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

    const validator = validateRequest(addUserRequestSchema, { target: 'body' });
    const data = await validator(request);

    const { userId } = await getAuthContext();

    await ensureCohortAdmin(cohortId, userId);

    const member = await addUserMember({
      cohortId,
      userId: data.userId,
      role: data.role,
    });

    await updateCohortMemberCount(cohortId);

    return NextResponse.json({ data: member }, { status: 201 });
  }
);
