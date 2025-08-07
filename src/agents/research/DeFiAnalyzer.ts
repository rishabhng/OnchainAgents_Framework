import { z } from 'zod';
import { BaseAgent, AgentContext, AgentConfig } from '../base/BaseAgent';
import { IHiveService } from '../../interfaces/IHiveService';

interface DeFiAnalyzerResult {
  protocols: ProtocolAnalysis[];
  yieldOpportunities: YieldOpportunity[];
  riskScores: RiskScoreCard;
  recommendations: Recommendation[];
  optimalAllocation: AllocationStrategy;
  analysisTime: Date;
}

interface ProtocolAnalysis {
  name: string;
  protocol: string;
  tvl: number;
  apy: number;
  riskScore: number;
  auditStatus: AuditStatus;
  healthMetrics: HealthMetrics;
  yieldSustainability: 'SUSTAINABLE' | 'MODERATE' | 'UNSUSTAINABLE';
}

interface AuditStatus {
  audited: boolean;
  auditors: string[];
  lastAudit: Date;
  criticalIssues: number;
  resolvedIssues: number;
  score: number;
}

interface HealthMetrics {
  utilizationRate: number;
  liquidityDepth: number;
  protocolRevenue: number;
  activeUsers: number;
  transactionVolume: number;
  historicalUptime: number;
}

interface YieldOpportunity {
  rank: number;
  protocol: string;
  asset: string;
  chain: string;
  baseAPY: number;
  rewardAPY: number;
  totalAPY: number;
  tvl: number;
  riskAdjustedReturn: number;
  requirements: YieldRequirements;
  risks: string[];
  gasEfficiency: number;
}

interface YieldRequirements {
  minimumDeposit: number;
  lockPeriod?: number;
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  gasEstimate: number;
  additionalSteps: string[];
}

interface RiskScoreCard {
  smartContractRisk: RiskMetric;
  liquidityRisk: RiskMetric;
  protocolRisk: RiskMetric;
  marketRisk: RiskMetric;
  composabilityRisk: RiskMetric;
  overallRisk: number;
}

interface RiskMetric {
  score: number; // 0-10
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: string[];
  mitigation: string[];
}

interface Recommendation {
  type: 'OPPORTUNITY' | 'WARNING' | 'ACTION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  description: string;
  expectedImpact: string;
  implementation: string[];
}

interface AllocationStrategy {
  totalAmount: number;
  allocations: Allocation[];
  expectedAPY: number;
  riskLevel: string;
  gasOptimization: GasStrategy;
  rebalanceFrequency: string;
}

interface Allocation {
  protocol: string;
  asset: string;
  chain: string;
  amount: number;
  percentage: number;
  expectedReturn: number;
  reason: string;
}

interface GasStrategy {
  optimalChain: string;
  bridgingCost: number;
  deploymentCost: number;
  monthlyMaintenanceCost: number;
  breakEvenTime: string;
}

export class DeFiAnalyzer extends BaseAgent {
  constructor(hiveService: IHiveService) {
    const config: AgentConfig = {
      name: 'DeFiAnalyzer',
      description: 'Navigates DeFi complexity with risk-adjusted analysis',
      version: '1.0.0',
      cacheTTL: 600, // 10 minutes cache for DeFi data
      maxRetries: 3,
      timeout: 45000,
    };

    super(config, hiveService);
  }

  protected validateInput(_context: AgentContext): z.ZodSchema {
    return z.object({
      asset: z.string().optional(),
      amount: z.number().optional(),
      options: z
        .object({
          minAPY: z.number().optional(),
          maxRisk: z.number().optional(),
          chains: z.array(z.string()).optional(),
          protocols: z.array(z.string()).optional(),
          strategy: z.enum(['conservative', 'balanced', 'aggressive']).optional(),
          includeStaking: z.boolean().optional(),
          includeLPs: z.boolean().optional(),
        })
        .optional(),
    });
  }

