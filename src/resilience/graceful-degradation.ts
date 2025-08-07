/**
 * Graceful Degradation System for OnChainAgents
 * Implements 3-level degradation matching SuperClaude's resilience patterns
 * Ensures system stability during resource constraints and failures
 */

import { EventEmitter } from 'events';
import { ResourceZone, ResourceZoneManager } from '../orchestrator/resource-zones';
import { CircuitBreakerManager, CircuitState } from './circuit-breaker';
import {
  MultiSourceCoordinator,
  DataSourceType,
  AggregationStrategy,
} from '../coordination/multi-source';

// Degradation levels
export enum DegradationLevel {
  NORMAL = 'normal', // Full functionality
  LEVEL1 = 'level1', // Reduce verbosity, skip optional enhancements
  LEVEL2 = 'level2', // Disable advanced features, simplify operations
  LEVEL3 = 'level3', // Essential operations only, maximum compression
}

// Degradation trigger
export interface DegradationTrigger {
  type: 'resource' | 'circuit' | 'error_rate' | 'latency' | 'manual';
  threshold: number;
  condition: (metrics: SystemMetrics) => boolean;
  level: DegradationLevel;
  priority: number;
}

// System metrics
export interface SystemMetrics {
  resourceUsage: number;
  errorRate: number;
  averageLatency: number;
  openCircuits: number;
  totalCircuits: number;
  failedRequests: number;
  totalRequests: number;
  tokenUsage: number;
  memoryUsage: number;
  cpuUsage: number;
}

// Feature flags for degradation
export interface FeatureFlags {
  // Level 1 - Reduce
  verboseLogging: boolean;
  detailedAnalytics: boolean;
  optionalEnhancements: boolean;
  caching: boolean;

  // Level 2 - Disable
  advancedFeatures: boolean;
  parallelProcessing: boolean;
  deepAnalysis: boolean;
  multiSourceAggregation: boolean;

  // Level 3 - Essential only
  nonCriticalOperations: boolean;
  backgroundTasks: boolean;
  enrichment: boolean;
  validation: boolean;
}

// Degradation configuration
export interface DegradationConfig {
  triggers: DegradationTrigger[];
  recoveryThresholds: Map<DegradationLevel, number>;
  cooldownPeriod: number;
  escalationDelay: number;
  autoRecovery: boolean;
}

// Operation priority
export enum OperationPriority {
  CRITICAL = 'critical', // Never skip
  HIGH = 'high', // Skip only in Level 3
  MEDIUM = 'medium', // Skip in Level 2-3
  LOW = 'low', // Skip in Level 1-3
}

// Operation filter
export interface OperationFilter {
  priority: OperationPriority;
  canDegrade: boolean;
  fallbackStrategy?: string;
  minimumLevel: DegradationLevel;
}

/**
 * Graceful Degradation Manager
 * Manages system degradation and recovery
 */
export class GracefulDegradationManager extends EventEmitter {
  private currentLevel: DegradationLevel = DegradationLevel.NORMAL;
  private resourceManager: ResourceZoneManager;
  private circuitManager: CircuitBreakerManager;
  private multiSourceCoordinator: MultiSourceCoordinator;

  private config: DegradationConfig;
  private featureFlags: FeatureFlags;
  private metrics: SystemMetrics;
  private degradationHistory: Array<{
    timestamp: number;
    fromLevel: DegradationLevel;
    toLevel: DegradationLevel;
    trigger: string;
    metrics: SystemMetrics;
  }> = [];

  private lastDegradation?: number;
  private lastRecovery?: number;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(
    resourceManager: ResourceZoneManager,
    circuitManager: CircuitBreakerManager,
    multiSourceCoordinator: MultiSourceCoordinator,
  ) {
    super();
    this.resourceManager = resourceManager;
    this.circuitManager = circuitManager;
    this.multiSourceCoordinator = multiSourceCoordinator;

    this.config = this.initializeConfig();
    this.featureFlags = this.initializeFeatureFlags();
    this.metrics = this.initializeMetrics();

    this.startMonitoring();
  }

