/**
 * Introspection Mode for OnChainAgents
 * Inspired by SuperClaude's transparency system
 * Provides deep visibility into thinking process and decision-making for crypto operations
 */

import { EventEmitter } from 'events';
import { PersonaType } from '../personas';
import { CryptoDomain, OperationType } from '../orchestrator/detection-engine';

// Introspection markers matching SuperClaude
export enum IntrospectionMarker {
  THINKING = '🤔', // Reasoning analysis
  DECISION = '🎯', // Decision point
  ACTION = '⚡', // Action execution
  CHECK = '📊', // Validation check
  LEARNING = '💡', // Learning moment
  WARNING = '⚠️', // Warning or concern
  ERROR = '❌', // Error detection
  SUCCESS = '✅', // Success confirmation
  PATTERN = '🔍', // Pattern recognition
  INSIGHT = '🌟', // Key insight
}

// Chain of thought stages
export enum ThoughtStage {
  UNDERSTANDING = 'understanding', // Initial comprehension
  ANALYSIS = 'analysis', // Deep analysis
  HYPOTHESIS = 'hypothesis', // Hypothesis formation
  VALIDATION = 'validation', // Hypothesis validation
  DECISION = 'decision', // Decision making
  EXECUTION = 'execution', // Action execution
  REFLECTION = 'reflection', // Post-execution reflection
  LEARNING = 'learning', // Learning extraction
}

// Introspection entry
export interface IntrospectionEntry {
  id: string;
  timestamp: number;
  stage: ThoughtStage;
  marker: IntrospectionMarker;
  thought: string;
  evidence?: any;
  confidence: number;
  alternatives?: string[];
  uncertainties?: string[];
  metadata?: {
    persona?: PersonaType;
    domain?: CryptoDomain;
    operation?: OperationType;
    complexity?: number;
  };
}

// Reasoning chain
export interface ReasoningChain {
  id: string;
  startTime: number;
  endTime?: number;
  entries: IntrospectionEntry[];
  decision?: {
    choice: string;
    confidence: number;
    reasoning: string[];
    alternatives: Array<{
      choice: string;
      confidence: number;
      whyNotChosen: string;
    }>;
  };
  outcome?: {
    success: boolean;
    learnings: string[];
    improvements: string[];
  };
}

// Cognitive pattern
export interface CognitivePattern {
  type: 'bias' | 'assumption' | 'gap' | 'strength';
  description: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  examples: string[];
}

// Meta-cognitive assessment
export interface MetaCognitiveAssessment {
  thinkingQuality: number; // 0-100
  logicalCoherence: number;
  evidenceStrength: number;
  biasDetection: CognitivePattern[];
  knowledgeGaps: string[];
  confidenceCalibration: {
    overconfident: boolean;
    underconfident: boolean;
    accuracy: number;
  };
}

/**
 * Introspection Engine
 * Provides transparency into AI thinking and decision-making
 */
export class IntrospectionEngine extends EventEmitter {
  private enabled: boolean = false;
  private verbosityLevel: number = 1; // 0-3 (0=off, 1=basic, 2=detailed, 3=exhaustive)
  private currentChain?: ReasoningChain;
  private chains: Map<string, ReasoningChain> = new Map();
  private patterns: Map<string, CognitivePattern> = new Map();
  private autoActivationRules: Array<{
    condition: (context: any) => boolean;
    confidence: number;
  }> = [];

  constructor() {
    super();
    this.initializeAutoActivation();
  }

  /**
   * Initialize auto-activation rules
   */
  private initializeAutoActivation(): void {
    this.autoActivationRules = [
      {
        condition: (ctx) => ctx.complexity > 0.9,
        confidence: 0.95,
      },
      {
        condition: (ctx) => ctx.debugMode === true,
        confidence: 1.0,
      },
      {
        condition: (ctx) => ctx.operation === 'security-audit',
        confidence: 0.9,
      },
      {
        condition: (ctx) => ctx.domains?.includes(CryptoDomain.SECURITY),
        confidence: 0.85,
      },
      {
        condition: (ctx) => ctx.riskLevel > 0.8,
        confidence: 0.9,
      },
      {
        condition: (ctx) => ctx.frameworkAnalysis === true,
        confidence: 1.0,
      },
    ];
  }

