/**
 * Crypto Command System for OnChainAgents
 * Inspired by SuperClaude's command structure
 * Provides structured commands for crypto operations with flags and wave support
 */

import { EventEmitter } from 'events';
import { DetectionEngine, CryptoDomain, OperationType } from '../orchestrator/detection-engine';
import { PersonaManager } from '../personas';
import { PersonaActivationEngine } from '../personas/activation-engine';

// Command categories (SuperClaude-inspired)
export enum CommandCategory {
  ANALYSIS = 'analysis',
  TRACKING = 'tracking',
  SECURITY = 'security',
  YIELD = 'yield',
  DISCOVERY = 'discovery',
  EXECUTION = 'execution',
  MONITORING = 'monitoring',
  META = 'meta',
}

// Command structure matching SuperClaude
export interface CommandConfig {
  command: string;
  category: CommandCategory;
  purpose: string;
  waveEnabled: boolean;
  performanceProfile: 'optimization' | 'standard' | 'complex';
  autoPersona?: string[];
  mcpIntegration?: string[];
  toolOrchestration: string[];
  arguments: CommandArgument[];
  flags: string[];
  examples: string[];
}

// Command argument definition
export interface CommandArgument {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'address' | 'network' | 'token';
  required: boolean;
  description: string;
  default?: any;
  validation?: (value: any) => boolean;
}

// Command execution context
export interface CommandContext {
  command: string;
  args: Record<string, any>;
  flags: Record<string, any>;
  rawInput: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

// Command execution result
export interface CommandResult {
  success: boolean;
  command: string;
  data?: any;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    executionTime: number;
    tokensUsed: number;
    persona?: string;
    waveMode?: boolean;
  };
  evidence?: any;
}

/**
 * Base Command Class
 */
export abstract class BaseCommand extends EventEmitter {
  protected config: CommandConfig;
  protected detectionEngine: DetectionEngine;
  protected personaManager: PersonaManager;
  protected activationEngine: PersonaActivationEngine;
  
  constructor(
    config: CommandConfig,
    detectionEngine: DetectionEngine,
    personaManager: PersonaManager,
    activationEngine: PersonaActivationEngine
  ) {
    super();
    this.config = config;
    this.detectionEngine = detectionEngine;
    this.personaManager = personaManager;
    this.activationEngine = activationEngine;
  }
  
  /**
   * Validate command arguments
   */
  protected validateArguments(args: Record<string, any>): string[] {
    const errors: string[] = [];
    
    for (const argDef of this.config.arguments) {
      const value = args[argDef.name];
      
      // Check required
      if (argDef.required && value === undefined) {
        errors.push(`Missing required argument: ${argDef.name}`);
        continue;
      }
      
      // Skip if not provided and not required
      if (value === undefined) continue;
      
      // Type validation
      if (argDef.type === 'address') {
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
          errors.push(`Invalid address format: ${argDef.name}`);
        }
      } else if (argDef.type === 'network') {
        const validNetworks = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism'];
        if (!validNetworks.includes(value)) {
          errors.push(`Invalid network: ${value}`);
        }
      } else if (argDef.type === 'number') {
        if (isNaN(Number(value))) {
          errors.push(`Invalid number: ${argDef.name}`);
        }
      }
      
      // Custom validation
      if (argDef.validation && !argDef.validation(value)) {
        errors.push(`Validation failed for: ${argDef.name}`);
      }
    }
    
    return errors;
  }
  
  /**
   * Parse command flags
   */
  protected parseFlags(flags: Record<string, any>): Record<string, any> {
    const parsed: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(flags)) {
      // Remove -- prefix if present
      const cleanKey = key.startsWith('--') ? key.slice(2) : key;
      parsed[cleanKey] = value;
    }
    
    return parsed;
  }
  
  /**
   * Execute the command
   */
  public abstract execute(context: CommandContext): Promise<CommandResult>;
  
  /**
   * Get command help
   */
  public getHelp(): string {
    let help = `${this.config.command} - ${this.config.purpose}\n\n`;
    
    help += 'Arguments:\n';
    for (const arg of this.config.arguments) {
      const required = arg.required ? ' (required)' : ' (optional)';
      help += `  ${arg.name}: ${arg.type}${required} - ${arg.description}\n`;
    }
    
    help += '\nFlags:\n';
    for (const flag of this.config.flags) {
      help += `  --${flag}\n`;
    }
    
    help += '\nExamples:\n';
    for (const example of this.config.examples) {
      help += `  ${example}\n`;
    }
    
    return help;
  }
}

