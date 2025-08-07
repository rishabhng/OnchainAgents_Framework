/**
 * @fileoverview GovernanceAdvisor - DAO Governance and Proposal Analysis Expert
 * @module agents/specialized/GovernanceAdvisor
 *
 * Expert agent for analyzing DAO governance structures, proposal impacts,
 * voting power distribution, and providing strategic governance recommendations
 * for decentralized autonomous organizations.
 *
 * @since 1.1.0
 */

import { z } from 'zod';
import { BaseAgent, AgentContext, AgentConfig } from '../base/BaseAgent';
import { IHiveService } from '../../interfaces/IHiveService';

interface GovernanceAnalysis {
  protocol: ProtocolInfo;
  proposal: ProposalAnalysis;
  votingPower: VotingPowerAnalysis;
  historicalGovernance: HistoricalAnalysis;
  stakeholderAlignment: StakeholderAnalysis;
  treasuryImpact: TreasuryImpact;
  risks: GovernanceRisk[];
  recommendation: GovernanceRecommendation;
  timestamp: Date;
}

interface ProtocolInfo {
  name: string;
  address: string;
  tokenSymbol: string;
  totalSupply: number;
  circulatingSupply: number;
  votingMechanism: 'TOKEN' | 'QUADRATIC' | 'DELEGATION' | 'CONVICTION';
  quorumRequirement: number;
  proposalThreshold: number;
  timelockPeriod: number;
}

interface ProposalAnalysis {
  id: string;
  title: string;
  type: 'PARAMETER' | 'FUNDING' | 'UPGRADE' | 'STRATEGIC';
  status: 'PENDING' | 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED';
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  votesFor: number;
  votesAgainst: number;
  participation: number;
  timeRemaining: number;
  executionRisk: number;
  technicalComplexity: number;
}

interface VotingPowerAnalysis {
  topHolders: VoterProfile[];
  concentration: number; // Gini coefficient
  delegationPatterns: DelegationPattern[];
  swingVoters: string[];
  whaleInfluence: number;
  decentralizationScore: number;
}

interface VoterProfile {
  address: string;
  votingPower: number;
  historicalParticipation: number;
  alignmentScore: number;
  delegatedFrom: number;
  votingPattern: 'SUPPORTIVE' | 'OPPOSING' | 'NEUTRAL' | 'STRATEGIC';
}

interface DelegationPattern {
  delegator: string;
  delegate: string;
  amount: number;
  reason: string;
}

interface HistoricalAnalysis {
  totalProposals: number;
  passRate: number;
  avgParticipation: number;
  controversialProposals: number;
  executionSuccess: number;
  governanceEvolution: string[];
}

interface StakeholderAnalysis {
  coreTeam: number;
  investors: number;
  community: number;
  treasury: number;
  alignmentScore: number;
  conflictPotential: number;
}

interface TreasuryImpact {
  currentBalance: number;
  proposedSpend: number;
  burnRate: number;
  sustainability: number; // months
  diversification: number;
  yieldGeneration: number;
}

interface GovernanceRisk {
  type: 'CENTRALIZATION' | 'VOTER_APATHY' | 'PLUTOCRACY' | 'ATTACK' | 'EXECUTION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  mitigation: string;
}

interface GovernanceRecommendation {
  vote: 'FOR' | 'AGAINST' | 'ABSTAIN';
  confidence: number;
  reasoning: string[];
  alternativeProposals: string[];
  delegationSuggestion: string;
  timelineCritical: boolean;
}

export class GovernanceAdvisor extends BaseAgent {
  constructor(hiveService: IHiveService) {
    const config: AgentConfig = {
      name: 'GovernanceAdvisor',
      description: 'DAO governance expert analyzing proposals and voting dynamics',
      version: '1.0.0',
      cacheTTL: 1800, // 30 minutes
      maxRetries: 3,
      timeout: 40000,
    };

    super(config, hiveService);
  }

  protected validateInput(_context: AgentContext): z.ZodSchema {
    return z.object({
      address: z.string().optional(),
      network: z.string().optional(),
      options: z
        .object({
          proposalId: z.string().optional(),
          includeHistory: z.boolean().optional(),
          delegationAnalysis: z.boolean().optional(),
          simulateOutcome: z.boolean().optional(),
        })
        .optional(),
    });
  }

