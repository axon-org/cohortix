'use client'

import { useQuery } from '@tanstack/react-query'
import { getDashboardKPIs, type DashboardKPIs } from '@/lib/api/client'

export function useDashboardKPIs() {
  return useQuery<DashboardKPIs>({
    queryKey: ['dashboard', 'kpis'],
    queryFn: getDashboardKPIs,
  })
}
