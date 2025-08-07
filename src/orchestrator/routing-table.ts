/**
 * Master Routing Table for OnChainAgents
 * Maps crypto patterns to optimal execution strategies
 * Inspired by SuperClaude's routing intelligence
 */

import { EventEmitter } from 'events';
import { CryptoDomain, OperationType, DetectionResult } from './detection-engine';
import { PersonaType } from '../personas';
import { SubAgentType } from './delegation-engine';
import { WaveStrategy } from './wave-engine';
import { DegradationLevel } from '../resilience/graceful-degradation';

// Route pattern
export interface RoutePattern {
  id: string;
  pattern: string;
  regex?: RegExp;
  keywords: string[];
  domains: CryptoDomain[];
  operations: OperationType[];
  complexity: {
    min: number;
    max: number;
  };
}

// Route decision
export interface RouteDecision {
  routeId: string;
  pattern: RoutePattern;
  confidence: number;
  primaryPersona: PersonaType;
  secondaryPersonas: PersonaType[];
  agents: SubAgentType[];
  waveStrategy?: WaveStrategy;
  autoActivates: {
    flags: string[];
    mcp: string[];
    delegation: boolean;
    waves: boolean;
  };
  resourceRequirements: {
    tokens: number;
    memory: number;
    time: number;
  };
  fallbackRoutes: string[];
}

// Route configuration
export interface RouteConfig {
  pattern: string;
  complexity: string;
  domain: string;
  confidence: number;
  autoActivates: string;
}

// Route metrics
export interface RouteMetrics {
  routeId: string;
  usageCount: number;
  successRate: number;
  averageLatency: number;
  averageTokens: number;
  lastUsed: number;
}

/**
 * Master Routing Table
 * Core routing intelligence for crypto operations
 */
export class MasterRoutingTable extends EventEmitter {
  private routes: Map<string, RouteDecision> = new Map();
  private patterns: Map<string, RoutePattern> = new Map();
  private metrics: Map<string, RouteMetrics> = new Map();
  private routeHistory: Array<{
    timestamp: number;
    input: string;
    routeId: string;
    confidence: number;
    result: 'success' | 'failure' | 'fallback';
  }> = [];

  constructor() {
    super();
    this.initializeRoutes();
  }

