/**
 * @fileoverview NFTValuator - NFT Valuation and Rarity Analysis Expert
 * @module agents/specialized/NFTValuator
 * 
 * Advanced NFT valuation agent that analyzes rarity, market dynamics,
 * and comparable sales to provide accurate pricing estimates and
 * investment recommendations for NFT collections and individual tokens.
 * 
 * @since 1.1.0
 */

import { z } from 'zod';
import { BaseAgent, AgentContext, AgentConfig } from '../base/BaseAgent';
import { IHiveService } from '../../interfaces/IHiveService';

interface NFTValuationResult {
  collection: CollectionInfo;
  valuation: ValuationMetrics;
  rarityAnalysis: RarityAnalysis;
  marketMetrics: MarketMetrics;
  liquidityProfile: LiquidityProfile;
  tradingSignals: TradingSignal[];
  riskFactors: RiskFactor[];
  recommendation: ValuationRecommendation;
  timestamp: Date;
}

interface CollectionInfo {
  name: string;
  address: string;
  symbol: string;
  totalSupply: number;
  uniqueHolders: number;
  royaltyPercentage: number;
  creatorAddress: string;
  verified: boolean;
  bluechip: boolean;
}

interface ValuationMetrics {
  estimatedValue: number;
  floorPrice: number;
  ceilingPrice: number;
  fairValue: number;
  valuationMethod: 'RARITY' | 'COMPARABLE' | 'INCOME' | 'HYBRID';
  confidence: number; // 0-100
  priceRange: {
    min: number;
    mid: number;
    max: number;
  };
}

interface RarityAnalysis {
  rarityScore: number; // 0-100
  rarityRank: number;
  totalTraits: number;
  uniqueTraits: Trait[];
  rarityDistribution: RarityDistribution;
  comparableRarities: ComparableNFT[];
}

interface Trait {
  type: string;
  value: string;
  rarity: number; // percentage
  floorMultiplier: number;
}

interface RarityDistribution {
  legendary: number; // <1%
  epic: number; // 1-5%
  rare: number; // 5-15%
  uncommon: number; // 15-30%
  common: number; // >30%
}

interface ComparableNFT {
  tokenId: number;
  rarityScore: number;
  lastSalePrice: number;
  daysAgo: number;
}

interface MarketMetrics {
  volume24h: number;
  volume7d: number;
  volume30d: number;
  sales24h: number;
  averagePrice24h: number;
  floorChange24h: number;
  listedPercentage: number;
  topHolderConcentration: number;
  whaleActivity: 'HIGH' | 'MEDIUM' | 'LOW';
  momentum: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

interface LiquidityProfile {
  liquidityScore: number; // 0-100
  instantLiquidity: number; // ETH available at floor
  depth: {
    buy: number;
    sell: number;
  };
  bidAskSpread: number;
  marketMakerPresent: boolean;
  estimatedSaleTime: string; // e.g., "1-3 days"
}

interface TradingSignal {
  type: 'BUY' | 'SELL' | 'HOLD' | 'FLIP';
  strength: number; // 0-10
  reason: string;
  timeframe: string;
  profitPotential: number; // percentage
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface RiskFactor {
  type: 'LIQUIDITY' | 'VOLATILITY' | 'REGULATORY' | 'TECHNICAL' | 'MARKET';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  mitigation: string;
}

interface ValuationRecommendation {
  action: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number; // 0-100
  reasoning: string[];
  targetPrice: number;
  timeHorizon: string;
  alternativeOptions: string[];
}

export class NFTValuator extends BaseAgent {
  constructor(hiveService: IHiveService) {
    const config: AgentConfig = {
      name: 'NFTValuator',
      description: 'NFT valuation expert with rarity analysis and market insights',
      version: '1.0.0',
      cacheTTL: 600, // 10 minutes cache for NFT data
      maxRetries: 3,
      timeout: 45000,
    };
    
    super(config, hiveService);
  }
  
