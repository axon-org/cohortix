'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCohorts,
  createCohort,
  type CohortQueryParams,
  type CohortListResponse,
  type CreateCohortInput,
  type Cohort,
} from '@/lib/api/client'

export function useCohorts(params?: CohortQueryParams) {
  return useQuery<CohortListResponse>({
    queryKey: ['cohorts', params],
    queryFn: () => getCohorts(params),
  })
}

export function useCreateCohort() {
  const queryClient = useQueryClient()
  
  return useMutation<Cohort, Error, CreateCohortInput>({
    mutationFn: createCohort,
    onSuccess: () => {
      // Invalidate cohorts list to refetch
      queryClient.invalidateQueries({ queryKey: ['cohorts'] })
    },
  })
}
