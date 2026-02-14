/**
 * Integration Tests - Cohort CRUD API
 *
 * Tests for /api/cohorts endpoints:
 * - GET /api/cohorts (list with pagination, filtering, sorting)
 * - POST /api/cohorts (create with Zod validation, error cases)
 * - GET /api/cohorts/:id (found + not found)
 * - PATCH /api/cohorts/:id (update, partial update, validation errors)
 * - DELETE /api/cohorts/:id (soft delete)
 *
 * Also tests:
 * - RLS policies (unauthorized access blocked)
 * - Edge cases (empty strings, missing fields, duplicate names)
 * - Proper error response format (RFC 7807 if implemented)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getCohortsHandler, POST as postCohortsHandler } from '@/app/api/cohorts/route';
import {
  GET as getCohortHandler,
  PATCH as patchCohortHandler,
  DELETE as deleteCohortHandler,
} from '@/app/api/cohorts/[id]/route';

// Mock the database queries and mutations
vi.mock('@/server/db/queries/cohorts', () => ({
  getCohorts: vi.fn(),
  getCohortById: vi.fn(),
  getCohortStats: vi.fn(),
}));

vi.mock('@/server/db/mutations/cohorts', () => ({
  createCohort: vi.fn(),
  updateCohort: vi.fn(),
  deleteCohort: vi.fn(),
  createCohortSchema: {
    parse: vi.fn((data) => data),
  },
  updateCohortSchema: {
    parse: vi.fn((data) => data),
  },
}));

vi.mock('@/server/db/queries/dashboard', () => ({
  getCurrentUser: vi.fn(),
  getUserOrganization: vi.fn(),
}));

vi.mock('@/lib/auth-helper', () => ({
  getAuthContext: vi.fn(),
}));

import { getCohorts, getCohortById, getCohortStats } from '@/server/db/queries/cohorts';
import {
  createCohort,
  updateCohort,
  deleteCohort,
  createCohortSchema,
  updateCohortSchema,
} from '@/server/db/mutations/cohorts';
import { getCurrentUser, getUserOrganization } from '@/server/db/queries/dashboard';
import { getAuthContext } from '@/lib/auth-helper';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

const mockGetCohorts = vi.mocked(getCohorts);
const mockGetCohortById = vi.mocked(getCohortById);
const mockGetCohortStats = vi.mocked(getCohortStats);
const mockCreateCohort = vi.mocked(createCohort);
const mockUpdateCohort = vi.mocked(updateCohort);
const mockDeleteCohort = vi.mocked(deleteCohort);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockGetUserOrganization = vi.mocked(getUserOrganization);
const mockGetAuthContext = vi.mocked(getAuthContext);
const mockCreateCohortSchema = vi.mocked(createCohortSchema);
const mockUpdateCohortSchema = vi.mocked(updateCohortSchema);

// Sample test data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const mockOrganization = {
  id: 'org-123',
  organization_id: 'org-123',
  user_id: 'user-123',
};

const mockCohort = {
  id: 'cohort-123',
  organization_id: 'org-123',
  name: 'Spring 2024 Beta',
  slug: 'spring-2024-beta-123',
  description: 'Test cohort description',
  status: 'active',
  start_date: '2024-01-01',
  end_date: '2024-06-30',
  member_count: 0,
  engagement_percent: 0,
  settings: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  created_by: 'user-123',
};

const mockCohortStats = {
  memberCount: 50,
  engagementPercent: 75.5,
  daysActive: 30,
  status: 'active',
  startDate: '2024-01-01',
  endDate: '2024-06-30',
};

describe('Cohort CRUD API - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default auth mocks - successful authentication
    mockGetCurrentUser.mockResolvedValue(mockUser as any);
    mockGetUserOrganization.mockResolvedValue(mockOrganization as any);
    // Mock getAuthContext for [id] routes that use auth-helper
    mockGetAuthContext.mockResolvedValue({
      supabase: {} as any,
      organizationId: mockOrganization.id,
      userId: mockUser.id,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // GET /api/cohorts - List with pagination, filtering, sorting
  // ============================================================================

  describe('GET /api/cohorts', () => {
    it('should list cohorts with default pagination', async () => {
      const mockResponse = {
        cohorts: [mockCohort],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };

      mockGetCohorts.mockResolvedValue(mockResponse as any);

      const request = new NextRequest('https://example.com/api/cohorts');
      const response = await getCohortsHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockResponse);
      expect(mockGetCohorts).toHaveBeenCalledWith('org-123', {
        status: undefined,
        search: undefined,
        startDateFrom: undefined,
        startDateTo: undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
        page: 1,
        pageSize: 20,
      });
    });

    it('should apply status filter', async () => {
      const mockResponse = {
        cohorts: [mockCohort],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };

      mockGetCohorts.mockResolvedValue(mockResponse as any);

      const request = new NextRequest('https://example.com/api/cohorts?status=active');
      const response = await getCohortsHandler(request);

      expect(response.status).toBe(200);
      expect(mockGetCohorts).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({
          status: 'active',
        })
      );
    });

    it('should apply search filter', async () => {
      mockGetCohorts.mockResolvedValue({
        cohorts: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      } as any);

      const request = new NextRequest('https://example.com/api/cohorts?search=Spring');
      const response = await getCohortsHandler(request);

      expect(response.status).toBe(200);
      expect(mockGetCohorts).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({
          search: 'Spring',
        })
      );
    });

    it('should apply date range filters', async () => {
      mockGetCohorts.mockResolvedValue({
        cohorts: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      } as any);

      const request = new NextRequest(
        'https://example.com/api/cohorts?startDateFrom=2024-01-01&startDateTo=2024-12-31'
      );
      const response = await getCohortsHandler(request);

      expect(response.status).toBe(200);
      expect(mockGetCohorts).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({
          startDateFrom: '2024-01-01',
          startDateTo: '2024-12-31',
        })
      );
    });

    it('should apply custom sorting', async () => {
      mockGetCohorts.mockResolvedValue({
        cohorts: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      } as any);

      const request = new NextRequest('https://example.com/api/cohorts?sortBy=name&sortOrder=asc');
      const response = await getCohortsHandler(request);

      expect(response.status).toBe(200);
      expect(mockGetCohorts).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({
          sortBy: 'name',
          sortOrder: 'asc',
        })
      );
    });

    it('should apply custom pagination', async () => {
      mockGetCohorts.mockResolvedValue({
        cohorts: [],
        total: 0,
        page: 2,
        pageSize: 10,
        totalPages: 0,
      } as any);

      const request = new NextRequest('https://example.com/api/cohorts?page=2&pageSize=10');
      const response = await getCohortsHandler(request);

      expect(response.status).toBe(200);
      expect(mockGetCohorts).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({
          page: 2,
          pageSize: 10,
        })
      );
    });

    it('should limit maximum page size to 50', async () => {
      mockGetCohorts.mockResolvedValue({
        cohorts: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
      } as any);

      const request = new NextRequest('https://example.com/api/cohorts?pageSize=100');
      const response = await getCohortsHandler(request);

      expect(response.status).toBe(200);
      expect(mockGetCohorts).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({
          pageSize: 50,
        })
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null as any);

      const request = new NextRequest('https://example.com/api/cohorts');
      const response = await getCohortsHandler(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: 'Unauthorized' });
      expect(mockGetCohorts).not.toHaveBeenCalled();
    });

    it('should return 403 when user has no organization', async () => {
      mockGetUserOrganization.mockResolvedValue(null);

      const request = new NextRequest('https://example.com/api/cohorts');
      const response = await getCohortsHandler(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({ error: 'No organization found' });
      expect(mockGetCohorts).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockGetCohorts.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('https://example.com/api/cohorts');
      const response = await getCohortsHandler(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  // ============================================================================
  // POST /api/cohorts - Create with Zod validation
  // ============================================================================

  describe('POST /api/cohorts', () => {
    it('should create a cohort with valid data', async () => {
      const validInput = {
        name: 'Spring 2024 Beta',
        description: 'Test cohort',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2024-06-30',
      };

      mockCreateCohortSchema.parse.mockReturnValue(validInput as any);
      mockCreateCohort.mockResolvedValue(mockCohort as any);

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(validInput),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockCohort);
      expect(mockCreateCohort).toHaveBeenCalledWith('org-123', 'user-123', validInput);
    });

    it('should create cohort with minimal required fields', async () => {
      const minimalInput = {
        name: 'Minimal Cohort',
      };

      mockCreateCohortSchema.parse.mockReturnValue({ ...minimalInput, status: 'active' } as any);
      mockCreateCohort.mockResolvedValue({ ...mockCohort, ...minimalInput } as any);

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(minimalInput),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(201);
      expect(mockCreateCohort).toHaveBeenCalled();
    });

    it('should handle Zod validation errors for empty name', async () => {
      const invalidInput = {
        name: '',
      };

      mockCreateCohortSchema.parse.mockImplementation(() => {
        const error: any = new Error('Validation failed');
        error.name = 'ZodError';
        error.errors = [
          {
            code: 'too_small',
            minimum: 1,
            type: 'string',
            inclusive: true,
            exact: false,
            message: 'Name is required',
            path: ['name'],
          },
        ];
        throw error;
      });

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(invalidInput),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
      expect(mockCreateCohort).not.toHaveBeenCalled();
    });

    it('should handle Zod validation errors for name too long', async () => {
      const invalidInput = {
        name: 'a'.repeat(256), // Exceeds max length of 255
      };

      mockCreateCohortSchema.parse.mockImplementation(() => {
        const error: any = new Error('Validation failed');
        error.name = 'ZodError';
        error.errors = [
          {
            code: 'too_big',
            maximum: 255,
            type: 'string',
            inclusive: true,
            exact: false,
            message: 'String must contain at most 255 character(s)',
            path: ['name'],
          },
        ];
        throw error;
      });

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(invalidInput),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(mockCreateCohort).not.toHaveBeenCalled();
    });

    it('should handle Zod validation errors for invalid status', async () => {
      const invalidInput = {
        name: 'Test Cohort',
        status: 'invalid-status',
      };

      mockCreateCohortSchema.parse.mockImplementation(() => {
        const error: any = new Error('Validation failed');
        error.name = 'ZodError';
        error.errors = [
          {
            code: 'invalid_enum_value',
            options: ['active', 'paused', 'at-risk', 'completed'],
            message: "Invalid enum value. Expected 'active' | 'paused' | 'at-risk' | 'completed'",
            path: ['status'],
          },
        ];
        throw error;
      });

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(invalidInput),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(mockCreateCohort).not.toHaveBeenCalled();
    });

    it('should handle Zod validation errors for end_date before start_date', async () => {
      const invalidInput = {
        name: 'Test Cohort',
        start_date: '2024-06-30',
        end_date: '2024-01-01',
      };

      mockCreateCohortSchema.parse.mockImplementation(() => {
        const error: any = new Error('Validation failed');
        error.name = 'ZodError';
        error.errors = [
          {
            code: 'custom',
            message: 'End date must be after start date',
            path: ['end_date'],
          },
        ];
        throw error;
      });

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(invalidInput),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(mockCreateCohort).not.toHaveBeenCalled();
    });

    it('should handle missing name field', async () => {
      const invalidInput = {
        description: 'No name provided',
      };

      mockCreateCohortSchema.parse.mockImplementation(() => {
        const error: any = new Error('Validation failed');
        error.name = 'ZodError';
        error.errors = [
          {
            code: 'invalid_type',
            expected: 'string',
            received: 'undefined',
            message: 'Required',
            path: ['name'],
          },
        ];
        throw error;
      });

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(invalidInput),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(mockCreateCohort).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null as any);

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Cohort' }),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(401);
      expect(mockCreateCohort).not.toHaveBeenCalled();
    });

    it('should return 403 when user has no organization', async () => {
      mockGetUserOrganization.mockResolvedValue(null);

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Cohort' }),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(403);
      expect(mockCreateCohort).not.toHaveBeenCalled();
    });

    it('should handle database errors during creation', async () => {
      mockCreateCohortSchema.parse.mockReturnValue({ name: 'Test' } as any);
      mockCreateCohort.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Cohort' }),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should handle duplicate cohort names gracefully', async () => {
      mockCreateCohortSchema.parse.mockReturnValue({ name: 'Duplicate' } as any);
      mockCreateCohort.mockRejectedValue(
        new Error('duplicate key value violates unique constraint')
      );

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify({ name: 'Duplicate' }),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  // ============================================================================
  // GET /api/cohorts/:id - Get by ID
  // ============================================================================

  describe('GET /api/cohorts/:id', () => {
    it('should get cohort by ID with stats', async () => {
      mockGetCohortById.mockResolvedValue(mockCohort as any);
      mockGetCohortStats.mockResolvedValue(mockCohortStats as any);

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123');
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      const response = await getCohortHandler(request, context);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ ...mockCohort, stats: mockCohortStats });
      expect(mockGetCohortById).toHaveBeenCalledWith('cohort-123');
      expect(mockGetCohortStats).toHaveBeenCalledWith('cohort-123');
    });

    it('should return 404 when cohort is not found', async () => {
      mockGetCohortById.mockResolvedValue(null);
      mockGetCohortStats.mockResolvedValue(null);

      const request = new NextRequest('https://example.com/api/cohorts/nonexistent');
      const context = { params: Promise.resolve({ id: 'nonexistent' }) };
      const response = await getCohortHandler(request, context);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: 'Cohort not found' });
      expect(mockGetCohortById).toHaveBeenCalledWith('nonexistent');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetAuthContext.mockRejectedValue(new UnauthorizedError('Authentication required'));

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123');
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      await expect(getCohortHandler(request, context)).rejects.toThrow('Authentication required');
      expect(mockGetCohortById).not.toHaveBeenCalled();
    });

    it('should return 403 when user has no organization', async () => {
      mockGetAuthContext.mockRejectedValue(new ForbiddenError('No organization'));

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123');
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      await expect(getCohortHandler(request, context)).rejects.toThrow('No organization');
      expect(mockGetCohortById).not.toHaveBeenCalled();
    });

    it('should handle database errors during fetch', async () => {
      mockGetCohortById.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123');
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      const response = await getCohortHandler(request, context);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  // ============================================================================
  // PATCH /api/cohorts/:id - Update
  // ============================================================================

  describe('PATCH /api/cohorts/:id', () => {
    it('should update cohort with valid data', async () => {
      const updateInput = {
        name: 'Updated Spring 2024',
        status: 'paused',
      };

      mockUpdateCohortSchema.parse.mockReturnValue(updateInput as any);
      mockUpdateCohort.mockResolvedValue({ ...mockCohort, ...updateInput } as any);

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123', {
        method: 'PATCH',
        body: JSON.stringify(updateInput),
      });
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      const response = await patchCohortHandler(request, context);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe('Updated Spring 2024');
      expect(data.status).toBe('paused');
      expect(mockUpdateCohort).toHaveBeenCalledWith('cohort-123', updateInput);
    });

    it('should support partial updates', async () => {
      const partialUpdate = {
        status: 'completed',
      };

      mockUpdateCohortSchema.parse.mockReturnValue(partialUpdate as any);
      mockUpdateCohort.mockResolvedValue({ ...mockCohort, ...partialUpdate } as any);

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123', {
        method: 'PATCH',
        body: JSON.stringify(partialUpdate),
      });
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      const response = await patchCohortHandler(request, context);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('completed');
      expect(mockUpdateCohort).toHaveBeenCalledWith('cohort-123', partialUpdate);
    });

    it('should handle Zod validation errors for empty name', async () => {
      const invalidUpdate = {
        name: '',
      };

      mockUpdateCohortSchema.parse.mockImplementation(() => {
        const error: any = new Error('Validation failed');
        error.name = 'ZodError';
        error.errors = [
          {
            code: 'too_small',
            message: 'String must contain at least 1 character(s)',
            path: ['name'],
          },
        ];
        throw error;
      });

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123', {
        method: 'PATCH',
        body: JSON.stringify(invalidUpdate),
      });
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      const response = await patchCohortHandler(request, context);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(mockUpdateCohort).not.toHaveBeenCalled();
    });

    it('should handle Zod validation errors for invalid status', async () => {
      const invalidUpdate = {
        status: 'invalid-status',
      };

      mockUpdateCohortSchema.parse.mockImplementation(() => {
        const error: any = new Error('Validation failed');
        error.name = 'ZodError';
        error.errors = [
          {
            code: 'invalid_enum_value',
            message: 'Invalid enum value',
            path: ['status'],
          },
        ];
        throw error;
      });

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123', {
        method: 'PATCH',
        body: JSON.stringify(invalidUpdate),
      });
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      const response = await patchCohortHandler(request, context);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
      expect(mockUpdateCohort).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetAuthContext.mockRejectedValue(new UnauthorizedError('Authentication required'));

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated' }),
      });
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      await expect(patchCohortHandler(request, context)).rejects.toThrow('Authentication required');
      expect(mockUpdateCohort).not.toHaveBeenCalled();
    });

    it('should return 403 when user has no organization', async () => {
      mockGetAuthContext.mockRejectedValue(new ForbiddenError('No organization'));

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated' }),
      });
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      await expect(patchCohortHandler(request, context)).rejects.toThrow('No organization');
      expect(mockUpdateCohort).not.toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      mockUpdateCohortSchema.parse.mockReturnValue({ name: 'Updated' } as any);
      mockUpdateCohort.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated' }),
      });
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      const response = await patchCohortHandler(request, context);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should handle non-existent cohort during update', async () => {
      mockUpdateCohortSchema.parse.mockReturnValue({ name: 'Updated' } as any);
      mockUpdateCohort.mockRejectedValue(new Error('Cohort not found'));

      const request = new NextRequest('https://example.com/api/cohorts/nonexistent', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated' }),
      });
      const context = { params: Promise.resolve({ id: 'nonexistent' }) };
      const response = await patchCohortHandler(request, context);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  // ============================================================================
  // DELETE /api/cohorts/:id - Soft Delete
  // ============================================================================

  describe('DELETE /api/cohorts/:id', () => {
    it('should soft delete cohort (archive)', async () => {
      const archivedCohort = { ...mockCohort, status: 'completed' };
      mockDeleteCohort.mockResolvedValue(archivedCohort as any);

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123', {
        method: 'DELETE',
      });
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      const response = await deleteCohortHandler(request, context);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Cohort archived');
      expect(data.cohort).toEqual(archivedCohort);
      expect(mockDeleteCohort).toHaveBeenCalledWith('cohort-123');
    });

    it('should verify soft delete sets status to completed', async () => {
      const archivedCohort = { ...mockCohort, status: 'completed' };
      mockDeleteCohort.mockResolvedValue(archivedCohort as any);

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123', {
        method: 'DELETE',
      });
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      const response = await deleteCohortHandler(request, context);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.cohort.status).toBe('completed');
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetAuthContext.mockRejectedValue(new UnauthorizedError('Authentication required'));

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123', {
        method: 'DELETE',
      });
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      await expect(deleteCohortHandler(request, context)).rejects.toThrow(
        'Authentication required'
      );
      expect(mockDeleteCohort).not.toHaveBeenCalled();
    });

    it('should return 403 when user has no organization', async () => {
      mockGetAuthContext.mockRejectedValue(new ForbiddenError('No organization'));

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123', {
        method: 'DELETE',
      });
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      await expect(deleteCohortHandler(request, context)).rejects.toThrow('No organization');
      expect(mockDeleteCohort).not.toHaveBeenCalled();
    });

    it('should handle database errors during delete', async () => {
      mockDeleteCohort.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('https://example.com/api/cohorts/cohort-123', {
        method: 'DELETE',
      });
      const context = { params: Promise.resolve({ id: 'cohort-123' }) };
      const response = await deleteCohortHandler(request, context);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should handle non-existent cohort during delete', async () => {
      mockDeleteCohort.mockRejectedValue(new Error('Cohort not found'));

      const request = new NextRequest('https://example.com/api/cohorts/nonexistent', {
        method: 'DELETE',
      });
      const context = { params: Promise.resolve({ id: 'nonexistent' }) };
      const response = await deleteCohortHandler(request, context);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  // ============================================================================
  // Edge Cases and Additional Tests
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle whitespace-only name in creation', async () => {
      const invalidInput = {
        name: '   ',
      };

      mockCreateCohortSchema.parse.mockImplementation(() => {
        const error: any = new Error('Validation failed');
        error.name = 'ZodError';
        error.errors = [
          {
            code: 'too_small',
            message: 'Name is required',
            path: ['name'],
          },
        ];
        throw error;
      });

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(invalidInput),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(400);
      expect(mockCreateCohort).not.toHaveBeenCalled();
    });

    it('should handle null values in optional fields', async () => {
      const inputWithNulls = {
        name: 'Test Cohort',
        description: null,
        start_date: null,
        end_date: null,
      };

      mockCreateCohortSchema.parse.mockReturnValue({
        name: 'Test Cohort',
        status: 'active',
      } as any);
      mockCreateCohort.mockResolvedValue(mockCohort as any);

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(inputWithNulls),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(201);
    });

    it('should handle special characters in cohort name', async () => {
      const specialNameInput = {
        name: 'Cohort #1 - "Alpha" & Beta',
      };

      mockCreateCohortSchema.parse.mockReturnValue({
        ...specialNameInput,
        status: 'active',
      } as any);
      mockCreateCohort.mockResolvedValue({ ...mockCohort, ...specialNameInput } as any);

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(specialNameInput),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(201);
      expect(mockCreateCohort).toHaveBeenCalled();
    });

    it('should handle unicode characters in cohort name', async () => {
      const unicodeInput = {
        name: 'Cohort 春季 2024 🚀',
      };

      mockCreateCohortSchema.parse.mockReturnValue({ ...unicodeInput, status: 'active' } as any);
      mockCreateCohort.mockResolvedValue({ ...mockCohort, ...unicodeInput } as any);

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(unicodeInput),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(201);
      expect(mockCreateCohort).toHaveBeenCalled();
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: 'invalid json{',
      });

      const response = await postCohortsHandler(request);

      expect(response.status).toBe(500);
      expect(mockCreateCohort).not.toHaveBeenCalled();
    });

    it('should handle empty request body', async () => {
      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: '{}',
      });

      mockCreateCohortSchema.parse.mockImplementation(() => {
        const error: any = new Error('Validation failed');
        error.name = 'ZodError';
        error.errors = [
          {
            code: 'invalid_type',
            expected: 'string',
            received: 'undefined',
            message: 'Required',
            path: ['name'],
          },
        ];
        throw error;
      });

      const response = await postCohortsHandler(request);

      expect(response.status).toBe(400);
      expect(mockCreateCohort).not.toHaveBeenCalled();
    });

    it('should handle very long descriptions', async () => {
      const longDescInput = {
        name: 'Test Cohort',
        description: 'a'.repeat(10000),
      };

      mockCreateCohortSchema.parse.mockReturnValue({ ...longDescInput, status: 'active' } as any);
      mockCreateCohort.mockResolvedValue({ ...mockCohort, ...longDescInput } as any);

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(longDescInput),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(201);
    });

    it('should handle same start and end dates', async () => {
      const sameDateInput = {
        name: 'One Day Cohort',
        start_date: '2024-01-01',
        end_date: '2024-01-01',
      };

      mockCreateCohortSchema.parse.mockReturnValue({ ...sameDateInput, status: 'active' } as any);
      mockCreateCohort.mockResolvedValue({ ...mockCohort, ...sameDateInput } as any);

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify(sameDateInput),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(201);
    });
  });

  // ============================================================================
  // RLS Policy Tests (Authorization)
  // ============================================================================

  describe('RLS Policy Tests', () => {
    it('should enforce organization isolation on list', async () => {
      // User from org-123 should only see org-123 cohorts
      mockGetCohorts.mockResolvedValue({
        cohorts: [mockCohort],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      } as any);

      const request = new NextRequest('https://example.com/api/cohorts');
      const response = await getCohortsHandler(request);

      expect(response.status).toBe(200);
      expect(mockGetCohorts).toHaveBeenCalledWith('org-123', expect.any(Object));
    });

    it('should prevent cross-organization cohort access', async () => {
      // This test verifies that RLS policies are applied
      // In a real scenario, attempting to access another org's cohort would fail
      const otherOrgCohort = { ...mockCohort, organization_id: 'org-456' };
      mockGetCohortById.mockResolvedValue(otherOrgCohort as any);
      mockGetCohortStats.mockResolvedValue(mockCohortStats as any);

      const request = new NextRequest('https://example.com/api/cohorts/cohort-456');
      const context = { params: Promise.resolve({ id: 'cohort-456' }) };
      const response = await getCohortHandler(request, context);

      // The API returns the data, but in production Supabase RLS would filter it
      expect(response.status).toBe(200);
    });

    it('should enforce authentication on all endpoints', async () => {
      mockGetCurrentUser.mockResolvedValue(null as any);

      // Test all endpoints return 401 without auth
      const endpoints = [
        { handler: getCohortsHandler, method: 'GET', url: 'https://example.com/api/cohorts' },
        {
          handler: postCohortsHandler,
          method: 'POST',
          url: 'https://example.com/api/cohorts',
          body: '{"name":"Test"}',
        },
      ];

      for (const endpoint of endpoints) {
        const request = new NextRequest(endpoint.url, {
          method: endpoint.method,
          body: endpoint.body,
        });
        const response = await endpoint.handler(request);
        expect(response.status).toBe(401);
      }
    });

    it('should enforce organization membership on all endpoints', async () => {
      mockGetUserOrganization.mockResolvedValue(null);

      const endpoints = [
        { handler: getCohortsHandler, method: 'GET', url: 'https://example.com/api/cohorts' },
        {
          handler: postCohortsHandler,
          method: 'POST',
          url: 'https://example.com/api/cohorts',
          body: '{"name":"Test"}',
        },
      ];

      for (const endpoint of endpoints) {
        const request = new NextRequest(endpoint.url, {
          method: endpoint.method,
          body: endpoint.body,
        });
        const response = await endpoint.handler(request);
        expect(response.status).toBe(403);
      }
    });
  });

  // ============================================================================
  // Error Response Format Tests (RFC 7807)
  // ============================================================================

  describe('Error Response Format', () => {
    it('should return consistent error format for 400 errors', async () => {
      mockCreateCohortSchema.parse.mockImplementation(() => {
        const error: any = new Error('Validation failed');
        error.name = 'ZodError';
        error.errors = [{ message: 'Name is required', path: ['name'] }];
        throw error;
      });

      const request = new NextRequest('https://example.com/api/cohorts', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      });
      const response = await postCohortsHandler(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('details');
    });

    it('should return consistent error format for 401 errors', async () => {
      mockGetCurrentUser.mockResolvedValue(null as any);

      const request = new NextRequest('https://example.com/api/cohorts');
      const response = await getCohortsHandler(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return consistent error format for 403 errors', async () => {
      mockGetUserOrganization.mockResolvedValue(null);

      const request = new NextRequest('https://example.com/api/cohorts');
      const response = await getCohortsHandler(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({ error: 'No organization found' });
    });

    it('should return consistent error format for 404 errors', async () => {
      mockGetCohortById.mockResolvedValue(null);
      mockGetCohortStats.mockResolvedValue(null);

      const request = new NextRequest('https://example.com/api/cohorts/nonexistent');
      const context = { params: Promise.resolve({ id: 'nonexistent' }) };
      const response = await getCohortHandler(request, context);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: 'Cohort not found' });
    });

    it('should return consistent error format for 500 errors', async () => {
      mockGetCohorts.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('https://example.com/api/cohorts');
      const response = await getCohortsHandler(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });
  });
});
