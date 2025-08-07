import { z } from 'zod';
import { BaseAgent, AgentContext, AgentConfig } from '../base/BaseAgent';
import { IHiveService } from '../../interfaces/IHiveService';

interface MarketStructureAnalystResult {
  marketProfile: MarketProfile;
  orderFlow: OrderFlowAnalysis;
  liquidityMap: LiquidityMap;
  microstructure: MicrostructureMetrics;
  manipulation: ManipulationDetection;
  predictions: MarketPrediction[];
  tradingSignals: TradingSignal[];
  analysisTime: Date;
}

interface MarketProfile {
  marketType: 'TRENDING' | 'RANGING' | 'VOLATILE' | 'ACCUMULATION' | 'DISTRIBUTION';
  phase: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'TRANSITIONING';
  strength: number; // 0-100
  confidence: number; // 0-100
  keyLevels: PriceLevel[];
  volumeProfile: VolumeProfile;
  marketDepth: MarketDepth;
  dominantParticipants: 'RETAIL' | 'WHALES' | 'MARKET_MAKERS' | 'MIXED';
}

interface PriceLevel {
  price: number;
  type: 'SUPPORT' | 'RESISTANCE' | 'PIVOT' | 'PSYCHOLOGICAL';
  strength: number;
  touches: number;
  lastTest: Date;
  volume: number;
}

interface VolumeProfile {
  poc: number; // Point of Control
  vah: number; // Value Area High
  val: number; // Value Area Low
  volumeNodes: VolumeNode[];
  imbalances: Imbalance[];
}

interface VolumeNode {
  price: number;
  volume: number;
  type: 'HVN' | 'LVN'; // High/Low Volume Node
  significance: number;
}

interface Imbalance {
  startPrice: number;
  endPrice: number;
  type: 'GAP' | 'FVG' | 'BISI' | 'SIBI'; // Fair Value Gap, Buy/Sell Side Imbalance
  created: Date;
  filled: boolean;
  strength: number;
}

interface MarketDepth {
  bidLiquidity: number;
  askLiquidity: number;
  imbalanceRatio: number;
  spreadBps: number;
  depthChart: DepthLevel[];
  liquidityHoles: LiquidityHole[];
}

interface DepthLevel {
  price: number;
  bidSize: number;
  askSize: number;
  cumBidSize: number;
  cumAskSize: number;
}

interface LiquidityHole {
  startPrice: number;
  endPrice: number;
  size: number;
  side: 'BID' | 'ASK';
  exploitable: boolean;
}

interface OrderFlowAnalysis {
  aggression: AggressionMetrics;
  toxicity: ToxicityMetrics;
  footprint: OrderFootprint;
  clusters: OrderCluster[];
  sweeps: SweepEvent[];
  icebergs: IcebergOrder[];
}

interface AggressionMetrics {
  buyAggression: number;
  sellAggression: number;
  netAggression: number;
  aggressionTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  largeOrderRatio: number;
}

interface ToxicityMetrics {
  toxicityScore: number; // 0-100
  adverseSelection: number;
  informedFlow: number;
  noiseRatio: number;
  smartMoneyFlow: 'BUYING' | 'SELLING' | 'NEUTRAL';
}

interface OrderFootprint {
  deltaProfile: DeltaBar[];
  cumulativeDelta: number;
  deltaDivergence: boolean;
  absorptionLevels: AbsorptionLevel[];
}

interface DeltaBar {
  time: Date;
  price: number;
  delta: number;
  volume: number;
  type: 'BUYING' | 'SELLING' | 'NEUTRAL';
}

interface AbsorptionLevel {
  price: number;
  volume: number;
  side: 'BID' | 'ASK';
  strength: number;
  held: boolean;
}

interface OrderCluster {
  price: number;
  timeStart: Date;
  timeEnd: Date;
  orderCount: number;
  totalVolume: number;
  avgSize: number;
  participant: 'WHALE' | 'RETAIL' | 'BOT' | 'MARKET_MAKER';
}

interface SweepEvent {
  time: Date;
  side: 'BUY' | 'SELL';
  levels: number;
  volume: number;
  impact: number;
  aggressive: boolean;
}

interface IcebergOrder {
  price: number;
  estimatedSize: number;
  visibleSize: number;
  side: 'BID' | 'ASK';
  completion: number;
  detected: Date;
}

interface LiquidityMap {
  heatmap: LiquidityHeatmap[];
  liquidationLevels: LiquidationLevel[];
  magnetZones: MagnetZone[];
  voids: LiquidityVoid[];
  providers: LiquidityProvider[];
}

interface LiquidityHeatmap {
  price: number;
  liquidity: number;
  density: number;
  change24h: number;
  stable: boolean;
}

