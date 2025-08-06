/**
 * OnChainAgents.fun - Free, open-source crypto intelligence platform
 * @packageDocumentation
 */

import { HiveClient, HiveConfig } from './mcp/HiveClient';
import { BaseAgent, AgentConfig, AgentContext, AnalysisResult } from './agents/base/BaseAgent';

// Import all agents
import { RugDetector } from './agents/security/RugDetector';
import { RiskAnalyzer } from './agents/security/RiskAnalyzer';
import { AlphaHunter } from './agents/market/AlphaHunter';
import { WhaleTracker } from './agents/market/WhaleTracker';
import { SentimentAnalyzer } from './agents/market/SentimentAnalyzer';
import { TokenResearcher } from './agents/research/TokenResearcher';
import { DeFiAnalyzer } from './agents/research/DeFiAnalyzer';
import { PortfolioTracker } from './agents/research/PortfolioTracker';
import { CrossChainNavigator } from './agents/specialized/CrossChainNavigator';
import { MarketStructureAnalyst } from './agents/specialized/MarketStructureAnalyst';

export interface OnChainAgentsConfig {
  hiveApiKey?: string;
  hiveApiUrl?: string;
  cacheTTL?: number;
  maxRetries?: number;
  timeout?: number;
  logLevel?: string;
}

export interface CommandResult {
  success: boolean;
  command: string;
  timestamp: number;
  data: any;
  errors?: string[];
  executionTime: number;
}

/**
 * Main OnChainAgents class - Entry point for all crypto intelligence operations
 */
export class OnChainAgents {
  private readonly hiveClient: HiveClient;
  private readonly agents: Map<string, BaseAgent>;
  private readonly config: OnChainAgentsConfig;
  
  constructor(config?: OnChainAgentsConfig) {
    this.config = {
      hiveApiKey: config?.hiveApiKey || process.env.HIVE_API_KEY,
      hiveApiUrl: config?.hiveApiUrl || process.env.HIVE_API_URL,
      cacheTTL: config?.cacheTTL || 3600,
      maxRetries: config?.maxRetries || 3,
      timeout: config?.timeout || 30000,
      logLevel: config?.logLevel || process.env.LOG_LEVEL || 'info',
      ...config,
    };
    
    // Initialize Hive Client
    this.hiveClient = new HiveClient({
      apiKey: this.config.hiveApiKey,
      apiUrl: this.config.hiveApiUrl,
      cacheTTL: this.config.cacheTTL,
      timeout: this.config.timeout,
    });
    
    // Initialize agents
    this.agents = new Map();
    this.initializeAgents();
  }
  
  /**
   * Initialize all available agents
   */
  private initializeAgents(): void {
    // Security agents
    this.agents.set('rugDetector', new RugDetector(this.hiveClient));
    this.agents.set('riskAnalyzer', new RiskAnalyzer(this.hiveClient));
    
    // Market intelligence agents
    this.agents.set('alphaHunter', new AlphaHunter(this.hiveClient));
    this.agents.set('whaleTracker', new WhaleTracker(this.hiveClient));
    this.agents.set('sentimentAnalyzer', new SentimentAnalyzer(this.hiveClient));
    
    // Research agents
    this.agents.set('tokenResearcher', new TokenResearcher(this.hiveClient));
    this.agents.set('defiAnalyzer', new DeFiAnalyzer(this.hiveClient));
    this.agents.set('portfolioTracker', new PortfolioTracker(this.hiveClient));
    
    // Specialized agents
    this.agents.set('crossChainNavigator', new CrossChainNavigator(this.hiveClient));
    this.agents.set('marketStructureAnalyst', new MarketStructureAnalyst(this.hiveClient));
  }
  
  /**
   * Main analyze command - Routes to appropriate agents
   */
  public async analyze(
    target: string,
    addressOrSymbol: string,
    options?: Record<string, any>,
  ): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      // Determine network and address
      const context: AgentContext = {
        network: target,
        address: this.isAddress(addressOrSymbol) ? addressOrSymbol : undefined,
        symbol: !this.isAddress(addressOrSymbol) ? addressOrSymbol : undefined,
        options,
      };
      
      // Run security agents
      const securityResults = await this.runSecurityAgents(context);
      
      // Run market agents  
      const marketResults = await this.runMarketAgents(context);
      
      // Compile results
      const data = {
        security: securityResults,
        market: marketResults,
        summary: this.generateSummary(securityResults, marketResults),
      };
      
