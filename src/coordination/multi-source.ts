/**
 * Multi-Source Coordination System for OnChainAgents
 * Manages Hive Intelligence and fallback data sources
 * Provides reliable data aggregation with intelligent failover
 */

import { EventEmitter } from 'events';

// Data source types
export enum DataSourceType {
  HIVE = 'hive', // Primary: Hive Intelligence
  COINGECKO = 'coingecko', // Fallback: Price data
  ETHERSCAN = 'etherscan', // Fallback: Ethereum data
  DEXSCREENER = 'dexscreener', // Fallback: DEX data
  DEFILLAMA = 'defillama', // Fallback: DeFi TVL
  CHAINLINK = 'chainlink', // Fallback: Oracle data
  GRAPH = 'thegraph', // Fallback: Protocol data
  COVALENT = 'covalent', // Fallback: Multi-chain data
  MORALIS = 'moralis', // Fallback: Web3 data
  ALCHEMY = 'alchemy', // Fallback: Node provider
}

// Source configuration
export interface SourceConfig {
  type: DataSourceType;
  priority: number; // 1 = highest priority
  endpoint?: string;
  apiKey?: string;
  rateLimit: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  timeout: number; // milliseconds
  retryAttempts: number;
  capabilities: string[]; // What data this source can provide
  reliability: number; // 0-1 historical reliability score
  cost: number; // Cost per request in USD cents
}

// Data request
export interface DataRequest {
  id: string;
  type: string; // whale_data, price_data, defi_data, etc.
  params: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredSources?: DataSourceType[];
  excludeSources?: DataSourceType[];
  timeout?: number;
  cache?: boolean;
}

// Data response
export interface DataResponse {
  requestId: string;
  success: boolean;
  data?: any;
  source: DataSourceType;
  fallbacksUsed: DataSourceType[];
  latency: number;
  cost: number;
  errors?: Array<{
    source: DataSourceType;
    error: string;
  }>;
  metadata?: {
    timestamp: number;
    cacheHit: boolean;
    aggregated: boolean;
    confidence: number;
  };
}

// Source health status
export interface SourceHealth {
  source: DataSourceType;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  uptime: number; // Percentage
  averageLatency: number; // milliseconds
  errorRate: number; // Percentage
  remainingQuota: {
    requests: number;
    resetTime: number;
  };
  lastCheck: number;
}

// Aggregation strategy
export enum AggregationStrategy {
  FIRST_SUCCESS = 'first_success', // Use first successful response
  CONSENSUS = 'consensus', // Require multiple sources to agree
  WEIGHTED = 'weighted', // Weight by source reliability
  COMPLETE = 'complete', // Merge all responses
  FALLBACK = 'fallback', // Use fallback on primary failure
}

/**
 * Multi-Source Coordinator
 * Manages data source orchestration and fallback logic
 */
export class MultiSourceCoordinator extends EventEmitter {
  private sources: Map<DataSourceType, SourceConfig> = new Map();
  private sourceHealth: Map<DataSourceType, SourceHealth> = new Map();
  // Request queue would be used for batching requests
  // private _requestQueue: DataRequest[] = [];
  private activeRequests: Map<string, DataRequest> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 60000; // 1 minute default
  private aggregationStrategy: AggregationStrategy = AggregationStrategy.FALLBACK;

  constructor() {
    super();
    this.initializeSources();
    this.startHealthMonitoring();
  }