  protected validateInput(context: AgentContext): z.ZodSchema {
    return z.object({
      address: z.string().optional(),
      network: z.string().optional(),
      options: z.object({
        tokenId: z.number().optional(),
        includeHistory: z.boolean().optional(),
        comparableSales: z.number().optional(),
        liquidityDepth: z.number().optional(),
        valuationMethods: z.array(z.string()).optional(),
      }).optional(),
    });
  }
  
  protected async performAnalysis(context: AgentContext): Promise<NFTValuationResult> {
    this.logger.info('Starting NFT valuation analysis', {
      address: context.address,
      tokenId: context.options?.tokenId,
      network: context.network || 'ethereum',
    });
    
    // Parallel data collection
    const [
      collectionData,
      rarityData,
      marketData,
      salesHistory,
      holderData,
      liquidityData,
    ] = await Promise.all([
      this.getCollectionData(context),
      this.getRarityData(context),
      this.getMarketData(context),
      this.getSalesHistory(context),
      this.getHolderAnalysis(context),
      this.getLiquidityData(context),
    ]);
    
    // Process collection info
    const collection = this.processCollectionInfo(collectionData);
    
    // Perform rarity analysis
    const rarityAnalysis = this.analyzeRarity(rarityData, salesHistory);
    
    // Calculate valuation
    const valuation = this.calculateValuation(
      collection,
      rarityAnalysis,
      marketData,
      salesHistory,
      context.options?.valuationMethods
    );
    
    // Analyze market metrics
    const marketMetrics = this.analyzeMarketMetrics(marketData, salesHistory);
    
    // Assess liquidity
    const liquidityProfile = this.assessLiquidity(liquidityData, marketData);
    
    // Generate trading signals
    const tradingSignals = this.generateTradingSignals(
      valuation,
      marketMetrics,
      liquidityProfile,
      rarityAnalysis
    );
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(
      collection,
      marketMetrics,
      liquidityProfile,
      holderData
    );
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(
      valuation,
      tradingSignals,
      riskFactors,
      marketMetrics
    );
    
    return {
      collection,
      valuation,
      rarityAnalysis,
      marketMetrics,
      liquidityProfile,
      tradingSignals,
      riskFactors,
      recommendation,
      timestamp: new Date(),
    };
  }
  
  private async getCollectionData(context: AgentContext): Promise<any> {
    const response = await this.hiveService.callTool('hive_nft_collection', {
      address: context.address,
      network: context.network || 'ethereum',
    });
    
    return response.data || {};
  }
  
  private async getRarityData(context: AgentContext): Promise<any> {
    const response = await this.hiveService.callTool('hive_nft_rarity', {
      address: context.address,
      tokenId: context.options?.tokenId,
      network: context.network || 'ethereum',
    });
    
    return response.data || {};
  }
  
  private async getMarketData(context: AgentContext): Promise<any> {
    const response = await this.hiveService.callTool('hive_nft_market', {
      address: context.address,
      timeframe: '30d',
      network: context.network || 'ethereum',
    });
    
    return response.data || {};
  }
  
  private async getSalesHistory(context: AgentContext): Promise<any> {
    const limit = context.options?.comparableSales || 20;
    
    const response = await this.hiveService.callTool('hive_nft_sales', {
      address: context.address,
      tokenId: context.options?.tokenId,
      limit,
      network: context.network || 'ethereum',
    });
    
    return response.data || {};
  }
  
  private async getHolderAnalysis(context: AgentContext): Promise<any> {
    const response = await this.hiveService.callTool('hive_nft_holders', {
      address: context.address,
      network: context.network || 'ethereum',
    });
    
    return response.data || {};
  }
  
  private async getLiquidityData(context: AgentContext): Promise<any> {
    const depth = context.options?.liquidityDepth || 10;
    
    const response = await this.hiveService.callTool('hive_nft_liquidity', {
      address: context.address,
      depth,
      network: context.network || 'ethereum',
    });
    
    return response.data || {};
  }
  
  private processCollectionInfo(data: any): CollectionInfo {
    return {
      name: data.name || 'Unknown Collection',
      address: data.address || '',
      symbol: data.symbol || '',
      totalSupply: data.totalSupply || 0,
      uniqueHolders: data.uniqueHolders || 0,
      royaltyPercentage: data.royaltyPercentage || 0,
      creatorAddress: data.creatorAddress || '',
      verified: data.verified || false,
      bluechip: this.isBluechip(data),
    };
  }
  
