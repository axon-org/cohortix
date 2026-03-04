/**
 * Agent Permissions Service
 */

import { db } from '@repo/database/client';
import { agents } from '@repo/database/schema';
import { eq } from 'drizzle-orm';

export type AgentAction = 'create' | 'read' | 'update' | 'delete' | 'post';
export type AgentResource = 'tasks' | 'knowledge' | 'comments' | 'cohorts' | 'missions';

export type AgentCapabilities =
  | Array<string>
  | Record<string, Record<AgentAction, boolean>>
  | Record<string, unknown>;

function hasCapabilityString(capabilities: string[], resource: AgentResource, action: AgentAction) {
  const candidates = [`${resource}:${action}`, `${resource}.${action}`, `${action}:${resource}`];

  return candidates.some((candidate) => capabilities.includes(candidate));
}

export async function getAgentCapabilities(agentId: string): Promise<AgentCapabilities | null> {
  const [agent] = await db
    .select({ capabilities: agents.capabilities })
    .from(agents)
    .where(eq(agents.id, agentId));

  return (agent?.capabilities ?? null) as AgentCapabilities | null;
}

export async function canAgentPerform(
  agentId: string,
  action: AgentAction,
  resource: AgentResource
) {
  const capabilities = await getAgentCapabilities(agentId);
  if (!capabilities) return false;

  if (Array.isArray(capabilities)) {
    return hasCapabilityString(capabilities, resource, action);
  }

  if (typeof capabilities === 'object' && capabilities !== null) {
    const resourceCaps = (capabilities as Record<string, Record<string, boolean>>)[resource];
    if (resourceCaps && typeof resourceCaps === 'object') {
      return Boolean(resourceCaps[action]);
    }
  }

  return false;
}
