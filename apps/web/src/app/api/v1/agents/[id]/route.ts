/**
 * Individual Agent API Route - GET, PATCH, DELETE
 * Axon Codex v1.2 compliant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { createRateLimiter, withMiddleware } from '@/lib/rate-limit';
import { validateRequest, validateData, uuidSchema } from '@/lib/validation';
import { updateAgentSchema, type UpdateAgentInput } from '@/lib/validations/agents';
import { getAgentById } from '@/server/db/queries/agents';
import { getCohortUserMembers } from '@/server/db/queries/cohorts';
import { updateAgent, deleteAgent } from '@/server/db/mutations/agents';

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

// ============================================================================
// GET /api/v1/agents/:id
// ============================================================================

export const GET = withMiddleware(
  agentRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const agentId = validateData(uuidSchema, id);

    const { userId, organizationId } = await getAuthContext();
    await enforceUserRateLimit(request, userId);

    const agent = await ensureAgentAccess(agentId, userId, organizationId);

    return NextResponse.json({ data: agent });
  }
);

// ============================================================================
// PATCH /api/v1/agents/:id
// ============================================================================

export const PATCH = withMiddleware(
  agentRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const agentId = validateData(uuidSchema, id);

    const validator = validateRequest(updateAgentSchema, { target: 'body' });
    const data = (await validator(request)) as UpdateAgentInput;

    const { userId, organizationId } = await getAuthContext();
    await enforceUserRateLimit(request, userId);

    await ensureAgentAccess(agentId, userId, organizationId);

    const agent = await updateAgent(agentId, data);
    if (!agent) throw new NotFoundError('Agent', agentId);

    return NextResponse.json({ data: agent });
  }
);

// ============================================================================
// DELETE /api/v1/agents/:id
// ============================================================================

export const DELETE = withMiddleware(
  agentRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const agentId = validateData(uuidSchema, id);

    const { userId, organizationId } = await getAuthContext();
    await enforceUserRateLimit(request, userId);

    await ensureAgentAccess(agentId, userId, organizationId);

    const agent = await deleteAgent(agentId);
    if (!agent) throw new NotFoundError('Agent', agentId);

    return NextResponse.json({ data: agent });
  }
);
