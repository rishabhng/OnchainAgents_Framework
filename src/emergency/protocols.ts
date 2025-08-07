/**
 * Emergency Protocols System for OnChainAgents
 * Handles market volatility and critical crypto events
 * Inspired by SuperClaude's emergency response patterns
 */

import { EventEmitter } from 'events';
import { CircuitBreakerManager } from '../resilience/circuit-breaker';
import { GracefulDegradationManager, DegradationLevel } from '../resilience/graceful-degradation';
import { ResourceZoneManager } from '../orchestrator/resource-zones';
import { MultiSourceCoordinator } from '../coordination/multi-source';

// Emergency types
export enum EmergencyType {
  MARKET_CRASH = 'market_crash', // >20% drop in 1 hour
  FLASH_CRASH = 'flash_crash', // >10% drop in 1 minute
  LIQUIDITY_CRISIS = 'liquidity_crisis', // Severe liquidity shortage
  PROTOCOL_HACK = 'protocol_hack', // Major protocol exploit
  BRIDGE_FAILURE = 'bridge_failure', // Bridge compromise/failure
  ORACLE_FAILURE = 'oracle_failure', // Price oracle manipulation
  NETWORK_CONGESTION = 'network_congestion', // Extreme gas prices
  REGULATORY_EVENT = 'regulatory_event', // Sudden regulatory action
  SYSTEMIC_RISK = 'systemic_risk', // Cascading failures
  UNKNOWN_ANOMALY = 'unknown_anomaly', // Unidentified threat
}

// Emergency severity
export enum EmergencySeverity {
  LOW = 'low', // Monitor closely
  MEDIUM = 'medium', // Activate precautions
  HIGH = 'high', // Immediate action required
  CRITICAL = 'critical', // Full emergency mode
}

// Emergency state
export interface EmergencyState {
  active: boolean;
  type?: EmergencyType;
  severity?: EmergencySeverity;
  startTime?: number;
  triggers: string[];
  affectedAssets: string[];
  estimatedImpact: {
    financial: number; // Estimated $ impact
    users: number; // Affected users
    protocols: string[]; // Affected protocols
  };
  actions: string[];
}

// Market metrics for detection
export interface MarketMetrics {
  priceChange1m: number; // 1 minute price change %
  priceChange5m: number; // 5 minute price change %
  priceChange1h: number; // 1 hour price change %
  volumeSpike: number; // Volume vs average
  liquidations: number; // Liquidation volume
  gasPrice: number; // Current gas price
  networkLoad: number; // Network congestion %
  correlations: Map<string, number>; // Asset correlations
}

// Emergency response
export interface EmergencyResponse {
  type: EmergencyType;
  severity: EmergencySeverity;
  immediateActions: string[];
  notifications: {
    priority: 'urgent' | 'high' | 'normal';
    channels: string[];
    message: string;
  }[];
  systemAdjustments: {
    circuitBreakers: string[];
    degradationLevel: DegradationLevel;
    resourceLimit: number;
    disabledFeatures: string[];
  };
  recoveryPlan: {
    conditions: string[];
    estimatedTime: number;
    steps: string[];
  };
}

// Emergency protocol configuration
export interface ProtocolConfig {
  detectionThresholds: {
    priceDropThreshold1m: number;
    priceDropThreshold1h: number;
    volumeSpikeThreshold: number;
    liquidationThreshold: number;
    gasThreshold: number;
    correlationThreshold: number;
  };
  responseTime: {
    detection: number; // Max detection time (ms)
    response: number; // Max response time (ms)
    escalation: number; // Time before escalation (ms)
  };
  autoActivation: boolean;
  manualOverride: boolean;
}

/**
 * Emergency Protocol Manager
 * Coordinates emergency response for crypto market events
 */
export class EmergencyProtocolManager extends EventEmitter {
  private state: EmergencyState;
  private config: ProtocolConfig;
  private metrics: MarketMetrics;

  private circuitManager: CircuitBreakerManager;
  private degradationManager: GracefulDegradationManager;
  private resourceManager: ResourceZoneManager;
  // Multi-source coordinator for future use
  // private _multiSourceCoordinator: MultiSourceCoordinator;

  private detectionInterval?: NodeJS.Timeout;
  private responseHistory: EmergencyResponse[] = [];
  private activeProtocols: Map<EmergencyType, EmergencyResponse> = new Map();

