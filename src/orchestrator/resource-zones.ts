/**
 * Resource Management Zones for OnChainAgents
 * Inspired by SuperClaude's 5-zone resource management system
 * Provides predictive allocation and graceful degradation for crypto operations
 */

import { EventEmitter } from 'events';
import * as os from 'os';
import { performance } from 'perf_hooks';

// Resource zones matching SuperClaude's thresholds
export enum ResourceZone {
  GREEN = 'green', // 0-60%: Full operations
  YELLOW = 'yellow', // 60-75%: Resource optimization
  ORANGE = 'orange', // 75-85%: Warning alerts
  RED = 'red', // 85-95%: Critical operations only
  CRITICAL = 'critical', // 95%+: Emergency protocols
}

// Resource types we monitor
export interface ResourceMetrics {
  // CPU metrics
  cpuUsage: number; // Percentage
  cpuTemperature?: number; // Celsius
  cpuCores: number;
  cpuLoadAverage: number[];

  // Memory metrics
  memoryUsage: number; // Percentage
  memoryUsed: number; // Bytes
  memoryTotal: number; // Bytes
  heapUsage: number; // Percentage

  // Token metrics (SuperClaude-inspired)
  tokenUsage: number; // Percentage of budget
  tokensUsed: number;
  tokenBudget: number;
  tokenRate: number; // Tokens per second

  // Time metrics
  executionTime: number; // Milliseconds
  timeRemaining: number; // Milliseconds
  operationCount: number;

  // Network metrics (crypto-specific)
  networkLatency: number; // Milliseconds
  apiCallsRemaining: number;
  rateLimitStatus: number; // Percentage used

  // Blockchain metrics
  gasPrice?: number; // Gwei
  blockchainCongestion?: number; // Percentage
  pendingTransactions?: number;
}

// Zone configuration
interface ZoneConfig {
  threshold: [number, number]; // [min, max] percentage
  actions: string[];
  restrictions: string[];
  color: string;
  priority: number;
}

// Predictive allocation config
interface PredictiveConfig {
  lookAheadTime: number; // Milliseconds
  trendWeight: number; // 0-1
  historySize: number; // Number of samples
  predictionConfidence: number; // 0-1
}

export class ResourceZoneManager extends EventEmitter {
  private currentZone: ResourceZone = ResourceZone.GREEN;
  private metrics: ResourceMetrics;
  private zoneConfigs: Map<ResourceZone, ZoneConfig> = new Map();
  private metricsHistory: ResourceMetrics[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private predictiveConfig: PredictiveConfig;
  private degradationCallbacks: Map<ResourceZone, Function[]> = new Map();

  constructor() {
    super();
    this.initializeZoneConfigs();
    this.predictiveConfig = {
      lookAheadTime: 30000, // 30 seconds
      trendWeight: 0.3,
      historySize: 100,
      predictionConfidence: 0.75,
    };
    this.metrics = this.getCurrentMetrics();
  }

  /**
   * Initialize zone configurations inspired by SuperClaude
   */
  private initializeZoneConfigs(): void {
    this.zoneConfigs = new Map([
      [
        ResourceZone.GREEN,
        {
          threshold: [0, 60],
          actions: [
            'full_operations',
            'predictive_monitoring',
            'aggressive_caching',
            'parallel_processing',
            'speculative_execution',
          ],
          restrictions: [],
          color: '\x1b[32m', // Green
          priority: 1,
        },
      ],

      [
        ResourceZone.YELLOW,
        {
          threshold: [60, 75],
          actions: [
            'resource_optimization',
            'cache_prioritization',
            'suggest_compression',
            'defer_non_critical',
          ],
          restrictions: ['limit_parallel_operations', 'reduce_speculation'],
          color: '\x1b[33m', // Yellow
          priority: 2,
        },
      ],

      [
        ResourceZone.ORANGE,
        {
          threshold: [75, 85],
          actions: [
            'warning_alerts',
            'aggressive_optimization',
            'force_compression',
            'queue_operations',
          ],
          restrictions: ['block_resource_intensive', 'disable_caching_new', 'limit_api_calls'],
          color: '\x1b[38;5;208m', // Orange
          priority: 3,
        },
      ],

      [
        ResourceZone.RED,
        {
          threshold: [85, 95],
          actions: ['critical_only', 'maximum_compression', 'emergency_gc', 'kill_non_essential'],
          restrictions: [
            'block_new_operations',
            'force_sequential',
            'minimal_logging',
            'disable_analytics',
          ],
          color: '\x1b[31m', // Red
          priority: 4,
        },
      ],

      [
        ResourceZone.CRITICAL,
        {
          threshold: [95, 100],
          actions: [
            'emergency_protocols',
            'system_preservation',
            'data_dump',
            'graceful_shutdown_prep',
          ],
          restrictions: [
            'essential_only',
            'no_new_operations',
            'immediate_cleanup',
            'prepare_recovery',
          ],
          color: '\x1b[35m', // Magenta
          priority: 5,
        },
      ],
    ]);
  }

  /**
   * Start monitoring resources
   */
  public startMonitoring(intervalMs: number = 5000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkZoneTransition();
      this.performPredictiveAnalysis();
    }, intervalMs);

