/**
 * Task Sessions Service
 */

import { db } from '@repo/database/client';
import { taskSessions } from '@repo/database/schema';
import { eq } from 'drizzle-orm';
import {
  createTaskSession as createTaskSessionMutation,
  updateTaskSession as updateTaskSessionMutation,
  closeTaskSession as closeTaskSessionMutation,
  type CreateTaskSessionInput,
  type UpdateTaskSessionInput,
  type TaskSessionStatus,
} from '../db/mutations/task-sessions';

export type { TaskSessionStatus, CreateTaskSessionInput, UpdateTaskSessionInput };

export const createTaskSession = createTaskSessionMutation;
export const updateTaskSession = updateTaskSessionMutation;
export const closeTaskSession = closeTaskSessionMutation;

export async function getTaskSessionsByTask(taskId: string) {
  return db.select().from(taskSessions).where(eq(taskSessions.taskId, taskId));
}
