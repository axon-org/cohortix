/**
 * Agent Stats API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { validateData, uuidSchema } from '@/lib/validation';
import { ensureAgentAccess } from '@/lib/auth-access';
import { getAgentStats } from '@/server/db/queries/agents';

const agentRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withMiddleware(
  agentRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const agentId = validateData(uuidSchema, id);

    const { userId, organizationId } = await getAuthContext();

    await ensureAgentAccess(agentId, userId, organizationId);

    const stats = await getAgentStats(agentId);

    return NextResponse.json({ data: stats });
  }
);
