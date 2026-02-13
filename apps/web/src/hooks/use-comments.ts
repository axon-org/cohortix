'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getComments,
  createComment,
  getActivity,
  type Comment,
  type Activity,
} from '@/lib/api/client'

export function useComments(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: () => getComments(entityType, entityId),
    enabled: !!entityId,
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.entityType, variables.entityId],
      })
    },
  })
}

export function useActivity(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['activity', entityType, entityId],
    queryFn: () => getActivity(entityType, entityId),
    enabled: !!entityId,
  })
}
