import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BatchMembers } from '../batch-members';
import type { CohortMember } from '@/lib/api/client';

const mockMembers: CohortMember[] = [
  {
    id: '1',
    cohort_id: 'cohort-1',
    agent_id: 'agent-1',
    agent_name: 'Alim',
    agent_slug: 'alim-ceo',
    agent_avatar_url: 'https://example.com/alim.png',
    agent_role: 'CEO',
    agent_status: 'active',
    engagement_score: 95,
    joined_at: '2026-01-01T00:00:00Z',
    last_active_at: '2026-02-10T12:00:00Z',
  },
  {
    id: '2',
    cohort_id: 'cohort-1',
    agent_id: 'agent-2',
    agent_name: 'Sami',
    agent_slug: 'sami-frontend',
    agent_role: 'Frontend Developer',
    agent_status: 'busy',
    engagement_score: 78,
    joined_at: '2026-01-05T00:00:00Z',
    last_active_at: '2026-02-10T10:00:00Z',
  },
  {
    id: '3',
    cohort_id: 'cohort-1',
    agent_id: 'agent-3',
    agent_name: 'Nina',
    agent_slug: 'nina-qa',
    agent_role: 'QA Engineer',
    agent_status: 'idle',
    engagement_score: 62,
    joined_at: '2026-01-10T00:00:00Z',
  },
  {
    id: '4',
    cohort_id: 'cohort-1',
    agent_id: 'agent-4',
    agent_name: 'Noah',
    agent_slug: 'noah-devops',
    agent_role: 'DevOps',
    agent_status: 'offline',
    engagement_score: 45,
    joined_at: '2026-01-15T00:00:00Z',
  },
  {
    id: '5',
    cohort_id: 'cohort-1',
    agent_id: 'agent-5',
    agent_name: 'ErrorBot',
    agent_slug: 'error-bot',
    agent_role: 'Testing',
    agent_status: 'error',
    engagement_score: 10,
    joined_at: '2026-01-20T00:00:00Z',
  },
];

const emptyMembers: CohortMember[] = [];

describe('BatchMembers', () => {
  it('renders header with member count', () => {
    render(<BatchMembers members={mockMembers} />);

    expect(screen.getByText('Batch Members (5)')).toBeInTheDocument();
  });

  it('renders filter button', () => {
    render(<BatchMembers members={mockMembers} />);

    expect(screen.getByText('Filter agents...')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<BatchMembers members={mockMembers} />);

    expect(screen.getByText('AI Agent')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Engagement Score')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders all member names', () => {
    render(<BatchMembers members={mockMembers} />);

    expect(screen.getByText('Alim')).toBeInTheDocument();
    expect(screen.getByText('Sami')).toBeInTheDocument();
    expect(screen.getByText('Nina')).toBeInTheDocument();
    expect(screen.getByText('Noah')).toBeInTheDocument();
    expect(screen.getByText('ErrorBot')).toBeInTheDocument();
  });

  it('renders member slugs', () => {
    render(<BatchMembers members={mockMembers} />);

    expect(screen.getByText('alim-ceo')).toBeInTheDocument();
    expect(screen.getByText('sami-frontend')).toBeInTheDocument();
    expect(screen.getByText('nina-qa')).toBeInTheDocument();
  });

  it('renders member roles', () => {
    render(<BatchMembers members={mockMembers} />);

    expect(screen.getByText('CEO')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('QA Engineer')).toBeInTheDocument();
    expect(screen.getByText('DevOps')).toBeInTheDocument();
  });

  it('renders correct status labels for each status type', () => {
    render(<BatchMembers members={mockMembers} />);

    expect(screen.getByText('Optimal')).toBeInTheDocument(); // active
    expect(screen.getByText('Syncing')).toBeInTheDocument(); // busy
    expect(screen.getAllByText('Idle').length).toBeGreaterThan(0); // idle
    expect(screen.getByText('Offline')).toBeInTheDocument(); // offline
    expect(screen.getByText('Error')).toBeInTheDocument(); // error
  });

  it('renders engagement scores', () => {
    render(<BatchMembers members={mockMembers} />);

    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('62')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders avatar image when avatar_url is provided', () => {
    render(<BatchMembers members={mockMembers} />);

    const avatarImg = screen.getByAltText('Alim');
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg).toHaveAttribute('src', 'https://example.com/alim.png');
  });

  it('renders initials fallback when no avatar_url', () => {
    render(<BatchMembers members={mockMembers} />);

    // Sami has no avatar_url, should show initials 'SA'
    expect(screen.getByText('SA')).toBeInTheDocument();
    // Nina should show 'NI'
    expect(screen.getByText('NI')).toBeInTheDocument();
  });

  it('renders actions button for each member', () => {
    render(<BatchMembers members={mockMembers} />);

    const actionButtons = screen.getAllByText('⋯');
    expect(actionButtons).toHaveLength(5);
  });

  it('renders empty table when no members', () => {
    render(<BatchMembers members={emptyMembers} />);

    expect(screen.getByText('Batch Members (0)')).toBeInTheDocument();
    // Table headers should still be visible
    expect(screen.getByText('AI Agent')).toBeInTheDocument();
  });

  it('shows footer when more than 8 members', () => {
    const manyMembers: CohortMember[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      cohort_id: 'cohort-1',
      agent_id: `agent-${i}`,
      agent_name: `Agent ${i}`,
      agent_slug: `agent-${i}`,
      agent_status: 'active' as const,
      engagement_score: 50,
      joined_at: '2026-01-01T00:00:00Z',
    }));

    render(<BatchMembers members={manyMembers} />);

    expect(screen.getByText('View Full Audit Trail')).toBeInTheDocument();
  });

  it('does not show footer when 8 or fewer members', () => {
    render(<BatchMembers members={mockMembers} />);

    expect(screen.queryByText('View Full Audit Trail')).not.toBeInTheDocument();
  });

  it('renders within a card container with proper styling', () => {
    const { container } = render(<BatchMembers members={mockMembers} />);

    const cardContainer = container.firstChild as HTMLElement;
    expect(cardContainer).toHaveClass('bg-card');
    expect(cardContainer).toHaveClass('border');
    expect(cardContainer).toHaveClass('rounded-lg');
  });

  it('renders engagement progress bar with correct width', () => {
    const { container } = render(<BatchMembers members={mockMembers} />);

    // Find progress bars by looking for the styled div with dynamic width
    const progressBars = container.querySelectorAll('[style*="width: 95%"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});