  /**
   * Initialize master routing table
   * Based on SuperClaude's patterns adapted for crypto
   */
  private initializeRoutes(): void {
    const routes: Array<{
      pattern: RoutePattern;
      decision: Omit<RouteDecision, 'routeId' | 'pattern' | 'confidence'>;
    }> = [
      // Whale tracking patterns
      {
        pattern: {
          id: 'whale_analysis',
          pattern: 'analyze whale activity',
          keywords: ['whale', 'large holder', 'accumulation', 'distribution'],
          domains: [CryptoDomain.WHALE],
          operations: [OperationType.TRACKING, OperationType.ANALYSIS],
          complexity: { min: 0.7, max: 1.0 },
        },
        decision: {
          primaryPersona: PersonaType.WHALE_HUNTER,
          secondaryPersonas: [PersonaType.MARKET_MAKER],
          agents: [SubAgentType.WHALE_TRACKER, SubAgentType.CHAIN_EXPLORER],
          waveStrategy: WaveStrategy.PROGRESSIVE,
          autoActivates: {
            flags: ['--think', '--seq'],
            mcp: ['hive'],
            delegation: true,
            waves: false,
          },
          resourceRequirements: {
            tokens: 15000,
            memory: 512,
            time: 45,
          },
          fallbackRoutes: ['simple_whale_check'],
        },
      },

      // DeFi optimization patterns
      {
        pattern: {
          id: 'defi_yield_optimization',
          pattern: 'optimize DeFi yields',
          keywords: ['yield', 'APY', 'farming', 'liquidity', 'optimize'],
          domains: [CryptoDomain.DEFI, CryptoDomain.YIELD],
          operations: [OperationType.OPTIMIZATION, OperationType.CALCULATION],
          complexity: { min: 0.8, max: 1.0 },
        },
        decision: {
          primaryPersona: PersonaType.DEFI_ARCHITECT,
          secondaryPersonas: [PersonaType.YIELD_FARMER, PersonaType.RISK_MANAGER],
          agents: [SubAgentType.DEFI_ANALYZER, SubAgentType.YIELD_CALCULATOR],
          waveStrategy: WaveStrategy.SYSTEMATIC,
          autoActivates: {
            flags: ['--think-hard', '--seq', '--c7'],
            mcp: ['hive', 'defillama'],
            delegation: true,
            waves: true,
          },
          resourceRequirements: {
            tokens: 25000,
            memory: 1024,
            time: 90,
          },
          fallbackRoutes: ['simple_yield_check'],
        },
      },

      // Security audit patterns
      {
        pattern: {
          id: 'security_audit',
          pattern: 'security audit',
          keywords: ['audit', 'vulnerability', 'exploit', 'security', 'hack'],
          domains: [CryptoDomain.SECURITY],
          operations: [OperationType.SCANNING, OperationType.VALIDATION],
          complexity: { min: 0.9, max: 1.0 },
        },
        decision: {
          primaryPersona: PersonaType.SECURITY_AUDITOR,
          secondaryPersonas: [PersonaType.RISK_MANAGER],
          agents: [SubAgentType.SECURITY_SCANNER, SubAgentType.RISK_ASSESSOR],
          waveStrategy: WaveStrategy.SYSTEMATIC,
          autoActivates: {
            flags: ['--ultrathink', '--validate', '--safe-mode'],
            mcp: ['hive', 'sequential'],
            delegation: false, // Security should not be delegated
            waves: true,
          },
          resourceRequirements: {
            tokens: 32000,
            memory: 2048,
            time: 180,
          },
          fallbackRoutes: [],
        },
      },

      // Alpha discovery patterns
      {
        pattern: {
          id: 'alpha_discovery',
          pattern: 'find alpha opportunities',
          keywords: ['alpha', 'opportunity', 'early', 'gem', 'trending'],
          domains: [CryptoDomain.ALPHA],
          operations: [OperationType.DISCOVERY],
          complexity: { min: 0.6, max: 0.9 },
        },
        decision: {
          primaryPersona: PersonaType.ALPHA_SEEKER,
          secondaryPersonas: [PersonaType.SENTIMENT_ANALYST],
          agents: [SubAgentType.ALPHA_HUNTER, SubAgentType.SENTIMENT_ANALYZER],
          waveStrategy: WaveStrategy.ADAPTIVE,
          autoActivates: {
            flags: ['--think', '--delegate'],
            mcp: ['hive', 'dexscreener'],
            delegation: true,
            waves: false,
          },
          resourceRequirements: {
            tokens: 10000,
            memory: 512,
            time: 30,
          },
          fallbackRoutes: ['trending_tokens'],
        },
      },

      // Market analysis patterns
      {
        pattern: {
          id: 'market_analysis',
          pattern: 'analyze market',
          keywords: ['market', 'price', 'volume', 'trend', 'technical'],
          domains: [CryptoDomain.MARKET],
          operations: [OperationType.ANALYSIS, OperationType.MONITORING],
          complexity: { min: 0.5, max: 0.8 },
        },
        decision: {
          primaryPersona: PersonaType.MARKET_MAKER,
          secondaryPersonas: [PersonaType.SENTIMENT_ANALYST],
          agents: [SubAgentType.MARKET_MONITOR],
          autoActivates: {
            flags: ['--think'],
            mcp: ['coingecko'],
            delegation: false,
            waves: false,
          },
          resourceRequirements: {
            tokens: 5000,
            memory: 256,
            time: 15,
          },
          fallbackRoutes: ['price_check'],
        },
      },

      // NFT valuation patterns
      {
        pattern: {
          id: 'nft_valuation',
          pattern: 'value NFT',
          keywords: ['NFT', 'floor', 'rarity', 'collection', 'traits'],
          domains: [CryptoDomain.NFT],
          operations: [OperationType.ANALYSIS, OperationType.DISCOVERY],
          complexity: { min: 0.6, max: 0.9 },
        },
        decision: {
          primaryPersona: PersonaType.NFT_DEGEN,
          secondaryPersonas: [PersonaType.MARKET_MAKER],
          agents: [SubAgentType.NFT_VALUATOR],
          autoActivates: {
            flags: ['--think', '--magic'],
            mcp: ['hive'],
            delegation: false,
            waves: false,
          },
          resourceRequirements: {
            tokens: 8000,
            memory: 512,
            time: 20,
          },
          fallbackRoutes: ['floor_price_check'],
        },
      },

      // Bridge monitoring patterns
      {
        pattern: {
          id: 'bridge_analysis',
          pattern: 'monitor bridge',
          keywords: ['bridge', 'cross-chain', 'interoperability', 'transfer'],
          domains: [CryptoDomain.BRIDGE],
          operations: [OperationType.MONITORING, OperationType.VALIDATION],
          complexity: { min: 0.7, max: 1.0 },
        },
        decision: {
          primaryPersona: PersonaType.BRIDGE_GUARDIAN,
          secondaryPersonas: [PersonaType.SECURITY_AUDITOR],
          agents: [SubAgentType.BRIDGE_MONITOR, SubAgentType.CHAIN_EXPLORER],
          waveStrategy: WaveStrategy.SYSTEMATIC,
          autoActivates: {
            flags: ['--think', '--validate'],
            mcp: ['hive'],
            delegation: true,
            waves: false,
          },
          resourceRequirements: {
            tokens: 12000,
            memory: 768,
            time: 40,
          },
          fallbackRoutes: ['bridge_status'],
        },
      },

      // Governance tracking patterns
      {
        pattern: {
          id: 'governance_tracking',
          pattern: 'track governance',
          keywords: ['governance', 'proposal', 'voting', 'DAO', 'treasury'],
          domains: [CryptoDomain.GOVERNANCE],
          operations: [OperationType.TRACKING, OperationType.ANALYSIS],
          complexity: { min: 0.5, max: 0.8 },
        },
        decision: {
          primaryPersona: PersonaType.GOVERNANCE_GURU,
          secondaryPersonas: [],
          agents: [SubAgentType.GOVERNANCE_TRACKER],
          autoActivates: {
            flags: ['--think'],
            mcp: ['hive'],
            delegation: false,
            waves: false,
          },
          resourceRequirements: {
            tokens: 6000,
            memory: 384,
            time: 25,
          },
          fallbackRoutes: ['proposal_list'],
        },
      },

      // Risk assessment patterns
      {
        pattern: {
          id: 'risk_assessment',
          pattern: 'assess risk',
          keywords: ['risk', 'exposure', 'volatility', 'drawdown', 'VAR'],
          domains: [CryptoDomain.RISK],
          operations: [OperationType.CALCULATION, OperationType.VALIDATION],
          complexity: { min: 0.7, max: 1.0 },
        },
        decision: {
          primaryPersona: PersonaType.RISK_MANAGER,
          secondaryPersonas: [PersonaType.DEFI_ARCHITECT],
          agents: [SubAgentType.RISK_ASSESSOR],
          waveStrategy: WaveStrategy.SYSTEMATIC,
          autoActivates: {
            flags: ['--think-hard', '--validate'],
            mcp: ['hive', 'sequential'],
            delegation: false,
            waves: false,
          },
          resourceRequirements: {
            tokens: 18000,
            memory: 1024,
            time: 60,
          },
          fallbackRoutes: ['simple_risk_score'],
        },
      },

      // Sentiment analysis patterns
      {
        pattern: {
          id: 'sentiment_analysis',
          pattern: 'analyze sentiment',
          keywords: ['sentiment', 'social', 'buzz', 'mentions', 'community'],
          domains: [CryptoDomain.SENTIMENT],
          operations: [OperationType.ANALYSIS, OperationType.MONITORING],
          complexity: { min: 0.5, max: 0.7 },
        },
        decision: {
          primaryPersona: PersonaType.SENTIMENT_ANALYST,
          secondaryPersonas: [PersonaType.ALPHA_SEEKER],
          agents: [SubAgentType.SENTIMENT_ANALYZER],
          autoActivates: {
            flags: ['--think'],
            mcp: ['hive'],
            delegation: true,
            waves: false,
          },
          resourceRequirements: {
            tokens: 7000,
            memory: 512,
            time: 20,
          },
          fallbackRoutes: ['social_metrics'],
        },
      },

      // Complex multi-domain patterns
      {
        pattern: {
          id: 'comprehensive_analysis',
          pattern: 'comprehensive crypto analysis',
          keywords: ['comprehensive', 'complete', 'full', 'everything', 'all'],
          domains: [
            CryptoDomain.WHALE,
            CryptoDomain.DEFI,
            CryptoDomain.SECURITY,
            CryptoDomain.MARKET,
          ],
          operations: [OperationType.ANALYSIS, OperationType.DISCOVERY, OperationType.OPTIMIZATION],
          complexity: { min: 0.9, max: 1.0 },
        },
        decision: {
          primaryPersona: PersonaType.CHAIN_ANALYST,
          secondaryPersonas: [
            PersonaType.DEFI_ARCHITECT,
            PersonaType.SECURITY_AUDITOR,
            PersonaType.WHALE_HUNTER,
          ],
          agents: [
            SubAgentType.CHAIN_EXPLORER,
            SubAgentType.DEFI_ANALYZER,
            SubAgentType.SECURITY_SCANNER,
            SubAgentType.WHALE_TRACKER,
          ],
          waveStrategy: WaveStrategy.ENTERPRISE,
          autoActivates: {
            flags: ['--ultrathink', '--wave-mode', '--delegate', '--all-mcp'],
            mcp: ['hive', 'sequential', 'context7', 'magic'],
            delegation: true,
            waves: true,
          },
          resourceRequirements: {
            tokens: 50000,
            memory: 4096,
            time: 300,
          },
          fallbackRoutes: ['simplified_overview'],
        },
      },
    ];

    // Register all routes
    for (const { pattern, decision } of routes) {
      const routeId = pattern.id;

      this.patterns.set(routeId, pattern);

      this.routes.set(routeId, {
        routeId,
        pattern,
        confidence: 0.9, // Default confidence
        ...decision,
      });

      // Initialize metrics
      this.metrics.set(routeId, {
        routeId,
        usageCount: 0,
        successRate: 0,
        averageLatency: 0,
        averageTokens: 0,
        lastUsed: 0,
      });
    }
  }

