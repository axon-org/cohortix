/**
 * My Tasks Validation Schemas
 * Tasks assigned to current user across operations.
 */

import { z } from 'zod';

export const taskStatusEnum = z.enum([
  'backlog',
  'todo',
  'in_progress',
  'review',
  'done',
  'cancelled',
]);
export type TaskStatus = z.infer<typeof taskStatusEnum>;

export const taskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
export type TaskPriority = z.infer<typeof taskPriorityEnum>;

export const myTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  cohortId: z.string().uuid().optional(),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
  sort: z.enum(['due_date', 'priority', 'created_at']).default('due_date'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type MyTasksQueryParams = z.infer<typeof myTasksQuerySchema>;