interface LiquidationLevel {
  price: number;
  volume: number;
  leverage: number;
  side: 'LONG' | 'SHORT';
  cascade: boolean;
  estimatedImpact: number;
}

interface MagnetZone {
  price: number;
  strength: number;
  type: 'ATTRACTION' | 'REPULSION';
  reason: string;
  probability: number;
}

interface LiquidityVoid {
  startPrice: number;
  endPrice: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  fillProbability: number;
}

interface LiquidityProvider {
  address: string;
  type: 'AMM' | 'MARKET_MAKER' | 'ARBITRAGEUR';
  share: number;
  activeRanges: PriceRange[];
  efficiency: number;
}

interface PriceRange {
  min: number;
  max: number;
}

interface MicrostructureMetrics {
  spread: SpreadAnalysis;
  slippage: SlippageModel;
  impact: ImpactModel;
  efficiency: MarketEfficiency;
  anomalies: Anomaly[];
}

interface SpreadAnalysis {
  current: number;
  average: number;
  volatility: number;
  components: SpreadComponents;
  regime: 'TIGHT' | 'NORMAL' | 'WIDE' | 'UNSTABLE';
}

interface SpreadComponents {
  adverse: number;
  inventory: number;
  processing: number;
}

interface SlippageModel {
  expectedSlippage: Map<number, number>; // size -> slippage
  worstCase: Map<number, number>;
  optimalSize: number;
  splitStrategy: SplitStrategy;
}

interface SplitStrategy {
  chunks: number;
  timing: string;
  venues: string[];
}

interface ImpactModel {
  temporary: number;
  permanent: number;
  decay: number;
  recovery: number;
}

interface MarketEfficiency {
  score: number; // 0-100
  arbitrageOpportunities: number;
  mispricings: Mispricing[];
  inefficiencies: string[];
}

interface Mispricing {
  type: 'SPOT_FUTURES' | 'CROSS_EXCHANGE' | 'TRIANGULAR';
  size: number;
  duration: number;
  exploitable: boolean;
}

interface Anomaly {
  type: 'SPOOFING' | 'LAYERING' | 'WASH_TRADING' | 'PUMP_DUMP' | 'UNUSUAL_VOLUME';
  confidence: number;
  evidence: string[];
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface ManipulationDetection {
  detected: boolean;
  confidence: number;
  patterns: ManipulationPattern[];
  actors: SuspiciousActor[];
  warnings: string[];
}

interface ManipulationPattern {
  type: string;
  startTime: Date;
  endTime?: Date;
  ongoing: boolean;
  addresses: string[];
  estimatedProfit: number;
  victimCount: number;
}

interface SuspiciousActor {
  address: string;
  score: number;
  patterns: string[];
  volume: number;
  profitability: number;
}

interface MarketPrediction {
  timeframe: string;
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  target: number;
  confidence: number;
  reasoning: string[];
  risks: string[];
}

interface TradingSignal {
  type: 'ENTRY' | 'EXIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  size: number;
  confidence: number;
  reasoning: string;
  riskReward: number;
  timeframe: string;
}

export class MarketStructureAnalyst extends BaseAgent {
  constructor(hiveService: IHiveService) {
    const config: AgentConfig = {
      name: 'MarketStructureAnalyst',
      description: 'Dissects market microstructure for alpha extraction',
      version: '1.0.0',
      cacheTTL: 60, // 1 minute cache for market data
      maxRetries: 3,
      timeout: 30000,
    };
    
    super(config, hiveService);
  }
  
  protected validateInput(context: AgentContext): z.ZodSchema {
    return z.object({
      asset: z.string(),
      exchange: z.string().optional(),
      options: z.object({
        depth: z.enum(['basic', 'advanced', 'professional']).optional(),
        timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']).optional(),
        includeOrderBook: z.boolean().optional(),
        includeTrades: z.boolean().optional(),
        includeWhales: z.boolean().optional(),
        detectManipulation: z.boolean().optional(),
      }).optional(),
    });
  }
  
