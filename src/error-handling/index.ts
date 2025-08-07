/**
 * Global Error Handling Framework for OnChainAgents
 * Provides centralized error handling, recovery, and reporting
 */

import { EventEmitter } from 'events';
import winston from 'winston';

/**
 * Error types for categorization
 */
export enum ErrorType {
  NETWORK = 'network',
  API = 'api',
  VALIDATION = 'validation',
  BLOCKCHAIN = 'blockchain',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  CONFIGURATION = 'configuration',
  INTERNAL = 'internal',
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low', // Log and continue
  MEDIUM = 'medium', // Retry with fallback
  HIGH = 'high', // Alert and degraded mode
  CRITICAL = 'critical', // Stop operation
}

/**
 * Base error class with enhanced metadata
 */
export class OnChainAgentError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: Date;
  public readonly context: Record<string, any>;
  public readonly recoverable: boolean;
  public readonly retryable: boolean;
  public readonly retryCount: number;
  public readonly maxRetries: number;
  public readonly originalError?: Error;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    options?: {
      context?: Record<string, any>;
      recoverable?: boolean;
      retryable?: boolean;
      retryCount?: number;
      maxRetries?: number;
      originalError?: Error;
      retryAfter?: number;
    },
  ) {
    super(message);
    this.name = 'OnChainAgentError';
    this.type = type;
    this.severity = severity;
    this.timestamp = new Date();
    this.context = options?.context || {};
    this.recoverable = options?.recoverable ?? true;
    this.retryable = options?.retryable ?? severity !== ErrorSeverity.CRITICAL;
    this.retryCount = options?.retryCount || 0;
    this.maxRetries = options?.maxRetries || 3;
    this.originalError = options?.originalError;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Specialized error classes
 */
export class NetworkError extends OnChainAgentError {
  constructor(message: string, options?: any) {
    super(message, ErrorType.NETWORK, ErrorSeverity.MEDIUM, {
      ...options,
      retryable: true,
    });
  }
}

export class BlockchainError extends OnChainAgentError {
  constructor(message: string, options?: any) {
    super(message, ErrorType.BLOCKCHAIN, ErrorSeverity.HIGH, options);
  }
}

export class ValidationError extends OnChainAgentError {
  constructor(message: string, options?: any) {
    super(message, ErrorType.VALIDATION, ErrorSeverity.LOW, {
      ...options,
      retryable: false,
    });
  }
}

export class RateLimitError extends OnChainAgentError {
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number, options?: any) {
    super(message, ErrorType.RATE_LIMIT, ErrorSeverity.MEDIUM, {
      ...options,
      retryable: true,
    });
    this.retryAfter = retryAfter;
  }
}

/**
 * Error recovery strategies
 */
export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'circuit_break' | 'degrade' | 'alert';
  execute: (error: OnChainAgentError) => Promise<any>;
}

/**
 * Global Error Handler
 */
export class ErrorHandler extends EventEmitter {
  private logger: winston.Logger;
  private errorCount: Map<ErrorType, number> = new Map();
  private recoveryStrategies: Map<ErrorType, RecoveryStrategy[]> = new Map();
  private circuitBreakerStates: Map<string, boolean> = new Map();

  constructor(logger?: winston.Logger) {
    super();
    this.logger =
      logger ||
      winston.createLogger({
        level: 'error',
        format: winston.format.json(),
        transports: [
          new winston.transports.Console(),
          new winston.transports.File({ filename: 'errors.log' }),
        ],
      });

    this.setupDefaultStrategies();
    this.setupGlobalHandlers();
  }

