import { z } from 'zod';
import { BaseAgent, AgentContext, AgentConfig } from '../base/BaseAgent';
import { IHiveService } from '../../interfaces/IHiveService';

interface PortfolioTrackerResult {
  portfolio: PortfolioOverview;
  holdings: Holding[];
  performance: PerformanceMetrics;
  transactions: Transaction[];
  insights: PortfolioInsight[];
  recommendations: PortfolioRecommendation[];
  trackingTime: Date;
}

interface PortfolioOverview {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  numberOfAssets: number;
  topPerformer: AssetPerformance;
  worstPerformer: AssetPerformance;
  riskScore: number;
  diversificationScore: number;
}

interface Holding {
  asset: string;
  symbol: string;
  chain: string;
  amount: number;
  value: number;
  cost: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
  price: number;
  avgBuyPrice: number;
  firstBuy: Date;
  lastActivity: Date;
  tags: string[];
}

interface AssetPerformance {
  asset: string;
  pnlPercent: number;
  value: number;
}

interface PerformanceMetrics {
  daily: PerformancePeriod;
  weekly: PerformancePeriod;
  monthly: PerformancePeriod;
  yearly: PerformancePeriod;
  allTime: PerformancePeriod;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
}

interface PerformancePeriod {
  value: number;
  pnl: number;
  pnlPercent: number;
  bestDay?: DayPerformance;
  worstDay?: DayPerformance;
}

interface DayPerformance {
  date: Date;
  pnl: number;
  pnlPercent: number;
}

interface Transaction {
  hash: string;
  type: 'BUY' | 'SELL' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'SWAP' | 'STAKE' | 'UNSTAKE';
  asset: string;
  amount: number;
  value: number;
  price: number;
  fee: number;
  timestamp: Date;
  chain: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  pnlRealized?: number;
}

interface PortfolioInsight {
  type: 'ALERT' | 'OPPORTUNITY' | 'RISK' | 'TREND';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  affectedAssets: string[];
  actionRequired: boolean;
}

interface PortfolioRecommendation {
  action: 'BUY' | 'SELL' | 'HOLD' | 'REBALANCE' | 'STAKE' | 'HARVEST';
  asset: string;
  amount?: number;
  reason: string;
  expectedImpact: string;
  confidence: number;
  timeframe: string;
}

export class PortfolioTracker extends BaseAgent {
  constructor(hiveService: IHiveService) {
    const config: AgentConfig = {
      name: 'PortfolioTracker',
      description: 'Your AI portfolio manager that never sleeps',
      version: '1.0.0',
      cacheTTL: 300, // 5 minutes cache for portfolio data
      maxRetries: 3,
      timeout: 30000,
    };
    
    super(config, hiveService);
  }
  
  protected validateInput(context: AgentContext): z.ZodSchema {
    return z.object({
      address: z.string(),
      options: z.object({
        chains: z.array(z.string()).optional(),
        includeStaking: z.boolean().optional(),
        includeDeFi: z.boolean().optional(),
        includeNFTs: z.boolean().optional(),
        timeframe: z.enum(['24h', '7d', '30d', '90d', 'all']).optional(),
        minValue: z.number().optional(),
        tags: z.array(z.string()).optional(),
      }).optional(),
    });
  }
  
  protected async performAnalysis(context: AgentContext): Promise<PortfolioTrackerResult> {
    this.logger.info('Starting portfolio tracking', {
      address: context.address,
      chains: context.options?.chains || 'all',
    });
    
    // Parallel data collection
    const [
      balances,
      transactions,
      prices,
      stakingPositions,
      defiPositions,
      historicalData,
    ] = await Promise.all([
      this.getBalances(context),
      this.getTransactions(context),
      this.getCurrentPrices(context),
      this.getStakingPositions(context),
      this.getDeFiPositions(context),
      this.getHistoricalData(context),
    ]);
    
    // Process holdings
    const holdings = this.processHoldings(
      balances,
      prices,
      transactions,
      stakingPositions,
      defiPositions
    );
    
    // Calculate portfolio overview
    const portfolio = this.calculatePortfolioOverview(holdings);
    
    // Calculate performance metrics
    const performance = this.calculatePerformance(
      holdings,
      transactions,
      historicalData
    );
    
    // Process recent transactions
    const recentTransactions = this.processTransactions(
      transactions,
      prices,
      context
    );
    
    // Generate insights
    const insights = this.generateInsights(
      portfolio,
      holdings,
      performance,
      recentTransactions
    );
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      portfolio,
      holdings,
      performance,
      insights,
      context
    );
    