  protected async performAnalysis(context: AgentContext): Promise<DeFiAnalyzerResult> {
    this.logger.info('Starting DeFi analysis', {
      asset: (context.options?.asset as string) || 'all',
      strategy: context.options?.strategy || 'balanced',
    });

    // Parallel data collection
    const [protocolData, yieldData, auditData, liquidityData, historicalData, gasData] =
      await Promise.all([
        this.getProtocolData(context),
        this.getYieldOpportunities(context),
        this.getAuditInformation(context),
        this.getLiquidityMetrics(context),
        this.getHistoricalPerformance(context),
        this.getGasMetrics(context),
      ]);

    // Analyze protocols
    const protocols = this.analyzeProtocols(protocolData, auditData, liquidityData, historicalData);

    // Identify yield opportunities
    const yieldOpportunities = this.identifyYieldOpportunities(
      yieldData,
      protocols,
      gasData,
      context,
    );

    // Calculate risk scores
    const riskScores = this.calculateRiskScores(
      protocols,
      yieldOpportunities,
      liquidityData,
      historicalData,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      protocols,
      yieldOpportunities,
      riskScores,
      context,
    );

    // Create optimal allocation strategy
    const optimalAllocation = this.createAllocationStrategy(
      yieldOpportunities,
      riskScores,
      gasData,
      context,
    );

    return {
      protocols,
      yieldOpportunities,
      riskScores,
      recommendations,
      optimalAllocation,
      analysisTime: new Date(),
    };
  }

  private async getProtocolData(context: AgentContext): Promise<any[]> {
    const protocols = context.options?.protocols || [];

    const response = await this.hiveService.request('/defi/protocols', {
      protocols: (protocols as any[]).length > 0 ? protocols : undefined,
      includeMetrics: true,
      chains: context.options?.chains,
    });

    return response.data as any[];
  }

  private async getYieldOpportunities(context: AgentContext): Promise<any[]> {
    const minAPY = context.options?.minAPY || 0;

    const response = await this.hiveService.request('/defi/yields', {
      asset: context.options?.asset as string,
      minAPY,
      chains: context.options?.chains,
      includeRewards: true,
    });

    return response.data as any[];
  }

  private async getAuditInformation(context: AgentContext): Promise<any> {
    const response = await this.hiveService.request('/defi/audits', {
      protocols: context.options?.protocols,
      includeHistory: true,
    });

    return response.data;
  }

  private async getLiquidityMetrics(context: AgentContext): Promise<any> {
    const response = await this.hiveService.request('/defi/liquidity', {
      asset: context.options?.asset as string,
      protocols: context.options?.protocols,
      timeframe: '30d',
    });

    return response.data;
  }

  private async getHistoricalPerformance(context: AgentContext): Promise<any> {
    const response = await this.hiveService.request('/defi/historical', {
      protocols: context.options?.protocols,
      metrics: ['apy', 'tvl', 'incidents'],
      timeframe: '90d',
    });

    return response.data;
  }

  private async getGasMetrics(context: AgentContext): Promise<any> {
    const chains = context.options?.chains || ['ethereum', 'arbitrum', 'polygon'];

    const response = await this.hiveService.request('/gas/metrics', {
      chains,
      operations: ['deposit', 'withdraw', 'claim', 'compound'],
    });

    return response.data;
  }

  private analyzeProtocols(
    protocolData: any[],
    auditData: any,
    liquidityData: any,
    historicalData: any,
  ): ProtocolAnalysis[] {
    return protocolData.map((protocol) => {
      const audit = this.getProtocolAudit(protocol.name, auditData);
      const health = this.calculateHealthMetrics(protocol, liquidityData, historicalData);
      const riskScore = this.calculateProtocolRisk(protocol, audit, health);
      const sustainability = this.assessYieldSustainability(protocol, historicalData);

      return {
        name: protocol.name,
        protocol: protocol.type || 'Unknown',
        tvl: protocol.tvl || 0,
        apy: protocol.apy || 0,
        riskScore,
        auditStatus: audit,
        healthMetrics: health,
        yieldSustainability: sustainability,
      };
    });
  }

  private getProtocolAudit(protocolName: string, auditData: any): AuditStatus {
    const audit = auditData[protocolName] || {};

    return {
      audited: audit.audited || false,
      auditors: audit.auditors || [],
      lastAudit: audit.lastAudit ? new Date(audit.lastAudit) : new Date(0),
      criticalIssues: audit.criticalIssues || 0,
      resolvedIssues: audit.resolvedIssues || 0,
      score: this.calculateAuditScore(audit),
    };
  }