  /**
   * Initialize configuration
   */
  private initializeConfig(): DegradationConfig {
    const triggers: DegradationTrigger[] = [
      // Resource-based triggers
      {
        type: 'resource',
        threshold: 75,
        condition: (m) => m.resourceUsage > 75,
        level: DegradationLevel.LEVEL1,
        priority: 1,
      },
      {
        type: 'resource',
        threshold: 85,
        condition: (m) => m.resourceUsage > 85,
        level: DegradationLevel.LEVEL2,
        priority: 2,
      },
      {
        type: 'resource',
        threshold: 95,
        condition: (m) => m.resourceUsage > 95,
        level: DegradationLevel.LEVEL3,
        priority: 3,
      },

      // Circuit breaker triggers
      {
        type: 'circuit',
        threshold: 30,
        condition: (m) => m.openCircuits / m.totalCircuits > 0.3,
        level: DegradationLevel.LEVEL1,
        priority: 1,
      },
      {
        type: 'circuit',
        threshold: 50,
        condition: (m) => m.openCircuits / m.totalCircuits > 0.5,
        level: DegradationLevel.LEVEL2,
        priority: 2,
      },
      {
        type: 'circuit',
        threshold: 70,
        condition: (m) => m.openCircuits / m.totalCircuits > 0.7,
        level: DegradationLevel.LEVEL3,
        priority: 3,
      },

      // Error rate triggers
      {
        type: 'error_rate',
        threshold: 10,
        condition: (m) => m.errorRate > 10,
        level: DegradationLevel.LEVEL1,
        priority: 1,
      },
      {
        type: 'error_rate',
        threshold: 25,
        condition: (m) => m.errorRate > 25,
        level: DegradationLevel.LEVEL2,
        priority: 2,
      },
      {
        type: 'error_rate',
        threshold: 50,
        condition: (m) => m.errorRate > 50,
        level: DegradationLevel.LEVEL3,
        priority: 3,
      },

      // Latency triggers
      {
        type: 'latency',
        threshold: 5000,
        condition: (m) => m.averageLatency > 5000,
        level: DegradationLevel.LEVEL1,
        priority: 1,
      },
      {
        type: 'latency',
        threshold: 10000,
        condition: (m) => m.averageLatency > 10000,
        level: DegradationLevel.LEVEL2,
        priority: 2,
      },
      {
        type: 'latency',
        threshold: 20000,
        condition: (m) => m.averageLatency > 20000,
        level: DegradationLevel.LEVEL3,
        priority: 3,
      },
    ];

    const recoveryThresholds = new Map<DegradationLevel, number>([
      [DegradationLevel.LEVEL1, 60], // Recover when metrics < 60%
      [DegradationLevel.LEVEL2, 70], // Recover when metrics < 70%
      [DegradationLevel.LEVEL3, 80], // Recover when metrics < 80%
    ]);

    return {
      triggers,
      recoveryThresholds,
      cooldownPeriod: 60000, // 1 minute cooldown
      escalationDelay: 30000, // 30 seconds before escalation
      autoRecovery: true,
    };
  }

  /**
   * Initialize feature flags
   */
  private initializeFeatureFlags(): FeatureFlags {
    return {
      // All enabled by default
      verboseLogging: true,
      detailedAnalytics: true,
      optionalEnhancements: true,
      caching: true,
      advancedFeatures: true,
      parallelProcessing: true,
      deepAnalysis: true,
      multiSourceAggregation: true,
      nonCriticalOperations: true,
      backgroundTasks: true,
      enrichment: true,
      validation: true,
    };
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): SystemMetrics {
    return {
      resourceUsage: 0,
      errorRate: 0,
      averageLatency: 0,
      openCircuits: 0,
      totalCircuits: 0,
      failedRequests: 0,
      totalRequests: 0,
      tokenUsage: 0,
      memoryUsage: 0,
      cpuUsage: 0,
    };
  }

  /**
   * Start monitoring system health
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.evaluateDegradation();

      if (this.config.autoRecovery) {
        this.evaluateRecovery();
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Update system metrics
   */
  private updateMetrics(): void {
    // Get resource metrics
    const resourceZone = this.resourceManager.getCurrentZone();
    const resourceUsage = this.mapZoneToUsage(resourceZone);

    // Get circuit metrics
    const circuitStates = this.circuitManager.getAllStates();
    const openCircuits = Array.from(circuitStates.values()).filter(
      (state) => state === CircuitState.OPEN,
    ).length;

    // Get source health
    const sourceHealth = this.multiSourceCoordinator.getSourceHealth();
    const unhealthySources = Array.from(sourceHealth.values()).filter(
      (h) => h.status === 'unhealthy' || h.status === 'offline',
    ).length;

    // Update metrics
    this.metrics = {
      ...this.metrics,
      resourceUsage,
      openCircuits,
      totalCircuits: circuitStates.size,
      errorRate: this.calculateErrorRate(),
      averageLatency: this.calculateAverageLatency(),
      tokenUsage: this.resourceManager.getMetrics().tokenUsage,
      memoryUsage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
      cpuUsage: this.estimateCpuUsage(),
    };

    this.emit('metrics-updated', this.metrics);
  }