  constructor(
    circuitManager: CircuitBreakerManager,
    degradationManager: GracefulDegradationManager,
    resourceManager: ResourceZoneManager,
    multiSourceCoordinator: MultiSourceCoordinator,
  ) {
    super();

    this.circuitManager = circuitManager;
    this.degradationManager = degradationManager;
    this.resourceManager = resourceManager;
    // Store for future use
    // this._multiSourceCoordinator = multiSourceCoordinator;
    void multiSourceCoordinator; // Suppress unused parameter warning

    this.state = {
      active: false,
      triggers: [],
      affectedAssets: [],
      estimatedImpact: {
        financial: 0,
        users: 0,
        protocols: [],
      },
      actions: [],
    };

    this.config = this.initializeConfig();
    this.metrics = this.initializeMetrics();

    this.startMonitoring();
  }

  /**
   * Initialize configuration
   */
  private initializeConfig(): ProtocolConfig {
    return {
      detectionThresholds: {
        priceDropThreshold1m: 10, // 10% in 1 minute
        priceDropThreshold1h: 20, // 20% in 1 hour
        volumeSpikeThreshold: 500, // 5x normal volume
        liquidationThreshold: 100, // $100M liquidations
        gasThreshold: 500, // 500 gwei
        correlationThreshold: 0.9, // 90% correlation
      },
      responseTime: {
        detection: 1000, // 1 second
        response: 5000, // 5 seconds
        escalation: 60000, // 1 minute
      },
      autoActivation: true,
      manualOverride: true,
    };
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): MarketMetrics {
    return {
      priceChange1m: 0,
      priceChange5m: 0,
      priceChange1h: 0,
      volumeSpike: 1,
      liquidations: 0,
      gasPrice: 30,
      networkLoad: 50,
      correlations: new Map(),
    };
  }

  /**
   * Start emergency monitoring
   */
  private startMonitoring(): void {
    this.detectionInterval = setInterval(() => {
      this.detectEmergencies();
    }, this.config.responseTime.detection);
  }

  /**
   * Detect emergencies
   */
  private async detectEmergencies(): Promise<void> {
    // Update metrics
    await this.updateMetrics();

    // Check for various emergency conditions
    const emergencies: Array<{
      type: EmergencyType;
      severity: EmergencySeverity;
      trigger: string;
    }> = [];

    // Flash crash detection
    if (
      Math.abs(this.metrics.priceChange1m) > this.config.detectionThresholds.priceDropThreshold1m
    ) {
      emergencies.push({
        type: EmergencyType.FLASH_CRASH,
        severity: EmergencySeverity.CRITICAL,
        trigger: `Price changed ${this.metrics.priceChange1m}% in 1 minute`,
      });
    }

    // Market crash detection
    if (
      Math.abs(this.metrics.priceChange1h) > this.config.detectionThresholds.priceDropThreshold1h
    ) {
      emergencies.push({
        type: EmergencyType.MARKET_CRASH,
        severity: EmergencySeverity.HIGH,
        trigger: `Price changed ${this.metrics.priceChange1h}% in 1 hour`,
      });
    }

    // Liquidity crisis detection
    if (this.metrics.liquidations > this.config.detectionThresholds.liquidationThreshold) {
      emergencies.push({
        type: EmergencyType.LIQUIDITY_CRISIS,
        severity: EmergencySeverity.HIGH,
        trigger: `Liquidations exceed $${this.metrics.liquidations}M`,
      });
    }

    // Network congestion detection
    if (this.metrics.gasPrice > this.config.detectionThresholds.gasThreshold) {
      emergencies.push({
        type: EmergencyType.NETWORK_CONGESTION,
        severity: EmergencySeverity.MEDIUM,
        trigger: `Gas price at ${this.metrics.gasPrice} gwei`,
      });
    }

    // Systemic risk detection (high correlation + volatility)
    const highCorrelation = Array.from(this.metrics.correlations.values()).some(
      (corr) => corr > this.config.detectionThresholds.correlationThreshold,
    );

    if (highCorrelation && Math.abs(this.metrics.priceChange1h) > 10) {
      emergencies.push({
        type: EmergencyType.SYSTEMIC_RISK,
        severity: EmergencySeverity.CRITICAL,
        trigger: 'High correlation with market volatility',
      });
    }

    // Process detected emergencies
    for (const emergency of emergencies) {
      if (this.config.autoActivation || this.state.active) {
        await this.activateEmergencyProtocol(emergency.type, emergency.severity, emergency.trigger);
      } else {
        this.emit('emergency-detected', emergency);
      }
    }
  }

