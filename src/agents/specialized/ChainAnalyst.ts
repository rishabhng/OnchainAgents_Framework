/**
 * @fileoverview ChainAnalyst - On-Chain Forensics and Transaction Tracing Expert
 * @module agents/specialized/ChainAnalyst
 *
 * Advanced blockchain forensics agent specializing in transaction tracing,
 * flow analysis, wallet clustering, and on-chain investigation for
 * security analysis and compliance purposes.
 *
 * @since 1.1.0
 */

import { z } from 'zod';
import { BaseAgent, AgentContext, AgentConfig } from '../base/BaseAgent';
import { IHiveService } from '../../interfaces/IHiveService';

interface ChainAnalysisResult {
  transactionAnalysis: TransactionAnalysis;
  addressProfile: AddressProfile;
  networkMetrics: NetworkMetrics;
  flowAnalysis: FlowAnalysis;
  clusterIdentification: ClusterAnalysis;
  behaviorPatterns: BehaviorPattern[];
  anomalies: Anomaly[];
  forensicInsights: ForensicInsight[];
  recommendation: ChainRecommendation;
  timestamp: Date;
}

interface TransactionAnalysis {
  txHash: string;
  type: 'TRANSFER' | 'SWAP' | 'CONTRACT_CALL' | 'DEPLOYMENT' | 'BRIDGE';
  value: number;
  gasUsed: number;
  gasPrice: number;
  nonce: number;
  inputData: string;
  internalTxs: InternalTransaction[];
  tokenTransfers: TokenTransfer[];
  logs: EventLog[];
  traceAnalysis: TraceResult;
}

interface InternalTransaction {
  from: string;
  to: string;
  value: number;
  type: string;
  gasUsed: number;
}

interface TokenTransfer {
  token: string;
  from: string;
  to: string;
  amount: number;
  symbol: string;
  decimals: number;
}

interface EventLog {
  address: string;
  topics: string[];
  data: string;
  decoded: any;
}

interface TraceResult {
  callStack: string[];
  storageAccess: string[];
  opcodes: string[];
  gasBreakdown: Record<string, number>;
}

interface AddressProfile {
  address: string;
  type: 'EOA' | 'CONTRACT' | 'MULTISIG' | 'EXCHANGE' | 'MIXER';
  balance: number;
  nonce: number;
  firstSeen: Date;
  lastSeen: Date;
  totalTransactions: number;
  totalVolume: number;
  gasSpent: number;
  tags: string[];
  riskScore: number;
  associatedAddresses: string[];
}

interface NetworkMetrics {
  blockHeight: number;
  networkHashrate: number;
  difficulty: number;
  gasPrice: number;
  pendingTxCount: number;
  mempoolSize: number;
  avgBlockTime: number;
  tps: number;
  networkUtilization: number;
}

interface FlowAnalysis {
  sourceAddress: string;
  destinationAddress: string;
  totalFlow: number;
  pathways: FlowPath[];
  intermediaries: string[];
  mixerUsage: boolean;
  bridgeUsage: boolean;
  cexInteraction: boolean;
  timespan: number;
  hops: number;
}

interface FlowPath {
  path: string[];
  amount: number;
  timestamp: Date;
  gasUsed: number;
  type: 'DIRECT' | 'INDIRECT' | 'MIXED' | 'BRIDGED';
}