  /**
   * Evaluate if degradation is needed
   */
  private evaluateDegradation(): void {
    // Check cooldown
    if (this.lastDegradation && Date.now() - this.lastDegradation < this.config.cooldownPeriod) {
      return;
    }

    // Sort triggers by priority
    const triggers = this.config.triggers.sort((a, b) => b.priority - a.priority);

    // Find highest priority trigger that's active
    for (const trigger of triggers) {
      if (trigger.condition(this.metrics)) {
        // Check if we need to degrade further
        if (this.shouldDegrade(trigger.level)) {
          this.degradeToLevel(trigger.level, trigger.type);
          break;
        }
      }
    }
  }

  /**
   * Evaluate if recovery is possible
   */
  private evaluateRecovery(): void {
    if (this.currentLevel === DegradationLevel.NORMAL) return;

    // Check cooldown
    if (this.lastRecovery && Date.now() - this.lastRecovery < this.config.cooldownPeriod) {
      return;
    }

    // Check if metrics have improved
    const threshold = this.config.recoveryThresholds.get(this.currentLevel) || 60;

    const canRecover =
      this.metrics.resourceUsage < threshold &&
      this.metrics.errorRate < threshold / 10 &&
      this.metrics.openCircuits / Math.max(1, this.metrics.totalCircuits) < threshold / 100;

    if (canRecover) {
      this.recoverOneLevel();
    }
  }

  /**
   * Check if should degrade to target level
   */
  private shouldDegrade(targetLevel: DegradationLevel): boolean {
    const levelOrder = [
      DegradationLevel.NORMAL,
      DegradationLevel.LEVEL1,
      DegradationLevel.LEVEL2,
      DegradationLevel.LEVEL3,
    ];

    const currentIndex = levelOrder.indexOf(this.currentLevel);
    const targetIndex = levelOrder.indexOf(targetLevel);

    return targetIndex > currentIndex;
  }

  /**
   * Degrade to specific level
   */
  private degradeToLevel(level: DegradationLevel, trigger: string): void {
    const previousLevel = this.currentLevel;
    this.currentLevel = level;
    this.lastDegradation = Date.now();

    // Apply degradation
    this.applyDegradation(level);

    // Record history
    this.degradationHistory.push({
      timestamp: Date.now(),
      fromLevel: previousLevel,
      toLevel: level,
      trigger,
      metrics: { ...this.metrics },
    });

    // Emit event
    this.emit('degradation-applied', {
      previousLevel,
      currentLevel: level,
      trigger,
      features: this.featureFlags,
    });

    // Log warning
    this.emit('degradation-warning', {
      level,
      message: `System degraded to ${level} due to ${trigger}`,
      metrics: this.metrics,
    });
  }

  /**
   * Apply degradation settings
   */
  private applyDegradation(level: DegradationLevel): void {
    switch (level) {
      case DegradationLevel.LEVEL1:
        this.applyLevel1Degradation();
        break;
      case DegradationLevel.LEVEL2:
        this.applyLevel2Degradation();
        break;
      case DegradationLevel.LEVEL3:
        this.applyLevel3Degradation();
        break;
      default:
        this.applyNormalOperation();
    }
  }

  /**
   * Apply Level 1 degradation
   * Reduce verbosity, skip optional enhancements, use cached results
   */
  private applyLevel1Degradation(): void {
    this.featureFlags = {
      ...this.featureFlags,
      verboseLogging: false,
      detailedAnalytics: false,
      optionalEnhancements: false,
      caching: true, // Keep caching enabled
    };

    // Configure systems for Level 1
    this.multiSourceCoordinator.setAggregationStrategy(AggregationStrategy.FIRST_SUCCESS);
    // Compression would be enabled here if the method existed

    this.emit('level1-degradation', {
      disabled: ['verbose_logging', 'detailed_analytics', 'optional_enhancements'],
      strategy: 'reduce_and_cache',
    });
  }

