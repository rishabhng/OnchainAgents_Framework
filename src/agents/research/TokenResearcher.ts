import { z } from 'zod';
import { BaseAgent, AgentContext, AgentConfig } from '../base/BaseAgent';
import { HiveClient } from '../../mcp/HiveClient';

interface TokenResearcherResult {
  researchScore: number; // 0-100
  investmentThesis: InvestmentThesis;
  fundamentals: FundamentalAnalysis;
  tokenomics: TokenomicsAnalysis;
  teamAssessment: TeamAssessment;
  competitivePosition: CompetitiveAnalysis;
  risksOpportunities: RiskOpportunity[];
  priceTargets: PriceTargets;
  researchTime: Date;
}

interface InvestmentThesis {
  summary: string;
  bullCase: string[];
  bearCase: string[];
  conviction: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  timeHorizon: string;
  confidence: number;
}

interface FundamentalAnalysis {
  category: string;
  marketCap: number;
  tvl?: number;
  dailyActiveUsers?: number;
  transactions24h: number;
  revenue?: number;
  protocolMetrics: Map<string, any>;
  growthMetrics: GrowthMetrics;
}

interface GrowthMetrics {
  tvlGrowth?: number;
  userGrowth?: number;
  transactionGrowth?: number;
  revenueGrowth?: number;
  developerActivity: number;
  ecosystemSize: number;
}

interface TokenomicsAnalysis {
  totalSupply: number;
  circulatingSupply: number;
  circulatingPercent: number;
  unlockSchedule: UnlockEvent[];
  utility: string[];
  inflationRate?: number;
  tokenomicsScore: number;
  sustainability: 'SUSTAINABLE' | 'MODERATE' | 'UNSUSTAINABLE';
}

interface UnlockEvent {
  date: Date;
  amount: number;
  percentage: number;
  recipient: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface TeamAssessment {
  founders: TeamMember[];
  keyMembers: TeamMember[];
  transparency: 'HIGH' | 'MEDIUM' | 'LOW';
  trackRecord: string;
  teamScore: number;
  advisors?: TeamMember[];
  funding?: FundingRound[];
}

interface TeamMember {
  name: string;
  role: string;
  background: string;
  credibility: number;
  socialPresence?: string;
}

interface FundingRound {
  round: string;
  amount: number;
  valuation?: number;
  investors: string[];
  date: Date;
}

interface CompetitiveAnalysis {
  marketShare: number;
  competitors: Competitor[];
  advantages: string[];
  differentiators: string[];
  challenges: string[];
  competitiveScore: number;
  marketPosition: 'LEADER' | 'CHALLENGER' | 'FOLLOWER' | 'NICHE';
}

interface Competitor {
  name: string;
  marketCap: number;
  marketShare: number;
  strengths: string[];
  comparison: string;
}

interface RiskOpportunity {
  type: 'RISK' | 'OPPORTUNITY';
  category: 'TECHNICAL' | 'REGULATORY' | 'COMPETITION' | 'MARKET' | 'TEAM' | 'TOKENOMICS';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  probability: number;
  timeframe: string;
}

interface PriceTargets {
  current: number;
  bearCase: number;
  baseCase: number;
  bullCase: number;
  methodology: string;
  catalysts: string[];
  timeframe: string;
}

export class TokenResearcher extends BaseAgent {
  constructor(hiveClient: HiveClient) {
    const config: AgentConfig = {
      name: 'TokenResearcher',
      description: 'Automates comprehensive fundamental analysis',
      version: '1.0.0',
      cacheTTL: 1800, // 30 minutes cache for research data
      maxRetries: 3,
      timeout: 60000, // 60 seconds for deep research
    };
    
    super(config, hiveClient);
  }
  
  protected validateInput(context: AgentContext): z.ZodSchema {
    return z.object({
      token: z.string(),
      options: z.object({
        depth: z.enum(['quick', 'standard', 'comprehensive']).optional(),
        includePrice: z.boolean().optional(),
        compareWith: z.array(z.string()).optional(),
        focusAreas: z.array(z.string()).optional(),
        timeframe: z.enum(['short', 'medium', 'long']).optional(),
      }).optional(),
    });
  }
  