    // Don't block process exit
    this.monitoringInterval.unref();

    this.emit('monitoring-started', { interval: intervalMs });
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.emit('monitoring-stopped');
  }

  /**
   * Get current resource metrics
   */
  private getCurrentMetrics(): ResourceMetrics {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      // CPU metrics
      cpuUsage: this.calculateCPUUsage(),
      cpuCores: os.cpus().length,
      cpuLoadAverage: os.loadavg(),

      // Memory metrics
      memoryUsage: (usedMem / totalMem) * 100,
      memoryUsed: usedMem,
      memoryTotal: totalMem,
      heapUsage: (memUsage.heapUsed / memUsage.heapTotal) * 100,

      // Token metrics (would be tracked by actual usage)
      tokenUsage: 0, // To be updated by orchestrator
      tokensUsed: 0,
      tokenBudget: 1000000, // 1M tokens
      tokenRate: 0,

      // Time metrics
      executionTime: performance.now(),
      timeRemaining: 600000, // 10 minutes default
      operationCount: 0,

      // Network metrics
      networkLatency: 50, // Would be measured
      apiCallsRemaining: 1000,
      rateLimitStatus: 0,

      // Blockchain metrics (would come from chain monitoring)
      gasPrice: 30, // Gwei
      blockchainCongestion: 20, // Percentage
      pendingTransactions: 0,
    };
  }

  /**
   * Calculate CPU usage percentage
   */
  private calculateCPUUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    }

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~((100 * idle) / total);

    return usage;
  }

  /**
   * Update current metrics
   */
  private updateMetrics(): void {
    const newMetrics = this.getCurrentMetrics();

    // Preserve token and operation metrics from external updates
    newMetrics.tokenUsage = this.metrics.tokenUsage;
    newMetrics.tokensUsed = this.metrics.tokensUsed;
    newMetrics.operationCount = this.metrics.operationCount;

    this.metrics = newMetrics;

    // Add to history for predictive analysis
    this.metricsHistory.push({ ...newMetrics });
    if (this.metricsHistory.length > this.predictiveConfig.historySize) {
      this.metricsHistory.shift();
    }

    this.emit('metrics-updated', newMetrics);
  }

  /**
   * Check if zone transition is needed
   */
  private checkZoneTransition(): void {
    const overallUsage = this.calculateOverallUsage();
    const newZone = this.determineZone(overallUsage);

    if (newZone !== this.currentZone) {
      const oldZone = this.currentZone;
      this.currentZone = newZone;
      this.handleZoneTransition(oldZone, newZone);
    }
  }

  /**
   * Calculate overall resource usage percentage
   */
  private calculateOverallUsage(): number {
    // Weighted average of different metrics
    const weights = {
      cpu: 0.25,
      memory: 0.25,
      tokens: 0.3,
      network: 0.1,
      blockchain: 0.1,
    };

    const usage =
      this.metrics.cpuUsage * weights.cpu +
      this.metrics.memoryUsage * weights.memory +
      this.metrics.tokenUsage * weights.tokens +
      this.metrics.rateLimitStatus * weights.network +
      (this.metrics.blockchainCongestion || 0) * weights.blockchain;

    return usage;
  }

  /**
   * Determine which zone based on usage
   */
  private determineZone(usage: number): ResourceZone {
    for (const [zone, config] of this.zoneConfigs) {
      const [min, max] = config.threshold;
      if (usage >= min && usage < max) {
        return zone;
      }
    }
    return ResourceZone.CRITICAL;
  }

  /**
   * Handle zone transition
   */
  private handleZoneTransition(oldZone: ResourceZone, newZone: ResourceZone): void {
    const _oldConfig = this.zoneConfigs.get(oldZone)!;
    const newConfig = this.zoneConfigs.get(newZone)!;

    console.log(
      `${newConfig.color}[RESOURCE ZONE] Transition: ${oldZone.toUpperCase()} → ${newZone.toUpperCase()}\x1b[0m`,
    );

    // Execute degradation callbacks
    const callbacks = this.degradationCallbacks.get(newZone) || [];
    for (const callback of callbacks) {
      try {
        callback();
      } catch (error) {
        console.error('Degradation callback error:', error);
      }
    }

    // Emit transition event
    this.emit('zone-transition', {
      from: oldZone,
      to: newZone,
      timestamp: Date.now(),
      metrics: this.metrics,
      actions: newConfig.actions,
      restrictions: newConfig.restrictions,
    });

    // Apply zone-specific optimizations
    this.applyZoneOptimizations(newZone);
  }

  /**
   * Apply optimizations based on zone
   */
  private applyZoneOptimizations(zone: ResourceZone): void {
    switch (zone) {
      case ResourceZone.GREEN:
        // Enable all features
        this.emit('optimization', { type: 'enable-all' });
        break;

      case ResourceZone.YELLOW:
        // Start optimizing
        this.emit('optimization', { type: 'compress', level: 'soft' });
        this.emit('optimization', { type: 'cache-priority', level: 'high' });
        break;

      case ResourceZone.ORANGE:
        // Aggressive optimization
        this.emit('optimization', { type: 'compress', level: 'hard' });
        this.emit('optimization', { type: 'defer-operations' });
        if (global.gc) global.gc(); // Force garbage collection
        break;

      case ResourceZone.RED:
        // Emergency measures
        this.emit('optimization', { type: 'critical-only' });
        this.emit('optimization', { type: 'kill-non-essential' });
        if (global.gc) global.gc();
        break;

      case ResourceZone.CRITICAL:
        // Survival mode
        this.emit('optimization', { type: 'emergency-protocol' });
        this.emit('optimization', { type: 'prepare-shutdown' });
        break;
    }
  }

  /**
   * Perform predictive analysis (SuperClaude-inspired)
   */
  private performPredictiveAnalysis(): void {
    if (this.metricsHistory.length < 10) return;

    // Calculate trends
    const recentMetrics = this.metricsHistory.slice(-10);
    const trends = this.calculateTrends(recentMetrics);

    // Predict future usage
    const predictedUsage = this.predictFutureUsage(trends);

    // Check if we need proactive action
    if (predictedUsage.confidence > this.predictiveConfig.predictionConfidence) {
      const predictedZone = this.determineZone(predictedUsage.usage);

      if (predictedZone !== this.currentZone) {
        this.emit('prediction', {
          currentZone: this.currentZone,
          predictedZone,
          timeToTransition: predictedUsage.timeToTransition,
          confidence: predictedUsage.confidence,
          recommendation: this.getProactiveRecommendation(predictedZone),
        });

        // Take proactive action if transitioning to worse zone
        const currentPriority = this.zoneConfigs.get(this.currentZone)!.priority;
        const predictedPriority = this.zoneConfigs.get(predictedZone)!.priority;

        if (predictedPriority > currentPriority) {
          this.takeProactiveAction(predictedZone);
        }
      }
    }
  }

  /**
   * Calculate resource trends
   */
  private calculateTrends(metrics: ResourceMetrics[]): Record<string, number> {
    const trends: Record<string, number> = {};

    // Calculate linear trends for key metrics
    const keys: (keyof ResourceMetrics)[] = [
      'cpuUsage',
      'memoryUsage',
      'tokenUsage',
      'rateLimitStatus',
    ];

    for (const key of keys) {
      const values = metrics.map((m) => m[key] as number);
      trends[key] = this.calculateLinearTrend(values);
    }

    return trends;
  }

  /**
   * Calculate linear trend
   */
  private calculateLinearTrend(values: number[]): number {
    const n = values.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Predict future usage
   */
  private predictFutureUsage(trends: Record<string, number>): {
    usage: number;
    timeToTransition: number;
    confidence: number;
  } {
    // Current overall usage
    const currentUsage = this.calculateOverallUsage();

    // Weighted trend
    const weightedTrend =
      trends.cpuUsage * 0.25 +
      trends.memoryUsage * 0.25 +
      trends.tokenUsage * 0.3 +
      trends.rateLimitStatus * 0.2;

    // Predict future usage
    const stepsAhead = this.predictiveConfig.lookAheadTime / 5000; // Based on monitoring interval
    const predictedUsage = currentUsage + weightedTrend * stepsAhead;

    // Calculate confidence based on trend consistency
    const trendVariance = this.calculateTrendVariance(trends);
    const confidence = Math.max(0, 1 - trendVariance);

    // Time to zone transition
    let timeToTransition = Infinity;
    for (const [zone, config] of this.zoneConfigs) {
      const [min, max] = config.threshold;
      if (predictedUsage >= min && predictedUsage < max && zone !== this.currentZone) {
        const usageRate = Math.abs(weightedTrend);
        if (usageRate > 0) {
          const distance = predictedUsage > currentUsage ? min - currentUsage : currentUsage - max;
          timeToTransition = Math.abs(distance / usageRate) * 5000;
        }
        break;
      }
    }

    return {
      usage: predictedUsage,
      timeToTransition,
      confidence,
    };
  }

  /**
   * Calculate trend variance for confidence
   */
  private calculateTrendVariance(trends: Record<string, number>): number {
    const values = Object.values(trends);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Get proactive recommendation
   */
  private getProactiveRecommendation(predictedZone: ResourceZone): string {
    const recommendations: Record<ResourceZone, string> = {
      [ResourceZone.GREEN]: 'System healthy, maintain current operations',
      [ResourceZone.YELLOW]: 'Consider enabling compression and deferring non-critical tasks',
      [ResourceZone.ORANGE]: 'Recommend pausing new operations and clearing cache',
      [ResourceZone.RED]: 'Critical: Stop all non-essential operations immediately',
      [ResourceZone.CRITICAL]: 'Emergency: Prepare for system preservation and recovery',
    };

    return recommendations[predictedZone];
  }

  /**
   * Take proactive action based on prediction
   */
  private takeProactiveAction(predictedZone: ResourceZone): void {
    this.emit('proactive-action', {
      predictedZone,
      action: 'pre-optimization',
      timestamp: Date.now(),
    });

    // Apply some optimizations early
    if (predictedZone === ResourceZone.ORANGE || predictedZone === ResourceZone.RED) {
      if (global.gc) global.gc(); // Proactive GC
      this.emit('optimization', { type: 'proactive-cache-clear' });
    }
  }

  /**
   * Register degradation callback for a zone
   */
  public onZoneEnter(zone: ResourceZone, callback: Function): void {
    if (!this.degradationCallbacks.has(zone)) {
      this.degradationCallbacks.set(zone, []);
    }
    this.degradationCallbacks.get(zone)!.push(callback);
  }

  /**
   * Update token usage from orchestrator
   */
  public updateTokenUsage(used: number, budget: number): void {
    this.metrics.tokensUsed = used;
    this.metrics.tokenBudget = budget;
    this.metrics.tokenUsage = (used / budget) * 100;
  }

  /**
   * Update operation count
   */
  public incrementOperations(): void {
    this.metrics.operationCount++;
  }

  /**
   * Get current zone
   */
  public getCurrentZone(): ResourceZone {
    return this.currentZone;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): ResourceMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if operation is allowed in current zone
   */
  public isOperationAllowed(operation: string): boolean {
    const config = this.zoneConfigs.get(this.currentZone)!;

    // Check restrictions
    if (config.restrictions.includes('block_new_operations') && operation.startsWith('new_')) {
      return false;
    }

    if (config.restrictions.includes('essential_only') && !operation.includes('critical')) {
      return false;
    }

    if (
      config.restrictions.includes('block_resource_intensive') &&
      operation.includes('intensive')
    ) {
      return false;
    }

    return true;
  }

  /**
   * Get zone statistics
   */
  public getStatistics(): {
    currentZone: ResourceZone;
    zoneHistory: Array<{ zone: ResourceZone; timestamp: number }>;
    averageUsage: ResourceMetrics;
    predictions: any;
  } {
    // Calculate averages from history
    const avgMetrics = this.metricsHistory.reduce((acc, m) => {
      for (const key in m) {
        if (typeof m[key as keyof ResourceMetrics] === 'number') {
          acc[key as keyof ResourceMetrics] =
            ((acc[key as keyof ResourceMetrics] as number) || 0) +
            (m[key as keyof ResourceMetrics] as number);
        }
      }
      return acc;
    }, {} as any);

    const count = Math.max(1, this.metricsHistory.length);
    for (const key in avgMetrics) {
      avgMetrics[key] /= count;
    }

    return {
      currentZone: this.currentZone,
      zoneHistory: [], // Would track zone transitions
      averageUsage: avgMetrics,
      predictions: this.performPredictiveAnalysis,
    };
  }

  /**
   * Set emergency mode for resource management
   */
  public setEmergencyMode(enabled: boolean, limit?: number): void {
    if (enabled) {
      this.currentZone = ResourceZone.CRITICAL;
      if (limit !== undefined) {
        this.metrics.tokenUsage = Math.min(this.metrics.tokenUsage, limit);
      }
      this.emit('emergency-mode', { enabled, limit });
    } else {
      // Recalculate current zone based on actual metrics
      const usage = this.calculateOverallUsage();
      this.currentZone = this.determineZone(usage);
      this.emit('emergency-mode', { enabled: false });
    }
  }
}

export default ResourceZoneManager;
