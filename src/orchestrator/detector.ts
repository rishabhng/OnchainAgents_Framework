/**
 * Detection Engine for OnChainAgents
 * Analyzes crypto requests to understand intent, complexity, and requirements
 * Inspired by SuperClaude's pattern recognition
 */

export interface DetectionResult {
  tool: string;
  args: Record<string, any>;
  complexity: 'simple' | 'moderate' | 'complex';
  domain: string;
  agents: string[];
  requiresHive: boolean;
  estimatedTime: number;
  estimatedTokens: number;
  confidence: number;
}

export class DetectionEngine {
  private patterns: Map<string, any>;

  constructor() {
    this.patterns = new Map();
    this.initializePatterns();
  }

  /**
   * Initialize crypto-specific patterns
   */
  private initializePatterns(): void {
    // Complexity patterns
    this.patterns.set('complexity', {
      simple: {
        indicators: ['single token lookup', 'price check', 'basic info', 'quick scan'],
        tokenBudget: 5000,
        timeEstimate: 5000, // 5 seconds
      },
      moderate: {
        indicators: [
          'security analysis',
          'portfolio check',
          'sentiment analysis',
          'bridge routing',
        ],
        tokenBudget: 15000,
        timeEstimate: 15000, // 15 seconds
      },
      complex: {
        indicators: [
          'comprehensive analysis',
          'deep research',
          'forensic audit',
          'market structure',
          'alpha hunting',
        ],
        tokenBudget: 30000,
        timeEstimate: 30000, // 30 seconds
      },
    });

    // Domain patterns
    this.patterns.set('domains', {
      security: {
        keywords: ['rug', 'scam', 'audit', 'security', 'safe', 'risk'],
        agents: ['rugDetector', 'riskAnalyzer'],
        tools: ['oca_security', 'oca_analyze'],
      },
      market: {
        keywords: ['alpha', 'opportunity', 'gem', 'trend', 'momentum'],
        agents: ['alphaHunter', 'marketAnalyzer'],
        tools: ['oca_hunt', 'oca_market'],
      },
      whale: {
        keywords: ['whale', 'wallet', 'track', 'monitor', 'smart money'],
        agents: ['whaleTracker'],
        tools: ['oca_track'],
      },
      sentiment: {
        keywords: ['sentiment', 'social', 'twitter', 'telegram', 'buzz'],
        agents: ['sentimentAnalyzer'],
        tools: ['oca_sentiment'],
      },
      research: {
        keywords: ['research', 'fundamental', 'team', 'tokenomics', 'whitepaper'],
        agents: ['tokenResearcher'],
        tools: ['oca_research'],
      },
      defi: {
        keywords: ['yield', 'farm', 'lend', 'borrow', 'liquidity', 'tvl'],
        agents: ['defiAnalyzer'],
        tools: ['oca_defi'],
      },
      bridge: {
        keywords: ['bridge', 'cross-chain', 'transfer', 'route'],
        agents: ['crossChainNavigator'],
        tools: ['oca_bridge'],
      },
      portfolio: {
        keywords: ['portfolio', 'holdings', 'balance', 'pnl', 'diversification'],
        agents: ['portfolioTracker'],
        tools: ['oca_portfolio'],
      },
    });

    // Tool-specific patterns
    this.patterns.set('tools', {
      oca_analyze: {
        complexity: 'moderate',
        domains: ['security', 'market', 'research'],
        agents: ['rugDetector', 'alphaHunter', 'tokenResearcher'],
        requiresHive: true,
      },
      oca_security: {
        complexity: 'moderate',
        domains: ['security'],
        agents: ['rugDetector'],
        requiresHive: true,
      },
      oca_hunt: {
        complexity: 'complex',
        domains: ['market'],
        agents: ['alphaHunter'],
        requiresHive: true,
      },
      oca_track: {
        complexity: 'moderate',
        domains: ['whale'],
        agents: ['whaleTracker'],
        requiresHive: true,
      },
      oca_sentiment: {
        complexity: 'simple',
        domains: ['sentiment'],
        agents: ['sentimentAnalyzer'],
        requiresHive: true,
      },
      oca_research: {
        complexity: 'complex',
        domains: ['research'],
        agents: ['tokenResearcher'],
        requiresHive: true,
      },
      oca_defi: {
        complexity: 'moderate',
        domains: ['defi'],
        agents: ['defiAnalyzer'],
        requiresHive: true,
      },
      oca_bridge: {
        complexity: 'simple',
        domains: ['bridge'],
        agents: ['crossChainNavigator'],
        requiresHive: true,
      },
      oca_portfolio: {
        complexity: 'moderate',
        domains: ['portfolio'],
        agents: ['portfolioTracker'],
        requiresHive: true,
      },
      oca_market: {
        complexity: 'complex',
        domains: ['market'],
        agents: ['marketAnalyzer'],
        requiresHive: true,
      },
    });
  }

