/**
 * Performance Monitoring System for OnChainAgents
 * Tracks crypto-specific metrics and system performance
 * Inspired by SuperClaude's monitoring patterns
 */

import { EventEmitter } from 'events';

// Metric types
export enum MetricType {
  // System metrics
  TOKEN_USAGE = 'token_usage',
  LATENCY = 'latency',
  THROUGHPUT = 'throughput',
  ERROR_RATE = 'error_rate',
  SUCCESS_RATE = 'success_rate',

  // Crypto metrics
  WHALE_DETECTION = 'whale_detection',
  ALPHA_DISCOVERY = 'alpha_discovery',
  SECURITY_SCAN = 'security_scan',
  YIELD_CALCULATION = 'yield_calculation',
  GAS_OPTIMIZATION = 'gas_optimization',

  // Resource metrics
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  NETWORK_IO = 'network_io',
  CACHE_HIT_RATE = 'cache_hit_rate',

  // Quality metrics
  ACCURACY = 'accuracy',
  PRECISION = 'precision',
  RECALL = 'recall',
  F1_SCORE = 'f1_score',
}

// Metric data point
export interface MetricDataPoint {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
  metadata?: any;
}

// Metric aggregation
export interface MetricAggregation {
  metric: MetricType;
  period: 'minute' | 'hour' | 'day' | 'week';
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  stdDev: number;
}

// Performance threshold
export interface PerformanceThreshold {
  metric: MetricType;
  warning: number;
  critical: number;
  comparison: 'above' | 'below';
}

// Alert
export interface Alert {
  id: string;
  metric: MetricType;
  severity: 'warning' | 'critical';
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

// Monitoring configuration
export interface MonitoringConfig {
  enabled: boolean;
  interval: number;
  retention: {
    raw: number; // Raw data retention in ms
    aggregated: number; // Aggregated data retention in ms
  };
  thresholds: PerformanceThreshold[];
  alerting: {
    enabled: boolean;
    channels: string[];
    cooldown: number;
  };
}

/**
 * Performance Monitor
 * Comprehensive monitoring for crypto operations
 */
export class PerformanceMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private metrics: Map<MetricType, MetricDataPoint[]> = new Map();
  private aggregations: Map<string, MetricAggregation> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private aggregationInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  // Crypto-specific counters
  private counters = {
    whalesDetected: 0,
    alphaOpportunities: 0,
    securityIssues: 0,
    yieldsCalculated: 0,
    gasOptimizations: 0,
    successfulOperations: 0,
    failedOperations: 0,
  };

  constructor(config?: Partial<MonitoringConfig>) {
    super();
    this.config = {
      enabled: true,
      interval: 5000,
      retention: {
        raw: 3600000, // 1 hour
        aggregated: 604800000, // 1 week
      },
      thresholds: this.getDefaultThresholds(),
      alerting: {
        enabled: true,
        channels: ['console', 'events'],
        cooldown: 300000, // 5 minutes
      },
      ...config,
    };

    if (this.config.enabled) {
      this.startMonitoring();
    }
  }

