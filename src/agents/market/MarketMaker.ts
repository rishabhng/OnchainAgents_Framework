/**
 * @fileoverview MarketMaker - Market Microstructure and Liquidity Expert
 * @module agents/market/MarketMaker
 * 
 * Sophisticated market making agent specializing in order book dynamics,
 * liquidity provision strategies, MEV analysis, and optimal execution
 * algorithms for crypto markets.
 * 
 * @since 1.1.0
 */

import { z } from 'zod';
import { BaseAgent, AgentContext, AgentConfig } from '../base/BaseAgent';
import { IHiveService } from '../../interfaces/IHiveService';

interface MarketMakerAnalysis {
  microstructure: MarketMicrostructure;
  liquidityAnalysis: LiquidityAnalysis;
  orderBookDynamics: OrderBookDynamics;
  mevAnalysis: MEVAnalysis;
  spreadOptimization: SpreadOptimization;
  executionStrategy: ExecutionStrategy;
  profitOpportunities: ProfitOpportunity[];
  risks: MarketMakingRisk[];
  recommendation: MarketMakingRecommendation;
  timestamp: Date;
}

interface MarketMicrostructure {
  tickSize: number;
  lotSize: number;
  avgSpread: number;
  volatility: number;
  orderArrivalRate: number;
  cancelRate: number;
  tradeFrequency: number;
  priceImpact: {
    buy: number;
    sell: number;
  };
  marketDepth: number;
  resilience: number; // How quickly orderbook recovers
}

interface LiquidityAnalysis {
  totalLiquidity: number;
  bidLiquidity: number;
  askLiquidity: number;
  imbalance: number; // -1 to 1, negative = bid heavy
  concentrationRisk: number; // 0-100
  liquidityProviders: number;
  avgOrderSize: number;
  largeOrderThreshold: number;
  toxicFlow: number; // Percentage of adverse selection
  inventoryTurnover: number;
}