  private isBluechip(data: any): boolean {
    // Criteria for bluechip status
    const criteria = {
      minFloor: 1, // 1 ETH minimum floor
      minHolders: 5000,
      minVolume30d: 1000, // 1000 ETH
      verified: true,
    };
    
    return (
      data.floorPrice >= criteria.minFloor &&
      data.uniqueHolders >= criteria.minHolders &&
      data.volume30d >= criteria.minVolume30d &&
      data.verified === criteria.verified
    );
  }
  
  private analyzeRarity(rarityData: any, salesHistory: any): RarityAnalysis {
    const traits = rarityData.traits || [];
    const uniqueTraits = this.extractUniqueTraits(traits);
    const rarityScore = this.calculateRarityScore(traits);
    const distribution = this.calculateRarityDistribution(traits);
    const comparables = this.findComparableNFTs(rarityScore, salesHistory);
    
    return {
      rarityScore,
      rarityRank: rarityData.rank || 0,
      totalTraits: traits.length,
      uniqueTraits,
      rarityDistribution: distribution,
      comparableRarities: comparables,
    };
  }
  
  private extractUniqueTraits(traits: any[]): Trait[] {
    return traits
      .filter((t: any) => t.rarity < 5) // Traits with <5% rarity
      .map((t: any) => ({
        type: t.type,
        value: t.value,
        rarity: t.rarity,
        floorMultiplier: this.calculateTraitMultiplier(t.rarity),
      }))
      .slice(0, 10); // Top 10 rarest traits
  }
  
  private calculateTraitMultiplier(rarity: number): number {
    if (rarity < 0.5) return 5.0;
    if (rarity < 1) return 3.0;
    if (rarity < 2) return 2.0;
    if (rarity < 5) return 1.5;
    if (rarity < 10) return 1.2;
    return 1.0;
  }
  
  private calculateRarityScore(traits: any[]): number {
    if (!traits || traits.length === 0) return 50;
    
    let score = 0;
    let weight = 0;
    
    for (const trait of traits) {
      const traitWeight = 100 - trait.rarity;
      score += traitWeight;
      weight += 1;
    }
    
    return Math.min(100, Math.round(score / weight));
  }
  
  private calculateRarityDistribution(traits: any[]): RarityDistribution {
    const distribution = {
      legendary: 0,
      epic: 0,
      rare: 0,
      uncommon: 0,
      common: 0,
    };
    
    for (const trait of traits) {
      if (trait.rarity < 1) distribution.legendary++;
      else if (trait.rarity < 5) distribution.epic++;
      else if (trait.rarity < 15) distribution.rare++;
      else if (trait.rarity < 30) distribution.uncommon++;
      else distribution.common++;
    }
    
    return distribution;
  }
  
  private findComparableNFTs(rarityScore: number, salesHistory: any): ComparableNFT[] {
    const sales = salesHistory.sales || [];
    const scoreRange = 10; // +/- 10 points
    
    return sales
      .filter((s: any) => 
        Math.abs(s.rarityScore - rarityScore) <= scoreRange
      )
      .map((s: any) => ({
        tokenId: s.tokenId,
        rarityScore: s.rarityScore,
        lastSalePrice: s.price,
        daysAgo: this.calculateDaysAgo(s.timestamp),
      }))
      .slice(0, 5); // Top 5 comparables
  }
  