  protected async performAnalysis(context: AgentContext): Promise<GovernanceAnalysis> {
    this.logger.info('Starting governance analysis', {
      protocol: context.address,
      proposal: context.options?.proposalId,
    });

    const [protocolData, proposalData, votingData, historicalData, treasuryData, delegationData] =
      await Promise.all([
        this.getProtocolData(context),
        this.getProposalData(context),
        this.getVotingPowerData(context),
        this.getHistoricalData(context),
        this.getTreasuryData(context),
        this.getDelegationData(context),
      ]);

    const protocol = this.processProtocolInfo(protocolData);
    const proposal = this.analyzeProposal(proposalData, protocolData);
    const votingPower = this.analyzeVotingPower(votingData, delegationData);
    const historicalGovernance = this.analyzeHistory(historicalData);
    const stakeholderAlignment = this.analyzeStakeholders(votingData, protocolData);
    const treasuryImpact = this.assessTreasuryImpact(treasuryData, proposalData);
    const risks = this.identifyRisks(votingPower, proposal, historicalGovernance);
    const recommendation = this.generateRecommendation(
      proposal,
      votingPower,
      stakeholderAlignment,
      risks,
    );

    return {
      protocol,
      proposal,
      votingPower,
      historicalGovernance,
      stakeholderAlignment,
      treasuryImpact,
      risks,
      recommendation,
      timestamp: new Date(),
    };
  }

  private async getProtocolData(context: AgentContext): Promise<any> {
    return this.hiveService.callTool('hive_governance_protocol', {
      address: context.address,
      network: context.network || 'ethereum',
    });
  }

  private async getProposalData(context: AgentContext): Promise<any> {
    return this.hiveService.callTool('hive_governance_proposal', {
      protocol: context.address,
      proposalId: context.options?.proposalId,
      network: context.network || 'ethereum',
    });
  }

  private async getVotingPowerData(context: AgentContext): Promise<any> {
    return this.hiveService.callTool('hive_voting_power', {
      protocol: context.address,
      topHolders: 100,
      network: context.network || 'ethereum',
    });
  }

  private async getHistoricalData(context: AgentContext): Promise<any> {
    if (!context.options?.includeHistory) return {};

    return this.hiveService.callTool('hive_governance_history', {
      protocol: context.address,
      limit: 50,
      network: context.network || 'ethereum',
    });
  }

  private async getTreasuryData(context: AgentContext): Promise<any> {
    return this.hiveService.callTool('hive_treasury', {
      protocol: context.address,
      network: context.network || 'ethereum',
    });
  }

  private async getDelegationData(context: AgentContext): Promise<any> {
    if (!context.options?.delegationAnalysis) return {};

    return this.hiveService.callTool('hive_delegations', {
      protocol: context.address,
      network: context.network || 'ethereum',
    });
  }

  private processProtocolInfo(data: any): ProtocolInfo {
    return {
      name: data.data?.name || 'Unknown',
      address: data.data?.address || '',
      tokenSymbol: data.data?.symbol || '',
      totalSupply: data.data?.totalSupply || 0,
      circulatingSupply: data.data?.circulatingSupply || 0,
      votingMechanism: this.determineVotingMechanism(data.data),
      quorumRequirement: data.data?.quorum || 0,
      proposalThreshold: data.data?.proposalThreshold || 0,
      timelockPeriod: data.data?.timelock || 0,
    };
  }

  private determineVotingMechanism(data: any): ProtocolInfo['votingMechanism'] {
    if (data?.quadratic) return 'QUADRATIC';
    if (data?.delegation) return 'DELEGATION';
    if (data?.conviction) return 'CONVICTION';
    return 'TOKEN';
  }

  private analyzeProposal(proposalData: any, protocolData: any): ProposalAnalysis {
    const data = proposalData.data || {};

    return {
      id: data.id || '',
      title: data.title || '',
      type: this.categorizeProposal(data),
      status: data.status || 'PENDING',
      description: data.description || '',
      impact: this.assessImpact(data),
      votesFor: data.votesFor || 0,
      votesAgainst: data.votesAgainst || 0,
      participation: this.calculateParticipation(data, protocolData),
      timeRemaining: data.endTime - Date.now(),
      executionRisk: this.assessExecutionRisk(data),
      technicalComplexity: this.assessComplexity(data),
    };
  }

