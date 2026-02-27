/**
 * Cohort Validation Schemas (Data Layer)
 */

import { z } from 'zod';

export const cohortStatusEnum = z.enum(['active', 'paused', 'at-risk', 'completed']);
export const cohortTypeEnum = z.enum(['personal', 'shared']);
export const cohortHostingEnum = z.enum(['managed', 'self_hosted']);
export const cohortRuntimeStatusEnum = z.enum([
  'provisioning',
  'online',
  'offline',
  'error',
  'paused',
]);
export const cohortMemberRoleEnum = z.enum(['owner', 'admin', 'member', 'viewer']);

export const createCohortSchema = z
  .object({
    name: z.string().min(3).max(255).trim(),
    description: z.string().max(10000).optional().nullable(),
    type: cohortTypeEnum.default('shared'),
    organizationId: z.string().uuid().optional().nullable(),
    ownerUserId: z.string().uuid().optional().nullable(),
    hosting: cohortHostingEnum.optional().default('managed'),
    runtimeStatus: cohortRuntimeStatusEnum.optional(),
    startDate: z.string().date().optional().nullable(),
    endDate: z.string().date().optional().nullable(),
    settings: z.record(z.any()).optional(),
    createdBy: z.string().uuid(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'personal') {
        return Boolean(data.ownerUserId) && !data.organizationId;
      }
      return Boolean(data.organizationId);
    },
    {
      message: 'Shared cohorts require organizationId; personal cohorts require ownerUserId',
      path: ['type'],
    }
  );

export type CreateCohortInput = z.input<typeof createCohortSchema>;

export const updateCohortSchema = z
  .object({
    name: z.string().min(3).max(255).trim().optional(),
    description: z.string().max(10000).optional().nullable(),
    status: cohortStatusEnum.optional(),
    hosting: cohortHostingEnum.optional(),
    runtimeStatus: cohortRuntimeStatusEnum.optional(),
    startDate: z.string().date().optional().nullable(),
    endDate: z.string().date().optional().nullable(),
    settings: z.record(z.any()).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export type UpdateCohortInput = z.input<typeof updateCohortSchema>;

export const addUserMemberSchema = z.object({
  cohortId: z.string().uuid(),
  userId: z.string().uuid(),
  role: cohortMemberRoleEnum.default('member'),
});

export type AddUserMemberInput = z.infer<typeof addUserMemberSchema>;

export const addAgentMemberSchema = z.object({
  cohortId: z.string().uuid(),
  agentId: z.string().uuid(),
  role: cohortMemberRoleEnum.default('member'),
});

export type AddAgentMemberInput = z.infer<typeof addAgentMemberSchema>;

export const updateMemberRoleSchema = z.object({
  cohortId: z.string().uuid(),
  memberId: z.string().uuid(),
  role: cohortMemberRoleEnum,
  type: z.enum(['user', 'agent']),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const removeMemberSchema = z.object({
  cohortId: z.string().uuid(),
  memberId: z.string().uuid(),
  type: z.enum(['user', 'agent']),
});

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
