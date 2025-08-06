import { z } from 'zod';
import { BaseAgent, AgentContext, AgentConfig } from '../base/BaseAgent';
import { HiveClient } from '../../mcp/HiveClient';

interface SentimentAnalyzerResult {
  sentimentScore: number; // -100 to +100
  fearGreedIndex: number; // 0 to 100
  socialMetrics: SocialMetrics;
  contrarianSignals: ContrarianSignal[];
  divergences: Divergence[];
  tradingImplications: TradingImplication;
  analysisTime: Date;
}

interface SocialMetrics {
  twitter: PlatformMetrics;
  reddit: PlatformMetrics;
  discord: PlatformMetrics;
  news: PlatformMetrics;
  influencers: InfluencerMetrics;
  overallTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
}

interface PlatformMetrics {
  sentiment: number; // -100 to +100
  volume: number;
  mentions: number;
  engagement: number;
  topKeywords: string[];
  trend: string;
}

interface InfluencerMetrics {
  sentiment: number;
  bullishCount: number;
  bearishCount: number;
  topInfluencers: InfluencerSentiment[];
}

interface InfluencerSentiment {
  name: string;
  followers: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  recentPosts: number;
  influence: number;
}

interface ContrarianSignal {
  type: 'EXTREME_GREED' | 'EXTREME_FEAR' | 'DIVERGENCE' | 'SENTIMENT_PEAK' | 'CAPITULATION';
  strength: number; // 0-10
  description: string;
  historicalAccuracy: number;
  recommendedAction: string;
}

interface Divergence {
  type: 'PRICE_SENTIMENT' | 'VOLUME_SENTIMENT' | 'SOCIAL_ONCHAIN';
  direction: 'BULLISH' | 'BEARISH';
  magnitude: number;
  description: string;
  significance: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface TradingImplication {
  marketCycle: 'ACCUMULATION' | 'MARKUP' | 'DISTRIBUTION' | 'MARKDOWN';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  recommendation: string;
  confidenceLevel: number;
  timeframe: string;
}

export class SentimentAnalyzer extends BaseAgent {
  constructor(hiveClient: HiveClient) {
    const config: AgentConfig = {
      name: 'SentimentAnalyzer',
      description: 'Quantifies market psychology for contrarian opportunities',
      version: '1.0.0',
      cacheTTL: 300, // 5 minutes cache for sentiment data
      maxRetries: 3,
      timeout: 40000,
    };
    
    super(config, hiveClient);
  }
  
  protected validateInput(context: AgentContext): z.ZodSchema {
    return z.object({
      token: z.string().optional(),
      category: z.string().optional(),
      options: z.object({
        timeframe: z.enum(['1h', '4h', '24h', '7d', '30d']).optional(),
        includeContrarian: z.boolean().optional(),
        platforms: z.array(z.string()).optional(),
        trackInfluencers: z.boolean().optional(),
        historicalComparison: z.boolean().optional(),
      }).optional(),
    });
  }
  
  protected async performAnalysis(context: AgentContext): Promise<SentimentAnalyzerResult> {
    this.logger.info('Starting sentiment analysis', {
      token: context.token,
      category: context.category,
      timeframe: context.options?.timeframe || '24h',
    });
    
    // Parallel data collection
    const [
      socialData,
      newsData,
      influencerData,
      onChainSentiment,
      historicalSentiment,
      marketData,
    ] = await Promise.all([
      this.getSocialSentiment(context),
      this.getNewsSentiment(context),
      this.getInfluencerSentiment(context),
      this.getOnChainSentiment(context),
      this.getHistoricalSentiment(context),
      this.getMarketData(context),
    ]);
    
    // Calculate overall sentiment score
    const sentimentScore = this.calculateOverallSentiment(
      socialData,
      newsData,
      influencerData,
      onChainSentiment
    );
    
    // Calculate Fear & Greed Index
    const fearGreedIndex = this.calculateFearGreedIndex(
      sentimentScore,
      marketData,
      onChainSentiment
    );
    
    // Aggregate social metrics
    const socialMetrics = this.aggregateSocialMetrics(
      socialData,
      newsData,
      influencerData
    );
    
    // Detect contrarian signals
    const contrarianSignals = context.options?.includeContrarian !== false
      ? this.detectContrarianSignals(
          sentimentScore,
          fearGreedIndex,
          historicalSentiment,
          marketData
        )
      : [];
    
    // Find divergences
    const divergences = this.findDivergences(
      sentimentScore,
      marketData,
      socialData,
      onChainSentiment
    );
    
    // Generate trading implications
    const tradingImplications = this.generateTradingImplications(
      sentimentScore,
      fearGreedIndex,
      contrarianSignals,
      divergences
    );
    
    return {
      sentimentScore,
      fearGreedIndex,
      socialMetrics,
      contrarianSignals,
      divergences,
      tradingImplications,
      analysisTime: new Date(),
    };
  }
  
