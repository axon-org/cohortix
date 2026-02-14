import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  errorToResponse,
  withErrorHandler,
} from '../errors';
import { NextResponse } from 'next/server';

describe('AppError', () => {
  it('should create error with correct properties', () => {
    const error = new AppError(404, 'Not Found', 'Resource not found');

    expect(error.statusCode).toBe(404);
    expect(error.title).toBe('Not Found');
    expect(error.detail).toBe('Resource not found');
    expect(error.type).toContain('not-found');
  });

  it('should generate correct error type URL', () => {
    const error = new AppError(400, 'Bad Request');

    expect(error.type).toBe('https://cohortix.com/errors/bad-request');
  });

  it('should convert to Problem Details format', () => {
    const error = new AppError(422, 'Validation Error', 'Invalid input');
    const problemDetails = error.toProblemDetails('/api/users');

    expect(problemDetails).toMatchObject({
      type: 'https://cohortix.com/errors/validation-error',
      title: 'Validation Error',
      status: 422,
      detail: 'Invalid input',
      instance: '/api/users',
    });
  });

  it('should include extensions in Problem Details', () => {
    const error = new AppError(400, 'Bad Request', 'Invalid data', {
      field: 'email',
      reason: 'invalid format',
    });
    const problemDetails = error.toProblemDetails();

    expect(problemDetails.field).toBe('email');
    expect(problemDetails.reason).toBe('invalid format');
  });
});

describe('Specific Error Classes', () => {
  describe('BadRequestError', () => {
    it('should create 400 error', () => {
      const error = new BadRequestError('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.title).toBe('Bad Request');
      expect(error.detail).toBe('Invalid input');
    });

    it('should include extensions', () => {
      const error = new BadRequestError('Invalid input', { field: 'email' });

      expect(error.extensions).toEqual({ field: 'email' });
    });
  });

  describe('UnauthorizedError', () => {
    it('should create 401 error', () => {
      const error = new UnauthorizedError();

      expect(error.statusCode).toBe(401);
      expect(error.title).toBe('Unauthorized');
      expect(error.detail).toBe('Authentication required');
    });

    it('should accept custom detail', () => {
      const error = new UnauthorizedError('Invalid token');

      expect(error.detail).toBe('Invalid token');
    });
  });

  describe('ForbiddenError', () => {
    it('should create 403 error', () => {
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
      expect(error.title).toBe('Forbidden');
      expect(error.detail).toBe('Insufficient permissions');
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error without ID', () => {
      const error = new NotFoundError('User');

      expect(error.statusCode).toBe(404);
      expect(error.detail).toBe('User not found');
    });

    it('should create 404 error with ID', () => {
      const error = new NotFoundError('Mission', 'mission-123');

      expect(error.detail).toBe("Mission with id 'mission-123' not found");
    });
  });

  describe('ConflictError', () => {
    it('should create 409 error', () => {
      const error = new ConflictError('Email already exists');

      expect(error.statusCode).toBe(409);
      expect(error.title).toBe('Conflict');
      expect(error.detail).toBe('Email already exists');
    });
  });

  describe('ValidationError', () => {
    it('should create 422 error', () => {
      const error = new ValidationError('Validation failed');

      expect(error.statusCode).toBe(422);
      expect(error.title).toBe('Validation Error');
    });

    it('should include field errors', () => {
      const errors = {
        email: ['Invalid email format'],
        password: ['Too short', 'Missing special character'],
      };
      const error = new ValidationError('Validation failed', errors);

      expect(error.extensions).toEqual({ errors });
    });
  });

  describe('RateLimitError', () => {
    it('should create 429 error', () => {
      const error = new RateLimitError();

      expect(error.statusCode).toBe(429);
      expect(error.title).toBe('Rate Limit Exceeded');
    });

    it('should include retryAfter', () => {
      const error = new RateLimitError(60);

      expect(error.extensions).toEqual({ retryAfter: 60 });
    });
  });

  describe('InternalServerError', () => {
    it('should create 500 error', () => {
      const error = new InternalServerError();

      expect(error.statusCode).toBe(500);
      expect(error.title).toBe('Internal Server Error');
      expect(error.detail).toBe('An unexpected error occurred');
    });
  });
});

describe('errorToResponse', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should convert AppError to NextResponse', async () => {
    const error = new NotFoundError('Mission', 'mission-123');
    const response = errorToResponse(error, '/api/missions/mission-123');

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body).toMatchObject({
      type: 'https://cohortix.com/errors/not-found',
      title: 'Resource Not Found',
      status: 404,
      instance: '/api/missions/mission-123',
    });

    const contentType = response.headers.get('Content-Type');
    expect(contentType).toBe('application/problem+json');
  });

  it('should handle unknown errors', async () => {
    const error = new Error('Unexpected error');
    const response = errorToResponse(error);

    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body).toMatchObject({
      type: 'https://cohortix.com/errors/internal-server-error',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Unexpected error',
    });
  });

  it('should handle non-Error objects', async () => {
    const response = errorToResponse('Something went wrong');

    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.title).toBe('Internal Server Error');
  });

  it('should log errors', () => {
    const error = new BadRequestError('Invalid input');
    errorToResponse(error);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
    expect(logEntry.level).toBe('error');
  });
});

describe('withErrorHandler', () => {
  it('should catch and handle errors', async () => {
    const handler = withErrorHandler(async (request: Request) => {
      throw new NotFoundError('User');
    });

    const mockRequest = new Request('https://example.com/api/users/123');
    const response = (await handler(mockRequest)) as Response;

    expect(response.status).toBe(404);
    const body = (await response.json()) as any;
    expect(body.title).toBe('Resource Not Found');
  });

  it('should pass through successful responses', async () => {
    const handler = withErrorHandler(async (request: Request) => {
      return NextResponse.json({ success: true });
    });

    const mockRequest = new Request('https://example.com/api/users');
    const response = (await handler(mockRequest)) as Response;

    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.success).toBe(true);
  });

  it('should extract instance from request URL', async () => {
    const handler = withErrorHandler(async (request: Request): Promise<NextResponse> => {
      throw new ForbiddenError();
    });

    const mockRequest = new Request('https://example.com/api/protected');
    const response = await handler(mockRequest);

    const body = await response.json();
    expect(body.instance).toBe('/api/protected');
  });
});
