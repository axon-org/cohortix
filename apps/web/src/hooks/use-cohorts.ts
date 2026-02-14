'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCohorts,
  getCohort,
  createCohort,
  updateCohort,
  deleteCohort,
  getCohortMembers,
  getCohortTimeline,
  getCohortActivity,
  type CohortQueryParams,
  type CohortListResponse,
  type CreateCohortInput,
  type Cohort,
  type CohortMembersResponse,
  type CohortTimelineResponse,
  type CohortActivityResponse,
} from '@/lib/api/client';

export function useCohorts(params?: CohortQueryParams) {
  return useQuery<CohortListResponse>({
    queryKey: ['cohorts', params],
    queryFn: () => getCohorts(params),
  });
}

export function useCohort(id: string) {
  return useQuery<Cohort>({
    queryKey: ['cohorts', id],
    queryFn: () => getCohort(id),
    enabled: !!id,
  });
}

export function useCreateCohort() {
  const queryClient = useQueryClient();
  return useMutation<Cohort, Error, CreateCohortInput>({
    mutationFn: createCohort,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
    },
  });
}

export function useUpdateCohort() {
  const queryClient = useQueryClient();
  return useMutation<Cohort, Error, { id: string; data: Partial<CreateCohortInput> }>({
    mutationFn: ({ id, data }) => updateCohort(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['cohorts', id] });
    },
  });
}

export function useDeleteCohort() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteCohort,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
    },
  });
}

export function useCohortMembers(id: string) {
  return useQuery<CohortMembersResponse>({
    queryKey: ['cohorts', id, 'members'],
    queryFn: () => getCohortMembers(id),
    enabled: !!id,
  });
}

export function useCohortTimeline(id: string, days: number = 30) {
  return useQuery<CohortTimelineResponse>({
    queryKey: ['cohorts', id, 'timeline', days],
    queryFn: () => getCohortTimeline(id, days),
    enabled: !!id,
  });
}

export function useCohortActivity(id: string, limit: number = 20) {
  return useQuery<CohortActivityResponse>({
    queryKey: ['cohorts', id, 'activity', limit],
    queryFn: () => getCohortActivity(id, limit),
    enabled: !!id,
  });
}
