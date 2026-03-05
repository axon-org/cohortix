import { useQuery } from '@tanstack/react-query';

export type EngineStatus = 'online' | 'offline' | 'error' | 'provisioning';

export interface EngineHealthResponse {
  status: EngineStatus;
  latencyMs: number;
  gatewayVersion: string;
  lastHeartbeat: string;
  consecutiveFailures: number;
  error?: {
    type: string;
    message: string;
  };
}

export function useEngineHealth(cohortId: string) {
  return useQuery({
    queryKey: ['engine-health', cohortId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/engine/health?cohortId=${cohortId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch engine health');
      }
      return res.json() as Promise<EngineHealthResponse>;
    },
    refetchInterval: 60_000, // 60s when window focused
    refetchIntervalInBackground: false, // Stop when tab not visible
    staleTime: 30_000,
    enabled: !!cohortId,
  });
}
