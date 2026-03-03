/**
 * Agent Evolution API
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { validateData, uuidSchema } from '@/lib/validation';
import { ensureAgentAccess } from '@/lib/auth-access';
import { getAgentEvolution } from '@/server/db/queries/agents';

const agentRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
});

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

    const query = validateData(
      querySchema,
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    const { userId, organizationId } = await getAuthContext();

    await ensureAgentAccess(agentId, userId, organizationId);

    const events = await getAgentEvolution(agentId, query.limit);

    return NextResponse.json({ data: events });
  }
);
