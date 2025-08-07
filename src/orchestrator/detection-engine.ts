/**
 * Detection Engine for OnChainAgents
 * Inspired by SuperClaude's pattern recognition system
 * Analyzes crypto operations to understand intent, complexity, and requirements
 */

import { EventEmitter } from 'events';

// Complexity levels matching SuperClaude's approach
export enum ComplexityLevel {
  SIMPLE = 'simple',      // <0.3 score
  MODERATE = 'moderate',  // 0.3-0.7 score  
  COMPLEX = 'complex',    // >0.7 score
}

// Crypto-specific domains
export enum CryptoDomain {
  DEFI = 'defi',
  NFT = 'nft',
  SECURITY = 'security',
  WHALE = 'whale',
  SENTIMENT = 'sentiment',
  MARKET = 'market',
  GOVERNANCE = 'governance',
  BRIDGE = 'bridge',
  YIELD = 'yield',
  ALPHA = 'alpha',
  RISK = 'risk',
}

// Operation types for crypto
export enum OperationType {
  ANALYSIS = 'analysis',
  TRACKING = 'tracking',
  SCANNING = 'scanning',
  MONITORING = 'monitoring',
  OPTIMIZATION = 'optimization',
  VALIDATION = 'validation',
  DISCOVERY = 'discovery',
  EXECUTION = 'execution',
  SIMULATION = 'simulation',
}

// Pattern recognition rules inspired by SuperClaude
interface PatternRule {
  keywords: string[];
  filePatterns?: string[];
  domains: CryptoDomain[];
  operations: OperationType[];
  complexityModifier: number;
  confidence: number;
}

export interface DetectionResult {
  // Core detection
  complexity: number;
  complexityLevel: ComplexityLevel;
  domains: CryptoDomain[];
  operations: OperationType[];
  
  // Intelligence scoring
  confidence: number;
  riskScore: number;
  priorityScore: number;
  
  // Resource predictions
  estimatedTokens: number;
  estimatedTime: number; // milliseconds
  estimatedMemory: number; // MB
  
  // Routing recommendations
  suggestedPersonas: string[];
  suggestedAgents: string[];
  requiresWaveMode: boolean;
  requiresParallel: boolean;
  
  // Evidence
  matchedPatterns: string[];
  detectedKeywords: string[];
  marketContext?: any;
}

export class DetectionEngine extends EventEmitter {
  private patternRules: Map<string, PatternRule>;
  private learningCache: Map<string, DetectionResult>;
  private successMetrics: Map<string, number>;
  
  constructor() {
    super();
    this.patternRules = new Map();
    this.learningCache = new Map();
    this.successMetrics = new Map();
    this.initializePatterns();
  }
  
