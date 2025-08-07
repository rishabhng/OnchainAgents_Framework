/**
 * Persona Auto-Activation Engine
 * Inspired by SuperClaude's multi-factor activation scoring
 * Intelligently selects and activates the best persona for each context
 */

import { EventEmitter } from 'events';
import { PersonaType, PersonaManager, BasePersona } from './index';
import { CryptoDomain, OperationType } from '../orchestrator/detection-engine';

// Activation factors and their weights (SuperClaude-inspired)
export interface ActivationFactors {
  keywordMatching: number; // 30% weight
  contextAnalysis: number; // 40% weight
  userHistory: number; // 20% weight
  performanceMetrics: number; // 10% weight
}

// Activation context
export interface ActivationContext {
  domains: CryptoDomain[];
  operations: OperationType[];
  keywords: string[];
  complexity: number;
  riskLevel: number;
  urgency: number;
  marketConditions?: {
    volatility: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    volume: number;
  };
  userPreferences?: {
    riskTolerance: 'low' | 'medium' | 'high';
    preferredPersonas: PersonaType[];
    avoidPersonas: PersonaType[];
  };
  historicalData?: {
    previousPersonas: PersonaType[];
    successRates: Record<PersonaType, number>;
  };
}

// Activation result
export interface ActivationResult {
  selectedPersona: PersonaType | null;
  confidence: number;
  reasoning: string[];
  alternativePersonas: Array<{
    persona: PersonaType;
    confidence: number;
  }>;
  factors: ActivationFactors;
}

// Activation rule for pattern-based activation
interface ActivationRule {
  id: string;
  name: string;
  patterns: {
    domains?: CryptoDomain[];
    operations?: OperationType[];
    keywords?: string[];
    complexity?: { min: number; max: number };
    riskLevel?: { min: number; max: number };
  };
  targetPersona: PersonaType;
  confidence: number;
  priority: number;
}

export class PersonaActivationEngine extends EventEmitter {
  private personaManager: PersonaManager;
  private activationRules: Map<string, ActivationRule>;
  private activationHistory: ActivationResult[] = [];
  private learningData: Map<string, any> = new Map();
  private confidenceThreshold: number = 0.7; // Minimum confidence for activation

  constructor(personaManager: PersonaManager) {
    super();
    this.personaManager = personaManager;
    this.activationRules = new Map();
    this.initializeRules();
  }

  /**
   * Initialize activation rules based on patterns
   * Inspired by SuperClaude's intelligent activation rules
   */
  private initializeRules(): void {
    // Whale tracking rules
    this.addRule({
      id: 'whale-tracking',
      name: 'Whale Activity Detection',
      patterns: {
        domains: [CryptoDomain.WHALE],
        keywords: ['whale', 'large holder', 'accumulation'],
        complexity: { min: 0.3, max: 0.7 },
      },
      targetPersona: PersonaType.WHALE_HUNTER,
      confidence: 0.95,
      priority: 1,
    });

    // Security audit rules
    this.addRule({
      id: 'security-critical',
      name: 'Critical Security Check',
      patterns: {
        domains: [CryptoDomain.SECURITY],
        keywords: ['audit', 'vulnerability', 'exploit'],
        riskLevel: { min: 0.7, max: 1.0 },
      },
      targetPersona: PersonaType.SECURITY_AUDITOR,
      confidence: 0.98,
      priority: 0, // Highest priority
    });

    // DeFi optimization rules
    this.addRule({
      id: 'defi-yield',
      name: 'Yield Optimization',
      patterns: {
        domains: [CryptoDomain.DEFI, CryptoDomain.YIELD],
        keywords: ['yield', 'apy', 'farming', 'liquidity'],
        complexity: { min: 0.5, max: 0.9 },
      },
      targetPersona: PersonaType.DEFI_ARCHITECT,
      confidence: 0.85,
      priority: 2,
    });

    // Alpha discovery rules
    this.addRule({
      id: 'alpha-hunting',
      name: 'Early Opportunity Discovery',
      patterns: {
        domains: [CryptoDomain.ALPHA],
        keywords: ['gem', 'early', 'trending', 'momentum'],
        complexity: { min: 0.6, max: 1.0 },
      },
      targetPersona: PersonaType.ALPHA_SEEKER,
      confidence: 0.8,
      priority: 3,
    });

    // Market analysis rules
    this.addRule({
      id: 'market-analysis',
      name: 'Market Conditions Analysis',
      patterns: {
        domains: [CryptoDomain.MARKET],
        operations: [OperationType.ANALYSIS],
        keywords: ['price', 'volume', 'trend'],
      },
      targetPersona: PersonaType.MARKET_MAKER,
      confidence: 0.75,
      priority: 4,
    });

    // Risk management rules
    this.addRule({
      id: 'risk-critical',
      name: 'High Risk Situation',
      patterns: {
        riskLevel: { min: 0.8, max: 1.0 },
        keywords: ['risk', 'exposure', 'volatility'],
      },
      targetPersona: PersonaType.RISK_MANAGER,
      confidence: 0.9,
      priority: 1,
    });
  }

