/**
 * Tests for Input Validation
 * Codex v1.2 Section 2.5.1
 */

import { describe, it, expect } from 'vitest'
import {
  createMissionSchema,
  updateMissionSchema,
  createGoalSchema,
  validateData,
  paginationSchema,
  emailSchema,
  uuidSchema,
} from '../validation'
import { ValidationError } from '../errors'

describe('Validation Schemas', () => {
  describe('UUID Schema', () => {
    it('should validate valid UUIDs', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000'
      const result = uuidSchema.safeParse(validUuid)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      const invalidUuid = 'not-a-uuid'
      const result = uuidSchema.safeParse(invalidUuid)
      expect(result.success).toBe(false)
    })
  })

  describe('Email Schema', () => {
    it('should validate valid emails', () => {
      const validEmail = 'user@example.com'
      const result = emailSchema.safeParse(validEmail)
      expect(result.success).toBe(true)
    })

    it('should reject invalid emails', () => {
      const invalidEmail = 'not-an-email'
      const result = emailSchema.safeParse(invalidEmail)
      expect(result.success).toBe(false)
    })
  })

  describe('Pagination Schema', () => {
    it('should apply defaults for missing values', () => {
      const result = paginationSchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('should coerce string numbers to integers', () => {
      const result = paginationSchema.parse({ page: '2', limit: '50' })
      expect(result.page).toBe(2)
      expect(result.limit).toBe(50)
    })

    it('should enforce maximum limit of 100', () => {
      const result = paginationSchema.safeParse({ limit: 150 })
      expect(result.success).toBe(false)
    })

    it('should reject negative page numbers', () => {
      const result = paginationSchema.safeParse({ page: -1 })
      expect(result.success).toBe(false)
    })
  })

  describe('Mission Schema', () => {
    it('should validate valid mission data', () => {
      const validMission = {
        title: 'Test Mission',
        description: 'This is a test mission description',
        status: 'planning',
        priority: 'high',
      }

      const result = createMissionSchema.safeParse(validMission)
      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('planning')
      expect(result.data?.priority).toBe('high')
    })

    it('should apply default values', () => {
      const mission = {
        title: 'Minimal Mission',
        description: 'Minimal description here',
      }

      const result = createMissionSchema.parse(mission)
      expect(result.status).toBe('planning')
      expect(result.priority).toBe('medium')
    })

    it('should reject title shorter than 3 characters', () => {
      const invalidMission = {
        title: 'AB',
        description: 'Valid description',
      }

      const result = createMissionSchema.safeParse(invalidMission)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('at least 3 characters')
      }
    })

    it('should reject title longer than 200 characters', () => {
      const invalidMission = {
        title: 'A'.repeat(201),
        description: 'Valid description',
      }

      const result = createMissionSchema.safeParse(invalidMission)
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const invalidMission = {
        title: 'Valid Title',
        description: 'Valid description',
        status: 'invalid-status',
      }

      const result = createMissionSchema.safeParse(invalidMission)
      expect(result.success).toBe(false)
    })

    it('should validate optional fields', () => {
      const missionWithOptionals = {
        title: 'Mission with Optionals',
        description: 'Description here',
        startDate: '2026-02-15T10:00:00Z',
        endDate: '2026-03-15T10:00:00Z',
        assignedTo: ['550e8400-e29b-41d4-a716-446655440000'],
        tags: ['urgent', 'customer-facing'],
      }

      const result = createMissionSchema.safeParse(missionWithOptionals)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID in assignedTo array', () => {
      const invalidMission = {
        title: 'Valid Title',
        description: 'Valid description',
        assignedTo: ['not-a-uuid'],
      }

      const result = createMissionSchema.safeParse(invalidMission)
      expect(result.success).toBe(false)
    })
  })

  describe('Update Mission Schema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        title: 'Updated Title',
      }

      const result = updateMissionSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it('should validate fields that are provided', () => {
      const invalidUpdate = {
        title: 'AB', // Too short
      }

      const result = updateMissionSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })
  })

  describe('Goal Schema', () => {
    it('should validate valid goal data', () => {
      const validGoal = {
        title: 'Test Goal',
        missionId: '550e8400-e29b-41d4-a716-446655440000',
      }

      const result = createGoalSchema.safeParse(validGoal)
      expect(result.success).toBe(true)
    })

    it('should require missionId', () => {
      const invalidGoal = {
        title: 'Test Goal',
      }

      const result = createGoalSchema.safeParse(invalidGoal)
      expect(result.success).toBe(false)
    })

    it('should apply default status', () => {
      const goal = {
        title: 'Test Goal',
        missionId: '550e8400-e29b-41d4-a716-446655440000',
      }

      const result = createGoalSchema.parse(goal)
      expect(result.status).toBe('not_started')
    })
  })
})

describe('validateData', () => {
  it('should validate and return typed data', () => {
    const data = {
      title: 'Test Mission',
      description: 'Test description',
    }

    const result = validateData(createMissionSchema, data)
    expect(result.title).toBe('Test Mission')
    expect(result.status).toBe('planning') // default
  })

  it('should throw ValidationError on invalid data', () => {
    const invalidData = {
      title: 'AB', // Too short
    }

    expect(() => {
      validateData(createMissionSchema, invalidData)
    }).toThrow(ValidationError)
  })

  it('should include field-specific errors', () => {
    const invalidData = {
      title: 'AB',
      status: 'invalid-status',
    }

    try {
      validateData(createMissionSchema, invalidData)
      expect.fail('Should have thrown ValidationError')
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      const validationError = error as ValidationError
      expect(validationError.extensions?.errors).toBeDefined()
      expect(validationError.extensions?.errors).toHaveProperty('title')
      expect(validationError.extensions?.errors).toHaveProperty('status')
    }
  })
})
