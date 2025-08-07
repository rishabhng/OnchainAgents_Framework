/**
 * Router for OnChainAgents
 * Determines execution strategy and agent coordination
 * Inspired by SuperClaude's routing patterns
 */

import { DetectionResult } from './detector';

export interface RouteResult {
  agents: string[];
  parallel: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
  strategy: 'simple' | 'parallel' | 'sequential' | 'hybrid';
  fallbacks: string[];
  cacheEnabled: boolean;
  requiresValidation: boolean;
}

export class Router {
  private routingTable: Map<string, any>;

  constructor() {
    this.routingTable = new Map();
    this.initializeRoutingTable();
  }

  /**
   * Initialize crypto-specific routing rules
   */
  private initializeRoutingTable(): void {
    // Tool-specific routing
    this.routingTable.set('tools', {
      oca_analyze: {
        strategy: 'parallel',
        priority: 'normal',
        cacheEnabled: true,
        requiresValidation: true,
      },
      oca_security: {
        strategy: 'simple',
        priority: 'high',
        cacheEnabled: true,
        requiresValidation: true,
      },
      oca_hunt: {
        strategy: 'parallel',
        priority: 'normal',
        cacheEnabled: false, // Always fresh data for alpha
        requiresValidation: false,
      },
      oca_track: {
        strategy: 'sequential',
        priority: 'normal',
        cacheEnabled: false, // Real-time tracking
        requiresValidation: false,
      },
      oca_sentiment: {
        strategy: 'simple',
        priority: 'low',
        cacheEnabled: true,
        requiresValidation: false,
      },
      oca_research: {
        strategy: 'hybrid',
        priority: 'normal',
        cacheEnabled: true,
        requiresValidation: true,
      },
      oca_defi: {
        strategy: 'parallel',
        priority: 'normal',
        cacheEnabled: true,
        requiresValidation: true,
      },
      oca_bridge: {
        strategy: 'simple',
        priority: 'high',
        cacheEnabled: false, // Real-time rates
        requiresValidation: true,
      },
      oca_portfolio: {
        strategy: 'parallel',
        priority: 'normal',
        cacheEnabled: true,
        requiresValidation: false,
      },
      oca_market: {
        strategy: 'hybrid',
        priority: 'normal',
        cacheEnabled: true,
        requiresValidation: false,
      },
    });

    // Agent dependencies
    this.routingTable.set('dependencies', {
      alphaHunter: ['marketAnalyzer', 'sentimentAnalyzer'],
      tokenResearcher: ['rugDetector', 'marketAnalyzer'],
      defiAnalyzer: ['rugDetector', 'liquidityAnalyzer'],
      portfolioTracker: ['priceOracle', 'historyAnalyzer'],
    });

    // Fallback strategies
    this.routingTable.set('fallbacks', {
      rugDetector: ['basicSecurityCheck'],
      alphaHunter: ['trendingTokens'],
      whaleTracker: ['largeTransactions'],
      sentimentAnalyzer: ['socialMentions'],
      tokenResearcher: ['basicInfo'],
    });
  }

  /**
   * Determine optimal execution route
   */
  public async determineRoute(context: DetectionResult): Promise<RouteResult> {
    const toolRouting = this.routingTable.get('tools')[context.tool] || {};
    const dependencies = this.routingTable.get('dependencies');
    const fallbacks = this.routingTable.get('fallbacks');

    // Determine execution strategy
    const strategy = this.determineStrategy(context, toolRouting);

    // Determine agent order
    const agents = this.orderAgents(context.agents, dependencies, strategy);

    // Determine fallbacks
    const agentFallbacks = this.determineFallbacks(agents, fallbacks);

    // Determine priority
    const priority = this.determinePriority(context, toolRouting);

    // Check if parallel execution is possible
    const parallel = this.canExecuteInParallel(agents, dependencies, strategy);

    return {
      agents,
      parallel,
      priority,
      strategy,
      fallbacks: agentFallbacks,
      cacheEnabled: toolRouting.cacheEnabled ?? true,
      requiresValidation: toolRouting.requiresValidation ?? false,
    };
  }

