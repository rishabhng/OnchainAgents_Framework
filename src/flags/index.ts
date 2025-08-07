/**
 * Crypto Flag System for OnChainAgents
 * Inspired by SuperClaude's flag system with crypto-specific modifiers
 * Provides operation modifiers for enhanced control and optimization
 */

import { EventEmitter } from 'events';
import { PersonaType } from '../personas';
import { CryptoDomain, OperationType } from '../orchestrator/detection-engine';
import { ResourceZone } from '../orchestrator/resource-zones';

// Flag categories matching SuperClaude's organization
export enum FlagCategory {
  PLANNING = 'planning',           // Analysis and planning flags
  COMPRESSION = 'compression',     // Token efficiency flags
  MCP_CONTROL = 'mcp_control',     // Hive and fallback source control
  DELEGATION = 'delegation',       // Sub-agent and parallel processing
  WAVE = 'wave',                   // Wave orchestration control
  SCOPE = 'scope',                 // Operation scope modifiers
  NETWORK = 'network',             // Blockchain network selection
  SECURITY = 'security',           // Security enhancement flags
  PERFORMANCE = 'performance',     // Performance optimization
  PERSONA = 'persona',             // Manual persona activation
  INTROSPECTION = 'introspection', // Transparency and debugging
  LOOP = 'loop',                   // Iterative improvement
}

// Flag priority levels (higher overrides lower)
export enum FlagPriority {
  SAFETY = 10,      // Safety flags highest priority
  EXPLICIT = 9,     // User-specified flags
  SECURITY = 8,     // Security enhancement flags
  PERFORMANCE = 7,  // Performance optimization
  THINKING = 6,     // Analysis depth flags
  NETWORK = 5,      // Network selection
  PERSONA = 4,      // Persona control
  SCOPE = 3,        // Scope modifiers
  DEFAULT = 1,      // Default behavior
}

// Flag configuration
export interface FlagConfig {
  name: string;
  category: FlagCategory;
  priority: FlagPriority;
  description: string;
  aliases?: string[];
  conflicts?: string[];  // Flags that conflict with this one
  implies?: string[];     // Flags automatically enabled with this one
  requiresPersona?: PersonaType[];
  requiresDomain?: CryptoDomain[];
  tokenImpact?: number;   // Percentage impact on token usage
  performanceImpact?: number; // Performance impact factor
  autoActivation?: {
    condition: (context: any) => boolean;
    confidence: number;
  };
}

// Flag activation result
export interface FlagActivation {
  flag: string;
  active: boolean;
  source: 'explicit' | 'auto' | 'implied';
  confidence?: number;
  conflicts?: string[];
  implications?: string[];
}

