/**
 * Rate Limiting Framework for OnChainAgents
 * Provides API rate limiting, request throttling, and resource protection
 */

import { EventEmitter } from 'events';
import { OnChainAgentError, ErrorType, ErrorSeverity } from '../error-handling';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number; // Max requests allowed
  windowMs: number; // Time window in milliseconds
  keyGenerator?: (context: any) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  message?: string; // Custom error message
}

/**
 * Token bucket configuration for more advanced rate limiting
 */
export interface TokenBucketConfig {
  capacity: number; // Maximum tokens in bucket
  refillRate: number; // Tokens per second
  initialTokens?: number; // Starting tokens
}

/**
 * Rate limit entry tracking
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
  lastRequest: number;
}

/**
 * Token bucket for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(config: TokenBucketConfig) {
    this.capacity = config.capacity;
    this.refillRate = config.refillRate;
    this.tokens = config.initialTokens ?? config.capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens
   */
  public tryConsume(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Get current token count
   */
  public getTokens(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Refill tokens based on time passed
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Get time until next token available
   */
  public getWaitTime(): number {
    if (this.tokens >= 1) return 0;

    const tokensNeeded = 1 - this.tokens;
    return (tokensNeeded / this.refillRate) * 1000; // Convert to ms
  }
}

/**
 * Rate Limiter
 */
export class RateLimiter extends EventEmitter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private buckets: Map<string, TokenBucket> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    super();
    this.config = {
      keyGenerator: (ctx) => ctx.ip || 'global',
      message: 'Too many requests, please try again later',
      ...config,
    };

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Check if request is allowed
   */
  public async checkLimit(context: any): Promise<boolean> {
    const key = this.config.keyGenerator!(context);
    const now = Date.now();

    // Get or create entry
    let entry = this.limits.get(key);

    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
        lastRequest: now,
      };
      this.limits.set(key, entry);
    }

    // Check if window has expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.config.windowMs;
      entry.firstRequest = now;
    }

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      const waitTime = entry.resetTime - now;

      this.emit('rate-limit-exceeded', {
        key,
        count: entry.count,
        limit: this.config.maxRequests,
        waitTime,
      });

      throw new OnChainAgentError(
        this.config.message!,
        ErrorType.RATE_LIMIT,
        ErrorSeverity.MEDIUM,
        {
          context: {
            retryAfter: waitTime,
            limit: this.config.maxRequests,
            remaining: 0,
          },
          retryAfter: waitTime,
        },
      );
    }

    // Increment counter
    entry.count++;
    entry.lastRequest = now;

    this.emit('request-allowed', {
      key,
      count: entry.count,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - entry.count,
    });

    return true;
  }

  /**
   * Reset limits for a key
   */
  public resetKey(key: string): void {
    this.limits.delete(key);
    this.buckets.delete(key);
  }

  /**
   * Get current limit status for a key
   */
  public getStatus(key: string): {
    count: number;
    limit: number;
    remaining: number;
    resetTime: number;
  } | null {
    const entry = this.limits.get(key);
    if (!entry) return null;

    return {
      count: entry.count,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      // Clean expired entries
      for (const [key, entry] of this.limits.entries()) {
        if (now > entry.resetTime + this.config.windowMs) {
          this.limits.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }

  /**
   * Stop cleanup interval
   */
  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Advanced Token Bucket Rate Limiter
 */
export class TokenBucketRateLimiter extends EventEmitter {
  private buckets: Map<string, TokenBucket> = new Map();
  private config: TokenBucketConfig;
  private keyGenerator: (context: any) => string;

  constructor(
    config: TokenBucketConfig,
    keyGenerator: (context: any) => string = (ctx) => ctx.ip || 'global',
  ) {
    super();
    this.config = config;
    this.keyGenerator = keyGenerator;
  }

  /**
   * Try to consume tokens for a request
   */
  public async tryConsume(context: any, tokens: number = 1): Promise<boolean> {
    const key = this.keyGenerator(context);

    // Get or create bucket
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = new TokenBucket(this.config);
      this.buckets.set(key, bucket);
    }

    // Try to consume tokens
    const allowed = bucket.tryConsume(tokens);

    if (allowed) {
      this.emit('tokens-consumed', {
        key,
        tokens,
        remaining: bucket.getTokens(),
      });
    } else {
      const waitTime = bucket.getWaitTime();

      this.emit('rate-limit-exceeded', {
        key,
        tokensNeeded: tokens,
        available: bucket.getTokens(),
        waitTime,
      });

      throw new OnChainAgentError(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds`,
        ErrorType.RATE_LIMIT,
        ErrorSeverity.MEDIUM,
        {
          context: {
            tokensNeeded: tokens,
            tokensAvailable: bucket.getTokens(),
          },
          retryAfter: waitTime,
        },
      );
    }

    return allowed;
  }

  /**
   * Get current token count for a key
   */
  public getTokens(key: string): number {
    const bucket = this.buckets.get(key);
    return bucket ? bucket.getTokens() : this.config.capacity;
  }

  /**
   * Reset bucket for a key
   */
  public resetKey(key: string): void {
    this.buckets.delete(key);
  }
}

/**
 * Sliding window rate limiter for more accurate rate limiting
 */
export class SlidingWindowRateLimiter extends EventEmitter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    super();
    this.config = {
      keyGenerator: (ctx) => ctx.ip || 'global',
      message: 'Too many requests, please try again later',
      ...config,
    };
  }

  /**
   * Check if request is allowed
   */
  public async checkLimit(context: any): Promise<boolean> {
    const key = this.config.keyGenerator!(context);
    const now = Date.now();

    // Get or create request list
    let timestamps = this.requests.get(key) || [];

    // Remove old requests outside window
    timestamps = timestamps.filter((ts) => now - ts < this.config.windowMs);

    // Check if limit exceeded
    if (timestamps.length >= this.config.maxRequests) {
      const oldestRequest = timestamps[0];
      const waitTime = this.config.windowMs - (now - oldestRequest);

      this.emit('rate-limit-exceeded', {
        key,
        count: timestamps.length,
        limit: this.config.maxRequests,
        waitTime,
      });

      throw new OnChainAgentError(
        this.config.message!,
        ErrorType.RATE_LIMIT,
        ErrorSeverity.MEDIUM,
        {
          context: {
            retryAfter: waitTime,
            limit: this.config.maxRequests,
            remaining: 0,
          },
          retryAfter: waitTime,
        },
      );
    }

    // Add current request
    timestamps.push(now);
    this.requests.set(key, timestamps);

    this.emit('request-allowed', {
      key,
      count: timestamps.length,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - timestamps.length,
    });

    return true;
  }

  /**
   * Get current status
   */
  public getStatus(key: string): {
    count: number;
    limit: number;
    remaining: number;
  } {
    const timestamps = this.requests.get(key) || [];
    const now = Date.now();
    const activeRequests = timestamps.filter((ts) => now - ts < this.config.windowMs);

    return {
      count: activeRequests.length,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - activeRequests.length),
    };
  }

  /**
   * Reset key
   */
  public resetKey(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * Composite rate limiter combining multiple strategies
 */
export class CompositeRateLimiter extends EventEmitter {
  private limiters: RateLimiter[] = [];

  constructor(configs: RateLimitConfig[]) {
    super();

    // Create rate limiters for each config
    for (const config of configs) {
      const limiter = new RateLimiter(config);

      // Forward events
      limiter.on('rate-limit-exceeded', (data) => {
        this.emit('rate-limit-exceeded', data);
      });

      limiter.on('request-allowed', (data) => {
        this.emit('request-allowed', data);
      });

      this.limiters.push(limiter);
    }
  }

  /**
   * Check all limits
   */
  public async checkLimit(context: any): Promise<boolean> {
    // All limiters must allow the request
    for (const limiter of this.limiters) {
      await limiter.checkLimit(context);
    }

    return true;
  }

  /**
   * Stop all limiters
   */
  public stop(): void {
    for (const limiter of this.limiters) {
      limiter.stop();
    }
  }
}

// Export default configurations
export const defaultRateLimits = {
  global: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
  perUser: {
    maxRequests: 20,
    windowMs: 60000, // 1 minute
  },
  perAgent: {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
  },
  hiveApi: {
    maxRequests: 50,
    windowMs: 60000, // 1 minute
  },
};
