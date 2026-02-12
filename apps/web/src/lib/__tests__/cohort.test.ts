/**
 * Cohort Utility Functions - Unit Tests
 * 
 * Tests for slug generation, engagement calculation, and other utilities.
 */

import { describe, it, expect } from 'vitest'
import {
  generateSlug,
  calculateEngagement,
  formatStatus,
  getCohortHealth,
  isOverdue,
  getDaysRemaining,
} from '../utils/cohort'

describe('Cohort Utilities', () => {
  describe('generateSlug', () => {
    it('should generate lowercase slug from name', () => {
      expect(generateSlug('Spring 2024 Beta')).toBe('spring-2024-beta')
    })

    it('should remove special characters', () => {
      expect(generateSlug('Alpha Pioneers!')).toBe('alpha-pioneers')
    })

    it('should replace multiple spaces with single hyphen', () => {
      expect(generateSlug('Test   Multiple   Spaces')).toBe('test-multiple-spaces')
    })

    it('should trim hyphens from start and end', () => {
      expect(generateSlug('  -test-  ')).toBe('test')
    })

    it('should append suffix when provided', () => {
      expect(generateSlug('Test Cohort', '1234')).toBe('test-cohort-1234')
    })

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('')
    })

    it('should handle only special characters', () => {
      expect(generateSlug('!!@@##')).toBe('')
    })
  })

  describe('calculateEngagement', () => {
    it('should calculate correct engagement percentage', () => {
      expect(calculateEngagement(80, 100)).toBe(80)
    })

    it('should round to 2 decimal places', () => {
      expect(calculateEngagement(33, 100)).toBe(33)
      expect(calculateEngagement(66, 100)).toBe(66)
    })

    it('should return 0 when total is 0', () => {
      expect(calculateEngagement(0, 0)).toBe(0)
    })

    it('should return 0 when active is 0', () => {
      expect(calculateEngagement(0, 100)).toBe(0)
    })

    it('should return 100 when all members are active', () => {
      expect(calculateEngagement(50, 50)).toBe(100)
    })

    it('should handle fractional results', () => {
      expect(calculateEngagement(1, 3)).toBe(33.33)
    })
  })

  describe('formatStatus', () => {
    it('should format active status', () => {
      expect(formatStatus('active')).toBe('Active')
    })

    it('should format paused status', () => {
      expect(formatStatus('paused')).toBe('Paused')
    })

    it('should format at-risk status', () => {
      expect(formatStatus('at-risk')).toBe('At Risk')
    })

    it('should format completed status', () => {
      expect(formatStatus('completed')).toBe('Completed')
    })

    it('should return original value for unknown status', () => {
      expect(formatStatus('unknown')).toBe('unknown')
    })
  })

  describe('getCohortHealth', () => {
    it('should return healthy for >= 70%', () => {
      expect(getCohortHealth(70)).toBe('healthy')
      expect(getCohortHealth(85)).toBe('healthy')
      expect(getCohortHealth(100)).toBe('healthy')
    })

    it('should return warning for 50-69%', () => {
      expect(getCohortHealth(50)).toBe('warning')
      expect(getCohortHealth(60)).toBe('warning')
      expect(getCohortHealth(69)).toBe('warning')
    })

    it('should return at-risk for < 50%', () => {
      expect(getCohortHealth(0)).toBe('at-risk')
      expect(getCohortHealth(25)).toBe('at-risk')
      expect(getCohortHealth(49)).toBe('at-risk')
    })
  })

  describe('isOverdue', () => {
    it('should return false for null end date', () => {
      expect(isOverdue(null)).toBe(false)
    })

    it('should return true for past date', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      expect(isOverdue(pastDate.toISOString())).toBe(true)
    })

    it('should return false for future date', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      expect(isOverdue(futureDate.toISOString())).toBe(false)
    })

    it('should return false for today', () => {
      const today = new Date()
      // Set to end of day to avoid time zone issues
      today.setHours(23, 59, 59, 999)
      expect(isOverdue(today.toISOString())).toBe(false)
    })
  })

  describe('getDaysRemaining', () => {
    it('should return null for null end date', () => {
      expect(getDaysRemaining(null)).toBeNull()
    })

    it('should return positive number for future date', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      const days = getDaysRemaining(futureDate.toISOString())
      expect(days).toBeGreaterThan(0)
      expect(days).toBeLessThanOrEqual(7)
    })

    it('should return negative number for past date', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 7)
      const days = getDaysRemaining(pastDate.toISOString())
      expect(days).toBeLessThan(0)
      expect(days).toBeGreaterThanOrEqual(-7)
    })

    it('should return 0 or 1 for today', () => {
      const today = new Date()
      const days = getDaysRemaining(today.toISOString())
      expect(days).toBeGreaterThanOrEqual(0)
      expect(days).toBeLessThanOrEqual(1)
    })
  })
})