  protected async performAnalysis(context: AgentContext): Promise<MarketStructureAnalystResult> {
    this.logger.info('Starting market structure analysis', {
      asset: context.asset,
      exchange: context.exchange || 'all',
      depth: context.options?.depth || 'advanced',
    });
    
    // Parallel data collection
    const [
      orderBookData,
      tradeData,
      volumeData,
      liquidationData,
      whaleData,
      historicalData,
    ] = await Promise.all([
      this.getOrderBookData(context),
      this.getTradeData(context),
      this.getVolumeData(context),
      this.getLiquidationData(context),
      this.getWhaleData(context),
      this.getHistoricalData(context),
    ]);
    
    // Analyze market profile
    const marketProfile = this.analyzeMarketProfile(
      orderBookData,
      volumeData,
      tradeData,
      historicalData
    );
    
    // Analyze order flow
    const orderFlow = this.analyzeOrderFlow(
      tradeData,
      orderBookData,
      whaleData
    );
    
    // Map liquidity
    const liquidityMap = this.mapLiquidity(
      orderBookData,
      liquidationData,
      volumeData
    );
    
    // Analyze microstructure
    const microstructure = this.analyzeMicrostructure(
      orderBookData,
      tradeData,
      historicalData
    );
    
    // Detect manipulation
    const manipulation = context.options?.detectManipulation !== false
      ? this.detectManipulation(tradeData, orderBookData, whaleData)
      : { detected: false, confidence: 0, patterns: [], actors: [], warnings: [] };
    
    // Generate predictions
    const predictions = this.generatePredictions(
      marketProfile,
      orderFlow,
      liquidityMap,
      microstructure
    );
    
    // Generate trading signals
    const tradingSignals = this.generateTradingSignals(
      marketProfile,
      orderFlow,
      liquidityMap,
      predictions,
      context
    );
    
    return {
      marketProfile,
      orderFlow,
      liquidityMap,
      microstructure,
      manipulation,
      predictions,
      tradingSignals,
      analysisTime: new Date(),
    };
  }
  
  private async getOrderBookData(context: AgentContext): Promise<any> {
    const response = await this.hiveService.request('/market/orderbook', {
      asset: context.asset,
      exchange: context.exchange,
      depth: 1000,
      includeHistory: true,
    });
    
    return response.data;
  }
  
  private async getTradeData(context: AgentContext): Promise<any[]> {
    const response = await this.hiveService.request('/market/trades', {
      asset: context.asset,
      exchange: context.exchange,
      limit: 10000,
      timeframe: context.options?.timeframe || '1h',
    });
    
    return response.data as any[];
  }
  
  private async getVolumeData(context: AgentContext): Promise<any> {
    const response = await this.hiveService.request('/market/volume', {
      asset: context.asset,
      includeProfile: true,
      timeframe: context.options?.timeframe || '1h',
    });
    
    return response.data;
  }
  
  private async getLiquidationData(context: AgentContext): Promise<any> {
    const response = await this.hiveService.request('/market/liquidations', {
      asset: context.asset,
      includePredicted: true,
    });
    
    return response.data;
  }
  
  private async getWhaleData(context: AgentContext): Promise<any[]> {
    if (!context.options?.includeWhales) return [];
    
    const response = await this.hiveService.request('/whales/activity', {
      asset: context.asset,
      includeOrderFlow: true,
      timeframe: '24h',
    });
    
    return response.data as any[];
  }
  
  private async getHistoricalData(context: AgentContext): Promise<any> {
    const response = await this.hiveService.request('/market/historical', {
      asset: context.asset,
      metrics: ['price', 'volume', 'volatility', 'spread'],
      timeframe: '30d',
    });
    
    return response.data;
  }
  
  private analyzeMarketProfile(
    orderBook: any,
    volumeData: any,
    trades: any[],
    historical: any
  ): MarketProfile {
    const keyLevels = this.identifyKeyLevels(orderBook, volumeData, historical);
    const volumeProfile = this.buildVolumeProfile(volumeData, trades);
    const marketDepth = this.analyzeMarketDepth(orderBook);
    const marketType = this.determineMarketType(historical, volumeProfile);
    const phase = this.determineMarketPhase(trades, historical);
    const dominantParticipants = this.identifyDominantParticipants(trades);
    
    const strength = this.calculateMarketStrength(volumeProfile, marketDepth, trades);
    const confidence = this.calculateConfidence(keyLevels, volumeProfile, marketDepth);
    
    return {
      marketType,
      phase,
      strength,
      confidence,
      keyLevels,
      volumeProfile,
      marketDepth,
      dominantParticipants,
    };
  }
  
