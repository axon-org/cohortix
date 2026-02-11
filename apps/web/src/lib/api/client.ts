/**
 * API Client for Cohortix
 * Centralized API calls with error handling and type safety
 */

const API_BASE = '/api/v1'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ApiError(
        error.message || `API Error: ${response.statusText}`,
        response.status,
        error
      )
    }

    return response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      500
    )
  }
}

// ============================================================================
// Dashboard API
// ============================================================================

export interface DashboardKPIs {
  kpis: {
    activeCohortsCount: number
    totalAllies: number
    avgEngagement: number
    atRiskCount: number
  }
  trends: {
    activeCohortsChange: number
    totalAlliesChange: number
    avgEngagementChange: number
    atRiskChange: number
  }
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const response = await fetchApi<{ data: DashboardKPIs }>('/dashboard/mission-control')
  return response.data
}

// ============================================================================
// Cohorts API
// ============================================================================

export interface Cohort {
  id: string
  name: string
  slug: string
  description?: string
  status: 'active' | 'paused' | 'at-risk' | 'completed'
  member_count: number
  engagement_percent: string
  start_date?: string
  end_date?: string
  settings?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CohortListResponse {
  data: Cohort[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CohortQueryParams {
  page?: number
  limit?: number
  status?: Cohort['status']
  search?: string
  sortBy?: 'name' | 'memberCount' | 'engagementPercent' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export async function getCohorts(params?: CohortQueryParams): Promise<CohortListResponse> {
  const searchParams = new URLSearchParams()
  
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.status) searchParams.set('status', params.status)
  if (params?.search) searchParams.set('search', params.search)
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const query = searchParams.toString()
  return fetchApi<CohortListResponse>(`/cohorts${query ? `?${query}` : ''}`)
}

export interface CreateCohortInput {
  name: string
  description?: string
  status: Cohort['status']
  startDate?: string
  endDate?: string
  settings?: Record<string, any>
}

export async function createCohort(data: CreateCohortInput): Promise<Cohort> {
  const response = await fetchApi<{ data: Cohort }>('/cohorts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response.data
}
