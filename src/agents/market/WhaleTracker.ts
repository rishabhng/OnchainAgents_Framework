import { z } from 'zod';
import { BaseAgent, AgentContext, AgentConfig } from '../base/BaseAgent';
import { HiveClient } from '../../mcp/HiveClient';

interface WhaleTrackerResult {
  whaleActivity: WhaleMovement[];
  marketImpact: MarketImpact;
  statistics: WhaleStatistics;
  scanTime: Date;
}

interface WhaleMovement {
  rank: number;
  wallet: WalletInfo;
  action: 'ACCUMULATION' | 'DISTRIBUTION' | 'TRANSFER' | 'NEW_POSITION';
  tokens: TokenMovement[];
  totalValueUSD: number;
  timing: string;
  pattern: string;
  significance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface WalletInfo {
  address: string;
  label?: string;
  totalHoldings: number;
  walletAge: string;
  reputation: 'UNKNOWN' | 'TRADER' | 'HODLER' | 'ARBITRAGE' | 'INSTITUTION';
}

interface TokenMovement {
  symbol: string;
  amount: number;
  valueUSD: number;
  direction: 'IN' | 'OUT';
  source: string;
  destination: string;
  priceImpact: number;
}

interface MarketImpact {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  netFlow: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  smartMoneyRatio: number;
  probabilityMove: number;
  expectedTimeframe: string;
}

interface WhaleStatistics {
  totalWhales: number;
  activeWhales: number;
  netAccumulation: number;
  averageTransactionSize: number;
  largestTransaction: number;
}

export class WhaleTracker extends BaseAgent {
  constructor(hiveClient: HiveClient) {
    const config: AgentConfig = {
      name: 'WhaleTracker',
      description: 'Monitors large holder activity for market signals',
      version: '1.0.0',
      cacheTTL: 180, // 3 minutes cache for whale data
      maxRetries: 3,
      timeout: 45000,
    };
    
    super(config, hiveClient);
  }
  
  protected validateInput(context: AgentContext): z.ZodSchema {
    return z.object({
      token: z.string().optional(),
      network: z.string().optional(),
      options: z.object({
        minTransactionUSD: z.number().optional(),
        timeframe: z.enum(['1h', '4h', '24h', '7d']).optional(),
        walletType: z.enum(['all', 'smart', 'institution', 'known']).optional(),
        includeExchanges: z.boolean().optional(),
        trackAccumulation: z.boolean().optional(),
      }).optional(),
    });
  }
  
  protected async performAnalysis(context: AgentContext): Promise<WhaleTrackerResult> {
    this.logger.info('Starting whale tracking', {
      token: context.token,
      timeframe: context.options?.timeframe || '24h',
    });
    
    // Parallel data collection
    const [
      largeTransactions,
      whaleWallets,
      exchangeFlows,
      smartMoney,
      accumulationPatterns,
    ] = await Promise.all([
      this.getLargeTransactions(context),
      this.identifyWhaleWallets(context),
      this.analyzeExchangeFlows(context),
      this.trackSmartMoney(context),
      this.detectAccumulationPatterns(context),
    ]);
    
    // Process whale movements
    const whaleMovements = this.processWhaleMovements(
      largeTransactions,
      whaleWallets,
      exchangeFlows,
      smartMoney,
      accumulationPatterns
    );
    
    // Calculate market impact
    const marketImpact = this.calculateMarketImpact(whaleMovements, exchangeFlows);
    
    // Generate statistics
    const statistics = this.generateStatistics(whaleMovements, largeTransactions);
    
    // Sort and rank movements
    const rankedMovements = whaleMovements
      .sort((a, b) => b.totalValueUSD - a.totalValueUSD)
      .slice(0, 20) // Top 20 movements
      .map((movement, index) => ({ ...movement, rank: index + 1 }));
    
    return {
      whaleActivity: rankedMovements,
      marketImpact,
      statistics,
      scanTime: new Date(),
    };
  }
  
  private async getLargeTransactions(context: AgentContext): Promise<any[]> {
    const minValue = context.options?.minTransactionUSD || 100000;
    
    const response = await this.hiveClient.request('/transactions/large', {
      token: context.token,
      minValueUSD: minValue,
      timeframe: context.options?.timeframe || '24h',
      network: context.network,
    });
    
    return response.data as any[];
  }
  
  private async identifyWhaleWallets(context: AgentContext): Promise<any[]> {
    const response = await this.hiveClient.request('/wallets/whales', {
      token: context.token,
      minHoldingUSD: 1000000,
      network: context.network,
    });
    
    return response.data as any[];
  }
  
  private async analyzeExchangeFlows(context: AgentContext): Promise<any> {
    if (!context.options?.includeExchanges) {
      return { inflow: 0, outflow: 0, net: 0 };
    }
    
    const response = await this.hiveClient.request('/exchanges/flows', {
      token: context.token,
      timeframe: context.options?.timeframe || '24h',
    });
    
    return response.data;
  }
  
  private async trackSmartMoney(context: AgentContext): Promise<any[]> {
    const response = await this.hiveClient.request('/wallets/smart-money', {
      token: context.token,
      timeframe: context.options?.timeframe || '24h',
      minProfitability: 2.0, // 2x minimum
    });
    
    return response.data as any[];
  }
  