  private identifyKeyLevels(orderBook: any, volumeData: any, historical: any): PriceLevel[] {
    const levels: PriceLevel[] = [];
    const currentPrice = orderBook.midPrice || 0;
    
    // Support and resistance from order book
    const orderLevels = this.findOrderBookLevels(orderBook);
    orderLevels.forEach(level => {
      levels.push({
        price: level.price,
        type: level.price < currentPrice ? 'SUPPORT' : 'RESISTANCE',
        strength: level.strength,
        touches: level.touches || 0,
        lastTest: new Date(),
        volume: level.volume,
      });
    });
    
    // Volume profile levels
    const volumeLevels = this.findVolumeLevels(volumeData);
    volumeLevels.forEach(level => {
      if (!levels.find(l => Math.abs(l.price - level.price) < level.price * 0.001)) {
        levels.push({
          price: level.price,
          type: 'PIVOT',
          strength: level.strength,
          touches: 0,
          lastTest: new Date(),
          volume: level.volume,
        });
      }
    });
    
    // Psychological levels
    const psychLevels = this.findPsychologicalLevels(currentPrice);
    psychLevels.forEach(price => {
      if (!levels.find(l => Math.abs(l.price - price) < price * 0.001)) {
        levels.push({
          price,
          type: 'PSYCHOLOGICAL',
          strength: 50,
          touches: 0,
          lastTest: new Date(),
          volume: 0,
        });
      }
    });
    
    return levels.sort((a, b) => b.strength - a.strength).slice(0, 20);
  }
  
  private findOrderBookLevels(orderBook: any): any[] {
    const levels: any[] = [];
    const bids = orderBook.bids || [];
    const asks = orderBook.asks || [];
    
    // Find clusters in order book
    const findClusters = (orders: any[], side: string) => {
      let i = 0;
      while (i < orders.length) {
        let clusterVolume = orders[i].size;
        let j = i + 1;
        
        while (j < orders.length && 
               Math.abs(orders[j].price - orders[i].price) / orders[i].price < 0.005) {
          clusterVolume += orders[j].size;
          j++;
        }
        
        if (clusterVolume > orderBook.avgSize * 10) {
          levels.push({
            price: orders[i].price,
            volume: clusterVolume,
            strength: Math.min(100, (clusterVolume / orderBook.avgSize) * 5),
            side,
          });
        }
        
        i = j;
      }
    };
    
    findClusters(bids, 'bid');
    findClusters(asks, 'ask');
    
    return levels;
  }
  
  private findVolumeLevels(volumeData: any): any[] {
    const levels: any[] = [];
    const profile = volumeData.profile || [];
    
    // Find high volume nodes
    const avgVolume = profile.reduce((sum: number, p: any) => sum + p.volume, 0) / profile.length;
    
    profile.forEach((node: any) => {
      if (node.volume > avgVolume * 2) {
        levels.push({
          price: node.price,
          volume: node.volume,
          strength: Math.min(100, (node.volume / avgVolume) * 30),
        });
      }
    });
    
    return levels;
  }
  
  private findPsychologicalLevels(currentPrice: number): number[] {
    const levels: number[] = [];
    const roundNumbers = [100, 500, 1000, 5000, 10000];
    
    roundNumbers.forEach(round => {
      const nearestRound = Math.round(currentPrice / round) * round;
      if (Math.abs(nearestRound - currentPrice) / currentPrice < 0.1) {
        levels.push(nearestRound);
      }
    });
    
    return levels;
  }
  
  private buildVolumeProfile(volumeData: any, trades: any[]): VolumeProfile {
    const profile = volumeData.profile || [];
    
    // Calculate POC, VAH, VAL
    const sortedByVolume = [...profile].sort((a, b) => b.volume - a.volume);
    const poc = sortedByVolume[0]?.price || 0;
    
    const totalVolume = profile.reduce((sum: number, p: any) => sum + p.volume, 0);
    const valueAreaVolume = totalVolume * 0.7;
    
    let accumulatedVolume = 0;
    let valueAreaNodes = [];
    for (const node of sortedByVolume) {
      accumulatedVolume += node.volume;
      valueAreaNodes.push(node);
      if (accumulatedVolume >= valueAreaVolume) break;
    }
    
    const vah = Math.max(...valueAreaNodes.map(n => n.price));
    const val = Math.min(...valueAreaNodes.map(n => n.price));
    
    // Identify volume nodes
    const volumeNodes = profile.map((node: any) => ({
      price: node.price,
      volume: node.volume,
      type: node.volume > totalVolume / profile.length * 1.5 ? 'HVN' : 'LVN',
      significance: (node.volume / totalVolume) * 100,
    }));
    
    // Find imbalances
    const imbalances = this.findImbalances(trades);
    
    return {
      poc,
      vah,
      val,
      volumeNodes,
      imbalances,
    };
  }
  