interface OrderBookDynamics {
  levels: OrderBookLevel[];
  bidAskSpread: number;
  midPrice: number;
  microPrice: number; // Weighted by size
  bookPressure: number; // -1 to 1
  orderFlowImbalance: number;
  queuePosition: QueueAnalysis;
  spoofingDetected: boolean;
  layeringDetected: boolean;
  momentum: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

interface OrderBookLevel {
  price: number;
  bidSize: number;
  askSize: number;
  bidOrders: number;
  askOrders: number;
  depth: number;
}

interface QueueAnalysis {
  bidQueueLength: number;
  askQueueLength: number;
  expectedFillTime: number;
  queueJumpProbability: number;
}

interface MEVAnalysis {
  sandwichRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  frontrunProbability: number;
  backrunOpportunity: boolean;
  estimatedMEVCost: number;
  protectedRoutes: string[];
  flashloanArbitrage: number;
  atomicArbitrage: number;
  justInTimeProvision: boolean;
}

interface SpreadOptimization {
  optimalSpread: number;
  currentSpread: number;
  competitiveSpread: number;
  profitableSpread: number;
  spreadComponents: {
    adverseSelection: number;
    inventoryRisk: number;
    orderProcessing: number;
    competition: number;
  };
  dynamicAdjustment: {
    volatilityMultiplier: number;
    inventorySkew: number;
    timeDecay: number;
  };
}

interface ExecutionStrategy {
  strategy: 'PASSIVE' | 'AGGRESSIVE' | 'MIXED' | 'ADAPTIVE';
  orderTypes: OrderTypeRecommendation[];
  sizing: SizingStrategy;
  timing: TimingStrategy;
  routing: RoutingStrategy;
  hedging: HedgingStrategy;
  inventoryManagement: InventoryStrategy;
}

interface OrderTypeRecommendation {
  type: 'LIMIT' | 'MARKET' | 'ICEBERG' | 'TWAP' | 'VWAP' | 'PEG';
  allocation: number; // Percentage
  rationale: string;
}

interface SizingStrategy {
  baseSize: number;
  maxSize: number;
  scalingFactor: number;
  adaptiveAdjustment: boolean;
}

interface TimingStrategy {
  activeHours: string[];
  avoidPeriods: string[];
  optimalEntry: string;
  rebalanceFrequency: number; // minutes
}

interface RoutingStrategy {
  primaryVenue: string;
  backupVenues: string[];
  smartRouting: boolean;
  darkPoolAccess: boolean;
}

interface HedgingStrategy {
  enabled: boolean;
  instrument: string;
  ratio: number;
  rebalanceThreshold: number;
}

interface InventoryStrategy {
  targetInventory: number;
  maxInventory: number;
  skewLimit: number;
  rebalanceUrgency: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface ProfitOpportunity {
  type: 'SPREAD_CAPTURE' | 'REBATE' | 'ARBITRAGE' | 'MOMENTUM' | 'MEAN_REVERSION';
  estimatedProfit: number;
  probability: number;
  timeframe: string;
  requiredCapital: number;
  strategy: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface MarketMakingRisk {
  type: 'INVENTORY' | 'ADVERSE_SELECTION' | 'COMPETITION' | 'TECHNICAL' | 'REGULATORY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  mitigation: string;
  estimatedLoss: number;
}

interface MarketMakingRecommendation {
  action: 'START_MAKING' | 'INCREASE_SIZE' | 'REDUCE_SIZE' | 'STOP_MAKING' | 'ADJUST_PARAMS';
  confidence: number;
  reasoning: string[];
  expectedReturn: number; // Daily return percentage
  sharpeRatio: number;
  parameters: {
    spread: number;
    size: number;
    skewLimit: number;
    refreshRate: number; // seconds
  };
  warnings: string[];
}

export class MarketMaker extends BaseAgent {
  constructor(hiveService: IHiveService) {
    const config: AgentConfig = {
      name: 'MarketMaker',
      description: 'Market microstructure expert for liquidity provision and spread optimization',
      version: '1.0.0',
      cacheTTL: 60, // 1 minute cache for market data
      maxRetries: 3,
      timeout: 30000,
    };
    
    super(config, hiveService);
  }
  
  protected validateInput(context: AgentContext): z.ZodSchema {
    return z.object({
      symbol: z.string().optional(),
      network: z.string().optional(),
      options: z.object({
        capital: z.number().optional(),
        riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
        timeHorizon: z.enum(['minutes', 'hours', 'days']).optional(),
        venue: z.string().optional(),
        includeL2: z.boolean().optional(),
        historicalWindow: z.number().optional(),
      }).optional(),
    });
  }
  
  protected async performAnalysis(context: AgentContext): Promise<MarketMakerAnalysis> {
    this.logger.info('Starting market maker analysis', {
      symbol: context.symbol,
      network: context.network || 'ethereum',
      capital: context.options?.capital,
    });
    
    // Parallel data collection
    const [
      orderBookData,
      tradeData,
      microstructureData,
      mevData,
      historicalData,
      competitorData,
    ] = await Promise.all([
      this.getOrderBookData(context),
      this.getTradeData(context),
      this.getMicrostructureData(context),
      this.getMEVData(context),
      this.getHistoricalData(context),
      this.getCompetitorAnalysis(context),
    ]);
    
    // Analyze market microstructure
    const microstructure = this.analyzeMicrostructure(
      orderBookData,
      tradeData,
      microstructureData
    );
    
    // Perform liquidity analysis
    const liquidityAnalysis = this.analyzeLiquidity(
      orderBookData,
      tradeData,
      competitorData
    );
    
    // Analyze order book dynamics
    const orderBookDynamics = this.analyzeOrderBookDynamics(
      orderBookData,
      tradeData
    );
    
    // MEV analysis
    const mevAnalysis = this.analyzeMEV(mevData, orderBookData);
    
    // Optimize spread
    const spreadOptimization = this.optimizeSpread(
      microstructure,
      liquidityAnalysis,
      orderBookDynamics,
      context.options?.riskTolerance || 'moderate'
    );
    
    // Determine execution strategy
    const executionStrategy = this.determineExecutionStrategy(
      microstructure,
      liquidityAnalysis,
      mevAnalysis,
      context
    );
    
    // Identify profit opportunities
    const profitOpportunities = this.identifyProfitOpportunities(
      microstructure,
      orderBookDynamics,
      spreadOptimization,
      context.options?.capital || 10000
    );
    
    // Assess risks
    const risks = this.assessMarketMakingRisks(
      microstructure,
      liquidityAnalysis,
      mevAnalysis,
      competitorData
    );
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(
      spreadOptimization,
      executionStrategy,
      profitOpportunities,
      risks,
      context
    );
    
    return {
      microstructure,
      liquidityAnalysis,
      orderBookDynamics,
      mevAnalysis,
      spreadOptimization,
      executionStrategy,
      profitOpportunities,
      risks,
      recommendation,
      timestamp: new Date(),
    };
  }
  
  private async getOrderBookData(context: AgentContext): Promise<any> {
    const response = await this.hiveService.callTool('hive_orderbook', {
      symbol: context.symbol,
      venue: context.options?.venue || 'all',
      depth: context.options?.includeL2 ? 50 : 10,
      network: context.network || 'ethereum',
    });
    
    return response.data || {};
  }
  
  private async getTradeData(context: AgentContext): Promise<any> {
    const response = await this.hiveService.callTool('hive_trades', {
      symbol: context.symbol,
      limit: 1000,
      timeframe: context.options?.timeHorizon || 'hours',
      network: context.network || 'ethereum',
    });
    
    return response.data || {};
  }
  
  private async getMicrostructureData(context: AgentContext): Promise<any> {
    const response = await this.hiveService.callTool('hive_microstructure', {
      symbol: context.symbol,
      metrics: ['tick_size', 'lot_size', 'volatility', 'arrival_rate'],
      network: context.network || 'ethereum',
    });
    
    return response.data || {};
  }
  
  private async getMEVData(context: AgentContext): Promise<any> {
    const response = await this.hiveService.callTool('hive_mev', {
      symbol: context.symbol,
      analysis: ['sandwich', 'frontrun', 'arbitrage'],
      network: context.network || 'ethereum',
    });
    
    return response.data || {};
  }
  
  private async getHistoricalData(context: AgentContext): Promise<any> {
    const window = context.options?.historicalWindow || 30; // days
    
    const response = await this.hiveService.callTool('hive_historical', {
      symbol: context.symbol,
      days: window,
      metrics: ['spread', 'volume', 'volatility'],
      network: context.network || 'ethereum',
    });
    
    return response.data || {};
  }
  
  private async getCompetitorAnalysis(context: AgentContext): Promise<any> {
    const response = await this.hiveService.callTool('hive_competitors', {
      symbol: context.symbol,
      analysis: ['market_makers', 'liquidity_providers'],
      network: context.network || 'ethereum',
    });
    
    return response.data || {};
  }
  
  private analyzeMicrostructure(
    orderBook: any,
    trades: any,
    microData: any
  ): MarketMicrostructure {
    const tickSize = microData.tickSize || this.calculateTickSize(orderBook);
    const lotSize = microData.lotSize || this.calculateLotSize(trades);
    const avgSpread = this.calculateAverageSpread(orderBook);
    const volatility = microData.volatility || this.calculateVolatility(trades);
    
    const orderArrivalRate = this.calculateOrderArrivalRate(trades);
    const cancelRate = this.calculateCancelRate(orderBook, trades);
    const tradeFrequency = trades.trades?.length / (trades.timespan || 3600);
    
    const priceImpact = this.calculatePriceImpact(orderBook);
    const marketDepth = this.calculateMarketDepth(orderBook);
    const resilience = this.calculateResilience(orderBook, trades);
    
    return {
      tickSize,
      lotSize,
      avgSpread,
      volatility,
      orderArrivalRate,
      cancelRate,
      tradeFrequency,
      priceImpact,
      marketDepth,
      resilience,
    };
  }
  
  private calculateTickSize(orderBook: any): number {
    const prices = [
      ...orderBook.bids?.map((b: any) => b.price) || [],
      ...orderBook.asks?.map((a: any) => a.price) || [],
    ].sort((a, b) => a - b);
    
    if (prices.length < 2) return 0.0001;
    
    // Find minimum price difference
    let minDiff = Infinity;
    for (let i = 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
      }
    }
    
    return minDiff === Infinity ? 0.0001 : minDiff;
  }
  
  private calculateLotSize(trades: any): number {
    const sizes = trades.trades?.map((t: any) => t.size) || [];
    if (sizes.length === 0) return 1;
    
    // Find GCD of all sizes to determine lot size
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    return sizes.reduce((acc: number, size: number) => gcd(acc, size), sizes[0]);
  }
  
  private calculateAverageSpread(orderBook: any): number {
    const bestBid = orderBook.bids?.[0]?.price || 0;
    const bestAsk = orderBook.asks?.[0]?.price || 0;
    
    if (!bestBid || !bestAsk) return 0;
    
    return (bestAsk - bestBid) / ((bestAsk + bestBid) / 2) * 10000; // In basis points
  }
  
  private calculateVolatility(trades: any): number {
    const prices = trades.trades?.map((t: any) => t.price) || [];
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 252 * 24) * 100; // Annualized hourly volatility
  }
  
