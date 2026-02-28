/**
 * Shared Authorization Access Control Utilities
 * Axon Codex v1.2 - DRY Principle for Access Control Logic
 */

import { ForbiddenError, NotFoundError } from './errors';
import { getAgentById } from '@/server/db/queries/agents';
import { getCohortById, getCohortUserMembers } from '@/server/db/queries/cohorts';

/**
 * Ensure user has access to an agent based on scope type
 * @throws {NotFoundError} If agent doesn't exist
 * @throws {ForbiddenError} If user doesn't have access
 */
export async function ensureAgentAccess(agentId: string, userId: string, organizationId: string) {
  const agent = await getAgentById(agentId);
  if (!agent) throw new NotFoundError('Agent', agentId);

  if (agent.scopeType === 'personal') {
    if (agent.ownerUserId !== userId) throw new ForbiddenError('Not allowed');
    return agent;
  }

  if (agent.scopeType === 'org') {
    if (agent.organizationId !== organizationId) throw new ForbiddenError('Not allowed');
    return agent;
  }

  if (agent.scopeType === 'cohort') {
    const members = await getCohortUserMembers(agent.scopeId);
    const member = members.find((m) => m.userId === userId);
    if (!member) throw new ForbiddenError('Not a cohort member');
    return agent;
  }

  return agent;
}

/**
 * Ensure user is a member of a cohort
 * @throws {NotFoundError} If cohort doesn't exist
 * @throws {ForbiddenError} If user is not a member
 */
export async function ensureCohortMember(cohortId: string, userId: string) {
  const cohort = await getCohortById(cohortId);
  if (!cohort) throw new NotFoundError('Cohort', cohortId);

  if (cohort.type === 'personal') {
    if (cohort.ownerUserId !== userId) throw new ForbiddenError('Not allowed');
    return cohort;
  }

  const members = await getCohortUserMembers(cohortId);
  const member = members.find((m) => m.userId === userId);
  if (!member) throw new ForbiddenError('Not a cohort member');

  return cohort;
}

/**
 * Ensure user has admin access to a cohort
 * @throws {NotFoundError} If cohort doesn't exist
 * @throws {ForbiddenError} If user is not an admin
 */
export async function ensureCohortAdmin(cohortId: string, userId: string) {
  const cohort = await getCohortById(cohortId);
  if (!cohort) throw new NotFoundError('Cohort', cohortId);

  if (cohort.type === 'personal') {
    if (cohort.ownerUserId !== userId) throw new ForbiddenError('Not allowed');
    return cohort;
  }

  const members = await getCohortUserMembers(cohortId);
  const member = members.find((m) => m.userId === userId);
  if (!member) throw new ForbiddenError('Not a cohort member');
  if (member.role !== 'admin' && member.role !== 'owner') {
    throw new ForbiddenError('Admin access required');
  }

  return cohort;
}