/**
 * /whale Command - Track whale movements
 */
export class WhaleCommand extends BaseCommand {
  constructor(
    detectionEngine: DetectionEngine,
    personaManager: PersonaManager,
    activationEngine: PersonaActivationEngine
  ) {
    super(
      {
        command: '/whale',
        category: CommandCategory.TRACKING,
        purpose: 'Track and analyze whale wallet movements',
        waveEnabled: true,
        performanceProfile: 'standard',
        autoPersona: ['WhaleHunter'],
        mcpIntegration: ['Hive', 'Sequential'],
        toolOrchestration: ['WhaleAgent', 'Read', 'Grep', 'TodoWrite'],
        arguments: [
          {
            name: 'address',
            type: 'address',
            required: true,
            description: 'Wallet address to track',
          },
          {
            name: 'network',
            type: 'network',
            required: false,
            description: 'Blockchain network',
            default: 'ethereum',
          },
          {
            name: 'timeframe',
            type: 'string',
            required: false,
            description: 'Analysis timeframe',
            default: '24h',
          },
        ],
        flags: ['--deep', '--realtime', '--alert', '--history'],
        examples: [
          '/whale 0x123... --deep',
          '/whale 0x456... --network polygon --realtime',
        ],
      },
      detectionEngine,
      personaManager,
      activationEngine
    );
  }
  
  async execute(context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    // Validate arguments
    const errors = this.validateArguments(context.args);
    if (errors.length > 0) {
      return {
        success: false,
        command: this.config.command,
        errors,
      };
    }
    
    // Parse flags
    const flags = this.parseFlags(context.flags);
    
    // Auto-activate persona
    const activationContext = {
      domains: [CryptoDomain.WHALE],
      operations: [OperationType.TRACKING],
      keywords: ['whale', 'track', 'movement'],
      complexity: flags.deep ? 0.7 : 0.4,
      riskLevel: 0.3,
      urgency: flags.realtime ? 0.8 : 0.3,
    };
    
    const persona = await this.activationEngine.activateBestPersona(activationContext);
    
    // Simulate whale tracking
    const whaleData = {
      address: context.args.address,
      network: context.args.network || 'ethereum',
      balance: 15000000, // $15M
      recentTransactions: [
        {
          type: 'transfer_out',
          amount: 1000000,
          timestamp: Date.now() - 3600000,
          to: '0xabc...',
        },
        {
          type: 'transfer_in',
          amount: 2000000,
          timestamp: Date.now() - 7200000,
          from: '0xdef...',
        },
      ],
      accumulation: true,
      riskScore: 0.3,
      influence: 0.7,
    };
    
    // Get persona recommendations
    const recommendations = persona ? 
      (persona as any).getRecommendations(whaleData) : [];
    
    return {
      success: true,
      command: this.config.command,
      data: {
        whale: whaleData,
        recommendations,
        analysis: {
          pattern: 'accumulation',
          confidence: 0.85,
          impact: 'medium',
        },
      },
      metadata: {
        executionTime: Date.now() - startTime,
        tokensUsed: 5000,
        persona: persona ? (persona as any).config.type : undefined,
        waveMode: flags.deep || false,
      },
    };
  }
}

/**
 * /audit Command - Security audit
 */
export class AuditCommand extends BaseCommand {
  constructor(
    detectionEngine: DetectionEngine,
    personaManager: PersonaManager,
    activationEngine: PersonaActivationEngine
  ) {
    super(
      {
        command: '/audit',
        category: CommandCategory.SECURITY,
        purpose: 'Perform security audit on smart contracts',
        waveEnabled: true,
        performanceProfile: 'complex',
        autoPersona: ['SecurityAuditor'],
        mcpIntegration: ['Sequential', 'Hive'],
        toolOrchestration: ['SecurityAgent', 'Read', 'Grep', 'Bash'],
        arguments: [
          {
            name: 'contract',
            type: 'address',
            required: true,
            description: 'Contract address to audit',
          },
          {
            name: 'network',
            type: 'network',
            required: false,
            description: 'Blockchain network',
            default: 'ethereum',
          },
          {
            name: 'depth',
            type: 'string',
            required: false,
            description: 'Audit depth (quick/standard/deep)',
            default: 'standard',
          },
        ],
        flags: ['--critical-only', '--include-deps', '--simulate', '--report'],
        examples: [
          '/audit 0xcontract... --deep',
          '/audit 0xtoken... --critical-only --report',
        ],
      },
      detectionEngine,
      personaManager,
      activationEngine
    );
  }
  
