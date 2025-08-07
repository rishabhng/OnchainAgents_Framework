/**
 * OnChainAgents Orchestrator
 * Intelligent routing system inspired by SuperClaude's ORCHESTRATOR.md
 * Routes crypto operations to appropriate agents and manages complexity
 */

import { DetectionEngine } from './detection-engine';
import { Router } from './router';
import { HiveBridge } from '../bridges/hive-bridge';
import { ResourceManager } from './resource-manager';
import { WaveOrchestrationEngine } from './wave-engine';
import { ResourceZoneManager } from './resource-zones';
import { QualityGatesFramework } from './quality-gates';
import { PersonaManager } from '../personas';
import { PersonaActivationEngine } from '../personas/activation-engine';
import { FlagManager } from '../flags';
import { CommandManager } from '../commands';

// Import all agents
import { RugDetector } from '../agents/security/RugDetector';
import { RiskAnalyzer } from '../agents/security/RiskAnalyzer';
import { AlphaHunter } from '../agents/market/AlphaHunter';
import { WhaleTracker } from '../agents/market/WhaleTracker';
import { SentimentAnalyzer } from '../agents/market/SentimentAnalyzer';
import { MarketMaker } from '../agents/market/MarketMaker';
import { TokenResearcher } from '../agents/research/TokenResearcher';
import { DeFiAnalyzer } from '../agents/research/DeFiAnalyzer';
import { PortfolioTracker } from '../agents/research/PortfolioTracker';
import { YieldOptimizer } from '../agents/research/YieldOptimizer';
import { ChainAnalyst } from '../agents/specialized/ChainAnalyst';
import { CrossChainNavigator } from '../agents/specialized/CrossChainNavigator';
import { CryptoQuant } from '../agents/specialized/CryptoQuant';
import { GovernanceAdvisor } from '../agents/specialized/GovernanceAdvisor';
import { MarketStructureAnalyst } from '../agents/specialized/MarketStructureAnalyst';
import { NFTValuator } from '../agents/specialized/NFTValuator';

export interface OrchestratorConfig {
  maxConcurrency?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  resourceLimits?: {
    maxTokens?: number;
    maxTime?: number;
    maxMemory?: number;
  };
}

export interface ExecutionContext {
  tool: string;
  args: Record<string, any>;
  complexity?: 'simple' | 'moderate' | 'complex';
  domain?: string;
  agents?: string[];
  requiresHive?: boolean;
  estimatedTime?: number;
  estimatedTokens?: number;
}

export interface ExecutionResult {
  success: boolean;
  text?: string;
  data?: any;
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
    agentsUsed: string[];
    complexity: string;
    cached?: boolean;
  };
  errors?: string[];
}

export class Orchestrator {
  private detector: DetectionEngine;
  private router: Router;
  private hiveBridge: HiveBridge;
  private resourceManager: ResourceManager;
  private resourceZoneManager: ResourceZoneManager;
  private waveEngine: WaveOrchestrationEngine;
  private qualityGates: QualityGatesFramework;
  private personaManager: PersonaManager;
  private personaActivationEngine: PersonaActivationEngine;
  private flagManager: FlagManager;
  private commandManager: CommandManager;
  private agents: Map<string, any>;
  private config: OrchestratorConfig;

  constructor(config?: OrchestratorConfig) {
    this.config = {
      maxConcurrency: 5,
      cacheEnabled: true,
      cacheTTL: 3600,
      resourceLimits: {
        maxTokens: 100000,
        maxTime: 60000,
        maxMemory: 512 * 1024 * 1024, // 512MB
      },
      ...config,
    };

    // Initialize core components
    this.detector = new DetectionEngine();
    this.router = new Router();
    this.hiveBridge = new HiveBridge();
    this.resourceManager = new ResourceManager(this.config.resourceLimits);
    this.resourceZoneManager = new ResourceZoneManager();
    this.qualityGates = new QualityGatesFramework();

    // Initialize persona system
    this.personaManager = new PersonaManager();
    this.personaActivationEngine = new PersonaActivationEngine(this.personaManager);

    // Initialize flag system
    this.flagManager = new FlagManager();

    // Initialize wave engine with all dependencies
    this.waveEngine = new WaveOrchestrationEngine(
      this.detector,
      this.personaManager,
      this.resourceZoneManager,
      this.qualityGates,
      this.flagManager,
    );

    // Initialize command system
    this.commandManager = new CommandManager(
      this.detector,
      this.personaManager,
      this.personaActivationEngine,
    );

    // Initialize agent registry
    this.agents = new Map();
    this.initializeAgents();
  }

