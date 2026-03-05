/**
 * Engine Proxy Service
 * SDD-003 OpenClaw Integration
 *
 * Handles all communication between Cohortix and user-hosted OpenClaw Gateway.
 * The frontend never communicates with the gateway directly.
 */

import { logger } from '@/lib/logger';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  InternalServerError,
} from '@/lib/errors';

// ============================================================================
// Types
// ============================================================================

export type EngineErrorType =
  | 'auth_failed'
  | 'unreachable'
  | 'endpoint_disabled'
  | 'rate_limited'
  | 'agent_error'
  | 'version_mismatch'
  | 'unknown';

export interface EngineProxyError {
  type: EngineErrorType;
  message: string;
  originalError?: unknown;
}

export interface HealthCheckResult {
  reachable: boolean;
  latencyMs: number;
  gatewayVersion: string;
  runtimeStatus: 'online' | 'offline' | 'error';
  error?: EngineProxyError;
}

export interface GatewayAgent {
  externalId: string;
  name: string;
  model?: string;
  workspace?: string;
}

export interface ToolResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface AgentResponse {
  text: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

// ============================================================================
// Error Classification
// ============================================================================

export function classifyError(error: unknown): EngineErrorType {
  if (error instanceof Response) {
    if (error.status === 401 || error.status === 403) return 'auth_failed';
    if (error.status === 404) return 'endpoint_disabled';
    if (error.status === 429) return 'rate_limited';
    if (error.status >= 500) return 'agent_error';
  }

  if (error instanceof TypeError) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      return 'unreachable';
    }
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return 'unreachable';
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('timeout')) return 'unreachable';
    if (error.message.includes('version')) return 'version_mismatch';
  }

  return 'unknown';
}

export class EngineProxyErrorClass extends Error {
  constructor(
    public type: EngineErrorType,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'EngineProxyError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================================
// Engine Proxy Service
// ============================================================================

export interface EngineProxyOptions {
  timeoutMs: number;
  maxRetries: number;
}

export class EngineProxyService {
  constructor(
    private gatewayUrl: string,
    private authToken: string,
    private options: EngineProxyOptions
  ) {}

  /**
   * Build request headers for OpenClaw Gateway
   */
  private buildHeaders(agentHeaders?: {
    agentId?: string;
    sessionKey?: string;
  }): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
      'x-cohortix-request-id': crypto.randomUUID(),
    };

    // NOTE: /v1/responses supports x-openclaw-agent-id and x-openclaw-session-key
    // /tools/invoke does NOT support these headers — use sessionKey in body instead
    if (agentHeaders?.agentId) {
      headers['x-openclaw-agent-id'] = agentHeaders.agentId;
    }
    if (agentHeaders?.sessionKey) {
      headers['x-openclaw-session-key'] = agentHeaders.sessionKey;
    }

    return headers;
  }

