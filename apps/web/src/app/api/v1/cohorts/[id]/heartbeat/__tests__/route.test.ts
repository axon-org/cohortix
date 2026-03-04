import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { POST as heartbeatHandler } from '@/app/api/v1/cohorts/[id]/heartbeat/route';

vi.mock('@/lib/auth-helper', () => ({
  getAuthContext: vi.fn(),
}));

vi.mock('@/server/db/queries/cohorts', () => ({
  getCohortById: vi.fn(),
  getCohortUserMembers: vi.fn(),
}));

vi.mock('@/server/db/mutations/cohorts', () => ({
  updateCohortRuntime: vi.fn(),
}));

import { getAuthContext } from '@/lib/auth-helper';
import { getCohortById, getCohortUserMembers } from '@/server/db/queries/cohorts';
import { updateCohortRuntime } from '@/server/db/mutations/cohorts';

const mockGetAuthContext = vi.mocked(getAuthContext);
const mockGetCohortById = vi.mocked(getCohortById);
const mockGetCohortUserMembers = vi.mocked(getCohortUserMembers);
const mockUpdateCohortRuntime = vi.mocked(updateCohortRuntime);

const base64url = (input: string | Buffer) =>
  Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const signJwt = (payload: Record<string, unknown>, secret: string) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest();
  return `${data}.${base64url(signature)}`;
};

describe('Cohort heartbeat API', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('COHORT_CONNECTION_TOKEN_SECRET', 'test-secret');
    mockGetAuthContext.mockResolvedValue({
      supabase: {} as any,
      organizationId: '00000000-0000-0000-0000-000000000001',
      userId: '00000000-0000-0000-0000-000000000004',
    });
    mockGetCohortById.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000002',
      type: 'shared',
      ownerUserId: null,
    } as any);
    mockGetCohortUserMembers.mockResolvedValue([
      { userId: '00000000-0000-0000-0000-000000000004' },
    ] as any);
    mockUpdateCohortRuntime.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000002',
      runtimeStatus: 'online',
    } as any);
  });

  it('records heartbeat with connection token', async () => {
    const token = signJwt(
      {
        cohortId: '00000000-0000-0000-0000-000000000002',
        type: 'cohort_connection',
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      'test-secret'
    );

    mockGetAuthContext.mockRejectedValue(new Error('Should not use user auth'));

    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-123/heartbeat', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const response = await heartbeatHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000002' }),
    });

    expect(response.status).toBe(200);
    expect(mockUpdateCohortRuntime).toHaveBeenCalled();
  });

  it('rejects invalid connection token', async () => {
    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-123/heartbeat', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        Authorization: 'Bearer invalid.token.value',
      },
    });

    const response = await heartbeatHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000002' }),
    });

    expect(response.status).toBe(401);
  });

  it('records heartbeat with user auth fallback', async () => {
    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-123/heartbeat', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await heartbeatHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000002' }),
    });

    expect(response.status).toBe(200);
    expect(mockUpdateCohortRuntime).toHaveBeenCalled();
  });
});