  /**
   * Initialize data sources with configuration
   */
  private initializeSources(): void {
    // Primary source: Hive Intelligence
    this.sources.set(DataSourceType.HIVE, {
      type: DataSourceType.HIVE,
      priority: 1,
      endpoint: 'https://api.hiveintelligence.xyz',
      rateLimit: {
        requestsPerSecond: 10,
        requestsPerMinute: 100,
        requestsPerDay: 10000,
      },
      timeout: 5000,
      retryAttempts: 3,
      capabilities: [
        'whale_tracking',
        'alpha_signals',
        'security_analysis',
        'defi_analytics',
        'market_sentiment',
        'on_chain_data',
      ],
      reliability: 0.95,
      cost: 5,
    });

    // Fallback sources
    this.sources.set(DataSourceType.COINGECKO, {
      type: DataSourceType.COINGECKO,
      priority: 2,
      endpoint: 'https://api.coingecko.com/api/v3',
      rateLimit: {
        requestsPerSecond: 5,
        requestsPerMinute: 50,
        requestsPerDay: 5000,
      },
      timeout: 3000,
      retryAttempts: 2,
      capabilities: ['price_data', 'market_data', 'token_info'],
      reliability: 0.9,
      cost: 0,
    });

    this.sources.set(DataSourceType.ETHERSCAN, {
      type: DataSourceType.ETHERSCAN,
      priority: 3,
      endpoint: 'https://api.etherscan.io/api',
      rateLimit: {
        requestsPerSecond: 5,
        requestsPerMinute: 100,
        requestsPerDay: 10000,
      },
      timeout: 3000,
      retryAttempts: 2,
      capabilities: ['ethereum_data', 'contract_data', 'transaction_data'],
      reliability: 0.92,
      cost: 0,
    });

    this.sources.set(DataSourceType.DEXSCREENER, {
      type: DataSourceType.DEXSCREENER,
      priority: 4,
      endpoint: 'https://api.dexscreener.com',
      rateLimit: {
        requestsPerSecond: 3,
        requestsPerMinute: 60,
        requestsPerDay: 5000,
      },
      timeout: 4000,
      retryAttempts: 2,
      capabilities: ['dex_data', 'liquidity_data', 'pair_data'],
      reliability: 0.88,
      cost: 0,
    });

    this.sources.set(DataSourceType.DEFILLAMA, {
      type: DataSourceType.DEFILLAMA,
      priority: 5,
      endpoint: 'https://api.llama.fi',
      rateLimit: {
        requestsPerSecond: 10,
        requestsPerMinute: 200,
        requestsPerDay: 20000,
      },
      timeout: 3000,
      retryAttempts: 2,
      capabilities: ['tvl_data', 'protocol_data', 'yield_data'],
      reliability: 0.91,
      cost: 0,
    });

    // Initialize health status
    for (const source of this.sources.keys()) {
      this.sourceHealth.set(source, {
        source,
        status: 'healthy',
        uptime: 100,
        averageLatency: 0,
        errorRate: 0,
        remainingQuota: {
          requests: 1000,
          resetTime: Date.now() + 3600000,
        },
        lastCheck: Date.now(),
      });
    }
  }

  /**
   * Start health monitoring for all sources
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.checkSourceHealth();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check health of all sources
   */
  private async checkSourceHealth(): Promise<void> {
    for (const [sourceType, config] of this.sources) {
      try {
        const startTime = Date.now();
        const isHealthy = await this.pingSource(sourceType);
        const latency = Date.now() - startTime;

        const health = this.sourceHealth.get(sourceType)!;
        health.lastCheck = Date.now();
        health.averageLatency = health.averageLatency * 0.9 + latency * 0.1;

        if (isHealthy) {
          health.status = latency < config.timeout * 0.5 ? 'healthy' : 'degraded';
          health.uptime = Math.min(100, health.uptime + 1);
          health.errorRate = Math.max(0, health.errorRate - 1);
        } else {
          health.status = 'unhealthy';
          health.uptime = Math.max(0, health.uptime - 5);
          health.errorRate = Math.min(100, health.errorRate + 10);
        }

        if (health.errorRate > 50) {
          health.status = 'offline';
        }

        this.emit('health-update', {
          source: sourceType,
          health,
        });
      } catch (error) {
        const health = this.sourceHealth.get(sourceType)!;
        health.status = 'offline';
        health.errorRate = 100;

        this.emit('health-check-failed', {
          source: sourceType,
          error,
        });
      }
    }
  }

  /**
   * Ping a data source
   */
  private async pingSource(_source: DataSourceType): Promise<boolean> {
    // Simulate ping - in production, make actual health check request
    return new Promise((resolve) => {
      setTimeout(() => {
        // 90% success rate simulation
        resolve(Math.random() > 0.1);
      }, Math.random() * 1000);
    });
  }

