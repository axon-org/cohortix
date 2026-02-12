/**
 * Cohort API Routes (COH-B4)
 * 
 * GET  /api/cohorts - List cohorts with filters
 * POST /api/cohorts - Create a new cohort
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCohorts } from '@/server/db/queries/cohorts';
import { createCohort, createCohortSchema } from '@/server/db/mutations/cohorts';
import { getCurrentUser, getUserOrganization } from '@/server/db/queries/dashboard';

async function getAuthContext() {
  // DEV MODE: Bypass auth for testing
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single()
    
    return { user: { id: 'dev-bypass' }, organizationId: org?.id || '' };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const membership = await getUserOrganization(user.id);
  if (!membership) {
    return { error: NextResponse.json({ error: 'No organization found' }, { status: 403 }) };
  }
  return { user, organizationId: membership.organization_id };
}

export async function GET(request: NextRequest) {
  const auth = await getAuthContext();
  if ('error' in auth && auth.error) return auth.error;
  const { organizationId } = auth as { organizationId: string };

  const { searchParams } = new URL(request.url);

  const filters = {
    status: searchParams.get('status') as any || undefined,
    search: searchParams.get('search') || undefined,
    startDateFrom: searchParams.get('startDateFrom') || undefined,
    startDateTo: searchParams.get('startDateTo') || undefined,
    sortBy: (searchParams.get('sortBy') as any) || 'created_at',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: Math.min(50, parseInt(searchParams.get('pageSize') || '20')),
  };

  try {
    const result = await getCohorts(organizationId, filters);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('GET /api/cohorts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if ('error' in auth && auth.error) return auth.error;
  const { user, organizationId } = auth as { user: any; organizationId: string };

  try {
    const body = await request.json();
    const validated = createCohortSchema.parse(body);
    const cohort = await createCohort(organizationId, user.id, validated);
    return NextResponse.json(cohort, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('POST /api/cohorts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