  private calculateOrderArrivalRate(trades: any): number {
    const timestamps = trades.trades?.map((t: any) => t.timestamp) || [];
    if (timestamps.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return avgInterval > 0 ? 3600000 / avgInterval : 0; // Orders per hour
  }
  
  private calculateCancelRate(orderBook: any, trades: any): number {
    // Estimate based on order book changes vs executed trades
    const totalOrders = (orderBook.bids?.length || 0) + (orderBook.asks?.length || 0);
    const executedTrades = trades.trades?.length || 0;
    
    if (totalOrders === 0) return 0;
    
    // Rough estimate: assume high cancel rate if many orders but few trades
    const executionRate = executedTrades / (totalOrders + executedTrades);
    return (1 - executionRate) * 100;
  }
  
  private calculatePriceImpact(orderBook: any): { buy: number; sell: number } {
    const calculateImpact = (orders: any[], size: number): number => {
      let remainingSize = size;
      let totalCost = 0;
      let basePrice = orders[0]?.price || 0;
      
      for (const order of orders) {
        if (remainingSize <= 0) break;
        const fillSize = Math.min(remainingSize, order.size);
        totalCost += fillSize * order.price;
        remainingSize -= fillSize;
      }
      
      if (remainingSize > 0 || size === 0) return 0;
      
      const avgPrice = totalCost / size;
      return Math.abs(avgPrice - basePrice) / basePrice * 10000; // In basis points
    };
    
    // Calculate for 1% of total liquidity
    const bidLiquidity = orderBook.bids?.reduce((sum: number, b: any) => sum + b.size * b.price, 0) || 0;
    const askLiquidity = orderBook.asks?.reduce((sum: number, a: any) => sum + a.size * a.price, 0) || 0;
    
    return {
      buy: calculateImpact(orderBook.asks || [], askLiquidity * 0.01),
      sell: calculateImpact(orderBook.bids || [], bidLiquidity * 0.01),
    };
  }
  
  private calculateMarketDepth(orderBook: any): number {
    const bidDepth = orderBook.bids?.reduce((sum: number, b: any) => sum + b.size * b.price, 0) || 0;
    const askDepth = orderBook.asks?.reduce((sum: number, a: any) => sum + a.size * a.price, 0) || 0;
    return bidDepth + askDepth;
  }
  
  private calculateResilience(orderBook: any, trades: any): number {
    // Estimate how quickly order book recovers after trades
    // Higher resilience = faster recovery
    const depth = this.calculateMarketDepth(orderBook);
    const tradeVolume = trades.trades?.reduce((sum: number, t: any) => sum + t.size * t.price, 0) || 0;
    
    if (tradeVolume === 0) return 100;
    
    // If depth is high relative to trade volume, market is resilient
    const ratio = depth / tradeVolume;
    return Math.min(100, ratio * 10);
  }
  
  private analyzeLiquidity(
    orderBook: any,
    trades: any,
    competitors: any
  ): LiquidityAnalysis {
    const bidLiquidity = orderBook.bids?.reduce((sum: number, b: any) => sum + b.size * b.price, 0) || 0;
    const askLiquidity = orderBook.asks?.reduce((sum: number, a: any) => sum + a.size * a.price, 0) || 0;
    const totalLiquidity = bidLiquidity + askLiquidity;
    
    const imbalance = totalLiquidity > 0 
      ? (bidLiquidity - askLiquidity) / totalLiquidity 
      : 0;
    
    const concentrationRisk = this.calculateConcentrationRisk(orderBook);
    const liquidityProviders = competitors.marketMakers?.length || 0;
    
    const avgOrderSize = this.calculateAverageOrderSize(orderBook);
    const largeOrderThreshold = avgOrderSize * 10;
    
    const toxicFlow = this.calculateToxicFlow(trades);
    const inventoryTurnover = this.calculateInventoryTurnover(trades, totalLiquidity);
    
    return {
      totalLiquidity,
      bidLiquidity,
      askLiquidity,
      imbalance,
      concentrationRisk,
      liquidityProviders,
      avgOrderSize,
      largeOrderThreshold,
      toxicFlow,
      inventoryTurnover,
    };
  }
  
  private calculateConcentrationRisk(orderBook: any): number {
    const allOrders = [
      ...orderBook.bids || [],
      ...orderBook.asks || [],
    ];
    
    if (allOrders.length === 0) return 0;
    
    // Sort by size
    allOrders.sort((a, b) => b.size - a.size);
    
    // Calculate how much of liquidity is from top 20% of orders
    const topCount = Math.ceil(allOrders.length * 0.2);
    const topLiquidity = allOrders.slice(0, topCount).reduce((sum, o) => sum + o.size * o.price, 0);
    const totalLiquidity = allOrders.reduce((sum, o) => sum + o.size * o.price, 0);
    
    return totalLiquidity > 0 ? (topLiquidity / totalLiquidity) * 100 : 0;
  }
  
  private calculateAverageOrderSize(orderBook: any): number {
    const allOrders = [
      ...orderBook.bids || [],
      ...orderBook.asks || [],
    ];
    
    if (allOrders.length === 0) return 0;
    
    const totalSize = allOrders.reduce((sum, o) => sum + o.size, 0);
    return totalSize / allOrders.length;
  }
  
  private calculateToxicFlow(trades: any): number {
    // Estimate percentage of trades that are likely informed/toxic
    // Look for patterns like large trades followed by price moves
    const trades_list = trades.trades || [];
    if (trades_list.length < 10) return 0;
    
    let toxicCount = 0;
    for (let i = 0; i < trades_list.length - 5; i++) {
      const trade = trades_list[i];
      const avgSizeBefore = trades_list.slice(Math.max(0, i - 5), i)
        .reduce((sum: number, t: any) => sum + t.size, 0) / 5;
      
      if (trade.size > avgSizeBefore * 3) {
        // Large trade detected, check if price moved
        const priceBefore = trade.price;
        const priceAfter = trades_list[i + 5].price;
        const priceMove = Math.abs(priceAfter - priceBefore) / priceBefore;
        
        if (priceMove > 0.002) { // 0.2% move
          toxicCount++;
        }
      }
    }
    
    return (toxicCount / trades_list.length) * 100;
  }
  
  private calculateInventoryTurnover(trades: any, totalLiquidity: number): number {
    if (totalLiquidity === 0) return 0;
    
    const dailyVolume = trades.trades?.reduce((sum: number, t: any) => sum + t.size * t.price, 0) || 0;
    return (dailyVolume * 24) / totalLiquidity; // Assuming hourly data
  }
  
  private analyzeOrderBookDynamics(
    orderBook: any,
    trades: any
  ): OrderBookDynamics {
    const levels = this.extractOrderBookLevels(orderBook);
    const bestBid = orderBook.bids?.[0]?.price || 0;
    const bestAsk = orderBook.asks?.[0]?.price || 0;
    
    const bidAskSpread = bestAsk - bestBid;
    const midPrice = (bestBid + bestAsk) / 2;
    const microPrice = this.calculateMicroPrice(orderBook);
    
    const bookPressure = this.calculateBookPressure(orderBook);
    const orderFlowImbalance = this.calculateOrderFlowImbalance(trades);
    const queuePosition = this.analyzeQueuePosition(orderBook);
    
    const spoofingDetected = this.detectSpoofing(orderBook, trades);
    const layeringDetected = this.detectLayering(orderBook);
    const momentum = this.determineMomentum(trades, bookPressure);
    
    return {
      levels,
      bidAskSpread,
      midPrice,
      microPrice,
      bookPressure,
      orderFlowImbalance,
      queuePosition,
      spoofingDetected,
      layeringDetected,
      momentum,
    };
  }
  
  private extractOrderBookLevels(orderBook: any): OrderBookLevel[] {
    const levels: OrderBookLevel[] = [];
    const maxLevels = 10;
    
    for (let i = 0; i < maxLevels; i++) {
      const bid = orderBook.bids?.[i];
      const ask = orderBook.asks?.[i];
      
      if (!bid && !ask) break;
      
      levels.push({
        price: bid?.price || ask?.price || 0,
        bidSize: bid?.size || 0,
        askSize: ask?.size || 0,
        bidOrders: bid?.orderCount || 0,
        askOrders: ask?.orderCount || 0,
        depth: i + 1,
      });
    }
    
    return levels;
  }
  
  private calculateMicroPrice(orderBook: any): number {
    const bestBid = orderBook.bids?.[0];
    const bestAsk = orderBook.asks?.[0];
    
    if (!bestBid || !bestAsk) return 0;
    
    // Weighted mid-price based on size
    const bidWeight = bestBid.size / (bestBid.size + bestAsk.size);
    const askWeight = bestAsk.size / (bestBid.size + bestAsk.size);
    
    return bestBid.price * askWeight + bestAsk.price * bidWeight;
  }
  
  private calculateBookPressure(orderBook: any): number {
    const bidPressure = orderBook.bids?.slice(0, 5)
      .reduce((sum: number, b: any) => sum + b.size * b.price, 0) || 0;
    const askPressure = orderBook.asks?.slice(0, 5)
      .reduce((sum: number, a: any) => sum + a.size * a.price, 0) || 0;
    
    const totalPressure = bidPressure + askPressure;
    if (totalPressure === 0) return 0;
    
    return (bidPressure - askPressure) / totalPressure; // -1 to 1
  }
  
  private calculateOrderFlowImbalance(trades: any): number {
    const recentTrades = trades.trades?.slice(-20) || [];
    if (recentTrades.length === 0) return 0;
    
    let buyVolume = 0;
    let sellVolume = 0;
    
    for (let i = 1; i < recentTrades.length; i++) {
      const trade = recentTrades[i];
      const prevPrice = recentTrades[i - 1].price;
      
      if (trade.price > prevPrice) {
        buyVolume += trade.size * trade.price;
      } else if (trade.price < prevPrice) {
        sellVolume += trade.size * trade.price;
      }
    }
    
    const totalVolume = buyVolume + sellVolume;
    if (totalVolume === 0) return 0;
    
    return (buyVolume - sellVolume) / totalVolume;
  }
  
  private analyzeQueuePosition(orderBook: any): QueueAnalysis {
    const bidQueue = orderBook.bids?.[0]?.orderCount || 0;
    const askQueue = orderBook.asks?.[0]?.orderCount || 0;
    
    // Estimate fill time based on queue position and trade frequency
    const avgTradesPerMinute = 10; // Placeholder
    const expectedFillTime = Math.max(bidQueue, askQueue) / avgTradesPerMinute * 60;
    
    // Probability of queue jumping (priority orders)
    const queueJumpProbability = this.estimateQueueJumpProbability(orderBook);
    
    return {
      bidQueueLength: bidQueue,
      askQueueLength: askQueue,
      expectedFillTime,
      queueJumpProbability,
    };
  }
  
  private estimateQueueJumpProbability(orderBook: any): number {
    // Estimate based on order size distribution
    const topBid = orderBook.bids?.[0];
    if (!topBid || !topBid.orders) return 0.1;
    
    // If there are many small orders, higher chance of jumping
    const avgOrderSize = topBid.size / topBid.orderCount;
    const smallOrderRatio = topBid.orders?.filter((o: any) => o.size < avgOrderSize).length / topBid.orderCount;
    
    return Math.min(0.5, smallOrderRatio * 0.3);
  }
  
  private detectSpoofing(orderBook: any, trades: any): boolean {
    // Look for large orders that disappear without executing
    const largeBids = orderBook.bids?.filter((b: any) => b.size > orderBook.avgSize * 5) || [];
    const largeAsks = orderBook.asks?.filter((a: any) => a.size > orderBook.avgSize * 5) || [];
    
    // If there are large orders far from mid but no recent large trades
    const recentLargeTrades = trades.trades?.filter((t: any) => t.size > orderBook.avgSize * 5) || [];
    
    return (largeBids.length > 2 || largeAsks.length > 2) && recentLargeTrades.length === 0;
  }
  
  private detectLayering(orderBook: any): boolean {
    // Look for multiple orders at incrementing price levels
    const checkLayering = (orders: any[]): boolean => {
      if (orders.length < 5) return false;
      
      let layerCount = 0;
      for (let i = 1; i < Math.min(10, orders.length); i++) {
        const sizeDiff = Math.abs(orders[i].size - orders[i - 1].size) / orders[i - 1].size;
        if (sizeDiff < 0.1) { // Similar sizes
          layerCount++;
        }
      }
      
      return layerCount > 3;
    };
    
    return checkLayering(orderBook.bids || []) || checkLayering(orderBook.asks || []);
  }
  
  private determineMomentum(trades: any, bookPressure: number): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    const recentTrades = trades.trades?.slice(-10) || [];
    if (recentTrades.length < 2) return 'NEUTRAL';
    
    const priceChange = (recentTrades[recentTrades.length - 1].price - recentTrades[0].price) / recentTrades[0].price;
    
    if (priceChange > 0.001 && bookPressure > 0.2) return 'BULLISH';
    if (priceChange < -0.001 && bookPressure < -0.2) return 'BEARISH';
    return 'NEUTRAL';
  }
  
