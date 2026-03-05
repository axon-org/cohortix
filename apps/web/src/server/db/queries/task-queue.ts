/**
 * Task Queue Queries Module
 * SDD-003 OpenClaw Integration
 *
 * Server-side read operations for task_queue table.
 */

import { db } from '@repo/database/client';
import { taskQueue, taskQueueStatusEnum } from '@repo/database/schema';
import { eq, and, asc, desc, inArray, gte, lte, sql } from 'drizzle-orm';

/**
 * Get task queue entry by ID
 */
export async function getTaskQueueById(queueId: string) {
  const [entry] = await db
    .select()
    .from(taskQueue)
    .where(eq(taskQueue.id, queueId));

  return entry ?? null;
}

/**
 * Get all queued tasks for a cohort (FIFO order)
 */
export async function getQueuedTasksByCohort(
  cohortId: string,
  statuses: ('queued' | 'processing' | 'completed' | 'failed' | 'expired')[] = ['queued']
) {
  return db
    .select()
    .from(taskQueue)
    .where(
      and(
        eq(taskQueue.cohortId, cohortId),
        inArray(taskQueue.status, statuses)
      )
    )
    .orderBy(asc(taskQueue.queuedAt));
}

/**
 * Get queued tasks ready for processing (not expired)
 */
export async function getPendingTasks(cohortId: string) {
  const now = new Date();

  return db
    .select()
    .from(taskQueue)
    .where(
      and(
        eq(taskQueue.cohortId, cohortId),
        eq(taskQueue.status, 'queued'),
        gte(taskQueue.expiresAt, now)
      )
    )
    .orderBy(asc(taskQueue.queuedAt));
}

/**
 * Get task queue statistics for a cohort
 */
export async function getTaskQueueStats(cohortId: string) {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      queued: sql<number>`count(*) filter (where ${taskQueue.status} = 'queued')`,
      processing: sql<number>`count(*) filter (where ${taskQueue.status} = 'processing')`,
      completed: sql<number>`count(*) filter (where ${taskQueue.status} = 'completed')`,
      failed: sql<number>`count(*) filter (where ${taskQueue.status} = 'failed')`,
      expired: sql<number>`count(*) filter (where ${taskQueue.status} = 'expired')`,
    })
    .from(taskQueue)
    .where(eq(taskQueue.cohortId, cohortId));

  return stats ?? {
    total: 0,
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    expired: 0,
  };
}

/**
 * Get recent task queue entries for a cohort
 */
export async function getRecentTaskQueue(
  cohortId: string,
  limit: number = 50,
  offset: number = 0
) {
  return db
    .select()
    .from(taskQueue)
    .where(eq(taskQueue.cohortId, cohortId))
    .orderBy(desc(taskQueue.queuedAt))
    .limit(limit)
    .offset(offset);
}