  /**
   * Check if introspection should auto-activate
   */
  public shouldAutoActivate(context: any): boolean {
    for (const rule of this.autoActivationRules) {
      try {
        if (rule.condition(context)) {
          this.emit('auto-activation-triggered', {
            reason: 'condition-met',
            confidence: rule.confidence,
            context,
          });
          return true;
        }
      } catch {
        // Rule evaluation failed, skip
        continue;
      }
    }
    return false;
  }

  /**
   * Enable introspection mode
   */
  public enable(verbosity: number = 1): void {
    this.enabled = true;
    this.verbosityLevel = Math.max(0, Math.min(3, verbosity));

    this.emit('introspection-enabled', {
      verbosity: this.verbosityLevel,
      timestamp: Date.now(),
    });

    this.log(
      IntrospectionMarker.THINKING,
      ThoughtStage.UNDERSTANDING,
      'Introspection mode activated - entering transparent thinking mode',
      0.95,
    );
  }

  /**
   * Disable introspection mode
   */
  public disable(): void {
    if (this.currentChain) {
      this.endChain();
    }

    this.enabled = false;
    this.emit('introspection-disabled', {
      timestamp: Date.now(),
    });
  }

  /**
   * Start a new reasoning chain
   */
  public startChain(operation: string, context?: any): void {
    if (!this.enabled) return;

    if (this.currentChain) {
      this.endChain();
    }

    this.currentChain = {
      id: `chain_${Date.now()}`,
      startTime: Date.now(),
      entries: [],
    };

    this.chains.set(this.currentChain.id, this.currentChain);

    this.log(
      IntrospectionMarker.THINKING,
      ThoughtStage.UNDERSTANDING,
      `Beginning analysis of: ${operation}`,
      0.9,
      { operation, context },
    );

    // Initial understanding phase
    if (context) {
      this.analyzeContext(context);
    }
  }

  /**
   * End current reasoning chain
   */
  public endChain(outcome?: any): void {
    if (!this.currentChain) return;

    this.currentChain.endTime = Date.now();

    if (outcome) {
      this.currentChain.outcome = {
        success: outcome.success || false,
        learnings: this.extractLearnings(),
        improvements: this.identifyImprovements(),
      };

      this.log(
        IntrospectionMarker.LEARNING,
        ThoughtStage.LEARNING,
        `Chain completed - extracted ${this.currentChain.outcome.learnings.length} learnings`,
        0.85,
      );
    }

    // Perform meta-cognitive assessment
    const assessment = this.assessThinkingQuality();

    this.emit('chain-completed', {
      chainId: this.currentChain.id,
      duration: this.currentChain.endTime - this.currentChain.startTime,
      entryCount: this.currentChain.entries.length,
      assessment,
    });

    this.currentChain = undefined;
  }