  private calculateDaysAgo(timestamp: number): number {
    const now = Date.now();
    const diff = now - timestamp;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
  
  private calculateValuation(
    collection: CollectionInfo,
    rarity: RarityAnalysis,
    market: any,
    sales: any,
    methods?: string[]
  ): ValuationMetrics {
    const floorPrice = market.floorPrice || 0;
    const useHybrid = !methods || methods.includes('HYBRID');
    
    // Calculate different valuation methods
    const rarityValue = this.calculateRarityValue(floorPrice, rarity);
    const comparableValue = this.calculateComparableValue(rarity.comparableRarities);
    const incomeValue = this.calculateIncomeValue(market, collection);
    
    // Determine valuation method and value
    let estimatedValue: number;
    let valuationMethod: ValuationMetrics['valuationMethod'];
    
    if (useHybrid) {
      // Weighted average of all methods
      estimatedValue = (
        rarityValue * 0.4 +
        comparableValue * 0.4 +
        incomeValue * 0.2
      );
      valuationMethod = 'HYBRID';
    } else if (methods?.includes('RARITY')) {
      estimatedValue = rarityValue;
      valuationMethod = 'RARITY';
    } else if (methods?.includes('COMPARABLE')) {
      estimatedValue = comparableValue;
      valuationMethod = 'COMPARABLE';
    } else {
      estimatedValue = incomeValue;
      valuationMethod = 'INCOME';
    }
    
    // Calculate price range
    const variance = this.calculatePriceVariance(sales);
    const priceRange = {
      min: estimatedValue * (1 - variance),
      mid: estimatedValue,
      max: estimatedValue * (1 + variance),
    };
    
    // Calculate confidence
    const confidence = this.calculateValuationConfidence(
      rarity.comparableRarities.length,
      sales.sales?.length || 0,
      market.volume30d || 0
    );
    
    return {
      estimatedValue,
      floorPrice,
      ceilingPrice: market.ceilingPrice || floorPrice * 10,
      fairValue: (estimatedValue + floorPrice) / 2,
      valuationMethod,
      confidence,
      priceRange,
    };
  }
  
  private calculateRarityValue(floor: number, rarity: RarityAnalysis): number {
    const baseMultiplier = 1.0;
    let multiplier = baseMultiplier;
    
    // Adjust based on rarity score
    if (rarity.rarityScore > 90) multiplier *= 5.0;
    else if (rarity.rarityScore > 80) multiplier *= 3.0;
    else if (rarity.rarityScore > 70) multiplier *= 2.0;
    else if (rarity.rarityScore > 60) multiplier *= 1.5;
    else if (rarity.rarityScore > 50) multiplier *= 1.2;
    
    // Adjust for unique traits
    for (const trait of rarity.uniqueTraits) {
      if (trait.rarity < 1) multiplier *= 1.5;
      else if (trait.rarity < 2) multiplier *= 1.2;
      else if (trait.rarity < 5) multiplier *= 1.1;
    }
    
    return floor * multiplier;
  }
  
  private calculateComparableValue(comparables: ComparableNFT[]): number {
    if (comparables.length === 0) return 0;
    
    // Weight recent sales more heavily
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const comp of comparables) {
      const recencyWeight = Math.max(0.2, 1 - (comp.daysAgo / 30));
      weightedSum += comp.lastSalePrice * recencyWeight;
      totalWeight += recencyWeight;
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  private calculateIncomeValue(market: any, collection: CollectionInfo): number {
    // Simple income approach based on potential rental/staking yields
    const monthlyYield = market.averagePrice24h * 0.05; // Assume 5% monthly yield
    const annualYield = monthlyYield * 12;
    const discountRate = 0.15; // 15% discount rate
    
    return annualYield / discountRate;
  }
  
  private calculatePriceVariance(sales: any): number {
    const prices = sales.sales?.map((s: any) => s.price) || [];
    if (prices.length < 2) return 0.2; // Default 20% variance
    
    const mean = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
    const variance = prices.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.min(0.5, stdDev / mean); // Cap at 50% variance
  }
  
  private calculateValuationConfidence(
    comparables: number,
    sales: number,
    volume: number
  ): number {
    let confidence = 50; // Base confidence
    
    // Adjust based on data availability
    if (comparables > 5) confidence += 15;
    else if (comparables > 2) confidence += 10;
    else if (comparables > 0) confidence += 5;
    
    if (sales > 50) confidence += 15;
    else if (sales > 20) confidence += 10;
    else if (sales > 10) confidence += 5;
    
    if (volume > 10000) confidence += 20;
    else if (volume > 1000) confidence += 15;
    else if (volume > 100) confidence += 10;
    
    return Math.min(100, confidence);
  }
  
  private analyzeMarketMetrics(market: any, sales: any): MarketMetrics {
    const recentSales = sales.sales?.filter((s: any) => 
      this.calculateDaysAgo(s.timestamp) <= 1
    ) || [];
    
    return {
      volume24h: market.volume24h || 0,
      volume7d: market.volume7d || 0,
      volume30d: market.volume30d || 0,
      sales24h: recentSales.length,
      averagePrice24h: market.averagePrice24h || 0,
      floorChange24h: market.floorChange24h || 0,
      listedPercentage: market.listedPercentage || 0,
      topHolderConcentration: market.topHolderConcentration || 0,
      whaleActivity: this.classifyWhaleActivity(market),
      momentum: this.classifyMomentum(market),
    };
  }
  
  private classifyWhaleActivity(market: any): 'HIGH' | 'MEDIUM' | 'LOW' {
    const whaleVolume = market.whaleVolume || 0;
    const totalVolume = market.volume24h || 1;
    const ratio = whaleVolume / totalVolume;
    
    if (ratio > 0.5) return 'HIGH';
    if (ratio > 0.2) return 'MEDIUM';
    return 'LOW';
  }
  
  private classifyMomentum(market: any): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    const priceChange = market.floorChange24h || 0;
    const volumeChange = market.volumeChange24h || 0;
    
    if (priceChange > 10 && volumeChange > 0) return 'BULLISH';
    if (priceChange < -10 && volumeChange > 0) return 'BEARISH';
    return 'NEUTRAL';
  }
  
  private assessLiquidity(liquidity: any, market: any): LiquidityProfile {
    const bids = liquidity.bids || [];
    const asks = liquidity.asks || [];
    
    const buyDepth = bids.reduce((sum: number, b: any) => sum + b.total, 0);
    const sellDepth = asks.reduce((sum: number, b: any) => sum + b.total, 0);
    
    const spread = asks[0]?.price && bids[0]?.price 
      ? (asks[0].price - bids[0].price) / bids[0].price 
      : 0;
    
    const liquidityScore = this.calculateLiquidityScore(
      buyDepth,
      sellDepth,
      spread,
      market.volume24h || 0
    );
    
    return {
      liquidityScore,
      instantLiquidity: market.floorPrice || 0,
      depth: {
        buy: buyDepth,
        sell: sellDepth,
      },
      bidAskSpread: spread,
      marketMakerPresent: this.detectMarketMaker(bids, asks),
      estimatedSaleTime: this.estimateSaleTime(liquidityScore),
    };
  }
  
  private calculateLiquidityScore(
    buyDepth: number,
    sellDepth: number,
    spread: number,
    volume: number
  ): number {
    let score = 50; // Base score
    
    // Depth score (0-30 points)
    const totalDepth = buyDepth + sellDepth;
    if (totalDepth > 1000) score += 30;
    else if (totalDepth > 500) score += 20;
    else if (totalDepth > 100) score += 10;
    
    // Spread score (0-20 points)
    if (spread < 0.02) score += 20;
    else if (spread < 0.05) score += 15;
    else if (spread < 0.10) score += 10;
    else if (spread < 0.20) score += 5;
    
    // Volume score (0-30 points)
    if (volume > 1000) score += 30;
    else if (volume > 100) score += 20;
    else if (volume > 10) score += 10;
    
    // Balance score (0-20 points)
    const balance = Math.min(buyDepth, sellDepth) / Math.max(buyDepth, sellDepth);
    score += balance * 20;
    
    return Math.min(100, Math.round(score));
  }
  
  private detectMarketMaker(bids: any[], asks: any[]): boolean {
    // Look for patterns indicating market maker presence
    if (bids.length < 5 || asks.length < 5) return false;
    
    // Check for consistent order sizes (market maker pattern)
    const bidSizes = bids.slice(0, 5).map((b: any) => b.amount);
    const askSizes = asks.slice(0, 5).map((a: any) => a.amount);
    
    const bidVariance = this.calculateArrayVariance(bidSizes);
    const askVariance = this.calculateArrayVariance(askSizes);
    
    return bidVariance < 0.2 && askVariance < 0.2;
  }
  
  private calculateArrayVariance(arr: number[]): number {
    if (arr.length === 0) return 1;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
    return variance / (mean * mean); // Coefficient of variation
  }
  
  private estimateSaleTime(liquidityScore: number): string {
    if (liquidityScore > 80) return "Instant (< 1 hour)";
    if (liquidityScore > 60) return "Quick (1-6 hours)";
    if (liquidityScore > 40) return "Moderate (6-24 hours)";
    if (liquidityScore > 20) return "Slow (1-3 days)";
    return "Very slow (3+ days)";
  }
  
  private generateTradingSignals(
    valuation: ValuationMetrics,
    market: MarketMetrics,
    liquidity: LiquidityProfile,
    rarity: RarityAnalysis
  ): TradingSignal[] {
    const signals: TradingSignal[] = [];
    
    // Value signal
    const valueRatio = valuation.estimatedValue / valuation.floorPrice;
    if (valueRatio > 1.3) {
      signals.push({
        type: 'BUY',
        strength: Math.min(10, (valueRatio - 1) * 10),
        reason: `Undervalued by ${Math.round((valueRatio - 1) * 100)}%`,
        timeframe: '1-2 weeks',
        profitPotential: (valueRatio - 1) * 100,
        risk: valueRatio > 2 ? 'HIGH' : 'MEDIUM',
      });
    } else if (valueRatio < 0.8) {
      signals.push({
        type: 'SELL',
        strength: Math.min(10, (1 - valueRatio) * 10),
        reason: `Overvalued by ${Math.round((1 - valueRatio) * 100)}%`,
        timeframe: '1-3 days',
        profitPotential: 0,
        risk: 'LOW',
      });
    }
    
    // Momentum signal
    if (market.momentum === 'BULLISH' && market.volume24h > market.volume7d / 7 * 2) {
      signals.push({
        type: 'BUY',
        strength: 7,
        reason: 'Strong bullish momentum with increasing volume',
        timeframe: '24-48 hours',
        profitPotential: 20,
        risk: 'MEDIUM',
      });
    } else if (market.momentum === 'BEARISH' && liquidity.liquidityScore > 60) {
      signals.push({
        type: 'SELL',
        strength: 6,
        reason: 'Bearish momentum with good exit liquidity',
        timeframe: 'Immediate',
        profitPotential: 0,
        risk: 'LOW',
      });
    }
    
    // Flip opportunity
    if (
      valuation.confidence > 70 &&
      liquidity.liquidityScore > 50 &&
      market.floorChange24h < -10
    ) {
      signals.push({
        type: 'FLIP',
        strength: 8,
        reason: 'Quick flip opportunity on temporary dip',
        timeframe: '6-12 hours',
        profitPotential: 15,
        risk: 'MEDIUM',
      });
    }
    
    // Hold signal
    if (
      rarity.rarityScore > 80 &&
      market.whaleActivity === 'HIGH' &&
      signals.length === 0
    ) {
      signals.push({
        type: 'HOLD',
        strength: 9,
        reason: 'High rarity with whale accumulation',
        timeframe: '1-3 months',
        profitPotential: 50,
        risk: 'LOW',
      });
    }
    
    return signals;
  }
  
  private identifyRiskFactors(
    collection: CollectionInfo,
    market: MarketMetrics,
    liquidity: LiquidityProfile,
    holders: any
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];
    
    // Liquidity risk
    if (liquidity.liquidityScore < 30) {
      risks.push({
        type: 'LIQUIDITY',
        severity: liquidity.liquidityScore < 20 ? 'CRITICAL' : 'HIGH',
        description: 'Low liquidity may result in difficulty selling',
        mitigation: 'Only invest what you can afford to hold long-term',
      });
    }
    
    // Volatility risk
    if (Math.abs(market.floorChange24h) > 20) {
      risks.push({
        type: 'VOLATILITY',
        severity: Math.abs(market.floorChange24h) > 40 ? 'HIGH' : 'MEDIUM',
        description: `High price volatility (${market.floorChange24h}% in 24h)`,
        mitigation: 'Use smaller position sizes and set stop losses',
      });
    }
    
    // Concentration risk
    if (market.topHolderConcentration > 50) {
      risks.push({
        type: 'MARKET',
        severity: market.topHolderConcentration > 70 ? 'HIGH' : 'MEDIUM',
        description: 'High whale concentration could lead to manipulation',
        mitigation: 'Monitor whale wallets for large movements',
      });
    }
    
    // Technical risk
    if (!collection.verified) {
      risks.push({
        type: 'TECHNICAL',
        severity: 'MEDIUM',
        description: 'Collection not verified, potential for scams',
        mitigation: 'Verify contract and creator before purchasing',
      });
    }
    
    // Regulatory risk
    if (collection.royaltyPercentage > 10) {
      risks.push({
        type: 'REGULATORY',
        severity: 'LOW',
        description: 'High royalties may deter future buyers',
        mitigation: 'Factor royalties into profit calculations',
      });
    }
    
    return risks;
  }
  