    return {
      portfolio,
      holdings,
      performance,
      transactions: recentTransactions,
      insights,
      recommendations,
      trackingTime: new Date(),
    };
  }
  
  private async getBalances(context: AgentContext): Promise<any[]> {
    const chains = context.options?.chains || [
      'ethereum',
      'bsc',
      'polygon',
      'arbitrum',
      'optimism',
      'avalanche',
      'base',
    ];
    
    const balancePromises = chains.map(chain =>
      this.hiveService.request('/wallet/balances', {
        address: context.address,
        chain,
        includeSmallBalances: false,
      })
    );
    
    const results = await Promise.all(balancePromises);
    return results.flatMap(r => r.data as any[]);
  }
  
  private async getTransactions(context: AgentContext): Promise<any[]> {
    const timeframe = context.options?.timeframe || '30d';
    
    const response = await this.hiveService.request('/wallet/transactions', {
      address: context.address,
      timeframe,
      chains: context.options?.chains,
      limit: 1000,
    });
    
    return response.data as any[];
  }
  
  private async getCurrentPrices(context: AgentContext): Promise<Map<string, number>> {
    const response = await this.hiveService.request('/market/prices', {
      includeAll: true,
    });
    
    const prices = new Map<string, number>();
    const data = response.data as any[];
    
    data.forEach(item => {
      prices.set(item.symbol?.toLowerCase(), item.price || 0);
      prices.set(item.address?.toLowerCase(), item.price || 0);
    });
    
    return prices;
  }
  
  private async getStakingPositions(context: AgentContext): Promise<any[]> {
    if (!context.options?.includeStaking) return [];
    
    const response = await this.hiveService.request('/staking/positions', {
      address: context.address,
      chains: context.options?.chains,
    });
    
    return response.data as any[];
  }
  
  private async getDeFiPositions(context: AgentContext): Promise<any[]> {
    if (!context.options?.includeDeFi) return [];
    
    const response = await this.hiveService.request('/defi/positions', {
      address: context.address,
      chains: context.options?.chains,
    });
    
    return response.data as any[];
  }
  
  private async getHistoricalData(context: AgentContext): Promise<any> {
    const response = await this.hiveService.request('/wallet/historical', {
      address: context.address,
      metrics: ['value', 'pnl'],
      timeframe: context.options?.timeframe || '30d',
    });
    
    return response.data;
  }
  
  private processHoldings(
    balances: any[],
    prices: Map<string, number>,
    transactions: any[],
    stakingPositions: any[],
    defiPositions: any[]
  ): Holding[] {
    const holdings: Holding[] = [];
    const costBasis = this.calculateCostBasis(transactions);
    
    // Process regular balances
    balances.forEach(balance => {
      const price = prices.get(balance.symbol?.toLowerCase()) || 
                   prices.get(balance.address?.toLowerCase()) || 0;
      const value = balance.amount * price;
      const cost = costBasis.get(balance.symbol) || value;
      const pnl = value - cost;
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
      
      holdings.push({
        asset: balance.name || balance.symbol,
        symbol: balance.symbol,
        chain: balance.chain,
        amount: balance.amount,
        value,
        cost,
        pnl,
        pnlPercent,
        allocation: 0, // Will be calculated later
        price,
        avgBuyPrice: cost / balance.amount,
        firstBuy: this.getFirstBuyDate(balance.symbol, transactions),
        lastActivity: this.getLastActivityDate(balance.symbol, transactions),
        tags: this.generateTags(balance, value),
      });
    });
    
    // Add staking positions
    stakingPositions.forEach(position => {
      const price = prices.get(position.asset?.toLowerCase()) || 0;
      const value = position.amount * price;
      
      holdings.push({
        asset: position.asset,
        symbol: position.symbol,
        chain: position.chain,
        amount: position.amount,
        value,
        cost: position.cost || value,
        pnl: position.rewards || 0,
        pnlPercent: position.apy || 0,
        allocation: 0,
        price,
        avgBuyPrice: position.cost / position.amount || price,
        firstBuy: new Date(position.startDate),
        lastActivity: new Date(),
        tags: ['STAKING', ...this.generateTags(position, value)],
      });
    });
    
    // Add DeFi positions
    defiPositions.forEach(position => {
      const value = position.value || 0;
      
      holdings.push({
        asset: position.protocol,
        symbol: position.lpToken || position.protocol,
        chain: position.chain,
        amount: position.shares || 1,
        value,
        cost: position.deposited || value,
        pnl: value - (position.deposited || value),
        pnlPercent: position.apy || 0,
        allocation: 0,
        price: value / (position.shares || 1),
        avgBuyPrice: (position.deposited || value) / (position.shares || 1),
        firstBuy: new Date(position.startDate),
        lastActivity: new Date(),
        tags: ['DEFI', position.type, ...this.generateTags(position, value)],
      });
    });
    
    // Calculate allocations
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    holdings.forEach(h => {
      h.allocation = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
    });
    
    // Sort by value
    return holdings.sort((a, b) => b.value - a.value);
  }
  
  private calculateCostBasis(transactions: any[]): Map<string, number> {
    const costBasis = new Map<string, number>();
    
    transactions
      .filter(tx => tx.type === 'BUY' || tx.type === 'SWAP')
      .forEach(tx => {
        const current = costBasis.get(tx.asset) || 0;
        costBasis.set(tx.asset, current + (tx.value || 0));
      });
    
    return costBasis;
  }
  
  private getFirstBuyDate(symbol: string, transactions: any[]): Date {
    const firstBuy = transactions
      .filter(tx => tx.asset === symbol && (tx.type === 'BUY' || tx.type === 'TRANSFER_IN'))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];
    
    return firstBuy ? new Date(firstBuy.timestamp) : new Date();
  }
  
  private getLastActivityDate(symbol: string, transactions: any[]): Date {
    const lastActivity = transactions
      .filter(tx => tx.asset === symbol)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    return lastActivity ? new Date(lastActivity.timestamp) : new Date();
  }
  
  private generateTags(balance: any, value: number): string[] {
    const tags: string[] = [];
    
    // Value-based tags
    if (value > 100000) tags.push('WHALE');
    else if (value > 10000) tags.push('LARGE');
    else if (value > 1000) tags.push('MEDIUM');
    else tags.push('SMALL');
    
    // Category tags
    if (balance.category) tags.push(balance.category.toUpperCase());
    if (balance.isStablecoin) tags.push('STABLECOIN');
    if (balance.isWrapped) tags.push('WRAPPED');
    
    return tags;
  }
  
  private calculatePortfolioOverview(holdings: Holding[]): PortfolioOverview {
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.cost, 0);
    const totalPnL = totalValue - totalCost;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
    
    const topPerformer = holdings.reduce((best, h) => 
      h.pnlPercent > best.pnlPercent ? h : best,
      holdings[0] || { asset: '', pnlPercent: 0, value: 0 }
    );
    
    const worstPerformer = holdings.reduce((worst, h) =>
      h.pnlPercent < worst.pnlPercent ? h : worst,
      holdings[0] || { asset: '', pnlPercent: 0, value: 0 }
    );
    
    const riskScore = this.calculateRiskScore(holdings);
    const diversificationScore = this.calculateDiversificationScore(holdings);
    
    return {
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent,
      numberOfAssets: holdings.length,
      topPerformer: {
        asset: topPerformer.asset,
        pnlPercent: topPerformer.pnlPercent,
        value: topPerformer.value,
      },
      worstPerformer: {
        asset: worstPerformer.asset,
        pnlPercent: worstPerformer.pnlPercent,
        value: worstPerformer.value,
      },
      riskScore,
      diversificationScore,
    };
  }
  
  private calculateRiskScore(holdings: Holding[]): number {
    let score = 50; // Base risk
    
    // Concentration risk
    const maxAllocation = Math.max(...holdings.map(h => h.allocation));
    if (maxAllocation > 50) score += 30;
    else if (maxAllocation > 30) score += 15;
    
    // Volatility risk (simplified)
    const hasHighVolatility = holdings.some(h => 
      !h.tags.includes('STABLECOIN') && h.allocation > 10
    );
    if (hasHighVolatility) score += 10;
    
    // DeFi risk
    const defiAllocation = holdings
      .filter(h => h.tags.includes('DEFI'))
      .reduce((sum, h) => sum + h.allocation, 0);
    if (defiAllocation > 30) score += 10;
    
    return Math.min(100, score);
  }
  
  private calculateDiversificationScore(holdings: Holding[]): number {
    if (holdings.length === 0) return 0;
    
    // Calculate Herfindahl-Hirschman Index (HHI)
    const hhi = holdings.reduce((sum, h) => 
      sum + Math.pow(h.allocation, 2), 0
    );
    
    // Convert HHI to diversification score (0-100)
    // HHI ranges from 0 to 10,000 (100^2)
    // Lower HHI = better diversification
    const score = Math.max(0, 100 - (hhi / 100));
    
    // Bonus for multiple chains
    const chains = new Set(holdings.map(h => h.chain)).size;
    const chainBonus = Math.min(20, chains * 5);
    
    return Math.min(100, score + chainBonus);
  }
  
  private calculatePerformance(
    holdings: Holding[],
    transactions: any[],
    historicalData: any
  ): PerformanceMetrics {
    const daily = this.calculatePeriodPerformance(historicalData.daily || {}, holdings);
    const weekly = this.calculatePeriodPerformance(historicalData.weekly || {}, holdings);
    const monthly = this.calculatePeriodPerformance(historicalData.monthly || {}, holdings);
    const yearly = this.calculatePeriodPerformance(historicalData.yearly || {}, holdings);
    const allTime = this.calculatePeriodPerformance(historicalData.allTime || {}, holdings);
    
    const volatility = this.calculateVolatility(historicalData.daily?.values || []);
    const sharpeRatio = this.calculateSharpeRatio(yearly.pnlPercent, volatility);
    const maxDrawdown = this.calculateMaxDrawdown(historicalData.daily?.values || []);
    const winRate = this.calculateWinRate(transactions);
    
    return {
      daily,
      weekly,
      monthly,
      yearly,
      allTime,
      volatility,
      sharpeRatio,
      maxDrawdown,
      winRate,
    };
  }
  
  private calculatePeriodPerformance(
    data: any,
    holdings: Holding[]
  ): PerformancePeriod {
    const currentValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const startValue = data.startValue || currentValue;
    const pnl = currentValue - startValue;
    const pnlPercent = startValue > 0 ? (pnl / startValue) * 100 : 0;
    
    return {
      value: currentValue,
      pnl,
      pnlPercent,
      bestDay: data.bestDay ? {
        date: new Date(data.bestDay.date),
        pnl: data.bestDay.pnl,
        pnlPercent: data.bestDay.pnlPercent,
      } : undefined,
      worstDay: data.worstDay ? {
        date: new Date(data.worstDay.date),
        pnl: data.worstDay.pnl,
        pnlPercent: data.worstDay.pnlPercent,
      } : undefined,
    };
  }
  
  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < values.length; i++) {
      const return_ = (values[i] - values[i - 1]) / values[i - 1];
      returns.push(return_);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 365) * 100; // Annualized volatility
  }
  
  private calculateSharpeRatio(annualReturn: number, volatility: number): number {
    const riskFreeRate = 3; // 3% Treasury yield
    if (volatility === 0) return 0;
    
    return (annualReturn - riskFreeRate) / volatility;
  }
  
  private calculateMaxDrawdown(values: number[]): number {
    if (values.length < 2) return 0;
    
    let maxDrawdown = 0;
    let peak = values[0];
    
    for (const value of values) {
      if (value > peak) {
        peak = value;
      }
      const drawdown = ((peak - value) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }
  
  private calculateWinRate(transactions: any[]): number {
    const trades = transactions.filter(tx => tx.type === 'SELL' && tx.pnlRealized !== undefined);
    if (trades.length === 0) return 0;
    
    const wins = trades.filter(tx => tx.pnlRealized > 0).length;
    return (wins / trades.length) * 100;
  }
  
  private processTransactions(
    transactions: any[],
    prices: Map<string, number>,
    context: AgentContext
  ): Transaction[] {
    return transactions
      .slice(0, 50) // Last 50 transactions
      .map(tx => ({
        hash: tx.hash,
        type: tx.type || 'TRANSFER_IN',
        asset: tx.asset || tx.symbol || 'Unknown',
        amount: tx.amount || 0,
        value: tx.value || (tx.amount * (prices.get(tx.symbol?.toLowerCase()) || 0)),
        price: tx.price || prices.get(tx.symbol?.toLowerCase()) || 0,
        fee: tx.fee || 0,
        timestamp: new Date(tx.timestamp),
        chain: tx.chain || 'ethereum',
        status: tx.status || 'SUCCESS',
        pnlRealized: tx.pnlRealized,
      }));
  }
  
  private generateInsights(
    portfolio: PortfolioOverview,
    holdings: Holding[],
    performance: PerformanceMetrics,
    transactions: Transaction[]
  ): PortfolioInsight[] {
    const insights: PortfolioInsight[] = [];
    
    // Concentration risk
    const topHolding = holdings[0];
    if (topHolding && topHolding.allocation > 40) {
      insights.push({
        type: 'RISK',
        priority: 'HIGH',
        title: 'High concentration risk',
        description: `${topHolding.asset} represents ${topHolding.allocation.toFixed(1)}% of portfolio`,
        affectedAssets: [topHolding.asset],
        actionRequired: true,
      });
    }
    
    // Poor performers
    const losers = holdings.filter(h => h.pnlPercent < -20);
    if (losers.length > 0) {
      insights.push({
        type: 'ALERT',
        priority: 'MEDIUM',
        title: 'Underperforming assets',
        description: `${losers.length} assets down more than 20%`,
        affectedAssets: losers.map(h => h.asset),
        actionRequired: false,
      });
    }
    
    // Strong performers
    const winners = holdings.filter(h => h.pnlPercent > 50);
    if (winners.length > 0) {
      insights.push({
        type: 'OPPORTUNITY',
        priority: 'MEDIUM',
        title: 'Consider taking profits',
        description: `${winners.length} assets up more than 50%`,
        affectedAssets: winners.map(h => h.asset),
        actionRequired: false,
      });
    }
    
    // High volatility
    if (performance.volatility > 50) {
      insights.push({
        type: 'RISK',
        priority: 'MEDIUM',
        title: 'High portfolio volatility',
        description: `Volatility at ${performance.volatility.toFixed(1)}% annualized`,
        affectedAssets: [],
        actionRequired: false,
      });
    }
    
    // Recent activity
    const recentTxCount = transactions.filter(tx => 
      (Date.now() - tx.timestamp.getTime()) < 24 * 60 * 60 * 1000
    ).length;
    
    if (recentTxCount > 10) {
      insights.push({
        type: 'TREND',
        priority: 'LOW',
        title: 'High trading activity',
        description: `${recentTxCount} transactions in last 24 hours`,
        affectedAssets: [],
        actionRequired: false,
      });
    }
    
    return insights;
  }
  
  private generateRecommendations(
    portfolio: PortfolioOverview,
    holdings: Holding[],
    performance: PerformanceMetrics,
    insights: PortfolioInsight[],
    context: AgentContext
  ): PortfolioRecommendation[] {
    const recommendations: PortfolioRecommendation[] = [];
    
    // Rebalancing recommendation
    if (portfolio.diversificationScore < 50) {
      recommendations.push({
        action: 'REBALANCE',
        asset: 'Portfolio',
        reason: 'Low diversification score',
        expectedImpact: 'Reduce concentration risk by 30%',
        confidence: 80,
        timeframe: 'Within 7 days',
      });
    }
    
    // Profit taking
    const topPerformer = portfolio.topPerformer;
    if (topPerformer.pnlPercent > 100) {
      recommendations.push({
        action: 'SELL',
        asset: topPerformer.asset,
        amount: topPerformer.value * 0.25,
        reason: 'Asset up over 100%, consider partial profit taking',
        expectedImpact: 'Lock in 25% of gains',
        confidence: 70,
        timeframe: 'Market dependent',
      });
    }
    
    // Cut losses
    const worstPerformer = portfolio.worstPerformer;
    if (worstPerformer.pnlPercent < -50) {
      recommendations.push({
        action: 'SELL',
        asset: worstPerformer.asset,
        reason: 'Asset down over 50%, consider cutting losses',
        expectedImpact: 'Prevent further losses',
        confidence: 60,
        timeframe: 'Review within 3 days',
      });
    }
    
    // Staking opportunities
    const unstaked = holdings.filter(h => 
      !h.tags.includes('STAKING') && 
      h.value > 1000 &&
      ['ETH', 'MATIC', 'AVAX', 'SOL'].includes(h.symbol)
    );
    
    if (unstaked.length > 0) {
      recommendations.push({
        action: 'STAKE',
        asset: unstaked[0].asset,
        amount: unstaked[0].amount,
        reason: 'Earn passive income through staking',
        expectedImpact: '4-8% APY on idle assets',
        confidence: 85,
        timeframe: 'Immediate opportunity',
      });
    }
    
    // Risk management
    if (portfolio.riskScore > 70) {
      recommendations.push({
        action: 'HOLD',
        asset: 'Stablecoins',
        reason: 'High portfolio risk, consider increasing stable allocation',
        expectedImpact: 'Reduce portfolio volatility',
        confidence: 75,
        timeframe: 'Next rebalance',
      });
    }
    
    return recommendations;
  }
}