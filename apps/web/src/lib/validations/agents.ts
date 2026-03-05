/**
 * Agent Validation Schemas (Data Layer)
 */

import { z } from 'zod';

export const agentStatusEnum = z.enum(['active', 'idle', 'busy', 'offline', 'error']);
export const agentScopeTypeEnum = z.enum(['personal', 'cohort', 'org']);
export const evolutionEventTypeEnum = z.enum(['learning', 'correction', 'milestone']);

export const createAgentSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  externalId: z.string().max(255).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  role: z.string().max(255).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  status: agentStatusEnum.default('idle'),
  capabilities: z.array(z.string()).default([]),
  scopeType: agentScopeTypeEnum.default('personal'),
  scopeId: z.string().uuid(),
  organizationId: z.string().uuid().optional().nullable(),
  ownerUserId: z.string().uuid().optional().nullable(),
  defaultCohortId: z.string().uuid().optional().nullable(),
  runtimeType: z.string().max(50).default('clawdbot'),
  runtimeConfig: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export type CreateAgentInput = z.input<typeof createAgentSchema>;

export const updateAgentSchema = z.object({
  name: z.string().min(2).max(255).trim().optional(),
  description: z.string().max(10000).optional().nullable(),
  role: z.string().max(255).optional().nullable(),
  status: agentStatusEnum.optional(),
  capabilities: z.array(z.string()).optional(),
  defaultCohortId: z.string().uuid().optional().nullable(),
  runtimeType: z.string().max(50).optional(),
  runtimeConfig: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export type UpdateAgentInput = z.input<typeof updateAgentSchema>;

export const recordEvolutionEventSchema = z.object({
  agentId: z.string().uuid(),
  type: evolutionEventTypeEnum,
  summary: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  cohortId: z.string().uuid().optional().nullable(),
  scopeType: agentScopeTypeEnum.default('personal'),
  scopeId: z.string().uuid(),
});

export type RecordEvolutionEventInput = z.input<typeof recordEvolutionEventSchema>;
