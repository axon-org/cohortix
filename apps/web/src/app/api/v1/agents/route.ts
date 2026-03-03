/**
 * Agents API Route - GET (list) and POST (create)
 * Axon Codex v1.2 compliant
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { validateRequest, validateData } from '@/lib/validation';
import { agentScopeTypeEnum, agentStatusEnum, createAgentSchema } from '@/lib/validations/agents';
import { getAgents } from '@/server/db/queries/agents';
import { getCohortById, getCohortUserMembers } from '@/server/db/queries/cohorts';
import { createAgent } from '@/server/db/mutations/agents';

const agentRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

const agentQuerySchema = z.object({
  scopeType: agentScopeTypeEnum.optional(),
  scopeId: z.string().uuid().optional(),
  status: agentStatusEnum.optional(),
  search: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['name', 'created_at', 'status', 'total_tasks_completed']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createAgentRequestSchema = createAgentSchema
  .omit({
    organizationId: true,
    ownerUserId: true,
  })
  .extend({
    scopeType: agentScopeTypeEnum.optional(),
    scopeId: z.string().uuid().optional(),
  });

async function resolveScope(
  scopeType: 'personal' | 'cohort' | 'org' | undefined,
  scopeId: string | undefined,
  organizationId: string,
  userId: string
) {
  const resolvedScopeType = scopeType ?? 'org';

  if (resolvedScopeType === 'personal') {
    if (scopeId && scopeId !== userId) throw new ForbiddenError('Invalid personal scope');
    return { scopeType: 'personal' as const, scopeId: userId, ownerUserId: userId };
  }

  if (resolvedScopeType === 'org') {
    if (scopeId && scopeId !== organizationId) throw new ForbiddenError('Invalid org scope');
    return { scopeType: 'org' as const, scopeId: organizationId, organizationId };
  }

  if (!scopeId) throw new ForbiddenError('Cohort scope requires scopeId');

  const cohort = await getCohortById(scopeId);
  if (!cohort) throw new NotFoundError('Cohort', scopeId);

  const members = await getCohortUserMembers(scopeId);
  const member = members.find((m) => m.userId === userId);
  if (!member) throw new ForbiddenError('Not a cohort member');

  return {
    scopeType: 'cohort' as const,
    scopeId,
    organizationId: cohort.organizationId ?? organizationId,
  };
}

// ============================================================================
// GET /api/v1/agents - List agents
// ============================================================================

export const GET = withMiddleware(agentRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = validateData(agentQuerySchema, searchParams);

  const { organizationId, userId } = await getAuthContext();

  const resolved = await resolveScope(query.scopeType, query.scopeId, organizationId, userId);

  const agents = await getAgents(resolved.scopeType, resolved.scopeId, {
    status: query.status,
    search: query.search,
    limit: query.limit,
    offset: query.offset,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return NextResponse.json({ data: agents });
});

// ============================================================================
// POST /api/v1/agents - Create a new agent
// ============================================================================

export const POST = withMiddleware(agentRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const validator = validateRequest(createAgentRequestSchema, { target: 'body' });
  const data = await validator(request);

  const { organizationId, userId } = await getAuthContext();

  const resolved = await resolveScope(data.scopeType, data.scopeId, organizationId, userId);

  const agent = await createAgent({
    ...data,
    scopeType: resolved.scopeType,
    scopeId: resolved.scopeId,
    organizationId: resolved.organizationId ?? null,
    ownerUserId: resolved.ownerUserId ?? null,
  });

  return NextResponse.json({ data: agent }, { status: 201 });
});
