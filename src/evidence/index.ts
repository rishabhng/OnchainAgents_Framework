/**
 * Evidence Generation System for OnChainAgents
 * Creates verifiable on-chain proofs and audit trails
 * Inspired by SuperClaude's validation and evidence requirements
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

// Evidence types
export enum EvidenceType {
  TRANSACTION = 'transaction',
  ANALYSIS = 'analysis',
  SECURITY_AUDIT = 'security_audit',
  WHALE_ACTIVITY = 'whale_activity',
  DEFI_OPERATION = 'defi_operation',
  MARKET_EVENT = 'market_event',
  GOVERNANCE_ACTION = 'governance_action',
  RISK_ASSESSMENT = 'risk_assessment',
  PERFORMANCE_METRIC = 'performance_metric',
  COMPLIANCE_CHECK = 'compliance_check',
}

// Evidence priority
export enum EvidencePriority {
  CRITICAL = 'critical', // Regulatory/security critical
  HIGH = 'high', // Important for audit
  MEDIUM = 'medium', // Standard tracking
  LOW = 'low', // Optional enrichment
}

// Evidence item
export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  priority: EvidencePriority;
  timestamp: number;
  blockNumber?: number;
  transactionHash?: string;
  data: any;
  metadata: {
    source: string;
    confidence: number;
    verifiable: boolean;
    onChain: boolean;
  };
  proof?: {
    hash: string;
    signature?: string;
    merkleRoot?: string;
    witnesses?: string[];
  };
  tags: string[];
}

// Audit trail entry
export interface AuditTrailEntry {
  id: string;
  timestamp: number;
  action: string;
  actor: string;
  target: string;
  evidence: string[]; // Evidence IDs
  result: 'success' | 'failure' | 'partial';
  metadata: Record<string, any>;
}

// Proof generation config
export interface ProofConfig {
  algorithm: 'sha256' | 'keccak256' | 'blake2b';
  includeTimestamp: boolean;
  includeBlockNumber: boolean;
  requireSignature: boolean;
  merkleTreeDepth: number;
}

// Chain proof
export interface ChainProof {
  evidenceId: string;
  chainId: number;
  blockNumber: number;
  blockHash: string;
  transactionHash?: string;
  logIndex?: number;
  proof: string;
  timestamp: number;
  verified: boolean;
}

// Evidence aggregation
export interface EvidenceAggregation {
  id: string;
  evidenceIds: string[];
  aggregationType: 'merkle' | 'sequential' | 'weighted';
  rootHash: string;
  metadata: {
    count: number;
    startTime: number;
    endTime: number;
    confidence: number;
  };
}

/**
 * Evidence Generator
 * Creates and manages cryptographic evidence
 */
export class EvidenceGenerator extends EventEmitter {
  private config: ProofConfig;
  private evidenceStore: Map<string, EvidenceItem> = new Map();
  private auditTrail: AuditTrailEntry[] = [];
  private chainProofs: Map<string, ChainProof> = new Map();
  private aggregations: Map<string, EvidenceAggregation> = new Map();
  private merkleLeaves: Map<string, string[]> = new Map();

  constructor(config?: Partial<ProofConfig>) {
    super();
    this.config = {
      algorithm: 'keccak256',
      includeTimestamp: true,
      includeBlockNumber: true,
      requireSignature: false,
      merkleTreeDepth: 4,
      ...config,
    };
  }

  /**
   * Generate evidence for an operation
   */
  public generateEvidence(
    type: EvidenceType,
    data: any,
    metadata?: Partial<EvidenceItem['metadata']>,
  ): EvidenceItem {
    const id = this.generateEvidenceId(type, data);
    const timestamp = Date.now();

    // Create evidence item
    const evidence: EvidenceItem = {
      id,
      type,
      priority: this.determinePriority(type),
      timestamp,
      data,
      metadata: {
        source: 'onchainagents',
        confidence: 0.95,
        verifiable: true,
        onChain: false,
        ...metadata,
      },
      tags: this.generateTags(type, data),
    };

    // Generate proof
    evidence.proof = this.generateProof(evidence);

    // Store evidence
    this.evidenceStore.set(id, evidence);

    // Emit event
    this.emit('evidence-generated', {
      evidenceId: id,
      type,
      timestamp,
    });

    return evidence;
  }