  private findImbalances(trades: any[]): Imbalance[] {
    const imbalances: Imbalance[] = [];
    
    // Group trades by price levels
    const priceLevels = new Map<number, any[]>();
    trades.forEach(trade => {
      const roundedPrice = Math.round(trade.price * 100) / 100;
      if (!priceLevels.has(roundedPrice)) {
        priceLevels.set(roundedPrice, []);
      }
      priceLevels.get(roundedPrice)!.push(trade);
    });
    
    // Find gaps and imbalances
    const sortedPrices = Array.from(priceLevels.keys()).sort((a, b) => a - b);
    
    for (let i = 1; i < sortedPrices.length; i++) {
      const gap = sortedPrices[i] - sortedPrices[i - 1];
      const expectedGap = sortedPrices[i - 1] * 0.001; // 0.1% expected gap
      
      if (gap > expectedGap * 3) {
        imbalances.push({
          startPrice: sortedPrices[i - 1],
          endPrice: sortedPrices[i],
          type: 'GAP',
          created: new Date(),
          filled: false,
          strength: Math.min(100, (gap / expectedGap) * 10),
        });
      }
    }
    
    return imbalances;
  }
  
  private analyzeMarketDepth(orderBook: any): MarketDepth {
    const bids = orderBook.bids || [];
    const asks = orderBook.asks || [];
    
    const bidLiquidity = bids.reduce((sum: number, b: any) => sum + b.size, 0);
    const askLiquidity = asks.reduce((sum: number, b: any) => sum + b.size, 0);
    const imbalanceRatio = bidLiquidity / (askLiquidity || 1);
    
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    const spreadBps = ((bestAsk - bestBid) / bestBid) * 10000;
    
    // Build depth chart
    const depthChart: DepthLevel[] = [];
    let cumBidSize = 0;
    let cumAskSize = 0;
    
    for (let i = 0; i < Math.min(50, Math.max(bids.length, asks.length)); i++) {
      const bid = bids[i];
      const ask = asks[i];
      
      if (bid) cumBidSize += bid.size;
      if (ask) cumAskSize += ask.size;
      
      depthChart.push({
        price: bid?.price || ask?.price || 0,
        bidSize: bid?.size || 0,
        askSize: ask?.size || 0,
        cumBidSize,
        cumAskSize,
      });
    }
    
    // Find liquidity holes
    const liquidityHoles = this.findLiquidityHoles(bids, asks);
    
    return {
      bidLiquidity,
      askLiquidity,
      imbalanceRatio,
      spreadBps,
      depthChart,
      liquidityHoles,
    };
  }
  
  private findLiquidityHoles(bids: any[], asks: any[]): LiquidityHole[] {
    const holes: LiquidityHole[] = [];
    
    const findHoles = (orders: any[], side: 'BID' | 'ASK') => {
      for (let i = 1; i < orders.length; i++) {
        const gap = Math.abs(orders[i].price - orders[i - 1].price);
        const expectedGap = orders[i - 1].price * 0.0001; // 0.01% expected gap
        
        if (gap > expectedGap * 10) {
          holes.push({
            startPrice: orders[i - 1].price,
            endPrice: orders[i].price,
            size: gap,
            side,
            exploitable: gap > expectedGap * 20,
          });
        }
      }
    };
    
    findHoles(bids, 'BID');
    findHoles(asks, 'ASK');
    
    return holes;
  }
  
  private determineMarketType(historical: any, volumeProfile: VolumeProfile): 
    'TRENDING' | 'RANGING' | 'VOLATILE' | 'ACCUMULATION' | 'DISTRIBUTION' {
    const volatility = historical.volatility || 0;
    const trend = historical.trend || 0;
    const volumeTrend = historical.volumeTrend || 0;
    
    if (Math.abs(trend) > 0.5 && volatility < 30) return 'TRENDING';
    if (volatility > 50) return 'VOLATILE';
    if (Math.abs(trend) < 0.1 && volatility < 20) return 'RANGING';
    if (volumeTrend > 0 && trend < 0) return 'ACCUMULATION';
    if (volumeTrend < 0 && trend > 0) return 'DISTRIBUTION';
    
    return 'RANGING';
  }
  
  private determineMarketPhase(trades: any[], historical: any): 
    'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'TRANSITIONING' {
    const recentTrades = trades.slice(-100);
    const buyVolume = recentTrades.filter(t => t.side === 'buy').reduce((sum, t) => sum + t.size, 0);
    const sellVolume = recentTrades.filter(t => t.side === 'sell').reduce((sum, t) => sum + t.size, 0);
    
    const buyRatio = buyVolume / (buyVolume + sellVolume);
    const momentum = historical.momentum || 0;
    
    if (buyRatio > 0.6 && momentum > 0) return 'BULLISH';
    if (buyRatio < 0.4 && momentum < 0) return 'BEARISH';
    if (Math.abs(momentum) > 0.5 && Math.abs(buyRatio - 0.5) < 0.1) return 'TRANSITIONING';
    
    return 'NEUTRAL';
  }
  
