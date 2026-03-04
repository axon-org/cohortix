/**
 * Insights API Route - GET (list) and POST (create)
 * Axon Codex v1.2 compliant - RFC 7807 errors, structured logging, Zod validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { createRateLimiter, withMiddleware } from '@/lib/rate-limit';
import { validateRequest } from '@/lib/validation';
import { db } from '@repo/database/client';
import { insights, agents } from '@repo/database/schema';
import { desc, eq, inArray } from 'drizzle-orm';

const insightsRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

const shouldSkipRateLimit = () =>
  process.env.NODE_ENV === 'test' ||
  process.env.E2E_SKIP_AUTH === 'true' ||
  process.env.BYPASS_AUTH === 'true';

async function enforceUserRateLimit(request: NextRequest, userId: string) {
  if (shouldSkipRateLimit()) return;
  const limiter = createRateLimiter({
    ...insightsRateLimit,
    keyGenerator: () => `user:${userId}`,
  });
  await limiter(request);
}

const createInsightSchema = z.object({
  title: z.string().min(1).max(500).trim(),
  content: z.string().min(1).trim(),
  source: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// GET /api/v1/insights - List insights for the current organization
// ============================================================================

export const GET = withMiddleware(insightsRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const { organizationId, userId } = await getAuthContext();
  await enforceUserRateLimit(request, userId);

  logger.info('Fetching insights', { correlationId, userId, organizationId });

  try {
    // Fetch insights for the organization
    const rows = await db
      .select({
        id: insights.id,
        title: insights.title,
        content: insights.content,
        source: insights.sourceType,
        allyId: insights.allyId,
        tags: insights.tags,
        createdAt: insights.createdAt,
      })
      .from(insights)
      .where(eq(insights.organizationId, organizationId))
      .orderBy(desc(insights.createdAt))
      .limit(50);

    // Fetch agent names if ally_ids exist
    const allyIds = rows.map((r) => r.allyId).filter((id): id is string => Boolean(id));

    const agentMap = new Map<string, { name: string | null; avatarUrl: string | null }>();
    if (allyIds.length > 0) {
      const agentRows = await db
        .select({
          id: agents.id,
          name: agents.name,
          avatarUrl: agents.avatarUrl,
        })
        .from(agents)
        .where(inArray(agents.id, allyIds));

      agentRows.forEach((a) => agentMap.set(a.id, { name: a.name, avatarUrl: a.avatarUrl }));
    }

    const data = rows.map((row) => {
      const agent = row.allyId ? agentMap.get(row.allyId) : null;
      return {
        id: row.id,
        title: row.title,
        content: row.content,
        source: row.source,
        agent_id: row.allyId,
        agent_name: agent?.name ?? 'AI Agent',
        agent_avatar_url: agent?.avatarUrl,
        tags: row.tags ?? [],
        created_at: row.createdAt?.toISOString() ?? new Date().toISOString(),
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Failed to fetch insights', { correlationId, error });
    return NextResponse.json(
      {
        type: 'https://cohortix.io/errors/internal-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to fetch insights',
      },
      { status: 500 }
    );
  }
});

// ============================================================================
// POST /api/v1/insights - Create a new insight
// ============================================================================

export const POST = withMiddleware(insightsRateLimit, async (request: NextRequest) => {
  const correlationId = logger.generateCorrelationId();
  logger.setContext({ correlationId });

  const validator = validateRequest(createInsightSchema, { target: 'body' });
  const data = await validator(request);

  const { organizationId, userId } = await getAuthContext();
  await enforceUserRateLimit(request, userId);

  logger.info('Creating insight', {
    correlationId,
    userId,
    organizationId,
    title: data.title,
  });

  try {
    const result = await db
      .insert(insights)
      .values({
        organizationId,
        scopeType: 'org',
        scopeId: organizationId,
        title: data.title,
        content: data.content,
        sourceType: data.source,
        tags: data.tags ?? [],
      })
      .returning();

    const insight = result[0];
    if (!insight) {
      throw new Error('Failed to create insight');
    }

    return NextResponse.json(
      {
        data: {
          id: insight.id,
          title: insight.title,
          content: insight.content,
          source: insight.sourceType,
          agent_id: null,
          agent_name: null,
          agent_avatar_url: null,
          tags: insight.tags ?? [],
          created_at: insight.createdAt?.toISOString() ?? new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create insight', { correlationId, error });
    return NextResponse.json(
      {
        type: 'https://cohortix.io/errors/internal-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to create insight',
      },
      { status: 500 }
    );
  }
});
