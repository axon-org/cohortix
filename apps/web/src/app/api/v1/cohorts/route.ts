/**
 * Cohorts API Route - GET (list) and POST (create)
 * Axon Codex v1.2 compliant - RFC 7807 errors, structured logging, Zod validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withErrorHandler, UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/errors';
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit';
import { validateRequest, validateData } from '@/lib/validation';
import {
  createCohortSchema,
  cohortQuerySchema,
  type CreateCohortInput,
  type CohortQueryParams,
} from '@/lib/validations/cohort';
import { generateSlug } from '@/lib/utils/cohort';

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

  // Build query
  let queryBuilder = supabase
    .from('cohorts')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId);

  // Apply filters
  if (query.status) {
    queryBuilder = queryBuilder.eq('status', query.status);
  }

  if (query.search) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${query.search}%,description.ilike.%${query.search}%`
    );
  }

  // Apply sorting
  const orderColumn =
    query.sortBy === 'memberCount'
      ? 'member_count'
      : query.sortBy === 'engagementPercent'
        ? 'engagement_percent'
        : query.sortBy === 'createdAt'
          ? 'created_at'
          : 'name';

  queryBuilder = queryBuilder.order(orderColumn, {
    ascending: query.sortOrder === 'asc',
  });

  // Apply pagination
  const start = (query.page - 1) * query.limit;
  const end = start + query.limit - 1;
  queryBuilder = queryBuilder.range(start, end);

  // Execute query
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

  const totalPages = count ? Math.ceil(count / query.limit) : 0;

  logger.info('Cohorts fetched successfully', {
    correlationId,
    count: cohorts?.length || 0,
    total: count,
  });

  return NextResponse.json({
    data: cohorts || [],
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

  // Validate request body
  const validator = validateRequest(createCohortSchema, { target: 'body' });
  const data = (await validator(request)) as CreateCohortInput;

  // Get authenticated context
  const { supabase, organizationId, userId } = await getAuthContext();

  // Generate unique slug
  const baseSlug = generateSlug(data.name);
  const timestamp = Date.now().toString().slice(-6);
  const slug = `${baseSlug}-${timestamp}`;

  // Check for duplicate slug (unlikely but possible)
  const { data: existingCohort } = await supabase
    .from('cohorts')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('slug', slug)
    .single();

  if (existingCohort) {
    throw new ValidationError('A cohort with this name already exists', {
      name: ['Name must be unique within your organization'],
    });
  }

  logger.info('Creating cohort', {
    correlationId,
    userId,
    organizationId,
    cohortName: data.name,
  });

  // Create cohort
  const { data: cohort, error } = await supabase
    .from('cohorts')
    .insert({
      organization_id: organizationId,
      name: data.name,
      slug,
      description: data.description || null,
      status: data.status,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      settings: data.settings || {},
      created_by: userId,
      member_count: 0,
      engagement_percent: '0',
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