  /**
   * Determine execution strategy based on context
   */
  private determineStrategy(
    context: DetectionResult,
    toolRouting: any,
  ): 'simple' | 'parallel' | 'sequential' | 'hybrid' {
    // Use tool-specific strategy if defined
    if (toolRouting.strategy) {
      return toolRouting.strategy;
    }

    // Determine based on complexity and agent count
    if (context.agents.length === 1) {
      return 'simple';
    }

    if (context.complexity === 'simple') {
      return 'parallel';
    }

    if (context.complexity === 'complex') {
      return 'hybrid'; // Mix of parallel and sequential
    }

    return 'sequential';
  }

  /**
   * Order agents based on dependencies
   */
  private orderAgents(agents: string[], dependencies: any, strategy: string): string[] {
    if (strategy === 'simple' || agents.length <= 1) {
      return agents;
    }

    // Build dependency graph
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    for (const agent of agents) {
      graph.set(agent, []);
      inDegree.set(agent, 0);
    }

    // Add dependencies
    for (const agent of agents) {
      const deps = dependencies[agent] || [];
      for (const dep of deps) {
        if (agents.includes(dep)) {
          graph.get(dep)?.push(agent);
          inDegree.set(agent, (inDegree.get(agent) || 0) + 1);
        }
      }
    }

    // Topological sort
    const queue: string[] = [];
    const ordered: string[] = [];

    // Find agents with no dependencies
    for (const [agent, degree] of inDegree) {
      if (degree === 0) {
        queue.push(agent);
      }
    }

    while (queue.length > 0) {
      const agent = queue.shift()!;
      ordered.push(agent);

      const dependents = graph.get(agent) || [];
      for (const dependent of dependents) {
        const newDegree = (inDegree.get(dependent) || 0) - 1;
        inDegree.set(dependent, newDegree);

        if (newDegree === 0) {
          queue.push(dependent);
        }
      }
    }

    // Add any remaining agents (cycles)
    for (const agent of agents) {
      if (!ordered.includes(agent)) {
        ordered.push(agent);
      }
    }

    return ordered;
  }

  /**
   * Determine fallback agents
   */
  private determineFallbacks(agents: string[], fallbacks: any): string[] {
    const fallbackAgents: string[] = [];

    for (const agent of agents) {
      const agentFallbacks = fallbacks[agent] || [];
      for (const fallback of agentFallbacks) {
        if (!fallbackAgents.includes(fallback)) {
          fallbackAgents.push(fallback);
        }
      }
    }

    return fallbackAgents;
  }

  /**
   * Determine execution priority
   */
  private determinePriority(
    context: DetectionResult,
    toolRouting: any,
  ): 'low' | 'normal' | 'high' | 'critical' {
    // Use tool-specific priority if defined
    if (toolRouting.priority) {
      return toolRouting.priority;
    }

    // Determine based on context
    if (context.tool.includes('security') || context.tool.includes('bridge')) {
      return 'high';
    }

    if (context.complexity === 'complex') {
      return 'normal';
    }

    if (context.estimatedTime > 30000) {
      return 'low';
    }

    return 'normal';
  }

  /**
   * Check if agents can execute in parallel
   */
  private canExecuteInParallel(agents: string[], dependencies: any, strategy: string): boolean {
    if (strategy === 'simple' || strategy === 'sequential') {
      return false;
    }

    if (strategy === 'parallel') {
      return true;
    }

    // For hybrid strategy, check dependencies
    for (const agent of agents) {
      const deps = dependencies[agent] || [];
      for (const dep of deps) {
        if (agents.includes(dep)) {
          return false; // Has dependencies, can't fully parallelize
        }
      }
    }

    return true;
  }
}
