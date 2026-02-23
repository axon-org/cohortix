/**
 * Individual Agent API Route - GET, PATCH, DELETE
 * Axon Codex v1.2 compliant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { NotFoundError } from '@/lib/errors';
import { withMiddleware, standardRateLimit } from '@/lib/rate-limit';
import { validateRequest, validateData } from '@/lib/validation';
import { updateAgentSchema, type UpdateAgentInput } from '@/lib/validations/agent';
import { uuidSchema } from '@/lib/validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET /api/v1/agents/:id
// ============================================================================

export const GET = withMiddleware(
  standardRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const agentId = validateData(uuidSchema, id);

    const { supabase, organizationId } = await getAuthContext();

    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !agent) throw new NotFoundError('Agent', agentId);

    return NextResponse.json({ data: agent });
  }
);

// ============================================================================
// PATCH /api/v1/agents/:id
// ============================================================================

export const PATCH = withMiddleware(
  standardRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const agentId = validateData(uuidSchema, id);

    const validator = validateRequest(updateAgentSchema, { target: 'body' });
    const data = (await validator(request)) as UpdateAgentInput;

    const { supabase, organizationId } = await getAuthContext();

    const { data: existing } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('organization_id', organizationId)
      .single();
    if (!existing) throw new NotFoundError('Agent', agentId);

    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.capabilities !== undefined) updateData.capabilities = data.capabilities;
    if (data.runtimeType !== undefined) updateData.runtime_type = data.runtimeType;
    if (data.runtimeConfig !== undefined) updateData.runtime_config = data.runtimeConfig;
    if (data.settings !== undefined) updateData.settings = data.settings;

    const { data: agent, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', agentId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update agent', {
        correlationId,
        error: { message: error.message, code: error.code },
      });
      throw error;
    }

    logger.info('Agent updated', { correlationId, agentId });
    return NextResponse.json({ data: agent });
  }
);

// ============================================================================
// DELETE /api/v1/agents/:id
// ============================================================================

export const DELETE = withMiddleware(
  standardRateLimit,
  async (request: NextRequest, context: RouteContext) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { id } = await context.params;
    const agentId = validateData(uuidSchema, id);

    const { supabase, organizationId } = await getAuthContext();

    const { data: existing } = await supabase
      .from('agents')
      .select('id, name')
      .eq('id', agentId)
      .eq('organization_id', organizationId)
      .single();
    if (!existing) throw new NotFoundError('Agent', agentId);

    const { error } = await supabase.from('agents').delete().eq('id', agentId);
    if (error) {
      logger.error('Failed to delete agent', {
        correlationId,
        error: { message: error.message, code: error.code },
      });
      throw error;
    }

    logger.info('Agent deleted', { correlationId, agentId, agentName: existing.name });
    return new NextResponse(null, { status: 204 });
  }
);
