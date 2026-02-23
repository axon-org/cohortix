/**
 * Agent (Agent) Validation Schemas
 * Follows same pattern as cohort validations.
 */

import { z } from 'zod';

export const agentStatusEnum = z.enum(['active', 'idle', 'busy', 'offline', 'error']);
export type AgentStatus = z.infer<typeof agentStatusEnum>;

export const createAgentSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
  description: z.string().max(10000).optional(),
  role: z.string().max(255).optional(),
  status: agentStatusEnum.default('idle'),
  capabilities: z.array(z.string()).default([]),
  cohortIds: z.array(z.string().uuid()).optional(),
  runtimeType: z.string().max(50).default('clawdbot'),
  runtimeConfig: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;

export const updateAgentSchema = z.object({
  name: z.string().min(2).max(255).trim().optional(),
  description: z.string().max(10000).optional().nullable(),
  role: z.string().max(255).optional().nullable(),
  status: agentStatusEnum.optional(),
  capabilities: z.array(z.string()).optional(),
  cohortIds: z.array(z.string().uuid()).optional(),
  runtimeType: z.string().max(50).optional(),
  runtimeConfig: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;

export const agentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: agentStatusEnum.optional(),
  search: z.string().trim().optional(),
  cohortId: z.string().uuid().optional(),
  sortBy: z.enum(['name', 'createdAt', 'status', 'totalTasksCompleted']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AgentQueryParams = z.infer<typeof agentQuerySchema>;