  /**
   * Initialize available agents
   */
  private initializeAgents(): void {
    // Security agents (2)
    this.agents.set('rugDetector', new RugDetector(this.hiveBridge));
    this.agents.set('riskAnalyzer', new RiskAnalyzer(this.hiveBridge));

    // Market agents (4)
    this.agents.set('alphaHunter', new AlphaHunter(this.hiveBridge));
    this.agents.set('whaleTracker', new WhaleTracker(this.hiveBridge));
    this.agents.set('sentimentAnalyzer', new SentimentAnalyzer(this.hiveBridge));
    this.agents.set('marketMaker', new MarketMaker(this.hiveBridge));

    // Research agents (4)
    this.agents.set('tokenResearcher', new TokenResearcher(this.hiveBridge));
    this.agents.set('defiAnalyzer', new DeFiAnalyzer(this.hiveBridge));
    this.agents.set('portfolioTracker', new PortfolioTracker(this.hiveBridge));
    this.agents.set('yieldOptimizer', new YieldOptimizer(this.hiveBridge));

    // Specialized agents (6)
    this.agents.set('chainAnalyst', new ChainAnalyst(this.hiveBridge));
    this.agents.set('crossChainNavigator', new CrossChainNavigator(this.hiveBridge));
    this.agents.set('cryptoQuant', new CryptoQuant(this.hiveBridge));
    this.agents.set('governanceAdvisor', new GovernanceAdvisor(this.hiveBridge));
    this.agents.set('marketStructureAnalyst', new MarketStructureAnalyst(this.hiveBridge));
    this.agents.set('nftValuator', new NFTValuator(this.hiveBridge));

    console.log(`[Orchestrator] Initialized ${this.agents.size} agents`);
  }

  /**
   * Main execution method - routes tools to appropriate handlers
   */
  /**
   * Execute a command with full orchestration support
   */
  public async executeCommand(input: string): Promise<ExecutionResult> {
    // Parse and execute command through command manager
    const result = await this.commandManager.execute(input);

    return {
      success: result.success,
      text: JSON.stringify(result.data, null, 2),
      data: result.data,
      metadata: {
        executionTime: result.metadata?.executionTime || 0,
        agentsUsed: [],
        complexity: 'moderate',
        tokensUsed: result.metadata?.tokensUsed,
        ...result.metadata,
      },
      errors: result.errors,
    };
  }

  /**
   * Main execution method with wave support - routes tools to appropriate handlers
   */
  public async execute(tool: string, args: Record<string, any>): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // 1. Detection Phase - Analyze the request
      const context = await this.detector.analyze(tool, args);
      console.error(
        `[Orchestrator] Detection: complexity=${context.complexity}, domain=${(context as any).domain}`,
      );

      // 2. Parse flags if present
      const flags = this.flagManager.parseFlags(args.flags || {});
      const activatedFlags = await this.flagManager.activateFlags(flags, context);
      console.error(`[Orchestrator] Flags: ${Array.from(activatedFlags.keys()).join(', ')}`);

      // 3. Check if wave mode should be used
      const waveContext = {
        operation: tool,
        domains: (context as any).domain ? [(context as any).domain] : [],
        operations: [],
        complexity: context.complexity || 0.5,
        fileCount: args.fileCount || 0,
        operationTypes: args.operationTypes || 1,
        riskLevel: 0.5,
        resourceZone: this.resourceZoneManager.getCurrentZone(),
        tokens: {
          used: 0,
          budget: this.config.resourceLimits?.maxTokens || 100000,
        },
      };

      if (this.waveEngine.shouldUseWaveMode(waveContext) || activatedFlags.has('wave-mode')) {
        console.error(`[Orchestrator] Wave mode activated`);
        const wavePlan = await this.waveEngine.planWaveExecution(waveContext);
        const waveResults = await this.waveEngine.executeWavePlan(wavePlan, waveContext);

        // Compile wave results
        const compiledData = Array.from(waveResults.values()).reduce((acc, result) => {
          return { ...acc, ...result.outputs };
        }, {});

        return {
          success: true,
          text: 'Wave execution completed',
          data: compiledData,
          metadata: {
            executionTime: Date.now() - startTime,
            agentsUsed: [],
            complexity: String(context.complexity || 'complex'),
            // waveMode: true,
          },
        };
      }

      // 4. Auto-activate persona based on context
      const activationContext = {
        domains: (context as any).domain ? [(context as any).domain] : [],
        operations: [],
        keywords: tool.split('_'),
        complexity: context.complexity || 0.5,
        riskLevel: 0.5,
        urgency: 0.5,
      };

      const persona = await this.personaActivationEngine.activateBestPersona(activationContext);
      if (persona) {
        console.error(`[Orchestrator] Activated persona: ${(persona as any).config.type}`);
      }

      // 5. Resource Check - Ensure we have capacity
      const resourceCheck = await this.resourceManager.checkAvailability(context);
      if (!resourceCheck.available) {
        throw new Error(`Resource limit exceeded: ${resourceCheck.reason}`);
      }