  private async getSocialSentiment(context: AgentContext): Promise<any> {
    const platforms = context.options?.platforms || ['twitter', 'reddit', 'discord'];
    
    const response = await this.hiveClient.request('/social/sentiment', {
      token: context.token,
      platforms,
      timeframe: context.options?.timeframe || '24h',
    });
    
    return response.data;
  }
  
  private async getNewsSentiment(context: AgentContext): Promise<any> {
    const response = await this.hiveClient.request('/news/sentiment', {
      token: context.token,
      timeframe: context.options?.timeframe || '24h',
      sources: 'all',
    });
    
    return response.data;
  }
  
  private async getInfluencerSentiment(context: AgentContext): Promise<any> {
    if (!context.options?.trackInfluencers) {
      return { influencers: [], averageSentiment: 0 };
    }
    
    const response = await this.hiveClient.request('/influencers/sentiment', {
      token: context.token,
      minFollowers: 10000,
      timeframe: context.options?.timeframe || '24h',
    });
    
    return response.data;
  }
  
  private async getOnChainSentiment(context: AgentContext): Promise<any> {
    const response = await this.hiveClient.request('/onchain/sentiment', {
      token: context.token,
      metrics: ['holder_behavior', 'transaction_patterns', 'dex_activity'],
      timeframe: context.options?.timeframe || '24h',
    });
    
    return response.data;
  }
  
  private async getHistoricalSentiment(context: AgentContext): Promise<any> {
    if (!context.options?.historicalComparison) {
      return { history: [], patterns: [] };
    }
    
    const response = await this.hiveClient.request('/sentiment/historical', {
      token: context.token,
      periods: 30, // 30 periods back
      timeframe: context.options?.timeframe || '24h',
    });
    
    return response.data;
  }
  
  private async getMarketData(context: AgentContext): Promise<any> {
    const response = await this.hiveClient.request('/market/data', {
      token: context.token,
      metrics: ['price', 'volume', 'volatility', 'momentum'],
      timeframe: context.options?.timeframe || '24h',
    });
    
    return response.data;
  }
  
  private calculateOverallSentiment(
    social: any,
    news: any,
    influencer: any,
    onChain: any
  ): number {
    // Weight different sources
    const weights = {
      social: 0.3,
      news: 0.2,
      influencer: 0.25,
      onChain: 0.25,
    };
    
    // Normalize scores to -100 to +100
    const socialScore = this.normalizeSentiment(social.averageSentiment || 0);
    const newsScore = this.normalizeSentiment(news.sentiment || 0);
    const influencerScore = this.normalizeSentiment(influencer.averageSentiment || 0);
    const onChainScore = this.normalizeSentiment(onChain.sentiment || 0);
    
    // Calculate weighted average
    const overallSentiment = 
      socialScore * weights.social +
      newsScore * weights.news +
      influencerScore * weights.influencer +
      onChainScore * weights.onChain;
    
    return Math.round(overallSentiment);
  }
  
  private normalizeSentiment(value: number): number {
    // Ensure value is between -100 and +100
    return Math.max(-100, Math.min(100, value));
  }
  