  /**
   * Update market metrics
   */
  private async updateMetrics(): Promise<void> {
    // Simulate metric updates - in production, fetch from data sources
    this.metrics = {
      priceChange1m: (Math.random() - 0.5) * 15, // -7.5% to +7.5%
      priceChange5m: (Math.random() - 0.5) * 20, // -10% to +10%
      priceChange1h: (Math.random() - 0.5) * 30, // -15% to +15%
      volumeSpike: Math.random() * 10, // 0x to 10x
      liquidations: Math.random() * 200, // $0-200M
      gasPrice: 20 + Math.random() * 480, // 20-500 gwei
      networkLoad: Math.random() * 100, // 0-100%
      correlations: new Map([
        ['BTC-ETH', 0.7 + Math.random() * 0.3],
        ['ETH-ALTS', 0.6 + Math.random() * 0.4],
      ]),
    };
  }

  /**
   * Activate emergency protocol
   */
  public async activateEmergencyProtocol(
    type: EmergencyType,
    severity: EmergencySeverity,
    trigger: string,
  ): Promise<EmergencyResponse> {
    // Update state
    this.state = {
      active: true,
      type,
      severity,
      startTime: Date.now(),
      triggers: [...this.state.triggers, trigger],
      affectedAssets: this.identifyAffectedAssets(type),
      estimatedImpact: this.estimateImpact(type, severity),
      actions: [],
    };

    // Create response
    const response = this.createEmergencyResponse(type, severity);

    // Execute immediate actions
    await this.executeImmediateActions(response);

    // Store response
    this.activeProtocols.set(type, response);
    this.responseHistory.push(response);

    // Emit emergency event
    this.emit('emergency-activated', {
      type,
      severity,
      trigger,
      response,
    });

    // Log critical alert
    this.emit('critical-alert', {
      message: `EMERGENCY: ${type} detected - ${trigger}`,
      severity,
      timestamp: Date.now(),
    });

    return response;
  }

  /**
   * Create emergency response
   */
  private createEmergencyResponse(
    type: EmergencyType,
    severity: EmergencySeverity,
  ): EmergencyResponse {
    const response: EmergencyResponse = {
      type,
      severity,
      immediateActions: this.determineImmediateActions(type, severity),
      notifications: this.createNotifications(type, severity),
      systemAdjustments: this.determineSystemAdjustments(type, severity),
      recoveryPlan: this.createRecoveryPlan(type, severity),
    };

    return response;
  }

  /**
   * Determine immediate actions
   */
  private determineImmediateActions(type: EmergencyType, _severity: EmergencySeverity): string[] {
    const actions: string[] = [];

    switch (type) {
      case EmergencyType.FLASH_CRASH:
      case EmergencyType.MARKET_CRASH:
        actions.push(
          'Halt all trading operations',
          'Cancel pending orders',
          'Enable circuit breakers',
          'Switch to read-only mode',
          'Snapshot current positions',
        );
        break;

      case EmergencyType.LIQUIDITY_CRISIS:
        actions.push(
          'Pause liquidity provision',
          'Reduce position sizes',
          'Increase collateral requirements',
          'Monitor liquidation cascades',
        );
        break;

      case EmergencyType.PROTOCOL_HACK:
        actions.push(
          'Disconnect from affected protocol',
          'Freeze all interactions',
          'Audit exposure',
          'Enable emergency withdrawal',
          'Contact security team',
        );
        break;

      case EmergencyType.BRIDGE_FAILURE:
        actions.push(
          'Halt bridge operations',
          'Queue pending transfers',
          'Switch to alternative bridges',
          'Monitor stuck funds',
        );
        break;

      case EmergencyType.ORACLE_FAILURE:
        actions.push(
          'Switch to backup oracles',
          'Pause price-dependent operations',
          'Use TWAP pricing',
          'Increase safety margins',
        );
        break;

      case EmergencyType.NETWORK_CONGESTION:
        actions.push(
          'Increase gas buffers',
          'Batch transactions',
          'Defer non-critical operations',
          'Use alternative networks',
        );
        break;

      case EmergencyType.REGULATORY_EVENT:
        actions.push(
          'Pause affected operations',
          'Enable compliance mode',
          'Restrict access by jurisdiction',
          'Generate compliance reports',
        );
        break;

      case EmergencyType.SYSTEMIC_RISK:
        actions.push(
          'Enable maximum protection',
          'Reduce all exposures',
          'Increase monitoring frequency',
          'Prepare for cascading failures',
        );
        break;

      default:
        actions.push('Monitor situation', 'Increase alertness', 'Prepare contingency plans');
    }

    return actions;
  }