  protected async performAnalysis(context: AgentContext): Promise<TokenResearcherResult> {
    this.logger.info('Starting token research', {
      token: context.token,
      depth: context.options?.depth || 'standard',
    });
    
    // Parallel data collection
    const [
      tokenData,
      marketData,
      onChainData,
      socialData,
      developerData,
      competitorData,
      historicalData,
    ] = await Promise.all([
      this.getTokenData(context),
      this.getMarketData(context),
      this.getOnChainData(context),
      this.getSocialData(context),
      this.getDeveloperData(context),
      this.getCompetitorData(context),
      this.getHistoricalData(context),
    ]);
    
    // Analyze fundamentals
    const fundamentals = this.analyzeFundamentals(
      tokenData,
      marketData,
      onChainData,
      developerData
    );
    
    // Analyze tokenomics
    const tokenomics = this.analyzeTokenomics(tokenData, marketData);
    
    // Assess team
    const teamAssessment = this.assessTeam(tokenData, socialData);
    
    // Analyze competitive position
    const competitivePosition = this.analyzeCompetition(
      tokenData,
      marketData,
      competitorData
    );
    
    // Identify risks and opportunities
    const risksOpportunities = this.identifyRisksOpportunities(
      fundamentals,
      tokenomics,
      teamAssessment,
      competitivePosition,
      marketData
    );
    
    // Generate price targets
    const priceTargets = context.options?.includePrice !== false
      ? this.generatePriceTargets(
          fundamentals,
          tokenomics,
          competitivePosition,
          marketData,
          historicalData
        )
      : this.getDefaultPriceTargets(marketData);
    
    // Generate investment thesis
    const investmentThesis = this.generateInvestmentThesis(
      fundamentals,
      tokenomics,
      teamAssessment,
      competitivePosition,
      risksOpportunities,
      priceTargets
    );
    
    // Calculate research score
    const researchScore = this.calculateResearchScore(
      fundamentals,
      tokenomics,
      teamAssessment,
      competitivePosition
    );
    
    return {
      researchScore,
      investmentThesis,
      fundamentals,
      tokenomics,
      teamAssessment,
      competitivePosition,
      risksOpportunities,
      priceTargets,
      researchTime: new Date(),
    };
  }
  
  private async getTokenData(context: AgentContext): Promise<any> {
    const response = await this.hiveClient.request('/token/metadata', {
      token: context.token,
      includeAll: true,
    });
    
    return response.data;
  }
  
  private async getMarketData(context: AgentContext): Promise<any> {
    const response = await this.hiveClient.request('/market/data', {
      token: context.token,
      metrics: ['price', 'volume', 'marketCap', 'volatility'],
      timeframe: '90d',
    });
    
    return response.data;
  }
  
  private async getOnChainData(context: AgentContext): Promise<any> {
    const response = await this.hiveClient.request('/onchain/metrics', {
      token: context.token,
      metrics: ['tvl', 'holders', 'transactions', 'activeUsers'],
      timeframe: '90d',
    });
    
    return response.data;
  }
  
  private async getSocialData(context: AgentContext): Promise<any> {
    const response = await this.hiveClient.request('/social/metrics', {
      token: context.token,
      platforms: ['twitter', 'telegram', 'discord', 'github'],
      includeTeam: true,
    });
    
    return response.data;
  }
  
  private async getDeveloperData(context: AgentContext): Promise<any> {
    const response = await this.hiveClient.request('/developer/activity', {
      token: context.token,
      metrics: ['commits', 'contributors', 'stars', 'forks'],
      timeframe: '90d',
    });
    
    return response.data;
  }
  