  /**
   * Initialize crypto-specific pattern rules
   * Inspired by SuperClaude's domain identification
   */
  private initializePatterns(): void {
    // DeFi patterns
    this.patternRules.set('defi_yield', {
      keywords: ['yield', 'apy', 'apr', 'farming', 'liquidity', 'pool', 'stake', 'rewards'],
      domains: [CryptoDomain.DEFI, CryptoDomain.YIELD],
      operations: [OperationType.OPTIMIZATION, OperationType.ANALYSIS],
      complexityModifier: 0.6,
      confidence: 0.85,
    });
    
    // Security patterns
    this.patternRules.set('security_audit', {
      keywords: ['audit', 'vulnerability', 'exploit', 'rug', 'honeypot', 'malicious', 'hack'],
      domains: [CryptoDomain.SECURITY],
      operations: [OperationType.SCANNING, OperationType.VALIDATION],
      complexityModifier: 0.8,
      confidence: 0.95,
    });
    
    // Whale tracking patterns
    this.patternRules.set('whale_activity', {
      keywords: ['whale', 'large holder', 'accumulation', 'distribution', 'wallet', 'movement'],
      domains: [CryptoDomain.WHALE],
      operations: [OperationType.TRACKING, OperationType.MONITORING],
      complexityModifier: 0.5,
      confidence: 0.9,
    });
    
    // Alpha discovery patterns
    this.patternRules.set('alpha_hunting', {
      keywords: ['alpha', 'opportunity', 'gem', 'early', 'trending', 'momentum', 'breakout'],
      domains: [CryptoDomain.ALPHA],
      operations: [OperationType.DISCOVERY, OperationType.ANALYSIS],
      complexityModifier: 0.7,
      confidence: 0.75,
    });
    
    // NFT patterns
    this.patternRules.set('nft_analysis', {
      keywords: ['nft', 'collection', 'mint', 'rarity', 'floor', 'trait', 'metadata'],
      domains: [CryptoDomain.NFT],
      operations: [OperationType.ANALYSIS, OperationType.VALIDATION],
      complexityModifier: 0.5,
      confidence: 0.85,
    });
    
    // Market patterns
    this.patternRules.set('market_analysis', {
      keywords: ['price', 'volume', 'market cap', 'trend', 'resistance', 'support', 'chart'],
      domains: [CryptoDomain.MARKET],
      operations: [OperationType.ANALYSIS, OperationType.MONITORING],
      complexityModifier: 0.4,
      confidence: 0.8,
    });
    
    // Sentiment patterns
    this.patternRules.set('sentiment_analysis', {
      keywords: ['sentiment', 'social', 'twitter', 'reddit', 'discord', 'buzz', 'mentions'],
      domains: [CryptoDomain.SENTIMENT],
      operations: [OperationType.ANALYSIS, OperationType.MONITORING],
      complexityModifier: 0.5,
      confidence: 0.7,
    });
    
    // Bridge patterns
    this.patternRules.set('bridge_analysis', {
      keywords: ['bridge', 'cross-chain', 'multichain', 'interoperability', 'wrapped'],
      domains: [CryptoDomain.BRIDGE],
      operations: [OperationType.ANALYSIS, OperationType.VALIDATION],
      complexityModifier: 0.7,
      confidence: 0.85,
    });
    
    // Governance patterns
    this.patternRules.set('governance_tracking', {
      keywords: ['governance', 'proposal', 'vote', 'dao', 'treasury', 'delegate'],
      domains: [CryptoDomain.GOVERNANCE],
      operations: [OperationType.TRACKING, OperationType.ANALYSIS],
      complexityModifier: 0.6,
      confidence: 0.8,
    });
    
    // Risk patterns
    this.patternRules.set('risk_assessment', {
      keywords: ['risk', 'exposure', 'volatility', 'correlation', 'var', 'drawdown'],
      domains: [CryptoDomain.RISK],
      operations: [OperationType.ANALYSIS, OperationType.SIMULATION],
      complexityModifier: 0.8,
      confidence: 0.9,
    });
  }
  
  /**
   * Analyze request to detect patterns and complexity
   * Core of the SuperClaude-inspired intelligence
   */
  public async analyze(tool: string, args: Record<string, any>): Promise<DetectionResult> {
    const startTime = Date.now();
    
    // Check learning cache first
    const cacheKey = this.getCacheKey(tool, args);
    if (this.learningCache.has(cacheKey)) {
      const cached = this.learningCache.get(cacheKey)!;
      this.emit('cache-hit', { tool, args, result: cached });
      return cached;
    }
    
    // Extract text for analysis
    const text = this.extractText(tool, args);
    
    // Pattern matching
    const matchedPatterns = this.matchPatterns(text);
    
    // Calculate complexity score (0.0 - 1.0)
    const complexityScore = this.calculateComplexity(matchedPatterns, args);
    
    // Determine domains and operations
    const domains = this.extractDomains(matchedPatterns);
    const operations = this.extractOperations(matchedPatterns);
    
    // Calculate risk and priority
    const riskScore = this.calculateRisk(domains, operations, args);
    const priorityScore = this.calculatePriority(domains, riskScore, complexityScore);
    
    // Estimate resource requirements
    const estimatedTokens = this.estimateTokens(complexityScore, domains.length);
    const estimatedTime = this.estimateTime(complexityScore, operations);
    const estimatedMemory = this.estimateMemory(complexityScore, domains.length);
    
    // Determine routing recommendations
    const suggestedPersonas = this.suggestPersonas(domains, operations);
    const suggestedAgents = this.suggestAgents(domains, operations);
    
    // Wave mode detection (inspired by SuperClaude)
    const requiresWaveMode = this.shouldUseWaveMode(complexityScore, domains, operations);
    const requiresParallel = this.shouldUseParallel(domains, operations);
    
    // Build result
    const result: DetectionResult = {
      complexity: complexityScore,
      complexityLevel: this.getComplexityLevel(complexityScore),
      domains,
      operations,
      confidence: this.calculateConfidence(matchedPatterns),
      riskScore,
      priorityScore,
      estimatedTokens,
      estimatedTime,
      estimatedMemory,
      suggestedPersonas,
      suggestedAgents,
      requiresWaveMode,
      requiresParallel,
      matchedPatterns: matchedPatterns.map(p => p[0]),
      detectedKeywords: this.extractKeywords(text),
    };
    
    // Cache result for learning
    this.learningCache.set(cacheKey, result);
    
    // Emit detection event
    this.emit('detection-complete', {
      tool,
      args,
      result,
      duration: Date.now() - startTime,
    });
    
    return result;
  }
  
