'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  getDashboardKPIs, 
  getEngagementChartData,
  type DashboardKPIs,
  type EngagementDataPoint 
} from '@/lib/api/client'

export function useDashboardKPIs() {
  return useQuery<DashboardKPIs>({
    queryKey: ['dashboard', 'kpis'],
    queryFn: getDashboardKPIs,
  })
}

export function useEngagementChart(days: number = 30) {
  return useQuery<EngagementDataPoint[]>({
    queryKey: ['dashboard', 'engagement-chart', days],
    queryFn: () => getEngagementChartData(days),
  })
}
