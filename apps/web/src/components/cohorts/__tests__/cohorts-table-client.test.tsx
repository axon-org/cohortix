/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CohortsTableClient } from '../cohorts-table-client';

const mockUseCohorts = vi.fn();

vi.mock('@/hooks/use-cohorts', () => ({
  useCohorts: () => mockUseCohorts(),
}));

const cohortsFixture = [
  {
    id: '1',
    name: 'Personal Cohort',
    type: 'personal',
    runtimeStatus: 'online',
    memberCount: 3,
    engagementPercent: '78',
    startDate: '2026-01-01',
    createdAt: '2026-01-01',
  },
  {
    id: '2',
    name: 'Shared Cohort',
    type: 'shared',
    runtimeStatus: 'offline',
    memberCount: 5,
    engagementPercent: '64',
    startDate: '2026-02-01',
    createdAt: '2026-02-01',
  },
];

describe('CohortsTableClient', () => {
  beforeEach(() => {
    mockUseCohorts.mockReset();
    mockUseCohorts.mockReturnValue({
      data: { data: cohortsFixture },
      isLoading: false,
      error: null,
    });
  });

  it('renders cohorts and filters by type', async () => {
    render(<CohortsTableClient />);

    expect(screen.getByText('Personal Cohort')).toBeInTheDocument();
    expect(screen.getByText('Shared Cohort')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'personal' }));

    expect(screen.getByText('Personal Cohort')).toBeInTheDocument();
    expect(screen.queryByText('Shared Cohort')).not.toBeInTheDocument();
  });

  it('filters cohorts by search input', async () => {
    render(<CohortsTableClient />);

    fireEvent.change(screen.getByPlaceholderText('Search cohorts...'), {
      target: { value: 'Shared' },
    });

    expect(screen.getByText('Shared Cohort')).toBeInTheDocument();
    expect(screen.queryByText('Personal Cohort')).not.toBeInTheDocument();
  });
});