  private calculateAuditScore(audit: any): number {
    let score = 0;

    if (audit.audited) score += 40;
    if (audit.auditors?.length > 1) score += 20;
    if (audit.criticalIssues === 0) score += 20;
    if (audit.resolvedIssues > audit.unresolvedIssues) score += 10;

    const daysSinceAudit = audit.lastAudit
      ? (Date.now() - new Date(audit.lastAudit).getTime()) / (1000 * 60 * 60 * 24)
      : 365;

    if (daysSinceAudit < 90) score += 10;
    else if (daysSinceAudit < 180) score += 5;

    return Math.min(100, score);
  }

  private calculateHealthMetrics(
    protocol: any,
    liquidityData: any,
    historicalData: any,
  ): HealthMetrics {
    const protocolLiquidity = liquidityData[protocol.name] || {};
    const protocolHistory = historicalData[protocol.name] || {};

    return {
      utilizationRate: protocol.utilization || 0,
      liquidityDepth: protocolLiquidity.depth || 0,
      protocolRevenue: protocol.revenue || 0,
      activeUsers: protocol.activeUsers || 0,
      transactionVolume: protocol.volume24h || 0,
      historicalUptime: protocolHistory.uptime || 99,
    };
  }

  private calculateProtocolRisk(protocol: any, audit: AuditStatus, health: HealthMetrics): number {
    let riskScore = 5; // Base risk

    // Audit impact
    if (!audit.audited) riskScore += 2;
    if (audit.criticalIssues > 0) riskScore += 1;

    // Health impact
    if (health.utilizationRate > 90) riskScore += 1;
    if (health.liquidityDepth < 1000000) riskScore += 1;
    if (health.historicalUptime < 99) riskScore += 1;

    // TVL impact
    if (protocol.tvl < 10000000) riskScore += 1;
    else if (protocol.tvl > 1000000000) riskScore -= 1;

    return Math.max(1, Math.min(10, riskScore));
  }

  private assessYieldSustainability(
    protocol: any,
    historicalData: any,
  ): 'SUSTAINABLE' | 'MODERATE' | 'UNSUSTAINABLE' {
    const history = historicalData[protocol.name] || {};
    const apyVolatility = history.apyVolatility || 0;
    const rewardTokenPrice = protocol.rewardTokenPrice || 0;
    const emissionRate = protocol.emissionRate || 0;

    // Check for unsustainable yields
    if (protocol.apy > 100 && apyVolatility > 50) {
      return 'UNSUSTAINABLE';
    }

    // Check token emissions
    if (emissionRate > 10 && rewardTokenPrice < 0.1) {
      return 'UNSUSTAINABLE';
    }

    // Check for sustainable yields
    if (protocol.apy < 20 && apyVolatility < 20) {
      return 'SUSTAINABLE';
    }

    return 'MODERATE';
  }

  private identifyYieldOpportunities(
    yieldData: any[],
    protocols: ProtocolAnalysis[],
    gasData: any,
    context: AgentContext,
  ): YieldOpportunity[] {
    const opportunities: YieldOpportunity[] = [];
    const protocolMap = new Map(protocols.map((p) => [p.name, p]));

    for (const yield_ of yieldData) {
      const protocol = protocolMap.get(yield_.protocol);
      if (!protocol) continue;

      // Filter by risk
      const maxRisk = (context.options?.maxRisk as number) || 10;
      if (protocol.riskScore > maxRisk) continue;

      const requirements = this.getYieldRequirements(yield_);
      const risks = this.identifyYieldRisks(yield_, protocol);
      const gasEfficiency = this.calculateGasEfficiency(yield_, gasData);
      const riskAdjustedReturn = this.calculateRiskAdjustedReturn(
        yield_.totalAPY,
        protocol.riskScore,
      );

      opportunities.push({
        rank: 0, // Will be set after sorting
        protocol: yield_.protocol,
        asset: yield_.asset || (context.options?.asset as string) || 'Unknown',
        chain: yield_.chain || 'ethereum',
        baseAPY: yield_.baseAPY || 0,
        rewardAPY: yield_.rewardAPY || 0,
        totalAPY: yield_.totalAPY || yield_.apy || 0,
        tvl: yield_.tvl || 0,
        riskAdjustedReturn,
        requirements,
        risks,
        gasEfficiency,
      });
    }

    // Sort and rank opportunities
    return opportunities
      .sort((a, b) => b.riskAdjustedReturn - a.riskAdjustedReturn)
      .slice(0, 20)
      .map((opp, index) => ({ ...opp, rank: index + 1 }));
  }