  async execute(context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    // Validate arguments
    const errors = this.validateArguments(context.args);
    if (errors.length > 0) {
      return {
        success: false,
        command: this.config.command,
        errors,
      };
    }
    
    // Parse flags
    const flags = this.parseFlags(context.flags);
    
    // Auto-activate security persona
    const activationContext = {
      domains: [CryptoDomain.SECURITY],
      operations: [OperationType.SCANNING, OperationType.VALIDATION],
      keywords: ['audit', 'security', 'vulnerability'],
      complexity: context.args.depth === 'deep' ? 0.9 : 0.6,
      riskLevel: 0.8,
      urgency: 0.5,
    };
    
    await this.activationEngine.activateBestPersona(activationContext);
    
    // Simulate audit results
    const auditResults = {
      contract: context.args.contract,
      network: context.args.network || 'ethereum',
      securityScore: 75,
      vulnerabilities: [
        {
          severity: 'medium',
          type: 'reentrancy',
          location: 'transfer function',
          recommendation: 'Use checks-effects-interactions pattern',
        },
        {
          severity: 'low',
          type: 'gas optimization',
          location: 'loop in distribute',
          recommendation: 'Consider batch processing',
        },
      ],
      verified: true,
      ownershipRenounced: false,
      auditSummary: 'Contract is relatively safe with minor improvements needed',
    };
    
    return {
      success: true,
      command: this.config.command,
      data: auditResults,
      warnings: flags['critical-only'] ? [] : [
        'Owner can still modify contract',
        'Consider renouncing ownership after deployment',
      ],
      metadata: {
        executionTime: Date.now() - startTime,
        tokensUsed: 15000,
        persona: 'SecurityAuditor',
        waveMode: context.args.depth === 'deep',
      },
    };
  }
}

/**
 * /alpha Command - Find alpha opportunities
 */
export class AlphaCommand extends BaseCommand {
  constructor(
    detectionEngine: DetectionEngine,
    personaManager: PersonaManager,
    activationEngine: PersonaActivationEngine
  ) {
    super(
      {
        command: '/alpha',
        category: CommandCategory.DISCOVERY,
        purpose: 'Discover early alpha opportunities',
        waveEnabled: true,
        performanceProfile: 'complex',
        autoPersona: ['AlphaSeeker'],
        mcpIntegration: ['Hive', 'Sequential', 'Magic'],
        toolOrchestration: ['AlphaAgent', 'Grep', 'WebSearch'],
        arguments: [
          {
            name: 'category',
            type: 'string',
            required: false,
            description: 'Category (defi/nft/gaming/ai/all)',
            default: 'all',
          },
          {
            name: 'risk',
            type: 'string',
            required: false,
            description: 'Risk level (low/medium/high)',
            default: 'medium',
          },
          {
            name: 'marketcap',
            type: 'string',
            required: false,
            description: 'Market cap range',
            default: '<10M',
          },
        ],
        flags: ['--trending', '--whale-backed', '--narrative', '--momentum'],
        examples: [
          '/alpha --trending --whale-backed',
          '/alpha defi --risk high --momentum',
        ],
      },
      detectionEngine,
      personaManager,
      activationEngine
    );
  }
  
  async execute(context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    // Parse flags
    const flags = this.parseFlags(context.flags);
    
    // Auto-activate alpha seeker
    const activationContext = {
      domains: [CryptoDomain.ALPHA],
      operations: [OperationType.DISCOVERY, OperationType.ANALYSIS],
      keywords: ['alpha', 'opportunity', 'gem'],
      complexity: 0.8,
      riskLevel: context.args.risk === 'high' ? 0.8 : 0.5,
      urgency: flags.momentum ? 0.7 : 0.4,
    };
    
    await this.activationEngine.activateBestPersona(activationContext);
    
    // Simulate alpha discoveries
    const opportunities = [
      {
        token: 'NEWGEM',
        address: '0x123...',
        marketCap: 5000000,
        score: 85,
        signals: ['whale_accumulation', 'social_momentum', 'technical_breakout'],
        risk: 'high',
        potential: '10x',
        reasoning: 'Early stage with strong fundamentals and whale backing',
      },
      {
        token: 'AITOKEN',
        address: '0x456...',
        marketCap: 8000000,
        score: 78,
        signals: ['narrative_alignment', 'dev_activity', 'partnership_rumors'],
        risk: 'medium',
        potential: '5x',
        reasoning: 'Aligns with AI narrative, active development',
      },
    ];
    
    return {
      success: true,
      command: this.config.command,
      data: {
        opportunities: flags.trending ? opportunities.slice(0, 1) : opportunities,
        marketConditions: {
          trend: 'bullish',
          narratives: ['AI', 'RWA', 'Gaming'],
        },
        recommendations: [
          'DYOR - These are high-risk opportunities',
          'Consider dollar-cost averaging',
          'Set stop-losses at -20%',
        ],
      },
      metadata: {
        executionTime: Date.now() - startTime,
        tokensUsed: 20000,
        persona: 'AlphaSeeker',
        waveMode: true,
      },
    };
  }
}

