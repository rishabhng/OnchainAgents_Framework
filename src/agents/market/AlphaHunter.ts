import { z } from 'zod';
import { BaseAgent, AgentContext, AgentConfig } from '../base/BaseAgent';
import { HiveClient } from '../../mcp/HiveClient';

interface AlphaHunterResult {
  opportunities: Opportunity[];
  scanTime: Date;
  totalFound: number;
  filters: any;
}

interface Opportunity {
  rank: number;
  token: TokenInfo;
  momentumScore: number; // 0-10 scale
  timeSensitivity: 'hours' | 'days' | 'weeks';
  signals: MomentumSignals;
  catalysts: string[];
  riskAssessment: RiskAssessment;
  convictionLevel: number; // 0-10 scale
  recommendedAction: string;
}

interface TokenInfo {
  symbol: string;
  address: string;
  name: string;
  marketCap: number;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
}

interface MomentumSignals {
  whaleActivity: string;
  socialMentions: string;
  devActivity: string;
  tradingVolume: string;
  technicalSignal: string;
  holderGrowth: string;
}

interface RiskAssessment {
  liquidityRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  contractRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  teamRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  marketRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class AlphaHunter extends BaseAgent {
  constructor(hiveClient: HiveClient) {
    const config: AgentConfig = {
      name: 'AlphaHunter',
      description: 'Discovers early opportunities before they become mainstream',
      version: '1.0.0',
      cacheTTL: 300, // 5 minutes cache for alpha discovery
      maxRetries: 3,
      timeout: 45000,
    };
    
    super(config, hiveClient);
  }
  
  protected validateInput(context: AgentContext): z.ZodSchema {
    return z.object({
      category: z.string().optional(),
      options: z.object({
        marketCapMin: z.number().optional(),
        marketCapMax: z.number().optional(),
        minLiquidity: z.number().optional(),
        riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
        networks: z.array(z.string()).optional(),
        excludeStablecoins: z.boolean().optional(),
        socialGrowth: z.enum(['any', 'increasing', 'viral']).optional(),
        timeframe: z.enum(['1h', '4h', '24h', '7d']).optional(),
      }).optional(),
    });
  }
  
  protected async performAnalysis(context: AgentContext): Promise<AlphaHunterResult> {
    this.logger.info('Starting alpha hunting', {
      category: context.category,
      options: context.options,
    });
    
    // Scan for opportunities
    const [
      newTokens,
      trendingTokens,
      whaleActivity,
      socialSignals,
      technicalBreakouts,
    ] = await Promise.all([
      this.scanNewTokens(context),
      this.scanTrendingTokens(context),
      this.detectWhaleAccumulation(context),
      this.analyzeSocialMomentum(context),
      this.findTechnicalBreakouts(context),
    ]);
    
    // Combine and score opportunities
    const allOpportunities = this.combineOpportunities(
      newTokens,
      trendingTokens,
      whaleActivity,
      socialSignals,
      technicalBreakouts
    );
    
    // Score and rank opportunities
    const scoredOpportunities = await this.scoreOpportunities(allOpportunities, context);
    
    // Filter based on risk tolerance
    const filteredOpportunities = this.filterByRisk(scoredOpportunities, context);
    
    // Sort by momentum score
    const rankedOpportunities = filteredOpportunities
      .sort((a, b) => b.momentumScore - a.momentumScore)
      .slice(0, 10) // Top 10 opportunities
      .map((opp, index) => ({ ...opp, rank: index + 1 }));
    
    return {
      opportunities: rankedOpportunities,
      scanTime: new Date(),
      totalFound: filteredOpportunities.length,
      filters: context.options || {},
    };
  }
  
  private async scanNewTokens(context: AgentContext): Promise<any[]> {
    const response = await this.hiveClient.request('/tokens/new', {
      networks: context.options?.networks || ['ethereum', 'bsc', 'arbitrum'],
      minLiquidity: context.options?.minLiquidity || 50000,
      timeframe: context.options?.timeframe || '24h',
    });
    
    return response.data as any[];
  }
  
  private async scanTrendingTokens(context: AgentContext): Promise<any[]> {
    const response = await this.hiveClient.request('/tokens/trending', {
      category: context.category,
      marketCapMax: context.options?.marketCapMax,
      timeframe: context.options?.timeframe || '24h',
    });
    
    return response.data as any[];
  }
  
  private async detectWhaleAccumulation(context: AgentContext): Promise<any[]> {
    const response = await this.hiveClient.request('/whales/accumulation', {
      minTransaction: 100000,
      timeframe: context.options?.timeframe || '24h',
      networks: context.options?.networks,
    });
    
    return response.data as any[];
  }
  
  private async analyzeSocialMomentum(context: AgentContext): Promise<any[]> {
    const response = await this.hiveClient.request('/social/momentum', {
      growth: context.options?.socialGrowth || 'increasing',
      timeframe: context.options?.timeframe || '24h',
    });
    
    return response.data as any[];
  }
  
  private async findTechnicalBreakouts(context: AgentContext): Promise<any[]> {
    const response = await this.hiveClient.request('/technical/breakouts', {
      marketCapMax: context.options?.marketCapMax,
      minVolume: 100000,
      timeframe: context.options?.timeframe || '24h',
    });
    
    return response.data as any[];
  }
  
  private combineOpportunities(...sources: any[][]): any[] {
    const opportunityMap = new Map();
    
    for (const source of sources) {
      for (const item of source) {
        const key = item.address || item.symbol;
        if (!opportunityMap.has(key)) {
          opportunityMap.set(key, {
            ...item,
            signals: [],
            catalysts: [],
          });
        } else {
          const existing = opportunityMap.get(key);
          existing.signals.push(...(item.signals || []));
          existing.catalysts.push(...(item.catalysts || []));
        }
      }
    }
    
    return Array.from(opportunityMap.values());
  }
  
  private async scoreOpportunities(opportunities: any[], context: AgentContext): Promise<Opportunity[]> {
    const scoredOpps: Opportunity[] = [];
    
    for (const opp of opportunities) {
      // Calculate momentum score
      const momentumScore = this.calculateMomentumScore(opp);
      
      // Assess risk
      const riskAssessment = await this.assessRisk(opp);
      
      // Determine time sensitivity
      const timeSensitivity = this.determineTimeSensitivity(opp);
      
      // Calculate conviction level
      const convictionLevel = this.calculateConviction(momentumScore, riskAssessment);
      
      // Format signals
      const signals: MomentumSignals = {
        whaleActivity: this.formatWhaleSignal(opp),
        socialMentions: this.formatSocialSignal(opp),
        devActivity: this.formatDevSignal(opp),
        tradingVolume: this.formatVolumeSignal(opp),
        technicalSignal: this.formatTechnicalSignal(opp),
        holderGrowth: this.formatHolderSignal(opp),
      };
      
      // Extract catalysts
      const catalysts = this.extractCatalysts(opp);
      
      // Generate recommendation
      const recommendedAction = this.generateRecommendation(momentumScore, riskAssessment, timeSensitivity);
      
      scoredOpps.push({
        rank: 0, // Will be set later
        token: {
          symbol: opp.symbol || 'UNKNOWN',
          address: opp.address || '',
          name: opp.name || '',
          marketCap: opp.marketCap || 0,
          price: opp.price || 0,
          change24h: opp.change24h || 0,
          volume24h: opp.volume24h || 0,
          liquidity: opp.liquidity || 0,
        },
        momentumScore,
        timeSensitivity,
        signals,
        catalysts,
        riskAssessment,
        convictionLevel,
        recommendedAction,
      });
    }
    
    return scoredOpps;
  }
  
  private calculateMomentumScore(opp: any): number {
    let score = 5; // Base score
    
    // Volume increase
    if (opp.volumeChange > 200) score += 2;
    else if (opp.volumeChange > 100) score += 1;
    
    // Price momentum
    if (opp.change24h > 20) score += 1.5;
    else if (opp.change24h > 10) score += 0.5;
    
    // Social signals
    if (opp.socialGrowth > 200) score += 1.5;
    else if (opp.socialGrowth > 100) score += 0.5;
    
    // Whale accumulation
    if (opp.whaleCount > 3) score += 1;
    
    // Technical breakout
    if (opp.technicalBreakout) score += 0.5;
    
    // Developer activity
    if (opp.devActivity > 10) score += 0.5;
    
    return Math.min(10, Math.max(0, score));
  }
  
  private async assessRisk(opp: any): Promise<RiskAssessment> {
    const liquidityRisk = opp.liquidity < 100000 ? 'HIGH' : 
                          opp.liquidity < 500000 ? 'MEDIUM' : 'LOW';
    
    const contractRisk = opp.verified ? 'LOW' : 
                        opp.audited ? 'MEDIUM' : 'HIGH';
    
    const teamRisk = opp.teamDoxxed ? 'LOW' : 
                    opp.teamPartial ? 'MEDIUM' : 'HIGH';
    
    const marketRisk = opp.marketCap > 10000000 ? 'LOW' : 
                      opp.marketCap > 1000000 ? 'MEDIUM' : 'HIGH';
    
    // Calculate overall risk
    const riskScores = { LOW: 1, MEDIUM: 2, HIGH: 3 };
    const avgRiskScore = (
      riskScores[liquidityRisk] + 
      riskScores[contractRisk] + 
      riskScores[teamRisk] + 
      riskScores[marketRisk]
    ) / 4;
    
    const overallRisk = avgRiskScore <= 1.5 ? 'LOW' : 
                       avgRiskScore <= 2.5 ? 'MEDIUM' : 'HIGH';
    
    return {
      liquidityRisk,
      contractRisk,
      teamRisk,
      marketRisk,
      overallRisk,
    };
  }
  
  private determineTimeSensitivity(opp: any): 'hours' | 'days' | 'weeks' {
    if (opp.momentumVelocity > 100 || opp.viralScore > 80) {
      return 'hours';
    } else if (opp.momentumVelocity > 50 || opp.trendingScore > 70) {
      return 'days';
    }
    return 'weeks';
  }
  
  private calculateConviction(momentumScore: number, risk: RiskAssessment): number {
    let conviction = momentumScore;
    
    // Adjust for risk
    if (risk.overallRisk === 'HIGH') conviction -= 2;
    else if (risk.overallRisk === 'MEDIUM') conviction -= 1;
    
    return Math.max(0, Math.min(10, conviction));
  }
  
  private formatWhaleSignal(opp: any): string {
    if (opp.whaleCount > 3) {
      return `${opp.whaleCount} new wallets >$100K`;
    }
    return 'No significant whale activity';
  }
  
  private formatSocialSignal(opp: any): string {
    if (opp.socialGrowth > 200) {
      return `+${opp.socialGrowth}% mentions in 48h`;
    }
    return 'Normal social activity';
  }
  
  private formatDevSignal(opp: any): string {
    if (opp.devActivity > 10) {
      return `${opp.devActivity} commits this week`;
    }
    return 'Low development activity';
  }
  
  private formatVolumeSignal(opp: any): string {
    if (opp.volumeChange > 100) {
      return `+${opp.volumeChange}% vs 7-day average`;
    }
    return 'Normal trading volume';
  }
  
  private formatTechnicalSignal(opp: any): string {
    if (opp.technicalBreakout) {
      return 'Breaking key resistance';
    }
    return 'No technical signal';
  }
  
  private formatHolderSignal(opp: any): string {
    if (opp.holderGrowth > 20) {
      return `+${opp.holderGrowth}% holders in 24h`;
    }
    return 'Stable holder count';
  }
  
  private extractCatalysts(opp: any): string[] {
    const catalysts: string[] = [];
    
    if (opp.upcomingEvents) {
      catalysts.push(...opp.upcomingEvents);
    }
    
    if (opp.partnerships) {
      catalysts.push(`Partnership rumors with ${opp.partnerships}`);
    }
    
    if (opp.tokenBurn) {
      catalysts.push('Token burn mechanism activating');
    }
    
    if (opp.majorRelease) {
      catalysts.push(`${opp.majorRelease} scheduled`);
    }
    
    if (opp.influencerMentions > 5) {
      catalysts.push('Influencer endorsements increasing');
    }
    
    return catalysts;
  }
  
  private generateRecommendation(
    momentumScore: number,
    risk: RiskAssessment,
    timeSensitivity: string
  ): string {
    if (momentumScore >= 8 && risk.overallRisk === 'LOW') {
      return 'Strong buy signal - Research immediately';
    } else if (momentumScore >= 7 && risk.overallRisk !== 'HIGH') {
      return `Research deeper within ${timeSensitivity === 'hours' ? '48h' : '1 week'}`;
    } else if (momentumScore >= 6) {
      return 'Add to watchlist and monitor';
    } else if (risk.overallRisk === 'HIGH') {
      return 'High risk - Only for experienced traders';
    }
    return 'Continue monitoring for better entry';
  }
  
  private filterByRisk(opportunities: Opportunity[], context: AgentContext): Opportunity[] {
    const riskTolerance = context.options?.riskTolerance || 'medium';
    
    if (riskTolerance === 'low') {
      return opportunities.filter(opp => opp.riskAssessment.overallRisk === 'LOW');
    } else if (riskTolerance === 'medium') {
      return opportunities.filter(opp => opp.riskAssessment.overallRisk !== 'HIGH');
    }
    
    return opportunities; // High risk tolerance - return all
  }
}