/**
 * Cohort Activity Log API Route
 * 
 * GET /api/cohorts/:id/activity - Get recent activity for a cohort
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCohortActivity } from '@/server/db/queries/cohorts';
import { getCurrentUser, getUserOrganization } from '@/server/db/queries/dashboard';
import { getCohortById } from '@/server/db/queries/cohorts';

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

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await getAuthContext();
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await context.params;

  // Parse query params
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));

  try {
    // Verify cohort exists and user has access
    // In BYPASS mode, we trust the cohort exists since we got a valid org
    // In production, getCohortById uses RLS to verify access
    if (!(process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true')) {
      const cohort = await getCohortById(id);
      if (!cohort) {
        return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
      }
    }

    // Fetch recent activity
    const activities = await getCohortActivity(id, limit);

    return NextResponse.json({ activities, count: activities.length });
  } catch (error: any) {
    console.error(`GET /api/cohorts/${id}/activity error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