  private analyzeMEV(mevData: any, orderBook: any): MEVAnalysis {
    const sandwichRisk = this.assessSandwichRisk(mevData, orderBook);
    const frontrunProbability = mevData.frontrunProbability || 0;
    const backrunOpportunity = mevData.backrunOpportunity || false;
    const estimatedMEVCost = this.estimateMEVCost(mevData, orderBook);
    
    const protectedRoutes = mevData.protectedRoutes || [];
    const flashloanArbitrage = mevData.flashloanArbitrage || 0;
    const atomicArbitrage = mevData.atomicArbitrage || 0;
    const justInTimeProvision = mevData.jitProvision || false;
    
    return {
      sandwichRisk,
      frontrunProbability,
      backrunOpportunity,
      estimatedMEVCost,
      protectedRoutes,
      flashloanArbitrage,
      atomicArbitrage,
      justInTimeProvision,
    };
  }
  
  private assessSandwichRisk(mevData: any, orderBook: any): 'HIGH' | 'MEDIUM' | 'LOW' {
    const slippage = this.calculateAverageSpread(orderBook);
    const mevActivity = mevData.recentSandwiches || 0;
    
    if (mevActivity > 10 || slippage > 50) return 'HIGH';
    if (mevActivity > 5 || slippage > 20) return 'MEDIUM';
    return 'LOW';
  }
  
