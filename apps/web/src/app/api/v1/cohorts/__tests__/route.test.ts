import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getCohortsHandler, POST as postCohortsHandler } from '@/app/api/v1/cohorts/route';
import {
  GET as getCohortHandler,
  PATCH as patchCohortHandler,
  DELETE as deleteCohortHandler,
} from '@/app/api/v1/cohorts/[id]/route';
import { POST as provisionPersonalHandler } from '@/app/api/v1/cohorts/personal/provision/route';

vi.mock('@/lib/auth-helper', () => ({
  getAuthContext: vi.fn(),
  getAuthContextBasic: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  currentUser: vi.fn(),
}));

vi.mock('@/server/db/queries/cohorts', () => ({
  getCohorts: vi.fn(),
  getCohortById: vi.fn(),
  getCohortStats: vi.fn(),
  getCohortUserMembers: vi.fn(),
}));

vi.mock('@/lib/auth-access', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth-access')>();
  return {
    ...actual,
    ensureCohortMember: vi.fn(),
    ensureCohortAdmin: vi.fn(),
  };
});

vi.mock('@/server/db/mutations/cohorts', () => ({
  createCohort: vi.fn(),
  updateCohort: vi.fn(),
  deleteCohort: vi.fn(),
  provisionPersonalCohort: vi.fn(),
}));

import { getAuthContext, getAuthContextBasic } from '@/lib/auth-helper';
import { currentUser } from '@clerk/nextjs/server';
import { getCohorts, getCohortById, getCohortStats, getCohortUserMembers } from '@/server/db/queries/cohorts';
import { ensureCohortMember, ensureCohortAdmin } from '@/lib/auth-access';
import {
  createCohort,
  updateCohort,
  deleteCohort,
  provisionPersonalCohort,
} from '@/server/db/mutations/cohorts';

const mockGetAuthContext = vi.mocked(getAuthContext);
const mockGetAuthContextBasic = vi.mocked(getAuthContextBasic);
const mockCurrentUser = vi.mocked(currentUser);
const mockGetCohorts = vi.mocked(getCohorts);
const mockGetCohortById = vi.mocked(getCohortById);
const mockGetCohortStats = vi.mocked(getCohortStats);
const mockGetCohortUserMembers = vi.mocked(getCohortUserMembers);
const mockEnsureCohortMember = vi.mocked(ensureCohortMember);
const mockEnsureCohortAdmin = vi.mocked(ensureCohortAdmin);
const mockCreateCohort = vi.mocked(createCohort);
const mockUpdateCohort = vi.mocked(updateCohort);
const mockDeleteCohort = vi.mocked(deleteCohort);
const mockProvisionPersonal = vi.mocked(provisionPersonalCohort);

const baseAuth = {
  supabase: {} as any,
  organizationId: '00000000-0000-0000-0000-000000000001',
  userId: '00000000-0000-0000-0000-000000000004',
};

const sampleCohort = {
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Spring Cohort',
  status: 'active',
  type: 'shared',
};

describe('Cohorts API v1', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    mockGetAuthContext.mockResolvedValue(baseAuth);
    mockGetAuthContextBasic.mockResolvedValue({
      supabase: {} as any,
      userId: '00000000-0000-0000-0000-000000000004',
      clerkUserId: 'clerk-123',
    });
    mockCurrentUser.mockResolvedValue({ firstName: 'Alex' } as any);
    mockEnsureCohortMember.mockResolvedValue(sampleCohort as any);
    mockEnsureCohortAdmin.mockResolvedValue(sampleCohort as any);
  });

  it('lists cohorts', async () => {
    mockGetCohorts.mockResolvedValue({
      cohorts: [sampleCohort],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    } as any);

    const request = new NextRequest('https://example.com/api/v1/cohorts');
    const response = await getCohortsHandler(request);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data).toHaveLength(1);
    expect(mockGetCohorts).toHaveBeenCalled();
  });

  it('creates a shared cohort', async () => {
    mockCreateCohort.mockResolvedValue(sampleCohort as any);

    const request = new NextRequest('https://example.com/api/v1/cohorts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Spring Cohort' }),
    });

    const response = await postCohortsHandler(request);
    expect(response.status).toBe(201);
    expect(mockCreateCohort).toHaveBeenCalled();
  });

  it('gets cohort by id', async () => {
    mockGetCohortById.mockResolvedValue(sampleCohort as any);
    mockGetCohortStats.mockResolvedValue({ memberCount: 1 } as any);

    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-123');
    const response = await getCohortHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000002' }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.id).toBe('00000000-0000-0000-0000-000000000002');
  });

  it('updates cohort', async () => {
    mockUpdateCohort.mockResolvedValue({ ...sampleCohort, name: 'Updated' } as any);

    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-123', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    });
    const response = await patchCohortHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000002' }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.name).toBe('Updated');
  });

  it('archives cohort', async () => {
    mockDeleteCohort.mockResolvedValue({ ...sampleCohort, status: 'completed' } as any);

    const request = new NextRequest('https://example.com/api/v1/cohorts/cohort-123', {
      method: 'DELETE',
    });
    const response = await deleteCohortHandler(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000002' }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.cohort.status).toBe('completed');
  });

  it('provisions a personal cohort', async () => {
    mockProvisionPersonal.mockResolvedValue({ id: 'personal-1', name: "Alex's Cohort" } as any);

    const request = new NextRequest('https://example.com/api/v1/cohorts/personal/provision', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await provisionPersonalHandler(request);
    expect(response.status).toBe(201);
    expect(mockProvisionPersonal).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000004',
      'Alex'
    );
  });
});