  /**
   * Create notifications
   */
  private createNotifications(
    type: EmergencyType,
    severity: EmergencySeverity,
  ): EmergencyResponse['notifications'] {
    const notifications: EmergencyResponse['notifications'] = [];

    // Determine priority
    const priority =
      severity === EmergencySeverity.CRITICAL
        ? 'urgent'
        : severity === EmergencySeverity.HIGH
          ? 'high'
          : 'normal';

    // Create main notification
    notifications.push({
      priority,
      channels: ['discord', 'telegram', 'email'],
      message: `🚨 EMERGENCY: ${type.replace('_', ' ').toUpperCase()} detected. Severity: ${severity}. Emergency protocols activated.`,
    });

    // Add severity-specific notifications
    if (severity === EmergencySeverity.CRITICAL) {
      notifications.push({
        priority: 'urgent',
        channels: ['pagerduty', 'phone'],
        message: `CRITICAL EMERGENCY requiring immediate attention: ${type}`,
      });
    }

    return notifications;
  }

  /**
   * Determine system adjustments
   */
  private determineSystemAdjustments(
    type: EmergencyType,
    severity: EmergencySeverity,
  ): EmergencyResponse['systemAdjustments'] {
    // Determine degradation level
    let degradationLevel: DegradationLevel;
    switch (severity) {
      case EmergencySeverity.CRITICAL:
        degradationLevel = DegradationLevel.LEVEL3;
        break;
      case EmergencySeverity.HIGH:
        degradationLevel = DegradationLevel.LEVEL2;
        break;
      case EmergencySeverity.MEDIUM:
        degradationLevel = DegradationLevel.LEVEL1;
        break;
      default:
        degradationLevel = DegradationLevel.NORMAL;
    }

    // Determine circuit breakers to activate
    const circuitBreakers: string[] = [];
    switch (type) {
      case EmergencyType.PROTOCOL_HACK:
      case EmergencyType.BRIDGE_FAILURE:
        circuitBreakers.push('dex', 'bridge', 'protocol');
        break;
      case EmergencyType.ORACLE_FAILURE:
        circuitBreakers.push('oracle', 'price');
        break;
      case EmergencyType.NETWORK_CONGESTION:
        circuitBreakers.push('rpc', 'transaction');
        break;
      default:
        circuitBreakers.push('trading', 'liquidity');
    }

    // Determine features to disable
    const disabledFeatures: string[] = [];
    if (severity === EmergencySeverity.CRITICAL) {
      disabledFeatures.push('trading', 'liquidity_provision', 'bridging', 'staking', 'governance');
    } else if (severity === EmergencySeverity.HIGH) {
      disabledFeatures.push('leveraged_trading', 'flash_loans', 'complex_strategies');
    }

    return {
      circuitBreakers,
      degradationLevel,
      resourceLimit:
        severity === EmergencySeverity.CRITICAL
          ? 10
          : severity === EmergencySeverity.HIGH
            ? 30
            : severity === EmergencySeverity.MEDIUM
              ? 60
              : 80,
      disabledFeatures,
    };
  }

  /**
   * Create recovery plan
   */
  private createRecoveryPlan(
    _type: EmergencyType,
    severity: EmergencySeverity,
  ): EmergencyResponse['recoveryPlan'] {
    const baseTime =
      severity === EmergencySeverity.CRITICAL
        ? 3600000 // 1 hour
        : severity === EmergencySeverity.HIGH
          ? 1800000 // 30 minutes
          : severity === EmergencySeverity.MEDIUM
            ? 900000 // 15 minutes
            : 300000; // 5 minutes

    return {
      conditions: [
        'Market stabilization confirmed',
        'No new incidents for 15 minutes',
        'System health checks passed',
        'Manual clearance provided',
      ],
      estimatedTime: baseTime,
      steps: [
        'Monitor key metrics for stability',
        'Gradually restore disabled features',
        'Reset circuit breakers one by one',
        'Return to normal degradation level',
        'Conduct post-incident review',
      ],
    };
  }