  /**
   * Setup default recovery strategies
   */
  private setupDefaultStrategies(): void {
    // Network errors: retry with exponential backoff
    this.addRecoveryStrategy(ErrorType.NETWORK, {
      type: 'retry',
      execute: async (error) => {
        const delay = Math.min(1000 * Math.pow(2, error.retryCount), 30000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return { retry: true, delay };
      },
    });

    // Rate limit errors: wait and retry
    this.addRecoveryStrategy(ErrorType.RATE_LIMIT, {
      type: 'retry',
      execute: async (error) => {
        const rateLimitError = error as RateLimitError;
        await new Promise((resolve) => setTimeout(resolve, rateLimitError.retryAfter));
        return { retry: true, delay: rateLimitError.retryAfter };
      },
    });

    // Blockchain errors: fallback to alternative provider
    this.addRecoveryStrategy(ErrorType.BLOCKCHAIN, {
      type: 'fallback',
      execute: async (error) => {
        this.emit('fallback-provider', error.context);
        return { fallback: true };
      },
    });
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.handleCriticalError(
        new OnChainAgentError(
          `Uncaught Exception: ${error.message}`,
          ErrorType.INTERNAL,
          ErrorSeverity.CRITICAL,
          { originalError: error },
        ),
      );
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      this.handleError(
        new OnChainAgentError(
          `Unhandled Promise Rejection: ${reason}`,
          ErrorType.INTERNAL,
          ErrorSeverity.HIGH,
          { context: { reason, promise } },
        ),
      );
    });
  }

  /**
   * Main error handling method
   */
  public async handleError(error: OnChainAgentError): Promise<any> {
    // Log the error
    this.logError(error);

    // Update error count
    const count = (this.errorCount.get(error.type) || 0) + 1;
    this.errorCount.set(error.type, count);

    // Check circuit breaker
    if (this.isCircuitBroken(error.type)) {
      throw new OnChainAgentError(
        'Circuit breaker is open',
        ErrorType.INTERNAL,
        ErrorSeverity.HIGH,
        { originalError: error },
      );
    }

    // Execute recovery strategies
    const strategies = this.recoveryStrategies.get(error.type) || [];
    for (const strategy of strategies) {
      try {
        const result = await strategy.execute(error);
        if (result.retry && error.retryable && error.retryCount < error.maxRetries) {
          // Retry the operation
          this.emit('retry', { error, attempt: error.retryCount + 1 });
          return result;
        }
        if (result.fallback) {
          // Use fallback
          this.emit('fallback', { error });
          return result;
        }
      } catch (strategyError) {
        this.logger.error('Recovery strategy failed', { strategy, error: strategyError });
      }
    }

    // If no recovery possible, emit error event
    this.emit('unrecoverable-error', error);

    // Throw if critical
    if (error.severity === ErrorSeverity.CRITICAL) {
      throw error;
    }

    return null;
  }

  /**
   * Handle critical errors
   */
  private handleCriticalError(error: OnChainAgentError): void {
    this.logger.error('CRITICAL ERROR', {
      type: error.type,
      message: error.message,
      context: error.context,
      stack: error.stack,
    });

    // Emit critical error event
    this.emit('critical-error', error);

    // Initiate graceful shutdown
    this.initiateGracefulShutdown();
  }

  /**
   * Graceful shutdown
   */
  private initiateGracefulShutdown(): void {
    this.logger.info('Initiating graceful shutdown...');

    // Emit shutdown event
    this.emit('shutdown');

    // Give time for cleanup
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: OnChainAgentError): void {
    const logData = {
      type: error.type,
      severity: error.severity,
      message: error.message,
      context: error.context,
      timestamp: error.timestamp,
      stack: error.stack,
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        this.logger.warn('Error occurred', logData);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.error('Error occurred', logData);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        this.logger.error('SEVERE ERROR', logData);
        break;
    }
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitBroken(errorType: ErrorType): boolean {
    const key = `circuit_${errorType}`;
    const errorCount = this.errorCount.get(errorType) || 0;

    // Open circuit if too many errors
    if (errorCount > 10 && !this.circuitBreakerStates.get(key)) {
      this.circuitBreakerStates.set(key, true);

      // Auto-reset after 1 minute
      setTimeout(() => {
        this.circuitBreakerStates.delete(key);
        this.errorCount.set(errorType, 0);
      }, 60000);

      return true;
    }

    return this.circuitBreakerStates.get(key) || false;
  }

  /**
   * Add recovery strategy
   */
  public addRecoveryStrategy(errorType: ErrorType, strategy: RecoveryStrategy): void {
    const strategies = this.recoveryStrategies.get(errorType) || [];
    strategies.push(strategy);
    this.recoveryStrategies.set(errorType, strategies);
  }

  /**
   * Get error statistics
   */
  public getStatistics(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [type, count] of this.errorCount.entries()) {
      stats[type] = count;
    }

    return {
      errorCounts: stats,
      circuitBreakers: Array.from(this.circuitBreakerStates.entries()),
      totalErrors: Array.from(this.errorCount.values()).reduce((a, b) => a + b, 0),
    };
  }
}

/**
 * Error boundary for async operations
 */
export async function withErrorBoundary<T>(
  operation: () => Promise<T>,
  errorHandler: ErrorHandler,
  context?: Record<string, any>,
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const agentError =
      error instanceof OnChainAgentError
        ? error
        : new OnChainAgentError(
            error instanceof Error ? error.message : String(error),
            ErrorType.UNKNOWN,
            ErrorSeverity.MEDIUM,
            { originalError: error as Error, context },
          );

    return await errorHandler.handleError(agentError);
  }
}

/**
 * Retry decorator
 */
export function retry(maxAttempts: number = 3, delay: number = 1000) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;

          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, delay * attempt));
          }
        }
      }

      throw new OnChainAgentError(
        `Failed after ${maxAttempts} attempts: ${lastError}`,
        ErrorType.INTERNAL,
        ErrorSeverity.HIGH,
        { originalError: lastError as Error, context: { attempts: maxAttempts } },
      );
    };

    return descriptor;
  };
}

// Export singleton instance
export const globalErrorHandler = new ErrorHandler();