  /**
   * Add a custom activation rule
   */
  public addRule(rule: ActivationRule): void {
    this.activationRules.set(rule.id, rule);
  }

  /**
   * Determine best persona based on context
   * Core of the auto-activation system
   */
  public async determinePersona(context: ActivationContext): Promise<ActivationResult> {
    const startTime = Date.now();

    // Calculate activation factors
    const factors = this.calculateActivationFactors(context);

    // Score each persona
    const personaScores = new Map<PersonaType, number>();
    const reasoning: string[] = [];

    // Rule-based scoring
    for (const [ruleId, rule] of this.activationRules) {
      if (this.matchesRule(rule, context)) {
        const currentScore = personaScores.get(rule.targetPersona) || 0;
        const newScore = Math.max(currentScore, rule.confidence);
        personaScores.set(rule.targetPersona, newScore);

        reasoning.push(`Rule '${rule.name}' matched with confidence ${rule.confidence}`);
      }
    }

    // Multi-factor scoring for all personas
    const allPersonas = this.personaManager.getAllPersonas();
    for (const [type, persona] of allPersonas) {
      const score = persona.evaluateActivation(
        context.domains,
        context.operations,
        context.keywords,
        context,
      );

      const currentScore = personaScores.get(type) || 0;
      const weightedScore = this.applyFactorWeights(score, factors);
      personaScores.set(type, Math.max(currentScore, weightedScore));
    }

    // Apply user preferences
    if (context.userPreferences) {
      this.applyUserPreferences(personaScores, context.userPreferences);
    }

    // Apply historical success rates
    if (context.historicalData) {
      this.applyHistoricalData(personaScores, context.historicalData);
    }

    // Find best persona
    let bestPersona: PersonaType | null = null;
    let bestScore = 0;
    const alternatives: Array<{ persona: PersonaType; confidence: number }> = [];

    for (const [persona, score] of personaScores) {
      if (score > bestScore && score >= this.confidenceThreshold) {
        if (bestPersona) {
          alternatives.push({ persona: bestPersona, confidence: bestScore });
        }
        bestPersona = persona;
        bestScore = score;
      } else if (score >= this.confidenceThreshold * 0.8) {
        alternatives.push({ persona, confidence: score });
      }
    }

    // Sort alternatives by confidence
    alternatives.sort((a, b) => b.confidence - a.confidence);

    // Generate reasoning
    if (bestPersona) {
      reasoning.push(`Selected ${bestPersona} with confidence ${(bestScore * 100).toFixed(1)}%`);

      if (context.complexity > 0.7) {
        reasoning.push('High complexity detected - specialist persona required');
      }

      if (context.riskLevel > 0.7) {
        reasoning.push('High risk situation - prioritizing safety-focused persona');
      }

      if (context.urgency > 0.7) {
        reasoning.push('Urgent situation - fast decision-making persona selected');
      }
    } else {
      reasoning.push('No suitable persona found with sufficient confidence');
    }

    // Create result
    const result: ActivationResult = {
      selectedPersona: bestPersona,
      confidence: bestScore,
      reasoning,
      alternativePersonas: alternatives.slice(0, 3), // Top 3 alternatives
      factors,
    };

    // Store in history for learning
    this.activationHistory.push(result);
    if (this.activationHistory.length > 100) {
      this.activationHistory.shift();
    }

    // Emit activation event
    this.emit('persona-determined', {
      result,
      context,
      duration: Date.now() - startTime,
    });

    return result;
  }

