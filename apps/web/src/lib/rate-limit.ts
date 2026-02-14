/**
 * Rate Limiting Middleware - Codex v1.2 Section 2.5
 *
 * Implements token bucket rate limiting for API routes
 * to prevent abuse and ensure fair resource usage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimitError, AppError } from './errors';
import { logger } from './logger';

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Identifier for the rate limit bucket (e.g., IP, user ID)
   */
  keyGenerator?: (request: NextRequest) => string;

  /**
   * Skip rate limiting based on request conditions
   */
  skip?: (request: NextRequest) => boolean;
}

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

/**
 * In-memory rate limit store
 *
 * In production, this should be replaced with Redis or another
 * distributed cache for multi-instance deployments.
 */
class RateLimitStore {
  private store = new Map<string, RateLimitBucket>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  get(key: string): RateLimitBucket | undefined {
    return this.store.get(key);
  }

  set(key: string, bucket: RateLimitBucket): void {
    this.store.set(key, bucket);
  }

  private cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    for (const [key, bucket] of this.store.entries()) {
      if (bucket.lastRefill < oneHourAgo) {
        this.store.delete(key);
      }
    }

    logger.debug('Rate limit store cleanup', {
      remainingKeys: this.store.size,
    });
  }

  clear(): void {
    this.store.clear();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Singleton store instance
const store = new RateLimitStore();

/**
 * Default key generator - uses IP address or user ID from headers
 */
function defaultKeyGenerator(request: NextRequest): string {
  // Try to get user ID from session/auth header
  const userId = request.headers.get('x-user-id');
  if (userId) return `user:${userId}`;

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Token bucket rate limiter
 *
 * Implements the token bucket algorithm:
 * - Bucket starts with maxRequests tokens
 * - Each request consumes 1 token
 * - Bucket refills at rate of (maxRequests / windowMs) tokens per ms
 * - Request is allowed if bucket has at least 1 token
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { maxRequests, windowMs, keyGenerator = defaultKeyGenerator, skip } = config;

  // Calculate refill rate (tokens per millisecond)
  const refillRate = maxRequests / windowMs;

  return async (request: NextRequest): Promise<void> => {
    // Check skip condition
    if (skip && skip(request)) {
      return;
    }

    const key = keyGenerator(request);
    const now = Date.now();

    // Get or create bucket
    let bucket = store.get(key);

    if (!bucket) {
      // New bucket - initialize with full tokens
      bucket = {
        tokens: maxRequests,
        lastRefill: now,
      };
      store.set(key, bucket);
    }

    // Refill tokens based on time elapsed
    const timeSinceRefill = now - bucket.lastRefill;
    const tokensToAdd = timeSinceRefill * refillRate;

    bucket.tokens = Math.min(maxRequests, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if request is allowed
    if (bucket.tokens < 1) {
      const retryAfter = Math.ceil((1 - bucket.tokens) / refillRate / 1000);

      logger.warn('Rate limit exceeded', {
        key,
        remainingTokens: bucket.tokens,
        retryAfter,
      });

      throw new RateLimitError(retryAfter);
    }

    // Consume token
    bucket.tokens -= 1;

    // Update bucket
    store.set(key, bucket);

    logger.debug('Rate limit check passed', {
      key,
      remainingTokens: bucket.tokens,
    });
  };
}

/**
 * Rate limit middleware wrapper for API routes
 *
 * Usage:
 * ```ts
 * export const POST = withRateLimit(
 *   { maxRequests: 10, windowMs: 60000 },
 *   async (request) => {
 *     // Handle request
 *     return NextResponse.json({ success: true })
 *   }
 * )
 * ```
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  const rateLimiter = createRateLimiter(config);

  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      await rateLimiter(request);
      return await handler(request, context);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(error.toProblemDetails(request.nextUrl.pathname), {
          status: 429,
          headers: {
            'Content-Type': 'application/problem+json',
            'Retry-After': String(error.extensions?.retryAfter || 60),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + config.windowMs),
          },
        });
      }
      throw error;
    }
  };
}

// ============================================================================
// Preset Rate Limit Configurations
// ============================================================================

/**
 * Strict rate limit for sensitive operations (auth, payments, etc.)
 * 5 requests per minute
 */
export const strictRateLimit: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Auth rate limit for authentication endpoints
 * 20 requests per minute
 */
export const authRateLimit: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Standard rate limit for most API endpoints
 * 100 requests per minute
 */
export const standardRateLimit: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Generous rate limit for read-only operations
 * 300 requests per minute
 */
export const generousRateLimit: RateLimitConfig = {
  maxRequests: 300,
  windowMs: 60 * 1000, // 1 minute
};

// Export store for testing
export { store as rateLimitStore };

// ============================================================================
// Combined Middleware (Rate Limiting + Error Handling)
// ============================================================================

/**
 * Combined rate limiting and error handling middleware
 *
 * Wraps an API route handler with both rate limiting and RFC 7807 error handling.
 * This is the recommended way to protect API routes.
 *
 * Usage:
 * ```ts
 * import { withMiddleware, standardRateLimit } from '@/lib/rate-limit'
 *
 * export const GET = withMiddleware(standardRateLimit, async (request) => {
 *   // Your handler code
 *   return NextResponse.json({ data: [] })
 * })
 * ```
 */
export function withMiddleware(
  rateLimitConfig: RateLimitConfig,
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  const rateLimiter = createRateLimiter(rateLimitConfig);

  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Apply rate limiting first
      await rateLimiter(request);

      // Then execute the handler
      return await handler(request, context);
    } catch (error) {
      // Handle rate limit errors
      if (error instanceof RateLimitError) {
        return NextResponse.json(error.toProblemDetails(request.nextUrl.pathname), {
          status: 429,
          headers: {
            'Content-Type': 'application/problem+json',
            'Retry-After': String(error.extensions?.retryAfter || 60),
            'X-RateLimit-Limit': String(rateLimitConfig.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + rateLimitConfig.windowMs),
          },
        });
      }

      // Handle all other errors with RFC 7807 format
      const instance = new URL(request.url).pathname;

      // Handle AppError instances (all our custom errors)
      if (error instanceof AppError) {
        const problemDetails = error.toProblemDetails(instance);
        return NextResponse.json(problemDetails, {
          status: error.statusCode,
          headers: {
            'Content-Type': 'application/problem+json',
          },
        });
      }

      // Handle generic Error instances
      if (error instanceof Error) {
        logger.error('Unexpected error', {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          instance,
        });

        return NextResponse.json(
          {
            type: 'https://cohortix.com/errors/internal-server-error',
            title: 'Internal Server Error',
            status: 500,
            detail: error.message,
            instance,
          },
          {
            status: 500,
            headers: {
              'Content-Type': 'application/problem+json',
            },
          }
        );
      }

      // Unknown error type
      logger.error('Unknown error type', {
        error: String(error),
        instance,
      });

      return NextResponse.json(
        {
          type: 'https://cohortix.com/errors/internal-server-error',
          title: 'Internal Server Error',
          status: 500,
          detail: 'An unexpected error occurred',
          instance,
        },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/problem+json',
          },
        }
      );
    }
  };
}
