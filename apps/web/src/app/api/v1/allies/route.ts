/**
 * Allies API Route - GET (list) and POST (create)
 * Axon Codex v1.2 compliant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { ValidationError } from '@/lib/errors';
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit';
import { validateRequest, validateData } from '@/lib/validation';
import {
  createAllySchema,
  allyQuerySchema,
  type CreateAllyInput,
  type AllyQueryParams,
} from '@/lib/validations/ally';
import { generateSlug } from '@/lib/utils/cohort';

// ============================================================================
// GET /api/v1/allies - List allies with pagination and filtering
// ============================================================================

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = validateData(allyQuerySchema, searchParams) as AllyQueryParams;

  const { supabase, organizationId, userId } = await getAuthContext();

  logger.info('Fetching allies', { correlationId, userId, organizationId, query });

  let queryBuilder = supabase
    .from('agents')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId);

  if (query.status) queryBuilder = queryBuilder.eq('status', query.status);
  if (query.search) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${query.search}%,description.ilike.%${query.search}%,role.ilike.%${query.search}%`
    );
  }

  const orderColumn =
    query.sortBy === 'totalTasksCompleted'
      ? 'total_tasks_completed'
      : query.sortBy === 'createdAt'
        ? 'created_at'
        : query.sortBy;
  queryBuilder = queryBuilder.order(orderColumn, { ascending: query.sortOrder === 'asc' });

  const start = (query.page - 1) * query.limit;
  queryBuilder = queryBuilder.range(start, start + query.limit - 1);

  const { data: allies, error, count } = await queryBuilder;

  if (error) {
    logger.error('Failed to fetch allies', {
      correlationId,
      error: { message: error.message, code: error.code },
    });
    throw error;
  }

  return NextResponse.json({
    data: allies || [],
    meta: {
      page: query.page,
      limit: query.limit,
      total: count || 0,
      totalPages: count ? Math.ceil(count / query.limit) : 0,
    },
  });
});

// ============================================================================
// POST /api/v1/allies - Create a new ally
// ============================================================================

export const POST = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const validator = validateRequest(createAllySchema, { target: 'body' });
  const data = (await validator(request)) as CreateAllyInput;

  const { supabase, organizationId, userId } = await getAuthContext();
  const baseSlug = generateSlug(data.name);
  const timestamp = Date.now().toString().slice(-6);
  const slug = `${baseSlug}-${timestamp}`;

  const { data: existing } = await supabase
    .from('agents')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('slug', slug)
    .single();

  if (existing) {
    throw new ValidationError('An ally with this name already exists', {
      name: ['Name must be unique within your organization'],
    });
  }

  logger.info('Creating ally', { correlationId, userId, organizationId, allyName: data.name });

  const { data: ally, error } = await supabase
    .from('agents')
    .insert({
      organization_id: organizationId,
      name: data.name,
      slug,
      description: data.description || null,
      role: data.role || null,
      status: data.status,
      capabilities: data.capabilities || [],
      runtime_type: data.runtimeType || 'clawdbot',
      runtime_config: data.runtimeConfig || {},
      settings: data.settings || {},
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create ally', {
      correlationId,
      error: { message: error.message, code: error.code },
    });
    throw error;
  }

  logger.info('Ally created successfully', { correlationId, allyId: ally.id });

  return NextResponse.json({ data: ally }, { status: 201 });
});