interface ClusterAnalysis {
  clusterId: string;
  addresses: string[];
  commonOwner: boolean;
  confidence: number;
  clusterType: 'WALLET' | 'EXCHANGE' | 'PROTOCOL' | 'MIXER' | 'UNKNOWN';
  totalBalance: number;
  activity: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface BehaviorPattern {
  type: 'WASH_TRADING' | 'SYBIL' | 'FRONT_RUNNING' | 'SANDWICH' | 'ARBITRAGE' | 'NORMAL';
  confidence: number;
  evidence: string[];
  frequency: number;
  lastOccurrence: Date;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Anomaly {
  type: 'GAS' | 'VALUE' | 'FREQUENCY' | 'PATTERN' | 'CONTRACT';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  timestamp: Date;
  affectedAddresses: string[];
  recommendation: string;
}

interface ForensicInsight {
  finding: string;
  confidence: number;
  evidence: string[];
  implications: string[];
  recommendations: string[];
}

interface ChainRecommendation {
  riskLevel: 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER';
  confidence: number;
  actions: string[];
  monitoring: string[];
  reporting: boolean;
  timeline: string;
}

export class ChainAnalyst extends BaseAgent {
  constructor(hiveService: IHiveService) {
    const config: AgentConfig = {
      name: 'ChainAnalyst',
      description: 'On-chain forensics expert for transaction tracing and address analysis',
      version: '1.0.0',
      cacheTTL: 300,
      maxRetries: 3,
      timeout: 60000,
    };

    super(config, hiveService);
  }

  protected validateInput(_context: AgentContext): z.ZodSchema {
    return z.object({
      address: z.string().optional(),
      network: z.string().optional(),
      options: z
        .object({
          txHash: z.string().optional(),
          depth: z.number().optional(),
          timeRange: z.enum(['1h', '24h', '7d', '30d', 'all']).optional(),
          includeTrace: z.boolean().optional(),
          clusterAnalysis: z.boolean().optional(),
          followMoney: z.boolean().optional(),
        })
        .optional(),
    });
  }

  protected async performAnalysis(context: AgentContext): Promise<ChainAnalysisResult> {
    this.logger.info('Starting chain analysis', {
      address: context.address,
      txHash: context.options?.txHash,
      network: context.network || 'ethereum',
    });

    const [txData, addressData, networkData, flowData, clusterData, behaviorData] =
      await Promise.all([
        this.getTransactionData(context),
        this.getAddressData(context),
        this.getNetworkMetrics(context),
        this.getFlowAnalysis(context),
        this.getClusterData(context),
        this.getBehaviorAnalysis(context),
      ]);

    const transactionAnalysis = this.analyzeTransaction(txData, context);
    const addressProfile = this.profileAddress(addressData);
    const networkMetrics = this.processNetworkMetrics(networkData);
    const flowAnalysis = this.analyzeFlow(flowData, context);
    const clusterIdentification = this.identifyClusters(clusterData, addressData);
    const behaviorPatterns = this.detectBehaviorPatterns(behaviorData, txData);
    const anomalies = this.detectAnomalies(txData, addressData, networkData);
    const forensicInsights = this.generateForensicInsights(
      transactionAnalysis,
      addressProfile,
      flowAnalysis,
      behaviorPatterns,
    );
    const recommendation = this.generateRecommendation(
      addressProfile,
      behaviorPatterns,
      anomalies,
      forensicInsights,
    );

    return {
      transactionAnalysis,
      addressProfile,
      networkMetrics,
      flowAnalysis,
      clusterIdentification,
      behaviorPatterns,
      anomalies,
      forensicInsights,
      recommendation,
      timestamp: new Date(),
    };
  }

  private async getTransactionData(context: AgentContext): Promise<any> {
    if (!context.options?.txHash) return {};

    return this.hiveService.callTool('hive_transaction', {
      txHash: context.options.txHash,
      includeTrace: context.options?.includeTrace,
      network: context.network || 'ethereum',
    });
  }

  private async getAddressData(context: AgentContext): Promise<any> {
    if (!context.address) return {};

    return this.hiveService.callTool('hive_address', {
      address: context.address,
      timeRange: context.options?.timeRange || '30d',
      network: context.network || 'ethereum',
    });
  }

  private async getNetworkMetrics(context: AgentContext): Promise<any> {
    return this.hiveService.callTool('hive_network', {
      network: context.network || 'ethereum',
    });
  }

  private async getFlowAnalysis(context: AgentContext): Promise<any> {
    if (!context.options?.followMoney || !context.address) return {};

    return this.hiveService.callTool('hive_flow', {
      address: context.address,
      depth: context.options?.depth || 5,
      network: context.network || 'ethereum',
    });
  }

  private async getClusterData(context: AgentContext): Promise<any> {
    if (!context.options?.clusterAnalysis || !context.address) return {};

    return this.hiveService.callTool('hive_cluster', {
      address: context.address,
      network: context.network || 'ethereum',
    });
  }

  private async getBehaviorAnalysis(context: AgentContext): Promise<any> {
    if (!context.address) return {};

    return this.hiveService.callTool('hive_behavior', {
      address: context.address,
      timeRange: context.options?.timeRange || '30d',
      network: context.network || 'ethereum',
    });
  }

  private analyzeTransaction(txData: any, context: AgentContext): TransactionAnalysis {
    const data = txData.data || {};

    return {
      txHash: (context.options?.txHash as string | undefined) || '',
      type: this.classifyTransaction(data),
      value: data.value || 0,
      gasUsed: data.gasUsed || 0,
      gasPrice: data.gasPrice || 0,
      nonce: data.nonce || 0,
      inputData: data.input || '0x',
      internalTxs: this.processInternalTransactions(data.internalTransactions),
      tokenTransfers: this.processTokenTransfers(data.tokenTransfers),
      logs: this.processEventLogs(data.logs),
      traceAnalysis: this.analyzeTrace(data.trace),
    };
  }

  private classifyTransaction(data: any): TransactionAnalysis['type'] {
    if (data.to === null) return 'DEPLOYMENT';
    if (data.tokenTransfers?.length > 0) return 'SWAP';
    if (data.input === '0x') return 'TRANSFER';
    if (data.logs?.some((l: any) => l.topics[0]?.includes('bridge'))) return 'BRIDGE';
    return 'CONTRACT_CALL';
  }

  private processInternalTransactions(internals: any[]): InternalTransaction[] {
    if (!internals) return [];

    return internals.map((tx) => ({
      from: tx.from,
      to: tx.to,
      value: tx.value,
      type: tx.type,
      gasUsed: tx.gasUsed,
    }));
  }

  private processTokenTransfers(transfers: any[]): TokenTransfer[] {
    if (!transfers) return [];

    return transfers.map((t) => ({
      token: t.token,
      from: t.from,
      to: t.to,
      amount: t.amount,
      symbol: t.symbol,
      decimals: t.decimals,
    }));
  }

  private processEventLogs(logs: any[]): EventLog[] {
    if (!logs) return [];

    return logs.map((log) => ({
      address: log.address,
      topics: log.topics,
      data: log.data,
      decoded: log.decoded || {},
    }));
  }

  private analyzeTrace(trace: any): TraceResult {
    if (!trace) {
      return {
        callStack: [],
        storageAccess: [],
        opcodes: [],
        gasBreakdown: {},
      };
    }

    return {
      callStack: trace.calls?.map((c: any) => c.type) || [],
      storageAccess: trace.storage || [],
      opcodes: trace.opcodes || [],
      gasBreakdown: trace.gasBreakdown || {},
    };
  }

  private profileAddress(addressData: any): AddressProfile {
    const data = addressData.data || {};

    return {
      address: data.address || '',
      type: this.classifyAddress(data),
      balance: data.balance || 0,
      nonce: data.nonce || 0,
      firstSeen: new Date(data.firstSeen || Date.now()),
      lastSeen: new Date(data.lastSeen || Date.now()),
      totalTransactions: data.txCount || 0,
      totalVolume: data.totalVolume || 0,
      gasSpent: data.gasSpent || 0,
      tags: data.tags || [],
      riskScore: this.calculateRiskScore(data),
      associatedAddresses: data.associated || [],
    };
  }

  private classifyAddress(data: any): AddressProfile['type'] {
    if (data.isContract) {
      if (data.isMultisig) return 'MULTISIG';
      if (data.isExchange) return 'EXCHANGE';
      if (data.isMixer) return 'MIXER';
      return 'CONTRACT';
    }
    return 'EOA';
  }

  private calculateRiskScore(data: any): number {
    let score = 0;

    if (data.isMixer) score += 30;
    if (data.blacklisted) score += 40;
    if (data.suspiciousActivity) score += 20;
    if (data.highValueTx) score += 10;

    return Math.min(100, score);
  }

  private processNetworkMetrics(networkData: any): NetworkMetrics {
    const data = networkData.data || {};

    return {
      blockHeight: data.blockHeight || 0,
      networkHashrate: data.hashrate || 0,
      difficulty: data.difficulty || 0,
      gasPrice: data.gasPrice || 0,
      pendingTxCount: data.pendingTxs || 0,
      mempoolSize: data.mempoolSize || 0,
      avgBlockTime: data.avgBlockTime || 15,
      tps: data.tps || 0,
      networkUtilization: data.utilization || 0,
    };
  }

  private analyzeFlow(flowData: any, context: AgentContext): FlowAnalysis {
    const data = flowData.data || {};

    return {
      sourceAddress: context.address || '',
      destinationAddress: data.destination || '',
      totalFlow: data.totalAmount || 0,
      pathways: this.processFlowPaths(data.paths),
      intermediaries: data.intermediaries || [],
      mixerUsage: data.mixerDetected || false,
      bridgeUsage: data.bridgeDetected || false,
      cexInteraction: data.cexDetected || false,
      timespan: data.timespan || 0,
      hops: data.maxHops || 0,
    };
  }

  private processFlowPaths(paths: any[]): FlowPath[] {
    if (!paths) return [];

    return paths.map((p) => ({
      path: p.addresses || [],
      amount: p.amount || 0,
      timestamp: new Date(p.timestamp || Date.now()),
      gasUsed: p.gasUsed || 0,
      type: this.classifyPath(p),
    }));
  }

  private classifyPath(path: any): FlowPath['type'] {
    if (path.mixer) return 'MIXED';
    if (path.bridge) return 'BRIDGED';
    if (path.addresses?.length > 2) return 'INDIRECT';
    return 'DIRECT';
  }

  private identifyClusters(clusterData: any, _addressData: any): ClusterAnalysis {
    const data = clusterData.data || {};

    return {
      clusterId: data.clusterId || 'unknown',
      addresses: data.addresses || [],
      commonOwner: data.commonOwner || false,
      confidence: data.confidence || 0,
      clusterType: this.classifyCluster(data),
      totalBalance: data.totalBalance || 0,
      activity: this.assessActivity(data),
    };
  }

  private classifyCluster(data: any): ClusterAnalysis['clusterType'] {
    if (data.isExchange) return 'EXCHANGE';
    if (data.isProtocol) return 'PROTOCOL';
    if (data.isMixer) return 'MIXER';
    if (data.isWallet) return 'WALLET';
    return 'UNKNOWN';
  }

  private assessActivity(data: any): 'HIGH' | 'MEDIUM' | 'LOW' {
    const txPerDay = data.dailyTxCount || 0;
    if (txPerDay > 100) return 'HIGH';
    if (txPerDay > 10) return 'MEDIUM';
    return 'LOW';
  }

  private detectBehaviorPatterns(behaviorData: any, _txData: any): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    const behaviors = behaviorData.data?.patterns || [];

    for (const behavior of behaviors) {
      patterns.push({
        type: behavior.type || 'NORMAL',
        confidence: behavior.confidence || 0,
        evidence: behavior.evidence || [],
        frequency: behavior.frequency || 0,
        lastOccurrence: new Date(behavior.lastSeen || Date.now()),
        impact: this.assessImpact(behavior),
      });
    }

    return patterns;
  }

  private assessImpact(behavior: any): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (behavior.type === 'FRONT_RUNNING' || behavior.type === 'SANDWICH') return 'HIGH';
    if (behavior.type === 'WASH_TRADING' || behavior.type === 'SYBIL') return 'MEDIUM';
    return 'LOW';
  }