  private getYieldRequirements(yield_: any): YieldRequirements {
    return {
      minimumDeposit: yield_.minDeposit || 0,
      lockPeriod: yield_.lockPeriod,
      complexity: this.assessComplexity(yield_),
      gasEstimate: yield_.gasEstimate || 50,
      additionalSteps: yield_.steps || [],
    };
  }

  private assessComplexity(yield_: any): 'SIMPLE' | 'MODERATE' | 'COMPLEX' {
    const steps = yield_.steps?.length || 0;

    if (steps <= 1) return 'SIMPLE';
    if (steps <= 3) return 'MODERATE';
    return 'COMPLEX';
  }

  private identifyYieldRisks(yield_: any, protocol: ProtocolAnalysis): string[] {
    const risks: string[] = [];

    if (!protocol.auditStatus.audited) {
      risks.push('Unaudited protocol');
    }

    if (protocol.yieldSustainability === 'UNSUSTAINABLE') {
      risks.push('Unsustainable yield rates');
    }

    if (yield_.impermanentLoss) {
      risks.push('Impermanent loss risk');
    }

    if (yield_.lockPeriod > 30) {
      risks.push(`Long lock period (${yield_.lockPeriod} days)`);
    }

    if (protocol.tvl < 1000000) {
      risks.push('Low TVL may indicate higher risk');
    }

    return risks;
  }

  private calculateGasEfficiency(yield_: any, gasData: any): number {
    const chainGas = gasData[yield_.chain] || {};
    const depositGas = chainGas.deposit || 100;
    const claimGas = chainGas.claim || 50;
    const compoundGas = chainGas.compound || 75;

    const totalGas = depositGas + claimGas * 12 + compoundGas * 12; // Annual estimate
    const gasInUSD = ((totalGas * (chainGas.price || 30)) / 1e9) * (chainGas.ethPrice || 2000);

    // Calculate efficiency score (higher is better)
    const efficiency = 100 - Math.min(100, gasInUSD / 10);

    return Math.max(0, efficiency);
  }

  private calculateRiskAdjustedReturn(apy: number, riskScore: number): number {
    // Sharpe-like ratio: (Return - RiskFreeRate) / Risk
    const riskFreeRate = 3; // 3% Treasury yield
    const adjustedReturn = (apy - riskFreeRate) / Math.max(1, riskScore);

    return Math.max(0, adjustedReturn);
  }

  private calculateRiskScores(
    protocols: ProtocolAnalysis[],
    opportunities: YieldOpportunity[],
    liquidityData: any,
    historicalData: any,
  ): RiskScoreCard {
    const smartContractRisk = this.assessSmartContractRisk(protocols);
    const liquidityRisk = this.assessLiquidityRisk(liquidityData, opportunities);
    const protocolRisk = this.assessProtocolRisk(protocols, historicalData);
    const marketRisk = this.assessMarketRisk(opportunities);
    const composabilityRisk = this.assessComposabilityRisk(protocols);

    const overallRisk = this.calculateOverallRisk([
      smartContractRisk,
      liquidityRisk,
      protocolRisk,
      marketRisk,
      composabilityRisk,
    ]);

    return {
      smartContractRisk,
      liquidityRisk,
      protocolRisk,
      marketRisk,
      composabilityRisk,
      overallRisk,
    };
  }