  /**
   * Find best route for input
   */
  public findRoute(input: string, context?: DetectionResult): RouteDecision | undefined {
    const normalizedInput = input.toLowerCase();
    let bestMatch: { route: RouteDecision; score: number } | undefined;

    for (const [routeId, route] of this.routes) {
      const pattern = route.pattern;
      const score = this.calculateMatchScore(normalizedInput, pattern, context);

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          route: { ...route, confidence: score },
          score,
        };
      }
    }

    if (bestMatch) {
      // Record usage
      this.recordRouteUsage(bestMatch.route.routeId);

      // Emit event
      this.emit('route-matched', {
        input,
        routeId: bestMatch.route.routeId,
        confidence: bestMatch.score,
      });

      return bestMatch.route;
    }

    // No match found
    this.emit('route-not-found', { input });
    return undefined;
  }

  /**
   * Calculate match score
   */
  private calculateMatchScore(
    input: string,
    pattern: RoutePattern,
    context?: DetectionResult,
  ): number {
    let score = 0;
    let factors = 0;

    // Keyword matching (40%)
    const keywordMatches = pattern.keywords.filter((k) => input.includes(k)).length;
    const keywordScore = keywordMatches / Math.max(1, pattern.keywords.length);
    score += keywordScore * 0.4;
    factors++;

    // Pattern matching (30%)
    if (pattern.regex && pattern.regex.test(input)) {
      score += 0.3;
    } else if (input.includes(pattern.pattern)) {
      score += 0.3;
    }
    factors++;

    // Context matching (30%)
    if (context) {
      // Domain matching
      const domainOverlap = context.domains.filter((d) => pattern.domains.includes(d)).length;
      const domainScore = domainOverlap / Math.max(1, pattern.domains.length);

      // Operation matching
      const operationOverlap = context.operations.filter((o) =>
        pattern.operations.includes(o),
      ).length;
      const operationScore = operationOverlap / Math.max(1, pattern.operations.length);

      // Complexity matching
      const complexityMatch =
        context.complexity >= pattern.complexity.min &&
        context.complexity <= pattern.complexity.max;
      const complexityScore = complexityMatch ? 1 : 0;

      const contextScore = (domainScore + operationScore + complexityScore) / 3;
      score += contextScore * 0.3;
    }
    factors++;

    return factors > 0 ? score : 0;
  }

  /**
   * Get fallback route
   */
  public getFallbackRoute(
    routeId: string,
    degradationLevel?: DegradationLevel,
  ): RouteDecision | undefined {
    const route = this.routes.get(routeId);
    if (!route || route.fallbackRoutes.length === 0) {
      return undefined;
    }

    // Select fallback based on degradation level
    let fallbackIndex = 0;
    if (degradationLevel) {
      switch (degradationLevel) {
        case DegradationLevel.LEVEL1:
          fallbackIndex = 0;
          break;
        case DegradationLevel.LEVEL2:
          fallbackIndex = Math.min(1, route.fallbackRoutes.length - 1);
          break;
        case DegradationLevel.LEVEL3:
          fallbackIndex = route.fallbackRoutes.length - 1;
          break;
      }
    }

    const fallbackId = route.fallbackRoutes[fallbackIndex];
    return this.routes.get(fallbackId);
  }

  /**
   * Record route usage
   */
  private recordRouteUsage(routeId: string): void {
    const metrics = this.metrics.get(routeId);
    if (metrics) {
      metrics.usageCount++;
      metrics.lastUsed = Date.now();
    }

    this.routeHistory.push({
      timestamp: Date.now(),
      input: '',
      routeId,
      confidence: 0,
      result: 'success', // Will be updated later
    });
  }

  /**
   * Update route metrics
   */
  public updateRouteMetrics(
    routeId: string,
    result: 'success' | 'failure' | 'fallback',
    latency: number,
    tokensUsed: number,
  ): void {
    const metrics = this.metrics.get(routeId);
    if (!metrics) return;

    // Update success rate
    const successCount = metrics.usageCount * metrics.successRate;
    const newSuccessCount = result === 'success' ? successCount + 1 : successCount;
    metrics.successRate = newSuccessCount / metrics.usageCount;

    // Update average latency
    const totalLatency = metrics.averageLatency * (metrics.usageCount - 1);
    metrics.averageLatency = (totalLatency + latency) / metrics.usageCount;

    // Update average tokens
    const totalTokens = metrics.averageTokens * (metrics.usageCount - 1);
    metrics.averageTokens = (totalTokens + tokensUsed) / metrics.usageCount;

    // Update history
    const lastEntry = this.routeHistory[this.routeHistory.length - 1];
    if (lastEntry && lastEntry.routeId === routeId) {
      lastEntry.result = result;
    }

    this.emit('metrics-updated', {
      routeId,
      metrics,
    });
  }

  /**
   * Get route suggestions
   */
  public getSuggestions(partialInput: string): RoutePattern[] {
    const normalized = partialInput.toLowerCase();
    const suggestions: RoutePattern[] = [];

    for (const pattern of this.patterns.values()) {
      const matches =
        pattern.keywords.some((k) => k.includes(normalized)) ||
        pattern.pattern.includes(normalized);

      if (matches) {
        suggestions.push(pattern);
      }
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Get route by ID
   */
  public getRoute(routeId: string): RouteDecision | undefined {
    return this.routes.get(routeId);
  }

  /**
   * Get all routes
   */
  public getAllRoutes(): RouteDecision[] {
    return Array.from(this.routes.values());
  }

  /**
   * Get route metrics
   */
  public getMetrics(routeId?: string): RouteMetrics | Map<string, RouteMetrics> {
    if (routeId) {
      return this.metrics.get(routeId)!;
    }
    return new Map(this.metrics);
  }

  /**
   * Get statistics
   */
  public getStatistics(): any {
    const allMetrics = Array.from(this.metrics.values());

    return {
      totalRoutes: this.routes.size,
      totalPatterns: this.patterns.size,
      totalUsage: allMetrics.reduce((sum, m) => sum + m.usageCount, 0),
      averageSuccessRate: allMetrics.reduce((sum, m) => sum + m.successRate, 0) / allMetrics.length,
      averageLatency: allMetrics.reduce((sum, m) => sum + m.averageLatency, 0) / allMetrics.length,
      mostUsedRoute: this.getMostUsedRoute(),
      leastUsedRoute: this.getLeastUsedRoute(),
      recentHistory: this.routeHistory.slice(-10),
    };
  }

  private getMostUsedRoute(): string | undefined {
    let maxUsage = 0;
    let mostUsed: string | undefined;

    for (const [routeId, metrics] of this.metrics) {
      if (metrics.usageCount > maxUsage) {
        maxUsage = metrics.usageCount;
        mostUsed = routeId;
      }
    }

    return mostUsed;
  }

  private getLeastUsedRoute(): string | undefined {
    let minUsage = Infinity;
    let leastUsed: string | undefined;

    for (const [routeId, metrics] of this.metrics) {
      if (metrics.usageCount < minUsage) {
        minUsage = metrics.usageCount;
        leastUsed = routeId;
      }
    }

    return leastUsed;
  }

  /**
   * Export routing table configuration
   */
  public exportConfiguration(): RouteConfig[] {
    const config: RouteConfig[] = [];

    for (const route of this.routes.values()) {
      config.push({
        pattern: route.pattern.pattern,
        complexity: `${route.pattern.complexity.min}-${route.pattern.complexity.max}`,
        domain: route.pattern.domains.join(','),
        confidence: route.confidence,
        autoActivates: route.autoActivates.flags.join(','),
      });
    }

    return config;
  }
}

export default MasterRoutingTable;
