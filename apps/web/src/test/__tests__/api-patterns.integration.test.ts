/**
 * Integration Tests - API Patterns
 * 
 * Verify standard API patterns and error handling across routes.
 */

import { describe, it, expect } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  errorToResponse,
  withErrorHandler,
} from '@/lib/errors'
import { logger } from '@/lib/logger'

describe('API Route Patterns', () => {
  describe('Error Handling Integration', () => {
    it('should handle validation errors consistently', async () => {
      const handler = withErrorHandler(async (request: Request) => {
        throw new BadRequestError('Invalid input', {
          errors: {
            email: ['Invalid email format'],
          },
        })
      })

      const request = new Request('https://example.com/api/users')
      const response = await handler(request) as Response

      expect(response.status).toBe(400)
      const body = await response.json() as any
      expect(body.type).toContain('bad-request')
      expect(body.errors).toBeDefined()
    })

    it('should handle authentication errors consistently', async () => {
      const handler = withErrorHandler(async (request: Request) => {
        throw new UnauthorizedError('Invalid session')
      })

      const request = new Request('https://example.com/api/protected')
      const response = await handler(request) as Response

      expect(response.status).toBe(401)
      const body = await response.json() as any
      expect(body.title).toBe('Unauthorized')
    })

    it('should handle not found errors consistently', async () => {
      const handler = withErrorHandler(async (request: Request) => {
        throw new NotFoundError('Mission', 'mission-123')
      })

      const request = new Request('https://example.com/api/missions/mission-123')
      const response = await handler(request) as Response

      expect(response.status).toBe(404)
      const body = await response.json() as any
      expect(body.detail).toContain('mission-123')
    })
  })

  describe('Response Format Consistency', () => {
    it('should return RFC 7807 Problem Details format', async () => {
      const error = new NotFoundError('Resource')
      const response = errorToResponse(error, '/api/resource/123')

      const body = await response.json()

      // Verify RFC 7807 required fields
      expect(body).toHaveProperty('type')
      expect(body).toHaveProperty('title')
      expect(body).toHaveProperty('status')
      expect(body).toHaveProperty('instance')

      // Verify content type
      expect(response.headers.get('Content-Type')).toBe('application/problem+json')
    })

    it('should include instance path in error responses', async () => {
      const error = new BadRequestError('Invalid request')
      const response = errorToResponse(error, '/api/missions/create')

      const body = await response.json()
      expect(body.instance).toBe('/api/missions/create')
    })
  })

  describe('Logging Integration', () => {
    it('should generate unique correlation IDs', () => {
      const id1 = logger.generateCorrelationId()
      const id2 = logger.generateCorrelationId()

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('should create child loggers with inherited context', () => {
      logger.setContext({ requestId: 'req-123' })
      const childLogger = logger.child({ userId: 'user-456' })

      expect(childLogger).toBeDefined()

      logger.clearContext()
    })
  })

  describe('Request/Response Patterns', () => {
    it('should handle GET requests with query parameters', () => {
      const request = new Request('https://example.com/api/missions?status=active')
      const url = new URL(request.url)

      expect(url.searchParams.get('status')).toBe('active')
    })

    it('should handle POST requests with JSON body', async () => {
      const body = { title: 'New Mission', status: 'active' }
      const request = new Request('https://example.com/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const parsedBody = await request.json()
      expect(parsedBody).toEqual(body)
    })
  })
})
