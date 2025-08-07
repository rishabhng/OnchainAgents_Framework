/**
 * @fileoverview RiskAnalyzer - Portfolio Risk Assessment and Hedging Expert
 * @module agents/security/RiskAnalyzer
 *
 * Comprehensive risk analysis agent that evaluates portfolio exposure,
 * concentration risks, correlation matrices, and provides hedging strategies
 * for crypto portfolios.
 *
 * @since 1.1.0
 */

import { z } from 'zod';
import { BaseAgent, AgentContext, AgentConfig } from '../base/BaseAgent';
import { IHiveService } from '../../interfaces/IHiveService';

interface RiskAnalyzerResult {
  portfolioRiskScore: number; // 0-10 risk scale
  concentrationRisk: ConcentrationRisk;
  correlationRisk: CorrelationRisk;
  volatilityMetrics: VolatilityMetrics;
  recommendations: string[];
  verdict: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface ConcentrationRisk {
  topPositionPercentage: number;
  top3PositionsPercentage: number;
  largestAsset: string;
  sectorConcentration: Record<string, number>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface CorrelationRisk {
  averageCorrelation: number;
  maxCorrelation: number;
  stressCorrelation: number;
  correlationMatrix?: Record<string, Record<string, number>>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface VolatilityMetrics {
  thirtyDayVolatility: number;
  maxDrawdown: number;
  valueAtRisk95: number;
  expectedShortfall: number;
  sharpeRatio: number;
}

export class RiskAnalyzer extends BaseAgent {
  constructor(hiveService: IHiveService) {
    const config: AgentConfig = {
      name: 'RiskAnalyzer',
      description:
        'Analyzes portfolio risk through concentration, correlation, and volatility metrics',
      version: '1.0.0',
      cacheTTL: 900, // 15 minutes cache for risk data
      maxRetries: 3,
      timeout: 30000,
    };

    super(config, hiveService);
  }

  protected validateInput(_context: AgentContext): z.ZodSchema {
    return z.object({
      network: z.string().optional(),
      address: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/)
        .optional(),
      portfolio: z
        .array(
          z.object({
            symbol: z.string(),
            amount: z.number(),
            value: z.number(),
          }),
        )
        .optional(),
      options: z
        .object({
          includeCorrelation: z.boolean().optional(),
          timeframe: z.enum(['7d', '30d', '90d', '1y']).optional(),
          benchmark: z.string().optional(),
        })
        .optional(),
    });
  }

  protected async performAnalysis(context: AgentContext): Promise<RiskAnalyzerResult> {
    this.logger.info('Starting risk analysis', {
      address: context.address,
      portfolio: (context as any).portfolio,
    });

    // Get portfolio data
    const portfolio = await this.getPortfolioData(context);

    // Parallel risk calculations
    const [concentrationRisk, correlationRisk, volatilityMetrics, _historicalData] =
      await Promise.all([
        this.calculateConcentrationRisk(portfolio),
        this.calculateCorrelationRisk(portfolio, context),
        this.calculateVolatilityMetrics(portfolio, context),
        this.getHistoricalData(portfolio, context),
      ]);

    // Calculate overall risk score
    const portfolioRiskScore = this.calculateOverallRiskScore(
      concentrationRisk,
      correlationRisk,
      volatilityMetrics,
    );

    // Determine verdict
    const verdict = this.determineVerdict(portfolioRiskScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      concentrationRisk,
      correlationRisk,
      volatilityMetrics,
      portfolioRiskScore,
    );

    return {
      portfolioRiskScore,
      concentrationRisk,
      correlationRisk,
      volatilityMetrics,
      recommendations,
      verdict,
    };
  }

  private async getPortfolioData(context: AgentContext): Promise<any> {
    if ((context as any).portfolio) {
      return (context as any).portfolio;
    }

    if (context.address) {
      // Fetch wallet holdings
      const response = await this.hiveService.request('/wallet/holdings', {
        address: context.address,
        network: context.network || 'ethereum',
      });
      return response.data;
    }

    throw new Error('No portfolio or wallet address provided');
  }

  private async calculateConcentrationRisk(portfolio: any): Promise<ConcentrationRisk> {
    const totalValue = portfolio.reduce((sum: number, asset: any) => sum + asset.value, 0);
    const sortedAssets = [...portfolio].sort((a, b) => b.value - a.value);

    const topPositionPercentage = (sortedAssets[0]?.value / totalValue) * 100 || 0;
    const top3PositionsPercentage =
      (sortedAssets.slice(0, 3).reduce((sum, asset) => sum + asset.value, 0) / totalValue) * 100;

    // Calculate sector concentration
    const sectorConcentration: Record<string, number> = {};
    for (const asset of portfolio) {
      const sector = asset.category || 'Unknown';
      sectorConcentration[sector] =
        (sectorConcentration[sector] || 0) + (asset.value / totalValue) * 100;
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (topPositionPercentage > 40 || top3PositionsPercentage > 70) {
      riskLevel = 'HIGH';
    } else if (topPositionPercentage > 25 || top3PositionsPercentage > 50) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    return {
      topPositionPercentage,
      top3PositionsPercentage,
      largestAsset: sortedAssets[0]?.symbol || 'N/A',
      sectorConcentration,
      riskLevel,
    };
  }

  private async calculateCorrelationRisk(
    portfolio: any,
    context: AgentContext,
  ): Promise<CorrelationRisk> {
    if (!context.options?.includeCorrelation) {
      // Return simplified correlation risk without detailed matrix
      return {
        averageCorrelation: 0.6, // Default assumption
        maxCorrelation: 0.8,
        stressCorrelation: 0.9,
        riskLevel: 'MEDIUM',
      };
    }

    // Fetch correlation data
    const symbols = portfolio.map((asset: any) => asset.symbol);
    const response = await this.hiveService.request('/market/correlations', {
      symbols,
      timeframe: context.options?.timeframe || '30d',
    });

    const correlationData = response.data;

    // Calculate metrics
    const correlations = Object.values(correlationData.matrix || {})
      .flatMap((row: any) => Object.values(row))
      .filter((val: any) => typeof val === 'number' && val !== 1);

    const averageCorrelation =
      correlations.length > 0
        ? correlations.reduce((sum: number, val: any) => sum + val, 0) / correlations.length
        : 0;

    const maxCorrelation = Math.max(...(correlations as number[]), 0);
    const stressCorrelation = maxCorrelation * 1.2; // Assume 20% increase during stress

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (averageCorrelation > 0.8 || maxCorrelation > 0.9) {
      riskLevel = 'HIGH';
    } else if (averageCorrelation > 0.6 || maxCorrelation > 0.75) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    return {
      averageCorrelation,
      maxCorrelation,
      stressCorrelation: Math.min(stressCorrelation, 0.99),
      correlationMatrix: correlationData.matrix,
      riskLevel,
    };
  }

  private async calculateVolatilityMetrics(
    portfolio: any,
    context: AgentContext,
  ): Promise<VolatilityMetrics> {
    const timeframe = context.options?.timeframe || '30d';

    // Fetch historical data for volatility calculation
    const response = await this.hiveService.request('/portfolio/metrics', {
      portfolio: portfolio.map((asset: any) => ({
        symbol: asset.symbol,
        weight: asset.value,
      })),
      timeframe,
    });

    const metrics = response.data;

    return {
      thirtyDayVolatility: metrics.volatility || 0,
      maxDrawdown: metrics.maxDrawdown || 0,
      valueAtRisk95: metrics.var95 || 0,
      expectedShortfall: metrics.expectedShortfall || 0,
      sharpeRatio: metrics.sharpeRatio || 0,
    };
  }

  private async getHistoricalData(portfolio: any, context: AgentContext): Promise<any> {
    // Fetch historical performance data
    return this.hiveService.request('/portfolio/historical', {
      portfolio: portfolio.map((asset: any) => asset.symbol),
      timeframe: context.options?.timeframe || '30d',
    });
  }

  private calculateOverallRiskScore(
    concentration: ConcentrationRisk,
    correlation: CorrelationRisk,
    volatility: VolatilityMetrics,
  ): number {
    let score = 5; // Start at medium risk

    // Concentration adjustments
    if (concentration.riskLevel === 'HIGH') score += 2;
    else if (concentration.riskLevel === 'LOW') score -= 1;

    // Correlation adjustments
    if (correlation.riskLevel === 'HIGH') score += 1.5;
    else if (correlation.riskLevel === 'LOW') score -= 1;

    // Volatility adjustments
    if (volatility.thirtyDayVolatility > 100) score += 2;
    else if (volatility.thirtyDayVolatility > 50) score += 1;
    else if (volatility.thirtyDayVolatility < 20) score -= 1;

    // Sharpe ratio adjustments
    if (volatility.sharpeRatio < 0.5) score += 1;
    else if (volatility.sharpeRatio > 1.5) score -= 1;

    // Max drawdown adjustments
    if (volatility.maxDrawdown > 50) score += 1.5;
    else if (volatility.maxDrawdown > 30) score += 0.5;
    else if (volatility.maxDrawdown < 10) score -= 0.5;

    // Clamp between 0 and 10
    return Math.max(0, Math.min(10, score));
  }

  private determineVerdict(score: number): RiskAnalyzerResult['verdict'] {
    if (score >= 8) return 'CRITICAL';
    if (score >= 6) return 'HIGH';
    if (score >= 4) return 'MEDIUM';
    return 'LOW';
  }

  private generateRecommendations(
    concentration: ConcentrationRisk,
    correlation: CorrelationRisk,
    volatility: VolatilityMetrics,
    riskScore: number,
  ): string[] {
    const recommendations: string[] = [];

    // Concentration recommendations
    if (concentration.riskLevel === 'HIGH') {
      recommendations.push(
        `🚨 URGENT: Reduce ${concentration.largestAsset} exposure from ${concentration.topPositionPercentage.toFixed(1)}% to <25%`,
      );
      recommendations.push('💡 Diversify across more assets to reduce concentration risk');
    }

    // Correlation recommendations
    if (correlation.riskLevel === 'HIGH') {
      recommendations.push('📊 Add uncorrelated assets (stablecoins, BTC, commodities)');
      recommendations.push('⚠️ High correlation means portfolio moves as single asset');
    }

    // Volatility recommendations
    if (volatility.thirtyDayVolatility > 70) {
      recommendations.push('📉 Consider reducing position sizes in volatile assets');
      recommendations.push('🛡️ Add defensive positions or stablecoins');
    }

    if (volatility.sharpeRatio < 0.5) {
      recommendations.push('📊 Poor risk-adjusted returns - review asset selection');
    }

    // General recommendations based on score
    if (riskScore >= 7) {
      recommendations.push('🎯 Target risk score: <6.0 through rebalancing');
      recommendations.push('⏰ Rebalance within 7 days to reduce risk');
    } else if (riskScore <= 3) {
      recommendations.push('✅ Risk level acceptable, maintain current allocation');
      recommendations.push('💡 Consider slightly more risk for higher returns');
    }

    return recommendations;
  }
}
