'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMissions,
  getMission,
  createMission,
  updateMission,
  deleteMission,
  type MissionQueryParams,
  type MissionListResponse,
  type CreateMissionInput,
  type Mission,
} from '@/lib/api/client'

export function useMissions(params?: MissionQueryParams) {
  return useQuery<MissionListResponse>({
    queryKey: ['missions', params],
    queryFn: () => getMissions(params),
  })
}

export function useMission(id: string) {
  return useQuery<Mission>({
    queryKey: ['missions', id],
    queryFn: () => getMission(id),
    enabled: !!id,
  })
}

export function useCreateMission() {
  const queryClient = useQueryClient()
  return useMutation<Mission, Error, CreateMissionInput>({
    mutationFn: createMission,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['missions'] }) },
  })
}

export function useUpdateMission() {
  const queryClient = useQueryClient()
  return useMutation<Mission, Error, { id: string; data: Partial<CreateMissionInput> }>({
    mutationFn: ({ id, data }) => updateMission(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['missions'] })
      queryClient.invalidateQueries({ queryKey: ['missions', id] })
    },
  })
}

export function useDeleteMission() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: deleteMission,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['missions'] }) },
  })
}