/**
 * /yield Command - Optimize yield strategies
 */
export class YieldCommand extends BaseCommand {
  constructor(
    detectionEngine: DetectionEngine,
    personaManager: PersonaManager,
    activationEngine: PersonaActivationEngine
  ) {
    super(
      {
        command: '/yield',
        category: CommandCategory.YIELD,
        purpose: 'Optimize DeFi yield strategies',
        waveEnabled: true,
        performanceProfile: 'optimization',
        autoPersona: ['DeFiArchitect', 'YieldOptimizer'],
        mcpIntegration: ['Context7', 'Sequential'],
        toolOrchestration: ['DeFiAgent', 'Read', 'Calculate'],
        arguments: [
          {
            name: 'amount',
            type: 'number',
            required: true,
            description: 'Amount to optimize (USD)',
          },
          {
            name: 'risk',
            type: 'string',
            required: false,
            description: 'Risk tolerance',
            default: 'medium',
          },
          {
            name: 'duration',
            type: 'string',
            required: false,
            description: 'Investment duration',
            default: '30d',
          },
        ],
        flags: ['--stable-only', '--multi-chain', '--auto-compound', '--gas-optimize'],
        examples: [
          '/yield 10000 --stable-only',
          '/yield 50000 --risk high --multi-chain',
        ],
      },
      detectionEngine,
      personaManager,
      activationEngine
    );
  }
  
  async execute(context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    // Validate arguments
    const errors = this.validateArguments(context.args);
    if (errors.length > 0) {
      return {
        success: false,
        command: this.config.command,
        errors,
      };
    }
    
    // Parse flags
    const flags = this.parseFlags(context.flags);
    
    // Auto-activate DeFi architect
    const activationContext = {
      domains: [CryptoDomain.DEFI, CryptoDomain.YIELD],
      operations: [OperationType.OPTIMIZATION],
      keywords: ['yield', 'optimize', 'apy'],
      complexity: 0.7,
      riskLevel: context.args.risk === 'high' ? 0.7 : 0.4,
      urgency: 0.3,
    };
    
    await this.activationEngine.activateBestPersona(activationContext);
    
    // Simulate yield optimization
    const strategies = [
      {
        protocol: 'Aave V3',
        chain: 'Ethereum',
        apy: flags['stable-only'] ? 5.2 : 12.5,
        risk: 'low',
        allocation: 0.4,
        gasEstimate: 50,
      },
      {
        protocol: 'Curve',
        chain: 'Ethereum',
        apy: flags['stable-only'] ? 7.8 : 15.3,
        risk: 'medium',
        allocation: 0.35,
        gasEstimate: 80,
      },
      {
        protocol: 'Yearn',
        chain: flags['multi-chain'] ? 'Arbitrum' : 'Ethereum',
        apy: 18.5,
        risk: 'medium',
        allocation: 0.25,
        gasEstimate: flags['multi-chain'] ? 10 : 100,
      },
    ];
    
    const totalAPY = strategies.reduce((sum, s) => sum + s.apy * s.allocation, 0);
    
    return {
      success: true,
      command: this.config.command,
      data: {
        recommendedStrategies: strategies,
        totalAPY,
        estimatedYearlyReturn: context.args.amount * (totalAPY / 100),
        rebalanceFrequency: '7d',
        gasOptimization: flags['gas-optimize'] ? 'Batched transactions on L2' : 'Standard',
      },
      metadata: {
        executionTime: Date.now() - startTime,
        tokensUsed: 10000,
        persona: 'DeFiArchitect',
        waveMode: true,
      },
    };
  }
}

/**
 * Command Manager - Handles all commands
 */
export class CommandManager extends EventEmitter {
  private commands: Map<string, BaseCommand>;
  private detectionEngine: DetectionEngine;
  private personaManager: PersonaManager;
  private activationEngine: PersonaActivationEngine;
  private commandHistory: CommandResult[] = [];
  
