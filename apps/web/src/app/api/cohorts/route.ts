/**
 * Cohort API Routes (COH-B4)
 *
 * GET  /api/cohorts - List cohorts with filters
 * POST /api/cohorts - Create a new cohort
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCohorts } from '@/server/db/queries/cohorts';
import { createCohort, createCohortSchema } from '@/server/db/mutations/cohorts';
import { getAuthContext } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext();
    const { searchParams } = new URL(request.url);

    const filters = {
      status: (searchParams.get('status') as any) || undefined,
      search: searchParams.get('search') || undefined,
      startDateFrom: searchParams.get('startDateFrom') || undefined,
      startDateTo: searchParams.get('startDateTo') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'created_at',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: Math.min(50, parseInt(searchParams.get('pageSize') || '20')),
    };

    const result = await getCohorts(organizationId, filters);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }
    console.error('GET /api/cohorts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId, userId } = await getAuthContext();
    const body = await request.json();
    const validated = createCohortSchema.parse({
      ...body,
      createdBy: userId,
      organizationId,
    });
    const cohort = await createCohort(organizationId, userId, validated);
    return NextResponse.json(cohort, { status: 201 });
  } catch (error: any) {
    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('POST /api/cohorts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
