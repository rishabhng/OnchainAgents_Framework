import { z } from 'zod';
import { BaseAgent, AgentContext, AgentConfig } from '../base/BaseAgent';
import { HiveBridge } from '../../bridges/hive-bridge';

interface RugDetectorResult {
  score: number; // 0-100 safety score
  verdict: 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';
  risks: Risk[];
  warnings: Warning[];
  contractAnalysis: ContractAnalysis;
  liquidityAnalysis: LiquidityAnalysis;
  ownershipAnalysis: OwnershipAnalysis;
  recommendations: string[];
}

interface Risk {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  impact: string;
}

interface Warning {
  type: string;
  message: string;
}

interface ContractAnalysis {
  isVerified: boolean;
  hasHoneypotFunction: boolean;
  hasMintFunction: boolean;
  hasBlacklist: boolean;
  hasPausable: boolean;
  hasProxyPattern: boolean;
  hasHiddenOwner: boolean;
  maxTransactionAmount: number | null;
  buyTax: number;
  sellTax: number;
}

interface LiquidityAnalysis {
  totalLiquidity: number;
  lockedLiquidity: number;
  lockedPercentage: number;
  lockDuration: number | null;
  liquidityProviders: number;
  topHolderPercentage: number;
  isRenounced: boolean;
}

interface OwnershipAnalysis {
  ownerAddress: string | null;
  isRenounced: boolean;
  ownerBalance: number;
  ownerPercentage: number;
  creatorAddress: string;
  deploymentDate: Date;
  contractAge: number; // in days
}

export class RugDetector extends BaseAgent {
  constructor(hiveBridge: HiveBridge) {
    const config: AgentConfig = {
      name: 'RugDetector',
      description: 'Identifies potential scams, rugpulls, and honeypots in crypto tokens',
      version: '1.0.0',
      cacheTTL: 1800, // 30 minutes cache for security data
      maxRetries: 3,
      timeout: 30000,
    };
    
    super(config, hiveBridge);
  }
  
  protected validateInput(context: AgentContext): z.ZodSchema {
    return z.object({
      network: z.string().min(1),
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      options: z.object({
        deepScan: z.boolean().optional(),
        checkSocials: z.boolean().optional(),
        historicalAnalysis: z.boolean().optional(),
      }).optional(),
    });
  }
  
  protected async performAnalysis(context: AgentContext): Promise<RugDetectorResult> {
    this.logger.info('Starting rug detection analysis', {
      network: context.network,
      address: context.address,
    });
    
    // Parallel analysis of different aspects
    const [
      contractData,
      liquidityData,
      ownershipData,
      securityData,
      holderData,
    ] = await Promise.all([
      this.analyzeContract(context),
      this.analyzeLiquidity(context),
      this.analyzeOwnership(context),
      this.getSecurityAnalysis(context),
      this.analyzeHolders(context),
    ]);
    
    // Calculate risk score
    const risks = this.identifyRisks(contractData, liquidityData, ownershipData);
    const warnings = this.generateWarnings(contractData, liquidityData, ownershipData);
    const score = this.calculateSafetyScore(risks, warnings);
    const verdict = this.determineVerdict(score, risks);
    const recommendations = this.generateRecommendations(risks, warnings, score);
    
    return {
      score,
      verdict,
      risks,
      warnings,
      contractAnalysis: contractData,
      liquidityAnalysis: liquidityData,
      ownershipAnalysis: ownershipData,
      recommendations,
    };
  }
  
  private async analyzeContract(context: AgentContext): Promise<ContractAnalysis> {
    const response = await this.hiveBridge.callTool('hive_security_scan', {
      network: context.network,
      address: context.address,
      depth: 'comprehensive',
    });
    
    if (!response.success || !response.data) {
      throw new Error(`Contract analysis failed: ${response.error}`);
    }
    
    const data = response.data as any;
    
    return {
      isVerified: data?.contractVerified || false,
      hasHoneypotFunction: data?.honeypot || false,
      hasMintFunction: data?.mintable || false,
      hasBlacklist: data?.blacklist || false,
      hasPausable: data?.pausable || false,
      hasProxyPattern: data?.proxy || false,
      hasHiddenOwner: data?.hiddenOwner || false,
      maxTransactionAmount: data?.maxTx || null,
      buyTax: data?.buyTax || 0,
      sellTax: data?.sellTax || 0,
    };
  }
  
