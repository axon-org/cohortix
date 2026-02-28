/**
 * Cohort Model Settings API
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helper';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { withMiddleware } from '@/lib/rate-limit';
import { validateRequest, validateData, uuidSchema } from '@/lib/validation';
import { getCohortById, getCohortUserMembers } from '@/server/db/queries/cohorts';
import {
  getCohortModelSettings,
  updateCohortModelSettings,
} from '@/server/services/model-settings';

const modelSettingsRateLimit = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

const providerSettingsSchema = z.object({
  apiKey: z.string().min(1).optional(),
  allowedModels: z.array(z.string()).optional(),
});

const updateSchema = z.object({
  defaultProvider: z.enum(['openai', 'anthropic', 'google']).optional(),
  providers: z
    .object({
      openai: providerSettingsSchema.optional(),
      anthropic: providerSettingsSchema.optional(),
      google: providerSettingsSchema.optional(),
    })
    .partial()
    .default({}),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function ensureOwner(cohortId: string, userId: string) {
  const cohort = await getCohortById(cohortId);
  if (!cohort) throw new NotFoundError('Cohort', cohortId);

  if (cohort.type === 'personal') {
    if (cohort.ownerUserId !== userId) throw new ForbiddenError('Not allowed');
    return;
  }

  const members = await getCohortUserMembers(cohortId);
  const member = members.find((m) => m.userId === userId);
  if (!member || !['owner', 'admin'].includes(member.role)) {
    throw new ForbiddenError('Only cohort owners/admins can manage model settings');
  }
}

export const GET = withMiddleware(
  modelSettingsRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const { id: cohortId } = validateData(z.object({ id: uuidSchema }), { id });

    const { userId } = await getAuthContext();
    await ensureOwner(cohortId, userId);

    const settings = await getCohortModelSettings(cohortId);

    return NextResponse.json({ data: settings });
  }
);

export const PUT = withMiddleware(
  modelSettingsRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const { id: cohortId } = validateData(z.object({ id: uuidSchema }), { id });

    const validator = validateRequest(updateSchema, { target: 'body' });
    const data = await validator(request);

    const { userId } = await getAuthContext();
    await ensureOwner(cohortId, userId);

    const settings = await updateCohortModelSettings(cohortId, data);

    return NextResponse.json({ data: settings });
  }
);
