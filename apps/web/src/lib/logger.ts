/**
 * Structured Logger - Codex v1.2 Section 2.7
 * 
 * Implements JSON structured logging with correlation IDs
 * for distributed tracing and observability.
 */

import { randomUUID } from 'crypto'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogContext {
  correlationId?: string
  userId?: string
  organizationId?: string
  requestId?: string
  path?: string
  method?: string
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  correlationId?: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
}

class Logger {
  private context: LogContext = {}

  /**
   * Set global context that will be included in all log entries
   */
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context }
  }

  /**
   * Clear global context
   */
  clearContext(): void {
    this.context = {}
  }

  /**
   * Generate a new correlation ID for request tracking
   */
  generateCorrelationId(): string {
    return randomUUID()
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    contextOrError?: LogContext | Error,
    error?: Error
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.context.correlationId || this.generateCorrelationId(),
    }

    // Handle context and error parameters
    if (contextOrError instanceof Error) {
      entry.error = {
        name: contextOrError.name,
        message: contextOrError.message,
        stack: contextOrError.stack,
        code: (contextOrError as any).code,
      }
      entry.context = { ...this.context }
    } else if (contextOrError) {
      entry.context = { ...this.context, ...contextOrError }
      if (error) {
        entry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        }
      }
    } else {
      entry.context = { ...this.context }
    }

    // Remove undefined/null values
    const cleanEntry = JSON.parse(JSON.stringify(entry))

    // Output JSON to appropriate stream
    if (level === 'error' || level === 'fatal') {
      console.error(JSON.stringify(cleanEntry))
    } else {
      console.log(JSON.stringify(cleanEntry))
    }
  }

  /**
   * Debug level - verbose information for development
   */
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, context)
    }
  }

  /**
   * Info level - general informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * Warn level - warning messages that don't prevent operation
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * Error level - error conditions that require attention
   */
  error(message: string, errorOrContext?: Error | LogContext, error?: Error): void {
    this.log('error', message, errorOrContext, error)
  }

  /**
   * Fatal level - severe errors causing application failure
   */
  fatal(message: string, errorOrContext?: Error | LogContext, error?: Error): void {
    this.log('fatal', message, errorOrContext, error)
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger()
    childLogger.setContext({ ...this.context, ...context })
    return childLogger
  }
}

// Export singleton instance
export const logger = new Logger()

// Export class for testing
export { Logger }
