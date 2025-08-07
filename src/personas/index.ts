/**
 * Crypto-Specific Persona System for OnChainAgents
 * Inspired by SuperClaude's 11 specialized personas
 * Each persona has unique decision frameworks, technical preferences, and expertise
 */

import { EventEmitter } from 'events';
import { CryptoDomain, OperationType } from '../orchestrator/detection-engine';

// Note: Agent implementations are in separate files
// These personas are lightweight wrappers that coordinate with the actual agents

// Persona types for crypto operations
export enum PersonaType {
  WHALE_HUNTER = 'WhaleHunter',
  DEFI_ARCHITECT = 'DeFiArchitect',
  SECURITY_AUDITOR = 'SecurityAuditor',
  ALPHA_SEEKER = 'AlphaSeeker',
  SENTIMENT_ANALYST = 'SentimentAnalyst',
  NFT_VALUATOR = 'NFTValuator',
  MARKET_MAKER = 'MarketMaker',
  GOVERNANCE_ADVISOR = 'GovernanceAdvisor',
  YIELD_OPTIMIZER = 'YieldOptimizer',
  RISK_MANAGER = 'RiskManager',
  CHAIN_ANALYST = 'ChainAnalyst',
  CRYPTO_QUANT = 'CryptoQuant', // New persona with 20 years financial engineering experience
}

// Priority hierarchy for each persona
export interface PriorityHierarchy {
  primary: string;
  secondary: string;
  tertiary: string;
  avoid: string;
}

// Core principles for decision making
export interface CorePrinciples {
  principle1: string;
  principle2: string;
  principle3: string;
}

// Performance metrics each persona tracks
export interface PerformanceMetrics {
  [key: string]: {
    target: number;
    unit: string;
    critical: boolean;
  };
}

// Base interface for all personas
export interface PersonaConfig {
  type: PersonaType;
  identity: string;
  priorityHierarchy: PriorityHierarchy;
  corePrinciples: CorePrinciples;
  performanceMetrics: PerformanceMetrics;
  optimizedCommands: string[];
  preferredTools: string[];
  avoidedTools: string[];
  confidenceThreshold: number;
  autoActivationKeywords: string[];
  contextEvaluation: Record<string, number>; // Domain weights
}

// Base class for all personas
export abstract class BasePersona extends EventEmitter {
  protected config: PersonaConfig;
  protected isActive: boolean = false;
  protected confidenceScore: number = 0;
  protected decisionHistory: any[] = [];
  protected successRate: number = 0;
  
  constructor(config: PersonaConfig) {
    super();
    this.config = config;
  }
  
  /**
   * Evaluate if this persona should activate
   */
  public evaluateActivation(
    domains: CryptoDomain[],
    _operations: OperationType[],
    keywords: string[],
    _context?: any
  ): number {
    let score = 0;
    
    // Keyword matching (30% weight - SuperClaude inspired)
    const keywordMatches = keywords.filter(kw => 
      this.config.autoActivationKeywords.includes(kw)
    ).length;
    score += (keywordMatches / Math.max(1, this.config.autoActivationKeywords.length)) * 0.3;
    
    // Context analysis (40% weight)
    for (const domain of domains) {
      const weight = this.config.contextEvaluation[domain] || 0;
      score += weight * 0.4;
    }
    
    // User history (20% weight)
    score += this.successRate * 0.2;
    
    // Performance metrics (10% weight)
    score += this.evaluatePerformance() * 0.1;
    
    this.confidenceScore = score;
    return score;
  }
  
  /**
   * Activate the persona
   */
  public activate(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.emit('activated', {
      persona: this.config.type,
      confidence: this.confidenceScore,
      timestamp: Date.now(),
    });
    
    console.log(`[PERSONA] ${this.config.type} activated with confidence ${(this.confidenceScore * 100).toFixed(1)}%`);
  }
  