  /**
   * Log an introspection entry
   */
  public log(
    marker: IntrospectionMarker,
    stage: ThoughtStage,
    thought: string,
    confidence: number,
    metadata?: any,
  ): void {
    if (!this.enabled || !this.currentChain) return;

    // Check verbosity level
    if (this.verbosityLevel === 0) return;
    if (this.verbosityLevel === 1 && stage !== ThoughtStage.DECISION) return;

    const entry: IntrospectionEntry = {
      id: `entry_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      stage,
      marker,
      thought,
      confidence,
      metadata,
    };

    this.currentChain.entries.push(entry);

    // Format and emit for display
    const formatted = this.formatEntry(entry);

    this.emit('introspection-entry', {
      formatted,
      entry,
    });

    // Console output for transparency
    if (this.verbosityLevel >= 2) {
      console.log(formatted);
    }
  }

  /**
   * Analyze decision with alternatives
   */
  public analyzeDecision(
    decision: string,
    alternatives: Array<{ option: string; pros: string[]; cons: string[] }>,
    reasoning: string[],
  ): void {
    if (!this.enabled || !this.currentChain) return;

    this.log(
      IntrospectionMarker.DECISION,
      ThoughtStage.DECISION,
      `Evaluating decision: ${decision}`,
      0.8,
    );

    // Analyze each alternative
    const analyzedAlternatives = alternatives.map((alt) => {
      const score = this.scoreAlternative(alt);
      return {
        choice: alt.option,
        confidence: score,
        whyNotChosen: this.explainRejection(alt, decision),
      };
    });

    this.currentChain.decision = {
      choice: decision,
      confidence: this.calculateDecisionConfidence(decision, alternatives),
      reasoning,
      alternatives: analyzedAlternatives,
    };

    this.log(
      IntrospectionMarker.DECISION,
      ThoughtStage.DECISION,
      `Decision made: ${decision} (confidence: ${this.currentChain.decision.confidence.toFixed(2)})`,
      this.currentChain.decision.confidence,
    );
  }

  /**
   * Reflect on action outcome
   */
  public reflectOnOutcome(expected: any, actual: any, success: boolean): void {
    if (!this.enabled || !this.currentChain) return;

    this.log(
      success ? IntrospectionMarker.SUCCESS : IntrospectionMarker.WARNING,
      ThoughtStage.REFLECTION,
      `Outcome ${success ? 'matched' : 'differed from'} expectations`,
      0.9,
      { expected, actual },
    );

    if (!success) {
      // Analyze why expectations were wrong
      this.analyzeExpectationGap(expected, actual);
    }

    // Extract learnings
    const learning = this.extractLearningFromOutcome(expected, actual, success);
    if (learning) {
      this.log(IntrospectionMarker.LEARNING, ThoughtStage.LEARNING, learning, 0.85);
    }
  }

  /**
   * Detect cognitive patterns
   */
  public detectPattern(
    type: 'bias' | 'assumption' | 'gap' | 'strength',
    description: string,
    example?: string,
  ): void {
    if (!this.enabled) return;

    const patternKey = `${type}_${description}`;

    if (!this.patterns.has(patternKey)) {
      this.patterns.set(patternKey, {
        type,
        description,
        frequency: 0,
        impact: type === 'strength' ? 'positive' : 'negative',
        examples: [],
      });
    }

    const pattern = this.patterns.get(patternKey)!;
    pattern.frequency++;
    if (example) {
      pattern.examples.push(example);
    }

    this.log(
      IntrospectionMarker.PATTERN,
      ThoughtStage.ANALYSIS,
      `Pattern detected: ${type} - ${description}`,
      0.7,
    );

    // Alert if pattern is recurring
    if (pattern.frequency > 3) {
      this.emit('recurring-pattern', {
        pattern,
        recommendation: this.getPatternRecommendation(pattern),
      });
    }
  }

  /**
   * Express uncertainty
   */
  public expressUncertainty(area: string, reason: string, confidence: number): void {
    if (!this.enabled || !this.currentChain) return;

    const entry = this.currentChain.entries[this.currentChain.entries.length - 1];
    if (entry) {
      if (!entry.uncertainties) {
        entry.uncertainties = [];
      }
      entry.uncertainties.push(`${area}: ${reason}`);
    }

    this.log(
      IntrospectionMarker.WARNING,
      ThoughtStage.ANALYSIS,
      `Uncertainty identified in ${area}: ${reason}`,
      confidence,
    );
  }

  /**
   * Private helper methods
   */

  private analyzeContext(context: any): void {
    const complexityAssessment = this.assessComplexity(context);

    this.log(
      IntrospectionMarker.THINKING,
      ThoughtStage.ANALYSIS,
      `Context analysis: ${complexityAssessment}`,
      0.85,
      context,
    );

    // Identify key factors
    if (context.domains) {
      this.log(
        IntrospectionMarker.PATTERN,
        ThoughtStage.ANALYSIS,
        `Domains involved: ${context.domains.join(', ')}`,
        0.9,
      );
    }

    if (context.riskLevel > 0.7) {
      this.log(
        IntrospectionMarker.WARNING,
        ThoughtStage.ANALYSIS,
        `High risk detected: ${context.riskLevel}`,
        0.95,
      );
    }
  }

  private assessComplexity(context: any): string {
    const factors = [];

    if (context.complexity > 0.8) factors.push('high complexity');
    if (context.fileCount > 50) factors.push('large scale');
    if (context.domains?.length > 3) factors.push('multi-domain');
    if (context.operations?.length > 5) factors.push('multi-operation');

    return factors.length > 0
      ? `Complex operation with ${factors.join(', ')}`
      : 'Standard operation';
  }

  private scoreAlternative(alternative: any): number {
    const prosScore = alternative.pros?.length || 0;
    const consScore = alternative.cons?.length || 0;

    return Math.max(0, Math.min(1, 0.5 + prosScore * 0.1 - consScore * 0.15));
  }

  private explainRejection(alternative: any, chosen: string): string {
    if (alternative.cons?.length > alternative.pros?.length) {
      return `Too many disadvantages (${alternative.cons.length} cons vs ${alternative.pros.length} pros)`;
    }

    return `${chosen} was more suitable for current context`;
  }

  private calculateDecisionConfidence(decision: string, alternatives: any[]): number {
    // Base confidence
    let confidence = 0.5;

    // Increase if decision has clear advantages
    if (alternatives.length === 0) {
      confidence = 0.9; // No alternatives, clear choice
    } else {
      // Calculate relative advantage
      const decisionScore = 0.8; // Assumed score for chosen option
      const bestAlternativeScore = Math.max(...alternatives.map((a) => this.scoreAlternative(a)));

      const advantage = decisionScore - bestAlternativeScore;
      confidence = Math.min(0.95, 0.5 + advantage);
    }

    return confidence;
  }

  private analyzeExpectationGap(expected: any, actual: any): void {
    const gaps = [];

    if (typeof expected === 'object' && typeof actual === 'object') {
      for (const key in expected) {
        if (expected[key] !== actual[key]) {
          gaps.push(`${key}: expected ${expected[key]}, got ${actual[key]}`);
        }
      }
    } else {
      gaps.push(`Type mismatch: expected ${typeof expected}, got ${typeof actual}`);
    }

    if (gaps.length > 0) {
      this.detectPattern('gap', 'Expectation mismatch', gaps.join('; '));
    }
  }

  private extractLearningFromOutcome(
    expected: any,
    actual: any,
    success: boolean,
  ): string | undefined {
    if (success) {
      return 'Approach validated - hypothesis confirmed';
    } else {
      return `Learning opportunity: adjust expectations based on ${JSON.stringify(actual)}`;
    }
  }

  private extractLearnings(): string[] {
    if (!this.currentChain) return [];

    const learnings: string[] = [];

    // Extract from entries
    for (const entry of this.currentChain.entries) {
      if (entry.stage === ThoughtStage.LEARNING) {
        learnings.push(entry.thought);
      }
    }

    // Extract from patterns
    for (const pattern of this.patterns.values()) {
      if (pattern.frequency > 2) {
        learnings.push(`Recurring ${pattern.type}: ${pattern.description}`);
      }
    }

    return learnings;
  }

  private identifyImprovements(): string[] {
    const improvements: string[] = [];

    // Based on patterns
    for (const pattern of this.patterns.values()) {
      if (pattern.type === 'gap' || pattern.type === 'bias') {
        improvements.push(this.getPatternRecommendation(pattern));
      }
    }

    // Based on confidence levels
    if (this.currentChain) {
      const lowConfidenceEntries = this.currentChain.entries.filter((e) => e.confidence < 0.5);

      if (lowConfidenceEntries.length > 0) {
        improvements.push('Improve confidence through additional validation');
      }
    }

    return improvements;
  }

  private getPatternRecommendation(pattern: CognitivePattern): string {
    switch (pattern.type) {
      case 'bias':
        return `Address ${pattern.description} through diverse perspective consideration`;
      case 'assumption':
        return `Validate assumption: ${pattern.description}`;
      case 'gap':
        return `Fill knowledge gap: ${pattern.description}`;
      case 'strength':
        return `Leverage strength: ${pattern.description}`;
      default:
        return `Review pattern: ${pattern.description}`;
    }
  }

  private assessThinkingQuality(): MetaCognitiveAssessment {
    if (!this.currentChain) {
      return {
        thinkingQuality: 0,
        logicalCoherence: 0,
        evidenceStrength: 0,
        biasDetection: [],
        knowledgeGaps: [],
        confidenceCalibration: {
          overconfident: false,
          underconfident: false,
          accuracy: 0,
        },
      };
    }

    // Calculate metrics
    const avgConfidence =
      this.currentChain.entries.reduce((sum, e) => sum + e.confidence, 0) /
      Math.max(1, this.currentChain.entries.length);

    const hasEvidence = this.currentChain.entries.filter((e) => e.evidence).length;
    const evidenceRatio = hasEvidence / Math.max(1, this.currentChain.entries.length);

    // Detect biases
    const biases = Array.from(this.patterns.values()).filter((p) => p.type === 'bias');

    // Detect gaps
    const gaps = Array.from(this.patterns.values())
      .filter((p) => p.type === 'gap')
      .map((p) => p.description);

    // Assess confidence calibration
    const overconfident = avgConfidence > 0.9 && this.currentChain.outcome?.success === false;
    const underconfident = avgConfidence < 0.5 && this.currentChain.outcome?.success === true;

    return {
      thinkingQuality: avgConfidence * 100,
      logicalCoherence: this.assessLogicalCoherence() * 100,
      evidenceStrength: evidenceRatio * 100,
      biasDetection: biases,
      knowledgeGaps: gaps,
      confidenceCalibration: {
        overconfident,
        underconfident,
        accuracy: overconfident || underconfident ? 0.5 : 0.8,
      },
    };
  }

  private assessLogicalCoherence(): number {
    if (!this.currentChain) return 0;

    // Check for logical progression through stages
    const expectedStages = [
      ThoughtStage.UNDERSTANDING,
      ThoughtStage.ANALYSIS,
      ThoughtStage.HYPOTHESIS,
      ThoughtStage.DECISION,
      ThoughtStage.EXECUTION,
    ];

    const actualStages = this.currentChain.entries.map((e) => e.stage);
    let coherenceScore = 0;

    for (let i = 0; i < expectedStages.length - 1; i++) {
      const currentIndex = actualStages.indexOf(expectedStages[i]);
      const nextIndex = actualStages.indexOf(expectedStages[i + 1]);

      if (currentIndex >= 0 && nextIndex > currentIndex) {
        coherenceScore += 0.2;
      }
    }

    return Math.min(1, coherenceScore);
  }

  private formatEntry(entry: IntrospectionEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString().split('T')[1].split('.')[0];
    const confidence = `[${(entry.confidence * 100).toFixed(0)}%]`;

    let formatted = `${entry.marker} ${timestamp} ${confidence} [${entry.stage.toUpperCase()}] ${entry.thought}`;

    if (entry.uncertainties && entry.uncertainties.length > 0) {
      formatted += `\n   Uncertainties: ${entry.uncertainties.join(', ')}`;
    }

    if (entry.alternatives && entry.alternatives.length > 0) {
      formatted += `\n   Alternatives considered: ${entry.alternatives.join(', ')}`;
    }

    return formatted;
  }

  /**
   * Get statistics
   */
  public getStatistics(): any {
    const completedChains = Array.from(this.chains.values()).filter((c) => c.endTime);

    return {
      totalChains: this.chains.size,
      completedChains: completedChains.length,
      averageChainLength:
        completedChains.length > 0
          ? completedChains.reduce((sum, c) => sum + c.entries.length, 0) / completedChains.length
          : 0,
      patternsDetected: this.patterns.size,
      biasesIdentified: Array.from(this.patterns.values()).filter((p) => p.type === 'bias').length,
      knowledgeGaps: Array.from(this.patterns.values()).filter((p) => p.type === 'gap').length,
      averageConfidence: this.calculateAverageConfidence(),
    };
  }

  private calculateAverageConfidence(): number {
    let totalConfidence = 0;
    let totalEntries = 0;

    for (const chain of this.chains.values()) {
      for (const entry of chain.entries) {
        totalConfidence += entry.confidence;
        totalEntries++;
      }
    }

    return totalEntries > 0 ? totalConfidence / totalEntries : 0;
  }

  /**
   * Check if introspection is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get current verbosity level
   */
  public getVerbosityLevel(): number {
    return this.verbosityLevel;
  }

  /**
   * Set verbosity level
   */
  public setVerbosityLevel(level: number): void {
    this.verbosityLevel = Math.max(0, Math.min(3, level));
  }
}

export default IntrospectionEngine;