  private async getCompetitorData(context: AgentContext): Promise<any> {
    const compareWith = context.options?.compareWith || [];
    
    if (compareWith.length === 0) {
      // Auto-detect competitors
      const response = await this.hiveClient.request('/market/similar', {
        token: context.token,
        limit: 5,
      });
      
      return response.data;
    }
    
    // Get specific competitor data
    const competitors = await Promise.all(
      compareWith.map(comp => 
        this.hiveClient.request('/token/metadata', { token: comp })
      )
    );
    
    return competitors.map(c => c.data);
  }
  
  private async getHistoricalData(context: AgentContext): Promise<any> {
    const response = await this.hiveClient.request('/market/historical', {
      token: context.token,
      metrics: ['price', 'volume', 'marketCap'],
      timeframe: '365d',
    });
    
    return response.data;
  }
  
  private analyzeFundamentals(
    tokenData: any,
    marketData: any,
    onChainData: any,
    developerData: any
  ): FundamentalAnalysis {
    const protocolMetrics = new Map<string, any>();
    
    // Add relevant protocol metrics
    if (onChainData.tvl) protocolMetrics.set('TVL', onChainData.tvl);
    if (onChainData.revenue) protocolMetrics.set('Revenue', onChainData.revenue);
    if (onChainData.fees) protocolMetrics.set('Fees', onChainData.fees);
    
    const growthMetrics: GrowthMetrics = {
      tvlGrowth: onChainData.tvlGrowth || 0,
      userGrowth: onChainData.userGrowth || 0,
      transactionGrowth: onChainData.transactionGrowth || 0,
      revenueGrowth: onChainData.revenueGrowth || 0,
      developerActivity: this.calculateDeveloperActivity(developerData),
      ecosystemSize: this.calculateEcosystemSize(tokenData, onChainData),
    };
    
    return {
      category: tokenData.category || 'Unknown',
      marketCap: marketData.marketCap || 0,
      tvl: onChainData.tvl,
      dailyActiveUsers: onChainData.activeUsers,
      transactions24h: onChainData.transactions24h || 0,
      revenue: onChainData.revenue,
      protocolMetrics,
      growthMetrics,
    };
  }
  
  private calculateDeveloperActivity(developerData: any): number {
    const commits = developerData.commits || 0;
    const contributors = developerData.contributors || 0;
    const stars = developerData.stars || 0;
    
    // Normalize and weight metrics
    const commitScore = Math.min(100, commits / 10);
    const contributorScore = Math.min(100, contributors * 5);
    const starScore = Math.min(100, stars / 100);
    
    return (commitScore * 0.4 + contributorScore * 0.4 + starScore * 0.2);
  }
  
  private calculateEcosystemSize(tokenData: any, onChainData: any): number {
    const holders = onChainData.holders || 0;
    const protocols = tokenData.integratedProtocols?.length || 0;
    const partnerships = tokenData.partnerships?.length || 0;
    
    return holders + (protocols * 1000) + (partnerships * 5000);
  }
  
  private analyzeTokenomics(tokenData: any, marketData: any): TokenomicsAnalysis {
    const totalSupply = tokenData.totalSupply || 0;
    const circulatingSupply = tokenData.circulatingSupply || 0;
    const circulatingPercent = (circulatingSupply / totalSupply) * 100;
    
    // Parse unlock schedule
    const unlockSchedule = this.parseUnlockSchedule(tokenData.unlockSchedule || []);
    
    // Calculate tokenomics score
    const tokenomicsScore = this.calculateTokenomicsScore(
      circulatingPercent,
      unlockSchedule,
      tokenData.utility || []
    );
    
    // Determine sustainability
    const sustainability = this.determineSustainability(
      tokenomicsScore,
      tokenData.inflationRate,
      tokenData.burnMechanism
    );
    
    return {
      totalSupply,
      circulatingSupply,
      circulatingPercent,
      unlockSchedule,
      utility: tokenData.utility || [],
      inflationRate: tokenData.inflationRate,
      tokenomicsScore,
      sustainability,
    };
  }
  
  private parseUnlockSchedule(schedule: any[]): UnlockEvent[] {
    return schedule.map(event => ({
      date: new Date(event.date),
      amount: event.amount || 0,
      percentage: event.percentage || 0,
      recipient: event.recipient || 'Unknown',
      impact: this.assessUnlockImpact(event),
    }));
  }
  