  /**
   * Calculate complexity score (0.0 - 1.0)
   * Inspired by SuperClaude's complexity detection
   */
  private calculateComplexity(
    patterns: Array<[string, PatternRule]>,
    args: Record<string, any>
  ): number {
    let complexity = 0.1; // Base complexity
    
    // Pattern complexity
    for (const [_, rule] of patterns) {
      complexity += rule.complexityModifier * 0.2;
    }
    
    // Multi-domain complexity
    const domains = new Set(patterns.flatMap(p => p[1].domains));
    if (domains.size > 2) complexity += 0.2;
    if (domains.size > 3) complexity += 0.15;
    
    // Argument complexity
    const argCount = Object.keys(args).length;
    if (argCount > 5) complexity += 0.1;
    if (argCount > 10) complexity += 0.15;
    
    // Data complexity
    if (args.depth === 'deep') complexity += 0.2;
    if (args.includeHistory) complexity += 0.15;
    if (args.multiChain) complexity += 0.25;
    
    // Time-sensitive operations
    if (args.realtime || args.live) complexity += 0.2;
    
    // Cap at 1.0
    return Math.min(1.0, complexity);
  }
  
  /**
   * Calculate risk score for crypto operations
   */
  private calculateRisk(
    domains: CryptoDomain[],
    operations: OperationType[],
    args: Record<string, any>
  ): number {
    let risk = 0.1;
    
    // High-risk domains
    if (domains.includes(CryptoDomain.SECURITY)) risk += 0.3;
    if (domains.includes(CryptoDomain.BRIDGE)) risk += 0.25;
    if (domains.includes(CryptoDomain.ALPHA)) risk += 0.2;
    
    // High-risk operations
    if (operations.includes(OperationType.EXECUTION)) risk += 0.3;
    if (operations.includes(OperationType.OPTIMIZATION)) risk += 0.2;
    
    // Network considerations
    if (args.network === 'mainnet') risk += 0.2;
    if (args.value && args.value > 10000) risk += 0.3;
    
    return Math.min(1.0, risk);
  }
  
  /**
   * Determine if wave mode should be used
   * Based on SuperClaude's wave detection algorithm
   */
  private shouldUseWaveMode(
    complexity: number,
    domains: CryptoDomain[],
    operations: OperationType[]
  ): boolean {
    // Complexity threshold (SuperClaude uses 0.7)
    if (complexity >= 0.7) return true;
    
    // Multi-domain operations
    if (domains.length > 2) return true;
    
    // Complex operation types
    const complexOps = [
      OperationType.OPTIMIZATION,
      OperationType.SIMULATION,
      OperationType.EXECUTION,
    ];
    if (operations.some(op => complexOps.includes(op))) return true;
    
    return false;
  }
  
