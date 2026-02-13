'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOperations,
  getOperation,
  createOperation,
  updateOperation,
  deleteOperation,
  type OperationQueryParams,
  type OperationListResponse,
  type CreateOperationInput,
  type Operation,
} from '@/lib/api/client'

export function useOperations(params?: OperationQueryParams) {
  return useQuery<OperationListResponse>({
    queryKey: ['operations', params],
    queryFn: () => getOperations(params),
  })
}

export function useOperation(id: string) {
  return useQuery<Operation>({
    queryKey: ['operations', id],
    queryFn: () => getOperation(id),
    enabled: !!id,
  })
}

export function useCreateOperation() {
  const queryClient = useQueryClient()
  return useMutation<Operation, Error, CreateOperationInput>({
    mutationFn: createOperation,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['operations'] }) },
  })
}

export function useUpdateOperation() {
  const queryClient = useQueryClient()
  return useMutation<Operation, Error, { id: string; data: Partial<CreateOperationInput> }>({
    mutationFn: ({ id, data }) => updateOperation(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
      queryClient.invalidateQueries({ queryKey: ['operations', id] })
    },
  })
}

export function useDeleteOperation() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: deleteOperation,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['operations'] }) },
  })
}
