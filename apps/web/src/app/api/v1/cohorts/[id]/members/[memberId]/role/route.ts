/**
 * Cohort Membership API - update member role
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { validateRequest, validateData, uuidSchema } from '@/lib/validation';
import { updateMemberRoleSchema } from '@/lib/validations/cohorts';
import { ensureCohortAdmin } from '@/lib/auth-access';
import { updateMemberRole } from '@/server/db/mutations/cohorts';

const cohortRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

const updateRoleRequestSchema = updateMemberRoleSchema.omit({ cohortId: true, memberId: true });

interface RouteContext {
  params: Promise<{ id: string; memberId: string }>;
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

    await ensureCohortAdmin(cohortId, userId);

    const member = await updateMemberRole({
      cohortId,
      memberId: targetId,
      role: data.role,
      type: data.type,
    });

    return NextResponse.json({ data: member });
  }
);