  /**
   * Request data with automatic source selection and fallback
   */
  public async requestData(request: DataRequest): Promise<DataResponse> {
    const startTime = Date.now();

    // Check cache first
    if (request.cache) {
      const cached = this.checkCache(request);
      if (cached) {
        return {
          requestId: request.id,
          success: true,
          data: cached,
          source: DataSourceType.HIVE, // Assume primary for cache
          fallbacksUsed: [],
          latency: 0,
          cost: 0,
          metadata: {
            timestamp: Date.now(),
            cacheHit: true,
            aggregated: false,
            confidence: 1.0,
          },
        };
      }
    }

    // Add to active requests
    this.activeRequests.set(request.id, request);

    // Determine eligible sources
    const eligibleSources = this.determineEligibleSources(request);

    if (eligibleSources.length === 0) {
      return {
        requestId: request.id,
        success: false,
        source: DataSourceType.HIVE,
        fallbacksUsed: [],
        latency: Date.now() - startTime,
        cost: 0,
        errors: [
          {
            source: DataSourceType.HIVE,
            error: 'No eligible sources available',
          },
        ],
      };
    }

    // Execute based on aggregation strategy
    let response: DataResponse;

    switch (this.aggregationStrategy) {
      case AggregationStrategy.FIRST_SUCCESS:
        response = await this.executeFirstSuccess(request, eligibleSources);
        break;
      case AggregationStrategy.CONSENSUS:
        response = await this.executeConsensus(request, eligibleSources);
        break;
      case AggregationStrategy.WEIGHTED:
        response = await this.executeWeighted(request, eligibleSources);
        break;
      case AggregationStrategy.COMPLETE:
        response = await this.executeComplete(request, eligibleSources);
        break;
      case AggregationStrategy.FALLBACK:
      default:
        response = await this.executeFallback(request, eligibleSources);
        break;
    }

    // Cache successful responses
    if (response.success && request.cache) {
      this.cacheResponse(request, response.data);
    }

    // Clean up
    this.activeRequests.delete(request.id);

    return response;
  }

  /**
   * Determine eligible sources for request
   */
  private determineEligibleSources(request: DataRequest): DataSourceType[] {
    const eligible: DataSourceType[] = [];

    for (const [sourceType, config] of this.sources) {
      // Check if excluded
      if (request.excludeSources?.includes(sourceType)) continue;

      // Check if required
      if (request.requiredSources && !request.requiredSources.includes(sourceType)) continue;

      // Check health
      const health = this.sourceHealth.get(sourceType)!;
      if (health.status === 'offline') continue;

      // Check capabilities
      const hasCapability = config.capabilities.some(
        (cap) => request.type.includes(cap) || cap.includes(request.type),
      );
      if (!hasCapability) continue;

      // Check rate limits
      if (health.remainingQuota.requests <= 0) continue;

      eligible.push(sourceType);
    }

    // Sort by priority
    eligible.sort((a, b) => {
      const configA = this.sources.get(a)!;
      const configB = this.sources.get(b)!;
      return configA.priority - configB.priority;
    });

    return eligible;
  }

  /**
   * Execute first success strategy
   */
  private async executeFirstSuccess(
    request: DataRequest,
    sources: DataSourceType[],
  ): Promise<DataResponse> {
    const errors: Array<{ source: DataSourceType; error: string }> = [];
    const fallbacksUsed: DataSourceType[] = [];
    let totalCost = 0;

    for (const source of sources) {
      try {
        const data = await this.fetchFromSource(source, request);

        return {
          requestId: request.id,
          success: true,
          data,
          source,
          fallbacksUsed,
          latency: Date.now() - Date.now(),
          cost: totalCost + this.sources.get(source)!.cost,
          metadata: {
            timestamp: Date.now(),
            cacheHit: false,
            aggregated: false,
            confidence: this.sources.get(source)!.reliability,
          },
        };
      } catch (error) {
        errors.push({ source, error: (error as Error).toString() });
        fallbacksUsed.push(source);
        totalCost += this.sources.get(source)!.cost;
      }
    }

    return {
      requestId: request.id,
      success: false,
      source: sources[0],
      fallbacksUsed,
      latency: Date.now() - Date.now(),
      cost: totalCost,
      errors,
    };
  }

  /**
   * Execute consensus strategy
   */
  private async executeConsensus(
    request: DataRequest,
    sources: DataSourceType[],
  ): Promise<DataResponse> {
    const responses: Map<DataSourceType, any> = new Map();
    const errors: Array<{ source: DataSourceType; error: string }> = [];
    let totalCost = 0;

    // Fetch from multiple sources in parallel
    const promises = sources.slice(0, 3).map(async (source) => {
      try {
        const data = await this.fetchFromSource(source, request);
        responses.set(source, data);
        totalCost += this.sources.get(source)!.cost;
      } catch (error) {
        errors.push({ source, error: (error as Error).toString() });
      }
    });

    await Promise.all(promises);

    // Check for consensus
    if (responses.size >= 2) {
      const consensusData = this.findConsensus(responses);

      return {
        requestId: request.id,
        success: true,
        data: consensusData,
        source: Array.from(responses.keys())[0],
        fallbacksUsed: Array.from(responses.keys()).slice(1),
        latency: Date.now() - Date.now(),
        cost: totalCost,
        metadata: {
          timestamp: Date.now(),
          cacheHit: false,
          aggregated: true,
          confidence: 0.9,
        },
      };
    }

    return {
      requestId: request.id,
      success: false,
      source: sources[0],
      fallbacksUsed: sources.slice(1),
      latency: Date.now() - Date.now(),
      cost: totalCost,
      errors,
    };
  }