  /**
   * Suggest personas based on detection
   * Crypto-specific personas inspired by SuperClaude
   */
  private suggestPersonas(
    domains: CryptoDomain[],
    operations: OperationType[]
  ): string[] {
    const personas: string[] = [];
    
    // Domain-based personas
    if (domains.includes(CryptoDomain.WHALE)) personas.push('WhaleHunter');
    if (domains.includes(CryptoDomain.DEFI)) personas.push('DeFiArchitect');
    if (domains.includes(CryptoDomain.SECURITY)) personas.push('SecurityAuditor');
    if (domains.includes(CryptoDomain.ALPHA)) personas.push('AlphaSeeker');
    if (domains.includes(CryptoDomain.NFT)) personas.push('NFTValuator');
    if (domains.includes(CryptoDomain.SENTIMENT)) personas.push('SentimentAnalyst');
    if (domains.includes(CryptoDomain.GOVERNANCE)) personas.push('GovernanceAdvisor');
    if (domains.includes(CryptoDomain.YIELD)) personas.push('YieldOptimizer');
    if (domains.includes(CryptoDomain.RISK)) personas.push('RiskManager');
    if (domains.includes(CryptoDomain.BRIDGE)) personas.push('ChainAnalyst');
    if (domains.includes(CryptoDomain.MARKET)) personas.push('MarketMaker');
    
    // Operation-based personas
    if (operations.includes(OperationType.ANALYSIS)) personas.push('DataAnalyst');
    if (operations.includes(OperationType.EXECUTION)) personas.push('ExecutionSpecialist');
    
    return [...new Set(personas)];
  }
  
  /**
   * Suggest agents based on detection
   */
  private suggestAgents(
    domains: CryptoDomain[],
    operations: OperationType[]
  ): string[] {
    const agents: string[] = [];
    
    // Map domains to agents
    const domainAgentMap: Record<CryptoDomain, string> = {
      [CryptoDomain.DEFI]: 'DeFiAgent',
      [CryptoDomain.NFT]: 'NFTAgent',
      [CryptoDomain.SECURITY]: 'SecurityAgent',
      [CryptoDomain.WHALE]: 'WhaleAgent',
      [CryptoDomain.SENTIMENT]: 'SentimentAgent',
      [CryptoDomain.MARKET]: 'MarketAgent',
      [CryptoDomain.GOVERNANCE]: 'GovernanceAgent',
      [CryptoDomain.BRIDGE]: 'BridgeAgent',
      [CryptoDomain.YIELD]: 'YieldAgent',
      [CryptoDomain.ALPHA]: 'AlphaAgent',
      [CryptoDomain.RISK]: 'RiskAgent',
    };
    
    for (const domain of domains) {
      if (domainAgentMap[domain]) {
        agents.push(domainAgentMap[domain]);
      }
    }
    
    return [...new Set(agents)];
  }
  
  // Helper methods
  
