/**
 * Task Sessions API - create and list
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { validateRequest, validateData, uuidSchema } from '@/lib/validation';
import { getCohortById, getCohortUserMembers } from '@/server/db/queries/cohorts';
import { createTaskSession, getTaskSessionsByTask } from '@/server/services/task-sessions';

const taskSessionRateLimit = {
  maxRequests: 60,
  windowMs: 60 * 1000,
};

const createTaskSessionSchema = z.object({
  taskId: uuidSchema,
  agentId: uuidSchema,
  cohortId: uuidSchema.optional().nullable(),
  scopeType: z.enum(['personal', 'cohort', 'org']),
  scopeId: uuidSchema,
  gatewaySessionId: z.string().optional().nullable(),
});

const querySchema = z.object({
  taskId: uuidSchema,
});

async function ensureAccess(
  cohortId: string | null | undefined,
  scopeType: 'personal' | 'cohort' | 'org',
  scopeId: string,
  userId: string,
  organizationId: string
) {
  if (scopeType === 'personal' && scopeId !== userId) {
    throw new ForbiddenError('Not allowed');
  }

  if (scopeType === 'org' && scopeId !== organizationId) {
    throw new ForbiddenError('Not allowed');
  }

  if (cohortId) {
    const cohort = await getCohortById(cohortId);
    if (!cohort) throw new NotFoundError('Cohort', cohortId);

    if (cohort.type === 'personal') {
      if (cohort.ownerUserId !== userId) throw new ForbiddenError('Not allowed');
      return;
    }

    const members = await getCohortUserMembers(cohortId);
    const member = members.find((m) => m.userId === userId);
    if (!member) throw new ForbiddenError('Not a cohort member');
  }
}

export const GET = withMiddleware(taskSessionRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const query = validateData(querySchema, Object.fromEntries(request.nextUrl.searchParams));

  const { userId, organizationId } = await getAuthContext();

  await ensureAccess(undefined, 'org', organizationId, userId, organizationId);

  const sessions = await getTaskSessionsByTask(query.taskId);

  return NextResponse.json({ data: sessions });
});

export const POST = withMiddleware(taskSessionRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const validator = validateRequest(createTaskSessionSchema, { target: 'body' });
  const data = await validator(request);

  const { userId, organizationId } = await getAuthContext();

  await ensureAccess(data.cohortId, data.scopeType, data.scopeId, userId, organizationId);

  const session = await createTaskSession({
    taskId: data.taskId,
    agentId: data.agentId,
    cohortId: data.cohortId ?? null,
    scopeType: data.scopeType,
    scopeId: data.scopeId,
    gatewaySessionId: data.gatewaySessionId ?? null,
  });

  return NextResponse.json({ data: session }, { status: 201 });
});
