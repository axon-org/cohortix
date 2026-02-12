/**
 * Tests for Rate Limiting
 * Codex v1.2 Section 2.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  createRateLimiter,
  rateLimitStore,
  strictRateLimit,
  standardRateLimit,
  generousRateLimit,
} from '../rate-limit'
import { RateLimitError } from '../errors'

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit store before each test
    rateLimitStore.clear()
  })

  afterEach(() => {
    rateLimitStore.clear()
  })

  describe('Token Bucket Algorithm', () => {
    it('should allow requests within limit', async () => {
      const rateLimiter = createRateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      })

      // Should allow first 5 requests
      for (let i = 0; i < 5; i++) {
        await expect(rateLimiter(request)).resolves.toBeUndefined()
      }
    })

    it('should block requests exceeding limit', async () => {
      const rateLimiter = createRateLimiter({
        maxRequests: 3,
        windowMs: 1000,
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      })

      // Allow first 3 requests
      for (let i = 0; i < 3; i++) {
        await rateLimiter(request)
      }

      // 4th request should be blocked
      await expect(rateLimiter(request)).rejects.toThrow(RateLimitError)
    })

    it('should refill tokens over time', async () => {
      const rateLimiter = createRateLimiter({
        maxRequests: 2,
        windowMs: 100, // 100ms window = fast refill
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      })

      // Use up tokens
      await rateLimiter(request)
      await rateLimiter(request)

      // Should be blocked immediately
      await expect(rateLimiter(request)).rejects.toThrow(RateLimitError)

      // Wait for refill (100ms)
      await new Promise(resolve => setTimeout(resolve, 120))

      // Should allow request again
      await expect(rateLimiter(request)).resolves.toBeUndefined()
    })

    it('should track separate limits for different IPs', async () => {
      const rateLimiter = createRateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      })

      const request1 = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      })

      const request2 = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.2' },
      })

      // Use up tokens for IP1
      await rateLimiter(request1)
      await rateLimiter(request1)
      await expect(rateLimiter(request1)).rejects.toThrow(RateLimitError)

      // IP2 should still have tokens
      await expect(rateLimiter(request2)).resolves.toBeUndefined()
    })
  })

  describe('Custom Key Generator', () => {
    it('should use custom key generator', async () => {
      const rateLimiter = createRateLimiter({
        maxRequests: 2,
        windowMs: 1000,
        keyGenerator: (req) => {
          const userId = req.headers.get('x-user-id')
          return userId ? `user:${userId}` : 'anonymous'
        },
      })

      const request1 = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-user-id': 'user-123' },
      })

      const request2 = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-user-id': 'user-456' },
      })

      // Use up tokens for user-123
      await rateLimiter(request1)
      await rateLimiter(request1)
      await expect(rateLimiter(request1)).rejects.toThrow(RateLimitError)

      // user-456 should still have tokens
      await expect(rateLimiter(request2)).resolves.toBeUndefined()
    })
  })

  describe('Skip Condition', () => {
    it('should skip rate limiting based on condition', async () => {
      const rateLimiter = createRateLimiter({
        maxRequests: 1,
        windowMs: 1000,
        skip: (req) => {
          // Skip for admin users
          return req.headers.get('x-user-role') === 'admin'
        },
      })

      const adminRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-user-role': 'admin' },
      })

      // Should allow unlimited requests for admin
      for (let i = 0; i < 5; i++) {
        await expect(rateLimiter(adminRequest)).resolves.toBeUndefined()
      }
    })

    it('should apply rate limiting for non-skipped requests', async () => {
      const rateLimiter = createRateLimiter({
        maxRequests: 1,
        windowMs: 1000,
        skip: (req) => req.headers.get('x-user-role') === 'admin',
      })

      const userRequest = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-user-role': 'user' },
      })

      // First request allowed
      await rateLimiter(userRequest)

      // Second request blocked
      await expect(rateLimiter(userRequest)).rejects.toThrow(RateLimitError)
    })
  })

  describe('Rate Limit Error', () => {
    it('should include retry-after time', async () => {
      const rateLimiter = createRateLimiter({
        maxRequests: 1,
        windowMs: 1000,
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      })

      // Use up token
      await rateLimiter(request)

      // Get error
      try {
        await rateLimiter(request)
        expect.fail('Should have thrown RateLimitError')
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError)
        const rateLimitError = error as RateLimitError
        expect(rateLimitError.extensions?.retryAfter).toBeDefined()
        expect(typeof rateLimitError.extensions?.retryAfter).toBe('number')
      }
    })
  })

  describe('Preset Configurations', () => {
    it('strictRateLimit should allow 5 requests per minute', () => {
      expect(strictRateLimit.maxRequests).toBe(5)
      expect(strictRateLimit.windowMs).toBe(60000)
    })

    it('standardRateLimit should allow 100 requests per minute', () => {
      expect(standardRateLimit.maxRequests).toBe(100)
      expect(standardRateLimit.windowMs).toBe(60000)
    })

    it('generousRateLimit should allow 300 requests per minute', () => {
      expect(generousRateLimit.maxRequests).toBe(300)
      expect(generousRateLimit.windowMs).toBe(60000)
    })
  })

  describe('IP Address Extraction', () => {
    it('should prefer x-forwarded-for header', async () => {
      const rateLimiter = createRateLimiter({
        maxRequests: 1,
        windowMs: 1000,
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
          'x-real-ip': '172.16.0.1',
        },
      })

      await rateLimiter(request)
      
      // Should use first IP from x-forwarded-for
      // Verify by checking that another request with same IP is blocked
      await expect(rateLimiter(request)).rejects.toThrow(RateLimitError)
    })

    it('should fall back to x-real-ip header', async () => {
      const rateLimiter = createRateLimiter({
        maxRequests: 1,
        windowMs: 1000,
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-real-ip': '172.16.0.1',
        },
      })

      await rateLimiter(request)
      await expect(rateLimiter(request)).rejects.toThrow(RateLimitError)
    })
  })

  describe('Store Cleanup', () => {
    it('should not error when store is cleared', async () => {
      const rateLimiter = createRateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      })

      const request = new NextRequest('http://localhost:3000/api/test')

      await rateLimiter(request)
      rateLimitStore.clear()
      
      // Should work after clear (creates new bucket)
      await expect(rateLimiter(request)).resolves.toBeUndefined()
    })
  })
})
