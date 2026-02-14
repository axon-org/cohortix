'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getCohortDetail,
  getCohortMembers,
  getCohortTimeline,
  getCohortActivity,
  type CohortDetail,
  type CohortMembersResponse,
  type CohortTimelineResponse,
  type CohortActivityResponse,
} from '@/lib/api/client';

export function useCohortDetail(id: string) {
  return useQuery<CohortDetail>({
    queryKey: ['cohort', id],
    queryFn: () => getCohortDetail(id),
    enabled: !!id,
  });
}

export function useCohortMembers(id: string) {
  return useQuery<CohortMembersResponse>({
    queryKey: ['cohort', id, 'members'],
    queryFn: () => getCohortMembers(id),
    enabled: !!id,
  });
}

export function useCohortTimeline(id: string, days: number = 30) {
  return useQuery<CohortTimelineResponse>({
    queryKey: ['cohort', id, 'timeline', days],
    queryFn: () => getCohortTimeline(id, days),
    enabled: !!id,
  });
}

export function useCohortActivity(id: string, limit: number = 20) {
  return useQuery<CohortActivityResponse>({
    queryKey: ['cohort', id, 'activity', limit],
    queryFn: () => getCohortActivity(id, limit),
    enabled: !!id,
  });
}