  private async analyzeLiquidity(context: AgentContext): Promise<LiquidityAnalysis> {
    const response = await this.hiveBridge.callTool('hive_token_data', {
      network: context.network,
      address: context.address,
    });
    
    if (!response.success || !response.data) {
      throw new Error(`Liquidity analysis failed: ${response.error}`);
    }
    
    const data = response.data as any;
    
    return {
      totalLiquidity: data?.totalLiquidity || 0,
      lockedLiquidity: data?.lockedLiquidity || 0,
      lockedPercentage: data?.lockedPercentage || 0,
      lockDuration: data?.lockDuration || null,
      liquidityProviders: data?.lpCount || 0,
      topHolderPercentage: data?.topHolderPercent || 0,
      isRenounced: data?.renounced || false,
    };
  }
  
  private async analyzeOwnership(context: AgentContext): Promise<OwnershipAnalysis> {
    const response = await this.hiveBridge.callTool('hive_token_data', {
      network: context.network,
      address: context.address,
    });
    
    if (!response.success || !response.data) {
      throw new Error(`Ownership analysis failed: ${response.error}`);
    }
    
    const data = response.data as any;
    const contractAge = data?.deploymentDate 
      ? Math.floor((Date.now() - new Date(data.deploymentDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    return {
      ownerAddress: data?.owner || null,
      isRenounced: data?.renounced || false,
      ownerBalance: data?.ownerBalance || 0,
      ownerPercentage: data?.ownerPercent || 0,
      creatorAddress: data?.creator || '',
      deploymentDate: data?.deploymentDate ? new Date(data.deploymentDate) : new Date(),
      contractAge,
    };
  }
  
  private async getSecurityAnalysis(context: AgentContext): Promise<any> {
    const response = await this.hiveBridge.callTool('hive_security_scan', {
      network: context.network!,
      address: context.address!,
      depth: 'comprehensive',
    });
    
    return response.success ? response.data : null;
  }
  
  private async analyzeHolders(context: AgentContext): Promise<any> {
    const response = await this.hiveBridge.callTool('hive_token_data', {
      network: context.network,
      address: context.address,
    });
    
    return response.success ? response.data : null;
  }
  
  private identifyRisks(
    contract: ContractAnalysis,
    liquidity: LiquidityAnalysis,
    ownership: OwnershipAnalysis,
  ): Risk[] {
    const risks: Risk[] = [];
    
    // Contract risks
    if (contract.hasHoneypotFunction) {
      risks.push({
        type: 'HONEYPOT',
        severity: 'CRITICAL',
        description: 'Contract contains honeypot functions',
        impact: 'Users cannot sell tokens after buying',
      });
    }
    
    if (!contract.isVerified) {
      risks.push({
        type: 'UNVERIFIED_CONTRACT',
        severity: 'HIGH',
        description: 'Contract source code is not verified',
        impact: 'Hidden malicious functions possible',
      });
    }
    
    if (contract.hasMintFunction && !ownership.isRenounced) {
      risks.push({
        type: 'MINT_FUNCTION',
        severity: 'HIGH',
        description: 'Owner can mint new tokens',
        impact: 'Token supply can be inflated',
      });
    }
    
    if (contract.hasBlacklist) {
      risks.push({
        type: 'BLACKLIST_FUNCTION',
        severity: 'HIGH',
        description: 'Contract has blacklist functionality',
        impact: 'Addresses can be blocked from trading',
      });
    }
    
    // Liquidity risks
    if (liquidity.lockedPercentage < 50) {
      risks.push({
        type: 'LOW_LIQUIDITY_LOCK',
        severity: 'HIGH',
        description: `Only ${liquidity.lockedPercentage}% of liquidity is locked`,
        impact: 'Liquidity can be pulled (rugpull)',
      });
    }
    
    if (liquidity.totalLiquidity < 10000) {
      risks.push({
        type: 'LOW_LIQUIDITY',
        severity: 'MEDIUM',
        description: `Low total liquidity: $${this.formatNumber(liquidity.totalLiquidity)}`,
        impact: 'High price volatility and slippage',
      });
    }
    
    // Ownership risks
    if (ownership.ownerPercentage > 10 && !ownership.isRenounced) {
      risks.push({
        type: 'HIGH_OWNER_BALANCE',
        severity: 'HIGH',
        description: `Owner holds ${ownership.ownerPercentage}% of supply`,
        impact: 'Owner can dump tokens and crash price',
      });
    }
    
    if (ownership.contractAge < 7) {
      risks.push({
        type: 'NEW_CONTRACT',
        severity: 'MEDIUM',
        description: `Contract is only ${ownership.contractAge} days old`,
        impact: 'Higher risk of rugpull or abandonment',
      });
    }
    
    // Tax risks
    if (contract.buyTax > 10 || contract.sellTax > 10) {
      risks.push({
        type: 'HIGH_TAX',
        severity: 'MEDIUM',
        description: `High taxes: Buy ${contract.buyTax}%, Sell ${contract.sellTax}%`,
        impact: 'Significant loss on transactions',
      });
    }
    
    return risks;
  }
  
  private generateWarnings(
    contract: ContractAnalysis,
    liquidity: LiquidityAnalysis,
    ownership: OwnershipAnalysis,
  ): Warning[] {
    const warnings: Warning[] = [];
    
    if (contract.hasProxyPattern) {
      warnings.push({
        type: 'PROXY_CONTRACT',
        message: 'Contract uses proxy pattern - logic can be changed',
      });
    }
    
    if (contract.hasPausable) {
      warnings.push({
        type: 'PAUSABLE',
        message: 'Contract can be paused by owner',
      });
    }
    
    if (liquidity.liquidityProviders < 10) {
      warnings.push({
        type: 'FEW_LP_PROVIDERS',
        message: `Only ${liquidity.liquidityProviders} liquidity providers`,
      });
    }
    
    if (liquidity.topHolderPercentage > 30) {
      warnings.push({
        type: 'CONCENTRATED_HOLDINGS',
        message: `Top holder owns ${liquidity.topHolderPercentage}% of supply`,
      });
    }
    
    return warnings;
  }
  
  private calculateSafetyScore(risks: Risk[], warnings: Warning[]): number {
    let score = 100;
    
    // Deduct points based on risk severity
    for (const risk of risks) {
      switch (risk.severity) {
        case 'CRITICAL':
          score -= 40;
          break;
        case 'HIGH':
          score -= 20;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
        case 'LOW':
          score -= 5;
          break;
      }
    }
    
    // Deduct points for warnings
    score -= warnings.length * 3;
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }
  
  private determineVerdict(score: number, risks: Risk[]): RugDetectorResult['verdict'] {
    const hasCritical = risks.some(r => r.severity === 'CRITICAL');
    
    if (hasCritical || score < 30) {
      return 'CRITICAL';
    } else if (score < 50) {
      return 'DANGER';
    } else if (score < 70) {
      return 'WARNING';
    } else {
      return 'SAFE';
    }
  }
  
  private generateRecommendations(
    risks: Risk[],
    warnings: Warning[],
    score: number,
  ): string[] {
    const recommendations: string[] = [];
    
    if (score < 50) {
      recommendations.push('⚠️ HIGH RISK: Consider avoiding this token');
    }
    
    if (risks.some(r => r.type === 'HONEYPOT')) {
      recommendations.push('🚫 DO NOT BUY: Honeypot detected - you cannot sell');
    }
    
    if (risks.some(r => r.type === 'UNVERIFIED_CONTRACT')) {
      recommendations.push('📝 Request contract verification from the team');
    }
    
    if (risks.some(r => r.type === 'LOW_LIQUIDITY_LOCK')) {
      recommendations.push('🔒 Wait for liquidity to be locked for longer period');
    }
    
    if (risks.some(r => r.type === 'HIGH_OWNER_BALANCE')) {
      recommendations.push('👤 Monitor owner wallet for large transfers');
    }
    
    if (risks.some(r => r.type === 'NEW_CONTRACT')) {
      recommendations.push('⏰ Wait for contract to mature (>30 days)');
    }
    
    if (score >= 70) {
      recommendations.push('✅ Relatively safe, but always DYOR');
      recommendations.push('💡 Set stop-loss orders to protect investment');
    }
    
    return recommendations;
  }
}