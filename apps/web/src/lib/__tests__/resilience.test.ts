/**
 * Tests for Resilience Patterns
 * Codex v1.2 Section 2.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  withRetry,
  CircuitBreaker,
  CircuitState,
  withCircuitBreaker,
  withResilientCall,
} from '../resilience'

describe('Retry Pattern', () => {
  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const result = await withRetry(fn)
      
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValue('success')

      const result = await withRetry(fn, {
        maxRetries: 3,
        initialDelayMs: 10,
      })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should throw last error after max retries', async () => {
      const error = new Error('503 Service Unavailable')
      const fn = vi.fn().mockRejectedValue(error)

      await expect(
        withRetry(fn, {
          maxRetries: 2,
          initialDelayMs: 10,
        })
      ).rejects.toThrow('503 Service Unavailable')

      expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should respect isRetryable check', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('400 Bad Request'))

      await expect(
        withRetry(fn, {
          maxRetries: 3,
          initialDelayMs: 10,
          isRetryable: (error) => !error.message.includes('400'),
        })
      ).rejects.toThrow('400 Bad Request')

      expect(fn).toHaveBeenCalledTimes(1) // No retries for non-retryable error
    })

    it('should apply exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue('success')

      const delays: number[] = []

      await withRetry(fn, {
        maxRetries: 2,
        initialDelayMs: 50,
        backoffMultiplier: 2,
        useJitter: false,
        onRetry: (error, attempt, delayMs) => {
          delays.push(delayMs)
        },
      })

      // First retry: 50ms, Second retry: 100ms
      expect(delays[0]).toBeCloseTo(50, -1)
      expect(delays[1]).toBeCloseTo(100, -1)
    })

    it('should add jitter when enabled', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValue('success')

      const delays: number[] = []

      await withRetry(fn, {
        maxRetries: 1,
        initialDelayMs: 100,
        useJitter: true,
        onRetry: (error, attempt, delayMs) => {
          delays.push(delayMs)
        },
      })

      // Jitter should make delay between 75ms and 125ms (±25%)
      expect(delays[0]).toBeGreaterThanOrEqual(75)
      expect(delays[0]).toBeLessThanOrEqual(125)
    })

    it('should respect maxDelayMs cap', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('503'))
        .mockResolvedValue('success')

      const delays: number[] = []

      await withRetry(fn, {
        maxRetries: 1,
        initialDelayMs: 1000,
        backoffMultiplier: 10,
        maxDelayMs: 500,
        useJitter: false,
        onRetry: (error, attempt, delayMs) => {
          delays.push(delayMs)
        },
      })

      // Should cap at 500ms even though exponential backoff would be 1000ms
      expect(delays[0]).toBeLessThanOrEqual(500)
    })

    it('should call onRetry callback', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('ENOTFOUND'))
        .mockResolvedValue('success')

      const onRetry = vi.fn()

      await withRetry(fn, {
        maxRetries: 1,
        initialDelayMs: 10,
        onRetry,
      })

      expect(onRetry).toHaveBeenCalledWith(
        expect.any(Error),
        1,
        expect.any(Number)
      )
    })
  })
})

describe('Circuit Breaker Pattern', () => {
  describe('CircuitBreaker', () => {
    it('should start in CLOSED state', () => {
      const fn = vi.fn().mockResolvedValue('success')
      const breaker = new CircuitBreaker(fn)
      
      expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })

    it('should allow requests in CLOSED state', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const breaker = new CircuitBreaker(fn)

      const result = await breaker.execute()
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should open circuit after failure threshold', async () => {
      const error = new Error('Service error')
      const fn = vi.fn().mockRejectedValue(error)
      const breaker = new CircuitBreaker(fn, {
        failureThreshold: 3,
        resetTimeoutMs: 1000,
      })

      // Fail 3 times to trip circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute()
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN)
    })

    it('should reject requests immediately when OPEN', async () => {
      const error = new Error('Service error')
      const fn = vi.fn().mockRejectedValue(error)
      const breaker = new CircuitBreaker(fn, {
        failureThreshold: 2,
        resetTimeoutMs: 1000,
      })

      // Trip the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute()
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN)

      // Next request should fail immediately without calling fn
      const callsBefore = fn.mock.calls.length
      
      await expect(breaker.execute()).rejects.toThrow('Service temporarily unavailable')
      
      expect(fn).toHaveBeenCalledTimes(callsBefore) // No additional calls
    })

    it('should transition to HALF_OPEN after reset timeout', async () => {
      const error = new Error('Service error')
      const fn = vi.fn().mockRejectedValue(error)
      const breaker = new CircuitBreaker(fn, {
        failureThreshold: 2,
        resetTimeoutMs: 100, // Short timeout for testing
      })

      // Trip the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute()
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN)

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150))

      // Next request should transition to HALF_OPEN and attempt call
      fn.mockResolvedValue('success')
      const result = await breaker.execute()

      expect(result).toBe('success')
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN)
    })

    it('should close circuit after success threshold in HALF_OPEN', async () => {
      const error = new Error('Service error')
      const fn = vi.fn().mockRejectedValue(error)
      const breaker = new CircuitBreaker(fn, {
        failureThreshold: 2,
        resetTimeoutMs: 50,
        successThreshold: 2,
      })

      // Trip the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute()
        } catch (e) {
          // Expected
        }
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 100))

      // Succeed twice to close circuit
      fn.mockResolvedValue('success')
      await breaker.execute() // First success -> HALF_OPEN
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN)

      await breaker.execute() // Second success -> CLOSED
      expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })

    it('should reopen circuit on failure in HALF_OPEN', async () => {
      const error = new Error('Service error')
      const fn = vi.fn().mockRejectedValue(error)
      const breaker = new CircuitBreaker(fn, {
        failureThreshold: 2,
        resetTimeoutMs: 50,
      })

      // Trip the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute()
        } catch (e) {
          // Expected
        }
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 100))

      // Attempt request in HALF_OPEN (will fail)
      try {
        await breaker.execute()
      } catch (e) {
        // Expected
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN)
    })

    it('should reset failure count on success', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValue('success')

      const breaker = new CircuitBreaker(fn, {
        failureThreshold: 3,
      })

      // One failure
      try {
        await breaker.execute()
      } catch (e) {
        // Expected
      }

      // Success should reset counter
      await breaker.execute()

      // Circuit should still be CLOSED
      expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })

    it('should enforce request timeout', async () => {
      const fn = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      const breaker = new CircuitBreaker(fn, {
        requestTimeoutMs: 50,
      })

      await expect(breaker.execute()).rejects.toThrow('Request timeout after 50ms')
    })

    it('should call onStateChange callback', async () => {
      const onStateChange = vi.fn()
      const error = new Error('Service error')
      const fn = vi.fn().mockRejectedValue(error)
      
      const breaker = new CircuitBreaker(fn, {
        failureThreshold: 2,
        onStateChange,
      })

      // Trip the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute()
        } catch (e) {
          // Expected
        }
      }

      expect(onStateChange).toHaveBeenCalledWith(
        CircuitState.CLOSED,
        CircuitState.OPEN
      )
    })

    it('should provide metrics', () => {
      const fn = vi.fn().mockResolvedValue('success')
      const breaker = new CircuitBreaker(fn)

      const metrics = breaker.getMetrics()
      
      expect(metrics).toHaveProperty('state')
      expect(metrics).toHaveProperty('failureCount')
      expect(metrics).toHaveProperty('successCount')
      expect(metrics).toHaveProperty('nextAttemptTime')
    })

    it('should support manual reset', async () => {
      const error = new Error('Service error')
      const fn = vi.fn().mockRejectedValue(error)
      const breaker = new CircuitBreaker(fn, {
        failureThreshold: 2,
      })

      // Trip the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute()
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN)

      // Manual reset
      breaker.reset()

      expect(breaker.getState()).toBe(CircuitState.CLOSED)
      expect(breaker.getMetrics().failureCount).toBe(0)
    })
  })

  describe('withCircuitBreaker', () => {
    it('should create CircuitBreaker instance', () => {
      const fn = vi.fn().mockResolvedValue('success')
      const breaker = withCircuitBreaker(fn)
      
      expect(breaker).toBeInstanceOf(CircuitBreaker)
    })
  })
})

describe('Combined Resilient Call', () => {
  it('should combine retry and circuit breaker', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValue('success')

    const resilientFn = withResilientCall(
      fn,
      { maxRetries: 2, initialDelayMs: 10 },
      { failureThreshold: 5 }
    )

    const result = await resilientFn()
    
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2) // Initial fail + retry success
  })

  it('should open circuit breaker after persistent failures despite retries', async () => {
    const error = new Error('Persistent error')
    const fn = vi.fn().mockRejectedValue(error)

    const resilientFn = withResilientCall(
      fn,
      { maxRetries: 1, initialDelayMs: 10 },
      { failureThreshold: 2, resetTimeoutMs: 1000 }
    )

    // First call: fails after retries
    try {
      await resilientFn()
    } catch (e) {
      // Expected
    }

    // Second call: fails after retries, opens circuit
    try {
      await resilientFn()
    } catch (e) {
      // Expected
    }

    // Third call: should fail immediately (circuit open)
    await expect(resilientFn()).rejects.toThrow('Service temporarily unavailable')
  })
})