  private calculateFearGreedIndex(
    sentiment: number,
    market: any,
    onChain: any
  ): number {
    // Components of Fear & Greed Index
    const components = {
      sentiment: (sentiment + 100) / 2, // Convert -100/+100 to 0-100
      volatility: this.calculateVolatilityScore(market),
      momentum: this.calculateMomentumScore(market),
      volume: this.calculateVolumeScore(market),
      dominance: this.calculateDominanceScore(market),
      trends: this.calculateTrendScore(onChain),
    };
    
    // Weights for each component
    const weights = {
      sentiment: 0.25,
      volatility: 0.15,
      momentum: 0.20,
      volume: 0.15,
      dominance: 0.10,
      trends: 0.15,
    };
    
    // Calculate weighted average
    let fearGreedIndex = 0;
    for (const [key, value] of Object.entries(components)) {
      fearGreedIndex += value * weights[key as keyof typeof weights];
    }
    
    return Math.round(fearGreedIndex);
  }
  
  private calculateVolatilityScore(market: any): number {
    const volatility = market.volatility || 0;
    // Lower volatility = higher greed
    if (volatility < 20) return 80;
    if (volatility < 40) return 60;
    if (volatility < 60) return 40;
    if (volatility < 80) return 20;
    return 10;
  }
  
  private calculateMomentumScore(market: any): number {
    const momentum = market.momentum || 0;
    // Positive momentum = greed
    if (momentum > 20) return 90;
    if (momentum > 10) return 70;
    if (momentum > 0) return 55;
    if (momentum > -10) return 45;
    if (momentum > -20) return 30;
    return 10;
  }
  
  private calculateVolumeScore(market: any): number {
    const volumeChange = market.volumeChange || 0;
    // Higher volume = more greed
    if (volumeChange > 100) return 85;
    if (volumeChange > 50) return 70;
    if (volumeChange > 0) return 55;
    if (volumeChange > -25) return 40;
    return 20;
  }
  
  private calculateDominanceScore(market: any): number {
    // Placeholder for market dominance calculation
    return 50;
  }
  
  private calculateTrendScore(onChain: any): number {
    const trend = onChain.trend || 0;
    // Positive trend = greed
    return Math.max(0, Math.min(100, 50 + trend));
  }
  
  private aggregateSocialMetrics(
    social: any,
    news: any,
    influencer: any
  ): SocialMetrics {
    const platforms = ['twitter', 'reddit', 'discord'];
    const metrics: any = {};
    
    // Process each platform
    for (const platform of platforms) {
      const data = social.platforms?.[platform] || {};
      metrics[platform] = {
        sentiment: data.sentiment || 0,
        volume: data.volume || 0,
        mentions: data.mentions || 0,
        engagement: data.engagement || 0,
        topKeywords: data.keywords || [],
        trend: this.determineTrend(data),
      };
    }
    
    // Add news as a platform
    metrics.news = {
      sentiment: news.sentiment || 0,
      volume: news.articleCount || 0,
      mentions: news.mentions || 0,
      engagement: news.readership || 0,
      topKeywords: news.keywords || [],
      trend: news.trend || 'stable',
    };
    
    // Process influencer metrics
    const influencerMetrics: InfluencerMetrics = {
      sentiment: influencer.averageSentiment || 0,
      bullishCount: influencer.bullishCount || 0,
      bearishCount: influencer.bearishCount || 0,
      topInfluencers: this.processInfluencers(influencer.influencers || []),
    };
    
    // Determine overall trend
    const trends = Object.values(metrics).map((m: any) => m.trend);
    const overallTrend = this.determineOverallTrend(trends);
    
    return {
      twitter: metrics.twitter,
      reddit: metrics.reddit,
      discord: metrics.discord,
      news: metrics.news,
      influencers: influencerMetrics,
      overallTrend,
    };
  }
  
