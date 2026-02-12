'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { LineChart, Line, XAxis, ResponsiveContainer } from 'recharts'

const timeRanges = ['30D', '90D', '1Y'] as const
type TimeRange = (typeof timeRanges)[number]

// Mock data for the chart
const chartData: Record<TimeRange, { date: string; value: number }[]> = {
  '30D': [
    { date: 'OCT 01', value: 20 },
    { date: 'OCT 07', value: 35 },
    { date: 'OCT 14', value: 50 },
    { date: 'OCT 21', value: 65 },
    { date: 'OCT 28', value: 80 },
    { date: 'NOV 01', value: 75 },
  ],
  '90D': [
    { date: 'AUG 01', value: 15 },
    { date: 'AUG 15', value: 25 },
    { date: 'SEP 01', value: 35 },
    { date: 'SEP 15', value: 45 },
    { date: 'OCT 01', value: 55 },
    { date: 'OCT 15', value: 70 },
    { date: 'NOV 01', value: 75 },
  ],
  '1Y': [
    { date: 'JAN', value: 10 },
    { date: 'MAR', value: 20 },
    { date: 'MAY', value: 30 },
    { date: 'JUL', value: 45 },
    { date: 'SEP', value: 60 },
    { date: 'NOV', value: 75 },
  ],
}

export function EngagementChart() {
  const [activeRange, setActiveRange] = useState<TimeRange>('30D')
  const data = chartData[activeRange]

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
      </div>
    </div>
  )
}
