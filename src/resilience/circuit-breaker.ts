/**
 * Circuit Breaker System for OnChainAgents
 * Provides fault tolerance and recovery patterns for crypto operations
 * Inspired by SuperClaude's resilience mechanisms
 */

import { EventEmitter } from 'events';

// Circuit breaker states
export enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Failing, reject requests
  HALF_OPEN = 'half_open', // Testing recovery
}

// Circuit breaker configuration
export interface CircuitConfig {
  name: string;
  failureThreshold: number; // Number of failures to open circuit
  successThreshold: number; // Number of successes to close circuit
  timeout: number; // Time before attempting recovery (ms)
  volumeThreshold: number; // Minimum requests before evaluation
  errorThresholdPercentage: number; // Error rate to trigger open
  slowCallDuration: number; // Duration to consider call slow (ms)
  slowCallThreshold: number; // Percentage of slow calls to trigger
  halfOpenRequests: number; // Requests allowed in half-open state
  monitoringPeriod: number; // Rolling window for metrics (ms)
}

// Circuit metrics
export interface CircuitMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  slowRequests: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  averageResponseTime: number;
  errorRate: number;
  state: CircuitState;
  stateChanges: number;
  lastStateChange?: number;
}

// Request result
export interface RequestResult {
  success: boolean;
  duration: number;
  error?: Error;
  fallbackUsed?: boolean;
}

// Recovery strategy
export enum RecoveryStrategy {
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  LINEAR_BACKOFF = 'linear_backoff',
  FIXED_DELAY = 'fixed_delay',
  ADAPTIVE = 'adaptive',
}

// Fallback function type
type FallbackFunction<T> = () => Promise<T> | T;

/**
 * Circuit Breaker
 * Protects system from cascading failures
 */
export class CircuitBreaker<T = any> extends EventEmitter {
  private config: CircuitConfig;
  private state: CircuitState = CircuitState.CLOSED;
  private metrics: CircuitMetrics;
  private requestHistory: Array<{ timestamp: number; success: boolean; duration: number }> = [];
  private halfOpenTestCount: number = 0;
  private nextAttempt?: number;
  private recoveryStrategy: RecoveryStrategy = RecoveryStrategy.EXPONENTIAL_BACKOFF;
  private retryCount: number = 0;
  private fallbackFunction?: FallbackFunction<T>;

