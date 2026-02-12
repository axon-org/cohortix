'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllies,
  getAlly,
  createAlly,
  updateAlly,
  deleteAlly,
  type AllyQueryParams,
  type AllyListResponse,
  type CreateAllyInput,
  type Ally,
} from '@/lib/api/client'

export function useAllies(params?: AllyQueryParams) {
  return useQuery<AllyListResponse>({
    queryKey: ['allies', params],
    queryFn: () => getAllies(params),
  })
}

export function useAlly(id: string) {
  return useQuery<Ally>({
    queryKey: ['allies', id],
    queryFn: () => getAlly(id),
    enabled: !!id,
  })
}

export function useCreateAlly() {
  const queryClient = useQueryClient()
  return useMutation<Ally, Error, CreateAllyInput>({
    mutationFn: createAlly,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allies'] }) },
  })
}

export function useUpdateAlly() {
  const queryClient = useQueryClient()
  return useMutation<Ally, Error, { id: string; data: Partial<CreateAllyInput> }>({
    mutationFn: ({ id, data }) => updateAlly(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['allies'] })
      queryClient.invalidateQueries({ queryKey: ['allies', id] })
    },
  })
}

export function useDeleteAlly() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: deleteAlly,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allies'] }) },
  })
}
