/**
 * Resilience Patterns - Codex v1.2 §2.4
 * 
 * Implements retry, circuit breaker, and timeout patterns
 * for resilient external service calls.
 */

import { logger } from './logger'

// ============================================================================
// Retry Pattern with Exponential Backoff (Codex §2.4.2)
// ============================================================================

export interface RetryOptions {
  attempts?: number      // Number of retry attempts (default: 3)
  delay?: number         // Initial delay in milliseconds (default: 1000)
  maxDelay?: number      // Maximum delay between retries (default: 30000)
  factor?: number        // Exponential backoff factor (default: 2)
  onRetry?: (attempt: number, error: Error) => void
}

/**
 * Retry a function with exponential backoff and jitter
 * 
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Result of the function
 * @throws Last error if all attempts fail
 * 
 * @example
 * const data = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { attempts: 3, delay: 1000 }
 * )
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    attempts = 3,
    delay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry,
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === attempts) {
        // Last attempt failed, throw the error
        throw lastError
      }

      // Calculate exponential backoff with jitter
      const backoffDelay = Math.min(
        delay * Math.pow(factor, attempt - 1),
        maxDelay
      )
      const jitter = Math.random() * 0.3 * backoffDelay // ±30% jitter
      const waitTime = Math.floor(backoffDelay + jitter)

      logger.warn('Retry attempt', {
        attempt,
        totalAttempts: attempts,
        waitTime,
        error: {
          name: lastError.name,
          message: lastError.message,
        },
      })

      onRetry?.(attempt, lastError)

      await sleep(waitTime)
    }
  }

  throw lastError!
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// Circuit Breaker Pattern (Codex §2.4.1)
// ============================================================================

export enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation
  OPEN = 'OPEN',           // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold?: number    // Failures before opening (default: 5)
  successThreshold?: number    // Successes to close from half-open (default: 2)
  timeout?: number             // Time in ms before trying half-open (default: 60000)
  onStateChange?: (state: CircuitState) => void
}

/**
 * Circuit Breaker implementation
 * 
 * Prevents cascading failures by temporarily stopping requests
 * to a failing service.
 * 
 * @example
 * const breaker = new CircuitBreaker({ failureThreshold: 5 })
 * 
 * const result = await breaker.execute(async () => {
 *   return await fetch('https://external-api.com/data')
 * })
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private successCount = 0
  private nextAttempt = Date.now()
  private options: Required<CircuitBreakerOptions>

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      successThreshold: options.successThreshold ?? 2,
      timeout: options.timeout ?? 60000,
      onStateChange: options.onStateChange ?? (() => {}),
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN')
      }
      // Timeout expired, try half-open
      this.setState(CircuitState.HALF_OPEN)
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failureCount = 0

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= this.options.successThreshold) {
        this.setState(CircuitState.CLOSED)
      }
    }
  }

  private onFailure(): void {
    this.failureCount++
    this.successCount = 0

    if (this.failureCount >= this.options.failureThreshold) {
      this.setState(CircuitState.OPEN)
      this.nextAttempt = Date.now() + this.options.timeout
    }
  }

  private setState(state: CircuitState): void {
    if (this.state !== state) {
      logger.info('Circuit breaker state change', {
        from: this.state,
        to: state,
        failureCount: this.failureCount,
        successCount: this.successCount,
      })
      this.state = state
      this.options.onStateChange(state)
    }
  }

  getState(): CircuitState {
    return this.state
  }

  reset(): void {
    this.setState(CircuitState.CLOSED)
    this.failureCount = 0
    this.successCount = 0
  }
}

// ============================================================================
// Timeout Pattern
// ============================================================================

export interface TimeoutOptions {
  timeoutMs?: number
  signal?: AbortSignal
}

/**
 * Execute a function with a timeout
 * 
 * @param fn - Async function to execute
 * @param options - Timeout configuration
 * @returns Result of the function
 * @throws TimeoutError if function exceeds timeout
 * 
 * @example
 * const data = await withTimeout(
 *   () => fetch('https://slow-api.com/data'),
 *   { timeoutMs: 5000 }
 * )
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const { timeoutMs = 30000, signal } = options

  if (signal?.aborted) {
    throw new Error('Operation aborted')
  }

  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`))
      }, timeoutMs)

      signal?.addEventListener('abort', () => {
        clearTimeout(timeoutId)
        reject(new Error('Operation aborted'))
      })
    }),
  ])
}

// ============================================================================
// Bulkhead Pattern (Resource Isolation)
// ============================================================================

/**
 * Semaphore for limiting concurrent operations
 * 
 * Implements bulkhead pattern to prevent resource exhaustion.
 * 
 * @example
 * const semaphore = new Semaphore(3) // Max 3 concurrent operations
 * 
 * await semaphore.acquire(async () => {
 *   // This will only run if < 3 operations are in progress
 *   return await expensiveOperation()
 * })
 */
export class Semaphore {
  private permits: number
  private queue: Array<() => void> = []

  constructor(permits: number) {
    this.permits = permits
  }

  async acquire<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForPermit()
    
    try {
      return await fn()
    } finally {
      this.release()
    }
  }

  private async waitForPermit(): Promise<void> {
    if (this.permits > 0) {
      this.permits--
      return
    }

    return new Promise<void>(resolve => {
      this.queue.push(resolve)
    })
  }

  private release(): void {
    const resolve = this.queue.shift()
    if (resolve) {
      resolve()
    } else {
      this.permits++
    }
  }
}