// Crypto-specific flag definitions
const FLAG_DEFINITIONS: Map<string, FlagConfig> = new Map([
  // Planning & Analysis Flags (SuperClaude-inspired)
  ['--plan', {
    name: 'plan',
    category: FlagCategory.PLANNING,
    priority: FlagPriority.DEFAULT,
    description: 'Display execution plan before crypto operations',
    tokenImpact: 5,
    performanceImpact: 0.1,
  }],
  
  ['--think', {
    name: 'think',
    category: FlagCategory.PLANNING,
    priority: FlagPriority.THINKING,
    description: 'Multi-chain analysis (~4K tokens)',
    aliases: ['--analyze'],
    implies: ['--seq'],
    tokenImpact: 20,
    performanceImpact: 0.3,
    autoActivation: {
      condition: (ctx) => ctx.complexity > 0.5 && ctx.domains?.includes(CryptoDomain.DEFI),
      confidence: 0.8,
    },
  }],
  
  ['--think-hard', {
    name: 'think-hard',
    category: FlagCategory.PLANNING,
    priority: FlagPriority.THINKING,
    description: 'Deep blockchain analysis (~10K tokens)',
    aliases: ['--deep-analyze'],
    implies: ['--seq', '--hive'],
    conflicts: ['--think'],
    tokenImpact: 40,
    performanceImpact: 0.5,
    autoActivation: {
      condition: (ctx) => ctx.complexity > 0.7 && ctx.operations?.includes(OperationType.SCANNING),
      confidence: 0.85,
    },
  }],
  
  ['--ultrathink', {
    name: 'ultrathink',
    category: FlagCategory.PLANNING,
    priority: FlagPriority.THINKING,
    description: 'Critical security analysis (~32K tokens)',
    implies: ['--seq', '--hive', '--all-sources'],
    conflicts: ['--think', '--think-hard'],
    tokenImpact: 80,
    performanceImpact: 0.8,
    requiresDomain: [CryptoDomain.SECURITY],
    autoActivation: {
      condition: (ctx) => ctx.riskLevel > 0.8 || ctx.operation === 'security-audit',
      confidence: 0.95,
    },
  }],
  
  // Compression & Efficiency Flags
  ['--uc', {
    name: 'ultracompressed',
    category: FlagCategory.COMPRESSION,
    priority: FlagPriority.PERFORMANCE,
    description: '30-50% token reduction with crypto symbols',
    aliases: ['--ultracompressed', '--compress'],
    tokenImpact: -40,
    performanceImpact: -0.2,
    autoActivation: {
      condition: (ctx) => ctx.resourceZone === ResourceZone.ORANGE || ctx.tokenUsage > 0.75,
      confidence: 0.9,
    },
  }],
  
  ['--answer-only', {
    name: 'answer-only',
    category: FlagCategory.COMPRESSION,
    priority: FlagPriority.EXPLICIT,
    description: 'Direct response without workflow automation',
    conflicts: ['--plan', '--verbose'],
    tokenImpact: -60,
    performanceImpact: -0.5,
  }],
  
  ['--verbose', {
    name: 'verbose',
    category: FlagCategory.COMPRESSION,
    priority: FlagPriority.DEFAULT,
    description: 'Maximum detail and explanation',
    conflicts: ['--uc', '--answer-only'],
    tokenImpact: 50,
    performanceImpact: 0.2,
  }],
  
  // MCP/Source Control Flags
  ['--hive', {
    name: 'hive',
    category: FlagCategory.MCP_CONTROL,
    priority: FlagPriority.DEFAULT,
    description: 'Enable Hive Intelligence for crypto data',
    aliases: ['--hiveintelligence'],
    tokenImpact: 10,
    performanceImpact: 0.1,
    autoActivation: {
      condition: (ctx) => ctx.domains?.includes(CryptoDomain.WHALE) || ctx.domains?.includes(CryptoDomain.ALPHA),
      confidence: 0.85,
    },
  }],
  
  ['--seq', {
    name: 'sequential',
    category: FlagCategory.MCP_CONTROL,
    priority: FlagPriority.DEFAULT,
    description: 'Enable Sequential for complex analysis',
    aliases: ['--sequential'],
    tokenImpact: 15,
    performanceImpact: 0.2,
    autoActivation: {
      condition: (ctx) => ctx.complexity > 0.6,
      confidence: 0.8,
    },
  }],
  
  ['--all-sources', {
    name: 'all-sources',
    category: FlagCategory.MCP_CONTROL,
    priority: FlagPriority.DEFAULT,
    description: 'Enable all data sources (Hive + fallbacks)',
    implies: ['--hive', '--seq'],
    tokenImpact: 30,
    performanceImpact: 0.4,
    autoActivation: {
      condition: (ctx) => ctx.complexity > 0.8 && ctx.domains?.length > 2,
      confidence: 0.75,
    },
  }],
  
  ['--no-mcp', {
    name: 'no-mcp',
    category: FlagCategory.MCP_CONTROL,
    priority: FlagPriority.EXPLICIT,
    description: 'Disable all external data sources',
    conflicts: ['--hive', '--seq', '--all-sources'],
    tokenImpact: -20,
    performanceImpact: -0.3,
  }],
  
  // Sub-Agent Delegation Flags
  ['--delegate', {
    name: 'delegate',
    category: FlagCategory.DELEGATION,
    priority: FlagPriority.PERFORMANCE,
    description: 'Enable sub-agent delegation for parallel processing',
    aliases: ['--parallel'],
    tokenImpact: -10,
    performanceImpact: -0.4,
    autoActivation: {
      condition: (ctx) => ctx.fileCount > 50 || ctx.operations?.length > 5,
      confidence: 0.9,
    },
  }],
  
  ['--concurrency', {
    name: 'concurrency',
    category: FlagCategory.DELEGATION,
    priority: FlagPriority.PERFORMANCE,
    description: 'Control concurrent sub-agents (1-15)',
    tokenImpact: 0,
    performanceImpact: -0.3,
  }],
  
  // Wave Orchestration Flags
  ['--wave-mode', {
    name: 'wave-mode',
    category: FlagCategory.WAVE,
    priority: FlagPriority.PERFORMANCE,
    description: 'Enable wave orchestration for complex operations',
    aliases: ['--waves'],
    tokenImpact: 20,
    performanceImpact: 0.3,
    autoActivation: {
      condition: (ctx) => ctx.complexity >= 0.7 && ctx.fileCount > 20 && ctx.operationTypes > 2,
      confidence: 0.85,
    },
  }],
  
  ['--wave-strategy', {
    name: 'wave-strategy',
    category: FlagCategory.WAVE,
    priority: FlagPriority.EXPLICIT,
    description: 'Select wave strategy (progressive/systematic/adaptive/enterprise)',
    implies: ['--wave-mode'],
    tokenImpact: 0,
    performanceImpact: 0,
  }],
  
  // Scope & Focus Flags
  ['--scope', {
    name: 'scope',
    category: FlagCategory.SCOPE,
    priority: FlagPriority.SCOPE,
    description: 'Analysis scope (wallet/token/protocol/chain/ecosystem)',
    tokenImpact: 0,
    performanceImpact: 0,
  }],
  
  ['--focus', {
    name: 'focus',
    category: FlagCategory.SCOPE,
    priority: FlagPriority.SCOPE,
    description: 'Focus area (whale/defi/security/yield/alpha/nft)',
    tokenImpact: -10,
    performanceImpact: -0.1,
  }],
  
  // Network Selection Flags (Crypto-specific)
  ['--mainnet', {
    name: 'mainnet',
    category: FlagCategory.NETWORK,
    priority: FlagPriority.NETWORK,
    description: 'Use mainnet for operations',
    conflicts: ['--testnet'],
    tokenImpact: 5,
    performanceImpact: 0.1,
  }],
  
  ['--testnet', {
    name: 'testnet',
    category: FlagCategory.NETWORK,
    priority: FlagPriority.NETWORK,
    description: 'Use testnet for safe testing',
    conflicts: ['--mainnet'],
    tokenImpact: -5,
    performanceImpact: -0.1,
  }],
  
  ['--multi-chain', {
    name: 'multi-chain',
    category: FlagCategory.NETWORK,
    priority: FlagPriority.NETWORK,
    description: 'Enable cross-chain analysis',
    implies: ['--delegate'],
    tokenImpact: 30,
    performanceImpact: 0.4,
    autoActivation: {
      condition: (ctx) => ctx.networks?.length > 1,
      confidence: 0.95,
    },
  }],
  
  // Security Enhancement Flags
  ['--secure', {
    name: 'secure',
    category: FlagCategory.SECURITY,
    priority: FlagPriority.SECURITY,
    description: 'Enhanced security checks for operations',
    aliases: ['--safe'],
    implies: ['--validate'],
    tokenImpact: 15,
    performanceImpact: 0.2,
    autoActivation: {
      condition: (ctx) => ctx.riskLevel > 0.6 || ctx.value > 10000,
      confidence: 0.9,
    },
  }],
  
  ['--validate', {
    name: 'validate',
    category: FlagCategory.SECURITY,
    priority: FlagPriority.SAFETY,
    description: 'Pre-operation validation and risk assessment',
    tokenImpact: 10,
    performanceImpact: 0.15,
    autoActivation: {
      condition: (ctx) => ctx.riskScore > 0.7 || ctx.resourceUsage > 0.75,
      confidence: 0.95,
    },
  }],
  
  ['--safe-mode', {
    name: 'safe-mode',
    category: FlagCategory.SECURITY,
    priority: FlagPriority.SAFETY,
    description: 'Maximum validation with conservative execution',
    implies: ['--validate', '--secure', '--uc'],
    conflicts: ['--fast'],
    tokenImpact: 20,
    performanceImpact: 0.3,
    autoActivation: {
      condition: (ctx) => ctx.resourceUsage > 0.85 || ctx.environment === 'production',
      confidence: 0.98,
    },
  }],
  
  ['--simulate', {
    name: 'simulate',
    category: FlagCategory.SECURITY,
    priority: FlagPriority.SECURITY,
    description: 'Simulate operations without execution',
    aliases: ['--dry-run'],
    tokenImpact: -20,
    performanceImpact: -0.5,
  }],
  
  // Performance Optimization Flags
  ['--fast', {
    name: 'fast',
    category: FlagCategory.PERFORMANCE,
    priority: FlagPriority.PERFORMANCE,
    description: 'Optimize for speed over thoroughness',
    conflicts: ['--safe-mode', '--think-hard', '--ultrathink'],
    tokenImpact: -30,
    performanceImpact: -0.4,
  }],
  
  ['--cache', {
    name: 'cache',
    category: FlagCategory.PERFORMANCE,
    priority: FlagPriority.PERFORMANCE,
    description: 'Aggressive caching for repeated operations',
    tokenImpact: -25,
    performanceImpact: -0.3,
    autoActivation: {
      condition: (ctx) => ctx.repetitiveOperations > 3,
      confidence: 0.85,
    },
  }],
  
  ['--realtime', {
    name: 'realtime',
    category: FlagCategory.PERFORMANCE,
    priority: FlagPriority.PERFORMANCE,
    description: 'Real-time monitoring and updates',
    implies: ['--fast'],
    tokenImpact: 40,
    performanceImpact: 0.5,
  }],
  
  // Persona Activation Flags
  ['--persona-whale', {
    name: 'persona-whale',
    category: FlagCategory.PERSONA,
    priority: FlagPriority.PERSONA,
    description: 'Activate WhaleHunter persona',
    requiresPersona: [PersonaType.WHALE_HUNTER],
    tokenImpact: 0,
    performanceImpact: 0,
  }],
  
  ['--persona-defi', {
    name: 'persona-defi',
    category: FlagCategory.PERSONA,
    priority: FlagPriority.PERSONA,
    description: 'Activate DeFiArchitect persona',
    requiresPersona: [PersonaType.DEFI_ARCHITECT],
    tokenImpact: 0,
    performanceImpact: 0,
  }],
  
  ['--persona-security', {
    name: 'persona-security',
    category: FlagCategory.PERSONA,
    priority: FlagPriority.PERSONA,
    description: 'Activate SecurityAuditor persona',
    requiresPersona: [PersonaType.SECURITY_AUDITOR],
    tokenImpact: 0,
    performanceImpact: 0,
  }],
  
  ['--persona-alpha', {
    name: 'persona-alpha',
    category: FlagCategory.PERSONA,
    priority: FlagPriority.PERSONA,
    description: 'Activate AlphaSeeker persona',
    requiresPersona: [PersonaType.ALPHA_SEEKER],
    tokenImpact: 0,
    performanceImpact: 0,
  }],
  
  // Introspection & Transparency
  ['--introspect', {
    name: 'introspect',
    category: FlagCategory.INTROSPECTION,
    priority: FlagPriority.DEFAULT,
    description: 'Deep transparency mode with thinking process',
    aliases: ['--introspection'],
    tokenImpact: 25,
    performanceImpact: 0.2,
    autoActivation: {
      condition: (ctx) => ctx.debugMode || ctx.complexity > 0.9,
      confidence: 0.7,
    },
  }],
  
  // Loop & Iteration
  ['--loop', {
    name: 'loop',
    category: FlagCategory.LOOP,
    priority: FlagPriority.DEFAULT,
    description: 'Enable iterative improvement mode',
    tokenImpact: 30,
    performanceImpact: 0.4,
    autoActivation: {
      condition: (ctx) => ctx.keywords?.includes('improve') || ctx.keywords?.includes('refine'),
      confidence: 0.8,
    },
  }],
  
  ['--iterations', {
    name: 'iterations',
    category: FlagCategory.LOOP,
    priority: FlagPriority.EXPLICIT,
    description: 'Number of improvement cycles (1-10)',
    implies: ['--loop'],
    tokenImpact: 0,
    performanceImpact: 0,
  }],
]);

