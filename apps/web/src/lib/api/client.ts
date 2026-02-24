/**
 * API Client for Cohortix
 * Centralized API calls with error handling and type safety
 */

const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message || `API Error: ${response.statusText}`,
        response.status,
        error
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

// ============================================================================
// Dashboard API
// ============================================================================

export interface DashboardKPIs {
  kpis: {
    activeCohortsCount: number;
    totalAgents: number;
    avgEngagement: number;
    atRiskCount: number;
  };
  trends: {
    activeCohortsChange: number;
    totalAgentsChange: number;
    avgEngagementChange: number;
    atRiskChange: number;
  };
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const response = await fetchApi<{ data: DashboardKPIs }>('/dashboard/mission-control');
  return response.data;
}

// ============================================================================
// Cohorts API
// ============================================================================

export interface Cohort {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: 'active' | 'paused' | 'at-risk' | 'completed';
  member_count: number;
  engagement_percent: string;
  start_date?: string;
  end_date?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CohortListResponse {
  data: Cohort[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CohortQueryParams {
  page?: number;
  limit?: number;
  status?: Cohort['status'];
  search?: string;
  sortBy?: 'name' | 'memberCount' | 'engagementPercent' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export async function getCohorts(params?: CohortQueryParams): Promise<CohortListResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const query = searchParams.toString();
  return fetchApi<CohortListResponse>(`/cohorts${query ? `?${query}` : ''}`);
}

export interface CreateCohortInput {
  name: string;
  description?: string;
  status: Cohort['status'];
  startDate?: string;
  endDate?: string;
  settings?: Record<string, any>;
}

export async function getCohort(id: string): Promise<Cohort> {
  const response = await fetchApi<{ data: Cohort }>(`/cohorts/${id}`);
  return response.data;
}

export async function updateCohort(id: string, data: Partial<CreateCohortInput>): Promise<Cohort> {
  const response = await fetchApi<{ data: Cohort }>(`/cohorts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteCohort(id: string): Promise<void> {
  await fetchApi(`/cohorts/${id}`, { method: 'DELETE' });
}

export async function createCohort(data: CreateCohortInput): Promise<Cohort> {
  const response = await fetchApi<{ data: Cohort }>('/cohorts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

// ============================================================================
// Cohort Detail API (uses /api/cohorts/:id directly, not /api/v1)
// ============================================================================

export interface CohortDetail extends Cohort {
  stats: {
    memberCount: number;
    engagementPercent: number;
    daysActive: number;
    status: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface CohortMember {
  id: string;
  cohort_id: string;
  agent_id: string;
  agent_name: string;
  agent_slug: string;
  agent_avatar_url?: string;
  agent_role?: string;
  agent_status: 'active' | 'idle' | 'busy' | 'offline' | 'error';
  engagement_score: number;
  joined_at: string;
  last_active_at?: string;
}

export interface CohortMembersResponse {
  members: CohortMember[];
  count: number;
}

export interface CohortTimelineData {
  date: string;
  interaction_count: number;
}

export interface CohortTimelineResponse {
  timeline: CohortTimelineData[];
  period: {
    days: number;
    start: string;
    end: string;
  };
}

export interface CohortActivity {
  id: string;
  entity_id: string;
  action: string;
  description: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface CohortActivityResponse {
  activities: CohortActivity[];
  count: number;
}

export async function getCohortDetail(id: string): Promise<CohortDetail> {
  return fetch(`/api/cohorts/${id}`).then(async (res) => {
    if (!res.ok) throw new ApiError('Failed to fetch cohort', res.status);
    return res.json();
  });
}

export async function getCohortMembers(id: string): Promise<CohortMembersResponse> {
  return fetch(`/api/cohorts/${id}/members`).then(async (res) => {
    if (!res.ok) throw new ApiError('Failed to fetch members', res.status);
    return res.json();
  });
}

export async function getCohortTimeline(
  id: string,
  days: number = 30
): Promise<CohortTimelineResponse> {
  return fetch(`/api/cohorts/${id}/timeline?days=${days}`).then(async (res) => {
    if (!res.ok) throw new ApiError('Failed to fetch timeline', res.status);
    return res.json();
  });
}

export async function getCohortActivity(
  id: string,
  limit: number = 20
): Promise<CohortActivityResponse> {
  return fetch(`/api/cohorts/${id}/activity?limit=${limit}`).then(async (res) => {
    if (!res.ok) throw new ApiError('Failed to fetch activity', res.status);
    return res.json();
  });
}

// ============================================================================
// Agents API
// ============================================================================

export interface Agent {
  id: string;
  name: string;
  slug: string;
  description?: string;
  role?: string;
  status: 'active' | 'idle' | 'busy' | 'offline' | 'error';
  capabilities: string[];
  runtime_type: string;
  runtime_config: Record<string, any>;
  total_tasks_completed: number;
  total_time_worked_ms: number;
  last_active_at?: string;
  avatar_url?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AgentListResponse {
  data: Agent[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface AgentQueryParams {
  page?: number;
  limit?: number;
  status?: Agent['status'];
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'status' | 'totalTasksCompleted';
  sortOrder?: 'asc' | 'desc';
}

export async function getAgents(params?: AgentQueryParams): Promise<AgentListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  const query = searchParams.toString();
  return fetchApi<AgentListResponse>(`/agents${query ? `?${query}` : ''}`);
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  role?: string;
  status?: Agent['status'];
  capabilities?: string[];
  runtimeType?: string;
  settings?: Record<string, any>;
}

export async function getAgent(id: string): Promise<Agent> {
  const response = await fetchApi<{ data: Agent }>(`/agents/${id}`);
  return response.data;
}

export async function createAgent(data: CreateAgentInput): Promise<Agent> {
  const response = await fetchApi<{ data: Agent }>('/agents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateAgent(id: string, data: Partial<CreateAgentInput>): Promise<Agent> {
  const response = await fetchApi<{ data: Agent }>(`/agents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteAgent(id: string): Promise<void> {
  await fetchApi(`/agents/${id}`, { method: 'DELETE' });
}

// ============================================================================
// Missions API
// ============================================================================

export interface Mission {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  owner_type: string;
  owner_id: string;
  start_date?: string;
  target_date?: string;
  completed_at?: string;
  goal_id?: string;
  color?: string;
  icon?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MissionListResponse {
  data: Mission[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface MissionQueryParams {
  page?: number;
  limit?: number;
  status?: Mission['status'];
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'status' | 'startDate' | 'targetDate';
  sortOrder?: 'asc' | 'desc';
}

export async function getMissions(params?: MissionQueryParams): Promise<MissionListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  const query = searchParams.toString();
  return fetchApi<MissionListResponse>(`/missions${query ? `?${query}` : ''}`);
}

export interface CreateMissionInput {
  name: string;
  description?: string;
  status?: Mission['status'];
  startDate?: string;
  targetDate?: string;
  color?: string;
  icon?: string;
  settings?: Record<string, any>;
}

export async function getMission(id: string): Promise<Mission> {
  const response = await fetchApi<{ data: Mission }>(`/missions/${id}`);
  return response.data;
}

export async function createMission(data: CreateMissionInput): Promise<Mission> {
  const response = await fetchApi<{ data: Mission }>('/missions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateMission(
  id: string,
  data: Partial<CreateMissionInput>
): Promise<Mission> {
  const response = await fetchApi<{ data: Mission }>(`/missions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteMission(id: string): Promise<void> {
  await fetchApi(`/missions/${id}`, { method: 'DELETE' });
}

// ============================================================================
// Operations API
// ============================================================================

export interface Operation {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  startDate?: string;
  targetDate?: string;
  completedAt?: string;
  color?: string;
  icon?: string;
  missionId?: string;
  ownerType: 'user' | 'agent';
  ownerId: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OperationListResponse {
  data: Operation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OperationQueryParams {
  page?: number;
  limit?: number;
  status?: Operation['status'];
  search?: string;
  missionId?: string;
  sortBy?: 'name' | 'createdAt' | 'status' | 'startDate' | 'targetDate';
  sortOrder?: 'asc' | 'desc';
}

export async function getOperations(params?: OperationQueryParams): Promise<OperationListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.missionId) searchParams.set('missionId', params.missionId);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  const query = searchParams.toString();
  return fetchApi<OperationListResponse>(`/operations${query ? `?${query}` : ''}`);
}

export interface CreateOperationInput {
  name: string;
  description?: string;
  status?: Operation['status'];
  startDate?: string;
  targetDate?: string;
  missionId?: string;
  color?: string;
  icon?: string;
  settings?: Record<string, any>;
}

export async function getOperation(id: string): Promise<Operation> {
  const response = await fetchApi<{ data: Operation }>(`/operations/${id}`);
  return response.data;
}

export async function createOperation(data: CreateOperationInput): Promise<Operation> {
  const response = await fetchApi<{ data: Operation }>('/operations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function updateOperation(
  id: string,
  data: Partial<CreateOperationInput>
): Promise<Operation> {
  const response = await fetchApi<{ data: Operation }>(`/operations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.data;
}

export async function deleteOperation(id: string): Promise<void> {
  await fetchApi(`/operations/${id}`, { method: 'DELETE' });
}

// ============================================================================
// Comments API
// ============================================================================

export interface Comment {
  id: string;
  content: string;
  entity_type: string;
  entity_id: string;
  author_id: string;
  author_name: string;
  author_avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CommentListResponse {
  data: Comment[];
}

export async function getComments(
  entityType: string,
  entityId: string
): Promise<CommentListResponse> {
  return fetchApi<CommentListResponse>(`/comments?entityType=${entityType}&entityId=${entityId}`);
}

export async function createComment(data: {
  content: string;
  entityType: string;
  entityId: string;
}): Promise<Comment> {
  const response = await fetchApi<{ data: Comment }>('/comments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

// ============================================================================
// Activity API
// ============================================================================

export interface Activity {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  actor_id: string;
  actor_name: string;
  actor_avatar_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ActivityListResponse {
  data: Activity[];
}

export async function getActivity(
  entityType: string,
  entityId: string
): Promise<ActivityListResponse> {
  return fetchApi<ActivityListResponse>(`/activity?entityType=${entityType}&entityId=${entityId}`);
}

// ============================================================================
// Insights API
// ============================================================================

export interface Insight {
  id: string;
  title: string;
  content: string;
  source?: string;
  agent_id?: string;
  agent_name?: string;
  agent_avatar_url?: string;
  tags?: string[];
  created_at: string;
}

export interface InsightListResponse {
  data: Insight[];
}

export async function getInsights(): Promise<InsightListResponse> {
  return fetchApi<InsightListResponse>('/insights');
}

export async function createInsight(data: {
  title: string;
  content: string;
  source?: string;
  tags?: string[];
}): Promise<Insight> {
  const response = await fetchApi<{ data: Insight }>('/insights', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}
