'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { CohortTimelineData } from '@/lib/api/client'

interface EngagementTimelineProps {
  data: CohortTimelineData[]
  days?: number
}

export function EngagementTimeline({ data, days = 30 }: EngagementTimelineProps) {
  const chartData = data.map((item) => ({
    date: item.date,
    displayDate: format(parseISO(item.date), 'MMM d'),
    interactions: item.interaction_count,
  }))

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Engagement Timeline</h2>
          <p className="text-sm text-muted-foreground">
            Daily interaction count of all batch members
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            7D
          </button>
          <button className="text-sm font-medium text-foreground">
            30D
          </button>
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            90D
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27282D"
            vertical={false}
          />
          <XAxis
            dataKey="displayDate"
            stroke="#6E7079"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6E7079"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#141416',
              border: '1px solid #27282D',
              borderRadius: '6px',
              padding: '8px 12px',
            }}
            labelStyle={{
              color: '#FAFAFA',
              fontSize: '12px',
              marginBottom: '4px',
            }}
            itemStyle={{
              color: '#FAFAFA',
              fontSize: '14px',
              fontWeight: 600,
            }}
            cursor={{ stroke: '#27282D', strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="interactions"
            stroke="#FAFAFA"
            strokeWidth={2}
            dot={{
              fill: '#FAFAFA',
              r: 3,
              strokeWidth: 0,
            }}
            activeDot={{
              r: 5,
              fill: '#FAFAFA',
              stroke: '#0A0A0B',
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
