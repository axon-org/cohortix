import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Logger, logger, type LogLevel, type LogContext } from '../logger'

describe('Logger', () => {
  let testLogger: Logger
  let consoleLogSpy: any
  let consoleErrorSpy: any

  beforeEach(() => {
    testLogger = new Logger()
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    testLogger.clearContext()
  })

  describe('Basic Logging', () => {
    it('should log info message with correct structure', () => {
      testLogger.info('Test message')

      expect(consoleLogSpy).toHaveBeenCalledOnce()
      const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(logEntry).toMatchObject({
        level: 'info',
        message: 'Test message',
      })
      expect(logEntry.timestamp).toBeDefined()
      expect(logEntry.correlationId).toBeDefined()
    })

    it('should log error message to console.error', () => {
      testLogger.error('Error occurred')

      expect(consoleErrorSpy).toHaveBeenCalledOnce()
      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0])

      expect(logEntry.level).toBe('error')
      expect(logEntry.message).toBe('Error occurred')
    })

    it('should log with all log levels', () => {
      const levels: LogLevel[] = ['info', 'warn', 'error', 'fatal']

      levels.forEach((level) => {
        testLogger[level]('Test message')
      })

      expect(consoleLogSpy).toHaveBeenCalledTimes(2) // info, warn
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2) // error, fatal
    })
  })

  describe('Context Handling', () => {
    it('should include context in log entries', () => {
      const context: LogContext = {
        userId: 'user-123',
        requestId: 'req-456',
      }

      testLogger.info('Test with context', context)

      const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0])
      expect(logEntry.context).toMatchObject(context)
    })

    it('should persist global context', () => {
      testLogger.setContext({ userId: 'user-123' })

      testLogger.info('First message')
      testLogger.info('Second message')

      const firstLog = JSON.parse(consoleLogSpy.mock.calls[0][0])
      const secondLog = JSON.parse(consoleLogSpy.mock.calls[1][0])

      expect(firstLog.context.userId).toBe('user-123')
      expect(secondLog.context.userId).toBe('user-123')
    })

    it('should merge global and local context', () => {
      testLogger.setContext({ userId: 'user-123' })

      testLogger.info('Test', { requestId: 'req-456' })

      const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0])
      expect(logEntry.context).toMatchObject({
        userId: 'user-123',
        requestId: 'req-456',
      })
    })

    it('should clear context', () => {
      testLogger.setContext({ userId: 'user-123' })
      testLogger.clearContext()

      testLogger.info('Test')

      const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0])
      expect(logEntry.context).toEqual({})
    })
  })

  describe('Error Logging', () => {
    it('should log error object with stack trace', () => {
      const error = new Error('Test error')

      testLogger.error('Error occurred', error)

      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      expect(logEntry.error).toMatchObject({
        name: 'Error',
        message: 'Test error',
      })
      expect(logEntry.error.stack).toBeDefined()
    })

    it('should log error with context', () => {
      const error = new Error('Test error')
      const context: LogContext = { userId: 'user-123' }

      testLogger.error('Error occurred', context, error)

      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      expect(logEntry.context.userId).toBe('user-123')
      expect(logEntry.error.message).toBe('Test error')
    })

    it('should handle error with custom code', () => {
      const error = new Error('Database error') as any
      error.code = 'DB_CONNECTION_FAILED'

      testLogger.error('Database error occurred', error)

      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0])
      expect(logEntry.error.code).toBe('DB_CONNECTION_FAILED')
    })
  })

  describe('Correlation ID', () => {
    it('should generate correlation ID for each log', () => {
      testLogger.info('Message 1')
      testLogger.info('Message 2')

      const log1 = JSON.parse(consoleLogSpy.mock.calls[0][0])
      const log2 = JSON.parse(consoleLogSpy.mock.calls[1][0])

      expect(log1.correlationId).toBeDefined()
      expect(log2.correlationId).toBeDefined()
    })

    it('should use correlation ID from context', () => {
      const correlationId = 'corr-123'
      testLogger.setContext({ correlationId })

      testLogger.info('Test message')

      const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0])
      expect(logEntry.correlationId).toBe(correlationId)
    })

    it('should generate valid UUID for correlation ID', () => {
      const correlationId = testLogger.generateCorrelationId()
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      expect(correlationId).toMatch(uuidRegex)
    })
  })

  describe('Child Logger', () => {
    it('should create child logger with inherited context', () => {
      testLogger.setContext({ userId: 'user-123' })
      const child = testLogger.child({ requestId: 'req-456' })

      child.info('Child message')

      const logEntry = JSON.parse(consoleLogSpy.mock.calls[0][0])
      expect(logEntry.context).toMatchObject({
        userId: 'user-123',
        requestId: 'req-456',
      })
    })

    it('should not affect parent logger context', () => {
      testLogger.setContext({ userId: 'user-123' })
      const child = testLogger.child({ requestId: 'req-456' })

      child.info('Child message')
      testLogger.info('Parent message')

      const childLog = JSON.parse(consoleLogSpy.mock.calls[0][0])
      const parentLog = JSON.parse(consoleLogSpy.mock.calls[1][0])

      expect(childLog.context.requestId).toBe('req-456')
      expect(parentLog.context.requestId).toBeUndefined()
    })
  })

  describe('Debug Logging', () => {
    it('should only log debug in development mode', () => {
      // Test production mode - debug should not log
      vi.stubEnv('NODE_ENV', 'production')
      testLogger.debug('Debug message')
      expect(consoleLogSpy).not.toHaveBeenCalled()

      // Clear the spy
      consoleLogSpy.mockClear()

      // Test development mode - debug should log
      vi.stubEnv('NODE_ENV', 'development')
      testLogger.debug('Debug message')
      expect(consoleLogSpy).toHaveBeenCalled()

      // Clean up
      vi.unstubAllEnvs()
    })
  })

  describe('Singleton Logger', () => {
    it('should export singleton instance', () => {
      expect(logger).toBeInstanceOf(Logger)
    })
  })
})