  private extractText(tool: string, args: Record<string, any>): string {
    const parts = [tool];
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string') {
        parts.push(value);
      }
    }
    return parts.join(' ').toLowerCase();
  }
  
  private matchPatterns(text: string): Array<[string, PatternRule]> {
    const matches: Array<[string, PatternRule]> = [];
    
    for (const [name, rule] of this.patternRules) {
      const keywordMatches = rule.keywords.filter(kw => text.includes(kw));
      if (keywordMatches.length > 0) {
        matches.push([name, rule]);
      }
    }
    
    return matches;
  }
  
  private extractDomains(patterns: Array<[string, PatternRule]>): CryptoDomain[] {
    const domains = new Set<CryptoDomain>();
    for (const [_, rule] of patterns) {
      rule.domains.forEach(d => domains.add(d));
    }
    return Array.from(domains);
  }
  
  private extractOperations(patterns: Array<[string, PatternRule]>): OperationType[] {
    const operations = new Set<OperationType>();
    for (const [_, rule] of patterns) {
      rule.operations.forEach(op => operations.add(op));
    }
    return Array.from(operations);
  }
  
  private extractKeywords(text: string): string[] {
    const allKeywords = new Set<string>();
    for (const rule of this.patternRules.values()) {
      for (const keyword of rule.keywords) {
        if (text.includes(keyword)) {
          allKeywords.add(keyword);
        }
      }
    }
    return Array.from(allKeywords);
  }
  
  private calculateConfidence(patterns: Array<[string, PatternRule]>): number {
    if (patterns.length === 0) return 0.5;
    
    const confidences = patterns.map(p => p[1].confidence);
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }
  
  private calculatePriority(
    domains: CryptoDomain[],
    riskScore: number,
    complexityScore: number
  ): number {
    // High-priority domains
    let priority = 0.3;
    
    if (domains.includes(CryptoDomain.SECURITY)) priority += 0.3;
    if (domains.includes(CryptoDomain.ALPHA)) priority += 0.2;
    if (domains.includes(CryptoDomain.WHALE)) priority += 0.15;
    
    // Risk contribution
    priority += riskScore * 0.2;
    
    // Complexity contribution
    priority += complexityScore * 0.15;
    
    return Math.min(1.0, priority);
  }
  
  private estimateTokens(complexity: number, domainCount: number): number {
    // Based on SuperClaude's token budgets
    const baseTokens = complexity < 0.3 ? 5000 : complexity < 0.7 ? 15000 : 30000;
    return baseTokens + (domainCount * 2000);
  }
  
  private estimateTime(complexity: number, operations: OperationType[]): number {
    // Base time in milliseconds
    let time = complexity < 0.3 ? 5000 : complexity < 0.7 ? 30000 : 180000;
    
    // Operation modifiers
    if (operations.includes(OperationType.SIMULATION)) time *= 1.5;
    if (operations.includes(OperationType.OPTIMIZATION)) time *= 1.3;
    
    return Math.round(time);
  }
  
  private estimateMemory(complexity: number, domainCount: number): number {
    // Base memory in MB
    const baseMemory = complexity < 0.3 ? 100 : complexity < 0.7 ? 250 : 500;
    return baseMemory + (domainCount * 50);
  }
  
  private shouldUseParallel(
    domains: CryptoDomain[],
    operations: OperationType[]
  ): boolean {
    // Multiple domains benefit from parallel processing
    if (domains.length > 2) return true;
    
    // Certain operations benefit from parallelization
    const parallelOps = [
      OperationType.SCANNING,
      OperationType.MONITORING,
      OperationType.DISCOVERY,
    ];
    
    return operations.some(op => parallelOps.includes(op));
  }
  
  private getComplexityLevel(score: number): ComplexityLevel {
    if (score < 0.3) return ComplexityLevel.SIMPLE;
    if (score < 0.7) return ComplexityLevel.MODERATE;
    return ComplexityLevel.COMPLEX;
  }
  
  private getCacheKey(tool: string, args: Record<string, any>): string {
    return `${tool}:${JSON.stringify(args)}`;
  }
  
  /**
   * Update success metrics for learning
   */
  public updateMetrics(
    tool: string,
    args: Record<string, any>,
    success: boolean
  ): void {
    const key = this.getCacheKey(tool, args);
    const current = this.successMetrics.get(key) || 0;
    this.successMetrics.set(key, success ? current + 1 : current - 1);
    
    // Adjust pattern confidence based on success
    if (this.learningCache.has(key)) {
      const cached = this.learningCache.get(key)!;
      cached.confidence = Math.max(0.1, Math.min(1.0, 
        cached.confidence + (success ? 0.05 : -0.05)
      ));
    }
  }
  
  /**
   * Get detection statistics
   */
  public getStatistics(): {
    cacheHitRate: number;
    averageComplexity: number;
    domainDistribution: Record<string, number>;
    operationDistribution: Record<string, number>;
  } {
    const results = Array.from(this.learningCache.values());
    
    // Domain distribution
    const domainCounts: Record<string, number> = {};
    for (const result of results) {
      for (const domain of result.domains) {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
    }
    
    // Operation distribution
    const operationCounts: Record<string, number> = {};
    for (const result of results) {
      for (const op of result.operations) {
        operationCounts[op] = (operationCounts[op] || 0) + 1;
      }
    }
    
    return {
      cacheHitRate: this.learningCache.size / Math.max(1, this.learningCache.size + 10),
      averageComplexity: results.reduce((sum, r) => sum + r.complexity, 0) / Math.max(1, results.length),
      domainDistribution: domainCounts,
      operationDistribution: operationCounts,
    };
  }
}

export default DetectionEngine;