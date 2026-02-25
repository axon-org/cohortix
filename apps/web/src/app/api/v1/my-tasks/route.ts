/**
 * My Tasks API Route - GET (list)
 * Tasks assigned to the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit';
import { validateData } from '@/lib/validation';
import { myTasksQuerySchema, type MyTasksQueryParams } from '@/lib/validations/my-tasks';

// ============================================================================
// GET /api/v1/my-tasks
// ============================================================================

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = validateData(myTasksQuerySchema, searchParams) as MyTasksQueryParams;

  const { supabase, organizationId, userId } = await getAuthContext();

  logger.info('Fetching my tasks', { correlationId, userId, organizationId, query });

  let queryBuilder = supabase
    .from('tasks')
    .select('*, projects(id, name)', { count: 'exact' })
    .eq('organization_id', organizationId)
    .eq('assignee_id', userId);

  if (query.status) queryBuilder = queryBuilder.eq('status', query.status);
  if (query.priority) queryBuilder = queryBuilder.eq('priority', query.priority);

  const sortColumn = query.sort === 'due_date' ? 'due_date' : query.sort;
  const ascending = query.sort === 'due_date';
  queryBuilder = queryBuilder.order(sortColumn, { ascending });

  const start = (query.page - 1) * query.limit;
  queryBuilder = queryBuilder.range(start, start + query.limit - 1);

  const { data: tasks, error, count } = await queryBuilder;

  if (error) {
    logger.error('Failed to fetch my tasks', {
      correlationId,
      error: { message: error.message, code: error.code },
    });
    throw error;
  }

  return NextResponse.json({
    data: tasks || [],
    meta: {
      page: query.page,
      limit: query.limit,
      total: count || 0,
      totalPages: count ? Math.ceil(count / query.limit) : 0,
    },
  });
});
