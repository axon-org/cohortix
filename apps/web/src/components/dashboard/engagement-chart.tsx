'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LineChart, Line, XAxis, ResponsiveContainer } from 'recharts'
import { useEngagementChart } from '@/hooks/use-dashboard'
import { Skeleton } from '@/components/ui/skeleton'

const timeRanges = ['30D', '90D', '1Y'] as const
type TimeRange = (typeof timeRanges)[number]

const DAYS_MAP: Record<TimeRange, number> = {
  '30D': 30,
  '90D': 90,
  '1Y': 365,
}

export function EngagementChart() {
  const [activeRange, setActiveRange] = useState<TimeRange>('30D')
  const { data: rawData, isLoading, error } = useEngagementChart(DAYS_MAP[activeRange])

  // Format dates for display
  const data = (rawData || []).map((point) => {
    const date = new Date(point.date)
    let formattedDate: string

    if (activeRange === '30D') {
      formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (activeRange === '90D') {
      formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      formattedDate = date.toLocaleDateString('en-US', { month: 'short' })
    }

    return {
      date: formattedDate,
      value: point.value,
    }
  })

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Engagement Velocity</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Member activity and interaction levels over the last {activeRange.toLowerCase()}.
          </p>
        </div>

        {/* Time Range Selector - Monochrome */}
        <div className="flex gap-2 bg-secondary rounded-lg p-1">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                activeRange === range
                  ? 'bg-foreground text-background shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                  : 'text-muted-foreground hover:text-foreground hover:shadow-[0_0_5px_rgba(255,255,255,0.15)]'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart - Monochrome white line */}
      <div className="h-64">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton className="w-full h-48" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Failed to load chart data</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No engagement data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#F2F2F2"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
