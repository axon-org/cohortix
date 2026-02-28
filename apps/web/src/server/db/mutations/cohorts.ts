/**
 * Cohort Mutations Module (COH-B3)
 *
 * Server-side write operations for cohorts using Drizzle ORM.
 */

import { db } from '@repo/database/client';
import { cohortAgentMembers, cohortUserMembers, cohorts } from '@repo/database/schema';
import { and, eq } from 'drizzle-orm';
import {
  addAgentMemberSchema,
  addUserMemberSchema,
  createCohortSchema,
  removeMemberSchema,
  updateCohortSchema,
  updateMemberRoleSchema,
  updateCohortRuntimeSchema,
  type AddAgentMemberInput,
  type AddUserMemberInput,
  type CreateCohortInput,
  type RemoveMemberInput,
  type UpdateCohortInput,
  type UpdateMemberRoleInput,
  type UpdateCohortRuntimeInput,
} from '@/lib/validations/cohorts';
import { generateSlug } from '@/lib/utils/cohort';

export {
  createCohortSchema,
  updateCohortSchema,
  addUserMemberSchema,
  addAgentMemberSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  updateCohortRuntimeSchema,
};

const slugSuffix = () => Date.now().toString(36);

/**
 * Create a new cohort (personal or shared)
 */
export async function createCohort(input: CreateCohortInput): Promise<any>;
export async function createCohort(
  organizationId: string,
  createdBy: string,
  input: Record<string, unknown>
): Promise<any>;
export async function createCohort(
  organizationIdOrInput: string | CreateCohortInput,
  createdBy?: string,
  legacyInput?: Record<string, unknown>
) {
  const normalizedInput: CreateCohortInput =
    typeof organizationIdOrInput === 'string'
      ? (() => {
          const legacy = legacyInput as {
            name: string;
            description?: string | null;
            startDate?: string | null;
            endDate?: string | null;
            start_date?: string | null;
            end_date?: string | null;
            hosting?: 'managed' | 'self_hosted';
            runtimeStatus?: 'provisioning' | 'online' | 'offline' | 'error' | 'paused';
            settings?: Record<string, unknown>;
          };

          return {
            name: legacy.name,
            description: legacy.description,
            type: 'shared',
            organizationId: organizationIdOrInput,
            createdBy: createdBy as string,
            hosting: legacy.hosting,
            runtimeStatus: legacy.runtimeStatus,
            settings: legacy.settings,
            startDate: legacy.startDate ?? legacy.start_date ?? undefined,
            endDate: legacy.endDate ?? legacy.end_date ?? undefined,
          };
        })()
      : organizationIdOrInput;

  const validated = createCohortSchema.parse(normalizedInput);
  const now = new Date();

  const [cohort] = await db
    .insert(cohorts)
    .values({
      organizationId: validated.type === 'shared' ? (validated.organizationId ?? null) : null,
      ownerUserId: validated.type === 'personal' ? (validated.ownerUserId ?? null) : null,
      type: validated.type,
      name: validated.name,
      slug: generateSlug(validated.name, slugSuffix()),
      description: validated.description ?? null,
      status: 'active',
      hosting: validated.hosting,
      runtimeStatus: validated.runtimeStatus ?? 'provisioning',
      startDate: validated.startDate ?? null,
      endDate: validated.endDate ?? null,
      settings: validated.settings ?? {},
      createdBy: validated.createdBy,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Auto-add creator as owner member
  if (cohort && validated.createdBy) {
    await db.insert(cohortUserMembers).values({
      cohortId: cohort.id,
      userId: validated.createdBy,
      role: 'owner',
    });
  }

  return cohort ?? null;
}

/**
 * Provision a personal cohort with default name
 */
export async function provisionPersonalCohort(userId: string, firstName: string) {
  const name = `${firstName}'s Cohort`;
  return createCohort({
    name,
    type: 'personal',
    ownerUserId: userId,
    createdBy: userId,
  });
}

/**
 * Update an existing cohort
 */
export async function updateCohort(cohortId: string, input: UpdateCohortInput) {
  const validated = updateCohortSchema.parse(input);

  const [cohort] = await db
    .update(cohorts)
    .set({
      ...validated,
      updatedAt: new Date(),
    })
    .where(eq(cohorts.id, cohortId))
    .returning();

  return cohort ?? null;
}

/**
 * Soft delete (archive) a cohort
 */
export async function deleteCohort(cohortId: string) {
  const [cohort] = await db
    .update(cohorts)
    .set({
      status: 'completed',
      updatedAt: new Date(),
    })
    .where(eq(cohorts.id, cohortId))
    .returning();

  return cohort ?? null;
}

/**
 * Add a user member to a cohort
 */
export async function addUserMember(input: AddUserMemberInput) {
  const validated = addUserMemberSchema.parse(input);

  const [member] = await db
    .insert(cohortUserMembers)
    .values({
      cohortId: validated.cohortId,
      userId: validated.userId,
      role: validated.role,
    })
    .returning();

  return member ?? null;
}

/**
 * Add an agent member to a cohort
 */
export async function addAgentMember(input: AddAgentMemberInput) {
  const validated = addAgentMemberSchema.parse(input);

  const [member] = await db
    .insert(cohortAgentMembers)
    .values({
      cohortId: validated.cohortId,
      agentId: validated.agentId,
      role: validated.role,
    })
    .returning();

  return member ?? null;
}

/**
 * Remove a user or agent member from a cohort
 */
export async function removeMember(input: RemoveMemberInput) {
  const validated = removeMemberSchema.parse(input);

  if (validated.type === 'user') {
    const [member] = await db
      .delete(cohortUserMembers)
      .where(
        and(
          eq(cohortUserMembers.cohortId, validated.cohortId),
          eq(cohortUserMembers.userId, validated.memberId)
        )
      )
      .returning();
    return member ?? null;
  }

  const [member] = await db
    .delete(cohortAgentMembers)
    .where(
      and(
        eq(cohortAgentMembers.cohortId, validated.cohortId),
        eq(cohortAgentMembers.agentId, validated.memberId)
      )
    )
    .returning();

  return member ?? null;
}

/**
 * Update a member's role
 */
export async function updateMemberRole(input: UpdateMemberRoleInput) {
  const validated = updateMemberRoleSchema.parse(input);

  if (validated.type === 'user') {
    const [member] = await db
      .update(cohortUserMembers)
      .set({
        role: validated.role,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(cohortUserMembers.cohortId, validated.cohortId),
          eq(cohortUserMembers.userId, validated.memberId)
        )
      )
      .returning();
    return member ?? null;
  }

  const [member] = await db
    .update(cohortAgentMembers)
    .set({
      role: validated.role,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(cohortAgentMembers.cohortId, validated.cohortId),
        eq(cohortAgentMembers.agentId, validated.memberId)
      )
    )
    .returning();

  return member ?? null;
}

/**
 * Update cohort runtime fields
 */
export async function updateCohortRuntime(cohortId: string, input: UpdateCohortRuntimeInput) {
  const validated = updateCohortRuntimeSchema.parse(input);

  const [cohort] = await db
    .update(cohorts)
    .set({
      ...validated,
      updatedAt: new Date(),
    })
    .where(eq(cohorts.id, cohortId))
    .returning();

  return cohort ?? null;
}

/**
 * Compute cohort member count
 */
export async function updateCohortMemberCount(cohortId: string) {
  const [userCount, agentCount] = await Promise.all([
    db
      .select({ count: cohortUserMembers.id })
      .from(cohortUserMembers)
      .where(eq(cohortUserMembers.cohortId, cohortId)),
    db
      .select({ count: cohortAgentMembers.id })
      .from(cohortAgentMembers)
      .where(eq(cohortAgentMembers.cohortId, cohortId)),
  ]);

  const total = (userCount?.length ?? 0) + (agentCount?.length ?? 0);

  await db
    .update(cohorts)
    .set({ memberCount: total, updatedAt: new Date() })
    .where(eq(cohorts.id, cohortId));

  return total;
}

/**
 * Compute cohort engagement percentage
 */
export async function updateCohortEngagement(cohortId: string) {
  const agentRows = await db
    .select({ engagementScore: cohortAgentMembers.engagementScore })
    .from(cohortAgentMembers)
    .where(eq(cohortAgentMembers.cohortId, cohortId));

  const scores = agentRows.map((row) => Number(row.engagementScore || 0));
  const avg = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  const engagementPercent = Math.round(avg * 100) / 100;

  await db
    .update(cohorts)
    .set({ engagementPercent: engagementPercent.toFixed(2), updatedAt: new Date() })
    .where(eq(cohorts.id, cohortId));

  return engagementPercent;
}