  /**
   * Execute weighted strategy
   */
  private async executeWeighted(
    request: DataRequest,
    sources: DataSourceType[],
  ): Promise<DataResponse> {
    const responses: Map<DataSourceType, any> = new Map();
    const weights: Map<DataSourceType, number> = new Map();
    let totalCost = 0;

    // Fetch from sources based on reliability
    const promises = sources.slice(0, 3).map(async (source) => {
      const config = this.sources.get(source)!;
      weights.set(source, config.reliability);

      try {
        const data = await this.fetchFromSource(source, request);
        responses.set(source, data);
        totalCost += config.cost;
      } catch (error) {
        weights.set(source, 0);
      }
    });

    await Promise.all(promises);

    // Calculate weighted result
    const weightedData = this.calculateWeightedResult(responses, weights);

    return {
      requestId: request.id,
      success: responses.size > 0,
      data: weightedData,
      source: Array.from(responses.keys())[0] || sources[0],
      fallbacksUsed: Array.from(responses.keys()).slice(1),
      latency: Date.now() - Date.now(),
      cost: totalCost,
      metadata: {
        timestamp: Date.now(),
        cacheHit: false,
        aggregated: true,
        confidence: this.calculateConfidence(weights),
      },
    };
  }

  /**
   * Execute complete strategy
   */
  private async executeComplete(
    request: DataRequest,
    sources: DataSourceType[],
  ): Promise<DataResponse> {
    const responses: Map<DataSourceType, any> = new Map();
    let totalCost = 0;

    // Fetch from all sources
    const promises = sources.map(async (source) => {
      try {
        const data = await this.fetchFromSource(source, request);
        responses.set(source, data);
        totalCost += this.sources.get(source)!.cost;
      } catch (error) {
        // Continue with other sources
      }
    });

    await Promise.all(promises);

    // Merge all responses
    const mergedData = this.mergeResponses(responses);

    return {
      requestId: request.id,
      success: responses.size > 0,
      data: mergedData,
      source: sources[0],
      fallbacksUsed: sources.slice(1),
      latency: Date.now() - Date.now(),
      cost: totalCost,
      metadata: {
        timestamp: Date.now(),
        cacheHit: false,
        aggregated: true,
        confidence: responses.size / sources.length,
      },
    };
  }

  /**
   * Execute fallback strategy (default)
   */
  private async executeFallback(
    request: DataRequest,
    sources: DataSourceType[],
  ): Promise<DataResponse> {
    const errors: Array<{ source: DataSourceType; error: string }> = [];
    const fallbacksUsed: DataSourceType[] = [];
    let totalCost = 0;
    const startTime = Date.now();

    for (const source of sources) {
      try {
        const data = await this.fetchFromSource(source, request);

        // Update source metrics
        this.updateSourceMetrics(source, true, Date.now() - startTime);

        return {
          requestId: request.id,
          success: true,
          data,
          source,
          fallbacksUsed,
          latency: Date.now() - startTime,
          cost: totalCost + this.sources.get(source)!.cost,
          metadata: {
            timestamp: Date.now(),
            cacheHit: false,
            aggregated: false,
            confidence: this.sources.get(source)!.reliability,
          },
        };
      } catch (error) {
        errors.push({ source, error: (error as Error).toString() });
        fallbacksUsed.push(source);
        totalCost += this.sources.get(source)!.cost;

        // Update source metrics
        this.updateSourceMetrics(source, false, Date.now() - startTime);

        this.emit('fallback-triggered', {
          failedSource: source,
          nextSource: sources[sources.indexOf(source) + 1],
          error,
        });
      }
    }

    return {
      requestId: request.id,
      success: false,
      source: sources[0],
      fallbacksUsed,
      latency: Date.now() - startTime,
      cost: totalCost,
      errors,
    };
  }