  private assessSmartContractRisk(protocols: ProtocolAnalysis[]): RiskMetric {
    const unauditedCount = protocols.filter((p) => !p.auditStatus.audited).length;
    const avgAuditScore =
      protocols.reduce((sum, p) => sum + p.auditStatus.score, 0) / protocols.length;

    let score = 5;
    const factors: string[] = [];
    const mitigation: string[] = [];

    if (unauditedCount > 0) {
      score += 2;
      factors.push(`${unauditedCount} unaudited protocols`);
      mitigation.push('Use only audited protocols');
    }

    if (avgAuditScore < 70) {
      score += 1;
      factors.push('Low average audit score');
      mitigation.push('Prioritize well-audited protocols');
    }

    return {
      score: Math.min(10, score),
      level: this.getRiskLevel(score),
      factors,
      mitigation,
    };
  }

  private assessLiquidityRisk(_liquidityData: any, opportunities: YieldOpportunity[]): RiskMetric {
    const avgTVL = opportunities.reduce((sum, o) => sum + o.tvl, 0) / opportunities.length;

    let score = 3;
    const factors: string[] = [];
    const mitigation: string[] = [];

    if (avgTVL < 10000000) {
      score += 2;
      factors.push('Low average TVL');
      mitigation.push('Monitor liquidity depth');
    }

    const lowLiquidityCount = opportunities.filter((o) => o.tvl < 1000000).length;
    if (lowLiquidityCount > 0) {
      score += 1;
      factors.push(`${lowLiquidityCount} low liquidity opportunities`);
      mitigation.push('Avoid large deposits in low liquidity pools');
    }

    return {
      score: Math.min(10, score),
      level: this.getRiskLevel(score),
      factors,
      mitigation,
    };
  }

  private assessProtocolRisk(protocols: ProtocolAnalysis[], historicalData: any): RiskMetric {
    let score = 4;
    const factors: string[] = [];
    const mitigation: string[] = [];

    const youngProtocols = protocols.filter((p) => {
      const age = historicalData[p.name]?.age || 0;
      return age < 180; // Less than 6 months old
    }).length;

    if (youngProtocols > 0) {
      score += 2;
      factors.push(`${youngProtocols} new protocols (<6 months)`);
      mitigation.push('Prefer battle-tested protocols');
    }

    const unsustainableCount = protocols.filter(
      (p) => p.yieldSustainability === 'UNSUSTAINABLE',
    ).length;

    if (unsustainableCount > 0) {
      score += 1;
      factors.push(`${unsustainableCount} unsustainable yield models`);
      mitigation.push('Focus on sustainable yields');
    }

    return {
      score: Math.min(10, score),
      level: this.getRiskLevel(score),
      factors,
      mitigation,
    };
  }

  private assessMarketRisk(opportunities: YieldOpportunity[]): RiskMetric {
    const avgAPY = opportunities.reduce((sum, o) => sum + o.totalAPY, 0) / opportunities.length;

    let score = 4;
    const factors: string[] = [];
    const mitigation: string[] = [];

    if (avgAPY > 50) {
      score += 2;
      factors.push('High average APY may indicate risk');
      mitigation.push('Diversify across yield ranges');
    }

    const volatileYields = opportunities.filter((o) => o.rewardAPY > o.baseAPY * 2).length;
    if (volatileYields > 0) {
      score += 1;
      factors.push(`${volatileYields} opportunities rely heavily on rewards`);
      mitigation.push('Monitor reward token prices');
    }

    return {
      score: Math.min(10, score),
      level: this.getRiskLevel(score),
      factors,
      mitigation,
    };
  }

