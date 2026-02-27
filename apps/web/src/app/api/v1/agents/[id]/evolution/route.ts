/**
 * Agent Evolution API
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { createRateLimiter, withMiddleware } from '@/lib/rate-limit';
import { validateData, uuidSchema } from '@/lib/validation';
import { getAgentById, getAgentEvolution } from '@/server/db/queries/agents';
import { getCohortUserMembers } from '@/server/db/queries/cohorts';

const agentRateLimit = {
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
    ...agentRateLimit,
    keyGenerator: () => `user:${userId}`,
  });
  await limiter(request);
}

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function ensureAgentAccess(agentId: string, userId: string, organizationId: string) {
  const agent = await getAgentById(agentId);
  if (!agent) throw new NotFoundError('Agent', agentId);

  if (agent.scopeType === 'personal') {
    if (agent.ownerUserId !== userId) throw new ForbiddenError('Not allowed');
    return agent;
  }

  if (agent.scopeType === 'org') {
    if (agent.organizationId !== organizationId) throw new ForbiddenError('Not allowed');
    return agent;
  }

  if (agent.scopeType === 'cohort') {
    const members = await getCohortUserMembers(agent.scopeId);
    const member = members.find((m) => m.userId === userId);
    if (!member) throw new ForbiddenError('Not a cohort member');
    return agent;
  }

  return agent;
}

export const GET = withMiddleware(
  agentRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const agentId = validateData(uuidSchema, id);

    const query = validateData(querySchema, Object.fromEntries(request.nextUrl.searchParams.entries()));

    const { userId, organizationId } = await getAuthContext();
    await enforceUserRateLimit(request, userId);

    await ensureAgentAccess(agentId, userId, organizationId);

    const events = await getAgentEvolution(agentId, query.limit);

    return NextResponse.json({ data: events });
  }
);