  /**
   * Apply Level 2 degradation
   * Disable advanced features, simplify operations, batch aggressively
   */
  private applyLevel2Degradation(): void {
    // Include Level 1 degradations
    this.applyLevel1Degradation();

    this.featureFlags = {
      ...this.featureFlags,
      advancedFeatures: false,
      parallelProcessing: false,
      deepAnalysis: false,
      multiSourceAggregation: false,
    };

    // Configure systems for Level 2
    this.multiSourceCoordinator.setAggregationStrategy(AggregationStrategy.FALLBACK);
    this.circuitManager.getAllStates().forEach((state, name) => {
      const circuit = this.circuitManager.getCircuit(name);
      if (circuit) {
        circuit.setRecoveryStrategy('fixed_delay' as any);
      }
    });

    this.emit('level2-degradation', {
      disabled: [
        'advanced_features',
        'parallel_processing',
        'deep_analysis',
        'multi_source_aggregation',
      ],
      strategy: 'simplify_and_serialize',
    });
  }

  /**
   * Apply Level 3 degradation
   * Essential operations only, maximum compression, queue non-critical
   */
  private applyLevel3Degradation(): void {
    // Include Level 2 degradations
    this.applyLevel2Degradation();

    this.featureFlags = {
      ...this.featureFlags,
      nonCriticalOperations: false,
      backgroundTasks: false,
      enrichment: false,
      validation: false,
    };

    // Configure systems for Level 3
    this.multiSourceCoordinator.setAggregationStrategy(AggregationStrategy.FALLBACK);

    // Force single source mode
    const hiveHealth = this.multiSourceCoordinator.getSourceHealth().get(DataSourceType.HIVE);
    if (hiveHealth && hiveHealth.status === 'healthy') {
      // Use only Hive if healthy
    } else {
      // Use first available fallback
    }

    this.emit('level3-degradation', {
      disabled: ['non_critical_operations', 'background_tasks', 'enrichment', 'validation'],
      strategy: 'essential_only',
      mode: 'survival',
    });
  }

  /**
   * Apply normal operation
   */
  private applyNormalOperation(): void {
    this.featureFlags = this.initializeFeatureFlags();

    // Restore normal configuration
    this.multiSourceCoordinator.setAggregationStrategy(AggregationStrategy.WEIGHTED);
    // Compression would be disabled here if the method existed

    this.emit('normal-operation', {
      allFeaturesEnabled: true,
    });
  }

  /**
   * Recover one level
   */
  private recoverOneLevel(): void {
    const levelOrder = [
      DegradationLevel.NORMAL,
      DegradationLevel.LEVEL1,
      DegradationLevel.LEVEL2,
      DegradationLevel.LEVEL3,
    ];

    const currentIndex = levelOrder.indexOf(this.currentLevel);
    if (currentIndex > 0) {
      const previousLevel = this.currentLevel;
      this.currentLevel = levelOrder[currentIndex - 1];
      this.lastRecovery = Date.now();

      // Apply recovery
      this.applyDegradation(this.currentLevel);

      // Record history
      this.degradationHistory.push({
        timestamp: Date.now(),
        fromLevel: previousLevel,
        toLevel: this.currentLevel,
        trigger: 'recovery',
        metrics: { ...this.metrics },
      });

      // Emit event
      this.emit('recovery-applied', {
        previousLevel,
        currentLevel: this.currentLevel,
        metrics: this.metrics,
      });
    }
  }

  /**
   * Filter operation based on current degradation level
   */
  public filterOperation(
    operation: string,
    priority: OperationPriority = OperationPriority.MEDIUM,
  ): boolean {
    // Critical operations always allowed
    if (priority === OperationPriority.CRITICAL) {
      return true;
    }

    switch (this.currentLevel) {
      case DegradationLevel.NORMAL:
        return true;

      case DegradationLevel.LEVEL1:
        return priority !== OperationPriority.LOW;

      case DegradationLevel.LEVEL2:
        return priority === OperationPriority.HIGH;

      case DegradationLevel.LEVEL3:
        return false; // Only critical allowed

      default:
        return true;
    }
  }