  constructor(
    detectionEngine: DetectionEngine,
    personaManager: PersonaManager,
    activationEngine: PersonaActivationEngine
  ) {
    super();
    this.detectionEngine = detectionEngine;
    this.personaManager = personaManager;
    this.activationEngine = activationEngine;
    this.commands = new Map();
    this.initializeCommands();
  }
  
  private initializeCommands(): void {
    // Register all commands
    this.registerCommand(new WhaleCommand(
      this.detectionEngine,
      this.personaManager,
      this.activationEngine
    ));
    
    this.registerCommand(new AuditCommand(
      this.detectionEngine,
      this.personaManager,
      this.activationEngine
    ));
    
    this.registerCommand(new AlphaCommand(
      this.detectionEngine,
      this.personaManager,
      this.activationEngine
    ));
    
    this.registerCommand(new YieldCommand(
      this.detectionEngine,
      this.personaManager,
      this.activationEngine
    ));
    
    // Additional commands would be registered here:
    // /risk, /bridge, /governance, /sentiment, /nft, /dex, /track
  }
  
  /**
   * Register a command
   */
  public registerCommand(command: BaseCommand): void {
    const config = (command as any).config;
    this.commands.set(config.command, command);
  }
  
  /**
   * Parse command input
   */
  public parseInput(input: string): {
    command: string;
    args: Record<string, any>;
    flags: Record<string, any>;
  } {
    const parts = input.split(' ');
    const command = parts[0];
    const args: Record<string, any> = {};
    const flags: Record<string, any> = {};
    
    let currentArg: string | null = null;
    
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.startsWith('--')) {
        // Flag
        const flagName = part.slice(2);
        const nextPart = parts[i + 1];
        
        if (nextPart && !nextPart.startsWith('--')) {
          flags[flagName] = nextPart;
          i++;
        } else {
          flags[flagName] = true;
        }
      } else if (!currentArg) {
        // First non-flag argument
        currentArg = part;
      } else {
        // Additional arguments
        args[currentArg] = part;
        currentArg = null;
      }
    }
    
    // Handle single argument commands
    if (currentArg) {
      const cmd = this.commands.get(command);
      if (cmd) {
        const config = (cmd as any).config;
        if (config.arguments.length > 0) {
          args[config.arguments[0].name] = currentArg;
        }
      }
    }
    
    return { command, args, flags };
  }
  
  /**
   * Execute a command
   */
  public async execute(input: string, userId?: string): Promise<CommandResult> {
    const { command, args, flags } = this.parseInput(input);
    
    const cmd = this.commands.get(command);
    if (!cmd) {
      return {
        success: false,
        command,
        errors: [`Unknown command: ${command}`],
      };
    }
    
    const context: CommandContext = {
      command,
      args,
      flags,
      rawInput: input,
      timestamp: Date.now(),
      userId,
      sessionId: `session_${Date.now()}`,
    };
    
    try {
      const result = await cmd.execute(context);
      
      // Store in history
      this.commandHistory.push(result);
      if (this.commandHistory.length > 100) {
        this.commandHistory.shift();
      }
      
      // Emit execution event
      this.emit('command-executed', {
        command,
        result,
        context,
      });
      
      return result;
    } catch (error) {
      return {
        success: false,
        command,
        errors: [`Execution error: ${error}`],
      };
    }
  }
  
  /**
   * Get command help
   */
  public getHelp(commandName?: string): string {
    if (commandName) {
      const cmd = this.commands.get(commandName);
      return cmd ? cmd.getHelp() : `Unknown command: ${commandName}`;
    }
    
    let help = 'Available Commands:\n\n';
    for (const [name, cmd] of this.commands) {
      const config = (cmd as any).config;
      help += `${name} - ${config.purpose}\n`;
    }
    
    help += '\nUse /help <command> for detailed help on a specific command';
    return help;
  }
  
  /**
   * Get command statistics
   */
  public getStatistics(): {
    totalExecutions: number;
    commandUsage: Record<string, number>;
    successRate: number;
    averageExecutionTime: number;
  } {
    const totalExecutions = this.commandHistory.length;
    const commandUsage: Record<string, number> = {};
    let successCount = 0;
    let totalTime = 0;
    
    for (const result of this.commandHistory) {
      commandUsage[result.command] = (commandUsage[result.command] || 0) + 1;
      if (result.success) successCount++;
      if (result.metadata?.executionTime) {
        totalTime += result.metadata.executionTime;
      }
    }
    
    return {
      totalExecutions,
      commandUsage,
      successRate: totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0,
      averageExecutionTime: totalExecutions > 0 ? totalTime / totalExecutions : 0,
    };
  }
}

export default CommandManager;