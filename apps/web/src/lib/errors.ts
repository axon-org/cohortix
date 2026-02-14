/**
 * RFC 7807 Error Handling - Codex v1.2 Section 2.1.4
 *
 * Implements Problem Details for HTTP APIs (RFC 7807)
 * Provides standardized error responses across all API routes.
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly type: string;
  public readonly title: string;
  public readonly detail?: string;
  public readonly extensions?: Record<string, unknown>;

  constructor(
    statusCode: number,
    title: string,
    detail?: string,
    extensions?: Record<string, unknown>
  ) {
    super(detail || title);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.type = `https://cohortix.com/errors/${this.getErrorType(statusCode)}`;
    this.title = title;
    this.detail = detail;
    this.extensions = extensions;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  private getErrorType(statusCode: number): string {
    const types: Record<number, string> = {
      400: 'bad-request',
      401: 'unauthorized',
      403: 'forbidden',
      404: 'not-found',
      409: 'conflict',
      422: 'validation-error',
      429: 'rate-limit-exceeded',
      500: 'internal-server-error',
      503: 'service-unavailable',
    };
    return types[statusCode] || 'unknown-error';
  }

  toProblemDetails(instance?: string): ProblemDetails {
    return {
      type: this.type,
      title: this.title,
      status: this.statusCode,
      detail: this.detail,
      instance,
      ...this.extensions,
    };
  }
}

// Specific error classes
export class BadRequestError extends AppError {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(400, 'Bad Request', detail, extensions);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(detail?: string) {
    super(401, 'Unauthorized', detail || 'Authentication required');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(detail?: string) {
    super(403, 'Forbidden', detail || 'Insufficient permissions');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      404,
      'Resource Not Found',
      id ? `${resource} with id '${id}' not found` : `${resource} not found`
    );
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(detail: string) {
    super(409, 'Conflict', detail);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends AppError {
  constructor(detail: string, errors?: Record<string, string[]>) {
    super(422, 'Validation Error', detail, { errors });
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(429, 'Rate Limit Exceeded', 'Too many requests, please try again later', {
      retryAfter,
    });
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends AppError {
  constructor(detail?: string) {
    super(500, 'Internal Server Error', detail || 'An unexpected error occurred');
    this.name = 'InternalServerError';
  }
}

/**
 * Convert an error to an RFC 7807 Problem Details response
 */
export function errorToResponse(error: unknown, instance?: string): NextResponse {
  if (error instanceof AppError) {
    const problemDetails = error.toProblemDetails(instance);

    // Log error with context
    logger.error(error.title, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      statusCode: error.statusCode,
      instance,
    });

    return NextResponse.json(problemDetails, {
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/problem+json',
      },
    });
  }

  // Handle unknown errors
  const problemDetails: ProblemDetails = {
    type: 'https://cohortix.com/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail: error instanceof Error ? error.message : 'An unexpected error occurred',
    instance,
  };

  // Log unexpected errors
  logger.error('Unexpected error', {
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : { raw: String(error) },
    instance,
  });

  return NextResponse.json(problemDetails, {
    status: 500,
    headers: {
      'Content-Type': 'application/problem+json',
    },
  });
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      const request = args[0] as Request;
      const instance = new URL(request.url).pathname;
      return errorToResponse(error, instance);
    }
  }) as T;
}
