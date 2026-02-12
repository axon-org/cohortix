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

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await getAuthContext();
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await context.params;

  try {
    let cohort, stats;
    
    // In BYPASS mode, use service role client to fetch data directly
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
      
      const { data } = await supabase
        .from('cohorts')
        .select('*')
        .eq('id', id)
        .single();
      
      cohort = data;
      stats = await getCohortStats(id);
    } else {
      [cohort, stats] = await Promise.all([
        getCohortById(id),
        getCohortStats(id),
      ]);
    }

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
  const auth = await getAuthContext();
  if ('error' in auth && auth.error) return auth.error;

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
  const auth = await getAuthContext();
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await context.params;

  try {
    const cohort = await deleteCohort(id);
    return NextResponse.json({ message: 'Cohort archived', cohort });
  } catch (error: any) {
    console.error(`DELETE /api/cohorts/${id} error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