  private determineTrend(data: any): string {
    const change = data.change24h || 0;
    if (change > 20) return 'strongly increasing';
    if (change > 5) return 'increasing';
    if (change < -20) return 'strongly decreasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }
  
  private determineOverallTrend(trends: string[]): 'INCREASING' | 'DECREASING' | 'STABLE' {
    const increasing = trends.filter(t => t.includes('increasing')).length;
    const decreasing = trends.filter(t => t.includes('decreasing')).length;
    
    if (increasing > decreasing * 2) return 'INCREASING';
    if (decreasing > increasing * 2) return 'DECREASING';
    return 'STABLE';
  }
  
  private processInfluencers(influencers: any[]): InfluencerSentiment[] {
    return influencers
      .slice(0, 10) // Top 10 influencers
      .map(inf => ({
        name: inf.name || 'Unknown',
        followers: inf.followers || 0,
        sentiment: this.classifySentiment(inf.sentiment),
        recentPosts: inf.postCount || 0,
        influence: inf.influenceScore || 0,
      }));
  }
  
  private classifySentiment(score: number): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    if (score > 30) return 'BULLISH';
    if (score < -30) return 'BEARISH';
    return 'NEUTRAL';
  }
  
  private detectContrarianSignals(
    sentiment: number,
    fearGreed: number,
    historical: any,
    market: any
  ): ContrarianSignal[] {
    const signals: ContrarianSignal[] = [];
    
    // Check for extreme greed
    if (fearGreed > 80) {
      signals.push({
        type: 'EXTREME_GREED',
        strength: (fearGreed - 80) / 2,
        description: 'Market showing extreme greed - potential top',
        historicalAccuracy: 0.72,
        recommendedAction: 'Consider taking profits or reducing exposure',
      });
    }
    
    // Check for extreme fear
    if (fearGreed < 20) {
      signals.push({
        type: 'EXTREME_FEAR',
        strength: (20 - fearGreed) / 2,
        description: 'Market showing extreme fear - potential bottom',
        historicalAccuracy: 0.68,
        recommendedAction: 'Consider accumulating quality assets',
      });
    }
    
    // Check for sentiment peaks
    if (Math.abs(sentiment) > 85) {
      signals.push({
        type: 'SENTIMENT_PEAK',
        strength: (Math.abs(sentiment) - 85) / 1.5,
        description: `Sentiment at extreme ${sentiment > 0 ? 'bullish' : 'bearish'} levels`,
        historicalAccuracy: 0.65,
        recommendedAction: sentiment > 0 
          ? 'Wait for sentiment normalization before buying'
          : 'Wait for capitulation before selling',
      });
    }
    
    // Check for divergences
    if (market.priceChange && sentiment) {
      const priceSentimentDivergence = Math.abs(market.priceChange - sentiment / 10);
      if (priceSentimentDivergence > 15) {
        signals.push({
          type: 'DIVERGENCE',
          strength: Math.min(10, priceSentimentDivergence / 3),
          description: 'Price and sentiment showing significant divergence',
          historicalAccuracy: 0.61,
          recommendedAction: 'Monitor for trend reversal signals',
        });
      }
    }
    
    // Check for capitulation
    if (fearGreed < 10 && market.volumeSpike > 200) {
      signals.push({
        type: 'CAPITULATION',
        strength: 9,
        description: 'Potential capitulation event detected',
        historicalAccuracy: 0.78,
        recommendedAction: 'Strong buy signal for contrarian traders',
      });
    }
    
    return signals;
  }
  
