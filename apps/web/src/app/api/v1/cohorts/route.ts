/**
 * Cohorts API Route - GET (list) and POST (create)
 * Axon Codex v1.2 compliant - RFC 7807 errors, structured logging, Zod validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { createRateLimiter, withMiddleware } from '@/lib/rate-limit';
import { validateRequest, validateData } from '@/lib/validation';
import {
  cohortHostingEnum,
  cohortRuntimeStatusEnum,
  cohortStatusEnum,
  cohortTypeEnum,
} from '@/lib/validations/cohorts';
import { getCohorts } from '@/server/db/queries/cohorts';
import { createCohort } from '@/server/db/mutations/cohorts';

const cohortRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

const shouldSkipRateLimit = () =>
  process.env.NODE_ENV === 'test' ||
  process.env.E2E_SKIP_AUTH === 'true' ||
  process.env.BYPASS_AUTH === 'true';

async function enforceUserRateLimit(request: NextRequest, userId: string) {
  if (shouldSkipRateLimit()) return;
  const limiter = createRateLimiter({
    ...cohortRateLimit,
    keyGenerator: () => `user:${userId}`,
  });
  await limiter(request);
}

const cohortQuerySchema = z.object({
  type: cohortTypeEnum.optional(),
  status: cohortStatusEnum.optional(),
  hosting: cohortHostingEnum.optional(),
  runtimeStatus: cohortRuntimeStatusEnum.optional(),
  search: z.string().trim().optional(),
  startDateFrom: z.string().date().optional(),
  startDateTo: z.string().date().optional(),
  sortBy: z
    .enum(['name', 'created_at', 'member_count', 'engagement_percent', 'start_date'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const createCohortRequestSchema = z
  .object({
    name: z.string().min(3).max(255).trim(),
    description: z.string().max(10000).optional().nullable(),
    hosting: cohortHostingEnum.optional(),
    runtimeStatus: cohortRuntimeStatusEnum.optional(),
    startDate: z.string().date().optional().nullable(),
    endDate: z.string().date().optional().nullable(),
    settings: z.record(z.any()).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

// ============================================================================
// GET /api/v1/cohorts - List cohorts with pagination and filtering
// ============================================================================

export const GET = withMiddleware(cohortRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = validateData(cohortQuerySchema, searchParams);

  const { organizationId, userId } = await getAuthContext();
  await enforceUserRateLimit(request, userId);

  logger.info('Fetching cohorts', { correlationId, userId, organizationId, query });

  const result = await getCohorts(
    organizationId,
    userId,
    {
      type: query.type,
      status: query.status,
      hosting: query.hosting,
      runtimeStatus: query.runtimeStatus,
      search: query.search,
      startDateFrom: query.startDateFrom,
      startDateTo: query.startDateTo,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
    { page: query.page, pageSize: query.pageSize }
  );

  return NextResponse.json({
    data: result.cohorts,
    meta: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

// ============================================================================
// POST /api/v1/cohorts - Create a new cohort (shared)
// ============================================================================

export const POST = withMiddleware(cohortRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const validator = validateRequest(createCohortRequestSchema, { target: 'body' });
  const data = await validator(request);

  const { organizationId, userId } = await getAuthContext();
  await enforceUserRateLimit(request, userId);

  logger.info('Creating cohort', {
    correlationId,
    userId,
    organizationId,
    cohortName: data.name,
  });

  const cohort = await createCohort({
    ...data,
    type: 'shared',
    organizationId,
    createdBy: userId,
  });

  return NextResponse.json({ data: cohort }, { status: 201 });
});
