'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useKnowledgeSearch({
  query,
  filters,
  orgSlug,
}: {
  query: string;
  filters: any;
  orgSlug: string;
}) {
  const queryClient = useQueryClient();

  const searchFn = async () => {
    const params = new URLSearchParams({
      q: query,
      orgSlug,
      layers: filters.layers.join(','),
      date: filters.date,
      entity: filters.entity,
    });
    const res = await fetch(`/api/v1/knowledge/search?${params.toString()}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['knowledge-search', query, filters, orgSlug],
    queryFn: searchFn,
    enabled: false, // Only manual search
  });

  return {
    results: data?.results || [],
    isLoading,
    error: error as Error | null,
    mutate: refetch,
  };
}
