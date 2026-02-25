'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyTasks, type MyTasksQueryParams, type MyTasksListResponse } from '@/lib/api/client';

export function useMyTasks(params?: MyTasksQueryParams) {
  return useQuery<MyTasksListResponse>({
    queryKey: ['my-tasks', params],
    queryFn: () => getMyTasks(params),
  });
}
