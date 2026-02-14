'use client';

import { useQuery } from '@tanstack/react-query';
import { getInsights, type Insight } from '@/lib/api/client';

export function useInsights() {
  return useQuery({
    queryKey: ['insights'],
    queryFn: getInsights,
  });
}
