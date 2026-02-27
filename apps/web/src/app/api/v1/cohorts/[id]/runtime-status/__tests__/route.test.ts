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
      organizationId: 'org-123',
      userId: 'user-123',
    });
    mockGetCohortById.mockResolvedValue({
      id: 'cohort-123',
      type: 'shared',
      ownerUserId: null,
      runtimeStatus: 'online',
      lastHeartbeatAt: new Date().toISOString(),
      hosting: 'managed',
    } as any);
    mockGetCohortUserMembers.mockResolvedValue([{ userId: 'user-123' }] as any);
  });

  it('returns runtime status', async () => {
    const request = new NextRequest(
      'https://example.com/api/v1/cohorts/cohort-123/runtime-status'
    );
    const response = await runtimeStatusHandler(request, {
      params: Promise.resolve({ id: 'cohort-123' }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.runtimeStatus).toBeDefined();
  });
});
