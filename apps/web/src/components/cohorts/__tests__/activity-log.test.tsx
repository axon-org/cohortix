import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityLog } from '../activity-log'
import type { CohortActivity } from '@/lib/api/client'

// Mock date-fns to have consistent time formatting in tests
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns')
  return {
    ...actual,
    formatDistanceToNow: vi.fn(() => '2 hours ago'),
  }
})

const mockActivities: CohortActivity[] = [
  {
    id: '1',
    entity_id: 'agent-1',
    action: 'joined_cohort',
    description: 'Alim joined the cohort',
    created_at: '2026-02-10T10:00:00Z',
    metadata: {},
  },
  {
    id: '2',
    entity_id: 'agent-2',
    action: 'engagement_spike',
    description: 'Sami had a 50% engagement increase',
    created_at: '2026-02-10T09:00:00Z',
    metadata: { previous: 50, current: 75 },
  },
  {
    id: '3',
    entity_id: 'agent-3',
    action: 'engagement_drop',
    description: 'Nina engagement dropped below threshold',
    created_at: '2026-02-10T08:00:00Z',
    metadata: { threshold: 40 },
  },
  {
    id: '4',
    entity_id: 'agent-4',
    action: 'left_cohort',
    description: 'TestBot left the cohort',
    created_at: '2026-02-10T07:00:00Z',
    metadata: {},
  },
  {
    id: '5',
    entity_id: 'agent-5',
    action: 'status_change',
    description: 'Noah status changed from idle to active',
    created_at: '2026-02-10T06:00:00Z',
    metadata: { from: 'idle', to: 'active' },
  },
  {
    id: '6',
    entity_id: 'agent-6',
    action: 'unknown_action',
    description: 'Some unknown activity occurred',
    created_at: '2026-02-10T05:00:00Z',
    metadata: {},
  },
]

const emptyActivities: CohortActivity[] = []

describe('ActivityLog', () => {
  it('renders header with title', () => {
    render(<ActivityLog activities={mockActivities} />)
    
    expect(screen.getByText('Activity Log')).toBeInTheDocument()
  })

  it('renders View All button', () => {
    render(<ActivityLog activities={mockActivities} />)
    
    expect(screen.getByText('View All')).toBeInTheDocument()
  })

  it('renders all activity descriptions', () => {
    render(<ActivityLog activities={mockActivities} />)
    
    expect(screen.getByText('Alim joined the cohort')).toBeInTheDocument()
    expect(screen.getByText('Sami had a 50% engagement increase')).toBeInTheDocument()
    expect(screen.getByText('Nina engagement dropped below threshold')).toBeInTheDocument()
    expect(screen.getByText('TestBot left the cohort')).toBeInTheDocument()
    expect(screen.getByText('Noah status changed from idle to active')).toBeInTheDocument()
    expect(screen.getByText('Some unknown activity occurred')).toBeInTheDocument()
  })

  it('renders timestamp for each activity', () => {
    render(<ActivityLog activities={mockActivities} />)
    
    // All activities should show "2 hours ago" (mocked)
    const timestamps = screen.getAllByText('2 hours ago')
    expect(timestamps).toHaveLength(6)
  })

  it('renders empty state when no activities', () => {
    render(<ActivityLog activities={emptyActivities} />)
    
    expect(screen.getByText('No activity yet')).toBeInTheDocument()
  })

  it('renders activity icons', () => {
    const { container } = render(<ActivityLog activities={mockActivities} />)
    
    // Icons are rendered as '●' characters
    const icons = container.querySelectorAll('.text-lg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('applies correct color for joined_cohort action', () => {
    const { container } = render(
      <ActivityLog activities={[mockActivities[0]]} />
    )
    
    const icon = container.querySelector('.text-success')
    expect(icon).toBeInTheDocument()
  })

  it('applies correct color for engagement_spike action', () => {
    const { container } = render(
      <ActivityLog activities={[mockActivities[1]]} />
    )
    
    const icon = container.querySelector('.text-success')
    expect(icon).toBeInTheDocument()
  })

  it('applies correct color for engagement_drop action', () => {
    const { container } = render(
      <ActivityLog activities={[mockActivities[2]]} />
    )
    
    const icon = container.querySelector('.text-warning')
    expect(icon).toBeInTheDocument()
  })

  it('applies correct color for left_cohort action', () => {
    const { container } = render(
      <ActivityLog activities={[mockActivities[3]]} />
    )
    
    const icon = container.querySelector('.text-muted-foreground')
    expect(icon).toBeInTheDocument()
  })

  it('applies default color for unknown actions', () => {
    const { container } = render(
      <ActivityLog activities={[mockActivities[5]]} />
    )
    
    // Unknown actions should use default muted foreground
    const icon = container.querySelector('.text-muted-foreground')
    expect(icon).toBeInTheDocument()
  })

  it('renders within a card container with proper styling', () => {
    const { container } = render(<ActivityLog activities={mockActivities} />)
    
    const cardContainer = container.firstChild as HTMLElement
    expect(cardContainer).toHaveClass('bg-card')
    expect(cardContainer).toHaveClass('border')
    expect(cardContainer).toHaveClass('rounded-lg')
  })

  it('has scrollable activity list with max height', () => {
    const { container } = render(<ActivityLog activities={mockActivities} />)
    
    const scrollableDiv = container.querySelector('.max-h-\\[600px\\]')
    expect(scrollableDiv).toBeInTheDocument()
    expect(scrollableDiv).toHaveClass('overflow-y-auto')
  })

  it('renders activities in the order provided', () => {
    render(<ActivityLog activities={mockActivities} />)
    
    const descriptions = screen.getAllByText(/joined|engagement|left|status|unknown/i)
    
    // First activity should be "Alim joined the cohort"
    expect(descriptions[0]).toHaveTextContent('Alim joined the cohort')
  })

  it('handles single activity correctly', () => {
    render(<ActivityLog activities={[mockActivities[0]]} />)
    
    expect(screen.getByText('Alim joined the cohort')).toBeInTheDocument()
    expect(screen.queryByText('No activity yet')).not.toBeInTheDocument()
  })
})