  private generateRecommendation(
    valuation: ValuationMetrics,
    signals: TradingSignal[],
    risks: RiskFactor[],
    market: MarketMetrics
  ): ValuationRecommendation {
    // Calculate overall score
    const buySignals = signals.filter(s => s.type === 'BUY');
    const sellSignals = signals.filter(s => s.type === 'SELL');
    const criticalRisks = risks.filter(r => r.severity === 'CRITICAL');
    
    let action: ValuationRecommendation['action'];
    let confidence = valuation.confidence;
    const reasoning: string[] = [];
    
    // Determine action
    if (criticalRisks.length > 0) {
      action = 'STRONG_SELL';
      reasoning.push('Critical risk factors present');
    } else if (buySignals.length > sellSignals.length + 1) {
      action = buySignals.some(s => s.strength > 8) ? 'STRONG_BUY' : 'BUY';
      reasoning.push('Multiple buy signals detected');
    } else if (sellSignals.length > buySignals.length + 1) {
      action = sellSignals.some(s => s.strength > 8) ? 'STRONG_SELL' : 'SELL';
      reasoning.push('Multiple sell signals detected');
    } else {
      action = 'HOLD';
      reasoning.push('Mixed signals suggest waiting');
    }
    
    // Add specific reasoning
    if (valuation.estimatedValue > valuation.floorPrice * 1.2) {
      reasoning.push(`Undervalued by ${Math.round((valuation.estimatedValue / valuation.floorPrice - 1) * 100)}%`);
    }
    if (market.momentum === 'BULLISH') {
      reasoning.push('Bullish market momentum');
    }
    if (risks.filter(r => r.severity === 'HIGH').length > 0) {
      reasoning.push('High risk factors require caution');
      confidence *= 0.8;
    }
    
    // Generate alternatives
    const alternatives: string[] = [];
    if (action === 'BUY' || action === 'STRONG_BUY') {
      alternatives.push('Wait for a 10% dip for better entry');
      alternatives.push('Consider similar collections with lower entry');
    } else if (action === 'SELL' || action === 'STRONG_SELL') {
      alternatives.push('Hold if you believe in long-term value');
      alternatives.push('Partial sell to lock in profits');
    } else {
      alternatives.push('Set price alerts for significant moves');
      alternatives.push('Research upcoming catalysts');
    }
    
    return {
      action,
      confidence: Math.round(confidence),
      reasoning,
      targetPrice: valuation.estimatedValue,
      timeHorizon: this.determineTimeHorizon(signals),
      alternativeOptions: alternatives,
    };
  }
  
  private determineTimeHorizon(signals: TradingSignal[]): string {
    if (signals.some(s => s.timeframe.includes('hour'))) {
      return 'Short-term (24-48 hours)';
    }
    if (signals.some(s => s.timeframe.includes('day'))) {
      return 'Near-term (1-7 days)';
    }
    if (signals.some(s => s.timeframe.includes('week'))) {
      return 'Medium-term (1-4 weeks)';
    }
    return 'Long-term (1-3 months)';
  }
}