  private async detectAccumulationPatterns(context: AgentContext): Promise<any[]> {
    if (!context.options?.trackAccumulation) {
      return [];
    }
    
    const response = await this.hiveClient.request('/patterns/accumulation', {
      token: context.token,
      timeframe: context.options?.timeframe || '7d',
      sensitivity: 'high',
    });
    
    return response.data as any[];
  }
  
  private processWhaleMovements(
    transactions: any[],
    whales: any[],
    exchangeFlows: any,
    smartMoney: any[],
    patterns: any[]
  ): WhaleMovement[] {
    const movements: WhaleMovement[] = [];
    const whaleMap = new Map(whales.map(w => [w.address, w]));
    const smartMoneyAddresses = new Set(smartMoney.map(s => s.address));
    
    // Group transactions by wallet
    const walletTransactions = new Map<string, any[]>();
    for (const tx of transactions) {
      const wallet = tx.from || tx.sender;
      if (!walletTransactions.has(wallet)) {
        walletTransactions.set(wallet, []);
      }
      walletTransactions.get(wallet)!.push(tx);
    }
    
    // Process each wallet's activity
    for (const [address, txs] of walletTransactions.entries()) {
      const whaleInfo = whaleMap.get(address);
      const isSmartMoney = smartMoneyAddresses.has(address);
      
      // Determine action type
      const action = this.determineAction(txs, patterns);
      
      // Process token movements
      const tokenMovements = this.processTokenMovements(txs);
      
      // Calculate total value
      const totalValue = tokenMovements.reduce((sum, tm) => sum + tm.valueUSD, 0);
      
      // Determine significance
      const significance = this.determineSignificance(totalValue, isSmartMoney, action);
      
      // Create wallet info
      const walletInfo: WalletInfo = {
        address,
        label: whaleInfo?.label || (isSmartMoney ? 'Smart Money' : undefined),
        totalHoldings: whaleInfo?.totalHoldings || 0,
        walletAge: whaleInfo?.age || 'Unknown',
        reputation: this.determineReputation(whaleInfo, isSmartMoney),
      };
      
      // Determine pattern
      const pattern = this.identifyPattern(txs, patterns);
      
      movements.push({
        rank: 0, // Will be set later
        wallet: walletInfo,
        action,
        tokens: tokenMovements,
        totalValueUSD: totalValue,
        timing: this.analyzeTiming(txs),
        pattern,
        significance,
      });
    }
    
    return movements;
  }
  
  private determineAction(txs: any[], patterns: any[]): WhaleMovement['action'] {
    let buyCount = 0;
    let sellCount = 0;
    let transferCount = 0;
    
    for (const tx of txs) {
      if (tx.type === 'buy' || tx.direction === 'in') buyCount++;
      else if (tx.type === 'sell' || tx.direction === 'out') sellCount++;
      else transferCount++;
    }
    
    // Check patterns for accumulation signals
    const hasAccumulationPattern = patterns.some(p => 
      p.type === 'accumulation' && txs.some(tx => tx.hash === p.transactionHash)
    );
    
    if (hasAccumulationPattern || buyCount > sellCount * 2) {
      return 'ACCUMULATION';
    } else if (sellCount > buyCount * 2) {
      return 'DISTRIBUTION';
    } else if (transferCount > buyCount + sellCount) {
      return 'TRANSFER';
    } else if (buyCount > 0 && sellCount === 0) {
      return 'NEW_POSITION';
    }
    
    return 'TRANSFER';
  }
  
  private processTokenMovements(txs: any[]): TokenMovement[] {
    const movements: TokenMovement[] = [];
    
    for (const tx of txs) {
      movements.push({
        symbol: tx.symbol || tx.token || 'UNKNOWN',
        amount: tx.amount || 0,
        valueUSD: tx.valueUSD || 0,
        direction: tx.direction === 'out' || tx.type === 'sell' ? 'OUT' : 'IN',
        source: tx.from || tx.source || 'Unknown',
        destination: tx.to || tx.destination || 'Unknown',
        priceImpact: tx.priceImpact || 0,
      });
    }
    
    return movements;
  }
  
  private determineSignificance(
    value: number,
    isSmartMoney: boolean,
    action: WhaleMovement['action']
  ): WhaleMovement['significance'] {
    // Smart money transactions are more significant
    const multiplier = isSmartMoney ? 0.5 : 1.0;
    const adjustedValue = value * multiplier;
    
    // Action-based adjustments
    if (action === 'ACCUMULATION' || action === 'NEW_POSITION') {
      if (adjustedValue > 5000000) return 'CRITICAL';
      if (adjustedValue > 1000000) return 'HIGH';
      if (adjustedValue > 250000) return 'MEDIUM';
    } else if (action === 'DISTRIBUTION') {
      if (adjustedValue > 10000000) return 'CRITICAL';
      if (adjustedValue > 2000000) return 'HIGH';
      if (adjustedValue > 500000) return 'MEDIUM';
    }
    
    return 'LOW';
  }
  