  private assessUnlockImpact(event: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    const percentage = event.percentage || 0;
    if (percentage > 10) return 'HIGH';
    if (percentage > 5) return 'MEDIUM';
    return 'LOW';
  }
  
  private calculateTokenomicsScore(
    circulatingPercent: number,
    unlocks: UnlockEvent[],
    utility: string[]
  ): number {
    let score = 50; // Base score
    
    // Circulation score
    if (circulatingPercent > 70) score += 20;
    else if (circulatingPercent > 50) score += 10;
    else score -= 10;
    
    // Unlock risk
    const highImpactUnlocks = unlocks.filter(u => u.impact === 'HIGH').length;
    score -= highImpactUnlocks * 5;
    
    // Utility score
    score += Math.min(30, utility.length * 10);
    
    return Math.max(0, Math.min(100, score));
  }
  
  private determineSustainability(
    tokenomicsScore: number,
    inflationRate?: number,
    hasBurnMechanism?: boolean
  ): 'SUSTAINABLE' | 'MODERATE' | 'UNSUSTAINABLE' {
    if (tokenomicsScore > 70 && (!inflationRate || inflationRate < 5)) {
      return 'SUSTAINABLE';
    }
    if (tokenomicsScore < 40 || (inflationRate && inflationRate > 20)) {
      return 'UNSUSTAINABLE';
    }
    return 'MODERATE';
  }
  
  private assessTeam(tokenData: any, socialData: any): TeamAssessment {
    const founders = this.parseTeamMembers(tokenData.founders || []);
    const keyMembers = this.parseTeamMembers(tokenData.team || []);
    const advisors = this.parseTeamMembers(tokenData.advisors || []);
    
    const transparency = this.assessTransparency(founders, keyMembers, socialData);
    const trackRecord = this.assessTrackRecord(founders, keyMembers);
    const teamScore = this.calculateTeamScore(founders, keyMembers, transparency);
    
    const funding = this.parseFundingRounds(tokenData.funding || []);
    
    return {
      founders,
      keyMembers,
      transparency,
      trackRecord,
      teamScore,
      advisors: advisors.length > 0 ? advisors : undefined,
      funding: funding.length > 0 ? funding : undefined,
    };
  }
  
  private parseTeamMembers(members: any[]): TeamMember[] {
    return members.map(member => ({
      name: member.name || 'Unknown',
      role: member.role || 'Team Member',
      background: member.background || 'Not disclosed',
      credibility: this.assessCredibility(member),
      socialPresence: member.twitter || member.linkedin,
    }));
  }
  
  private assessCredibility(member: any): number {
    let score = 50; // Base score
    
    if (member.previousProjects) score += 20;
    if (member.education) score += 10;
    if (member.twitter || member.linkedin) score += 10;
    if (member.doxxed) score += 10;
    
    return Math.min(100, score);
  }
  
  private assessTransparency(
    founders: TeamMember[],
    team: TeamMember[],
    socialData: any
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    const doxxedFounders = founders.filter(f => f.credibility > 70).length;
    const teamSize = founders.length + team.length;
    const socialActivity = socialData.teamActivity || 0;
    
    if (doxxedFounders === founders.length && socialActivity > 80) {
      return 'HIGH';
    }
    if (doxxedFounders > 0 || socialActivity > 50) {
      return 'MEDIUM';
    }
    return 'LOW';
  }
  
  private assessTrackRecord(founders: TeamMember[], team: TeamMember[]): string {
    const allMembers = [...founders, ...team];
    const experiencedMembers = allMembers.filter(m => m.credibility > 70).length;
    
    if (experiencedMembers > allMembers.length * 0.7) {
      return 'Strong track record with proven industry experience';
    }
    if (experiencedMembers > allMembers.length * 0.3) {
      return 'Mixed track record with some experienced members';
    }
    return 'Limited track record or new team';
  }
  