  private estimateMEVCost(mevData: any, orderBook: any): number {
    const avgMEVExtraction = mevData.avgExtraction || 0;
    const spread = this.calculateAverageSpread(orderBook);
    
    // Estimate based on spread and historical MEV
    return avgMEVExtraction + (spread * 0.1); // Basis points
  }
  
  private optimizeSpread(
    micro: MarketMicrostructure,
    liquidity: LiquidityAnalysis,
    dynamics: OrderBookDynamics,
    riskTolerance: string
  ): SpreadOptimization {
    const currentSpread = dynamics.bidAskSpread;
    
    // Calculate spread components
    const adverseSelection = liquidity.toxicFlow * 0.01 * micro.avgSpread;
    const inventoryRisk = micro.volatility * 0.1;
    const orderProcessing = micro.tickSize * 2;
    const competition = this.calculateCompetitiveSpread(dynamics, liquidity);
    
    const spreadComponents = {
      adverseSelection,
      inventoryRisk,
      orderProcessing,
      competition,
    };
    
    // Calculate optimal spread based on risk tolerance
    let riskMultiplier = 1.0;
    if (riskTolerance === 'conservative') riskMultiplier = 1.5;
    else if (riskTolerance === 'aggressive') riskMultiplier = 0.8;
    
    const optimalSpread = (
      adverseSelection +
      inventoryRisk +
      orderProcessing +
      competition
    ) * riskMultiplier;
    
    const competitiveSpread = competition;
    const profitableSpread = optimalSpread * 1.2;
    
    // Dynamic adjustments
    const volatilityMultiplier = Math.max(1, micro.volatility / 20);
    const inventorySkew = liquidity.imbalance * 0.1;
    const timeDecay = 0.95; // Reduce spread over time
    
    const dynamicAdjustment = {
      volatilityMultiplier,
      inventorySkew,
      timeDecay,
    };
    
    return {
      optimalSpread,
      currentSpread,
      competitiveSpread,
      profitableSpread,
      spreadComponents,
      dynamicAdjustment,
    };
  }
  