  private determineReputation(whaleInfo: any, isSmartMoney: boolean): WalletInfo['reputation'] {
    if (whaleInfo?.type === 'institution') return 'INSTITUTION';
    if (isSmartMoney) return 'TRADER';
    if (whaleInfo?.tradingFrequency > 100) return 'ARBITRAGE';
    if (whaleInfo?.holdingPeriod > 365) return 'HODLER';
    return 'UNKNOWN';
  }
  
  private identifyPattern(txs: any[], patterns: any[]): string {
    // Check for specific patterns
    for (const pattern of patterns) {
      if (txs.some(tx => tx.hash === pattern.transactionHash)) {
        return pattern.description || pattern.type;
      }
    }
    
    // Analyze transaction pattern
    if (txs.length === 1) return 'Single large transaction';
    if (txs.every(tx => tx.amount === txs[0].amount)) return 'DCA pattern detected';
    if (txs.length > 5) return 'Multiple transactions';
    
    return 'Standard trading pattern';
  }
  
  private analyzeTiming(txs: any[]): string {
    const timestamps = txs.map(tx => new Date(tx.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const duration = maxTime - minTime;
    
    if (duration < 3600000) return 'Within 1 hour';
    if (duration < 86400000) return 'Within 24 hours';
    if (duration < 604800000) return 'Within 7 days';
    
    return 'Extended period';
  }
  
  private calculateMarketImpact(
    movements: WhaleMovement[],
    exchangeFlows: any
  ): MarketImpact {
    let accumulation = 0;
    let distribution = 0;
    let smartMoneyBuys = 0;
    let smartMoneySells = 0;
    
    for (const movement of movements) {
      if (movement.action === 'ACCUMULATION' || movement.action === 'NEW_POSITION') {
        accumulation += movement.totalValueUSD;
        if (movement.wallet.reputation === 'TRADER') {
          smartMoneyBuys += movement.totalValueUSD;
        }
      } else if (movement.action === 'DISTRIBUTION') {
        distribution += movement.totalValueUSD;
        if (movement.wallet.reputation === 'TRADER') {
          smartMoneySells += movement.totalValueUSD;
        }
      }
    }
    
    const netFlow = accumulation - distribution;
    const smartMoneyRatio = smartMoneyBuys / (smartMoneySells + 1); // Avoid division by zero
    
    // Determine sentiment
    let sentiment: MarketImpact['sentiment'];
    if (netFlow > distribution * 2 && smartMoneyRatio > 2) {
      sentiment = 'BULLISH';
    } else if (distribution > accumulation * 2 && smartMoneyRatio < 0.5) {
      sentiment = 'BEARISH';
    } else {
      sentiment = 'NEUTRAL';
    }
    
    // Calculate probability of price move
    let probability = 50; // Base probability
    if (sentiment === 'BULLISH') {
      probability += Math.min(25, netFlow / 1000000); // Max +25% for strong accumulation
      probability += smartMoneyRatio > 3 ? 10 : 0;
    } else if (sentiment === 'BEARISH') {
      probability -= Math.min(25, distribution / 1000000);
      probability -= smartMoneyRatio < 0.3 ? 10 : 0;
    }
    
    return {
      sentiment,
      netFlow,
      exchangeInflow: exchangeFlows.inflow || 0,
      exchangeOutflow: exchangeFlows.outflow || 0,
      smartMoneyRatio,
      probabilityMove: Math.max(0, Math.min(100, probability)),
      expectedTimeframe: this.predictTimeframe(netFlow, sentiment),
    };
  }
  
  private predictTimeframe(netFlow: number, sentiment: string): string {
    const absFlow = Math.abs(netFlow);
    
    if (absFlow > 10000000) {
      return '24-48 hours for signal confirmation';
    } else if (absFlow > 5000000) {
      return '2-3 days for market reaction';
    } else if (absFlow > 1000000) {
      return '3-7 days for price impact';
    }
    
    return '1-2 weeks for trend development';
  }
  
  private generateStatistics(
    movements: WhaleMovement[],
    transactions: any[]
  ): WhaleStatistics {
    const uniqueWhales = new Set(movements.map(m => m.wallet.address));
    const activeWhales = movements.filter(m => 
      m.action === 'ACCUMULATION' || m.action === 'DISTRIBUTION'
    ).length;
    
    const accumulation = movements
      .filter(m => m.action === 'ACCUMULATION' || m.action === 'NEW_POSITION')
      .reduce((sum, m) => sum + m.totalValueUSD, 0);
    
    const distribution = movements
      .filter(m => m.action === 'DISTRIBUTION')
      .reduce((sum, m) => sum + m.totalValueUSD, 0);
    
    const txValues = transactions.map(tx => tx.valueUSD || 0);
    const avgTransaction = txValues.length > 0
      ? txValues.reduce((sum, val) => sum + val, 0) / txValues.length
      : 0;
    
    return {
      totalWhales: uniqueWhales.size,
      activeWhales,
      netAccumulation: accumulation - distribution,
      averageTransactionSize: avgTransaction,
      largestTransaction: Math.max(...txValues, 0),
    };
  }
}