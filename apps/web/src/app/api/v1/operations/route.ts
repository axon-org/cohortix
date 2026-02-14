/**
 * Operations API Route - GET (list) and POST (create)
 * Operations are bounded initiatives with start/end dates that achieve Missions.
 * Maps to `projects` table. Axon Codex v1.2 compliant.
 *
 * PPV Hierarchy: Mission (measurable outcome) → Operation (bounded initiative) → Task (atomic work)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withErrorHandler, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/errors';
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit';
import { validateRequest, validateData } from '@/lib/validation';
import {
  createOperationSchema,
  operationQuerySchema,
  type CreateOperationInput,
  type OperationQueryParams,
} from '@/lib/validations/operation';
import { generateSlug } from '@/lib/utils/cohort';

// ============================================================================
// GET /api/v1/operations
// ============================================================================

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = validateData(operationQuerySchema, searchParams) as OperationQueryParams;

  const { supabase, organizationId, userId } = await getAuthContext();

  logger.info('Fetching operations', { correlationId, userId, organizationId, query });

  let queryBuilder = supabase
    .from('projects')
    .select(
      `
      *,
      missions!mission_id(id, title, status),
      task_count:tasks!project_id(count)
    `,
      { count: 'exact' }
    )
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
      : query.sortBy === 'startDate'
        ? 'start_date'
        : query.sortBy === 'targetDate'
          ? 'target_date'
          : query.sortBy;
  queryBuilder = queryBuilder.order(orderColumn, { ascending: query.sortOrder === 'asc' });

  const start = (query.page - 1) * query.limit;
  queryBuilder = queryBuilder.range(start, start + query.limit - 1);

  const { data: operations, error, count } = await queryBuilder;

  if (error) {
    logger.error('Failed to fetch operations', {
      correlationId,
      error: { message: error.message, code: error.code },
    });
    throw error;
  }

  return NextResponse.json({
    data: operations || [],
    meta: {
      page: query.page,
      limit: query.limit,
      total: count || 0,
      totalPages: count ? Math.ceil(count / query.limit) : 0,
    },
  });
});

// ============================================================================
// POST /api/v1/operations
// ============================================================================

export const POST = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const validator = validateRequest(createOperationSchema, { target: 'body' });
  const data = (await validator(request)) as CreateOperationInput;

  const { supabase, organizationId, userId } = await getAuthContext();
  const baseSlug = generateSlug(data.name);
  const timestamp = Date.now().toString().slice(-6);
  const slug = `${baseSlug}-${timestamp}`;

  logger.info('Creating operation', {
    correlationId,
    userId,
    organizationId,
    operationName: data.name,
  });

  const { data: operation, error } = await supabase
    .from('projects')
    .insert({
      organization_id: organizationId,
      name: data.name,
      slug,
      description: data.description || null,
      status: data.status,
      owner_type: 'user',
      owner_id: userId,
      start_date: data.startDate || null,
      target_date: data.targetDate || null,
      goal_id: data.missionId || null, // DB column still named 'goal_id'
      color: data.color || null,
      icon: data.icon || null,
      settings: data.settings || {},
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create operation', {
      correlationId,
      error: { message: error.message, code: error.code },
    });
    throw error;
  }

  logger.info('Operation created', { correlationId, operationId: operation.id });
  return NextResponse.json({ data: operation }, { status: 201 });
});