  /**
   * Normalize gateway URL (strip trailing slash, validate protocol)
   */
  private normalizeUrl(url: string): string {
    const trimmed = url.replace(/\/$/, '');
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      throw new BadRequestError('Gateway URL must use http:// or https:// protocol');
    }
    return trimmed;
  }

  /**
   * Make HTTP request with timeout and retry logic
   */
  private async fetchWithRetry(
    endpoint: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<Response> {
    const url = `${this.normalizeUrl(this.gatewayUrl)}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      const errorType = classifyError(error);

      // Retry on network errors (but not auth or endpoint errors)
      if (
        retryCount < this.options.maxRetries &&
        (errorType === 'unreachable' || errorType === 'unknown')
      ) {
        const delay = Math.pow(2, retryCount) * 100; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Send a prompt to an agent via POST /v1/responses
   * Returns the agent response (non-streaming for v1)
   */
  async sendToAgent(params: {
    agentId: string;
    sessionKey: string;
    input: string;
    stream?: boolean;
  }): Promise<AgentResponse> {
    const { agentId, sessionKey, input, stream } = params;

    logger.info('Sending prompt to agent', { agentId, sessionKey, hasStream: stream });

    try {
      const response = await this.fetchWithRetry('/v1/responses', {
        method: 'POST',
        headers: this.buildHeaders({ agentId, sessionKey }),
        body: JSON.stringify({
          model: 'openclaw',
          input,
          stream: stream ?? false,
        }),
      });

      if (!response.ok) {
        const errorType = classifyError(response);
        throw new EngineProxyErrorClass(
          errorType,
          `Failed to send to agent: ${response.status} ${response.statusText}`,
          response
        );
      }

      // Handle streaming vs non-streaming
      if (stream) {
        // For now, return the raw response for streaming
        // In v1.1, implement full SSE streaming
        const data = await response.json();
        return {
          text: data.output?.[0]?.content?.[0]?.text || JSON.stringify(data),
          usage: data.usage,
        };
      }

      const data = await response.json();
      return {
        text: data.output?.[0]?.content?.[0]?.text || JSON.stringify(data),
        usage: data.usage,
      };
    } catch (error) {
      if (error instanceof EngineProxyErrorClass) {
        throw error;
      }

      const errorType = classifyError(error);
      throw new EngineProxyErrorClass(
        errorType,
        error instanceof Error ? error.message : 'Unknown error sending to agent',
        error
      );
    }
  }

  /**
   * Invoke a tool via POST /tools/invoke
   * NOTE: /tools/invoke does NOT support x-openclaw-agent-id header
   * Use sessionKey in the body to target specific agent workspaces
   */
  async invokeTool(params: {
    tool: string;
    args: Record<string, unknown>;
    sessionKey?: string;
  }): Promise<ToolResponse> {
    const { tool, args, sessionKey } = params;

    logger.info('Invoking tool', { tool, hasSessionKey: !!sessionKey });

    try {
      const body: Record<string, unknown> = { tool, args };
      if (sessionKey) {
        body.sessionKey = sessionKey;
      }

      const response = await this.fetchWithRetry('/tools/invoke', {
        method: 'POST',
        headers: this.buildHeaders(), // No agent headers for /tools/invoke
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorType = classifyError(response);
        throw new EngineProxyErrorClass(
          errorType,
          `Tool invocation failed: ${response.status} ${response.statusText}`,
          response
        );
      }

      const data = await response.json();
      return {
        success: true,
        result: data,
      };
    } catch (error) {
      if (error instanceof EngineProxyErrorClass) {
        throw error;
      }

      const errorType = classifyError(error);
      throw new EngineProxyErrorClass(
        errorType,
        error instanceof Error ? error.message : 'Unknown error invoking tool',
        error
      );
    }
  }

  /**
   * Invoke a tool on a specific agent's workspace
   * Uses sessionKey: "agent:<externalId>:main" to target the right workspace
   */
  async invokeToolForAgent(params: {
    agentExternalId: string;
    tool: string;
    args: Record<string, unknown>;
  }): Promise<ToolResponse> {
    const { agentExternalId, tool, args } = params;
    const sessionKey = `agent:${agentExternalId}:main`;

    return this.invokeTool({ tool, args, sessionKey });
  }

  /**
   * Read a file from agent workspace
   */
  async readFile(path: string, agentExternalId?: string): Promise<string> {
    const sessionKey = agentExternalId ? `agent:${agentExternalId}:main` : undefined;

    const response = await this.invokeTool({
      tool: 'read',
      args: { path },
      sessionKey,
    });

    if (!response.success) {
      throw new EngineProxyErrorClass('agent_error', response.error || 'Failed to read file');
    }

    return String(response.result ?? '');
  }

  /**
   * Write a file to agent workspace
   */
  async writeFile(path: string, content: string, agentExternalId?: string): Promise<void> {
    const sessionKey = agentExternalId ? `agent:${agentExternalId}:main` : undefined;

    const response = await this.invokeTool({
      tool: 'write',
      args: { path, content },
      sessionKey,
    });

    if (!response.success) {
      throw new EngineProxyErrorClass('agent_error', response.error || 'Failed to write file');
    }
  }

  /**
   * Check gateway health and version
   * NOTE: OpenClaw has NO HTTP health endpoint. We use /tools/invoke instead.
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // 1. Call session_status for liveness
      const statusResponse = await this.invokeTool({
        tool: 'session_status',
        args: {},
      });

      if (!statusResponse.success) {
        return {
          reachable: false,
          latencyMs: Date.now() - startTime,
          gatewayVersion: '',
          runtimeStatus: 'error',
          error: {
            type: 'unreachable',
            message: 'Gateway is not responding',
          },
        };
      }

      // 2. Call exec openclaw --version for version
      let version = 'unknown';
      try {
        const versionResponse = await this.invokeTool({
          tool: 'exec',
          args: { command: 'openclaw --version' },
        });

        if (versionResponse.success && versionResponse.result) {
          const resultStr = String(versionResponse.result);
          // Extract version from output like "openclaw version 2026.3.2"
          const match = resultStr.match(/(\d{4}\.\d{1,2}\.\d{1,2})/);
          version = match?.[0] ?? 'unknown';
        }
      } catch {
        // Version check is non-critical
        logger.warn('Failed to get gateway version');
      }

      // Check minimum version (2026.1.29)
      const minVersion = '2026.1.29';
      if (version !== 'unknown' && this.compareVersions(version, minVersion) < 0) {
        return {
          reachable: true,
          latencyMs: Date.now() - startTime,
          gatewayVersion: version,
          runtimeStatus: 'error',
          error: {
            type: 'version_mismatch',
            message: `Gateway version ${version} is below minimum required ${minVersion}`,
          },
        };
      }

      return {
        reachable: true,
        latencyMs: Date.now() - startTime,
        gatewayVersion: version,
        runtimeStatus: 'online',
      };
    } catch (error) {
      const errorType = classifyError(error);
      const runtimeStatus = errorType === 'auth_failed' ? 'error' : 'offline';

      return {
        reachable: false,
        latencyMs: Date.now() - startTime,
        gatewayVersion: '',
        runtimeStatus,
        error: {
          type: errorType,
          message: error instanceof Error ? error.message : 'Health check failed',
          originalError: error,
        },
      };
    }
  }

  /**
   * Compare semantic versions
   * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] ?? 0;
      const p2 = parts2[i] ?? 0;
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    return 0;
  }

  /**
   * Discover existing agents on the gateway
   * Uses: openclaw agents list --json
   */
  async discoverAgents(): Promise<GatewayAgent[]> {
    try {
      const response = await this.invokeTool({
        tool: 'exec',
        args: { command: 'openclaw agents list --json' },
      });

      if (!response.success) {
        return [];
      }

      // Parse JSON output
      let agents: unknown[] = [];
      try {
        const result = response.result;
        if (typeof result === 'string') {
          agents = JSON.parse(result);
        } else if (Array.isArray(result)) {
          agents = result;
        }
      } catch {
        logger.warn('Failed to parse agents list JSON');
        return [];
      }

      return agents
        .filter((a): a is Record<string, unknown> => typeof a === 'object' && a !== null)
        .map((agent) => ({
          externalId: String(agent.id || agent.agentId || ''),
          name: String(agent.name || ''),
          model: agent.model ? String(agent.model) : undefined,
          workspace: agent.workspace ? String(agent.workspace) : undefined,
        }))
        .filter((agent) => agent.externalId);
    } catch (error) {
      logger.error('Failed to discover agents', { error });
      return [];
    }
  }
}