  constructor(config: CircuitConfig) {
    super();
    this.config = config;
    this.metrics = this.initializeMetrics();
    this.startMonitoring();
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): CircuitMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      slowRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      state: CircuitState.CLOSED,
      stateChanges: 0,
    };
  }

  /**
   * Start monitoring circuit health
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.evaluateCircuitHealth();
      this.cleanOldHistory();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Execute function with circuit breaker protection
   */
  public async execute(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        // Circuit is open, use fallback or reject
        if (this.fallbackFunction) {
          this.emit('fallback-used', { circuit: this.config.name });
          const result = await this.fallbackFunction();
          this.recordRequest(true, 0, true);
          return result;
        }

        throw new Error(`Circuit breaker ${this.config.name} is OPEN`);
      }
    }

    // Check if half-open limit reached
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenTestCount >= this.config.halfOpenRequests) {
        // Evaluate half-open results
        this.evaluateHalfOpenState();

        // After evaluation, state might have changed to OPEN
        if ((this.state as CircuitState) === CircuitState.OPEN) {
          throw new Error(`Circuit breaker ${this.config.name} is OPEN (half-open test failed)`);
        }
      }
    }

    // Execute the function
    const startTime = Date.now();

    try {
      const result = await this.executeWithTimeout(fn);
      const duration = Date.now() - startTime;

      this.recordRequest(true, duration, false);

      if (this.state === CircuitState.HALF_OPEN) {
        this.halfOpenTestCount++;
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.recordRequest(false, duration, false);

      if (this.state === CircuitState.HALF_OPEN) {
        this.halfOpenTestCount++;
      }

      // Check if we should open the circuit
      this.evaluateCircuitHealth();

      // Try fallback if available
      if (this.fallbackFunction) {
        this.emit('fallback-used', {
          circuit: this.config.name,
          error: error instanceof Error ? error.toString() : String(error),
        });

        try {
          const result = await this.fallbackFunction();
          this.recordRequest(true, 0, true);
          return result;
        } catch (fallbackError) {
          throw new Error(`Both primary and fallback failed: ${fallbackError}`);
        }
      }

      throw error;
    }
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), this.config.slowCallDuration * 2),
      ),
    ]);
  }

  /**
   * Record request result
   */
  private recordRequest(success: boolean, duration: number, fallbackUsed: boolean): void {
    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
      this.metrics.lastSuccessTime = Date.now();
    } else {
      this.metrics.failedRequests++;
      this.metrics.lastFailureTime = Date.now();
    }

    if (duration > this.config.slowCallDuration) {
      this.metrics.slowRequests++;
    }

    // Update average response time
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + duration) /
      this.metrics.totalRequests;

    // Add to history
    this.requestHistory.push({
      timestamp: Date.now(),
      success,
      duration,
    });

    // Calculate error rate
    this.metrics.errorRate = this.metrics.failedRequests / Math.max(1, this.metrics.totalRequests);

    this.emit('request-recorded', {
      circuit: this.config.name,
      success,
      duration,
      fallbackUsed,
      state: this.state,
    });
  }

  /**
   * Evaluate circuit health and transition states
   */
  private evaluateCircuitHealth(): void {
    // Get recent requests within monitoring period
    const recentRequests = this.getRecentRequests();

    if (recentRequests.length < this.config.volumeThreshold) {
      return; // Not enough data
    }

    const failures = recentRequests.filter((r) => !r.success).length;
    const slowCalls = recentRequests.filter(
      (r) => r.duration > this.config.slowCallDuration,
    ).length;

    const errorRate = failures / recentRequests.length;
    const slowCallRate = slowCalls / recentRequests.length;

    // Check if should open circuit
    if (this.state === CircuitState.CLOSED) {
      if (
        failures >= this.config.failureThreshold ||
        errorRate >= this.config.errorThresholdPercentage / 100 ||
        slowCallRate >= this.config.slowCallThreshold / 100
      ) {
        this.transitionToOpen();
      }
    }

    // Check if should close circuit from half-open
    if (this.state === CircuitState.HALF_OPEN) {
      this.evaluateHalfOpenState();
    }
  }

  /**
   * Get recent requests within monitoring period
   */
  private getRecentRequests(): Array<{ timestamp: number; success: boolean; duration: number }> {
    const cutoff = Date.now() - this.config.monitoringPeriod;
    return this.requestHistory.filter((r) => r.timestamp > cutoff);
  }

  /**
   * Clean old history
   */
  private cleanOldHistory(): void {
    const cutoff = Date.now() - this.config.monitoringPeriod * 2;
    this.requestHistory = this.requestHistory.filter((r) => r.timestamp > cutoff);
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.OPEN;
    this.metrics.state = CircuitState.OPEN;
    this.metrics.stateChanges++;
    this.metrics.lastStateChange = Date.now();
    this.halfOpenTestCount = 0;

    // Calculate next attempt time based on recovery strategy
    this.nextAttempt = this.calculateNextAttempt();

    this.emit('state-changed', {
      circuit: this.config.name,
      previousState,
      newState: CircuitState.OPEN,
      reason: 'Failure threshold exceeded',
      nextAttempt: this.nextAttempt,
    });

    this.emit('circuit-opened', {
      circuit: this.config.name,
      metrics: this.metrics,
    });
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.HALF_OPEN;
    this.metrics.state = CircuitState.HALF_OPEN;
    this.metrics.stateChanges++;
    this.metrics.lastStateChange = Date.now();
    this.halfOpenTestCount = 0;

    this.emit('state-changed', {
      circuit: this.config.name,
      previousState,
      newState: CircuitState.HALF_OPEN,
      reason: 'Testing recovery',
    });

    this.emit('circuit-half-open', {
      circuit: this.config.name,
      testRequests: this.config.halfOpenRequests,
    });
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    const previousState = this.state;
    this.state = CircuitState.CLOSED;
    this.metrics.state = CircuitState.CLOSED;
    this.metrics.stateChanges++;
    this.metrics.lastStateChange = Date.now();
    this.halfOpenTestCount = 0;
    this.retryCount = 0; // Reset retry count on successful recovery

    this.emit('state-changed', {
      circuit: this.config.name,
      previousState,
      newState: CircuitState.CLOSED,
      reason: 'Circuit recovered',
    });

    this.emit('circuit-closed', {
      circuit: this.config.name,
      metrics: this.metrics,
    });
  }

  /**
   * Evaluate half-open state
   */
  private evaluateHalfOpenState(): void {
    if (this.halfOpenTestCount < this.config.halfOpenRequests) {
      return; // Not enough test requests
    }

    // Get test request results
    const testRequests = this.requestHistory.slice(-this.config.halfOpenRequests);
    const successes = testRequests.filter((r) => r.success).length;

    if (successes >= this.config.successThreshold) {
      // Recovery successful
      this.transitionToClosed();
    } else {
      // Recovery failed, reopen circuit
      this.retryCount++;
      this.transitionToOpen();
    }
  }

  /**
   * Check if should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.nextAttempt) return false;
    return Date.now() >= this.nextAttempt;
  }

  /**
   * Calculate next attempt time based on strategy
   */
  private calculateNextAttempt(): number {
    const baseTimeout = this.config.timeout;

    switch (this.recoveryStrategy) {
      case RecoveryStrategy.EXPONENTIAL_BACKOFF:
        return Date.now() + baseTimeout * Math.pow(2, Math.min(this.retryCount, 10));

      case RecoveryStrategy.LINEAR_BACKOFF:
        return Date.now() + baseTimeout * (this.retryCount + 1);

      case RecoveryStrategy.FIXED_DELAY:
        return Date.now() + baseTimeout;

      case RecoveryStrategy.ADAPTIVE:
        // Adaptive based on error rate
        const multiplier = Math.ceil(this.metrics.errorRate * 10);
        return Date.now() + baseTimeout * multiplier;

      default:
        return Date.now() + baseTimeout;
    }
  }

  /**
   * Set fallback function
   */
  public setFallback(fallback: FallbackFunction<T>): void {
    this.fallbackFunction = fallback;
  }

  /**
   * Set recovery strategy
   */
  public setRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategy = strategy;
  }

  /**
   * Get current state
   */
  public getState(): CircuitState {
    return this.state;
  }

  /**
   * Get metrics
   */
  public getMetrics(): CircuitMetrics {
    return { ...this.metrics };
  }

  /**
   * Force open circuit (for testing/emergency)
   */
  public forceOpen(): void {
    this.transitionToOpen();
  }

  /**
   * Force close circuit (for testing/recovery)
   */
  public forceClose(): void {
    this.transitionToClosed();
  }

  /**
   * Reset circuit breaker
   */
  public reset(): void {
    this.state = CircuitState.CLOSED;
    this.metrics = this.initializeMetrics();
    this.requestHistory = [];
    this.halfOpenTestCount = 0;
    this.retryCount = 0;
    this.nextAttempt = undefined;

    this.emit('circuit-reset', {
      circuit: this.config.name,
    });
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers for different services
 */
export class CircuitBreakerManager extends EventEmitter {
  private circuits: Map<string, CircuitBreaker> = new Map();
  private globalConfig: Partial<CircuitConfig> = {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000,
    volumeThreshold: 10,
    errorThresholdPercentage: 50,
    slowCallDuration: 5000,
    slowCallThreshold: 50,
    halfOpenRequests: 3,
    monitoringPeriod: 60000,
  };

  constructor() {
    super();
    this.initializeDefaultCircuits();
  }

  /**
   * Initialize default circuits for crypto operations
   */
  private initializeDefaultCircuits(): void {
    // Hive Intelligence circuit
    this.createCircuit('hive', {
      ...this.globalConfig,
      name: 'hive',
      failureThreshold: 3,
      timeout: 60000,
    } as CircuitConfig);

    // Blockchain RPC circuit
    this.createCircuit('rpc', {
      ...this.globalConfig,
      name: 'rpc',
      failureThreshold: 5,
      timeout: 10000,
      slowCallDuration: 3000,
    } as CircuitConfig);

    // DEX API circuit
    this.createCircuit('dex', {
      ...this.globalConfig,
      name: 'dex',
      failureThreshold: 4,
      timeout: 20000,
    } as CircuitConfig);

    // Price Oracle circuit
    this.createCircuit('oracle', {
      ...this.globalConfig,
      name: 'oracle',
      failureThreshold: 2,
      timeout: 5000,
      errorThresholdPercentage: 30,
    } as CircuitConfig);

    // IPFS circuit
    this.createCircuit('ipfs', {
      ...this.globalConfig,
      name: 'ipfs',
      failureThreshold: 10,
      timeout: 120000,
      slowCallDuration: 10000,
    } as CircuitConfig);
  }

  /**
   * Create a new circuit breaker
   */
  public createCircuit<T = any>(name: string, config: CircuitConfig): CircuitBreaker<T> {
    const circuit = new CircuitBreaker<T>(config);

    // Forward events
    circuit.on('state-changed', (data) => {
      this.emit('circuit-state-changed', { ...data, circuit: name });
    });

    circuit.on('circuit-opened', (data) => {
      this.emit('circuit-opened', { ...data, circuit: name });
      this.checkCascadingFailure();
    });

    circuit.on('circuit-closed', (data) => {
      this.emit('circuit-closed', { ...data, circuit: name });
    });

    this.circuits.set(name, circuit);
    return circuit;
  }

  /**
   * Get circuit breaker
   */
  public getCircuit<T = any>(name: string): CircuitBreaker<T> | undefined {
    return this.circuits.get(name) as CircuitBreaker<T>;
  }

  /**
   * Execute with circuit breaker
   */
  public async executeWithCircuit<T>(
    circuitName: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T> | T,
  ): Promise<T> {
    const circuit = this.getCircuit<T>(circuitName);

    if (!circuit) {
      throw new Error(`Circuit ${circuitName} not found`);
    }

    if (fallback) {
      circuit.setFallback(fallback);
    }

    return circuit.execute(fn);
  }

  /**
   * Check for cascading failure
   */
  private checkCascadingFailure(): void {
    const openCircuits = Array.from(this.circuits.values()).filter(
      (c) => c.getState() === CircuitState.OPEN,
    );

    const openPercentage = (openCircuits.length / this.circuits.size) * 100;

    if (openPercentage > 50) {
      this.emit('cascading-failure-detected', {
        openCircuits: openCircuits.length,
        totalCircuits: this.circuits.size,
        percentage: openPercentage,
      });

      // Trigger emergency protocols
      this.triggerEmergencyProtocols();
    }
  }

  /**
   * Trigger emergency protocols
   */
  private triggerEmergencyProtocols(): void {
    this.emit('emergency-protocols-triggered', {
      timestamp: Date.now(),
      action: 'Initiating graceful degradation',
    });

    // Could implement additional emergency measures here
    // - Switch to read-only mode
    // - Activate backup systems
    // - Alert administrators
    // - Scale down operations
  }

  /**
   * Get all circuit states
   */
  public getAllStates(): Map<string, CircuitState> {
    const states = new Map<string, CircuitState>();

    for (const [name, circuit] of this.circuits) {
      states.set(name, circuit.getState());
    }

    return states;
  }

  /**
   * Get all metrics
   */
  public getAllMetrics(): Map<string, CircuitMetrics> {
    const metrics = new Map<string, CircuitMetrics>();

    for (const [name, circuit] of this.circuits) {
      metrics.set(name, circuit.getMetrics());
    }

    return metrics;
  }

  /**
   * Reset all circuits
   */
  public resetAll(): void {
    for (const circuit of this.circuits.values()) {
      circuit.reset();
    }

    this.emit('all-circuits-reset', {
      timestamp: Date.now(),
    });
  }

  /**
   * Get statistics
   */
  public getStatistics(): any {
    const states = this.getAllStates();
    const metrics = this.getAllMetrics();

    let totalRequests = 0;
    let totalFailures = 0;
    let averageErrorRate = 0;

    for (const metric of metrics.values()) {
      totalRequests += metric.totalRequests;
      totalFailures += metric.failedRequests;
      averageErrorRate += metric.errorRate;
    }

    return {
      totalCircuits: this.circuits.size,
      openCircuits: Array.from(states.values()).filter((s) => s === CircuitState.OPEN).length,
      halfOpenCircuits: Array.from(states.values()).filter((s) => s === CircuitState.HALF_OPEN)
        .length,
      closedCircuits: Array.from(states.values()).filter((s) => s === CircuitState.CLOSED).length,
      totalRequests,
      totalFailures,
      averageErrorRate: averageErrorRate / Math.max(1, metrics.size),
      circuitHealth: Array.from(this.circuits.keys()).map((name) => ({
        name,
        state: states.get(name),
        errorRate: metrics.get(name)?.errorRate || 0,
      })),
    };
  }
}

export default CircuitBreakerManager;