  /**
   * Fetch data from a specific source
   */
  private async fetchFromSource(source: DataSourceType, request: DataRequest): Promise<any> {
    const config = this.sources.get(source)!;

    // Check rate limit
    const health = this.sourceHealth.get(source)!;
    if (health.remainingQuota.requests <= 0) {
      throw new Error(`Rate limit exceeded for ${source}`);
    }

    // Update quota
    health.remainingQuota.requests--;

    // Simulate API call - in production, make actual request
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout for ${source}`));
      }, config.timeout);

      setTimeout(
        () => {
          clearTimeout(timeout);

          // Simulate 85% success rate
          if (Math.random() > 0.15) {
            resolve(this.generateMockData(source, request));
          } else {
            reject(new Error(`Failed to fetch from ${source}`));
          }
        },
        Math.random() * config.timeout * 0.8,
      );
    });
  }

  /**
   * Generate mock data based on source and request
   */
  private generateMockData(source: DataSourceType, request: DataRequest): any {
    switch (request.type) {
      case 'whale_data':
        return {
          whales: [
            { address: '0x123...', balance: 15000000, source },
            { address: '0x456...', balance: 8000000, source },
          ],
        };
      case 'price_data':
        return {
          price: 2500.5,
          change24h: 5.2,
          volume: 1500000000,
          source,
        };
      case 'defi_data':
        return {
          tvl: 125000000,
          protocols: 25,
          averageApy: 12.5,
          source,
        };
      default:
        return { data: 'mock', source };
    }
  }

  /**
   * Find consensus among multiple responses
   */
  private findConsensus(responses: Map<DataSourceType, any>): any {
    // Simple consensus: return most common value
    const values = Array.from(responses.values());

    if (values.length === 0) return null;
    if (values.length === 1) return values[0];

    // For complex data, merge common fields
    const consensus: any = {};

    for (const value of values) {
      for (const key in value) {
        if (consensus[key] === undefined) {
          consensus[key] = value[key];
        }
      }
    }

    return consensus;
  }

  /**
   * Calculate weighted result
   */
  private calculateWeightedResult(
    responses: Map<DataSourceType, any>,
    weights: Map<DataSourceType, number>,
  ): any {
    // For numeric values, calculate weighted average
    // For other types, use highest weight source

    let highestWeight = 0;
    let bestSource: DataSourceType | null = null;

    for (const [source, weight] of weights) {
      if (weight > highestWeight && responses.has(source)) {
        highestWeight = weight;
        bestSource = source;
      }
    }

    return bestSource ? responses.get(bestSource) : null;
  }

  /**
   * Merge multiple responses
   */
  private mergeResponses(responses: Map<DataSourceType, any>): any {
    const merged: any = {
      sources: Array.from(responses.keys()),
      data: {},
    };

    for (const [source, data] of responses) {
      merged.data[source] = data;
    }

    return merged;
  }

  /**
   * Calculate confidence based on weights
   */
  private calculateConfidence(weights: Map<DataSourceType, number>): number {
    const values = Array.from(weights.values());
    if (values.length === 0) return 0;

    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  /**
   * Update source metrics
   */
  private updateSourceMetrics(source: DataSourceType, success: boolean, latency: number): void {
    const health = this.sourceHealth.get(source)!;

    if (success) {
      health.errorRate = Math.max(0, health.errorRate - 1);
      health.averageLatency = health.averageLatency * 0.9 + latency * 0.1;
    } else {
      health.errorRate = Math.min(100, health.errorRate + 5);
    }

    // Update reliability score
    const config = this.sources.get(source)!;
    config.reliability = config.reliability * 0.95 + (success ? 0.05 : 0);
  }

  /**
   * Check cache for request
   */
  private checkCache(request: DataRequest): any | null {
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    return null;
  }

  /**
   * Cache response
   */
  private cacheResponse(request: DataRequest, data: any): void {
    const cacheKey = this.getCacheKey(request);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(request: DataRequest): string {
    return `${request.type}_${JSON.stringify(request.params)}`;
  }

  /**
   * Get source health status
   */
  public getSourceHealth(): Map<DataSourceType, SourceHealth> {
    return new Map(this.sourceHealth);
  }

  /**
   * Set aggregation strategy
   */
  public setAggregationStrategy(strategy: AggregationStrategy): void {
    this.aggregationStrategy = strategy;
  }

  /**
   * Get statistics
   */
  public getStatistics(): any {
    const sources = Array.from(this.sources.values());
    const health = Array.from(this.sourceHealth.values());

    return {
      totalSources: sources.length,
      healthySources: health.filter((h) => h.status === 'healthy').length,
      degradedSources: health.filter((h) => h.status === 'degraded').length,
      offlineSources: health.filter((h) => h.status === 'offline').length,
      averageReliability: sources.reduce((sum, s) => sum + s.reliability, 0) / sources.length,
      averageLatency: health.reduce((sum, h) => sum + h.averageLatency, 0) / health.length,
      cacheSize: this.cache.size,
      activeRequests: this.activeRequests.size,
      aggregationStrategy: this.aggregationStrategy,
    };
  }
}

export default MultiSourceCoordinator;
