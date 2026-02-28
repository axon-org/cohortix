/**
 * Agent Mention Service
 */

import { db } from '@repo/database/client';
import { comments } from '@repo/database/schema';
import { eq } from 'drizzle-orm';
import { getCohortAgentMembers } from '@/server/db/queries/cohorts';
import { createTaskSession } from '@/server/services/task-sessions';

const mentionRegex = /@([a-z0-9][a-z0-9-]{1,60})/gi;

export interface MentionedAgent {
  agentId: string;
  slug: string;
  name: string | null;
}

export function parseAgentMentions(text: string) {
  const matches = new Set<string>();
  let match: RegExpExecArray | null = null;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match[1]) {
      matches.add(match[1].toLowerCase());
    }
  }

  return Array.from(matches);
}

export async function resolveMentionedAgents(cohortId: string, commentText: string) {
  const mentionSlugs = parseAgentMentions(commentText);
  if (mentionSlugs.length === 0) return [];

  const cohortAgents = await getCohortAgentMembers(cohortId);
  const agentsBySlug = new Map(
    cohortAgents
      .filter(
        (agent): agent is (typeof cohortAgents)[number] & { slug: string } =>
          typeof agent.slug === 'string' && agent.slug.length > 0
      )
      .map((agent) => [agent.slug.toLowerCase(), agent])
  );

  return mentionSlugs
    .map((slug) => agentsBySlug.get(slug))
    .filter((agent): agent is (typeof cohortAgents)[number] & { slug: string } => Boolean(agent))
    .map((agent) => ({
      agentId: agent.agentId,
      slug: agent.slug,
      name: agent.name ?? null,
    }));
}

export interface HandleMentionInput {
  commentId: string;
  commentText: string;
  taskId: string;
  cohortId: string;
  scopeType: 'personal' | 'cohort' | 'org';
  scopeId: string;
}

export async function handleCommentMentions(input: HandleMentionInput) {
  const mentionedAgents = await resolveMentionedAgents(input.cohortId, input.commentText);

  if (mentionedAgents.length === 0) {
    return { mentionedAgentIds: [], sessions: [] };
  }

  const mentionedAgentIds = mentionedAgents.map((agent) => agent.agentId);

  await db
    .update(comments)
    .set({
      mentionedAgentIds,
      updatedAt: new Date(),
    })
    .where(eq(comments.id, input.commentId));

  const sessions = await Promise.all(
    mentionedAgents.map((agent) =>
      createTaskSession({
        taskId: input.taskId,
        agentId: agent.agentId,
        cohortId: input.cohortId,
        scopeType: input.scopeType,
        scopeId: input.scopeId,
      })
    )
  );

  return { mentionedAgentIds, sessions };
}