  private calculateCompetitiveSpread(dynamics: OrderBookDynamics, liquidity: LiquidityAnalysis): number {
    // Estimate competitive spread based on market makers
    const baseSpread = dynamics.bidAskSpread;
    const competitionFactor = Math.max(0.5, 1 - liquidity.liquidityProviders * 0.05);
    
    return baseSpread * competitionFactor;
  }
  
  private determineExecutionStrategy(
    micro: MarketMicrostructure,
    liquidity: LiquidityAnalysis,
    mev: MEVAnalysis,
    context: AgentContext
  ): ExecutionStrategy {
    // Determine strategy based on market conditions
    let strategy: ExecutionStrategy['strategy'];
    if (liquidity.toxicFlow > 20) {
      strategy = 'PASSIVE';
    } else if (micro.volatility > 50) {
      strategy = 'ADAPTIVE';
    } else if (mev.sandwichRisk === 'HIGH') {
      strategy = 'MIXED';
    } else {
      strategy = 'AGGRESSIVE';
    }
    
    // Order type recommendations
    const orderTypes: OrderTypeRecommendation[] = [];
    if (strategy === 'PASSIVE') {
      orderTypes.push({ type: 'LIMIT', allocation: 80, rationale: 'Minimize market impact' });
      orderTypes.push({ type: 'ICEBERG', allocation: 20, rationale: 'Hide large orders' });
    } else if (strategy === 'AGGRESSIVE') {
      orderTypes.push({ type: 'LIMIT', allocation: 60, rationale: 'Capture spread' });
      orderTypes.push({ type: 'PEG', allocation: 40, rationale: 'Track market moves' });
    } else {
      orderTypes.push({ type: 'LIMIT', allocation: 50, rationale: 'Base liquidity' });
      orderTypes.push({ type: 'TWAP', allocation: 30, rationale: 'Time-weighted execution' });
      orderTypes.push({ type: 'ICEBERG', allocation: 20, rationale: 'Large order management' });
    }
    
    // Sizing strategy
    const capital = context.options?.capital || 10000;
    const sizing: SizingStrategy = {
      baseSize: capital * 0.01,
      maxSize: capital * 0.1,
      scalingFactor: 1.5,
      adaptiveAdjustment: true,
    };
    
    // Timing strategy
    const timing: TimingStrategy = {
      activeHours: ['09:00-10:00', '14:00-16:00'], // Most liquid hours
      avoidPeriods: ['00:00-01:00', '20:00-21:00'], // Low liquidity
      optimalEntry: '09:30',
      rebalanceFrequency: 15,
    };
    
    // Routing strategy
    const routing: RoutingStrategy = {
      primaryVenue: context.options?.venue || 'uniswap',
      backupVenues: ['sushiswap', 'curve'],
      smartRouting: true,
      darkPoolAccess: false,
    };
    
    // Hedging strategy
    const hedging: HedgingStrategy = {
      enabled: micro.volatility > 30,
      instrument: 'perpetual_future',
      ratio: 0.5,
      rebalanceThreshold: 0.05,
    };
    
    // Inventory management
    const inventory: InventoryStrategy = {
      targetInventory: 0,
      maxInventory: capital * 0.2,
      skewLimit: 0.3,
      rebalanceUrgency: liquidity.imbalance > 0.5 ? 'HIGH' : 'LOW',
    };
    
    return {
      strategy,
      orderTypes,
      sizing,
      timing,
      routing,
      hedging,
      inventoryManagement: inventory,
    };
  }
  