      // 6. Routing Phase - Determine execution strategy
      const route = await this.router.determineRoute(context as any);
      console.error(
        `[Orchestrator] Route: agents=${route.agents.join(',')}, parallel=${route.parallel}`,
      );

      // 7. Execution Phase - Run the appropriate agents
      let result: ExecutionResult;

      switch (tool) {
        case 'oca_analyze':
          result = await this.executeAnalyze(args, context as any, route);
          break;

        case 'oca_security':
          result = await this.executeSecurity(args, context as any, route);
          break;

        case 'oca_hunt':
          result = await this.executeHunt(args, context as any, route);
          break;

        case 'oca_track':
          result = await this.executeTrack(args, context, route);
          break;

        case 'oca_sentiment':
          result = await this.executeSentiment(args, context, route);
          break;

        case 'oca_research':
          result = await this.executeResearch(args, context, route);
          break;

        case 'oca_defi':
          result = await this.executeDefi(args, context, route);
          break;

        case 'oca_bridge':
          result = await this.executeBridge(args, context, route);
          break;

        case 'oca_portfolio':
          result = await this.executePortfolio(args, context, route);
          break;

        case 'oca_market':
          result = await this.executeMarket(args, context, route);
          break;

        default:
          throw new Error(`Unknown tool: ${tool}`);
      }

      // 5. Post-processing - Add metadata
      result.metadata = {
        ...result.metadata,
        executionTime: Date.now() - startTime,
        complexity: String(context.complexity || 'unknown'),
        agentsUsed: result.metadata?.agentsUsed || [],
      };

      // 6. Resource tracking
      await this.resourceManager.recordUsage({
        tool,
        executionTime: result.metadata?.executionTime || 0,
        tokensUsed: result.metadata?.tokensUsed || 0,
      });

