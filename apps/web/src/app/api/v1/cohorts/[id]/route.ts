/**
 * Individual Cohort API Route - GET, PATCH, DELETE
 * Axon Codex v1.2 compliant - RFC 7807 errors, structured logging, Zod validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { NotFoundError } from '@/lib/errors';
import { withMiddleware } from '@/lib/rate-limit';
import { validateRequest, validateData, uuidSchema } from '@/lib/validation';
import { updateCohortSchema, type UpdateCohortInput } from '@/lib/validations/cohorts';
import { ensureCohortAdmin, ensureCohortMember } from '@/lib/auth-access';
import { getCohortStats } from '@/server/db/queries/cohorts';
import { updateCohort, deleteCohort } from '@/server/db/mutations/cohorts';

const cohortRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET /api/v1/cohorts/:id - Get a single cohort
// ============================================================================

export const GET = withMiddleware(
  cohortRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const cohortId = validateData(uuidSchema, id);

    const { userId } = await getAuthContext();

    logger.info('Fetching cohort', { correlationId, userId, cohortId });

    const cohort = await ensureCohortMember(cohortId, userId);

    const stats = await getCohortStats(cohortId);

    return NextResponse.json({ data: cohort, stats });
  }
);

// ============================================================================
// PATCH /api/v1/cohorts/:id - Update a cohort
// ============================================================================

export const PATCH = withMiddleware(
  cohortRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const cohortId = validateData(uuidSchema, id);

    const validator = validateRequest(updateCohortSchema, { target: 'body' });
    const data = (await validator(request)) as UpdateCohortInput;

    const { userId } = await getAuthContext();

    await ensureCohortAdmin(cohortId, userId);

    logger.info('Updating cohort', {
      correlationId,
      userId,
      cohortId,
      updates: Object.keys(data),
    });

    const cohort = await updateCohort(cohortId, data);
    if (!cohort) throw new NotFoundError('Cohort', cohortId);

    return NextResponse.json({ data: cohort });
  }
);

// ============================================================================
// DELETE /api/v1/cohorts/:id - Archive a cohort
// ============================================================================

export const DELETE = withMiddleware(
  cohortRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const cohortId = validateData(uuidSchema, id);

    const { userId } = await getAuthContext();

    await ensureCohortAdmin(cohortId, userId);

    logger.info('Archiving cohort', { correlationId, userId, cohortId });

    const cohort = await deleteCohort(cohortId);
    if (!cohort) throw new NotFoundError('Cohort', cohortId);

    return NextResponse.json({ message: 'Cohort archived', cohort });
  }
);