  private identifyDominantParticipants(trades: any[]): 
    'RETAIL' | 'WHALES' | 'MARKET_MAKERS' | 'MIXED' {
    const avgSize = trades.reduce((sum, t) => sum + t.size, 0) / trades.length;
    const largeTradesCount = trades.filter(t => t.size > avgSize * 10).length;
    const smallTradesCount = trades.filter(t => t.size < avgSize * 0.1).length;
    
    const largeTradeRatio = largeTradesCount / trades.length;
    const smallTradeRatio = smallTradesCount / trades.length;
    
    if (largeTradeRatio > 0.2) return 'WHALES';
    if (smallTradeRatio > 0.5) return 'RETAIL';
    if (Math.abs(largeTradeRatio - smallTradeRatio) < 0.1) return 'MARKET_MAKERS';
    
    return 'MIXED';
  }
  
  private calculateMarketStrength(
    volumeProfile: VolumeProfile,
    marketDepth: MarketDepth,
    trades: any[]
  ): number {
    let strength = 50;
    
    // Volume strength
    const recentVolume = trades.slice(-100).reduce((sum, t) => sum + t.size, 0);
    const avgVolume = trades.reduce((sum, t) => sum + t.size, 0) / trades.length;
    if (recentVolume > avgVolume * 1.5) strength += 15;
    else if (recentVolume < avgVolume * 0.5) strength -= 15;
    
    // Depth strength
    if (marketDepth.imbalanceRatio > 1.5) strength += 10;
    else if (marketDepth.imbalanceRatio < 0.67) strength -= 10;
    
    // Spread strength
    if (marketDepth.spreadBps < 10) strength += 10;
    else if (marketDepth.spreadBps > 50) strength -= 10;
    
    return Math.max(0, Math.min(100, strength));
  }
  
  private calculateConfidence(
    keyLevels: PriceLevel[],
    volumeProfile: VolumeProfile,
    marketDepth: MarketDepth
  ): number {
    let confidence = 60;
    
    // Key levels confidence
    const strongLevels = keyLevels.filter(l => l.strength > 70).length;
    confidence += strongLevels * 2;
    
    // Volume profile confidence
    if (volumeProfile.volumeNodes.length > 10) confidence += 10;
    
    // Market depth confidence
    if (marketDepth.liquidityHoles.length < 3) confidence += 10;
    
    return Math.min(100, confidence);
  }
  
  private analyzeOrderFlow(
    trades: any[],
    orderBook: any,
    whaleData: any[]
  ): OrderFlowAnalysis {
    const aggression = this.calculateAggression(trades);
    const toxicity = this.calculateToxicity(trades, orderBook);
    const footprint = this.buildOrderFootprint(trades);
    const clusters = this.findOrderClusters(trades);
    const sweeps = this.detectSweeps(trades, orderBook);
    const icebergs = this.detectIcebergs(trades, orderBook);
    
    return {
      aggression,
      toxicity,
      footprint,
      clusters,
      sweeps,
      icebergs,
    };
  }
  
  private calculateAggression(trades: any[]): AggressionMetrics {
    const buyTrades = trades.filter(t => t.side === 'buy');
    const sellTrades = trades.filter(t => t.side === 'sell');
    
    const buyAggression = buyTrades.filter(t => t.aggressive).length / buyTrades.length * 100;
    const sellAggression = sellTrades.filter(t => t.aggressive).length / sellTrades.length * 100;
    const netAggression = buyAggression - sellAggression;
    
    // Calculate trend
    const recentAggression = this.calculateAggression(trades.slice(-100)).netAggression;
    const historicalAggression = netAggression;
    const aggressionTrend = recentAggression > historicalAggression ? 'INCREASING' :
                           recentAggression < historicalAggression ? 'DECREASING' : 'STABLE';
    
    const avgSize = trades.reduce((sum, t) => sum + t.size, 0) / trades.length;
    const largeOrderRatio = trades.filter(t => t.size > avgSize * 5).length / trades.length;
    
    return {
      buyAggression,
      sellAggression,
      netAggression,
      aggressionTrend,
      largeOrderRatio,
    };
  }
  
  private calculateToxicity(trades: any[], orderBook: any): ToxicityMetrics {
    // Simplified toxicity calculation
    const toxicityScore = 30; // Base score
    const adverseSelection = 20;
    const informedFlow = 40;
    const noiseRatio = 0.3;
    
    const buyVolume = trades.filter(t => t.side === 'buy').reduce((sum, t) => sum + t.size, 0);
    const sellVolume = trades.filter(t => t.side === 'sell').reduce((sum, t) => sum + t.size, 0);
    
    const smartMoneyFlow = buyVolume > sellVolume * 1.5 ? 'BUYING' :
                          sellVolume > buyVolume * 1.5 ? 'SELLING' : 'NEUTRAL';
    
    return {
      toxicityScore,
      adverseSelection,
      informedFlow,
      noiseRatio,
      smartMoneyFlow,
    };
  }
  