  /**
   * Analyze a request to determine complexity and requirements
   */
  public async analyze(tool: string, args: Record<string, any>): Promise<DetectionResult> {
    // Get tool-specific pattern
    const toolPattern = this.patterns.get('tools')[tool];
    if (!toolPattern) {
      throw new Error(`Unknown tool: ${tool}`);
    }

    // Determine complexity
    const complexity = this.detectComplexity(tool, args, toolPattern);

    // Determine domains
    const domains = this.detectDomains(tool, args, toolPattern);

    // Determine required agents
    const agents = this.detectAgents(tool, args, toolPattern, domains);

    // Estimate resources
    const { time, tokens } = this.estimateResources(complexity, agents);

    // Calculate confidence
    const confidence = this.calculateConfidence(tool, args, toolPattern);

    return {
      tool,
      args,
      complexity,
      domain: domains[0] || 'general',
      agents,
      requiresHive: toolPattern.requiresHive || false,
      estimatedTime: time,
      estimatedTokens: tokens,
      confidence,
    };
  }

  /**
   * Detect operation complexity
   */
  private detectComplexity(
    _tool: string,
    args: Record<string, any>,
    toolPattern: any,
  ): 'simple' | 'moderate' | 'complex' {
    // Check for depth parameter
    if (args.depth === 'quick') return 'simple';
    if (args.depth === 'deep' || args.depth === 'forensic') return 'complex';

    // Check for multiple targets
    if (Array.isArray(args.targets) && args.targets.length > 3) return 'complex';

    // Check for comprehensive flags
    if (args.comprehensive || args.detailed || args.all) return 'complex';

    // Use tool default
    return toolPattern.complexity || 'moderate';
  }

  /**
   * Detect relevant domains
   */
  private detectDomains(_tool: string, args: Record<string, any>, toolPattern: any): string[] {
    const domains = new Set<string>(toolPattern.domains || []);

    // Check args for domain keywords
    const domainPatterns = this.patterns.get('domains');
    const argString = JSON.stringify(args).toLowerCase();

    for (const [domain, pattern] of Object.entries(domainPatterns)) {
      const keywords = (pattern as any).keywords;
      if (keywords.some((kw: string) => argString.includes(kw))) {
        domains.add(domain);
      }
    }

    return Array.from(domains);
  }

  /**
   * Detect required agents
   */
  private detectAgents(
    _tool: string,
    _args: Record<string, any>,
    toolPattern: any,
    domains: string[],
  ): string[] {
    const agents = new Set<string>(toolPattern.agents || []);

    // Add domain-specific agents
    const domainPatterns = this.patterns.get('domains');
    for (const domain of domains) {
      const pattern = domainPatterns[domain];
      if (pattern?.agents) {
        pattern.agents.forEach((agent: string) => agents.add(agent));
      }
    }

    // Filter based on depth
    if (_args.depth === 'quick' && agents.size > 2) {
      // Keep only essential agents for quick analysis
      return Array.from(agents).slice(0, 2);
    }

    return Array.from(agents);
  }

  /**
   * Estimate resource requirements
   */
  private estimateResources(
    complexity: string,
    agents: string[],
  ): { time: number; tokens: number } {
    const complexityPatterns = this.patterns.get('complexity');
    const pattern = complexityPatterns[complexity];

    // Base estimates
    let time = pattern.timeEstimate;
    let tokens = pattern.tokenBudget;

    // Adjust for number of agents
    const agentMultiplier = Math.max(1, agents.length * 0.5);
    time *= agentMultiplier;
    tokens *= agentMultiplier;

    return { time, tokens };
  }

  /**
   * Calculate confidence in detection
   */
  private calculateConfidence(_tool: string, args: Record<string, any>, _toolPattern: any): number {
    let confidence = 0.5; // Base confidence

    // Known tool pattern
    if (_toolPattern) confidence += 0.3;

    // Has required arguments
    if (args.target || args.wallet || args.token || args.protocol) confidence += 0.1;

    // Has network specified
    if (args.network) confidence += 0.05;

    // Has clear parameters
    if (args.depth || args.analysis || args.format) confidence += 0.05;

    return Math.min(1, confidence);
  }
}