      return {
        success: true,
        command: 'analyze',
        timestamp: Date.now(),
        data,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        command: 'analyze',
        timestamp: Date.now(),
        data: null,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Research command - Deep token analysis
   */
  public async research(
    tokenSymbol: string,
    options?: { deep?: boolean },
  ): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      const tokenResearcher = this.agents.get('tokenResearcher');
      const defiAnalyzer = this.agents.get('defiAnalyzer');
      
      const context: AgentContext = {
        token: tokenSymbol,
        options: {
          depth: options?.deep ? 'comprehensive' : 'standard',
        },
      };
      
      const [researchResults, defiResults] = await Promise.all([
        tokenResearcher ? tokenResearcher.analyze(context) : null,
        defiAnalyzer ? defiAnalyzer.analyze(context) : null,
      ]);
      
      const data = {
        token: tokenSymbol,
        research: researchResults?.data,
        defi: defiResults?.data,
        summary: this.generateResearchSummary(researchResults, defiResults),
      };
      
      return {
        success: true,
        command: 'research',
        timestamp: Date.now(),
        data,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        command: 'research',
        timestamp: Date.now(),
        data: null,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Security command - Security-focused analysis
   */
  public async security(
    tokenAddress: string,
    options?: { network?: string },
  ): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      const context: AgentContext = {
        network: options?.network || 'ethereum',
        address: tokenAddress,
        options,
      };
      
      const results = await this.runSecurityAgents(context);
      
      return {
        success: true,
        command: 'security',
        timestamp: Date.now(),
        data: results,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        command: 'security',
        timestamp: Date.now(),
        data: null,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Hunt command - Find alpha opportunities
   */
  public async hunt(options?: {
    category?: string;
    risk?: 'low' | 'medium' | 'high';
  }): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      const alphaHunter = this.agents.get('alphaHunter');
      const marketAnalyst = this.agents.get('marketStructureAnalyst');
      
      const context: AgentContext = {
        options: {
          categories: options?.category ? [options.category] : undefined,
          riskLevel: options?.risk || 'medium',
          includeDerivatives: true,
        },
      };
      
      const [huntResults, marketResults] = await Promise.all([
        alphaHunter ? alphaHunter.analyze(context) : null,
        marketAnalyst ? marketAnalyst.analyze(context) : null,
      ]);
      
      const data = {
        opportunities: huntResults?.data?.opportunities || [],
        marketStructure: marketResults?.data,
        filters: options,
        recommendations: this.generateHuntRecommendations(huntResults, marketResults),
      };
      
      return {
        success: true,
        command: 'hunt',
        timestamp: Date.now(),
        data,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        command: 'hunt',
        timestamp: Date.now(),
        data: null,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Track command - Whale and wallet tracking
   */
  public async track(
    walletAddress: string,
    options?: { alerts?: boolean },
  ): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      const whaleTracker = this.agents.get('whaleTracker');
      const portfolioTracker = this.agents.get('portfolioTracker');
      
      const context: AgentContext = {
        address: walletAddress,
        options: {
          trackingMode: 'realtime',
          includeStaking: true,
          includeDeFi: true,
        },
      };
      
      const [whaleResults, portfolioResults] = await Promise.all([
        whaleTracker ? whaleTracker.analyze(context) : null,
        portfolioTracker ? portfolioTracker.analyze(context) : null,
      ]);
      
      const data = {
        wallet: walletAddress,
        whaleActivity: whaleResults?.data,
        portfolio: portfolioResults?.data,
        alerts: options?.alerts || false,
        insights: this.generateTrackingInsights(whaleResults, portfolioResults),
      };
      
      return {
        success: true,
        command: 'track',
        timestamp: Date.now(),
        data,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        command: 'track',
        timestamp: Date.now(),
        data: null,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Sentiment command - Social sentiment analysis
   */
  public async sentiment(
    token: string,
    options?: { sources?: string },
  ): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      const sentimentAnalyzer = this.agents.get('sentimentAnalyzer');
      
      const context: AgentContext = {
        token,
        options: {
          sources: options?.sources ? options.sources.split(',') : ['twitter', 'telegram', 'discord', 'reddit'],
          depth: 'comprehensive',
        },
      };
      
      const sentimentResults = await sentimentAnalyzer?.analyze(context);
      
      const data = {
        token,
        sentiment: sentimentResults?.data?.overallSentiment || 'neutral',
        score: sentimentResults?.data?.sentimentScore || 0,
        sources: options?.sources || 'all',
        analysis: sentimentResults?.data,
      };
      
      return {
        success: true,
        command: 'sentiment',
        timestamp: Date.now(),
        data,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        command: 'sentiment',
        timestamp: Date.now(),
        data: null,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Get a specific agent
   */
  public getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }
  
  /**
   * List all available agents
   */
  public listAgents(): string[] {
    return Array.from(this.agents.keys());
  }
  
  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    return this.hiveClient.healthCheck();
  }
  
  // Helper methods
  
  private isAddress(value: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(value);
  }
  
  private async runSecurityAgents(context: AgentContext): Promise<any> {
    const rugDetector = this.agents.get('rugDetector');
    const riskAnalyzer = this.agents.get('riskAnalyzer');
    
    const [rugResults, riskResults] = await Promise.all([
      rugDetector ? rugDetector.analyze(context) : null,
      riskAnalyzer ? riskAnalyzer.analyze(context) : null,
    ]);
    
    return {
      rugDetection: rugResults,
      riskAnalysis: riskResults,
    };
  }
  
  private async runMarketAgents(context: AgentContext): Promise<any> {
    const alphaHunter = this.agents.get('alphaHunter');
    const sentimentAnalyzer = this.agents.get('sentimentAnalyzer');
    
    const [alphaResults, sentimentResults] = await Promise.all([
      alphaHunter ? alphaHunter.analyze(context) : null,
      sentimentAnalyzer ? sentimentAnalyzer.analyze(context) : null,
    ]);
    
    return {
      opportunities: alphaResults,
      sentiment: sentimentResults,
    };
  }
  
  private generateResearchSummary(research: any, defi: any): any {
    const recommendations: string[] = [];
    let verdict = 'NEUTRAL';
    
    if (research?.data?.investmentThesis?.conviction) {
      verdict = research.data.investmentThesis.conviction;
    }
    
    if (defi?.data?.opportunities?.length > 0) {
      recommendations.push(`${defi.data.opportunities.length} DeFi opportunities identified`);
    }
    
    return {
      verdict,
      recommendations,
      researchScore: research?.data?.researchScore || 0,
      defiScore: defi?.data?.overallScore || 0,
    };
  }
  
  private generateHuntRecommendations(hunt: any, market: any): string[] {
    const recommendations: string[] = [];
    
    if (hunt?.data?.opportunities?.length > 0) {
      recommendations.push(`Found ${hunt.data.opportunities.length} alpha opportunities`);
    }
    
    if (market?.data?.tradingSignals?.length > 0) {
      recommendations.push(`${market.data.tradingSignals.length} trading signals detected`);
    }
    
    return recommendations;
  }
  
  private generateTrackingInsights(whale: any, portfolio: any): any {
    const insights: string[] = [];
    
    if (whale?.data?.isWhale) {
      insights.push('This is a whale wallet');
    }
    
    if (portfolio?.data?.portfolio?.totalValue > 1000000) {
      insights.push('Portfolio value exceeds $1M');
    }
    
    if (whale?.data?.recentMoves?.length > 0) {
      insights.push(`${whale.data.recentMoves.length} recent significant moves`);
    }
    
    return {
      insights,
      whaleStatus: whale?.data?.isWhale || false,
      portfolioValue: portfolio?.data?.portfolio?.totalValue || 0,
    };
  }
  
  private generateSummary(security: any, market: any): any {
    let score = 50; // Base score
    let verdict = 'NEUTRAL';
    const recommendations: string[] = [];
    
    // Adjust based on security results
    if (security?.rugDetection?.success) {
      const rugScore = security.rugDetection.data?.riskScore || 0;
      if (rugScore > 70) {
        score -= 30;
        verdict = 'HIGH_RISK';
        recommendations.push('High rug risk detected - extreme caution advised');
      } else if (rugScore > 40) {
        score -= 15;
        recommendations.push('Moderate rug risk - proceed with caution');
      }
    }
    
    // Adjust based on market results
    if (market?.sentiment?.success) {
      const sentimentScore = market.sentiment.data?.sentimentScore || 0;
      if (sentimentScore > 0.7) {
        score += 15;
        recommendations.push('Positive market sentiment detected');
      } else if (sentimentScore < 0.3) {
        score -= 10;
        recommendations.push('Negative sentiment - monitor closely');
      }
    }
    
    // Final verdict
    if (score >= 70) verdict = 'SAFE';
    else if (score >= 50) verdict = 'MODERATE';
    else if (score >= 30) verdict = 'RISKY';
    else verdict = 'HIGH_RISK';
    
    return {
      verdict,
      score,
      recommendations,
    };
  }
}

// Export types and interfaces
export {
  HiveClient,
  HiveConfig,
  BaseAgent,
  AgentConfig,
  AgentContext,
  AnalysisResult,
};

// Export main class as default
export default OnChainAgents;