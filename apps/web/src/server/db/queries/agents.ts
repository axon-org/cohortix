/**
 * Agent Queries Module (AG-B1)
 *
 * Server-side data fetching for agents using Drizzle ORM.
 */

import { db } from '@repo/database/client';
import {
  agentEvolutionEvents,
  agents,
  operations,
  taskSessions,
  tasks,
} from '@repo/database/schema';
import { and, asc, desc, eq, ilike, inArray } from 'drizzle-orm';

export type AgentScopeType = 'personal' | 'cohort' | 'org';
export type AgentStatus = 'active' | 'idle' | 'busy' | 'offline' | 'error';

export interface AgentFilters {
  status?: AgentStatus;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at' | 'status' | 'total_tasks_completed';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get agents for a scope (personal/cohort/org)
 */
export async function getAgents(
  scopeType: AgentScopeType,
  scopeId: string,
  filters: AgentFilters = {}
) {
  const {
    status,
    search,
    limit = 20,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = filters;

  const predicates = [eq(agents.scopeType, scopeType), eq(agents.scopeId, scopeId)];
  if (status) predicates.push(eq(agents.status, status));
  if (search) predicates.push(ilike(agents.name, `%${search}%`));

  const orderBy =
    sortBy === 'name'
      ? sortOrder === 'asc'
        ? asc(agents.name)
        : desc(agents.name)
      : sortBy === 'status'
        ? sortOrder === 'asc'
          ? asc(agents.status)
          : desc(agents.status)
        : sortBy === 'total_tasks_completed'
          ? sortOrder === 'asc'
            ? asc(agents.totalTasksCompleted)
            : desc(agents.totalTasksCompleted)
          : sortOrder === 'asc'
            ? asc(agents.createdAt)
            : desc(agents.createdAt);

  return db
    .select()
    .from(agents)
    .where(and(...predicates))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

/**
 * Get an agent by ID
 */
export async function getAgentById(agentId: string) {
  const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
  return agent ?? null;
}

/**
 * Get agent stats (tasks completed, success rate, avg response time)
 */
export async function getAgentStats(agentId: string) {
  const sessions = await db
    .select({
      status: taskSessions.status,
      startedAt: taskSessions.startedAt,
      endedAt: taskSessions.endedAt,
    })
    .from(taskSessions)
    .where(eq(taskSessions.agentId, agentId));

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const completedCount = completedSessions.length;
  const successRate = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;

  const responseTimes = completedSessions
    .filter((s) => s.startedAt && s.endedAt)
    .map((s) => new Date(s.endedAt!).getTime() - new Date(s.startedAt!).getTime());

  const avgResponseTimeMs =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, v) => sum + v, 0) / responseTimes.length)
      : 0;

  return {
    totalSessions,
    completedCount,
    successRate,
    avgResponseTimeMs,
  };
}

/**
 * Get agent evolution events timeline
 */
export async function getAgentEvolution(agentId: string, limit = 20) {
  return db
    .select()
    .from(agentEvolutionEvents)
    .where(eq(agentEvolutionEvents.agentId, agentId))
    .orderBy(desc(agentEvolutionEvents.createdAt))
    .limit(limit);
}

/**
 * Get agent active missions/tasks
 */
export async function getAgentActiveMissions(agentId: string) {
  const activeStatuses: Array<
    'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
  > = ['backlog', 'todo', 'in_progress', 'review'];

  return db
    .select({
      taskId: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      operationId: tasks.projectId,
      operationName: operations.name,
    })
    .from(tasks)
    .leftJoin(operations, eq(tasks.projectId, operations.id))
    .where(
      and(
        eq(tasks.assigneeType, 'agent'),
        eq(tasks.assigneeId, agentId),
        inArray(tasks.status, activeStatuses)
      )
    )
    .orderBy(desc(tasks.createdAt));
}