  private assessComposabilityRisk(protocols: ProtocolAnalysis[]): RiskMetric {
    let score = 3;
    const factors: string[] = [];
    const mitigation: string[] = [];

    // Check for protocol dependencies
    const dependentProtocols = protocols.filter((p) => p.protocol === 'aggregator').length;

    if (dependentProtocols > 0) {
      score += 2;
      factors.push(`${dependentProtocols} protocols with dependencies`);
      mitigation.push('Understand protocol dependencies');
    }

    return {
      score: Math.min(10, score),
      level: this.getRiskLevel(score),
      factors,
      mitigation,
    };
  }

  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score <= 3) return 'LOW';
    if (score <= 5) return 'MEDIUM';
    if (score <= 7) return 'HIGH';
    return 'CRITICAL';
  }

  private calculateOverallRisk(risks: RiskMetric[]): number {
    const weights = [0.3, 0.2, 0.2, 0.15, 0.15]; // Different weights for each risk type

    return risks.reduce((sum, risk, index) => {
      return sum + risk.score * weights[index];
    }, 0);
  }

  private generateRecommendations(
    _protocols: ProtocolAnalysis[],
    opportunities: YieldOpportunity[],
    riskScores: RiskScoreCard,
    context: AgentContext,
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Check for high yield opportunities
    const topOpportunity = opportunities[0];
    if (topOpportunity && topOpportunity.riskAdjustedReturn > 5) {
      recommendations.push({
        type: 'OPPORTUNITY',
        priority: 'HIGH',
        title: `High yield opportunity in ${topOpportunity.protocol}`,
        description: `${topOpportunity.totalAPY.toFixed(2)}% APY with acceptable risk`,
        expectedImpact: `Potential ${topOpportunity.totalAPY.toFixed(2)}% annual return`,
        implementation: [
          `Deposit ${topOpportunity.asset} on ${topOpportunity.chain}`,
          `Use ${topOpportunity.protocol} protocol`,
          'Monitor position daily for first week',
        ],
      });
    }

    // Risk warnings
    if (riskScores.overallRisk > 7) {
      recommendations.push({
        type: 'WARNING',
        priority: 'URGENT',
        title: 'High overall risk detected',
        description: 'Portfolio risk exceeds recommended levels',
        expectedImpact: 'Potential for significant losses',
        implementation: [
          'Reduce exposure to risky protocols',
          'Diversify across chains and protocols',
          'Consider more conservative strategies',
        ],
      });
    }

    // Gas optimization
    const inefficientOpps = opportunities.filter((o) => o.gasEfficiency < 50);
    if (inefficientOpps.length > 0) {
      recommendations.push({
        type: 'ACTION',
        priority: 'MEDIUM',
        title: 'Optimize gas costs',
        description: 'Some opportunities have high gas costs',
        expectedImpact: 'Save 20-30% on transaction fees',
        implementation: [
          'Batch transactions when possible',
          'Use Layer 2 solutions',
          'Time transactions for low gas periods',
        ],
      });
    }

    // Diversification recommendation
    if (
      opportunities.length > 0 &&
      context.options?.amount &&
      (context.options?.amount as number) > 10000
    ) {
      recommendations.push({
        type: 'ACTION',
        priority: 'HIGH',
        title: 'Diversify across multiple protocols',
        description: 'Spread risk across 3-5 protocols',
        expectedImpact: 'Reduce concentration risk by 40%',
        implementation: [
          'Allocate no more than 40% to single protocol',
          'Mix different risk levels',
          'Include both lending and liquidity strategies',
        ],
      });
    }

    return recommendations;
  }

  private createAllocationStrategy(
    opportunities: YieldOpportunity[],
    riskScores: RiskScoreCard,
    gasData: any,
    context: AgentContext,
  ): AllocationStrategy {
    const totalAmount = (context.options?.amount as number) || 10000;
    const strategy = context.options?.strategy || 'balanced';

    const allocations = this.calculateAllocations(
      opportunities,
      totalAmount,
      strategy as string,
      riskScores,
    );

    const expectedAPY = this.calculateExpectedAPY(allocations);
    const riskLevel = this.determineRiskLevel(riskScores.overallRisk);
    const gasOptimization = this.optimizeGas(allocations, gasData);
    const rebalanceFrequency = this.determineRebalanceFrequency(strategy as string);

    return {
      totalAmount,
      allocations,
      expectedAPY,
      riskLevel,
      gasOptimization,
      rebalanceFrequency,
    };
  }

  private calculateAllocations(
    opportunities: YieldOpportunity[],
    totalAmount: number,
    strategy: string,
    _riskScores: RiskScoreCard,
  ): Allocation[] {
    const allocations: Allocation[] = [];
    let remainingAmount = totalAmount;

    // Strategy-based allocation percentages
    const maxAllocations = {
      conservative: 3,
      balanced: 5,
      aggressive: 7,
    };

    const maxPerProtocol = {
      conservative: 0.4,
      balanced: 0.3,
      aggressive: 0.25,
    };

    const maxCount = maxAllocations[strategy as keyof typeof maxAllocations] || 5;
    const maxPercent = maxPerProtocol[strategy as keyof typeof maxPerProtocol] || 0.3;

    // Allocate to top opportunities
    const eligibleOpps = opportunities.slice(0, maxCount);

    for (const opp of eligibleOpps) {
      const allocationPercent = this.calculateAllocationPercent(opp, strategy, maxPercent);

      const amount = Math.min(totalAmount * allocationPercent, remainingAmount);

      if (amount < 100) continue; // Skip tiny allocations

      allocations.push({
        protocol: opp.protocol,
        asset: opp.asset,
        chain: opp.chain,
        amount,
        percentage: (amount / totalAmount) * 100,
        expectedReturn: amount * (opp.totalAPY / 100),
        reason: this.getAllocationReason(opp, strategy),
      });

      remainingAmount -= amount;
    }

    // Add remaining to stablecoin yield if conservative
    if (strategy === 'conservative' && remainingAmount > 100) {
      allocations.push({
        protocol: 'Aave',
        asset: 'USDC',
        chain: 'arbitrum',
        amount: remainingAmount,
        percentage: (remainingAmount / totalAmount) * 100,
        expectedReturn: remainingAmount * 0.05, // 5% safe yield
        reason: 'Safety reserve in blue-chip protocol',
      });
    }

    return allocations;
  }

  private calculateAllocationPercent(
    opp: YieldOpportunity,
    strategy: string,
    maxPercent: number,
  ): number {
    // Base allocation on risk-adjusted return
    let percent = Math.min(maxPercent, opp.riskAdjustedReturn / 20);

    // Adjust based on strategy
    if (strategy === 'conservative' && opp.risks.length > 2) {
      percent *= 0.5;
    } else if (strategy === 'aggressive' && opp.totalAPY > 20) {
      percent *= 1.2;
    }

    return Math.min(maxPercent, percent);
  }

  private getAllocationReason(opp: YieldOpportunity, strategy: string): string {
    if (strategy === 'conservative') {
      return `Low-risk yield with ${opp.protocol}`;
    } else if (strategy === 'aggressive') {
      return `High APY opportunity: ${opp.totalAPY.toFixed(2)}%`;
    }

    return `Balanced risk-reward in ${opp.protocol}`;
  }

  private calculateExpectedAPY(allocations: Allocation[]): number {
    const totalAmount = allocations.reduce((sum, a) => sum + a.amount, 0);
    const totalReturn = allocations.reduce((sum, a) => sum + a.expectedReturn, 0);

    return totalAmount > 0 ? (totalReturn / totalAmount) * 100 : 0;
  }

  private determineRiskLevel(overallRisk: number): string {
    if (overallRisk <= 3) return 'Low Risk';
    if (overallRisk <= 5) return 'Medium Risk';
    if (overallRisk <= 7) return 'High Risk';
    return 'Very High Risk';
  }

  private optimizeGas(allocations: Allocation[], gasData: any): GasStrategy {
    // Find most gas-efficient chain
    const chainCounts = new Map<string, number>();
    allocations.forEach((a) => {
      chainCounts.set(a.chain, (chainCounts.get(a.chain) || 0) + 1);
    });

    const optimalChain =
      Array.from(chainCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'arbitrum';

    const chainGas = gasData[optimalChain] || {};

    return {
      optimalChain,
      bridgingCost: chainGas.bridge || 20,
      deploymentCost: allocations.length * (chainGas.deposit || 50),
      monthlyMaintenanceCost: allocations.length * (chainGas.claim || 30),
      breakEvenTime: '2-3 months',
    };
  }

  private determineRebalanceFrequency(strategy: string): string {
    switch (strategy) {
      case 'conservative':
        return 'Quarterly';
      case 'balanced':
        return 'Monthly';
      case 'aggressive':
        return 'Weekly';
      default:
        return 'Monthly';
    }
  }
}