      return result;
    } catch (error) {
      console.error(`[Orchestrator] Execution failed:`, error);

      return {
        success: false,
        text: `Failed to execute ${tool}`,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        metadata: {
          executionTime: Date.now() - startTime,
          agentsUsed: [],
          complexity: 'error',
        },
      };
    }
  }

  /**
   * Execute comprehensive analysis
   */
  private async executeAnalyze(
    args: Record<string, any>,
    context: ExecutionContext,
    _route: any,
  ): Promise<ExecutionResult> {
    const { target, network = 'ethereum', depth = 'standard' } = args;

    // Determine which agents to use based on depth
    const agentsToUse =
      depth === 'quick'
        ? ['rugDetector']
        : depth === 'deep' || depth === 'forensic'
          ? ['rugDetector', 'alphaHunter', 'whaleTracker', 'sentimentAnalyzer', 'tokenResearcher']
          : ['rugDetector', 'alphaHunter'];

    // Execute agents in parallel when possible
    const results = await Promise.allSettled(
      agentsToUse.map((agentName) => {
        const agent = this.agents.get(agentName);
        if (!agent) return Promise.reject(`Agent ${agentName} not found`);

        return agent.analyze({
          network,
          address: target.startsWith('0x') ? target : undefined,
          symbol: !target.startsWith('0x') ? target : undefined,
        });
      }),
    );

    // Compile results
    const successfulResults = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as any).value);

    const failedResults = results
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as any).reason);

    // Generate comprehensive analysis
    const analysis = this.compileAnalysis(successfulResults, target, network);

    return {
      success: successfulResults.length > 0,
      text: this.formatAnalysisText(analysis),
      data: analysis,
      metadata: {
        executionTime: 0,
        agentsUsed: agentsToUse,
        complexity: context.complexity || 'moderate',
        tokensUsed: this.estimateTokens(analysis),
      },
      errors: failedResults,
    };
  }

  /**
   * Execute security analysis
   */
  private async executeSecurity(
    args: Record<string, any>,
    _context: ExecutionContext,
    _route: any,
  ): Promise<ExecutionResult> {
    const { address, network = 'ethereum', includeAudit = true } = args;

    const rugDetector = this.agents.get('rugDetector');
    if (!rugDetector) {
      throw new Error('Security agent not available');
    }

    const result = await rugDetector.analyze({
      network,
      address,
      options: { deepScan: includeAudit },
    });

    return {
      success: result.success,
      text: this.formatSecurityText(result.data),
      data: result.data,
      metadata: {
        executionTime: 0,
        agentsUsed: ['rugDetector'],
        complexity: 'moderate',
      },
    };
  }

  /**
   * Execute alpha hunting
   */
  private async executeHunt(
    args: Record<string, any>,
    _context: ExecutionContext,
    _route: any,
  ): Promise<ExecutionResult> {
    const alphaHunter = this.agents.get('alphaHunter');
    if (!alphaHunter) {
      throw new Error('Alpha hunting agent not available');
    }

    const result = await alphaHunter.analyze({
      options: args,
    });

    return {
      success: result.success,
      text: this.formatHuntText(result.data),
      data: result.data,
      metadata: {
        executionTime: 0,
        agentsUsed: ['alphaHunter'],
        complexity: 'complex',
      },
    };
  }

  // Placeholder methods for other operations
  private async executeTrack(_args: any, _context: any, _route: any): Promise<ExecutionResult> {
    return {
      success: false,
      text: 'Whale tracking not yet implemented',
      metadata: { executionTime: 0, agentsUsed: [], complexity: 'moderate' },
    };
  }

  private async executeSentiment(_args: any, _context: any, _route: any): Promise<ExecutionResult> {
    return {
      success: false,
      text: 'Sentiment analysis not yet implemented',
      metadata: { executionTime: 0, agentsUsed: [], complexity: 'simple' },
    };
  }

  private async executeResearch(_args: any, _context: any, _route: any): Promise<ExecutionResult> {
    return {
      success: false,
      text: 'Token research not yet implemented',
      metadata: { executionTime: 0, agentsUsed: [], complexity: 'complex' },
    };
  }

  private async executeDefi(_args: any, _context: any, _route: any): Promise<ExecutionResult> {
    return {
      success: false,
      text: 'DeFi analysis not yet implemented',
      metadata: { executionTime: 0, agentsUsed: [], complexity: 'moderate' },
    };
  }

  private async executeBridge(_args: any, _context: any, _route: any): Promise<ExecutionResult> {
    return {
      success: false,
      text: 'Bridge analysis not yet implemented',
      metadata: { executionTime: 0, agentsUsed: [], complexity: 'simple' },
    };
  }

  private async executePortfolio(_args: any, _context: any, _route: any): Promise<ExecutionResult> {
    return {
      success: false,
      text: 'Portfolio analysis not yet implemented',
      metadata: { executionTime: 0, agentsUsed: [], complexity: 'moderate' },
    };
  }

  private async executeMarket(_args: any, _context: any, _route: any): Promise<ExecutionResult> {
    return {
      success: false,
      text: 'Market structure analysis not yet implemented',
      metadata: { executionTime: 0, agentsUsed: [], complexity: 'complex' },
    };
  }

  // Helper methods

  private compileAnalysis(results: any[], target: string, network: string): any {
    const analysis: any = {
      target,
      network,
      timestamp: new Date().toISOString(),
      agents: {},
      summary: {},
    };

    for (const result of results) {
      if (result && result.agent) {
        analysis.agents[result.agent] = result.data;
      }
    }

    // Generate summary based on available data
    if (analysis.agents.rugDetector) {
      analysis.summary.security = {
        score: analysis.agents.rugDetector.score,
        verdict: analysis.agents.rugDetector.verdict,
      };
    }

    if (analysis.agents.alphaHunter) {
      analysis.summary.opportunity = {
        found: analysis.agents.alphaHunter.opportunities?.length > 0,
        count: analysis.agents.alphaHunter.opportunities?.length || 0,
      };
    }

    return analysis;
  }

  private formatAnalysisText(analysis: any): string {
    let text = `# 🔍 Comprehensive Analysis\n\n`;
    text += `**Target**: ${analysis.target}\n`;
    text += `**Network**: ${analysis.network}\n\n`;

    if (analysis.summary.security) {
      text += `## 🛡️ Security\n`;
      text += `- **Score**: ${analysis.summary.security.score}/100\n`;
      text += `- **Verdict**: ${analysis.summary.security.verdict}\n\n`;
    }

    if (analysis.summary.opportunity) {
      text += `## 🎯 Opportunities\n`;
      text += analysis.summary.opportunity.found
        ? `Found ${analysis.summary.opportunity.count} alpha opportunities\n\n`
        : `No immediate opportunities detected\n\n`;
    }

    return text;
  }

  private formatSecurityText(data: any): string {
    return (
      `# 🛡️ Security Analysis\n\n` +
      `**Risk Score**: ${data?.score || 0}/100\n` +
      `**Verdict**: ${data?.verdict || 'UNKNOWN'}\n` +
      `**Recommendations**: ${data?.recommendations?.join(', ') || 'None'}\n`
    );
  }

  private formatHuntText(data: any): string {
    const opportunities = data?.opportunities || [];
    return (
      `# 🎯 Alpha Opportunities\n\n` +
      `Found ${opportunities.length} opportunities\n` +
      opportunities
        .slice(0, 5)
        .map(
          (o: any, i: number) =>
            `${i + 1}. **${o.token?.symbol || 'Unknown'}** - Score: ${o.momentumScore}/10`,
        )
        .join('\n')
    );
  }

  private estimateTokens(data: any): number {
    // Simple estimation based on JSON size
    const jsonString = JSON.stringify(data);
    return Math.ceil(jsonString.length / 4); // Rough token estimation
  }
}