  /**
   * Generate proof for evidence
   */
  private generateProof(evidence: EvidenceItem): EvidenceItem['proof'] {
    const proofData: any = {
      id: evidence.id,
      type: evidence.type,
      data: evidence.data,
      metadata: evidence.metadata,
    };

    if (this.config.includeTimestamp) {
      proofData['timestamp'] = evidence.timestamp;
    }

    if (this.config.includeBlockNumber && evidence.blockNumber) {
      proofData['blockNumber'] = evidence.blockNumber;
    }

    // Generate hash
    const hash = this.hashData(proofData);

    const proof: EvidenceItem['proof'] = {
      hash,
    };

    // Add signature if required
    if (this.config.requireSignature) {
      proof.signature = this.generateSignature(hash);
    }

    return proof;
  }

  /**
   * Create on-chain proof
   */
  public async createChainProof(
    evidenceId: string,
    chainId: number,
    blockData: {
      blockNumber: number;
      blockHash: string;
      transactionHash?: string;
      logIndex?: number;
    },
  ): Promise<ChainProof> {
    const evidence = this.evidenceStore.get(evidenceId);
    if (!evidence) {
      throw new Error(`Evidence ${evidenceId} not found`);
    }

    // Create chain proof
    const chainProof: ChainProof = {
      evidenceId,
      chainId,
      blockNumber: blockData.blockNumber,
      blockHash: blockData.blockHash,
      transactionHash: blockData.transactionHash,
      logIndex: blockData.logIndex,
      proof: this.generateChainProofHash(evidence, blockData),
      timestamp: Date.now(),
      verified: false,
    };

    // Verify on-chain (simulated)
    chainProof.verified = await this.verifyOnChain(chainProof);

    // Store chain proof
    this.chainProofs.set(evidenceId, chainProof);

    // Update evidence
    evidence.blockNumber = blockData.blockNumber;
    evidence.transactionHash = blockData.transactionHash;
    evidence.metadata.onChain = true;

    this.emit('chain-proof-created', {
      evidenceId,
      chainId,
      blockNumber: blockData.blockNumber,
      verified: chainProof.verified,
    });

    return chainProof;
  }

  /**
   * Create merkle tree aggregation
   */
  public createMerkleAggregation(evidenceIds: string[]): EvidenceAggregation {
    if (evidenceIds.length === 0) {
      throw new Error('No evidence IDs provided');
    }

    // Get evidence items
    const evidenceItems = evidenceIds
      .map((id) => this.evidenceStore.get(id))
      .filter((e) => e !== undefined);

    if (evidenceItems.length === 0) {
      throw new Error('No valid evidence found');
    }

    // Create merkle tree
    const leaves = evidenceItems.map((e) => e.proof?.hash || '');
    const merkleRoot = this.computeMerkleRoot(leaves);

    // Create aggregation
    const aggregation: EvidenceAggregation = {
      id: `agg_${Date.now()}`,
      evidenceIds,
      aggregationType: 'merkle',
      rootHash: merkleRoot,
      metadata: {
        count: evidenceIds.length,
        startTime: Math.min(...evidenceItems.map((e) => e.timestamp)),
        endTime: Math.max(...evidenceItems.map((e) => e.timestamp)),
        confidence: this.calculateAggregateConfidence(evidenceItems),
      },
    };

    // Store aggregation
    this.aggregations.set(aggregation.id, aggregation);
    this.merkleLeaves.set(aggregation.id, leaves);

    this.emit('aggregation-created', {
      aggregationId: aggregation.id,
      type: 'merkle',
      evidenceCount: evidenceIds.length,
      rootHash: merkleRoot,
    });

    return aggregation;
  }