  private identifyProfitOpportunities(
    micro: MarketMicrostructure,
    dynamics: OrderBookDynamics,
    spread: SpreadOptimization,
    capital: number
  ): ProfitOpportunity[] {
    const opportunities: ProfitOpportunity[] = [];
    
    // Spread capture opportunity
    if (spread.currentSpread > spread.optimalSpread * 1.2) {
      opportunities.push({
        type: 'SPREAD_CAPTURE',
        estimatedProfit: (spread.currentSpread - spread.optimalSpread) * capital * 0.001,
        probability: 0.7,
        timeframe: '1-2 hours',
        requiredCapital: capital * 0.3,
        strategy: 'Place limit orders at optimal spread',
        risk: 'LOW',
      });
    }
    
    // Rebate opportunity
    if (micro.tradeFrequency > 100) {
      opportunities.push({
        type: 'REBATE',
        estimatedProfit: micro.tradeFrequency * 0.0001 * capital,
        probability: 0.9,
        timeframe: 'Daily',
        requiredCapital: capital * 0.5,
        strategy: 'Provide passive liquidity for maker rebates',
        risk: 'LOW',
      });
    }
    
    // Mean reversion opportunity
    if (Math.abs(dynamics.bookPressure) > 0.5) {
      opportunities.push({
        type: 'MEAN_REVERSION',
        estimatedProfit: Math.abs(dynamics.bookPressure) * capital * 0.002,
        probability: 0.6,
        timeframe: '30-60 minutes',
        requiredCapital: capital * 0.4,
        strategy: 'Trade against extreme book pressure',
        risk: 'MEDIUM',
      });
    }
    
    // Momentum opportunity
    if (dynamics.momentum !== 'NEUTRAL' && micro.volatility > 20) {
      opportunities.push({
        type: 'MOMENTUM',
        estimatedProfit: micro.volatility * 0.01 * capital,
        probability: 0.5,
        timeframe: '2-4 hours',
        requiredCapital: capital * 0.25,
        strategy: `Follow ${dynamics.momentum.toLowerCase()} momentum`,
        risk: 'HIGH',
      });
    }
    
    return opportunities;
  }
  
