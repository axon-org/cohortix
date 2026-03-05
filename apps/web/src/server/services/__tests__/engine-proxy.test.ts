import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  EngineProxyService,
  classifyError,
  EngineProxyErrorClass,
  type EngineErrorType,
  type HealthCheckResult,
  type AgentResponse,
  type ToolResponse,
} from '../engine-proxy';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EngineProxyService', () => {
  let service: EngineProxyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EngineProxyService('https://gateway.example.com', 'test-token-123', {
      timeoutMs: 5000,
      maxRetries: 2,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('classifyError', () => {
    it('should classify auth failures (401)', () => {
      const response = new Response(null, { status: 401 });
      expect(classifyError(response)).toBe('auth_failed');
    });

    it('should classify auth failures (403)', () => {
      const response = new Response(null, { status: 403 });
      expect(classifyError(response)).toBe('auth_failed');
    });

    it('should classify endpoint disabled (404)', () => {
      const response = new Response(null, { status: 404 });
      expect(classifyError(response)).toBe('endpoint_disabled');
    });

    it('should classify rate limiting (429)', () => {
      const response = new Response(null, { status: 429 });
      expect(classifyError(response)).toBe('rate_limited');
    });

    it('should classify agent errors (5xx)', () => {
      expect(classifyError(new Response(null, { status: 500 }))).toBe('agent_error');
      expect(classifyError(new Response(null, { status: 502 }))).toBe('agent_error');
      expect(classifyError(new Response(null, { status: 503 }))).toBe('agent_error');
    });

    it('should classify network errors as unreachable', () => {
      const fetchError = new TypeError('Failed to fetch');
      expect(classifyError(fetchError)).toBe('unreachable');
    });

    it('should classify ECONNREFUSED as unreachable', () => {
      const connError = new TypeError('ECONNREFUSED');
      expect(classifyError(connError)).toBe('unreachable');
    });

    it('should classify ENOTFOUND as unreachable', () => {
      const notFoundError = new TypeError('ENOTFOUND');
      expect(classifyError(notFoundError)).toBe('unreachable');
    });

    it('should classify timeout errors as unreachable', () => {
      const timeoutError = new Error('Request timeout');
      expect(classifyError(timeoutError)).toBe('unreachable');
    });

    it('should classify version mismatch errors', () => {
      const versionError = new Error('Gateway version 2025.1.0 is incompatible');
      expect(classifyError(versionError)).toBe('version_mismatch');
    });

    it('should classify EngineProxyErrorClass by type', () => {
      const error = new EngineProxyErrorClass('auth_failed', 'Auth failed');
      expect(classifyError(error)).toBe('auth_failed');
    });

    it('should return unknown for unrecognized errors', () => {
      expect(classifyError(new Error('Random error'))).toBe('unknown');
      expect(classifyError(new Response(null, { status: 418 }))).toBe('unknown');
      expect(classifyError('string error')).toBe('unknown');
    });
  });

  describe('buildHeaders', () => {
    it('should build basic headers without agent context', () => {
      const headers = (service as any).buildHeaders();

      expect(headers.Authorization).toBe('Bearer test-token-123');
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['x-cohortix-request-id']).toBeDefined();
      expect(headers['x-openclaw-agent-id']).toBeUndefined();
      expect(headers['x-openclaw-session-key']).toBeUndefined();
    });

    it('should include agent headers when provided', () => {
      const headers = (service as any).buildHeaders({
        agentId: 'agent-123',
        sessionKey: 'cohortix:task:task-1:agent:agent-123',
      });

      expect(headers['x-openclaw-agent-id']).toBe('agent-123');
      expect(headers['x-openclaw-session-key']).toBe('cohortix:task:task-1:agent:agent-123');
    });

    it('should include only agentId when sessionKey not provided', () => {
      const headers = (service as any).buildHeaders({ agentId: 'agent-123' });

      expect(headers['x-openclaw-agent-id']).toBe('agent-123');
      expect(headers['x-openclaw-session-key']).toBeUndefined();
    });

    it('should include only sessionKey when agentId not provided', () => {
      const headers = (service as any).buildHeaders({
        sessionKey: 'cohortix:task:task-1:agent:agent-123',
      });

      expect(headers['x-openclaw-agent-id']).toBeUndefined();
      expect(headers['x-openclaw-session-key']).toBe('cohortix:task:task-1:agent:agent-123');
    });
  });

  describe('retry logic (exponential backoff)', () => {
    it('should retry on network errors with exponential backoff', async () => {
      vi.useFakeTimers();

      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );

      const promise = service.invokeTool({
        tool: 'session_status',
        args: {},
      });

      // First retry: 100ms
      await vi.advanceTimersByTimeAsync(100);

      // Second retry: 200ms
      await vi.advanceTimersByTimeAsync(200);

      const result = await promise;

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);

      vi.useRealTimers();
    });

    it('should not retry on auth failures', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 401 }));

      await expect(
        service.invokeTool({
          tool: 'session_status',
          args: {},
        })
      ).rejects.toThrow(EngineProxyErrorClass);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on endpoint disabled', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 404 }));

      await expect(
        service.invokeTool({
          tool: 'session_status',
          args: {},
        })
      ).rejects.toThrow(EngineProxyErrorClass);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should stop retrying after maxRetries', async () => {
      vi.useFakeTimers();

      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const promise = service.invokeTool({
        tool: 'session_status',
        args: {},
      });

      // Advance timers to allow retries
      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(200);

      // Catch the rejection to prevent unhandled promise
      await expect(promise).rejects.toThrow();

      // Initial + 2 retries = 3 calls
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Run any remaining timers
      await vi.runAllTimersAsync();

      vi.useRealTimers();
    });
  });

  describe('sendToAgent', () => {
    it('should send prompt and return agent response', async () => {
      const mockResponse = {
        output: [
          {
            content: [{ text: 'Agent response text' }],
          },
        ],
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await service.sendToAgent({
        agentId: 'agent-123',
        sessionKey: 'cohortix:task:task-1:agent:agent-123',
        input: 'Hello agent',
        stream: false,
      });

      expect(result.text).toBe('Agent response text');
      expect(result.usage).toEqual({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://gateway.example.com/v1/responses',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            model: 'openclaw',
            input: 'Hello agent',
            stream: false,
          }),
        })
      );
    });

    it('should throw EngineProxyErrorClass on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));

      await expect(
        service.sendToAgent({
          agentId: 'agent-123',
          sessionKey: 'cohortix:task:task-1:agent:agent-123',
          input: 'Hello',
          stream: false,
        })
      ).rejects.toThrow(EngineProxyErrorClass);
    });
  });

  describe('invokeTool', () => {
    it('should invoke tool without sessionKey', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'tool result' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await service.invokeTool({
        tool: 'session_status',
        args: {},
      });

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ data: 'tool result' });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs?.[1]?.body as string);
      expect(body.tool).toBe('session_status');
      expect(body.sessionKey).toBeUndefined();
    });

    it('should invoke tool with sessionKey', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'tool result' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await service.invokeTool({
        tool: 'read',
        args: { path: 'SOUL.md' },
        sessionKey: 'agent:agent-123:main',
      });

      expect(result.success).toBe(true);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs?.[1]?.body as string);
      expect(body.sessionKey).toBe('agent:agent-123:main');
    });

    it('should throw EngineProxyErrorClass on tool error', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));

      await expect(
        service.invokeTool({
          tool: 'read',
          args: { path: 'missing.md' },
        })
      ).rejects.toThrow(EngineProxyErrorClass);
    });
  });

  describe('healthCheck', () => {
    it('should return online status with version', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify('openclaw version 2026.3.4'), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );

      const result = await service.healthCheck();

      expect(result.reachable).toBe(true);
      expect(result.runtimeStatus).toBe('online');
      expect(result.gatewayVersion).toBe('2026.3.4');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it('should detect version mismatch', async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify('openclaw version 2026.1.1'), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );

      const result = await service.healthCheck();

      expect(result.runtimeStatus).toBe('error');
      expect(result.error?.type).toBe('version_mismatch');
      expect(result.error?.message).toContain('2026.1.1');
    });

    it('should handle unreachable gateway', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const result = await service.healthCheck();

      expect(result.reachable).toBe(false);
      expect(result.runtimeStatus).toBe('offline');
      expect(result.error?.type).toBe('unreachable');
    });

    it('should handle auth failure', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 401 }));

      const result = await service.healthCheck();

      expect(result.reachable).toBe(false);
      expect(result.runtimeStatus).toBe('error');
      expect(result.error?.type).toBe('auth_failed');
    });

    it('should handle failed liveness check', async () => {
      // HTTP failure (500) should result in unreachable
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));

      const result = await service.healthCheck();

      expect(result.reachable).toBe(false);
      expect(result.runtimeStatus).toBe('offline');
      expect(result.error?.type).toBe('agent_error');
    });
  });

  describe('file operations', () => {
    it('should read file from agent workspace', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify('file content here'), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const content = await service.readFile('SOUL.md', 'agent-123');

      expect(content).toBe('file content here');

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs?.[1]?.body as string);
      expect(body.tool).toBe('read');
      expect(body.args).toEqual({ path: 'SOUL.md' });
      expect(body.sessionKey).toBe('agent:agent-123:main');
    });

    it('should write file to agent workspace', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await service.writeFile('SOUL.md', 'new content', 'agent-123');

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs?.[1]?.body as string);
      expect(body.tool).toBe('write');
      expect(body.args).toEqual({
        path: 'SOUL.md',
        content: 'new content',
      });
      expect(body.sessionKey).toBe('agent:agent-123:main');
    });
  });
});