  /**
   * Calculate activation factors
   */
  private calculateActivationFactors(context: ActivationContext): ActivationFactors {
    // Keyword matching (30% weight)
    const keywordScore = this.calculateKeywordScore(context.keywords);

    // Context analysis (40% weight)
    const contextScore = this.calculateContextScore(context);

    // User history (20% weight)
    const historyScore = this.calculateHistoryScore(context);

    // Performance metrics (10% weight)
    const performanceScore = this.calculatePerformanceScore(context);

    return {
      keywordMatching: keywordScore,
      contextAnalysis: contextScore,
      userHistory: historyScore,
      performanceMetrics: performanceScore,
    };
  }

  /**
   * Calculate keyword matching score
   */
  private calculateKeywordScore(keywords: string[]): number {
    if (keywords.length === 0) return 0.5;

    // Check against known high-value keywords
    const highValueKeywords = [
      'whale',
      'security',
      'audit',
      'yield',
      'alpha',
      'exploit',
      'vulnerability',
      'opportunity',
      'urgent',
    ];

    const matches = keywords.filter((kw) =>
      highValueKeywords.some((hvk) => kw.includes(hvk)),
    ).length;

    return Math.min(1.0, matches / 3); // 3 matches = full score
  }

  /**
   * Calculate context score
   */
  private calculateContextScore(context: ActivationContext): number {
    let score = 0.5; // Base score

    // Complexity contribution
    score += context.complexity * 0.2;

    // Risk contribution
    if (context.riskLevel > 0.7) score += 0.2;
    else if (context.riskLevel > 0.4) score += 0.1;

    // Urgency contribution
    if (context.urgency > 0.7) score += 0.1;

    // Market conditions
    if (context.marketConditions) {
      if (context.marketConditions.volatility > 0.5) score += 0.1;
      if (context.marketConditions.trend === 'bullish') score += 0.05;
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate history score
   */
  private calculateHistoryScore(context: ActivationContext): number {
    if (!context.historicalData) return 0.5;

    // Recent persona success
    const recentPersonas = context.historicalData.previousPersonas.slice(-5);
    if (recentPersonas.length === 0) return 0.5;

    // Calculate average success rate of recent personas
    let totalSuccess = 0;
    for (const persona of recentPersonas) {
      totalSuccess += context.historicalData.successRates[persona] || 0.5;
    }

    return totalSuccess / recentPersonas.length;
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(context: ActivationContext): number {
    // Look at recent activation success
    if (this.activationHistory.length === 0) return 0.5;

    const recentActivations = this.activationHistory.slice(-10);
    const successfulActivations = recentActivations.filter(
      (a) => a.selectedPersona && a.confidence > 0.8,
    ).length;

    return successfulActivations / recentActivations.length;
  }

  /**
   * Check if context matches a rule
   */
  private matchesRule(rule: ActivationRule, context: ActivationContext): boolean {
    const patterns = rule.patterns;

    // Check domains
    if (patterns.domains) {
      const domainMatch = patterns.domains.some((d) => context.domains.includes(d));
      if (!domainMatch) return false;
    }

    // Check operations
    if (patterns.operations) {
      const operationMatch = patterns.operations.some((o) => context.operations.includes(o));
      if (!operationMatch) return false;
    }

    // Check keywords
    if (patterns.keywords) {
      const keywordMatch = patterns.keywords.some((kw) =>
        context.keywords.some((ckw) => ckw.includes(kw)),
      );
      if (!keywordMatch) return false;
    }

    // Check complexity
    if (patterns.complexity) {
      if (
        context.complexity < patterns.complexity.min ||
        context.complexity > patterns.complexity.max
      ) {
        return false;
      }
    }

    // Check risk level
    if (patterns.riskLevel) {
      if (
        context.riskLevel < patterns.riskLevel.min ||
        context.riskLevel > patterns.riskLevel.max
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Apply factor weights to score
   */
  private applyFactorWeights(baseScore: number, factors: ActivationFactors): number {
    return (
      (baseScore * 0.3 + // Base weight
        factors.keywordMatching * 0.3 + // 30% keyword
        factors.contextAnalysis * 0.4 + // 40% context
        factors.userHistory * 0.2 + // 20% history
        factors.performanceMetrics * 0.1) / // 10% performance
      1.3
    ); // Normalize
  }

  /**
   * Apply user preferences to scores
   */
  private applyUserPreferences(
    scores: Map<PersonaType, number>,
    preferences: ActivationContext['userPreferences'],
  ): void {
    if (!preferences) return;

    // Boost preferred personas
    for (const persona of preferences.preferredPersonas) {
      const current = scores.get(persona) || 0;
      scores.set(persona, Math.min(1.0, current * 1.2));
    }

    // Reduce avoided personas
    for (const persona of preferences.avoidPersonas) {
      const current = scores.get(persona) || 0;
      scores.set(persona, current * 0.5);
    }

    // Adjust for risk tolerance
    if (preferences.riskTolerance === 'low') {
      // Boost conservative personas
      const conservativePersonas = [PersonaType.SECURITY_AUDITOR, PersonaType.RISK_MANAGER];
      for (const persona of conservativePersonas) {
        const current = scores.get(persona) || 0;
        scores.set(persona, Math.min(1.0, current * 1.1));
      }
    } else if (preferences.riskTolerance === 'high') {
      // Boost aggressive personas
      const aggressivePersonas = [PersonaType.ALPHA_SEEKER, PersonaType.MARKET_MAKER];
      for (const persona of aggressivePersonas) {
        const current = scores.get(persona) || 0;
        scores.set(persona, Math.min(1.0, current * 1.1));
      }
    }
  }

  /**
   * Apply historical success data
   */
  private applyHistoricalData(
    scores: Map<PersonaType, number>,
    historicalData: ActivationContext['historicalData'],
  ): void {
    if (!historicalData) return;

    // Boost personas with high success rates
    for (const [persona, successRate] of Object.entries(historicalData.successRates)) {
      const current = scores.get(persona as PersonaType) || 0;
      const boost = 1 + (successRate - 0.5) * 0.2; // ±10% based on success
      scores.set(persona as PersonaType, Math.min(1.0, current * boost));
    }
  }

  /**
   * Activate the best persona
   */
  public async activateBestPersona(context: ActivationContext): Promise<BasePersona | null> {
    const result = await this.determinePersona(context);

    if (result.selectedPersona) {
      this.personaManager.activatePersona(result.selectedPersona);

      this.emit('persona-activated', {
        persona: result.selectedPersona,
        confidence: result.confidence,
        reasoning: result.reasoning,
      });

      return this.personaManager.getActivePersona();
    }

    return null;
  }

  /**
   * Update learning data based on outcome
   */
  public updateLearning(persona: PersonaType, context: ActivationContext, success: boolean): void {
    const key = `${persona}:${context.domains.join(',')}`;
    const current = this.learningData.get(key) || { successes: 0, failures: 0 };

    if (success) {
      current.successes++;
    } else {
      current.failures++;
    }

    this.learningData.set(key, current);

    // Update persona metrics
    const activePersona = this.personaManager.getActivePersona();
    if (activePersona) {
      activePersona.updateMetrics(success, context.domains.join(','));
    }
  }

  /**
   * Get activation statistics
   */
  public getStatistics(): {
    totalActivations: number;
    averageConfidence: number;
    personaDistribution: Record<PersonaType, number>;
    ruleHitRate: Record<string, number>;
    learningInsights: any[];
  } {
    const totalActivations = this.activationHistory.length;

    // Calculate average confidence
    const totalConfidence = this.activationHistory.reduce((sum, a) => sum + a.confidence, 0);
    const averageConfidence = totalActivations > 0 ? totalConfidence / totalActivations : 0;

    // Calculate persona distribution
    const personaDistribution: Record<PersonaType, number> = {} as any;
    for (const activation of this.activationHistory) {
      if (activation.selectedPersona) {
        personaDistribution[activation.selectedPersona] =
          (personaDistribution[activation.selectedPersona] || 0) + 1;
      }
    }

    // Calculate rule hit rate
    const ruleHitRate: Record<string, number> = {};
    // Would track rule matches in production

    // Generate learning insights
    const learningInsights: any[] = [];
    for (const [key, data] of this.learningData) {
      const successRate = data.successes / (data.successes + data.failures);
      if (successRate > 0.8 || successRate < 0.2) {
        learningInsights.push({
          pattern: key,
          successRate,
          samples: data.successes + data.failures,
        });
      }
    }

    return {
      totalActivations,
      averageConfidence,
      personaDistribution,
      ruleHitRate,
      learningInsights,
    };
  }

  /**
   * Reset learning data
   */
  public resetLearning(): void {
    this.learningData.clear();
    this.activationHistory = [];
  }
}

export default PersonaActivationEngine;