  /**
   * Get fallback strategy for operation
   */
  public getFallbackStrategy(operation: string): string | undefined {
    const fallbacks: Record<string, Record<DegradationLevel, string>> = {
      deep_analysis: {
        [DegradationLevel.NORMAL]: 'deep_analysis',
        [DegradationLevel.LEVEL1]: 'standard_analysis',
        [DegradationLevel.LEVEL2]: 'quick_analysis',
        [DegradationLevel.LEVEL3]: 'skip',
      },
      multi_source_aggregation: {
        [DegradationLevel.NORMAL]: 'consensus',
        [DegradationLevel.LEVEL1]: 'weighted_average',
        [DegradationLevel.LEVEL2]: 'first_success',
        [DegradationLevel.LEVEL3]: 'single_source',
      },
      parallel_processing: {
        [DegradationLevel.NORMAL]: 'full_parallel',
        [DegradationLevel.LEVEL1]: 'batch_processing',
        [DegradationLevel.LEVEL2]: 'sequential_processing',
        [DegradationLevel.LEVEL3]: 'skip_non_critical',
      },
    };

    return fallbacks[operation]?.[this.currentLevel];
  }

  /**
   * Helper methods
   */

  private mapZoneToUsage(zone: ResourceZone): number {
    switch (zone) {
      case ResourceZone.GREEN:
        return 30;
      case ResourceZone.YELLOW:
        return 65;
      case ResourceZone.ORANGE:
        return 80;
      case ResourceZone.RED:
        return 90;
      case ResourceZone.CRITICAL:
        return 98;
      default:
        return 0;
    }
  }

  private calculateErrorRate(): number {
    if (this.metrics.totalRequests === 0) return 0;
    return (this.metrics.failedRequests / this.metrics.totalRequests) * 100;
  }

  private calculateAverageLatency(): number {
    // Placeholder - would aggregate from actual request tracking
    return Math.random() * 5000; // 0-5000ms
  }

  private estimateCpuUsage(): number {
    // Placeholder - would use actual CPU monitoring
    return Math.random() * 100;
  }

  /**
   * Public API
   */

  public getCurrentLevel(): DegradationLevel {
    return this.currentLevel;
  }

  public getFeatureFlags(): FeatureFlags {
    return { ...this.featureFlags };
  }

  public getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  public isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.featureFlags[feature];
  }

  public forceDegrade(level: DegradationLevel): void {
    this.degradeToLevel(level, 'manual');
  }

  public forceRecover(): void {
    this.currentLevel = DegradationLevel.NORMAL;
    this.applyNormalOperation();
    this.lastRecovery = Date.now();

    this.emit('forced-recovery', {
      metrics: this.metrics,
    });
  }

  public getHistory(): typeof this.degradationHistory {
    return [...this.degradationHistory];
  }

  public getStatistics(): any {
    return {
      currentLevel: this.currentLevel,
      metrics: this.metrics,
      featureFlags: this.featureFlags,
      degradationCount: this.degradationHistory.filter((h) => h.trigger !== 'recovery').length,
      recoveryCount: this.degradationHistory.filter((h) => h.trigger === 'recovery').length,
      averageTimeInDegradation: this.calculateAverageTimeInDegradation(),
      mostCommonTrigger: this.getMostCommonTrigger(),
    };
  }

  private calculateAverageTimeInDegradation(): number {
    if (this.degradationHistory.length < 2) return 0;

    let totalTime = 0;
    let degradationPeriods = 0;

    for (let i = 0; i < this.degradationHistory.length - 1; i++) {
      const current = this.degradationHistory[i];
      const next = this.degradationHistory[i + 1];

      if (current.trigger !== 'recovery' && next.trigger === 'recovery') {
        totalTime += next.timestamp - current.timestamp;
        degradationPeriods++;
      }
    }

    return degradationPeriods > 0 ? totalTime / degradationPeriods : 0;
  }

  private getMostCommonTrigger(): string {
    const triggers = this.degradationHistory
      .filter((h) => h.trigger !== 'recovery')
      .map((h) => h.trigger);

    if (triggers.length === 0) return 'none';

    const counts: Record<string, number> = {};
    for (const trigger of triggers) {
      counts[trigger] = (counts[trigger] || 0) + 1;
    }

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * Cleanup
   */
  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }
}

export default GracefulDegradationManager;
