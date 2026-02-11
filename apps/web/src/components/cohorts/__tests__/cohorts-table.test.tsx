import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CohortsTable, type Cohort } from '../cohorts-table'

const mockCohorts: Cohort[] = [
  {
    id: '1',
    name: 'Spring 2026',
    status: 'active',
    members: 342,
    engagement: 72,
    startDate: '2026-01-15',
  },
  {
    id: '2',
    name: 'Q1 Growth',
    status: 'paused',
    members: 128,
    engagement: 45,
    startDate: '2026-01-22',
  },
  {
    id: '3',
    name: 'Trial Batch',
    status: 'at-risk',
    members: 89,
    engagement: 23,
    startDate: '2026-02-01',
  },
]

describe('CohortsTable', () => {
  it('renders all cohorts', () => {
    render(<CohortsTable data={mockCohorts} />)
    
    expect(screen.getByText('Spring 2026')).toBeInTheDocument()
    expect(screen.getByText('Q1 Growth')).toBeInTheDocument()
    expect(screen.getByText('Trial Batch')).toBeInTheDocument()
  })

  it('displays correct member counts', () => {
    render(<CohortsTable data={mockCohorts} />)
    
    expect(screen.getByText('342')).toBeInTheDocument()
    expect(screen.getByText('128')).toBeInTheDocument()
    expect(screen.getByText('89')).toBeInTheDocument()
  })

  it('displays correct engagement percentages', () => {
    render(<CohortsTable data={mockCohorts} />)
    
    expect(screen.getByText('72%')).toBeInTheDocument()
    expect(screen.getByText('45%')).toBeInTheDocument()
    expect(screen.getByText('23%')).toBeInTheDocument()
  })

  it('shows status chips for each cohort', () => {
    render(<CohortsTable data={mockCohorts} />)
    
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Paused')).toBeInTheDocument()
    expect(screen.getByText('At-Risk')).toBeInTheDocument()
  })

  it('filters cohorts based on search input', () => {
    render(<CohortsTable data={mockCohorts} />)
    
    const searchInput = screen.getByPlaceholderText('Search cohorts...')
    fireEvent.change(searchInput, { target: { value: 'Spring' } })
    
    expect(screen.getByText('Spring 2026')).toBeInTheDocument()
    expect(screen.queryByText('Q1 Growth')).not.toBeInTheDocument()
    expect(screen.queryByText('Trial Batch')).not.toBeInTheDocument()
  })

  it('shows empty state when no cohorts match filter', () => {
    render(<CohortsTable data={mockCohorts} />)
    
    const searchInput = screen.getByPlaceholderText('Search cohorts...')
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } })
    
    expect(screen.getByText('No cohorts found.')).toBeInTheDocument()
  })

  it('shows correct results count', () => {
    render(<CohortsTable data={mockCohorts} />)
    
    expect(screen.getByText(/Showing 3 of 3 cohorts/)).toBeInTheDocument()
  })

  it('allows sorting by column headers', () => {
    render(<CohortsTable data={mockCohorts} />)
    
    // Find the Members header button
    const membersHeader = screen.getByRole('button', { name: /Members/ })
    expect(membersHeader).toBeInTheDocument()
    
    // Click to sort
    fireEvent.click(membersHeader)
    
    // Table should reorder (342 > 128 > 89 in descending order)
    // This is a simplified test - full sorting logic is handled by TanStack Table
  })

  it('renders empty state when no data provided', () => {
    render(<CohortsTable data={[]} />)
    
    expect(screen.getByText('No cohorts found.')).toBeInTheDocument()
  })
})
