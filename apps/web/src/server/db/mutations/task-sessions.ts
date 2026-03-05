/**
 * Task Sessions Mutations Module
 * SDD-003 OpenClaw Integration §6
 *
 * Server-side write operations for task_sessions table.
 */

import { db } from '@repo/database/client';
import { taskSessions } from '@repo/database/schema';
import { eq } from 'drizzle-orm';

export type TaskSessionStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface CreateTaskSessionInput {
  taskId: string;
  agentId: string;
  cohortId?: string | null;
  scopeType: 'personal' | 'cohort' | 'org';
  scopeId: string;
  gatewaySessionId?: string | null;
  status?: TaskSessionStatus;
}

export interface UpdateTaskSessionInput {
  status?: TaskSessionStatus;
  endedAt?: Date | null;
  error?: Record<string, unknown> | null;
}

/**
 * Create a new task session
 */
export async function createTaskSession(input: CreateTaskSessionInput) {
  const [session] = await db
    .insert(taskSessions)
    .values({
      taskId: input.taskId,
      agentId: input.agentId,
      cohortId: input.cohortId ?? null,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      gatewaySessionId: input.gatewaySessionId ?? null,
      status: input.status ?? 'running',
      startedAt: new Date(),
    })
    .returning();

  return session ?? null;
}

/**
 * Update an existing task session
 */
export async function updateTaskSession(sessionId: string, input: UpdateTaskSessionInput) {
  const [session] = await db
    .update(taskSessions)
    .set({
      ...input,
      endedAt: input.endedAt ?? (input.status && input.status !== 'running' ? new Date() : null),
    })
    .where(eq(taskSessions.id, sessionId))
    .returning();

  return session ?? null;
}

/**
 * Close a task session (convenience method)
 */
export async function closeTaskSession(
  sessionId: string,
  status: TaskSessionStatus,
  error?: Record<string, unknown> | null
) {
  return updateTaskSession(sessionId, {
    status,
    endedAt: new Date(),
    error: error ?? null,
  });
}
