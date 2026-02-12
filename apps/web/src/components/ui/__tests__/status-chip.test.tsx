import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusChip } from '../status-chip'

describe('StatusChip', () => {
  it('renders active status with correct styling', () => {
    render(<StatusChip status="active" />)
    const chip = screen.getByText('Active')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveClass('bg-[#10B981]')
  })

  it('renders paused status with correct styling', () => {
    render(<StatusChip status="paused" />)
    const chip = screen.getByText('Paused')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveClass('bg-[#F59E0B]')
  })

  it('renders at-risk status with correct styling', () => {
    render(<StatusChip status="at-risk" />)
    const chip = screen.getByText('At-Risk')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveClass('bg-[#EF4444]')
  })

  it('renders completed status with correct styling', () => {
    render(<StatusChip status="completed" />)
    const chip = screen.getByText('Completed')
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveClass('bg-muted')
  })

  it('applies custom className', () => {
    render(<StatusChip status="active" className="custom-class" />)
    const chip = screen.getByText('Active')
    expect(chip).toHaveClass('custom-class')
  })
})
