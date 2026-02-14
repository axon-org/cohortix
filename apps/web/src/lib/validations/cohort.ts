/**
 * Cohort Validation Schemas - Axon Codex v1.2 Section 2.5.1
 *
 * Zod schemas for cohort input validation across API routes.
 */

import { z } from 'zod';

// ============================================================================
// Cohort Status Enum
// ============================================================================

export const cohortStatusEnum = z.enum(['active', 'paused', 'at-risk', 'completed']);

export type CohortStatus = z.infer<typeof cohortStatusEnum>;

// ============================================================================
// Create Cohort Schema
// ============================================================================

export const createCohortSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Name must be at least 3 characters')
      .max(255, 'Name must be less than 255 characters')
      .trim(),
    description: z
      .string()
      .max(10000, 'Description must be less than 10,000 characters')
      .optional(),
    status: cohortStatusEnum.default('active'),
    startDate: z.string().date('Invalid date format (use YYYY-MM-DD)').optional().nullable(),
    endDate: z.string().date('Invalid date format (use YYYY-MM-DD)').optional().nullable(),
    settings: z.record(z.any()).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export type CreateCohortInput = z.infer<typeof createCohortSchema>;

// ============================================================================
// Update Cohort Schema
// ============================================================================

export const updateCohortSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Name must be at least 3 characters')
      .max(255, 'Name must be less than 255 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(10000, 'Description must be less than 10,000 characters')
      .optional()
      .nullable(),
    status: cohortStatusEnum.optional(),
    startDate: z.string().date('Invalid date format (use YYYY-MM-DD)').optional().nullable(),
    endDate: z.string().date('Invalid date format (use YYYY-MM-DD)').optional().nullable(),
    memberCount: z
      .number()
      .int('Member count must be an integer')
      .min(0, 'Member count cannot be negative')
      .optional(),
    engagementPercent: z
      .number()
      .min(0, 'Engagement must be at least 0%')
      .max(100, 'Engagement cannot exceed 100%')
      .optional(),
    settings: z.record(z.any()).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export type UpdateCohortInput = z.infer<typeof updateCohortSchema>;

// ============================================================================
// Cohort Query Parameters Schema
// ============================================================================

export const cohortQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: cohortStatusEnum.optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['name', 'createdAt', 'memberCount', 'engagementPercent']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CohortQueryParams = z.infer<typeof cohortQuerySchema>;

// ============================================================================
// Dashboard Query Schemas
// ============================================================================

export const healthTrendsQuerySchema = z.object({
  period: z.enum(['30d', '90d', '1y']).default('30d'),
  interval: z.enum(['day', 'week', 'month']).default('day'),
});

export type HealthTrendsQueryParams = z.infer<typeof healthTrendsQuerySchema>;
