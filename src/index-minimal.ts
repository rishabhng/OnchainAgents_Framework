/**
 * OnChainAgents.fun - Minimal Build for Production Testing
 * @packageDocumentation
 */

import { HiveBridge, HiveBridgeConfig } from './bridges/hive-bridge';
import { BaseAgent, AgentConfig, AgentContext, AnalysisResult } from './agents/base/BaseAgent';

// Import core agents that are already updated
import { RugDetector } from './agents/security/RugDetector';
import { AlphaHunter } from './agents/market/AlphaHunter';

export interface OnChainAgentsConfig {
  mcpServerUrl?: string;
  cacheTTL?: number;
  maxRetries?: number;
  timeout?: number;
  logLevel?: string;
  apiKey?: string;
  fallbackMode?: boolean;
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
 * Minimal OnChainAgents class - Core functionality for production testing
 */
export class OnChainAgents {
  private readonly hiveBridge: HiveBridge;
  private readonly agents: Map<string, BaseAgent>;
  private readonly config: OnChainAgentsConfig;

  constructor(config?: OnChainAgentsConfig) {
    this.config = {
      mcpServerUrl:
        config?.mcpServerUrl || process.env.HIVE_MCP_URL || 'https://hiveintelligence.xyz/mcp',
      cacheTTL: config?.cacheTTL || 3600,
      maxRetries: config?.maxRetries || 3,
      timeout: config?.timeout || 30000,
      logLevel: config?.logLevel || process.env.LOG_LEVEL || 'info',
      apiKey: config?.apiKey || process.env.HIVE_API_KEY,
      fallbackMode: config?.fallbackMode ?? process.env.HIVE_FALLBACK_MODE === 'true',
      ...config,
    };

    // Set fallback mode environment variable for the client
    if (this.config.fallbackMode) {
      process.env.HIVE_FALLBACK_MODE = 'true';
    }

    // Initialize Hive Bridge
    this.hiveBridge = new HiveBridge({
      mcpServerUrl: this.config.mcpServerUrl,
      cacheTTL: this.config.cacheTTL,
      timeout: this.config.timeout,
      logLevel: this.config.logLevel,
      apiKey: this.config.apiKey,
    });

    // Initialize agents
    this.agents = new Map();
    this.initializeAgents();
  }

  /**
   * Initialize core agents
   */
  private initializeAgents(): void {
    // Security agents
    this.agents.set('rugDetector', new RugDetector(this.hiveBridge));

    // Market intelligence agents
    this.agents.set('alphaHunter', new AlphaHunter(this.hiveBridge));
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

      const context: AgentContext = {
        options: {
          categories: options?.category ? [options.category] : undefined,
          riskTolerance: options?.risk || 'medium',
          includeDerivatives: true,
        },
      };

      const huntResults = await alphaHunter?.analyze(context);

      const huntData = huntResults?.data as any;

      const data = {
        opportunities: huntData?.opportunities || [],
        filters: options,
        recommendations: this.generateHuntRecommendations(huntResults),
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
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    return this.hiveBridge.healthCheck();
  }

  // Helper methods

  private isAddress(value: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(value);
  }

  private async runSecurityAgents(context: AgentContext): Promise<any> {
    const rugDetector = this.agents.get('rugDetector');

    const rugResults = await rugDetector?.analyze(context);

    return {
      rugDetection: rugResults,
    };
  }

  private async runMarketAgents(context: AgentContext): Promise<any> {
    const alphaHunter = this.agents.get('alphaHunter');

    const alphaResults = await alphaHunter?.analyze(context);

    return {
      opportunities: alphaResults,
    };
  }

  private generateHuntRecommendations(hunt: any): string[] {
    const recommendations: string[] = [];

    if (hunt?.data?.opportunities?.length > 0) {
      recommendations.push(`Found ${hunt.data.opportunities.length} alpha opportunities`);
    } else {
      recommendations.push('No opportunities found with current filters');
    }

    return recommendations;
  }

  private generateSummary(security: any, market: any): any {
    let score = 50; // Base score
    let verdict = 'NEUTRAL';
    const recommendations: string[] = [];

    // Adjust based on security results
    if (security?.rugDetection?.success && security.rugDetection.data) {
      const rugScore = security.rugDetection.data?.score || 0;
      if (rugScore > 70) {
        score = rugScore;
        verdict = 'SAFE';
        recommendations.push('Low security risk detected');
      } else if (rugScore < 30) {
        score = rugScore;
        verdict = 'HIGH_RISK';
        recommendations.push('High security risk - extreme caution advised');
      } else {
        score = rugScore;
        verdict = 'MODERATE';
        recommendations.push('Moderate risk - proceed with caution');
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
export { HiveBridge, HiveBridgeConfig, BaseAgent, AgentConfig, AgentContext, AnalysisResult };

// Export main class as default
export default OnChainAgents;
