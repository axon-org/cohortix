import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as runtimeStatusHandler } from '@/app/api/v1/cohorts/[id]/runtime-status/route';

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

const mockGetAuthContext = vi.mocked(getAuthContext);
const mockGetCohortById = vi.mocked(getCohortById);
const mockGetCohortUserMembers = vi.mocked(getCohortUserMembers);

describe('Cohort runtime status API', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    mockGetAuthContext.mockResolvedValue({
      supabase: {} as any,
      organizationId: '00000000-0000-0000-0000-000000000001',
      userId: '00000000-0000-0000-0000-000000000004',
    });
    mockGetCohortById.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000002',
      type: 'shared',
      ownerUserId: null,
      runtimeStatus: 'online',
      lastHeartbeatAt: new Date().toISOString(),
      hosting: 'managed',
    } as any);
    mockGetCohortUserMembers.mockResolvedValue([
      { userId: '00000000-0000-0000-0000-000000000004' },
    ] as any);
  });

  it('returns runtime status', async () => {
    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-123/runtime-status');
    const response = await runtimeStatusHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000002' }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.runtimeStatus).toBeDefined();
  });
});