  private calculateTeamScore(
    founders: TeamMember[],
    team: TeamMember[],
    transparency: string
  ): number {
    const avgFounderCredibility = 
      founders.reduce((sum, f) => sum + f.credibility, 0) / (founders.length || 1);
    const avgTeamCredibility = 
      team.reduce((sum, t) => sum + t.credibility, 0) / (team.length || 1);
    
    let score = (avgFounderCredibility * 0.6 + avgTeamCredibility * 0.4);
    
    // Transparency bonus
    if (transparency === 'HIGH') score += 10;
    else if (transparency === 'LOW') score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private parseFundingRounds(funding: any[]): FundingRound[] {
    return funding.map(round => ({
      round: round.type || 'Unknown',
      amount: round.amount || 0,
      valuation: round.valuation,
      investors: round.investors || [],
      date: new Date(round.date),
    }));
  }
  
  private analyzeCompetition(
    tokenData: any,
    marketData: any,
    competitorData: any[]
  ): CompetitiveAnalysis {
    const totalMarketCap = competitorData.reduce((sum, c) => sum + (c.marketCap || 0), 0) + marketData.marketCap;
    const marketShare = (marketData.marketCap / totalMarketCap) * 100;
    
    const competitors = competitorData.map(comp => this.analyzeCompetitor(comp, tokenData));
    const advantages = this.identifyAdvantages(tokenData, competitorData);
    const differentiators = this.identifyDifferentiators(tokenData, competitorData);
    const challenges = this.identifyChallenges(tokenData, competitorData);
    
    const competitiveScore = this.calculateCompetitiveScore(
      marketShare,
      advantages,
      differentiators,
      challenges
    );
    
    const marketPosition = this.determineMarketPosition(marketShare, competitiveScore);
    
    return {
      marketShare,
      competitors,
      advantages,
      differentiators,
      challenges,
      competitiveScore,
      marketPosition,
    };
  }
  
  private analyzeCompetitor(comp: any, tokenData: any): Competitor {
    return {
      name: comp.name || 'Unknown',
      marketCap: comp.marketCap || 0,
      marketShare: 0, // Will be calculated separately
      strengths: comp.strengths || [],
      comparison: this.compareWithToken(comp, tokenData),
    };
  }
  
  private compareWithToken(comp: any, tokenData: any): string {
    // Simple comparison logic
    if (comp.marketCap > tokenData.marketCap * 2) {
      return 'Significantly larger competitor';
    }
    if (comp.marketCap > tokenData.marketCap) {
      return 'Larger competitor';
    }
    if (comp.marketCap < tokenData.marketCap * 0.5) {
      return 'Smaller competitor';
    }
    return 'Similar-sized competitor';
  }
  
  private identifyAdvantages(tokenData: any, competitors: any[]): string[] {
    const advantages: string[] = [];
    
    // Technology advantages
    if (tokenData.technology?.unique) {
      advantages.push(tokenData.technology.unique);
    }
    
    // First mover advantage
    if (tokenData.launchDate && competitors.every(c => 
      new Date(c.launchDate) > new Date(tokenData.launchDate)
    )) {
      advantages.push('First mover advantage');
    }
    
    // Team advantages
    if (tokenData.teamScore > 80) {
      advantages.push('Strong and experienced team');
    }
    
    return advantages;
  }
  
  private identifyDifferentiators(tokenData: any, competitors: any[]): string[] {
    const differentiators: string[] = [];
    
    // Feature differentiators
    if (tokenData.uniqueFeatures) {
      differentiators.push(...tokenData.uniqueFeatures);
    }
    
    // Market approach
    if (tokenData.marketApproach) {
      differentiators.push(tokenData.marketApproach);
    }
    
    return differentiators;
  }
  
  private identifyChallenges(tokenData: any, competitors: any[]): string[] {
    const challenges: string[] = [];
    
    // Market share challenge
    const largerCompetitors = competitors.filter(c => c.marketCap > tokenData.marketCap);
    if (largerCompetitors.length > 2) {
      challenges.push('Multiple larger competitors');
    }
    
    // Technology challenges
    if (!tokenData.technology?.unique) {
      challenges.push('No clear technical differentiation');
    }
    
    // Adoption challenges
    if (tokenData.userGrowth < 10) {
      challenges.push('Slow user adoption');
    }
    
    return challenges;
  }
  
  private calculateCompetitiveScore(
    marketShare: number,
    advantages: string[],
    differentiators: string[],
    challenges: string[]
  ): number {
    let score = 50; // Base score
    
    // Market share impact
    score += Math.min(20, marketShare);
    
    // Advantages and differentiators
    score += advantages.length * 5;
    score += differentiators.length * 5;
    
    // Challenges reduce score
    score -= challenges.length * 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private determineMarketPosition(
    marketShare: number,
    competitiveScore: number
  ): 'LEADER' | 'CHALLENGER' | 'FOLLOWER' | 'NICHE' {
    if (marketShare > 30 && competitiveScore > 70) return 'LEADER';
    if (marketShare > 15 || competitiveScore > 60) return 'CHALLENGER';
    if (marketShare > 5) return 'FOLLOWER';
    return 'NICHE';
  }
  
  private identifyRisksOpportunities(
    fundamentals: FundamentalAnalysis,
    tokenomics: TokenomicsAnalysis,
    team: TeamAssessment,
    competitive: CompetitiveAnalysis,
    marketData: any
  ): RiskOpportunity[] {
    const items: RiskOpportunity[] = [];
    
    // Tokenomics risks
    if (tokenomics.circulatingPercent < 30) {
      items.push({
        type: 'RISK',
        category: 'TOKENOMICS',
        description: 'Low circulation may lead to dump on unlocks',
        severity: 'HIGH',
        probability: 0.7,
        timeframe: '6 months',
      });
    }
    
    // Team risks
    if (team.transparency === 'LOW') {
      items.push({
        type: 'RISK',
        category: 'TEAM',
        description: 'Anonymous team increases rug risk',
        severity: 'HIGH',
        probability: 0.3,
        timeframe: 'Ongoing',
      });
    }
    
    // Competition risks
    if (competitive.marketPosition === 'FOLLOWER' || competitive.marketPosition === 'NICHE') {
      items.push({
        type: 'RISK',
        category: 'COMPETITION',
        description: 'May struggle to gain market share',
        severity: 'MEDIUM',
        probability: 0.6,
        timeframe: '12 months',
      });
    }
    
    // Growth opportunities
    if (fundamentals.growthMetrics.userGrowth > 50) {
      items.push({
        type: 'OPPORTUNITY',
        category: 'MARKET',
        description: 'Rapid user growth indicates strong demand',
        severity: 'HIGH',
        probability: 0.8,
        timeframe: '3-6 months',
      });
    }
    
    // Technical opportunities
    if (fundamentals.growthMetrics.developerActivity > 80) {
      items.push({
        type: 'OPPORTUNITY',
        category: 'TECHNICAL',
        description: 'High developer activity suggests innovation',
        severity: 'MEDIUM',
        probability: 0.7,
        timeframe: '6-12 months',
      });
    }
    
    return items;
  }
  
  private generatePriceTargets(
    fundamentals: FundamentalAnalysis,
    tokenomics: TokenomicsAnalysis,
    competitive: CompetitiveAnalysis,
    marketData: any,
    historicalData: any
  ): PriceTargets {
    const current = marketData.price || 0;
    
    // Calculate targets based on multiple factors
    const bearMultiple = this.calculateBearMultiple(fundamentals, tokenomics, competitive);
    const baseMultiple = this.calculateBaseMultiple(fundamentals, tokenomics, competitive);
    const bullMultiple = this.calculateBullMultiple(fundamentals, tokenomics, competitive);
    
    const catalysts = this.identifyCatalysts(fundamentals, tokenomics, competitive);
    
    return {
      current,
      bearCase: current * bearMultiple,
      baseCase: current * baseMultiple,
      bullCase: current * bullMultiple,
      methodology: 'Multiple-based valuation with fundamental analysis',
      catalysts,
      timeframe: this.determineTimeframe(context.options?.timeframe),
    };
  }
  
  private calculateBearMultiple(
    fundamentals: FundamentalAnalysis,
    tokenomics: TokenomicsAnalysis,
    competitive: CompetitiveAnalysis
  ): number {
    let multiple = 0.7; // Base bear case
    
    if (tokenomics.sustainability === 'UNSUSTAINABLE') multiple *= 0.8;
    if (competitive.marketPosition === 'NICHE') multiple *= 0.9;
    if (fundamentals.growthMetrics.userGrowth < 0) multiple *= 0.85;
    
    return multiple;
  }
  
  private calculateBaseMultiple(
    fundamentals: FundamentalAnalysis,
    tokenomics: TokenomicsAnalysis,
    competitive: CompetitiveAnalysis
  ): number {
    let multiple = 1.0; // Base case
    
    if (fundamentals.growthMetrics.userGrowth > 20) multiple *= 1.2;
    if (tokenomics.tokenomicsScore > 70) multiple *= 1.1;
    if (competitive.competitiveScore > 60) multiple *= 1.15;
    
    return multiple;
  }
  
  private calculateBullMultiple(
    fundamentals: FundamentalAnalysis,
    tokenomics: TokenomicsAnalysis,
    competitive: CompetitiveAnalysis
  ): number {
    let multiple = 1.5; // Base bull case
    
    if (fundamentals.growthMetrics.userGrowth > 50) multiple *= 1.5;
    if (tokenomics.sustainability === 'SUSTAINABLE') multiple *= 1.3;
    if (competitive.marketPosition === 'LEADER' || competitive.marketPosition === 'CHALLENGER') {
      multiple *= 1.4;
    }
    
    return Math.min(5, multiple); // Cap at 5x
  }
  
  private identifyCatalysts(
    fundamentals: FundamentalAnalysis,
    tokenomics: TokenomicsAnalysis,
    competitive: CompetitiveAnalysis
  ): string[] {
    const catalysts: string[] = [];
    
    // Growth catalysts
    if (fundamentals.growthMetrics.userGrowth > 30) {
      catalysts.push('Accelerating user adoption');
    }
    
    // Technical catalysts
    if (fundamentals.growthMetrics.developerActivity > 70) {
      catalysts.push('Major protocol upgrades expected');
    }
    
    // Market catalysts
    if (competitive.marketShare < 10 && competitive.competitiveScore > 70) {
      catalysts.push('Market share expansion opportunity');
    }
    
    return catalysts;
  }
  
  private determineTimeframe(timeframe?: string): string {
    switch (timeframe) {
      case 'short': return '1-3 months';
      case 'medium': return '3-12 months';
      case 'long': return '12-24 months';
      default: return '6-12 months';
    }
  }
  
  private getDefaultPriceTargets(marketData: any): PriceTargets {
    const current = marketData.price || 0;
    
    return {
      current,
      bearCase: current * 0.7,
      baseCase: current * 1.0,
      bullCase: current * 1.5,
      methodology: 'Market-based estimation',
      catalysts: [],
      timeframe: '6-12 months',
    };
  }
  
  private generateInvestmentThesis(
    fundamentals: FundamentalAnalysis,
    tokenomics: TokenomicsAnalysis,
    team: TeamAssessment,
    competitive: CompetitiveAnalysis,
    risks: RiskOpportunity[],
    prices: PriceTargets
  ): InvestmentThesis {
    const score = this.calculateOverallScore(fundamentals, tokenomics, team, competitive);
    
    const bullCase = this.generateBullCase(fundamentals, tokenomics, competitive);
    const bearCase = this.generateBearCase(risks, tokenomics, competitive);
    
    const conviction = this.determineConviction(score, risks);
    const confidence = Math.min(95, score * 0.9 + 10);
    
    const summary = this.generateThesisSummary(
      conviction,
      fundamentals,
      competitive,
      prices
    );
    
    return {
      summary,
      bullCase,
      bearCase,
      conviction,
      timeHorizon: prices.timeframe,
      confidence,
    };
  }
  
  private calculateOverallScore(
    fundamentals: FundamentalAnalysis,
    tokenomics: TokenomicsAnalysis,
    team: TeamAssessment,
    competitive: CompetitiveAnalysis
  ): number {
    const weights = {
      fundamentals: 0.3,
      tokenomics: 0.25,
      team: 0.2,
      competitive: 0.25,
    };
    
    const fundamentalsScore = this.scoreFundamentals(fundamentals);
    
    return (
      fundamentalsScore * weights.fundamentals +
      tokenomics.tokenomicsScore * weights.tokenomics +
      team.teamScore * weights.team +
      competitive.competitiveScore * weights.competitive
    );
  }
  
  private scoreFundamentals(fundamentals: FundamentalAnalysis): number {
    let score = 50;
    
    if (fundamentals.growthMetrics.userGrowth > 50) score += 20;
    else if (fundamentals.growthMetrics.userGrowth > 20) score += 10;
    
    if (fundamentals.growthMetrics.transactionGrowth > 30) score += 15;
    if (fundamentals.growthMetrics.developerActivity > 70) score += 15;
    
    return Math.min(100, score);
  }
  
  private generateBullCase(
    fundamentals: FundamentalAnalysis,
    tokenomics: TokenomicsAnalysis,
    competitive: CompetitiveAnalysis
  ): string[] {
    const points: string[] = [];
    
    if (fundamentals.growthMetrics.userGrowth > 30) {
      points.push(`Strong user growth at ${fundamentals.growthMetrics.userGrowth}%`);
    }
    
    if (tokenomics.sustainability === 'SUSTAINABLE') {
      points.push('Sustainable tokenomics with controlled inflation');
    }
    
    if (competitive.marketPosition === 'LEADER' || competitive.marketPosition === 'CHALLENGER') {
      points.push(`${competitive.marketPosition} position in growing market`);
    }
    
    if (competitive.advantages.length > 0) {
      points.push(competitive.advantages[0]);
    }
    
    return points;
  }
  
  private generateBearCase(
    risks: RiskOpportunity[],
    tokenomics: TokenomicsAnalysis,
    competitive: CompetitiveAnalysis
  ): string[] {
    const points: string[] = [];
    
    const highRisks = risks.filter(r => r.type === 'RISK' && r.severity === 'HIGH');
    highRisks.slice(0, 2).forEach(risk => {
      points.push(risk.description);
    });
    
    if (tokenomics.circulatingPercent < 30) {
      points.push('High unlock pressure from low circulation');
    }
    
    if (competitive.challenges.length > 0) {
      points.push(competitive.challenges[0]);
    }
    
    return points;
  }
  
  private determineConviction(
    score: number,
    risks: RiskOpportunity[]
  ): 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' {
    const highRisks = risks.filter(r => r.type === 'RISK' && r.severity === 'HIGH').length;
    
    if (score > 80 && highRisks < 2) return 'STRONG_BUY';
    if (score > 65 && highRisks < 3) return 'BUY';
    if (score > 40) return 'HOLD';
    if (score > 25) return 'SELL';
    return 'STRONG_SELL';
  }
  
  private generateThesisSummary(
    conviction: string,
    fundamentals: FundamentalAnalysis,
    competitive: CompetitiveAnalysis,
    prices: PriceTargets
  ): string {
    const potential = ((prices.baseCase - prices.current) / prices.current * 100).toFixed(1);
    
    return `${conviction} - ${fundamentals.category} project with ${competitive.marketPosition} position. ` +
           `Base case suggests ${potential}% potential over ${prices.timeframe}. ` +
           `Key drivers include strong fundamentals and competitive positioning.`;
  }
  
  private calculateResearchScore(
    fundamentals: FundamentalAnalysis,
    tokenomics: TokenomicsAnalysis,
    team: TeamAssessment,
    competitive: CompetitiveAnalysis
  ): number {
    return this.calculateOverallScore(fundamentals, tokenomics, team, competitive);
  }
}