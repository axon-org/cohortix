/**
 * Task Sessions Service
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
}

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
      status: 'running',
      startedAt: new Date(),
    })
    .returning();

  return session ?? null;
}

export async function closeTaskSession(
  sessionId: string,
  status: TaskSessionStatus,
  error?: Record<string, unknown> | null
) {
  const endedAt = status === 'running' ? null : new Date();

  const [session] = await db
    .update(taskSessions)
    .set({
      status,
      endedAt,
      error: error ?? null,
    })
    .where(eq(taskSessions.id, sessionId))
    .returning();

  return session ?? null;
}

export async function getTaskSessionsByTask(taskId: string) {
  return db.select().from(taskSessions).where(eq(taskSessions.taskId, taskId));
}