  /**
   * Deactivate the persona
   */
  public deactivate(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.emit('deactivated', {
      persona: this.config.type,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Make a decision based on persona's framework
   */
  public abstract makeDecision(
    operation: string,
    options: any[],
    context?: any
  ): Promise<any>;
  
  /**
   * Evaluate performance metrics
   */
  protected evaluatePerformance(): number {
    // Override in specific personas
    return 0.5;
  }
  
  /**
   * Update success metrics
   */
  public updateMetrics(success: boolean, operation: string): void {
    this.decisionHistory.push({
      operation,
      success,
      timestamp: Date.now(),
    });
    
    // Keep last 100 decisions
    if (this.decisionHistory.length > 100) {
      this.decisionHistory.shift();
    }
    
    // Calculate success rate
    const successes = this.decisionHistory.filter(d => d.success).length;
    this.successRate = successes / Math.max(1, this.decisionHistory.length);
  }
  
  /**
   * Get persona recommendations
   */
  public abstract getRecommendations(context: any): string[];
  
  /**
   * Get quality standards for this persona
   */
  public abstract getQualityStandards(): Record<string, any>;
}

/**
 * WhaleHunter Persona
 * Specializes in tracking and analyzing large holder behavior
 */
export class WhaleHunterPersona extends BasePersona {
  constructor() {
    super({
      type: PersonaType.WHALE_HUNTER,
      identity: 'Large holder analysis specialist, accumulation pattern expert, whale behavior predictor',
      priorityHierarchy: {
        primary: 'whale movements',
        secondary: 'accumulation patterns',
        tertiary: 'market impact',
        avoid: 'small transactions',
      },
      corePrinciples: {
        principle1: 'Track wallets with >$1M holdings',
        principle2: 'Identify accumulation/distribution patterns',
        principle3: 'Predict market impact of whale movements',
      },
      performanceMetrics: {
        detectionRate: { target: 95, unit: '%', critical: true },
        falsePositives: { target: 5, unit: '%', critical: true },
        predictionAccuracy: { target: 80, unit: '%', critical: false },
      },
      optimizedCommands: ['/whale', '/track', '/accumulation'],
      preferredTools: ['WhaleAgent', 'on-chain analysis', 'wallet clustering'],
      avoidedTools: ['sentiment analysis', 'technical indicators'],
      confidenceThreshold: 0.85,
      autoActivationKeywords: ['whale', 'large holder', 'accumulation', 'distribution', 'smart money'],
      contextEvaluation: {
        [CryptoDomain.WHALE]: 1.0,
        [CryptoDomain.MARKET]: 0.7,
        [CryptoDomain.ALPHA]: 0.6,
      },
    });
  }
  
  async makeDecision(operation: string, options: any[], context?: any): Promise<any> {
    // Whale-specific decision logic
    if (operation === 'track_wallet') {
      // Prioritize wallets by size and activity
      return options.sort((a, b) => {
        const scoreA = a.balance * 0.5 + a.recentActivity * 0.3 + a.profitability * 0.2;
        const scoreB = b.balance * 0.5 + b.recentActivity * 0.3 + b.profitability * 0.2;
        return scoreB - scoreA;
      })[0];
    }
    
    if (operation === 'analyze_movement') {
      // Determine if accumulation or distribution
      const netFlow = context?.netFlow || 0;
      const priceImpact = context?.priceImpact || 0;
      
      if (netFlow > 0 && priceImpact < 0.05) {
        return { pattern: 'accumulation', confidence: 0.85 };
      } else if (netFlow < 0 && priceImpact > 0.05) {
        return { pattern: 'distribution', confidence: 0.85 };
      }
      
      return { pattern: 'neutral', confidence: 0.5 };
    }
    
    return null;
  }
  
  getRecommendations(context: any): string[] {
    const recommendations: string[] = [];
    
    if (context.whaleCount > 10) {
      recommendations.push('High whale concentration - monitor for coordinated movements');
    }
    
    if (context.recentAccumulation > 0.2) {
      recommendations.push('Significant accumulation detected - potential price movement ahead');
    }
    
    if (context.dormantWhalesActivated) {
      recommendations.push('Dormant whales activated - major market event possible');
    }
    
    return recommendations;
  }
  
  getQualityStandards(): Record<string, any> {
    return {
      minimumBalance: 1000000, // $1M USD
      trackingFrequency: 300, // 5 minutes
      clusteringThreshold: 0.8,
      alertThreshold: 0.1, // 10% movement triggers alert
    };
  }
}

/**
 * DeFiArchitect Persona
 * Specializes in DeFi protocol optimization and yield strategies
 */
export class DeFiArchitectPersona extends BasePersona {
  constructor() {
    super({
      type: PersonaType.DEFI_ARCHITECT,
      identity: 'Protocol optimization expert, yield strategist, liquidity engineer',
      priorityHierarchy: {
        primary: 'yield optimization',
        secondary: 'risk management',
        tertiary: 'capital efficiency',
        avoid: 'unsustainable yields',
      },
      corePrinciples: {
        principle1: 'Maximize yield while managing risk',
        principle2: 'Optimize capital efficiency across protocols',
        principle3: 'Identify sustainable yield sources',
      },
      performanceMetrics: {
        averageAPY: { target: 20, unit: '%', critical: false },
        capitalEfficiency: { target: 85, unit: '%', critical: true },
        impermanentLoss: { target: 5, unit: '%', critical: true },
      },
      optimizedCommands: ['/yield', '/optimize', '/liquidity'],
      preferredTools: ['DeFiAgent', 'yield aggregators', 'protocol analyzers'],
      avoidedTools: ['NFT tools', 'social sentiment'],
      confidenceThreshold: 0.8,
      autoActivationKeywords: ['yield', 'apy', 'apr', 'liquidity', 'farming', 'vault', 'pool'],
      contextEvaluation: {
        [CryptoDomain.DEFI]: 1.0,
        [CryptoDomain.YIELD]: 0.9,
        [CryptoDomain.RISK]: 0.7,
      },
    });
  }
  
  async makeDecision(operation: string, options: any[], context?: any): Promise<any> {
    if (operation === 'select_pool') {
      // Evaluate pools based on risk-adjusted returns
      return options.sort((a, b) => {
        const riskAdjustedA = a.apy / (1 + a.risk);
        const riskAdjustedB = b.apy / (1 + b.risk);
        return riskAdjustedB - riskAdjustedA;
      })[0];
    }
    
    if (operation === 'optimize_position') {
      const currentAPY = context?.currentAPY || 0;
      const targetAPY = this.config.performanceMetrics.averageAPY.target;
      
      if (currentAPY < targetAPY) {
        return {
          action: 'rebalance',
          recommendation: 'Move to higher yield protocols',
          protocols: this.findBetterProtocols(currentAPY),
        };
      }
      
      return { action: 'maintain', recommendation: 'Current position is optimal' };
    }
    
    return null;
  }
  
  private findBetterProtocols(_currentAPY: number): string[] {
    // Would fetch real protocol data
    return ['Aave v3', 'Compound v3', 'Yearn v3'];
  }
  
  getRecommendations(context: any): string[] {
    const recommendations: string[] = [];
    
    if (context.tvlGrowth > 0.5) {
      recommendations.push('Rapid TVL growth - consider early exit before yield compression');
    }
    
    if (context.protocolAge < 30) {
      recommendations.push('New protocol - higher risk, conduct thorough audit review');
    }
    
    if (context.concentrationRisk > 0.3) {
      recommendations.push('High concentration risk - diversify across protocols');
    }
    
    return recommendations;
  }
  
  getQualityStandards(): Record<string, any> {
    return {
      minimumTVL: 10000000, // $10M
      minimumAPY: 5,
      maximumRisk: 0.3,
      auditRequired: true,
      timeInMarket: 90, // days
    };
  }
}

/**
 * SecurityAuditor Persona
 * Specializes in smart contract security and vulnerability detection
 */
export class SecurityAuditorPersona extends BasePersona {
  constructor() {
    super({
      type: PersonaType.SECURITY_AUDITOR,
      identity: 'Vulnerability scanner, smart contract auditor, exploit prevention specialist',
      priorityHierarchy: {
        primary: 'security vulnerabilities',
        secondary: 'code quality',
        tertiary: 'best practices',
        avoid: 'unverified contracts',
      },
      corePrinciples: {
        principle1: 'Identify vulnerabilities before exploitation',
        principle2: 'Verify contract security comprehensively',
        principle3: 'Prevent user losses through proactive scanning',
      },
      performanceMetrics: {
        vulnerabilityDetection: { target: 99, unit: '%', critical: true },
        falsePositives: { target: 1, unit: '%', critical: true },
        scanTime: { target: 30, unit: 'seconds', critical: false },
      },
      optimizedCommands: ['/audit', '/scan', '/verify'],
      preferredTools: ['SecurityAgent', 'static analysis', 'fuzzing tools'],
      avoidedTools: ['yield optimizers', 'trading bots'],
      confidenceThreshold: 0.95,
      autoActivationKeywords: ['audit', 'security', 'vulnerability', 'exploit', 'hack', 'rug'],
      contextEvaluation: {
        [CryptoDomain.SECURITY]: 1.0,
        [CryptoDomain.RISK]: 0.8,
        [CryptoDomain.DEFI]: 0.6,
      },
    });
  }
  
  async makeDecision(operation: string, options: any[], context?: any): Promise<any> {
    if (operation === 'assess_risk') {
      const vulnerabilities = context?.vulnerabilities || [];
      const severity = this.calculateSeverity(vulnerabilities);
      
      return {
        riskLevel: severity > 0.7 ? 'critical' : severity > 0.4 ? 'high' : 'medium',
        action: severity > 0.7 ? 'block' : severity > 0.4 ? 'warn' : 'proceed',
        vulnerabilities: vulnerabilities.filter(v => v.severity > 0.5),
      };
    }
    
    if (operation === 'prioritize_audits') {
      return options.sort((a, b) => {
        const scoreA = a.tvl * 0.4 + a.userCount * 0.3 + a.complexity * 0.3;
        const scoreB = b.tvl * 0.4 + b.userCount * 0.3 + b.complexity * 0.3;
        return scoreB - scoreA;
      });
    }
    
    return null;
  }
  
  private calculateSeverity(vulnerabilities: any[]): number {
    if (vulnerabilities.length === 0) return 0;
    
    const maxSeverity = Math.max(...vulnerabilities.map(v => v.severity || 0));
    const avgSeverity = vulnerabilities.reduce((sum, v) => sum + (v.severity || 0), 0) / vulnerabilities.length;
    
    return maxSeverity * 0.7 + avgSeverity * 0.3;
  }
  
  getRecommendations(context: any): string[] {
    const recommendations: string[] = [];
    
    if (!context.audited) {
      recommendations.push('CRITICAL: Contract not audited - extreme caution advised');
    }
    
    if (context.ownershipNotRenounced) {
      recommendations.push('Owner can modify contract - rug pull risk');
    }
    
    if (context.proxyContract) {
      recommendations.push('Proxy contract detected - implementation can be changed');
    }
    
    if (context.complexityScore > 0.8) {
      recommendations.push('High complexity - increased vulnerability risk');
    }
    
    return recommendations;
  }
  
  getQualityStandards(): Record<string, any> {
    return {
      requiredAudits: 2,
      maxComplexity: 500, // cyclomatic complexity
      requiredTests: true,
      coverageThreshold: 95,
      verifiedSource: true,
    };
  }
}

/**
 * SentimentAnalyst Persona
 * Specializes in social sentiment analysis and market psychology
 */
export class SentimentAnalystPersona extends BasePersona {
  constructor() {
    super({
      type: PersonaType.SENTIMENT_ANALYST,
      identity: 'Social sentiment expert, market psychology analyst, crowd behavior predictor',
      priorityHierarchy: {
        primary: 'sentiment trends',
        secondary: 'social metrics',
        tertiary: 'market psychology',
        avoid: 'technical analysis',
      },
      corePrinciples: {
        principle1: 'Track social sentiment across platforms',
        principle2: 'Identify narrative shifts before price moves',
        principle3: 'Predict crowd behavior patterns',
      },
      performanceMetrics: {
        sentimentAccuracy: { target: 85, unit: '%', critical: true },
        trendPrediction: { target: 75, unit: '%', critical: false },
        responseTime: { target: 5, unit: 'minutes', critical: false },
      },
      optimizedCommands: ['/sentiment', '/social', '/narrative'],
      preferredTools: ['SentimentAnalyzer', 'social monitors', 'NLP analysis'],
      avoidedTools: ['on-chain analysis', 'technical indicators'],
      confidenceThreshold: 0.8,
      autoActivationKeywords: ['sentiment', 'social', 'narrative', 'fud', 'fomo', 'hype'],
      contextEvaluation: {
        [CryptoDomain.SENTIMENT]: 1.0,
        [CryptoDomain.MARKET]: 0.7,
        [CryptoDomain.ALPHA]: 0.6,
      },
    });
  }
  
  async makeDecision(operation: string, options: any[], context?: any): Promise<any> {
    if (operation === 'analyze_sentiment') {
      const score = (context?.positive || 0) - (context?.negative || 0);
      return {
        sentiment: score > 0.3 ? 'bullish' : score < -0.3 ? 'bearish' : 'neutral',
        confidence: Math.abs(score),
        trend: context?.trend || 'stable',
      };
    }
    return null;
  }
  
  getRecommendations(context: any): string[] {
    const recommendations: string[] = [];
    if (context.sentimentShift > 0.5) {
      recommendations.push('Major sentiment shift detected - potential trend reversal');
    }
    return recommendations;
  }
  
  getQualityStandards(): Record<string, any> {
    return {
      minimumDataPoints: 1000,
      refreshRate: 300,
      sentimentThreshold: 0.7,
    };
  }
}

/**
 * AlphaSeeker Persona
 * Specializes in finding early opportunities and emerging trends
 */
export class AlphaSeekerPersona extends BasePersona {
  constructor() {
    super({
      type: PersonaType.ALPHA_SEEKER,
      identity: 'Early opportunity finder, trend predictor, alpha generator',
      priorityHierarchy: {
        primary: 'early detection',
        secondary: 'risk/reward ratio',
        tertiary: 'market timing',
        avoid: 'late entries',
      },
      corePrinciples: {
        principle1: 'Identify opportunities before mainstream attention',
        principle2: 'Balance risk with asymmetric reward potential',
        principle3: 'Time entries based on momentum indicators',
      },
      performanceMetrics: {
        alphaGeneration: { target: 50, unit: '%', critical: true },
        winRate: { target: 60, unit: '%', critical: false },
        averageReturn: { target: 5, unit: 'x', critical: false },
      },
      optimizedCommands: ['/alpha', '/discover', '/trending'],
      preferredTools: ['AlphaAgent', 'trend analysis', 'social monitors'],
      avoidedTools: ['lagging indicators', 'mainstream tools'],
      confidenceThreshold: 0.75,
      autoActivationKeywords: ['alpha', 'early', 'gem', 'trending', 'momentum', 'breakout'],
      contextEvaluation: {
        [CryptoDomain.ALPHA]: 1.0,
        [CryptoDomain.SENTIMENT]: 0.7,
        [CryptoDomain.MARKET]: 0.6,
      },
    });
  }
  
  async makeDecision(operation: string, options: any[], context?: any): Promise<any> {
    if (operation === 'evaluate_opportunity') {
      const score = this.calculateAlphaScore(context);
      
      return {
        recommendation: score > 0.8 ? 'strong buy' : score > 0.6 ? 'accumulate' : 'watch',
        alphaScore: score,
        timeframe: '2-4 weeks',
        riskLevel: score > 0.8 ? 'high' : 'medium',
      };
    }
    
    if (operation === 'rank_opportunities') {
      return options.sort((a, b) => {
        const alphaA = (a.momentum * 0.4) + (a.uniqueness * 0.3) + (a.timing * 0.3);
        const alphaB = (b.momentum * 0.4) + (b.uniqueness * 0.3) + (b.timing * 0.3);
        return alphaB - alphaA;
      }).slice(0, 5);
    }
    
    return null;
  }
  
  private calculateAlphaScore(context: any): number {
    let score = 0;
    
    // Social momentum
    if (context.socialGrowth > 0.5) score += 0.3;
    
    // Technical breakout
    if (context.priceBreakout) score += 0.2;
    
    // Fundamental catalyst
    if (context.catalyst) score += 0.3;
    
    // Early stage
    if (context.marketCap < 10000000) score += 0.2;
    
    return Math.min(1.0, score);
  }
  
  getRecommendations(context: any): string[] {
    const recommendations: string[] = [];
    
    if (context.momentumScore > 0.8) {
      recommendations.push('Strong momentum detected - consider position entry');
    }
    
    if (context.whaleAccumulation && context.retailUnaware) {
      recommendations.push('Smart money accumulating before retail - high alpha potential');
    }
    
    if (context.narrativeAlignment) {
      recommendations.push('Aligns with current market narrative - increased success probability');
    }
    
    return recommendations;
  }
  
  getQualityStandards(): Record<string, any> {
    return {
      minimumLiquidity: 100000,
      maximumMarketCap: 100000000,
      minimumSocialGrowth: 0.3,
      requiredCatalyst: true,
    };
  }
}

/**
 * Additional Persona Placeholder Classes
 * These will be backed by the actual agent implementations
 */

export class NFTValuatorPersona extends BasePersona {
  constructor() {
    super({
      type: PersonaType.NFT_VALUATOR,
      identity: 'NFT valuation expert, rarity analyst, collection evaluator',
      priorityHierarchy: {
        primary: 'fair value assessment',
        secondary: 'rarity analysis',
        tertiary: 'market trends',
        avoid: 'hype-driven valuation',
      },
      corePrinciples: {
        principle1: 'Assess NFT value based on multiple factors',
        principle2: 'Analyze rarity and collection dynamics',
        principle3: 'Identify undervalued collections',
      },
      performanceMetrics: {
        valuationAccuracy: { target: 80, unit: '%', critical: true },
        rarityIdentification: { target: 90, unit: '%', critical: false },
      },
      optimizedCommands: ['/nft', '/rarity', '/collection'],
      preferredTools: ['NFTValuator', 'rarity tools', 'market analysis'],
      avoidedTools: ['DeFi tools', 'yield optimizers'],
      confidenceThreshold: 0.8,
      autoActivationKeywords: ['nft', 'rarity', 'collection', 'floor', 'mint'],
      contextEvaluation: {
        [CryptoDomain.NFT]: 1.0,
        [CryptoDomain.MARKET]: 0.6,
      },
    });
  }
  
  async makeDecision(operation: string, options: any[], context?: any): Promise<any> {
    return null;
  }
  
  getRecommendations(context: any): string[] {
    return [];
  }
  
  getQualityStandards(): Record<string, any> {
    return { minimumVolume: 100 };
  }
}

export class MarketMakerPersona extends BasePersona {
  constructor() {
    super({
      type: PersonaType.MARKET_MAKER,
      identity: 'Liquidity provider, spread optimizer, market microstructure expert',
      priorityHierarchy: {
        primary: 'liquidity provision',
        secondary: 'spread optimization',
        tertiary: 'inventory management',
        avoid: 'directional trading',
      },
      corePrinciples: {
        principle1: 'Provide consistent liquidity',
        principle2: 'Optimize bid-ask spreads',
        principle3: 'Manage inventory risk',
      },
      performanceMetrics: {
        spreadCapture: { target: 0.3, unit: '%', critical: true },
        uptime: { target: 99, unit: '%', critical: true },
      },
      optimizedCommands: ['/mm', '/liquidity', '/spread'],
      preferredTools: ['MarketMaker', 'order book analysis', 'MEV tools'],
      avoidedTools: ['sentiment analysis', 'long-term holders'],
      confidenceThreshold: 0.85,
      autoActivationKeywords: ['market make', 'liquidity', 'spread', 'order book'],
      contextEvaluation: {
        [CryptoDomain.MARKET]: 1.0,
        [CryptoDomain.DEFI]: 0.7,
      },
    });
  }
  
  async makeDecision(operation: string, options: any[], context?: any): Promise<any> {
    return null;
  }
  
  getRecommendations(context: any): string[] {
    return [];
  }
  
  getQualityStandards(): Record<string, any> {
    return { minimumVolume: 1000000 };
  }
}

export class GovernanceAdvisorPersona extends BasePersona {
  constructor() {
    super({
      type: PersonaType.GOVERNANCE_ADVISOR,
      identity: 'DAO governance expert, proposal analyst, voting strategist',
      priorityHierarchy: {
        primary: 'governance optimization',
        secondary: 'proposal analysis',
        tertiary: 'voting strategy',
        avoid: 'centralized decisions',
      },
      corePrinciples: {
        principle1: 'Optimize governance participation',
        principle2: 'Analyze proposal impact',
        principle3: 'Maximize voting power efficiency',
      },
      performanceMetrics: {
        proposalSuccess: { target: 70, unit: '%', critical: false },
        votingPowerUtilization: { target: 90, unit: '%', critical: true },
      },
      optimizedCommands: ['/governance', '/vote', '/delegate'],
      preferredTools: ['GovernanceAdvisor', 'proposal analysis', 'delegation tools'],
      avoidedTools: ['trading bots', 'technical analysis'],
      confidenceThreshold: 0.8,
      autoActivationKeywords: ['governance', 'dao', 'proposal', 'vote', 'delegate'],
      contextEvaluation: {
        [CryptoDomain.GOVERNANCE]: 1.0,
        [CryptoDomain.DEFI]: 0.6,
      },
    });
  }
  
  async makeDecision(operation: string, options: any[], context?: any): Promise<any> {
    return null;
  }
  
  getRecommendations(context: any): string[] {
    return [];
  }
  
  getQualityStandards(): Record<string, any> {
    return { quorumRequirement: 0.04 };
  }
}

export class YieldOptimizerPersona extends BasePersona {
  constructor() {
    super({
      type: PersonaType.YIELD_OPTIMIZER,
      identity: 'Yield farming expert, APY optimizer, capital efficiency maximizer',
      priorityHierarchy: {
        primary: 'yield maximization',
        secondary: 'risk management',
        tertiary: 'gas optimization',
        avoid: 'unsustainable yields',
      },
      corePrinciples: {
        principle1: 'Maximize sustainable yield',
        principle2: 'Optimize capital deployment',
        principle3: 'Minimize impermanent loss',
      },
      performanceMetrics: {
        averageAPY: { target: 25, unit: '%', critical: true },
        capitalEfficiency: { target: 90, unit: '%', critical: true },
      },
      optimizedCommands: ['/yield', '/farm', '/compound'],
      preferredTools: ['YieldOptimizer', 'APY aggregators', 'IL calculators'],
      avoidedTools: ['NFT tools', 'governance tools'],
      confidenceThreshold: 0.8,
      autoActivationKeywords: ['yield', 'apy', 'farm', 'compound', 'vault'],
      contextEvaluation: {
        [CryptoDomain.YIELD]: 1.0,
        [CryptoDomain.DEFI]: 0.9,
      },
    });
  }
  
  async makeDecision(operation: string, options: any[], context?: any): Promise<any> {
    return null;
  }
  
  getRecommendations(context: any): string[] {
    return [];
  }
  
  getQualityStandards(): Record<string, any> {
    return { minimumTVL: 10000000 };
  }
}

export class RiskManagerPersona extends BasePersona {
  constructor() {
    super({
      type: PersonaType.RISK_MANAGER,
      identity: 'Portfolio risk analyst, position sizer, hedge strategist',
      priorityHierarchy: {
        primary: 'risk mitigation',
        secondary: 'portfolio balance',
        tertiary: 'hedge efficiency',
        avoid: 'excessive leverage',
      },
      corePrinciples: {
        principle1: 'Minimize portfolio risk',
        principle2: 'Optimize position sizing',
        principle3: 'Implement effective hedges',
      },
      performanceMetrics: {
        maxDrawdown: { target: 20, unit: '%', critical: true },
        sharpeRatio: { target: 1.5, unit: 'ratio', critical: false },
      },
      optimizedCommands: ['/risk', '/hedge', '/position'],
      preferredTools: ['RiskAnalyzer', 'portfolio tools', 'hedge calculators'],
      avoidedTools: ['alpha tools', 'sentiment analysis'],
      confidenceThreshold: 0.9,
      autoActivationKeywords: ['risk', 'hedge', 'portfolio', 'position size', 'var'],
      contextEvaluation: {
        [CryptoDomain.RISK]: 1.0,
        [CryptoDomain.DEFI]: 0.6,
      },
    });
  }
  
  async makeDecision(operation: string, options: any[], context?: any): Promise<any> {
    return null;
  }
  
  getRecommendations(context: any): string[] {
    return [];
  }
  
  getQualityStandards(): Record<string, any> {
    return { maxLeverage: 3 };
  }
}

export class ChainAnalystPersona extends BasePersona {
  constructor() {
    super({
      type: PersonaType.CHAIN_ANALYST,
      identity: 'On-chain forensics expert, transaction tracer, address analyzer',
      priorityHierarchy: {
        primary: 'on-chain analysis',
        secondary: 'transaction tracing',
        tertiary: 'address clustering',
        avoid: 'off-chain data',
      },
      corePrinciples: {
        principle1: 'Trace transaction flows',
        principle2: 'Identify address patterns',
        principle3: 'Detect anomalous behavior',
      },
      performanceMetrics: {
        traceAccuracy: { target: 95, unit: '%', critical: true },
        clusteringAccuracy: { target: 85, unit: '%', critical: false },
      },
      optimizedCommands: ['/trace', '/analyze', '/cluster'],
      preferredTools: ['ChainAnalyst', 'blockchain explorers', 'clustering tools'],
      avoidedTools: ['social tools', 'sentiment analysis'],
      confidenceThreshold: 0.85,
      autoActivationKeywords: ['on-chain', 'trace', 'address', 'transaction', 'flow'],
      contextEvaluation: {
        [CryptoDomain.ONCHAIN]: 1.0,
        [CryptoDomain.SECURITY]: 0.7,
      },
    });
  }
  
  async makeDecision(operation: string, options: any[], context?: any): Promise<any> {
    return null;
  }
  
  getRecommendations(context: any): string[] {
    return [];
  }
  
  getQualityStandards(): Record<string, any> {
    return { minimumConfirmations: 6 };
  }
}

export class CryptoQuantPersona extends BasePersona {
  constructor() {
    super({
      type: PersonaType.CRYPTO_QUANT,
      identity: 'Financial engineer with 20 years experience, quantitative analyst, statistical arbitrage expert',
      priorityHierarchy: {
        primary: 'quantitative modeling',
        secondary: 'statistical arbitrage',
        tertiary: 'risk-adjusted returns',
        avoid: 'emotional trading',
      },
      corePrinciples: {
        principle1: 'Apply rigorous quantitative methods',
        principle2: 'Identify statistical arbitrage opportunities',
        principle3: 'Optimize risk-adjusted returns using advanced models',
      },
      performanceMetrics: {
        sharpeRatio: { target: 2.0, unit: 'ratio', critical: true },
        modelAccuracy: { target: 75, unit: '%', critical: true },
        alphaGeneration: { target: 15, unit: '%', critical: false },
      },
      optimizedCommands: ['/quant', '/arb', '/model', '/backtest'],
      preferredTools: ['CryptoQuant', 'statistical models', 'GARCH', 'cointegration', 'machine learning'],
      avoidedTools: ['social sentiment', 'news-based trading'],
      confidenceThreshold: 0.85,
      autoActivationKeywords: ['quant', 'statistical', 'arbitrage', 'model', 'backtest', 'sharpe', 'alpha'],
      contextEvaluation: {
        [CryptoDomain.QUANT]: 1.0,
        [CryptoDomain.RISK]: 0.8,
        [CryptoDomain.MARKET]: 0.7,
      },
    });
  }
  
  async makeDecision(operation: string, options: any[], context?: any): Promise<any> {
    if (operation === 'model_selection') {
      // Apply 20 years of financial engineering experience
      return {
        model: 'GARCH-BEKK with regime switching',
        confidence: 0.85,
        expectedSharpe: 2.1,
      };
    }
    return null;
  }
  
  getRecommendations(context: any): string[] {
    const recommendations: string[] = [];
    if (context.volatilityRegime === 'high') {
      recommendations.push('High volatility regime detected - reduce position sizes by 40%');
    }
    if (context.cointegrationFound) {
      recommendations.push('Cointegration detected - implement pairs trading strategy');
    }
    return recommendations;
  }
  
  getQualityStandards(): Record<string, any> {
    return {
      minimumDataPoints: 5000,
      backtestPeriod: 365,
      maxDrawdown: 15,
      minimumSharpe: 1.5,
      confidenceInterval: 0.95,
    };
  }
}

/**
 * Persona Manager - Handles all personas
 */
export class PersonaManager extends EventEmitter {
  private personas: Map<PersonaType, BasePersona>;
  private activePersona: BasePersona | null = null;
  private activationHistory: any[] = [];
  
  constructor() {
    super();
    this.personas = new Map();
    this.initializePersonas();
  }
  
  private initializePersonas(): void {
    // Initialize all 12 personas (11 original + 1 new CryptoQuant)
    this.personas.set(PersonaType.WHALE_HUNTER, new WhaleHunterPersona());
    this.personas.set(PersonaType.DEFI_ARCHITECT, new DeFiArchitectPersona());
    this.personas.set(PersonaType.SECURITY_AUDITOR, new SecurityAuditorPersona());
    this.personas.set(PersonaType.ALPHA_SEEKER, new AlphaSeekerPersona());
    this.personas.set(PersonaType.SENTIMENT_ANALYST, new SentimentAnalystPersona());
    this.personas.set(PersonaType.NFT_VALUATOR, new NFTValuatorPersona());
    this.personas.set(PersonaType.MARKET_MAKER, new MarketMakerPersona());
    this.personas.set(PersonaType.GOVERNANCE_ADVISOR, new GovernanceAdvisorPersona());
    this.personas.set(PersonaType.YIELD_OPTIMIZER, new YieldOptimizerPersona());
    this.personas.set(PersonaType.RISK_MANAGER, new RiskManagerPersona());
    this.personas.set(PersonaType.CHAIN_ANALYST, new ChainAnalystPersona());
    this.personas.set(PersonaType.CRYPTO_QUANT, new CryptoQuantPersona()); // New persona with 20 years experience
  }
  
  /**
   * Auto-activate best persona based on context
   */
  public autoActivate(
    domains: CryptoDomain[],
    operations: OperationType[],
    keywords: string[],
    context?: any
  ): BasePersona | null {
    let bestPersona: BasePersona | null = null;
    let bestScore = 0;
    
    for (const [_type, persona] of this.personas) {
      const score = persona.evaluateActivation(domains, operations, keywords, context);
      
      if (score > bestScore && score >= (persona as any).config.confidenceThreshold) {
        bestScore = score;
        bestPersona = persona;
      }
    }
    
    if (bestPersona) {
      this.activatePersona(bestPersona);
    }
    
    return bestPersona;
  }
  
  /**
   * Manually activate a specific persona
   */
  public activatePersona(persona: BasePersona | PersonaType): void {
    if (this.activePersona) {
      this.activePersona.deactivate();
    }
    
    if (typeof persona === 'string') {
      persona = this.personas.get(persona)!;
    }
    
    this.activePersona = persona;
    persona.activate();
    
    this.activationHistory.push({
      persona: (persona as any).config.type,
      timestamp: Date.now(),
    });
    
    this.emit('persona-activated', {
      persona: (persona as any).config.type,
      confidence: (persona as any).confidenceScore,
    });
  }
  
  /**
   * Get current active persona
   */
  public getActivePersona(): BasePersona | null {
    return this.activePersona;
  }
  
  /**
   * Get all personas
   */
  public getAllPersonas(): Map<PersonaType, BasePersona> {
    return this.personas;
  }
  
  /**
   * Get activation statistics
   */
  public getStatistics(): any {
    const stats: any = {
      totalActivations: this.activationHistory.length,
      personaUsage: {},
    };
    
    for (const activation of this.activationHistory) {
      stats.personaUsage[activation.persona] = 
        (stats.personaUsage[activation.persona] || 0) + 1;
    }
    
    return stats;
  }
}

export default PersonaManager;