  private findDivergences(
    sentiment: number,
    market: any,
    social: any,
    onChain: any
  ): Divergence[] {
    const divergences: Divergence[] = [];
    
    // Price-Sentiment Divergence
    const priceChange = market.priceChange || 0;
    const sentimentNormalized = sentiment / 10; // Scale to similar range
    const priceSentimentDiff = priceChange - sentimentNormalized;
    
    if (Math.abs(priceSentimentDiff) > 10) {
      divergences.push({
        type: 'PRICE_SENTIMENT',
        direction: priceSentimentDiff > 0 ? 'BULLISH' : 'BEARISH',
        magnitude: Math.abs(priceSentimentDiff),
        description: priceSentimentDiff > 0
          ? 'Price rising faster than sentiment - potential overextension'
          : 'Sentiment more negative than price action - potential opportunity',
        significance: Math.abs(priceSentimentDiff) > 20 ? 'HIGH' : 'MEDIUM',
      });
    }
    
    // Volume-Sentiment Divergence
    const volumeChange = market.volumeChange || 0;
    const volumeSentimentDiff = volumeChange - sentiment;
    
    if (Math.abs(volumeSentimentDiff) > 30) {
      divergences.push({
        type: 'VOLUME_SENTIMENT',
        direction: volumeSentimentDiff > 0 ? 'BULLISH' : 'BEARISH',
        magnitude: Math.abs(volumeSentimentDiff),
        description: volumeSentimentDiff > 0
          ? 'Volume increasing despite negative sentiment'
          : 'Volume decreasing despite positive sentiment',
        significance: Math.abs(volumeSentimentDiff) > 50 ? 'HIGH' : 'LOW',
      });
    }
    
    // Social-OnChain Divergence
    const socialSentiment = social.averageSentiment || 0;
    const onChainSentiment = onChain.sentiment || 0;
    const socialOnChainDiff = socialSentiment - onChainSentiment;
    
    if (Math.abs(socialOnChainDiff) > 25) {
      divergences.push({
        type: 'SOCIAL_ONCHAIN',
        direction: socialOnChainDiff > 0 ? 'BULLISH' : 'BEARISH',
        magnitude: Math.abs(socialOnChainDiff),
        description: socialOnChainDiff > 0
          ? 'Social sentiment more positive than on-chain activity'
          : 'On-chain activity more positive than social sentiment',
        significance: Math.abs(socialOnChainDiff) > 40 ? 'MEDIUM' : 'LOW',
      });
    }
    
    return divergences;
  }
  
  private generateTradingImplications(
    sentiment: number,
    fearGreed: number,
    contrarian: ContrarianSignal[],
    divergences: Divergence[]
  ): TradingImplication {
    // Determine market cycle
    let marketCycle: TradingImplication['marketCycle'];
    if (fearGreed < 25 && sentiment < -40) {
      marketCycle = 'ACCUMULATION';
    } else if (fearGreed > 25 && fearGreed < 60 && sentiment > 0) {
      marketCycle = 'MARKUP';
    } else if (fearGreed > 75 && sentiment > 40) {
      marketCycle = 'DISTRIBUTION';
    } else {
      marketCycle = 'MARKDOWN';
    }
    
    // Determine risk level
    let riskLevel: TradingImplication['riskLevel'];
    if (fearGreed > 80 || fearGreed < 20) {
      riskLevel = 'EXTREME';
    } else if (fearGreed > 70 || fearGreed < 30) {
      riskLevel = 'HIGH';
    } else if (fearGreed > 60 || fearGreed < 40) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }
    
    // Generate recommendation
    const hasStrongContrarian = contrarian.some(s => s.strength > 7);
    const hasHighDivergence = divergences.some(d => d.significance === 'HIGH');
    
    let recommendation: string;
    let confidenceLevel: number;
    
    if (marketCycle === 'ACCUMULATION') {
      recommendation = 'Consider gradual accumulation of quality assets';
      confidenceLevel = hasStrongContrarian ? 85 : 70;
    } else if (marketCycle === 'DISTRIBUTION') {
      recommendation = 'Take profits on overextended positions';
      confidenceLevel = hasStrongContrarian ? 80 : 65;
    } else if (marketCycle === 'MARKUP') {
      recommendation = 'Hold positions, monitor for distribution signals';
      confidenceLevel = hasHighDivergence ? 60 : 75;
    } else {
      recommendation = 'Wait for clear accumulation signals';
      confidenceLevel = 60;
    }
    
    // Determine timeframe
    const timeframe = this.determineTimeframe(fearGreed, contrarian);
    
    return {
      marketCycle,
      riskLevel,
      recommendation,
      confidenceLevel,
      timeframe,
    };
  }
  
  private determineTimeframe(fearGreed: number, contrarian: ContrarianSignal[]): string {
    if (contrarian.some(s => s.type === 'CAPITULATION')) {
      return 'Immediate opportunity (24-48 hours)';
    }
    if (fearGreed > 80 || fearGreed < 20) {
      return 'Short-term reversal likely (1-2 weeks)';
    }
    if (fearGreed > 70 || fearGreed < 30) {
      return 'Medium-term caution advised (2-4 weeks)';
    }
    return 'Long-term positioning (1-3 months)';
  }
}