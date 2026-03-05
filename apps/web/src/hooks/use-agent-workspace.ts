'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEngineFile, updateEngineFile, type EngineFileResponse } from '@/lib/api/client';

export function useAgentWorkspaceFile(cohortId: string, agentId: string, filePath: string) {
  return useQuery<EngineFileResponse>({
    queryKey: ['agent', agentId, 'workspace', filePath],
    queryFn: () => getEngineFile(cohortId, agentId, filePath),
    enabled: !!cohortId && !!agentId && !!filePath,
    retry: 1, // Don't retry too much if file is missing or engine offline
  });
}

export function useUpdateWorkspaceFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cohortId,
      agentId,
      filePath,
      content,
    }: {
      cohortId: string;
      agentId: string;
      filePath: string;
      content: string;
    }) => updateEngineFile(cohortId, agentId, filePath, content),
    onSuccess: (_, variables) => {
      // Invalidate the specific file query to refetch fresh content
      queryClient.invalidateQueries({
        queryKey: ['agent', variables.agentId, 'workspace', variables.filePath],
      });
    },
  });
}