  private detectAnomalies(txData: any, addressData: any, networkData: any): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Gas anomaly
    if (txData.data?.gasUsed > networkData.data?.avgGas * 5) {
      anomalies.push({
        type: 'GAS',
        severity: 'HIGH',
        description: 'Abnormally high gas usage detected',
        timestamp: new Date(),
        affectedAddresses: [txData.data?.from, txData.data?.to].filter(Boolean),
        recommendation: 'Investigate for potential inefficiency or attack',
      });
    }

    // Value anomaly
    if (addressData.data?.avgTxValue && txData.data?.value > addressData.data.avgTxValue * 10) {
      anomalies.push({
        type: 'VALUE',
        severity: 'MEDIUM',
        description: 'Transaction value significantly above average',
        timestamp: new Date(),
        affectedAddresses: [addressData.data?.address].filter(Boolean),
        recommendation: 'Monitor for potential money laundering',
      });
    }

    return anomalies;
  }

  private generateForensicInsights(
    _tx: TransactionAnalysis,
    address: AddressProfile,
    flow: FlowAnalysis,
    patterns: BehaviorPattern[],
  ): ForensicInsight[] {
    const insights: ForensicInsight[] = [];

    // Mixer usage insight
    if (flow.mixerUsage) {
      insights.push({
        finding: 'Mixer service usage detected in transaction flow',
        confidence: 0.9,
        evidence: ['Mixer contract interaction', 'Obfuscated fund flow'],
        implications: ['Potential privacy concerns', 'Regulatory compliance issues'],
        recommendations: ['Enhanced due diligence', 'Source of funds verification'],
      });
    }

    // Suspicious patterns
    const suspicious = patterns.filter((p) => p.type !== 'NORMAL' && p.confidence > 0.7);
    if (suspicious.length > 0) {
      insights.push({
        finding: `${suspicious.length} suspicious behavior patterns detected`,
        confidence: Math.max(...suspicious.map((s) => s.confidence)),
        evidence: suspicious.map((s) => s.type),
        implications: ['Potential malicious activity', 'Market manipulation risk'],
        recommendations: ['Immediate investigation', 'Report to authorities if confirmed'],
      });
    }

    // High risk address
    if (address.riskScore > 70) {
      insights.push({
        finding: 'High-risk address identified',
        confidence: 0.8,
        evidence: [`Risk score: ${address.riskScore}`, ...address.tags],
        implications: ['Potential security threat', 'Compliance risk'],
        recommendations: ['Block interactions', 'Flag for monitoring'],
      });
    }

    return insights;
  }

  private generateRecommendation(
    address: AddressProfile,
    patterns: BehaviorPattern[],
    anomalies: Anomaly[],
    insights: ForensicInsight[],
  ): ChainRecommendation {
    const highSeverityAnomalies = anomalies.filter((a) => a.severity === 'HIGH');
    const suspiciousPatterns = patterns.filter((p) => p.type !== 'NORMAL' && p.impact === 'HIGH');
    const criticalInsights = insights.filter((i) => i.confidence > 0.8);

    let riskLevel: ChainRecommendation['riskLevel'];
    let confidence = 0.7;

    if (address.riskScore > 80 || highSeverityAnomalies.length > 2) {
      riskLevel = 'DANGER';
      confidence = 0.9;
    } else if (address.riskScore > 60 || suspiciousPatterns.length > 1) {
      riskLevel = 'WARNING';
      confidence = 0.8;
    } else if (address.riskScore > 40 || anomalies.length > 0) {
      riskLevel = 'CAUTION';
      confidence = 0.75;
    } else {
      riskLevel = 'SAFE';
      confidence = 0.85;
    }

    const actions: string[] = [];
    const monitoring: string[] = [];

    if (riskLevel === 'DANGER') {
      actions.push('Block all interactions immediately');
      actions.push('Report to compliance team');
      monitoring.push('24/7 monitoring required');
    } else if (riskLevel === 'WARNING') {
      actions.push('Enhanced due diligence required');
      monitoring.push('Daily monitoring recommended');
    } else if (riskLevel === 'CAUTION') {
      actions.push('Standard KYC procedures');
      monitoring.push('Weekly review sufficient');
    }

    const reporting = riskLevel === 'DANGER' || criticalInsights.length > 0;
    const timeline =
      riskLevel === 'DANGER' ? 'Immediate' : riskLevel === 'WARNING' ? '24 hours' : '1 week';

    return {
      riskLevel,
      confidence,
      actions,
      monitoring,
      reporting,
      timeline,
    };
  }
}
