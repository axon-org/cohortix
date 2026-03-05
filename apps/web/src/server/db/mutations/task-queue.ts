/**
 * Task Queue Mutations Module
 * SDD-003 OpenClaw Integration
 *
 * Server-side write operations for task_queue table.
 */

import { db } from '@repo/database/client';
import { taskQueue, taskQueueStatusEnum } from '@repo/database/schema';
import { eq, and, inArray, asc, sql } from 'drizzle-orm';

export interface CreateTaskQueueInput {
  cohortId: string;
  taskId: string;
  agentId: string;
  commentId?: string | null;
  prompt: string;
  sessionKey: string;
  maxAttempts?: number;
  expiresAt?: Date | null;
}

export interface UpdateTaskQueueInput {
  status?: 'queued' | 'processing' | 'completed' | 'failed' | 'expired';
  attempts?: number;
  error?: Record<string, unknown> | null;
  processedAt?: Date | null;
  expiresAt?: Date | null;
}

/**
 * Insert a new task queue entry
 */
export async function insertTaskQueue(input: CreateTaskQueueInput) {
  const [entry] = await db
    .insert(taskQueue)
    .values({
      cohortId: input.cohortId,
      taskId: input.taskId,
      agentId: input.agentId,
      commentId: input.commentId ?? null,
      prompt: input.prompt,
      sessionKey: input.sessionKey,
      status: 'queued',
      attempts: 0,
      maxAttempts: input.maxAttempts ?? 3,
      expiresAt: input.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h default
    })
    .returning();

  return entry ?? null;
}

/**
 * Update a task queue entry
 */
export async function updateTaskQueue(queueId: string, input: UpdateTaskQueueInput) {
  const [entry] = await db
    .update(taskQueue)
    .set({
      ...input,
      processedAt:
        input.processedAt ??
        (input.status === 'completed' || input.status === 'failed' ? new Date() : null),
    })
    .where(eq(taskQueue.id, queueId))
    .returning();

  return entry ?? null;
}

/**
 * Expire all queued tasks for a cohort (when disconnecting)
 */
export async function expireQueuedTasksByCohort(cohortId: string) {
  const result = await db
    .update(taskQueue)
    .set({
      status: 'expired',
      processedAt: new Date(),
    })
    .where(
      and(eq(taskQueue.cohortId, cohortId), inArray(taskQueue.status, ['queued', 'processing']))
    )
    .returning();

  return result;
}

/**
 * Mark a task as failed after max attempts
 */
export async function markTaskFailed(queueId: string, error: Record<string, unknown>) {
  const [entry] = await db
    .update(taskQueue)
    .set({
      status: 'failed',
      error,
      processedAt: new Date(),
    })
    .where(eq(taskQueue.id, queueId))
    .returning();

  return entry ?? null;
}

/**
 * Increment attempts for a task
 */
export async function incrementTaskAttempts(queueId: string) {
  const [entry] = await db
    .update(taskQueue)
    .set({
      attempts: sql`${taskQueue.attempts} + 1`,
    })
    .where(eq(taskQueue.id, queueId))
    .returning();

  return entry ?? null;
}