  private assessMarketMakingRisks(
    micro: MarketMicrostructure,
    liquidity: LiquidityAnalysis,
    mev: MEVAnalysis,
    competitors: any
  ): MarketMakingRisk[] {
    const risks: MarketMakingRisk[] = [];
    
    // Inventory risk
    if (micro.volatility > 40) {
      risks.push({
        type: 'INVENTORY',
        severity: micro.volatility > 60 ? 'HIGH' : 'MEDIUM',
        description: `High volatility (${micro.volatility.toFixed(1)}%) increases inventory risk`,
        mitigation: 'Reduce position sizes and increase rebalancing frequency',
        estimatedLoss: micro.volatility * 100,
      });
    }
    
    // Adverse selection risk
    if (liquidity.toxicFlow > 15) {
      risks.push({
        type: 'ADVERSE_SELECTION',
        severity: liquidity.toxicFlow > 25 ? 'HIGH' : 'MEDIUM',
        description: `${liquidity.toxicFlow.toFixed(1)}% of flow is toxic/informed`,
        mitigation: 'Widen spreads and reduce quote sizes for large orders',
        estimatedLoss: liquidity.toxicFlow * 50,
      });
    }
    
    // Competition risk
    if (liquidity.liquidityProviders > 10) {
      risks.push({
        type: 'COMPETITION',
        severity: 'MEDIUM',
        description: `${liquidity.liquidityProviders} market makers competing`,
        mitigation: 'Focus on niche strategies or time periods',
        estimatedLoss: 200,
      });
    }
    
    // Technical risk (MEV)
    if (mev.sandwichRisk === 'HIGH') {
      risks.push({
        type: 'TECHNICAL',
        severity: 'HIGH',
        description: 'High risk of MEV sandwich attacks',
        mitigation: 'Use private mempools and MEV protection',
        estimatedLoss: mev.estimatedMEVCost * 100,
      });
    }
    
    return risks;
  }
  
  private generateRecommendation(
    spread: SpreadOptimization,
    execution: ExecutionStrategy,
    opportunities: ProfitOpportunity[],
    risks: MarketMakingRisk[],
    context: AgentContext
  ): MarketMakingRecommendation {
    const highRisks = risks.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL');
    const totalExpectedProfit = opportunities.reduce((sum, o) => sum + o.estimatedProfit * o.probability, 0);
    const totalExpectedLoss = risks.reduce((sum, r) => sum + r.estimatedLoss, 0);
    
    // Determine action
    let action: MarketMakingRecommendation['action'];
    let confidence = 70;
    
    if (highRisks.length > 2) {
      action = 'STOP_MAKING';
      confidence = 90;
    } else if (totalExpectedProfit > totalExpectedLoss * 2) {
      action = 'START_MAKING';
      confidence = 80;
    } else if (totalExpectedProfit > totalExpectedLoss) {
      action = execution.strategy === 'AGGRESSIVE' ? 'INCREASE_SIZE' : 'ADJUST_PARAMS';
      confidence = 65;
    } else {
      action = 'REDUCE_SIZE';
      confidence = 75;
    }
    
    // Generate reasoning
    const reasoning: string[] = [];
    if (opportunities.length > 0) {
      reasoning.push(`${opportunities.length} profit opportunities identified`);
    }
    if (highRisks.length > 0) {
      reasoning.push(`${highRisks.length} high-severity risks present`);
    }
    reasoning.push(`Optimal spread: ${spread.optimalSpread.toFixed(2)} vs current: ${spread.currentSpread.toFixed(2)}`);
    reasoning.push(`Recommended strategy: ${execution.strategy}`);
    
    // Calculate metrics
    const capital = context.options?.capital || 10000;
    const expectedReturn = (totalExpectedProfit - totalExpectedLoss) / capital * 100;
    const sharpeRatio = totalExpectedLoss > 0 
      ? (totalExpectedProfit - totalExpectedLoss) / Math.sqrt(totalExpectedLoss)
      : 1.5;
    
    // Set parameters
    const parameters = {
      spread: spread.optimalSpread,
      size: execution.sizing.baseSize,
      skewLimit: execution.inventoryManagement.skewLimit,
      refreshRate: 5, // seconds
    };
    
    // Generate warnings
    const warnings: string[] = [];
    if (risks.some(r => r.type === 'ADVERSE_SELECTION')) {
      warnings.push('High toxic flow detected - monitor closely');
    }
    if (execution.inventoryManagement.rebalanceUrgency === 'HIGH') {
      warnings.push('Inventory imbalance requires immediate attention');
    }
    
    return {
      action,
      confidence,
      reasoning,
      expectedReturn,
      sharpeRatio,
      parameters,
      warnings,
    };
  }
}