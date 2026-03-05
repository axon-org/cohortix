/**
 * Agent Mutations Module (AG-B2)
 *
 * Server-side write operations for agents using Drizzle ORM.
 */

import { db } from '@repo/database/client';
import { agentEvolutionEvents, agents } from '@repo/database/schema';
import { eq } from 'drizzle-orm';
import {
  createAgentSchema,
  recordEvolutionEventSchema,
  updateAgentSchema,
  type CreateAgentInput,
  type RecordEvolutionEventInput,
  type UpdateAgentInput,
} from '@/lib/validations/agents';

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^^@-^?]+/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const slugSuffix = () => Date.now().toString(36);

/**
 * Create a new agent
 */
export async function createAgent(input: CreateAgentInput) {
  const validated = createAgentSchema.parse(input);
  const now = new Date();

  const [agent] = await db
    .insert(agents)
    .values({
      organizationId: validated.organizationId ?? null,
      ownerUserId: validated.ownerUserId ?? null,
      scopeType: validated.scopeType,
      scopeId: validated.scopeId,
      defaultCohortId: validated.defaultCohortId ?? null,
      name: validated.name,
      slug: `${slugify(validated.name)}-${slugSuffix()}`,
      description: validated.description ?? null,
      role: validated.role ?? null,
      status: validated.status,
      capabilities: validated.capabilities ?? [],
      runtimeType: validated.runtimeType,
      runtimeConfig: validated.runtimeConfig ?? {},
      settings: validated.settings ?? {},
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return agent ?? null;
}

/**
 * Provision a Clone agent
 */
export async function createCloneAgent(
  userId: string,
  cohortId: string,
  foundationData: Record<string, unknown>
) {
  return createAgent({
    name: 'Clone',
    role: 'Clone',
    scopeType: 'personal',
    scopeId: userId,
    ownerUserId: userId,
    defaultCohortId: cohortId,
    settings: {
      cloneFoundation: foundationData,
    },
  });
}

/**
 * Update an agent
 */
export async function updateAgent(agentId: string, input: UpdateAgentInput) {
  const validated = updateAgentSchema.parse(input);

  const [agent] = await db
    .update(agents)
    .set({
      ...validated,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId))
    .returning();

  return agent ?? null;
}

/**
 * Soft delete an agent
 */
export async function deleteAgent(agentId: string) {
  const [agent] = await db
    .update(agents)
    .set({
      status: 'offline',
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId))
    .returning();

  return agent ?? null;
}

/**
 * Record an evolution event for an agent
 */
export async function recordEvolutionEvent(input: RecordEvolutionEventInput) {
  const validated = recordEvolutionEventSchema.parse(input);

  const [event] = await db
    .insert(agentEvolutionEvents)
    .values({
      agentId: validated.agentId,
      cohortId: validated.cohortId ?? null,
      scopeType: validated.scopeType,
      scopeId: validated.scopeId,
      eventType: validated.type,
      summary: validated.summary,
      metadata: validated.metadata ?? {},
    })
    .returning();

  return event ?? null;
}

// Alias for backward compatibility with engine routes
export { createAgent as insertAgent };