/**
 * Flag Manager - Handles flag parsing, validation, and auto-activation
 */
export class FlagManager extends EventEmitter {
  private activeFlags: Map<string, FlagActivation> = new Map();
  private flagHistory: FlagActivation[] = [];
  private autoActivationEnabled: boolean = true;
  
  constructor() {
    super();
    this.initializeDefinitions();
  }
  
  /**
   * Initialize flag definitions
   */
  private initializeDefinitions(): void {
    // Convert map entries to proper FlagConfig objects
    for (const [name, config] of FLAG_DEFINITIONS) {
      if (!config.name) config.name = name.replace('--', '');
    }
  }
  
  /**
   * Parse flags from input
   */
  public parseFlags(input: string | string[]): Map<string, any> {
    const flags = new Map<string, any>();
    const parts = Array.isArray(input) ? input : input.split(' ');
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.startsWith('--')) {
        const flagName = part;
        const nextPart = parts[i + 1];
        
        // Check if next part is a value (not another flag)
        if (nextPart && !nextPart.startsWith('--')) {
          flags.set(flagName, nextPart);
          i++; // Skip the value
        } else {
          flags.set(flagName, true);
        }
      }
    }
    
    return flags;
  }
  
  /**
   * Activate flags with validation and conflict resolution
   */
  public async activateFlags(
    flags: Map<string, any>,
    context?: any
  ): Promise<Map<string, FlagActivation>> {
    this.activeFlags.clear();
    
    // First pass: explicit flags
    for (const [flag, value] of flags) {
      await this.activateFlag(flag, value, 'explicit', context);
    }
    
    // Second pass: auto-activation
    if (this.autoActivationEnabled && context) {
      await this.performAutoActivation(context);
    }
    
    // Third pass: implied flags
    await this.activateImpliedFlags();
    
    // Fourth pass: conflict resolution
    this.resolveConflicts();
    
    // Store in history
    this.flagHistory.push(...Array.from(this.activeFlags.values()));
    if (this.flagHistory.length > 100) {
      this.flagHistory = this.flagHistory.slice(-100);
    }
    
    // Emit activation event
    this.emit('flags-activated', {
      flags: this.activeFlags,
      context,
      timestamp: Date.now(),
    });
    
    return this.activeFlags;
  }
  
  /**
   * Activate a single flag
   */
  private async activateFlag(
    flag: string,
    value: any,
    source: 'explicit' | 'auto' | 'implied',
    context?: any
  ): Promise<void> {
    const config = FLAG_DEFINITIONS.get(flag);
    if (!config) {
      // Check aliases
      for (const [name, cfg] of FLAG_DEFINITIONS) {
        if (cfg.aliases?.includes(flag)) {
          flag = name;
          config = cfg;
          break;
        }
      }
    }
    
    if (!config) {
      this.emit('unknown-flag', { flag, value });
      return;
    }
    
    // Check requirements
    if (config.requiresPersona && context?.persona) {
      if (!config.requiresPersona.includes(context.persona)) {
        this.emit('flag-blocked', {
          flag,
          reason: 'persona-mismatch',
          required: config.requiresPersona,
          actual: context.persona,
        });
        return;
      }
    }
    
    if (config.requiresDomain && context?.domains) {
      const hasRequiredDomain = config.requiresDomain.some(d => 
        context.domains.includes(d)
      );
      if (!hasRequiredDomain) {
        this.emit('flag-blocked', {
          flag,
          reason: 'domain-mismatch',
          required: config.requiresDomain,
          actual: context.domains,
        });
        return;
      }
    }
    
    // Create activation
    const activation: FlagActivation = {
      flag,
      active: true,
      source,
      confidence: source === 'explicit' ? 1.0 : config.autoActivation?.confidence,
      conflicts: config.conflicts,
      implications: config.implies,
    };
    
    this.activeFlags.set(flag, activation);
  }
  
  /**
   * Perform auto-activation based on context
   */
  private async performAutoActivation(context: any): Promise<void> {
    for (const [flag, config] of FLAG_DEFINITIONS) {
      // Skip if already activated
      if (this.activeFlags.has(flag)) continue;
      
      // Check auto-activation condition
      if (config.autoActivation) {
        try {
          if (config.autoActivation.condition(context)) {
            await this.activateFlag(flag, true, 'auto', context);
          }
        } catch (error) {
          // Condition evaluation failed, skip
          continue;
        }
      }
    }
  }
  
  /**
   * Activate implied flags
   */
  private async activateImpliedFlags(): Promise<void> {
    const toActivate: string[] = [];
    
    for (const activation of this.activeFlags.values()) {
      if (activation.implications) {
        toActivate.push(...activation.implications);
      }
    }
    
    for (const flag of toActivate) {
      if (!this.activeFlags.has(flag)) {
        await this.activateFlag(flag, true, 'implied');
      }
    }
  }
  
  /**
   * Resolve flag conflicts based on priority
   */
  private resolveConflicts(): void {
    const toRemove: string[] = [];
    
    for (const [flag, activation] of this.activeFlags) {
      if (activation.conflicts) {
        for (const conflict of activation.conflicts) {
          if (this.activeFlags.has(conflict)) {
            // Compare priorities
            const flagConfig = FLAG_DEFINITIONS.get(flag)!;
            const conflictConfig = FLAG_DEFINITIONS.get(conflict)!;
            
            if (flagConfig.priority > conflictConfig.priority) {
              toRemove.push(conflict);
            } else if (conflictConfig.priority > flagConfig.priority) {
              toRemove.push(flag);
            } else {
              // Same priority, explicit wins
              const flagActivation = this.activeFlags.get(flag)!;
              const conflictActivation = this.activeFlags.get(conflict)!;
              
              if (flagActivation.source === 'explicit' && 
                  conflictActivation.source !== 'explicit') {
                toRemove.push(conflict);
              } else if (conflictActivation.source === 'explicit' && 
                         flagActivation.source !== 'explicit') {
                toRemove.push(flag);
              } else {
                // Both same, keep first
                toRemove.push(conflict);
              }
            }
          }
        }
      }
    }
    
    // Remove conflicting flags
    for (const flag of toRemove) {
      this.activeFlags.delete(flag);
      this.emit('flag-removed', {
        flag,
        reason: 'conflict',
      });
    }
  }
  
  /**
   * Calculate token impact
   */
  public calculateTokenImpact(): number {
    let impact = 0;
    
    for (const [flag, activation] of this.activeFlags) {
      if (activation.active) {
        const config = FLAG_DEFINITIONS.get(flag);
        if (config?.tokenImpact) {
          impact += config.tokenImpact;
        }
      }
    }
    
    return impact;
  }
  
  /**
   * Calculate performance impact
   */
  public calculatePerformanceImpact(): number {
    let impact = 0;
    
    for (const [flag, activation] of this.activeFlags) {
      if (activation.active) {
        const config = FLAG_DEFINITIONS.get(flag);
        if (config?.performanceImpact) {
          impact += config.performanceImpact;
        }
      }
    }
    
    return impact;
  }
  
  /**
   * Get active flags by category
   */
  public getFlagsByCategory(category: FlagCategory): string[] {
    const flags: string[] = [];
    
    for (const [flag, activation] of this.activeFlags) {
      if (activation.active) {
        const config = FLAG_DEFINITIONS.get(flag);
        if (config?.category === category) {
          flags.push(flag);
        }
      }
    }
    
    return flags;
  }
  
  /**
   * Check if a flag is active
   */
  public isFlagActive(flag: string): boolean {
    return this.activeFlags.has(flag) && this.activeFlags.get(flag)!.active;
  }
  
  /**
   * Get flag recommendations based on context
   */
  public getRecommendations(context: any): string[] {
    const recommendations: string[] = [];
    
    // High complexity -> thinking flags
    if (context.complexity > 0.8 && !this.isFlagActive('--think-hard')) {
      recommendations.push('Consider --think-hard for deep analysis');
    }
    
    // High token usage -> compression
    if (context.tokenUsage > 0.7 && !this.isFlagActive('--uc')) {
      recommendations.push('Use --uc to reduce token usage');
    }
    
    // Multiple files -> delegation
    if (context.fileCount > 50 && !this.isFlagActive('--delegate')) {
      recommendations.push('Enable --delegate for parallel processing');
    }
    
    // High risk -> security
    if (context.riskLevel > 0.6 && !this.isFlagActive('--secure')) {
      recommendations.push('Add --secure for enhanced security checks');
    }
    
    // Production -> safe mode
    if (context.environment === 'production' && !this.isFlagActive('--safe-mode')) {
      recommendations.push('Use --safe-mode for production operations');
    }
    
    return recommendations;
  }
  
  /**
   * Get statistics
   */
  public getStatistics(): {
    totalActivations: number;
    categoryDistribution: Record<FlagCategory, number>;
    sourceDistribution: Record<string, number>;
    commonFlags: string[];
    averageTokenImpact: number;
    averagePerformanceImpact: number;
  } {
    const categoryDist: Record<FlagCategory, number> = {} as any;
    const sourceDist: Record<string, number> = {
      explicit: 0,
      auto: 0,
      implied: 0,
    };
    const flagCounts: Map<string, number> = new Map();
    
    for (const activation of this.flagHistory) {
      // Source distribution
      sourceDist[activation.source]++;
      
      // Flag frequency
      flagCounts.set(activation.flag, 
        (flagCounts.get(activation.flag) || 0) + 1);
      
      // Category distribution
      const config = FLAG_DEFINITIONS.get(activation.flag);
      if (config) {
        categoryDist[config.category] = 
          (categoryDist[config.category] || 0) + 1;
      }
    }
    
    // Common flags
    const commonFlags = Array.from(flagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([flag]) => flag);
    
    // Calculate average impacts
    const impacts = this.flagHistory.map(a => {
      const config = FLAG_DEFINITIONS.get(a.flag);
      return {
        token: config?.tokenImpact || 0,
        performance: config?.performanceImpact || 0,
      };
    });
    
    const avgTokenImpact = impacts.length > 0 ?
      impacts.reduce((sum, i) => sum + i.token, 0) / impacts.length : 0;
    
    const avgPerformanceImpact = impacts.length > 0 ?
      impacts.reduce((sum, i) => sum + i.performance, 0) / impacts.length : 0;
    
    return {
      totalActivations: this.flagHistory.length,
      categoryDistribution: categoryDist,
      sourceDistribution: sourceDist,
      commonFlags,
      averageTokenImpact: avgTokenImpact,
      averagePerformanceImpact: avgPerformanceImpact,
    };
  }
  
  /**
   * Reset flags
   */
  public reset(): void {
    this.activeFlags.clear();
    this.emit('flags-reset');
  }
  
  /**
   * Enable/disable auto-activation
   */
  public setAutoActivation(enabled: boolean): void {
    this.autoActivationEnabled = enabled;
  }
}

export default FlagManager;