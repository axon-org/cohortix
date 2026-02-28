'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAgentDetail,
  getAgentEvolution,
  getAgentStats,
  type AgentDetail,
  type AgentEvolutionResponse,
  type AgentStatsResponse,
} from '@/lib/api/client';

export function useAgentDetail(id: string) {
  return useQuery<AgentDetail>({
    queryKey: ['agent', id],
    queryFn: () => getAgentDetail(id),
    enabled: !!id,
  });
}

export function useAgentEvolution(id: string, limit: number = 20) {
  return useQuery<AgentEvolutionResponse>({
    queryKey: ['agent', id, 'evolution', limit],
    queryFn: () => getAgentEvolution(id, limit),
    enabled: !!id,
  });
}

export function useAgentStats(id: string) {
  return useQuery<AgentStatsResponse>({
    queryKey: ['agent', id, 'stats'],
    queryFn: () => getAgentStats(id),
    enabled: !!id,
  });
}
