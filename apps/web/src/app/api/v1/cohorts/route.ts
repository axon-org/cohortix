/**
 * Cohorts API Route - GET (list) and POST (create)
 * Axon Codex v1.2 compliant - RFC 7807 errors, structured logging, Zod validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit';
import { validateRequest, validateData } from '@/lib/validation';
import {
  createCohortSchema,
  cohortQuerySchema,
  type CreateCohortInput,
  type CohortQueryParams,
} from '@/lib/validations/cohort';

// ============================================================================
// GET /api/v1/cohorts - List cohorts with pagination and filtering
// ============================================================================

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  // Validate query parameters
  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = validateData(cohortQuerySchema, searchParams) as CohortQueryParams;

  // Get authenticated context
  const { supabase, organizationId, userId } = await getAuthContext();

  logger.info('Fetching cohorts', {
    correlationId,
    userId,
    organizationId,
    query,
  });

  let queryBuilder = supabase
    .from('cohorts')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId);

  if (query.status) {
    queryBuilder = queryBuilder.eq('status', query.status);
  }

  if (query.search) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${query.search}%,description.ilike.%${query.search}%`
    );
  }

  const orderColumn = query.sortBy === 'createdAt' ? 'created_at' : 'name';

  queryBuilder = queryBuilder.order(orderColumn, {
    ascending: query.sortOrder === 'asc',
  });

  const start = (query.page - 1) * query.limit;
  const end = start + query.limit - 1;
  queryBuilder = queryBuilder.range(start, end);

  const { data: cohorts, error, count } = await queryBuilder;

  if (error) {
    logger.error('Failed to fetch cohorts', {
      correlationId,
      error: {
        name: error.message,
        message: error.message,
        code: error.code,
      },
    });
    throw error;
  }

  // Enrich with computed stats from cohort_members
  const cohortList = cohorts || [];
  const cohortIds = cohortList.map((c: any) => c.id);
  const { data: memberRows } = await supabase
    .from('cohort_members')
    .select('cohort_id, engagement_score')
    .in('cohort_id', cohortIds);

  const statsMap = new Map<string, { count: number; total: number }>();
  (memberRows || []).forEach((row: any) => {
    const entry = statsMap.get(row.cohort_id) || { count: 0, total: 0 };
    entry.count += 1;
    entry.total += parseFloat(row.engagement_score) || 0;
    statsMap.set(row.cohort_id, entry);
  });

  const enriched = cohortList.map((cohort: any) => {
    const stats = statsMap.get(cohort.id) || { count: 0, total: 0 };
    return {
      ...cohort,
      member_count: stats.count,
      engagement_percent: stats.count > 0 ? Math.round((stats.total / stats.count) * 100) / 100 : 0,
    };
  });

  const totalPages = count ? Math.ceil(count / query.limit) : 0;

  logger.info('Cohorts fetched successfully', {
    correlationId,
    count: cohorts?.length || 0,
    total: count,
  });

  return NextResponse.json({
    data: enriched,
    meta: {
      page: query.page,
      limit: query.limit,
      total: count || 0,
      totalPages,
    },
  });
});

// ============================================================================
// POST /api/v1/cohorts - Create a new cohort
// ============================================================================

export const POST = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const validator = validateRequest(createCohortSchema, { target: 'body' });
  const data = (await validator(request)) as CreateCohortInput;

  const { supabase, organizationId, userId } = await getAuthContext();

  logger.info('Creating cohort', {
    correlationId,
    userId,
    organizationId,
    cohortName: data.name,
  });

  const { data: cohort, error } = await supabase
    .from('cohorts')
    .insert({
      organization_id: organizationId,
      name: data.name,
      description: data.description || null,
      status: data.status,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      metadata: data.settings || {},
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create cohort', {
      correlationId,
      error: {
        name: error.message,
        message: error.message,
        code: error.code,
      },
    });
    throw error;
  }

  logger.info('Cohort created successfully', {
    correlationId,
    cohortId: cohort.id,
    cohortName: cohort.name,
  });

  return NextResponse.json({ data: cohort }, { status: 201 });
});