  private categorizeProposal(data: any): ProposalAnalysis['type'] {
    const description = (data.description || '').toLowerCase();
    if (description.includes('parameter') || description.includes('config')) return 'PARAMETER';
    if (description.includes('fund') || description.includes('grant')) return 'FUNDING';
    if (description.includes('upgrade') || description.includes('v2')) return 'UPGRADE';
    return 'STRATEGIC';
  }

  private assessImpact(data: any): ProposalAnalysis['impact'] {
    const value = data.value || 0;
    const votes = (data.votesFor || 0) + (data.votesAgainst || 0);

    if (value > 1000000 || votes > 10000) return 'CRITICAL';
    if (value > 100000 || votes > 1000) return 'HIGH';
    if (value > 10000 || votes > 100) return 'MEDIUM';
    return 'LOW';
  }

  private calculateParticipation(proposal: any, protocol: any): number {
    const totalVotes = (proposal.votesFor || 0) + (proposal.votesAgainst || 0);
    const eligibleVoters = protocol.data?.circulatingSupply || 1;
    return (totalVotes / eligibleVoters) * 100;
  }

  private assessExecutionRisk(data: any): number {
    // 0-100 score based on complexity and value
    let risk = 0;

    if (data.value > 1000000) risk += 30;
    if (data.codeChanges) risk += 20;
    if (data.externalCalls) risk += 25;
    if (data.upgradeable) risk += 25;

    return Math.min(100, risk);
  }

  private assessComplexity(data: any): number {
    let complexity = 0;

    if (data.codeChanges) complexity += 30;
    if (data.parameters?.length > 5) complexity += 20;
    if (data.dependencies?.length > 0) complexity += 25;
    if (data.multiSig) complexity += 25;

    return Math.min(100, complexity);
  }

  private analyzeVotingPower(votingData: any, delegationData: any): VotingPowerAnalysis {
    const holders = votingData.data?.holders || [];
    const topHolders = this.processTopHolders(holders);
    const concentration = this.calculateConcentration(holders);
    const delegationPatterns = this.analyzeDelegations(delegationData);
    const swingVoters = this.identifySwingVoters(holders);
    const whaleInfluence = this.calculateWhaleInfluence(holders);
    const decentralizationScore = this.calculateDecentralization(concentration, whaleInfluence);

    return {
      topHolders,
      concentration,
      delegationPatterns,
      swingVoters,
      whaleInfluence,
      decentralizationScore,
    };
  }

  private processTopHolders(holders: any[]): VoterProfile[] {
    return holders.slice(0, 20).map((h) => ({
      address: h.address,
      votingPower: h.balance,
      historicalParticipation: h.participation || 0,
      alignmentScore: h.alignment || 50,
      delegatedFrom: h.delegatedBalance || 0,
      votingPattern: this.classifyVotingPattern(h),
    }));
  }

  private classifyVotingPattern(holder: any): VoterProfile['votingPattern'] {
    const supportRate = holder.supportRate || 0.5;
    if (supportRate > 0.8) return 'SUPPORTIVE';
    if (supportRate < 0.2) return 'OPPOSING';
    if (holder.participation < 0.3) return 'NEUTRAL';
    return 'STRATEGIC';
  }

  private calculateConcentration(holders: any[]): number {
    // Gini coefficient calculation
    if (holders.length === 0) return 0;

    const balances = holders.map((h) => h.balance).sort((a, b) => a - b);
    const n = balances.length;
    const sum = balances.reduce((a, b) => a + b, 0);

    let gini = 0;
    for (let i = 0; i < n; i++) {
      gini += (2 * (i + 1) - n - 1) * balances[i];
    }

    return (gini / (n * sum)) * 100;
  }

  private analyzeDelegations(delegationData: any): DelegationPattern[] {
    const delegations = delegationData.data?.delegations || [];
    return delegations.slice(0, 10).map((d: any) => ({
      delegator: d.from,
      delegate: d.to,
      amount: d.amount,
      reason: d.reason || 'Unknown',
    }));
  }

  private identifySwingVoters(holders: any[]): string[] {
    return holders
      .filter(
        (h) => h.balance > 1000 && h.participation > 0.5 && Math.abs(h.supportRate - 0.5) < 0.2,
      )
      .map((h) => h.address)
      .slice(0, 5);
  }

