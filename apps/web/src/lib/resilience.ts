/**
 * Resilience Patterns - Codex v1.2 Section 2.4
 * 
 * Implements circuit breaker and retry patterns for external service calls
 * to improve system reliability and prevent cascading failures.
 */

import { logger } from './logger'
import { InternalServerError } from './errors'

// ============================================================================
// Types
// ============================================================================

export interface RetryConfig {
  /**
   * Maximum number of retry attempts (0 = no retries)
   */
  maxRetries: number

  /**
   * Initial delay in milliseconds before first retry
   */
  initialDelayMs: number

  /**
   * Maximum delay in milliseconds between retries
   */
  maxDelayMs: number

  /**
   * Exponential backoff multiplier
   */
  backoffMultiplier: number

  /**
   * Whether to add random jitter to delays
   */
  useJitter: boolean

  /**
   * Function to determine if error is retryable
   */
  isRetryable?: (error: Error) => boolean

  /**
   * Callback fired on each retry attempt
   */
  onRetry?: (error: Error, attempt: number, delayMs: number) => void
}

export interface CircuitBreakerConfig {
  /**
   * Number of consecutive failures before opening circuit
   */
  failureThreshold: number

  /**
   * Time in milliseconds before attempting to close circuit
   */
  resetTimeoutMs: number

  /**
   * Number of successful requests needed to fully close circuit
   */
  successThreshold: number

  /**
   * Optional timeout for each request
   */
  requestTimeoutMs?: number

  /**
   * Callback fired when circuit state changes
   */
  onStateChange?: (oldState: CircuitState, newState: CircuitState) => void
}

export enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation
  OPEN = 'OPEN',       // Circuit is open, requests fail immediately
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  useJitter: true,
  isRetryable: (error: Error) => {
    // Retry on network errors and 5xx status codes
    return (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('503') ||
      error.message.includes('504')
    )
  },
}

/**
 * Calculate exponential backoff delay with optional jitter
 */
function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  const exponentialDelay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelayMs
  )

  if (config.useJitter) {
    // Add random jitter ±25%
    const jitter = exponentialDelay * 0.25
    return exponentialDelay + (Math.random() * 2 - 1) * jitter
  }

  return exponentialDelay
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param config - Retry configuration
 * @returns Result of successful function call
 * @throws Last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error = new Error('Unknown error')

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Check if error is retryable
      const isRetryable = finalConfig.isRetryable?.(lastError) ?? true
      
      if (!isRetryable || attempt === finalConfig.maxRetries) {
        logger.error('Operation failed after retries', {
          error: lastError,
          attempts: attempt + 1,
          maxRetries: finalConfig.maxRetries,
        })
        throw lastError
      }

      // Calculate delay for next retry
      const delayMs = calculateDelay(attempt + 1, finalConfig)

      logger.warn('Retrying operation', {
        error: lastError.message,
        attempt: attempt + 1,
        maxRetries: finalConfig.maxRetries,
        delayMs: Math.round(delayMs),
      })

      // Fire onRetry callback
      finalConfig.onRetry?.(lastError, attempt + 1, delayMs)

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  throw lastError
}

// ============================================================================
// Circuit Breaker Pattern
// ============================================================================

/**
 * Circuit breaker implementation
 * 
 * Prevents cascading failures by temporarily blocking requests to failing services
 * and allowing time for recovery.
 */
export class CircuitBreaker<T extends (...args: any[]) => Promise<any>> {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private successCount = 0
  private nextAttemptTime = 0
  private readonly config: CircuitBreakerConfig

  constructor(
    private readonly fn: T,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = {
      failureThreshold: 5,
      resetTimeoutMs: 60000, // 1 minute
      successThreshold: 2,
      ...config,
    }
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute(...args: Parameters<T>): Promise<ReturnType<T>> {
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        logger.warn('Circuit breaker is OPEN', {
          nextAttemptTime: new Date(this.nextAttemptTime).toISOString(),
        })
        throw new InternalServerError('Service temporarily unavailable')
      }

      // Try to transition to HALF_OPEN
      this.transitionTo(CircuitState.HALF_OPEN)
    }

    try {
      // Add timeout if configured
      const result = this.config.requestTimeoutMs
        ? await this.withTimeout(this.fn(...args), this.config.requestTimeoutMs)
        : await this.fn(...args)

      // Record success
      this.onSuccess()
      return result
    } catch (error) {
      // Record failure
      this.onFailure(error as Error)
      throw error
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptTime: this.nextAttemptTime,
    }
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    this.transitionTo(CircuitState.CLOSED)
    this.failureCount = 0
    this.successCount = 0
    this.nextAttemptTime = 0
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.failureCount = 0

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++

      if (this.successCount >= this.config.successThreshold) {
        logger.info('Circuit breaker closing after successful requests', {
          successCount: this.successCount,
        })
        this.transitionTo(CircuitState.CLOSED)
        this.successCount = 0
      }
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(error: Error): void {
    this.failureCount++
    this.successCount = 0

    logger.warn('Circuit breaker recorded failure', {
      failureCount: this.failureCount,
      threshold: this.config.failureThreshold,
      state: this.state,
      error: error.message,
    })

    if (
      this.state === CircuitState.HALF_OPEN ||
      this.failureCount >= this.config.failureThreshold
    ) {
      this.transitionTo(CircuitState.OPEN)
      this.nextAttemptTime = Date.now() + this.config.resetTimeoutMs

      logger.error('Circuit breaker opened', {
        failureCount: this.failureCount,
        nextAttemptTime: new Date(this.nextAttemptTime).toISOString(),
      })
    }
  }

  /**
   * Transition to new circuit state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state
    this.state = newState

    if (oldState !== newState) {
      logger.info('Circuit breaker state changed', {
        oldState,
        newState,
      })
      this.config.onStateChange?.(oldState, newState)
    }
  }

  /**
   * Add timeout to promise
   */
  private async withTimeout<R>(
    promise: Promise<R>,
    timeoutMs: number
  ): Promise<R> {
    return Promise.race([
      promise,
      new Promise<R>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ])
  }
}

/**
 * Create a circuit breaker wrapper for a function
 * 
 * Usage:
 * ```ts
 * const fetchUserData = withCircuitBreaker(
 *   async (userId: string) => {
 *     return await supabase.from('users').select('*').eq('id', userId)
 *   },
 *   { failureThreshold: 5, resetTimeoutMs: 60000 }
 * )
 * ```
 */
export function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: Partial<CircuitBreakerConfig> = {}
): CircuitBreaker<T> {
  return new CircuitBreaker(fn, config)
}

// ============================================================================
// Combined Retry + Circuit Breaker
// ============================================================================

/**
 * Combine retry and circuit breaker patterns
 * 
 * Retries individual requests with exponential backoff,
 * while circuit breaker prevents overwhelming a failing service.
 * 
 * @param fn - Function to protect
 * @param retryConfig - Retry configuration
 * @param breakerConfig - Circuit breaker configuration
 */
export function withResilientCall<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  retryConfig: Partial<RetryConfig> = {},
  breakerConfig: Partial<CircuitBreakerConfig> = {}
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const breaker = new CircuitBreaker(fn, breakerConfig)

  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return withRetry(() => breaker.execute(...args), retryConfig)
  }
}
