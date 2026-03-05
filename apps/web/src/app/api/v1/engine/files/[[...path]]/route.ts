/**
 * GET/PUT /api/v1/engine/files/:path
 * SDD-003 OpenClaw Integration
 *
 * Read and write workspace files on the gateway.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helper';
import { logger } from '@/lib/logger';
import { withErrorHandler, NotFoundError } from '@/lib/errors';
import { validateData } from '@/lib/validation';
import { readFileSchema, writeFileSchema } from '@/lib/validations/engine';
import { ensureCohortMember, ensureAgentAccess } from '@/lib/auth-access';
import { getAgentById } from '@/server/db/queries/agents';
import { getEngineProxy, EngineNotConnectedError } from '@/server/services/engine-proxy-factory';
import { EngineProxyErrorClass } from '@/server/services/engine-proxy';

interface FileResponse {
  path: string;
  content: string;
}

interface WriteFileResponse {
  path: string;
  status: 'written';
}

/**
 * GET handler - read a file from agent workspace
 */
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { userId, organizationId } = await getAuthContext();

    // Get path from params
    const { path: pathSegments } = await params;
    const filePath = pathSegments?.join('/') || '';

    // Parse query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = validateData(readFileSchema, searchParams);

    logger.info('Reading file from engine', {
      correlationId,
      cohortId: query.cohortId,
      agentId: query.agentId,
      path: filePath,
    });

    // Verify cohort exists and user has access
    await ensureCohortMember(query.cohortId, userId);

    // Verify agent exists and user has access to it
    const agent = await ensureAgentAccess(query.agentId, userId, organizationId);

    if (!agent.externalId) {
      return NextResponse.json(
        {
          type: 'https://cohortix.com/errors/agent-not-provisioned',
          title: 'Agent Not Provisioned',
          status: 422,
          detail: 'Agent does not have an external ID.',
        },
        { status: 422 }
      );
    }

    try {
      const proxy = await getEngineProxy(query.cohortId);
      const content = await proxy.readFile(filePath, agent.externalId);

      const response: FileResponse = {
        path: filePath,
        content,
      };

      return NextResponse.json({ data: response }, { status: 200 });
    } catch (error) {
      if (error instanceof EngineProxyErrorClass && error.type === 'agent_error') {
        // File not found or other agent-level error
        return NextResponse.json(
          {
            type: 'https://cohortix.com/errors/file-not-found',
            title: 'File Not Found',
            status: 404,
            detail: `File '${filePath}' not found in agent workspace`,
          },
          { status: 404 }
        );
      }
      throw error;
    }
  }
);

/**
 * PUT handler - write a file to agent workspace
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) => {
    const correlationId = logger.generateCorrelationId();
    logger.setContext({ correlationId });

    const { userId, organizationId } = await getAuthContext();

    // Get path from params
    const { path: pathSegments } = await params;
    const filePath = pathSegments?.join('/') || '';

    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          type: 'https://cohortix.com/errors/invalid-body',
          title: 'Invalid Request Body',
          status: 400,
          detail: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    const validatedBody = validateData(writeFileSchema, body);

    logger.info('Writing file to engine', {
      correlationId,
      cohortId: validatedBody.cohortId,
      agentId: validatedBody.agentId,
      path: filePath,
      contentLength: validatedBody.content.length,
    });

    // Verify cohort exists and user has access
    await ensureCohortMember(validatedBody.cohortId, userId);

    // Verify agent exists and user has access to it
    const agent = await ensureAgentAccess(validatedBody.agentId, userId, organizationId);

    if (!agent.externalId) {
      return NextResponse.json(
        {
          type: 'https://cohortix.com/errors/agent-not-provisioned',
          title: 'Agent Not Provisioned',
          status: 422,
          detail: 'Agent does not have an external ID.',
        },
        { status: 422 }
      );
    }

    const proxy = await getEngineProxy(validatedBody.cohortId);
    await proxy.writeFile(filePath, validatedBody.content, agent.externalId);

    const response: WriteFileResponse = {
      path: filePath,
      status: 'written',
    };

    return NextResponse.json({ data: response }, { status: 200 });
  }
);
