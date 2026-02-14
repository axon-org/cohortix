/**
 * Timeline Item Validation Schemas
 * Operations Redesign feature
 */

import { z } from 'zod'

export const timelineEventTypeEnum = z.enum([
  'created',
  'updated',
  'status_changed',
  'assigned',
  'task_completed',
  'note_added',
  'file_uploaded',
  'comment_added',
  'ai_action',
])
export type TimelineEventType = z.infer<typeof timelineEventTypeEnum>

export const createTimelineItemSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  eventType: timelineEventTypeEnum,
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),
  description: z.string().max(10000).optional().nullable(),
  metadata: z.record(z.any()).default({}),
})

export type CreateTimelineItemInput = z.infer<typeof createTimelineItemSchema>

export const updateTimelineItemSchema = z.object({
  title: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(10000).optional().nullable(),
  metadata: z.record(z.any()).optional(),
})

export type UpdateTimelineItemInput = z.infer<typeof updateTimelineItemSchema>

export const timelineItemQuerySchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  eventType: timelineEventTypeEnum.optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
})

export type TimelineItemQueryParams = z.infer<typeof timelineItemQuerySchema>
