/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EngagementTimeline } from '../engagement-timeline';
import type { CohortTimelineData } from '@/lib/api/client';

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

const mockTimelineData: CohortTimelineData[] = [
  { date: '2026-01-01', interaction_count: 150 },
  { date: '2026-01-02', interaction_count: 200 },
  { date: '2026-01-03', interaction_count: 175 },
  { date: '2026-01-04', interaction_count: 225 },
  { date: '2026-01-05', interaction_count: 180 },
];

const emptyTimelineData: CohortTimelineData[] = [];

describe('EngagementTimeline', () => {
  it('renders with title and description', () => {
    render(<EngagementTimeline data={mockTimelineData} />);

    expect(screen.getByText('Engagement Timeline')).toBeInTheDocument();
    expect(screen.getByText('Daily interaction count of all batch members')).toBeInTheDocument();
  });

  it('renders time period buttons', () => {
    render(<EngagementTimeline data={mockTimelineData} />);

    expect(screen.getByText('7D')).toBeInTheDocument();
    expect(screen.getByText('30D')).toBeInTheDocument();
    expect(screen.getByText('90D')).toBeInTheDocument();
  });

  it('renders chart components', () => {
    render(<EngagementTimeline data={mockTimelineData} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(<EngagementTimeline data={emptyTimelineData} />);

    // Should still render the component structure
    expect(screen.getByText('Engagement Timeline')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('accepts custom days prop', () => {
    render(<EngagementTimeline data={mockTimelineData} days={7} />);

    // Component should render without errors with custom days
    expect(screen.getByText('Engagement Timeline')).toBeInTheDocument();
  });

  it('uses default days of 30 when not provided', () => {
    render(<EngagementTimeline data={mockTimelineData} />);

    // 30D button should be highlighted (has font-medium class, others have text-muted-foreground)
    const button30D = screen.getByText('30D');
    expect(button30D).toHaveClass('font-medium');
  });

  it('renders all chart elements for data visualization', () => {
    render(<EngagementTimeline data={mockTimelineData} />);

    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('renders within a card container with proper styling', () => {
    const { container } = render(<EngagementTimeline data={mockTimelineData} />);

    const cardContainer = container.firstChild as HTMLElement;
    expect(cardContainer).toHaveClass('bg-card');
    expect(cardContainer).toHaveClass('border');
    expect(cardContainer).toHaveClass('rounded-lg');
  });
});