  /**
   * Get default thresholds
   */
  private getDefaultThresholds(): PerformanceThreshold[] {
    return [
      // System thresholds
      { metric: MetricType.TOKEN_USAGE, warning: 30000, critical: 40000, comparison: 'above' },
      { metric: MetricType.LATENCY, warning: 5000, critical: 10000, comparison: 'above' },
      { metric: MetricType.ERROR_RATE, warning: 5, critical: 10, comparison: 'above' },
      { metric: MetricType.SUCCESS_RATE, warning: 90, critical: 80, comparison: 'below' },

      // Resource thresholds
      { metric: MetricType.MEMORY_USAGE, warning: 70, critical: 85, comparison: 'above' },
      { metric: MetricType.CPU_USAGE, warning: 70, critical: 85, comparison: 'above' },
      { metric: MetricType.CACHE_HIT_RATE, warning: 60, critical: 40, comparison: 'below' },

      // Quality thresholds
      { metric: MetricType.ACCURACY, warning: 85, critical: 75, comparison: 'below' },
    ];
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    // Main monitoring loop
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkThresholds();
    }, this.config.interval);

    // Aggregation loop
    this.aggregationInterval = setInterval(() => {
      this.aggregateMetrics();
    }, 60000); // Every minute

    // Cleanup loop
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, 300000); // Every 5 minutes

    this.emit('monitoring-started');
  }

  /**
   * Record metric
   */
  public recordMetric(
    type: MetricType,
    value: number,
    tags?: Record<string, string>,
    metadata?: any,
  ): void {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }

    const dataPoint: MetricDataPoint = {
      timestamp: Date.now(),
      value,
      tags,
      metadata,
    };

    this.metrics.get(type)!.push(dataPoint);

    // Update counters for crypto metrics
    this.updateCounters(type, value);

    // Emit metric event
    this.emit('metric-recorded', {
      type,
      value,
      timestamp: dataPoint.timestamp,
    });

    // Check for immediate alerts
    this.checkMetricThreshold(type, value);
  }

  /**
   * Record operation
   */
  public recordOperation(
    operation: string,
    success: boolean,
    duration: number,
    tokensUsed: number,
    metadata?: any,
  ): void {
    // Record success/failure
    if (success) {
      this.counters.successfulOperations++;
      this.recordMetric(MetricType.SUCCESS_RATE, this.calculateSuccessRate());
    } else {
      this.counters.failedOperations++;
      this.recordMetric(MetricType.ERROR_RATE, this.calculateErrorRate());
    }

    // Record performance metrics
    this.recordMetric(MetricType.LATENCY, duration, { operation });
    this.recordMetric(MetricType.TOKEN_USAGE, tokensUsed, { operation });

    // Record throughput
    const throughput = this.calculateThroughput();
    this.recordMetric(MetricType.THROUGHPUT, throughput);

    this.emit('operation-recorded', {
      operation,
      success,
      duration,
      tokensUsed,
      metadata,
    });
  }

  /**
   * Record crypto-specific events
   */
  public recordWhaleDetection(address: string, amount: number): void {
    this.counters.whalesDetected++;
    this.recordMetric(MetricType.WHALE_DETECTION, amount, { address });
  }

  public recordAlphaDiscovery(opportunity: string, score: number): void {
    this.counters.alphaOpportunities++;
    this.recordMetric(MetricType.ALPHA_DISCOVERY, score, { opportunity });
  }

  public recordSecurityIssue(type: string, severity: number): void {
    this.counters.securityIssues++;
    this.recordMetric(MetricType.SECURITY_SCAN, severity, { type });
  }

  public recordYieldCalculation(protocol: string, apy: number): void {
    this.counters.yieldsCalculated++;
    this.recordMetric(MetricType.YIELD_CALCULATION, apy, { protocol });
  }

  public recordGasOptimization(saved: number, method: string): void {
    this.counters.gasOptimizations++;
    this.recordMetric(MetricType.GAS_OPTIMIZATION, saved, { method });
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    // Memory usage
    const memUsage = process.memoryUsage();
    const memoryPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    this.recordMetric(MetricType.MEMORY_USAGE, memoryPercent);

    // CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000) * 100;
    this.recordMetric(MetricType.CPU_USAGE, Math.min(100, cpuPercent));

    // Network I/O (placeholder)
    this.recordMetric(MetricType.NETWORK_IO, Math.random() * 1000);

    // Cache hit rate (placeholder)
    this.recordMetric(MetricType.CACHE_HIT_RATE, 60 + Math.random() * 30);
  }

  /**
   * Aggregate metrics
   */
  private aggregateMetrics(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    for (const [type, dataPoints] of this.metrics) {
      const recentPoints = dataPoints.filter((p) => p.timestamp > oneMinuteAgo);

      if (recentPoints.length === 0) continue;

      const values = recentPoints.map((p) => p.value).sort((a, b) => a - b);

      const aggregation: MetricAggregation = {
        metric: type,
        period: 'minute',
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: values[0],
        max: values[values.length - 1],
        p50: this.percentile(values, 50),
        p95: this.percentile(values, 95),
        p99: this.percentile(values, 99),
        stdDev: this.standardDeviation(values),
      };

      const key = `${type}_minute_${Math.floor(now / 60000)}`;
      this.aggregations.set(key, aggregation);

      this.emit('metrics-aggregated', {
        type,
        period: 'minute',
        aggregation,
      });
    }
  }

  /**
   * Check thresholds
   */
  private checkThresholds(): void {
    for (const threshold of this.config.thresholds) {
      const dataPoints = this.metrics.get(threshold.metric);
      if (!dataPoints || dataPoints.length === 0) continue;

      // Get latest value
      const latest = dataPoints[dataPoints.length - 1];
      this.checkMetricThreshold(threshold.metric, latest.value);
    }
  }

  /**
   * Check metric threshold
   */
  private checkMetricThreshold(metric: MetricType, value: number): void {
    const threshold = this.config.thresholds.find((t) => t.metric === metric);
    if (!threshold) return;

    let severity: 'warning' | 'critical' | undefined;
    let thresholdValue: number | undefined;

    if (threshold.comparison === 'above') {
      if (value > threshold.critical) {
        severity = 'critical';
        thresholdValue = threshold.critical;
      } else if (value > threshold.warning) {
        severity = 'warning';
        thresholdValue = threshold.warning;
      }
    } else {
      if (value < threshold.critical) {
        severity = 'critical';
        thresholdValue = threshold.critical;
      } else if (value < threshold.warning) {
        severity = 'warning';
        thresholdValue = threshold.warning;
      }
    }

    if (severity && thresholdValue !== undefined) {
      this.createAlert(metric, severity, value, thresholdValue);
    }
  }

  /**
   * Create alert
   */
  private createAlert(
    metric: MetricType,
    severity: 'warning' | 'critical',
    value: number,
    threshold: number,
  ): void {
    const alertKey = `${metric}_${severity}`;

    // Check cooldown
    const existingAlert = this.alerts.get(alertKey);
    if (existingAlert && Date.now() - existingAlert.timestamp < this.config.alerting.cooldown) {
      return;
    }

    const alert: Alert = {
      id: `alert_${Date.now()}`,
      metric,
      severity,
      value,
      threshold,
      message: `${metric} ${severity}: ${value.toFixed(2)} (threshold: ${threshold})`,
      timestamp: Date.now(),
      acknowledged: false,
    };

    this.alerts.set(alertKey, alert);

    // Send alert
    if (this.config.alerting.enabled) {
      for (const channel of this.config.alerting.channels) {
        this.sendAlert(alert, channel);
      }
    }

    this.emit('alert-created', alert);
  }

  /**
   * Send alert
   */
  private sendAlert(alert: Alert, channel: string): void {
    switch (channel) {
      case 'console':
        console.warn(`[ALERT] ${alert.message}`);
        break;
      case 'events':
        this.emit('performance-alert', alert);
        break;
      // Add more channels as needed
    }
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const now = Date.now();

    // Clean raw metrics
    for (const [type, dataPoints] of this.metrics) {
      const filtered = dataPoints.filter((p) => now - p.timestamp < this.config.retention.raw);
      this.metrics.set(type, filtered);
    }

    // Clean aggregations
    for (const [key, aggregation] of this.aggregations) {
      const timestamp = parseInt(key.split('_').pop() || '0') * 60000;
      if (now - timestamp > this.config.retention.aggregated) {
        this.aggregations.delete(key);
      }
    }

    // Clean old alerts
    for (const [key, alert] of this.alerts) {
      if (now - alert.timestamp > 86400000) {
        // 24 hours
        this.alerts.delete(key);
      }
    }
  }

  /**
   * Helper methods
   */

  private updateCounters(type: MetricType, value: number): void {
    // Update specific counters based on metric type
    // This is handled by specific record methods
  }

  private calculateSuccessRate(): number {
    const total = this.counters.successfulOperations + this.counters.failedOperations;
    if (total === 0) return 100;
    return (this.counters.successfulOperations / total) * 100;
  }

  private calculateErrorRate(): number {
    const total = this.counters.successfulOperations + this.counters.failedOperations;
    if (total === 0) return 0;
    return (this.counters.failedOperations / total) * 100;
  }

  private calculateThroughput(): number {
    // Operations per minute
    const total = this.counters.successfulOperations + this.counters.failedOperations;
    const uptime = process.uptime() / 60; // Convert to minutes
    return total / Math.max(1, uptime);
  }

  private percentile(values: number[], p: number): number {
    const index = Math.ceil((p / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  private standardDeviation(values: number[]): number {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Public API
   */

  public getMetrics(type?: MetricType): MetricDataPoint[] | Map<MetricType, MetricDataPoint[]> {
    if (type) {
      return this.metrics.get(type) || [];
    }
    return new Map(this.metrics);
  }

  public getAggregations(metric?: MetricType): MetricAggregation[] {
    const aggregations: MetricAggregation[] = [];

    for (const [key, agg] of this.aggregations) {
      if (!metric || agg.metric === metric) {
        aggregations.push(agg);
      }
    }

    return aggregations;
  }

  public getAlerts(acknowledged?: boolean): Alert[] {
    const alerts: Alert[] = [];

    for (const alert of this.alerts.values()) {
      if (acknowledged === undefined || alert.acknowledged === acknowledged) {
        alerts.push(alert);
      }
    }

    return alerts;
  }

  public acknowledgeAlert(alertId: string): void {
    for (const alert of this.alerts.values()) {
      if (alert.id === alertId) {
        alert.acknowledged = true;
        this.emit('alert-acknowledged', alert);
        break;
      }
    }
  }

  public getStatistics(): any {
    return {
      metrics: {
        total: this.metrics.size,
        dataPoints: Array.from(this.metrics.values()).reduce(
          (sum, points) => sum + points.length,
          0,
        ),
      },
      aggregations: this.aggregations.size,
      alerts: {
        total: this.alerts.size,
        unacknowledged: this.getAlerts(false).length,
      },
      counters: this.counters,
      performance: {
        successRate: this.calculateSuccessRate(),
        errorRate: this.calculateErrorRate(),
        throughput: this.calculateThroughput(),
      },
      uptime: process.uptime(),
    };
  }

  public exportMetrics(): any {
    const exported: any = {
      timestamp: Date.now(),
      metrics: {},
      aggregations: [],
      alerts: [],
    };

    // Export latest metrics
    for (const [type, dataPoints] of this.metrics) {
      if (dataPoints.length > 0) {
        exported.metrics[type] = dataPoints[dataPoints.length - 1];
      }
    }

    // Export recent aggregations
    exported.aggregations = this.getAggregations();

    // Export active alerts
    exported.alerts = this.getAlerts(false);

    return exported;
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
      this.aggregationInterval = undefined;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    this.emit('monitoring-stopped');
  }
}

export default PerformanceMonitor;
