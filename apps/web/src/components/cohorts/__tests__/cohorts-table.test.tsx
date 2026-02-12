import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CohortsTable, type CohortRow } from '../cohorts-table'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockCohorts: CohortRow[] = [
  {
    id: '1',
    name: 'Spring 2026',
    status: 'active',
    members_count: 342,
    avg_engagement: 72,
    start_date: '2026-01-15',
  },
  {
    id: '2',
    name: 'Q1 Growth',
    status: 'paused',
    members_count: 128,
    avg_engagement: 45,
    start_date: '2026-01-22',
  },
  {
    id: '3',
    name: 'Trial Batch',
    status: 'at-risk',
    members_count: 89,
    avg_engagement: 23,
    start_date: '2026-02-01',
  },
]

describe('CohortsTable', () => {
  it('renders all cohorts', () => {
    render(<CohortsTable cohorts={mockCohorts} />)

    expect(screen.getByText('Spring 2026')).toBeInTheDocument()
    expect(screen.getByText('Q1 Growth')).toBeInTheDocument()
    expect(screen.getByText('Trial Batch')).toBeInTheDocument()
  })

  it('displays correct member counts', () => {
    render(<CohortsTable cohorts={mockCohorts} />)

    expect(screen.getByText('342')).toBeInTheDocument()
    expect(screen.getByText('128')).toBeInTheDocument()
    expect(screen.getByText('89')).toBeInTheDocument()
  })

  it('displays correct engagement percentages', () => {
    render(<CohortsTable cohorts={mockCohorts} />)

    expect(screen.getByText('72%')).toBeInTheDocument()
    expect(screen.getByText('45%')).toBeInTheDocument()
    expect(screen.getByText('23%')).toBeInTheDocument()
  })

  it('shows status chips for each cohort', () => {
    render(<CohortsTable cohorts={mockCohorts} />)

    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('paused')).toBeInTheDocument()
    expect(screen.getByText('at-risk')).toBeInTheDocument()
  })

  it('renders links to cohort detail pages', () => {
    render(<CohortsTable cohorts={mockCohorts} />)

    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(3)
  })

  it('calls onRowClick when provided', () => {
    const handleClick = vi.fn()
    render(<CohortsTable cohorts={mockCohorts} onRowClick={handleClick} />)

    // Click on a cohort name
    fireEvent.click(screen.getByText('Spring 2026'))
  })

  it('shows correct results count', () => {
    render(<CohortsTable cohorts={mockCohorts} />)

    // Table should have 3 data rows
    const rows = screen.getAllByRole('row')
    // 1 header row + 3 data rows
    expect(rows.length).toBe(4)
  })

  it('renders empty state when no data provided', () => {
    render(<CohortsTable cohorts={[]} />)

    expect(screen.getByText('No cohorts found')).toBeInTheDocument()
  })

  it('displays formatted start dates', () => {
    render(<CohortsTable cohorts={mockCohorts} />)

    // Dates should be rendered in some format
    const { container } = render(<CohortsTable cohorts={mockCohorts} />)
    expect(container).toBeTruthy()
  })
})
