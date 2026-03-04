/**
 * Missions API Route - GET (list) and POST (create)
 * Maps to `missions` table (PPV Hierarchy: measurable goals with target dates).
 * Axon Codex v1.2 compliant.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit';
import { validateRequest, validateData } from '@/lib/validation';
import {
  createMissionSchema,
  missionQuerySchema,
  type CreateMissionInput,
  type MissionQueryParams,
} from '@/lib/validations/mission';

// ============================================================================
// GET /api/v1/missions
// ============================================================================

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = validateData(missionQuerySchema, searchParams) as MissionQueryParams;

  const { supabase, organizationId, userId } = await getAuthContext();

  logger.info('Fetching missions', { correlationId, userId, organizationId, query });

  let queryBuilder = supabase
    .from('missions')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId);

  if (query.status) queryBuilder = queryBuilder.eq('status', query.status);
  if (query.search) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${query.search}%,description.ilike.%${query.search}%`
    );
  }

  const orderColumn =
    query.sortBy === 'createdAt'
      ? 'created_at'
      : query.sortBy === 'targetDate'
        ? 'target_date'
        : query.sortBy;
  queryBuilder = queryBuilder.order(orderColumn, { ascending: query.sortOrder === 'asc' });

  const start = (query.page - 1) * query.limit;
  queryBuilder = queryBuilder.range(start, start + query.limit - 1);

  const { data: missions, error, count } = await queryBuilder;

  if (error) {
    logger.error('Failed to fetch missions', {
      correlationId,
      error: { message: error.message, code: error.code },
    });
    throw error;
  }

  return NextResponse.json({
    data: missions || [],
    meta: {
      page: query.page,
      limit: query.limit,
      total: count || 0,
      totalPages: count ? Math.ceil(count / query.limit) : 0,
    },
  });
});

// ============================================================================
// POST /api/v1/missions
// ============================================================================

export const POST = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const validator = validateRequest(createMissionSchema, { target: 'body' });
  const data = (await validator(request)) as CreateMissionInput;

  const { supabase, organizationId, userId } = await getAuthContext();

  logger.info('Creating mission', {
    correlationId,
    userId,
    organizationId,
    missionTitle: data.name,
  });

  const { data: mission, error } = await supabase
    .from('missions')
    .insert({
      organization_id: organizationId,
      name: data.name,
      description: data.description || null,
      status: data.status || 'active',
      owner_type: 'user',
      owner_id: userId,
      target_date: data.targetDate || null,
      vision_id: data.visionId || null,
      progress: 0,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create mission', {
      correlationId,
      error: { message: error.message, code: error.code },
    });
    throw error;
  }

  logger.info('Mission created', { correlationId, missionId: mission.id });
  return NextResponse.json({ data: mission }, { status: 201 });
});
