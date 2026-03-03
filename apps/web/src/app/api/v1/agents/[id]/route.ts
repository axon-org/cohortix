/**
 * Individual Agent API Route - GET, PATCH, DELETE
 * Axon Codex v1.2 compliant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { validateRequest, validateData, uuidSchema } from '@/lib/validation';
import { updateAgentSchema, type UpdateAgentInput } from '@/lib/validations/agents';
import { ensureAgentAccess } from '@/lib/auth-access';
import { updateAgent, deleteAgent } from '@/server/db/mutations/agents';

const agentRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

interface RouteContext {
  params: Promise<{ id: string }>;
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

    await ensureAgentAccess(agentId, userId, organizationId);

    const agent = await deleteAgent(agentId);
    if (!agent) throw new NotFoundError('Agent', agentId);

    return NextResponse.json({ data: agent });
  }
);
