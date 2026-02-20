/**
 * Individual Cohort API Route - GET, PATCH, DELETE
 * Axon Codex v1.2 compliant - RFC 7807 errors, structured logging, Zod validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit';
import { validateRequest, validateData } from '@/lib/validation';
import { updateCohortSchema, type UpdateCohortInput } from '@/lib/validations/cohort';
import { uuidSchema } from '@/lib/validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET /api/v1/cohorts/:id - Get a single cohort
// ============================================================================

export const GET = withMiddleware(
  standardRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const cohortId = validateData(uuidSchema, id);

    const { supabase, organizationId, userId } = await getAuthContext();

    logger.info('Fetching cohort', {
      correlationId,
      userId,
      cohortId,
    });

    const { data: cohort, error } = await supabase
      .from('cohorts')
      .select('*')
      .eq('id', cohortId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !cohort) {
      logger.warn('Cohort not found', {
        correlationId,
        cohortId,
        error: error?.message,
      });
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    logger.info('Cohort fetched successfully', {
      correlationId,
      cohortId: cohort.id,
    });

    return NextResponse.json({ data: cohort });
  }
);

// ============================================================================
// PATCH /api/v1/cohorts/:id - Update a cohort
// ============================================================================

export const PATCH = withMiddleware(
  standardRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const cohortId = validateData(uuidSchema, id);

    const validator = validateRequest(updateCohortSchema, { target: 'body' });
    const data = (await validator(request)) as UpdateCohortInput;

    const { supabase, organizationId, userId } = await getAuthContext();

    logger.info('Updating cohort', {
      correlationId,
      userId,
      cohortId,
      updates: Object.keys(data),
    });

    const { data: existingCohort, error: fetchError } = await supabase
      .from('cohorts')
      .select('id')
      .eq('id', cohortId)
      .single();

    if (fetchError || !existingCohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.endDate !== undefined) updateData.end_date = data.endDate;
    if (data.settings !== undefined) updateData.metadata = data.settings;

    const { data: cohort, error } = await supabase
      .from('cohorts')
      .update(updateData)
      .eq('id', cohortId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update cohort', {
        correlationId,
        error: {
          name: error.message,
          message: error.message,
          code: error.code,
        },
      });
      throw error;
    }

    logger.info('Cohort updated successfully', {
      correlationId,
      cohortId: cohort.id,
    });

    return NextResponse.json({ data: cohort });
  }
);

// ============================================================================
// DELETE /api/v1/cohorts/:id - Delete a cohort
// ============================================================================

export const DELETE = withMiddleware(
  standardRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const cohortId = validateData(uuidSchema, id);

    const { supabase, organizationId, userId } = await getAuthContext();

    logger.info('Deleting cohort', {
      correlationId,
      userId,
      cohortId,
    });

    const { data: existingCohort, error: fetchError } = await supabase
      .from('cohorts')
      .select('id, name')
      .eq('id', cohortId)
      .single();

    if (fetchError || !existingCohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    const { error } = await supabase.from('cohorts').delete().eq('id', cohortId);

    if (error) {
      logger.error('Failed to delete cohort', {
        correlationId,
        error: {
          name: error.message,
          message: error.message,
          code: error.code,
        },
      });
      throw error;
    }

    logger.info('Cohort deleted successfully', {
      correlationId,
      cohortId,
      cohortName: existingCohort.name,
    });

    return new NextResponse(null, { status: 204 });
  }
);
