'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  type AgentQueryParams,
  type AgentListResponse,
  type CreateAgentInput,
  type Agent,
} from '@/lib/api/client';

export function useAgents(params?: AgentQueryParams) {
  return useQuery<AgentListResponse>({
    queryKey: ['agents', params],
    queryFn: () => getAgents(params),
  });
}

export function useAgent(id: string) {
  return useQuery<Agent>({
    queryKey: ['agents', id],
    queryFn: () => getAgent(id),
    enabled: !!id,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation<Agent, Error, CreateAgentInput>({
    mutationFn: createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation<Agent, Error, { id: string; data: Partial<CreateAgentInput> }>({
    mutationFn: ({ id, data }) => updateAgent(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agents', id] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}
