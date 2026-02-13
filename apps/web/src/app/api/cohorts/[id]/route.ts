/**
 * Single Cohort API Routes (COH-B4)
 * 
 * GET    /api/cohorts/:id - Get cohort details
 * PATCH  /api/cohorts/:id - Update cohort
 * DELETE /api/cohorts/:id - Archive cohort (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCohortById, getCohortStats } from '@/server/db/queries/cohorts';
import { updateCohort, deleteCohort, updateCohortSchema } from '@/server/db/mutations/cohorts';
import { getAuthContext } from '@/lib/auth-helper';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { organizationId } = await getAuthContext();

  const { id } = await context.params;

  try {
    const [cohort, stats] = await Promise.all([
      getCohortById(id),
      getCohortStats(id),
    ]);

    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    return NextResponse.json({ ...cohort, stats });
  } catch (error: any) {
    console.error(`GET /api/cohorts/${id} error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { organizationId } = await getAuthContext();

  const { id } = await context.params;

  try {
    const body = await request.json();
    const validated = updateCohortSchema.parse(body);
    const cohort = await updateCohort(id, validated);
    return NextResponse.json(cohort);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error(`PATCH /api/cohorts/${id} error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { organizationId } = await getAuthContext();

  const { id } = await context.params;

  try {
    const cohort = await deleteCohort(id);
    return NextResponse.json({ message: 'Cohort archived', cohort });
  } catch (error: any) {
    console.error(`DELETE /api/cohorts/${id} error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