  private calculateWhaleInfluence(holders: any[]): number {
    const top10Balance = holders.slice(0, 10).reduce((sum, h) => sum + h.balance, 0);
    const totalBalance = holders.reduce((sum, h) => sum + h.balance, 0);
    return totalBalance > 0 ? (top10Balance / totalBalance) * 100 : 0;
  }

  private calculateDecentralization(concentration: number, whaleInfluence: number): number {
    // Higher score = more decentralized
    const giniScore = Math.max(0, 100 - concentration);
    const whaleScore = Math.max(0, 100 - whaleInfluence);
    return (giniScore + whaleScore) / 2;
  }

  private analyzeHistory(historicalData: any): HistoricalAnalysis {
    const proposals = historicalData.data?.proposals || [];
    const passed = proposals.filter((p: any) => p.status === 'PASSED').length;
    const totalParticipation = proposals.reduce((sum: number, p: any) => sum + p.participation, 0);
    const controversial = proposals.filter(
      (p: any) => Math.abs(p.votesFor - p.votesAgainst) < p.votesFor * 0.1,
    ).length;
    const executed = proposals.filter((p: any) => p.executed).length;

    return {
      totalProposals: proposals.length,
      passRate: proposals.length > 0 ? (passed / proposals.length) * 100 : 0,
      avgParticipation: proposals.length > 0 ? totalParticipation / proposals.length : 0,
      controversialProposals: controversial,
      executionSuccess: passed > 0 ? (executed / passed) * 100 : 0,
      governanceEvolution: this.trackGovernanceEvolution(proposals),
    };
  }

  private trackGovernanceEvolution(proposals: any[]): string[] {
    const evolution: string[] = [];

    // Track major governance changes
    const upgrades = proposals.filter((p: any) => p.type === 'UPGRADE');
    if (upgrades.length > 0) {
      evolution.push(`${upgrades.length} protocol upgrades implemented`);
    }

    const paramChanges = proposals.filter((p: any) => p.type === 'PARAMETER');
    if (paramChanges.length > 5) {
      evolution.push('Frequent parameter adjustments indicate active governance');
    }

    return evolution;
  }

  private analyzeStakeholders(votingData: any, protocolData: any): StakeholderAnalysis {
    const holders = votingData.data?.holders || [];
    const protocol = protocolData.data || {};

    // Categorize stakeholders
    const coreTeam = holders
      .filter((h: any) => h.tags?.includes('team'))
      .reduce((sum: number, h: any) => sum + h.balance, 0);
    const investors = holders
      .filter((h: any) => h.tags?.includes('investor'))
      .reduce((sum: number, h: any) => sum + h.balance, 0);
    const treasury = protocol.treasuryBalance || 0;
    const total = holders.reduce((sum: number, h: any) => sum + h.balance, 0);
    const community = total - coreTeam - investors - treasury;

    const alignmentScore = this.calculateAlignment(coreTeam, investors, community, total);
    const conflictPotential = this.assessConflictPotential(coreTeam, investors, community, total);

    return {
      coreTeam: (coreTeam / total) * 100,
      investors: (investors / total) * 100,
      community: (community / total) * 100,
      treasury: (treasury / total) * 100,
      alignmentScore,
      conflictPotential,
    };
  }

  private calculateAlignment(
    team: number,
    investors: number,
    community: number,
    total: number,
  ): number {
    // Higher score = better alignment
    const teamRatio = team / total;
    const investorRatio = investors / total;
    const communityRatio = community / total;

    // Ideal ratios
    const idealTeam = 0.15;
    const idealInvestor = 0.25;
    const idealCommunity = 0.6;

    const teamDiff = Math.abs(teamRatio - idealTeam);
    const investorDiff = Math.abs(investorRatio - idealInvestor);
    const communityDiff = Math.abs(communityRatio - idealCommunity);

    return Math.max(0, 100 - (teamDiff + investorDiff + communityDiff) * 100);
  }

  private assessConflictPotential(
    team: number,
    investors: number,
    community: number,
    total: number,
  ): number {
    const ratios = [team / total, investors / total, community / total];
    const maxRatio = Math.max(...ratios);

    // High concentration in any group increases conflict potential
    if (maxRatio > 0.5) return 80;
    if (maxRatio > 0.4) return 60;
    if (maxRatio > 0.3) return 40;
    return 20;
  }

