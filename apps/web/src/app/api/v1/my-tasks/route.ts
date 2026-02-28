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
import { getMyTasks } from '@/server/db/queries/my-tasks';

// ============================================================================
// GET /api/v1/my-tasks
// ============================================================================

export const GET = withMiddleware(standardRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = validateData(myTasksQuerySchema, searchParams) as MyTasksQueryParams;

  const { userId } = await getAuthContext();

  logger.info('Fetching my tasks', { correlationId, userId, query });

  const { tasks, meta } = await getMyTasks(
    userId,
    {
      status: query.status,
      priority: query.priority,
      cohortId: query.cohortId,
      dueFrom: query.dueFrom,
      dueTo: query.dueTo,
      sort: query.sort,
      sortOrder: query.sortOrder,
    },
    {
      page: query.page,
      pageSize: query.limit,
    }
  );

  const data = tasks.map((row) => {
    const task = row.task;

    return {
      id: task.id,
      title: task.title,
      description: task.description ?? undefined,
      status: task.status,
      priority: task.priority ?? undefined,
      due_date: task.dueDate ? task.dueDate.toISOString() : null,
      assignee_id: task.assigneeId ?? null,
      project_id: task.projectId ?? null,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt ? task.updatedAt.toISOString() : null,
      cohort_id: row.cohortId ?? null,
      cohort_name: row.cohortName ?? null,
      cohort_type: row.cohortType ?? null,
    };
  });

  return NextResponse.json({
    data,
    meta: {
      page: meta.page,
      limit: meta.pageSize,
      total: meta.total,
      totalPages: meta.totalPages,
    },
  });
});