  private buildOrderFootprint(trades: any[]): OrderFootprint {
    const deltaProfile: DeltaBar[] = [];
    let cumulativeDelta = 0;
    
    // Group trades by time bars
    const timeBars = this.groupTradesByTime(trades, 60000); // 1 minute bars
    
    timeBars.forEach(bar => {
      const buyVolume = bar.filter(t => t.side === 'buy').reduce((sum, t) => sum + t.size, 0);
      const sellVolume = bar.filter(t => t.side === 'sell').reduce((sum, t) => sum + t.size, 0);
      const delta = buyVolume - sellVolume;
      cumulativeDelta += delta;
      
      deltaProfile.push({
        time: new Date(bar[0].timestamp),
        price: bar.reduce((sum, t) => sum + t.price, 0) / bar.length,
        delta,
        volume: buyVolume + sellVolume,
        type: delta > 0 ? 'BUYING' : delta < 0 ? 'SELLING' : 'NEUTRAL',
      });
    });
    
    const deltaDivergence = this.detectDeltaDivergence(deltaProfile);
    const absorptionLevels = this.findAbsorptionLevels(trades);
    
    return {
      deltaProfile,
      cumulativeDelta,
      deltaDivergence,
      absorptionLevels,
    };
  }
  
  private groupTradesByTime(trades: any[], interval: number): any[][] {
    const groups: any[][] = [];
    let currentGroup: any[] = [];
    let groupStart = trades[0]?.timestamp || Date.now();
    
    trades.forEach(trade => {
      if (trade.timestamp - groupStart > interval) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [trade];
        groupStart = trade.timestamp;
      } else {
        currentGroup.push(trade);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  }
  
  private detectDeltaDivergence(deltaProfile: DeltaBar[]): boolean {
    if (deltaProfile.length < 10) return false;
    
    const recent = deltaProfile.slice(-10);
    const priceDirection = recent[recent.length - 1].price - recent[0].price;
    const deltaDirection = recent[recent.length - 1].delta - recent[0].delta;
    
    // Divergence when price and delta move in opposite directions
    return (priceDirection > 0 && deltaDirection < 0) || 
           (priceDirection < 0 && deltaDirection > 0);
  }
  
  private findAbsorptionLevels(trades: any[]): AbsorptionLevel[] {
    // Simplified absorption detection
    return [];
  }
  
  private findOrderClusters(trades: any[]): OrderCluster[] {
    // Simplified cluster detection
    return [];
  }
  
  private detectSweeps(trades: any[], orderBook: any): SweepEvent[] {
    // Simplified sweep detection
    return [];
  }
  
  private detectIcebergs(trades: any[], orderBook: any): IcebergOrder[] {
    // Simplified iceberg detection
    return [];
  }
  
  private mapLiquidity(
    orderBook: any,
    liquidationData: any,
    volumeData: any
  ): LiquidityMap {
    const heatmap = this.buildLiquidityHeatmap(orderBook);
    const liquidationLevels = this.identifyLiquidationLevels(liquidationData);
    const magnetZones = this.identifyMagnetZones(heatmap, liquidationLevels);
    const voids = this.identifyLiquidityVoids(heatmap);
    const providers = this.identifyLiquidityProviders(orderBook);
    
    return {
      heatmap,
      liquidationLevels,
      magnetZones,
      voids,
      providers,
    };
  }
  
  private buildLiquidityHeatmap(orderBook: any): LiquidityHeatmap[] {
    // Simplified heatmap
    return [];
  }
  
  private identifyLiquidationLevels(liquidationData: any): LiquidationLevel[] {
    // Simplified liquidation levels
    return [];
  }
  
  private identifyMagnetZones(
    heatmap: LiquidityHeatmap[],
    liquidationLevels: LiquidationLevel[]
  ): MagnetZone[] {
    // Simplified magnet zones
    return [];
  }
  
  private identifyLiquidityVoids(heatmap: LiquidityHeatmap[]): LiquidityVoid[] {
    // Simplified voids
    return [];
  }
  
  private identifyLiquidityProviders(orderBook: any): LiquidityProvider[] {
    // Simplified providers
    return [];
  }
  
  private analyzeMicrostructure(
    orderBook: any,
    trades: any[],
    historical: any
  ): MicrostructureMetrics {
    const spread = this.analyzeSpread(orderBook, historical);
    const slippage = this.modelSlippage(orderBook, trades);
    const impact = this.modelImpact(trades, historical);
    const efficiency = this.assessEfficiency(orderBook, trades);
    const anomalies = this.detectAnomalies(trades, orderBook);
    
    return {
      spread,
      slippage,
      impact,
      efficiency,
      anomalies,
    };
  }
  
  private analyzeSpread(orderBook: any, historical: any): SpreadAnalysis {
    const current = orderBook.spread || 0;
    const average = historical.avgSpread || current;
    const volatility = historical.spreadVolatility || 0;
    
    const components: SpreadComponents = {
      adverse: current * 0.3,
      inventory: current * 0.2,
      processing: current * 0.5,
    };
    
    const regime = current > average * 2 ? 'WIDE' :
                   current < average * 0.5 ? 'TIGHT' :
                   volatility > 50 ? 'UNSTABLE' : 'NORMAL';
    
    return {
      current,
      average,
      volatility,
      components,
      regime,
    };
  }
  
  private modelSlippage(orderBook: any, trades: any[]): SlippageModel {
    const expectedSlippage = new Map<number, number>();
    const worstCase = new Map<number, number>();
    
    // Model slippage for different sizes
    [1000, 5000, 10000, 50000, 100000].forEach(size => {
      expectedSlippage.set(size, size * 0.0001); // 0.01% per $1000
      worstCase.set(size, size * 0.0005); // 0.05% per $1000
    });
    
    const optimalSize = 5000; // Optimal trade size
    const splitStrategy: SplitStrategy = {
      chunks: 5,
      timing: 'TWAP over 5 minutes',
      venues: ['Primary DEX', 'Secondary DEX'],
    };
    
    return {
      expectedSlippage,
      worstCase,
      optimalSize,
      splitStrategy,
    };
  }
  
  private modelImpact(trades: any[], historical: any): ImpactModel {
    return {
      temporary: 0.1, // 10 bps temporary impact
      permanent: 0.05, // 5 bps permanent impact
      decay: 0.5, // 50% decay per minute
      recovery: 2, // 2 minutes to recover
    };
  }
  
  private assessEfficiency(orderBook: any, trades: any[]): MarketEfficiency {
    const score = 75; // Base efficiency score
    const arbitrageOpportunities = 2;
    const mispricings: Mispricing[] = [];
    const inefficiencies = ['Wide spreads during low volatility'];
    
    return {
      score,
      arbitrageOpportunities,
      mispricings,
      inefficiencies,
    };
  }
  
  private detectAnomalies(trades: any[], orderBook: any): Anomaly[] {
    // Simplified anomaly detection
    return [];
  }
  
  private detectManipulation(
    trades: any[],
    orderBook: any,
    whaleData: any[]
  ): ManipulationDetection {
    // Simplified manipulation detection
    return {
      detected: false,
      confidence: 0,
      patterns: [],
      actors: [],
      warnings: [],
    };
  }
  
  private generatePredictions(
    marketProfile: MarketProfile,
    orderFlow: OrderFlowAnalysis,
    liquidityMap: LiquidityMap,
    microstructure: MicrostructureMetrics
  ): MarketPrediction[] {
    const predictions: MarketPrediction[] = [];
    
    // Short-term prediction
    predictions.push({
      timeframe: '1 hour',
      direction: orderFlow.aggression.netAggression > 10 ? 'UP' :
                orderFlow.aggression.netAggression < -10 ? 'DOWN' : 'SIDEWAYS',
      target: marketProfile.keyLevels[0]?.price || 0,
      confidence: marketProfile.confidence * 0.8,
      reasoning: [
        `${marketProfile.phase} market phase`,
        `Order flow ${orderFlow.toxicity.smartMoneyFlow}`,
      ],
      risks: ['Sudden liquidity changes', 'News events'],
    });
    
    return predictions;
  }
  
  private generateTradingSignals(
    marketProfile: MarketProfile,
    orderFlow: OrderFlowAnalysis,
    liquidityMap: LiquidityMap,
    predictions: MarketPrediction[],
    context: AgentContext
  ): TradingSignal[] {
    const signals: TradingSignal[] = [];
    
    // Generate entry signal if conditions are favorable
    if (marketProfile.phase === 'BULLISH' && orderFlow.aggression.buyAggression > 60) {
      signals.push({
        type: 'ENTRY',
        action: 'BUY',
        price: marketProfile.keyLevels.find(l => l.type === 'SUPPORT')?.price || 0,
        size: 1000, // Default size
        confidence: marketProfile.confidence * 0.7,
        reasoning: 'Bullish phase with strong buy aggression',
        riskReward: 2.5,
        timeframe: '1-4 hours',
      });
    }
    
    return signals;
  }
}