  /**
   * Execute immediate actions
   */
  private async executeImmediateActions(response: EmergencyResponse): Promise<void> {
    // Apply system adjustments
    this.degradationManager.forceDegrade(response.systemAdjustments.degradationLevel);

    // Activate circuit breakers
    for (const breaker of response.systemAdjustments.circuitBreakers) {
      const circuit = this.circuitManager.getCircuit(breaker);
      if (circuit) {
        circuit.forceOpen();
      }
    }

    // Set resource limits
    this.resourceManager.setEmergencyMode(true, response.systemAdjustments.resourceLimit);

    // Send notifications
    for (const notification of response.notifications) {
      this.emit('send-notification', notification);
    }

    // Record actions
    this.state.actions = response.immediateActions;
  }

  /**
   * Deactivate emergency protocol
   */
  public async deactivateEmergency(type?: EmergencyType): Promise<void> {
    if (type) {
      this.activeProtocols.delete(type);
    } else {
      this.activeProtocols.clear();
    }

    if (this.activeProtocols.size === 0) {
      // No more active emergencies
      this.state.active = false;

      // Restore normal operations
      this.degradationManager.forceRecover();
      this.resourceManager.setEmergencyMode(false);
      this.circuitManager.resetAll();

      this.emit('emergency-deactivated', {
        duration: Date.now() - (this.state.startTime || 0),
      });
    }
  }

  /**
   * Helper methods
   */

  private identifyAffectedAssets(type: EmergencyType): string[] {
    switch (type) {
      case EmergencyType.MARKET_CRASH:
      case EmergencyType.FLASH_CRASH:
        return ['BTC', 'ETH', 'ALTS'];
      case EmergencyType.PROTOCOL_HACK:
        return ['PROTOCOL_TOKEN'];
      case EmergencyType.BRIDGE_FAILURE:
        return ['BRIDGED_ASSETS'];
      default:
        return ['ALL'];
    }
  }

  private estimateImpact(
    type: EmergencyType,
    severity: EmergencySeverity,
  ): EmergencyState['estimatedImpact'] {
    const severityMultiplier =
      severity === EmergencySeverity.CRITICAL
        ? 1000000000 // $1B
        : severity === EmergencySeverity.HIGH
          ? 100000000 // $100M
          : severity === EmergencySeverity.MEDIUM
            ? 10000000 // $10M
            : 1000000; // $1M

    return {
      financial: severityMultiplier,
      users: severityMultiplier / 10000,
      protocols: this.identifyAffectedProtocols(type),
    };
  }

  private identifyAffectedProtocols(type: EmergencyType): string[] {
    switch (type) {
      case EmergencyType.LIQUIDITY_CRISIS:
        return ['Uniswap', 'Curve', 'Balancer'];
      case EmergencyType.PROTOCOL_HACK:
        return ['Affected_Protocol'];
      case EmergencyType.BRIDGE_FAILURE:
        return ['Bridge_Protocol'];
      default:
        return [];
    }
  }

  /**
   * Public API
   */

  public getState(): EmergencyState {
    return { ...this.state };
  }

  public getActiveProtocols(): Map<EmergencyType, EmergencyResponse> {
    return new Map(this.activeProtocols);
  }

  public getMetrics(): MarketMetrics {
    return { ...this.metrics };
  }

  public isEmergencyActive(): boolean {
    return this.state.active;
  }

  public getStatistics(): any {
    return {
      currentState: this.state,
      activeEmergencies: this.activeProtocols.size,
      totalResponses: this.responseHistory.length,
      metrics: this.metrics,
      config: this.config,
      emergencyTypes: Object.values(EmergencyType),
      severityLevels: Object.values(EmergencySeverity),
    };
  }

  /**
   * Manual override
   */
  public manualTrigger(
    type: EmergencyType,
    severity: EmergencySeverity,
    reason: string,
  ): Promise<EmergencyResponse> {
    if (!this.config.manualOverride) {
      throw new Error('Manual override not enabled');
    }

    return this.activateEmergencyProtocol(type, severity, `Manual: ${reason}`);
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = undefined;
    }
  }
}

export default EmergencyProtocolManager;