  private assessTreasuryImpact(treasuryData: any, proposalData: any): TreasuryImpact {
    const treasury = treasuryData.data || {};
    const proposal = proposalData.data || {};

    const currentBalance = treasury.balance || 0;
    const proposedSpend = proposal.value || 0;
    const burnRate = treasury.monthlySpend || 0;
    const sustainability = burnRate > 0 ? currentBalance / burnRate : 999;
    const diversification = this.calculateDiversification(treasury.assets || []);
    const yieldGeneration = treasury.yield || 0;

    return {
      currentBalance,
      proposedSpend,
      burnRate,
      sustainability,
      diversification,
      yieldGeneration,
    };
  }

  private calculateDiversification(assets: any[]): number {
    if (assets.length === 0) return 0;

    // Herfindahl index for concentration
    const total = assets.reduce((sum, a) => sum + a.value, 0);
    const hhi = assets.reduce((sum, a) => sum + Math.pow(a.value / total, 2), 0);

    return Math.max(0, 100 * (1 - hhi));
  }

  private identifyRisks(
    votingPower: VotingPowerAnalysis,
    proposal: ProposalAnalysis,
    history: HistoricalAnalysis,
  ): GovernanceRisk[] {
    const risks: GovernanceRisk[] = [];

    if (votingPower.concentration > 60) {
      risks.push({
        type: 'CENTRALIZATION',
        severity: votingPower.concentration > 80 ? 'CRITICAL' : 'HIGH',
        description: 'High voting power concentration',
        mitigation: 'Implement delegation incentives',
      });
    }

    if (history.avgParticipation < 10) {
      risks.push({
        type: 'VOTER_APATHY',
        severity: history.avgParticipation < 5 ? 'HIGH' : 'MEDIUM',
        description: 'Low voter participation',
        mitigation: 'Introduce participation rewards',
      });
    }

    if (votingPower.whaleInfluence > 50) {
      risks.push({
        type: 'PLUTOCRACY',
        severity: 'HIGH',
        description: 'Whale-dominated governance',
        mitigation: 'Consider quadratic voting',
      });
    }

    if (proposal.executionRisk > 70) {
      risks.push({
        type: 'EXECUTION',
        severity: 'HIGH',
        description: 'High technical execution risk',
        mitigation: 'Implement phased rollout',
      });
    }

    return risks;
  }

  private generateRecommendation(
    proposal: ProposalAnalysis,
    votingPower: VotingPowerAnalysis,
    stakeholders: StakeholderAnalysis,
    risks: GovernanceRisk[],
  ): GovernanceRecommendation {
    const criticalRisks = risks.filter((r) => r.severity === 'CRITICAL');
    const highRisks = risks.filter((r) => r.severity === 'HIGH');

    let vote: GovernanceRecommendation['vote'];
    let confidence = 70;
    const reasoning: string[] = [];

    if (criticalRisks.length > 0) {
      vote = 'AGAINST';
      confidence = 90;
      reasoning.push('Critical governance risks identified');
    } else if (proposal.impact === 'CRITICAL' && stakeholders.alignmentScore < 50) {
      vote = 'AGAINST';
      confidence = 80;
      reasoning.push('Poor stakeholder alignment for critical proposal');
    } else if (highRisks.length <= 1 && proposal.participation > 20) {
      vote = 'FOR';
      confidence = 75;
      reasoning.push('Acceptable risk with good participation');
    } else {
      vote = 'ABSTAIN';
      confidence = 60;
      reasoning.push('Mixed signals require further analysis');
    }

    if (votingPower.decentralizationScore < 30) {
      reasoning.push('Poor decentralization score');
    }

    const alternativeProposals = [
      'Consider phased implementation',
      'Request additional security audits',
      'Reduce scope to minimize risk',
    ];

    const delegationSuggestion =
      votingPower.swingVoters.length > 0
        ? `Consider delegating to swing voter: ${votingPower.swingVoters[0]}`
        : 'Delegate to aligned community members';

    const timelineCritical = proposal.timeRemaining < 86400000; // Less than 24 hours

    return {
      vote,
      confidence,
      reasoning,
      alternativeProposals,
      delegationSuggestion,
      timelineCritical,
    };
  }
}
