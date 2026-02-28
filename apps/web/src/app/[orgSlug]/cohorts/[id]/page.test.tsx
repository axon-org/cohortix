/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Suspense } from 'react';
import CohortDetailPage from './page';

const mockUseCohort = vi.fn();
const mockUseCohortMembers = vi.fn();
const mockUseCohortTimeline = vi.fn();
const mockUseCohortActivity = vi.fn();
const mockUpdateCohort = vi.fn();
const mockDeleteCohort = vi.fn();

vi.mock('@/hooks/use-cohorts', () => ({
  useCohort: (id: string) => mockUseCohort(id),
  useCohortMembers: (id: string) => mockUseCohortMembers(id),
  useCohortTimeline: (id: string, days: number) => mockUseCohortTimeline(id, days),
  useCohortActivity: (id: string, limit: number) => mockUseCohortActivity(id, limit),
  useUpdateCohort: () => ({ mutateAsync: mockUpdateCohort, isPending: false }),
  useDeleteCohort: () => ({ mutateAsync: mockDeleteCohort, isPending: false }),
}));

const cohortFixture = {
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Growth Cohort',
  status: 'active',
  runtimeStatus: 'online',
  type: 'shared',
  memberCount: 12,
  engagementPercent: 82,
  agentCount: 4,
  activeTasks: 9,
  description: 'Test cohort description',
  hosting: 'self_hosted',
  gatewayUrl: 'https://gateway.example.com',
  startDate: '2026-01-01',
  endDate: '2026-02-01',
};

describe('CohortDetailPage', () => {
  beforeEach(() => {
    mockUseCohort.mockReset();
    mockUseCohortMembers.mockReset();
    mockUseCohortTimeline.mockReset();
    mockUseCohortActivity.mockReset();
    mockUpdateCohort.mockReset();
    mockDeleteCohort.mockReset();

    mockUseCohort.mockReturnValue({ data: cohortFixture, isLoading: false, error: null });
    mockUseCohortMembers.mockReturnValue({
      data: {
        members: [
          {
            id: '00000000-0000-0000-0000-000000000005',
            cohort_id: '00000000-0000-0000-0000-000000000002',
            agent_id: '00000000-0000-0000-0000-000000000010',
            agent_name: 'Atlas',
            agent_slug: '@atlas',
            agent_status: 'active',
            engagement_score: 85,
          },
        ],
      },
    });
    mockUseCohortTimeline.mockReturnValue({ data: { timeline: [] } });
    mockUseCohortActivity.mockReturnValue({ data: { activities: [] } });
  });

  it('renders cohort dashboard details', async () => {
    render(
      <Suspense fallback={null}>
        <CohortDetailPage
          params={Promise.resolve({
            orgSlug: 'test-org',
            id: '00000000-0000-0000-0000-000000000002',
          })}
        />
      </Suspense>
    );

    expect(await screen.findByText('Growth Cohort')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('online')).toBeInTheDocument();
    expect(screen.getByText('shared')).toBeInTheDocument();
    expect(screen.getByText('12 members · 82% engagement')).toBeInTheDocument();
    expect(screen.getByText('Test cohort description')).toBeInTheDocument();
  });

  it('allows editing and saving updates', async () => {
    render(
      <Suspense fallback={null}>
        <CohortDetailPage
          params={Promise.resolve({
            orgSlug: 'test-org',
            id: '00000000-0000-0000-0000-000000000002',
          })}
        />
      </Suspense>
    );

    fireEvent.click(await screen.findByRole('button', { name: /Edit/ }));

    const nameInput = screen.getByDisplayValue('Growth Cohort');
    fireEvent.change(nameInput, { target: { value: 'Updated Cohort' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockUpdateCohort).toHaveBeenCalledWith({
      id: '00000000-0000-0000-0000-000000000002',
      data: expect.objectContaining({
        name: 'Updated Cohort',
      }),
    });
  });
});
