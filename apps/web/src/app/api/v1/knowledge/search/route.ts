/**
 * Knowledge Hub Search API
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { validateData, uuidSchema } from '@/lib/validation';
import { getCohortById, getCohortUserMembers } from '@/server/db/queries/cohorts';
import { searchKnowledge } from '@/server/services/knowledge-hub';
import type { MemoryLayer } from '@/lib/gateway/memory-search-client';

const knowledgeRateLimit = {
  maxRequests: 20,
  windowMs: 60 * 1000,
};

const querySchema = z.object({
  q: z.string().min(1),
  cohortId: uuidSchema,
  layer: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  entityType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

async function ensureCohortAccess(cohortId: string, userId: string) {
  const cohort = await getCohortById(cohortId);
  if (!cohort) throw new NotFoundError('Cohort', cohortId);

  if (cohort.type === 'personal') {
    if (cohort.ownerUserId !== userId) {
      throw new ForbiddenError('Not allowed');
    }
    return cohort;
  }

  const members = await getCohortUserMembers(cohortId);
  const member = members.find((m) => m.userId === userId);
  if (!member) throw new ForbiddenError('Not a cohort member');

  return cohort;
}

export const GET = withMiddleware(knowledgeRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const query = validateData(querySchema, Object.fromEntries(request.nextUrl.searchParams));
  const { userId } = await getAuthContext();

  const cohort = await ensureCohortAccess(query.cohortId, userId);

  const layers = query.layer
    ? (query.layer
        .split(',')
        .map((layer) => layer.trim())
        .filter(Boolean) as MemoryLayer[])
    : undefined;

  const scopeType = cohort.type === 'personal' ? 'personal' : 'cohort';
  const scopeId = cohort.type === 'personal' ? (cohort.ownerUserId ?? userId) : cohort.id;

  const result = await searchKnowledge({
    query: query.q,
    cohortId: query.cohortId,
    scopeType,
    scopeId,
    page: query.page,
    filters: {
      layers: layers as any,
      entityType: query.entityType,
      startDate: query.startDate,
      endDate: query.endDate,
    },
  });

  return NextResponse.json({
    data: result.results,
    layerStatus: result.layerStatus,
    meta: result.meta,
  });
});