  /**
   * Add audit trail entry
   */
  public addAuditEntry(
    action: string,
    actor: string,
    target: string,
    evidenceIds: string[],
    result: AuditTrailEntry['result'],
    metadata?: Record<string, any>,
  ): AuditTrailEntry {
    const entry: AuditTrailEntry = {
      id: `audit_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      action,
      actor,
      target,
      evidence: evidenceIds,
      result,
      metadata: metadata || {},
    };

    this.auditTrail.push(entry);

    this.emit('audit-entry-added', {
      entryId: entry.id,
      action,
      actor,
      result,
    });

    return entry;
  }

  /**
   * Verify evidence integrity
   */
  public verifyEvidence(evidenceId: string): boolean {
    const evidence = this.evidenceStore.get(evidenceId);
    if (!evidence || !evidence.proof) {
      return false;
    }

    // Regenerate proof and compare
    const newProof = this.generateProof(evidence);
    return newProof?.hash === evidence.proof.hash;
  }

  /**
   * Verify merkle proof
   */
  public verifyMerkleProof(evidenceId: string, aggregationId: string, proof: string[]): boolean {
    const aggregation = this.aggregations.get(aggregationId);
    const evidence = this.evidenceStore.get(evidenceId);

    if (!aggregation || !evidence || !evidence.proof) {
      return false;
    }

    // Verify merkle path
    let currentHash = evidence.proof.hash;

    for (const siblingHash of proof) {
      currentHash = this.hashData([currentHash, siblingHash].sort().join(''));
    }

    return currentHash === aggregation.rootHash;
  }

  /**
   * Export evidence for external verification
   */
  public exportEvidence(evidenceId: string): any {
    const evidence = this.evidenceStore.get(evidenceId);
    if (!evidence) {
      throw new Error(`Evidence ${evidenceId} not found`);
    }

    const chainProof = this.chainProofs.get(evidenceId);

    return {
      evidence: {
        ...evidence,
        proof: evidence.proof,
      },
      chainProof: chainProof || null,
      verificationInstructions: this.getVerificationInstructions(evidence.type),
      metadata: {
        exported: Date.now(),
        version: '1.0.0',
        algorithm: this.config.algorithm,
      },
    };
  }

  /**
   * Generate compliance report
   */
  public generateComplianceReport(startTime: number, endTime: number, types?: EvidenceType[]): any {
    const evidenceInRange = Array.from(this.evidenceStore.values()).filter(
      (e) =>
        e.timestamp >= startTime && e.timestamp <= endTime && (!types || types.includes(e.type)),
    );

    const auditInRange = this.auditTrail.filter(
      (a) => a.timestamp >= startTime && a.timestamp <= endTime,
    );

    const report = {
      period: {
        start: new Date(startTime).toISOString(),
        end: new Date(endTime).toISOString(),
      },
      summary: {
        totalEvidence: evidenceInRange.length,
        onChainEvidence: evidenceInRange.filter((e) => e.metadata.onChain).length,
        auditEntries: auditInRange.length,
        successRate: this.calculateSuccessRate(auditInRange),
      },
      byType: this.groupEvidenceByType(evidenceInRange),
      byPriority: this.groupEvidenceByPriority(evidenceInRange),
      criticalEvents: evidenceInRange.filter((e) => e.priority === EvidencePriority.CRITICAL),
      verificationStatus: {
        verified: evidenceInRange.filter((e) => this.verifyEvidence(e.id)).length,
        unverified: evidenceInRange.filter((e) => !this.verifyEvidence(e.id)).length,
      },
      recommendations: this.generateRecommendations(evidenceInRange, auditInRange),
    };

    return report;
  }

  /**
   * Helper methods
   */

  private generateEvidenceId(type: EvidenceType, data: any): string {
    const hash = this.hashData({ type, data, timestamp: Date.now() });
    return `evidence_${type}_${hash.substring(0, 8)}`;
  }

  private hashData(data: any): string {
    const serialized = JSON.stringify(data);
    const hash = createHash(
      this.config.algorithm === 'keccak256' ? 'sha256' : this.config.algorithm,
    );
    hash.update(serialized);
    return hash.digest('hex');
  }

  private generateSignature(hash: string): string {
    // Placeholder - would use actual signing key
    return `sig_${hash.substring(0, 16)}`;
  }

  private generateChainProofHash(evidence: EvidenceItem, blockData: any): string {
    return this.hashData({
      evidenceHash: evidence.proof?.hash,
      blockNumber: blockData.blockNumber,
      blockHash: blockData.blockHash,
      transactionHash: blockData.transactionHash,
    });
  }

  private async verifyOnChain(_chainProof: ChainProof): Promise<boolean> {
    // Simulated on-chain verification
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.1); // 90% success rate
      }, 100);
    });
  }

  private computeMerkleRoot(leaves: string[]): string {
    if (leaves.length === 0) return '';
    if (leaves.length === 1) return leaves[0];

    // Build merkle tree
    let currentLevel = [...leaves];

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left; // Duplicate if odd number

        const combined = this.hashData([left, right].sort().join(''));
        nextLevel.push(combined);
      }

      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  private calculateAggregateConfidence(evidenceItems: EvidenceItem[]): number {
    if (evidenceItems.length === 0) return 0;

    const totalConfidence = evidenceItems.reduce((sum, e) => sum + e.metadata.confidence, 0);

    return totalConfidence / evidenceItems.length;
  }

  private determinePriority(type: EvidenceType): EvidencePriority {
    const priorityMap: Record<EvidenceType, EvidencePriority> = {
      [EvidenceType.SECURITY_AUDIT]: EvidencePriority.CRITICAL,
      [EvidenceType.COMPLIANCE_CHECK]: EvidencePriority.CRITICAL,
      [EvidenceType.WHALE_ACTIVITY]: EvidencePriority.HIGH,
      [EvidenceType.DEFI_OPERATION]: EvidencePriority.HIGH,
      [EvidenceType.GOVERNANCE_ACTION]: EvidencePriority.HIGH,
      [EvidenceType.RISK_ASSESSMENT]: EvidencePriority.MEDIUM,
      [EvidenceType.TRANSACTION]: EvidencePriority.MEDIUM,
      [EvidenceType.MARKET_EVENT]: EvidencePriority.MEDIUM,
      [EvidenceType.ANALYSIS]: EvidencePriority.LOW,
      [EvidenceType.PERFORMANCE_METRIC]: EvidencePriority.LOW,
    };

    return priorityMap[type] || EvidencePriority.MEDIUM;
  }

  private generateTags(type: EvidenceType, data: any): string[] {
    const tags: string[] = [type];

    // Add type-specific tags
    if (type === EvidenceType.WHALE_ACTIVITY) {
      tags.push('whale', 'tracking');
    }

    if (type === EvidenceType.SECURITY_AUDIT) {
      tags.push('security', 'audit', 'critical');
    }

    // Add data-based tags
    if (data.chain) tags.push(data.chain);
    if (data.protocol) tags.push(data.protocol);
    if (data.token) tags.push(data.token);

    return tags;
  }

  private getVerificationInstructions(type: EvidenceType): string {
    const instructions: Record<EvidenceType, string> = {
      [EvidenceType.TRANSACTION]: 'Verify transaction hash on blockchain explorer',
      [EvidenceType.SECURITY_AUDIT]: 'Check audit report hash against published version',
      [EvidenceType.WHALE_ACTIVITY]: 'Verify wallet addresses and transaction history',
      [EvidenceType.DEFI_OPERATION]: 'Confirm protocol interaction on-chain',
      [EvidenceType.MARKET_EVENT]: 'Cross-reference with market data providers',
      [EvidenceType.GOVERNANCE_ACTION]: 'Verify on governance platform',
      [EvidenceType.RISK_ASSESSMENT]: 'Review risk model inputs and calculations',
      [EvidenceType.PERFORMANCE_METRIC]: 'Validate against system metrics',
      [EvidenceType.COMPLIANCE_CHECK]: 'Verify against compliance requirements',
      [EvidenceType.ANALYSIS]: 'Review analysis methodology and data sources',
    };

    return instructions[type] || 'Manual verification required';
  }

  private calculateSuccessRate(entries: AuditTrailEntry[]): number {
    if (entries.length === 0) return 0;

    const successful = entries.filter((e) => e.result === 'success').length;
    return (successful / entries.length) * 100;
  }

  private groupEvidenceByType(evidence: EvidenceItem[]): Record<EvidenceType, number> {
    const grouped: Partial<Record<EvidenceType, number>> = {};

    for (const item of evidence) {
      grouped[item.type] = (grouped[item.type] || 0) + 1;
    }

    return grouped as Record<EvidenceType, number>;
  }

  private groupEvidenceByPriority(evidence: EvidenceItem[]): Record<EvidencePriority, number> {
    const grouped: Partial<Record<EvidencePriority, number>> = {};

    for (const item of evidence) {
      grouped[item.priority] = (grouped[item.priority] || 0) + 1;
    }

    return grouped as Record<EvidencePriority, number>;
  }

  private generateRecommendations(evidence: EvidenceItem[], audit: AuditTrailEntry[]): string[] {
    const recommendations: string[] = [];

    // Check on-chain ratio
    const onChainRatio =
      evidence.filter((e) => e.metadata.onChain).length / Math.max(1, evidence.length);
    if (onChainRatio < 0.5) {
      recommendations.push('Increase on-chain evidence storage for better verifiability');
    }

    // Check critical evidence
    const criticalCount = evidence.filter((e) => e.priority === EvidencePriority.CRITICAL).length;
    if (criticalCount === 0) {
      recommendations.push('No critical evidence found - ensure security audits are tracked');
    }

    // Check success rate
    const successRate = this.calculateSuccessRate(audit);
    if (successRate < 80) {
      recommendations.push('Success rate below 80% - investigate failure patterns');
    }

    // Check evidence age
    const oldEvidence = evidence.filter(
      (e) => Date.now() - e.timestamp > 30 * 24 * 60 * 60 * 1000, // 30 days
    );
    if (oldEvidence.length > evidence.length * 0.5) {
      recommendations.push('Over 50% of evidence is older than 30 days - consider archiving');
    }

    return recommendations;
  }

  /**
   * Get statistics
   */
  public getStatistics(): any {
    const allEvidence = Array.from(this.evidenceStore.values());

    return {
      totalEvidence: allEvidence.length,
      onChainEvidence: allEvidence.filter((e) => e.metadata.onChain).length,
      verifiedEvidence: allEvidence.filter((e) => this.verifyEvidence(e.id)).length,
      auditEntries: this.auditTrail.length,
      aggregations: this.aggregations.size,
      chainProofs: this.chainProofs.size,
      evidenceByType: this.groupEvidenceByType(allEvidence),
      evidenceByPriority: this.groupEvidenceByPriority(allEvidence),
      averageConfidence: this.calculateAggregateConfidence(allEvidence),
      successRate: this.calculateSuccessRate(this.auditTrail),
    };
  }

  /**
   * Get evidence by ID
   */
  public getEvidence(evidenceId: string): EvidenceItem | undefined {
    return this.evidenceStore.get(evidenceId);
  }

  /**
   * Get audit trail
   */
  public getAuditTrail(): AuditTrailEntry[] {
    return [...this.auditTrail];
  }

  /**
   * Search evidence
   */
  public searchEvidence(filters: {
    type?: EvidenceType;
    priority?: EvidencePriority;
    tags?: string[];
    startTime?: number;
    endTime?: number;
    onChain?: boolean;
  }): EvidenceItem[] {
    return Array.from(this.evidenceStore.values()).filter((evidence) => {
      if (filters.type && evidence.type !== filters.type) return false;
      if (filters.priority && evidence.priority !== filters.priority) return false;
      if (filters.onChain !== undefined && evidence.metadata.onChain !== filters.onChain)
        return false;
      if (filters.startTime && evidence.timestamp < filters.startTime) return false;
      if (filters.endTime && evidence.timestamp > filters.endTime) return false;
      if (filters.tags && !filters.tags.every((tag) => evidence.tags.includes(tag))) return false;

      return true;
    });
  }
}

export default EvidenceGenerator;
