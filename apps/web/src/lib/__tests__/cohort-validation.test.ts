/**
 * Cohort Validation Schemas - Unit Tests
 *
 * Tests for Zod validation schemas to ensure proper input validation.
 */

import { describe, it, expect } from 'vitest';
import {
  createCohortSchema,
  updateCohortSchema,
  cohortQuerySchema,
  healthTrendsQuerySchema,
  cohortStatusEnum,
} from '../validations/cohort';

describe('Cohort Validation Schemas', () => {
  describe('cohortStatusEnum', () => {
    it('should accept valid statuses', () => {
      expect(() => cohortStatusEnum.parse('active')).not.toThrow();
      expect(() => cohortStatusEnum.parse('paused')).not.toThrow();
      expect(() => cohortStatusEnum.parse('at-risk')).not.toThrow();
      expect(() => cohortStatusEnum.parse('completed')).not.toThrow();
    });

    it('should reject invalid statuses', () => {
      expect(() => cohortStatusEnum.parse('invalid')).toThrow();
      expect(() => cohortStatusEnum.parse('ACTIVE')).toThrow();
      expect(() => cohortStatusEnum.parse('')).toThrow();
    });
  });

  describe('createCohortSchema', () => {
    const validData = {
      name: 'Test Cohort',
      description: 'Test description',
      status: 'active' as const,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    };

    it('should accept valid cohort data', () => {
      const result = createCohortSchema.parse(validData);
      expect(result.name).toBe('Test Cohort');
      expect(result.status).toBe('active');
    });

    it('should trim name', () => {
      const result = createCohortSchema.parse({
        ...validData,
        name: '  Trimmed Name  ',
      });
      expect(result.name).toBe('Trimmed Name');
    });

    it('should require name', () => {
      const { name, ...withoutName } = validData;
      expect(() => createCohortSchema.parse(withoutName)).toThrow();
    });

    it('should reject name less than 3 characters', () => {
      expect(() => createCohortSchema.parse({ ...validData, name: 'AB' })).toThrow(
        /at least 3 characters/
      );
    });

    it('should reject name more than 255 characters', () => {
      const longName = 'A'.repeat(256);
      expect(() => createCohortSchema.parse({ ...validData, name: longName })).toThrow(
        /less than 255 characters/
      );
    });

    it('should accept optional description', () => {
      const { description, ...withoutDescription } = validData;
      expect(() => createCohortSchema.parse(withoutDescription)).not.toThrow();
    });

    it('should reject description more than 10000 characters', () => {
      const longDescription = 'A'.repeat(10001);
      expect(() =>
        createCohortSchema.parse({ ...validData, description: longDescription })
      ).toThrow(/less than 10,000 characters/);
    });

    it('should default status to active', () => {
      const { status, ...withoutStatus } = validData;
      const result = createCohortSchema.parse(withoutStatus);
      expect(result.status).toBe('active');
    });

    it('should accept valid dates', () => {
      const result = createCohortSchema.parse({
        ...validData,
        startDate: '2024-01-15',
        endDate: '2024-12-15',
      });
      expect(result.startDate).toBe('2024-01-15');
      expect(result.endDate).toBe('2024-12-15');
    });

    it('should reject invalid date format', () => {
      expect(() => createCohortSchema.parse({ ...validData, startDate: 'invalid-date' })).toThrow(
        /Invalid date format/
      );
    });

    it('should reject end date before start date', () => {
      expect(() =>
        createCohortSchema.parse({
          ...validData,
          startDate: '2024-12-31',
          endDate: '2024-01-01',
        })
      ).toThrow(/End date must be after start date/);
    });

    it('should accept end date equal to start date', () => {
      expect(() =>
        createCohortSchema.parse({
          ...validData,
          startDate: '2024-06-15',
          endDate: '2024-06-15',
        })
      ).not.toThrow();
    });

    it('should accept optional settings', () => {
      const result = createCohortSchema.parse({
        ...validData,
        settings: { color: 'blue', icon: 'rocket' },
      });
      expect(result.settings).toEqual({ color: 'blue', icon: 'rocket' });
    });
  });

  describe('updateCohortSchema', () => {
    it('should accept partial updates', () => {
      const result = updateCohortSchema.parse({ name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });

    it('should accept empty object', () => {
      expect(() => updateCohortSchema.parse({})).not.toThrow();
    });

    it('should validate memberCount', () => {
      expect(() => updateCohortSchema.parse({ memberCount: -1 })).toThrow(/cannot be negative/);
      expect(() => updateCohortSchema.parse({ memberCount: 1.5 })).toThrow(/must be an integer/);
    });

    it('should validate engagementPercent range', () => {
      expect(() => updateCohortSchema.parse({ engagementPercent: -1 })).toThrow(/at least 0%/);
      expect(() => updateCohortSchema.parse({ engagementPercent: 101 })).toThrow(
        /cannot exceed 100%/
      );
      expect(() => updateCohortSchema.parse({ engagementPercent: 50 })).not.toThrow();
    });

    it('should accept null for nullable fields', () => {
      const result = updateCohortSchema.parse({
        description: null,
        startDate: null,
        endDate: null,
      });
      expect(result.description).toBeNull();
      expect(result.startDate).toBeNull();
      expect(result.endDate).toBeNull();
    });
  });

  describe('cohortQuerySchema', () => {
    it('should use default values', () => {
      const result = cohortQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });

    it('should coerce page and limit to numbers', () => {
      const result = cohortQuerySchema.parse({ page: '2', limit: '50' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should reject invalid page', () => {
      expect(() => cohortQuerySchema.parse({ page: 0 })).toThrow();
      expect(() => cohortQuerySchema.parse({ page: -1 })).toThrow();
    });

    it('should reject limit > 100', () => {
      expect(() => cohortQuerySchema.parse({ limit: 101 })).toThrow();
    });

    it('should accept valid status filter', () => {
      const result = cohortQuerySchema.parse({ status: 'active' });
      expect(result.status).toBe('active');
    });

    it('should accept valid sortBy values', () => {
      expect(() => cohortQuerySchema.parse({ sortBy: 'name' })).not.toThrow();
      expect(() => cohortQuerySchema.parse({ sortBy: 'memberCount' })).not.toThrow();
      expect(() => cohortQuerySchema.parse({ sortBy: 'engagementPercent' })).not.toThrow();
    });

    it('should reject invalid sortBy', () => {
      expect(() => cohortQuerySchema.parse({ sortBy: 'invalidField' })).toThrow();
    });

    it('should trim search query', () => {
      const result = cohortQuerySchema.parse({ search: '  test query  ' });
      expect(result.search).toBe('test query');
    });
  });

  describe('healthTrendsQuerySchema', () => {
    it('should use default values', () => {
      const result = healthTrendsQuerySchema.parse({});
      expect(result.period).toBe('30d');
      expect(result.interval).toBe('day');
    });

    it('should accept valid period values', () => {
      expect(() => healthTrendsQuerySchema.parse({ period: '30d' })).not.toThrow();
      expect(() => healthTrendsQuerySchema.parse({ period: '90d' })).not.toThrow();
      expect(() => healthTrendsQuerySchema.parse({ period: '1y' })).not.toThrow();
    });

    it('should reject invalid period', () => {
      expect(() => healthTrendsQuerySchema.parse({ period: '7d' })).toThrow();
    });

    it('should accept valid interval values', () => {
      expect(() => healthTrendsQuerySchema.parse({ interval: 'day' })).not.toThrow();
      expect(() => healthTrendsQuerySchema.parse({ interval: 'week' })).not.toThrow();
      expect(() => healthTrendsQuerySchema.parse({ interval: 'month' })).not.toThrow();
    });

    it('should reject invalid interval', () => {
      expect(() => healthTrendsQuerySchema.parse({ interval: 'year' })).toThrow();
    });
  });
});
