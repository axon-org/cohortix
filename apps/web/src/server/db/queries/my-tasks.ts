/**
 * My Tasks Aggregation Query
 */

import { db } from '@repo/database/client';
import { cohortUserMembers, cohorts, tasks } from '@repo/database/schema';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

export type MyTasksSort = 'due_date' | 'priority' | 'created_at';

export interface MyTasksFilters {
  status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  cohortId?: string;
  dueFrom?: string;
  dueTo?: string;
  sort?: MyTasksSort;
  sortOrder?: 'asc' | 'desc';
}

export interface MyTasksPagination {
  page?: number;
  pageSize?: number;
}

function priorityOrder(sortOrder: 'asc' | 'desc') {
  const caseExpr = sql<number>`CASE ${tasks.priority}
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
    ELSE 5
  END`;

  return sortOrder === 'asc' ? asc(caseExpr) : desc(caseExpr);
}

export async function getMyTasks(
  userId: string,
  filters: MyTasksFilters = {},
  pagination: MyTasksPagination = {}
) {
  const page = pagination.page ?? 1;
  const pageSize = pagination.pageSize ?? 50;

  const memberRows = await db
    .select({ cohortId: cohortUserMembers.cohortId })
    .from(cohortUserMembers)
    .where(eq(cohortUserMembers.userId, userId));

  const cohortIds = memberRows.map((row) => row.cohortId);

  const personalPredicate = and(eq(tasks.scopeType, 'personal'), eq(tasks.scopeId, userId));
  const basePredicate = cohortIds.length > 0
    ? or(personalPredicate, inArray(tasks.cohortId, cohortIds))
    : personalPredicate;

  const predicates: SQL[] = [basePredicate].filter(Boolean) as SQL[];

  if (filters.status) predicates.push(eq(tasks.status, filters.status));
  if (filters.priority) predicates.push(eq(tasks.priority, filters.priority));
  if (filters.cohortId) predicates.push(eq(tasks.cohortId, filters.cohortId));
  if (filters.dueFrom) predicates.push(gte(tasks.dueDate, new Date(filters.dueFrom)));
  if (filters.dueTo) predicates.push(lte(tasks.dueDate, new Date(filters.dueTo)));

  const whereClause = predicates.length > 0 ? and(...predicates) : undefined;

  const totalQuery = db.select({ total: count() }).from(tasks);
  if (whereClause) totalQuery.where(whereClause);
  const totalRow = (await totalQuery)[0];
  const total = Number(totalRow?.total ?? 0);

  const sortBy = filters.sort ?? 'due_date';
  const sortOrder = filters.sortOrder ?? 'asc';

  const orderBy =
    sortBy === 'priority'
      ? priorityOrder(sortOrder)
      : sortBy === 'created_at'
        ? sortOrder === 'asc'
          ? asc(tasks.createdAt)
          : desc(tasks.createdAt)
        : sortOrder === 'asc'
          ? asc(tasks.dueDate)
          : desc(tasks.dueDate);

  const rows = await db
    .select({
      task: tasks,
      cohortName: cohorts.name,
      cohortType: cohorts.type,
      cohortId: cohorts.id,
    })
    .from(tasks)
    .leftJoin(cohorts, eq(tasks.cohortId, cohorts.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    tasks: rows,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
