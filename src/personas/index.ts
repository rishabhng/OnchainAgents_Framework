/**
 * Crypto-Specific Persona System for OnChainAgents
 * Inspired by SuperClaude's 11 specialized personas
 * Each persona has unique decision frameworks, technical preferences, and expertise
 */

import { EventEmitter } from 'events';
import { CryptoDomain, OperationType } from '../orchestrator/detection-engine';

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
    operations: OperationType[],
    keywords: string[],
    context?: any
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
  
  private findBetterProtocols(currentAPY: number): string[] {
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
    // Initialize all 11 personas
    this.personas.set(PersonaType.WHALE_HUNTER, new WhaleHunterPersona());
    this.personas.set(PersonaType.DEFI_ARCHITECT, new DeFiArchitectPersona());
    this.personas.set(PersonaType.SECURITY_AUDITOR, new SecurityAuditorPersona());
    this.personas.set(PersonaType.ALPHA_SEEKER, new AlphaSeekerPersona());
    
    // Additional personas would be implemented similarly:
    // - SentimentAnalyst
    // - NFTValuator
    // - MarketMaker
    // - GovernanceAdvisor
    // - YieldOptimizer
    // - RiskManager
    // - ChainAnalyst
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
    
    for (const [type, persona] of this.personas) {
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