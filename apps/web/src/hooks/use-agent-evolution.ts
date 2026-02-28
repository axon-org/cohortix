'use client';

import { useQuery } from '@tanstack/react-query';

export function useAgentEvolution(agentId: string, orgSlug: string) {
  return useQuery({
    queryKey: ['agent-evolution', agentId, orgSlug],
    queryFn: async () => {
      const res = await fetch(`/api/v1/agents/${agentId}/evolution?orgSlug=${orgSlug}`);
      if (!res.ok) throw new Error('Failed to load evolution data');
      return res.json();
    },
    enabled: !!agentId,
  });
}
