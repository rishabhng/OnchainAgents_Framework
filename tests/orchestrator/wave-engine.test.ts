/**
 * Comprehensive tests for the Wave Orchestration Engine
 * Tests multi-stage execution, strategies, and checkpointing
 */

import { WaveOrchestrationEngine, WaveStrategy, WaveStage } from '../../src/orchestrator/wave-engine';
import { DetectionEngine, CryptoDomain, OperationType } from '../../src/orchestrator/detection-engine';
import { PersonaManager } from '../../src/personas';
import { ResourceZoneManager, ResourceZone } from '../../src/orchestrator/resource-zones';
import { QualityGatesFramework } from '../../src/orchestrator/quality-gates';
import { FlagManager } from '../../src/flags';

describe('Wave Orchestration Engine', () => {
  let waveEngine: WaveOrchestrationEngine;
  let detectionEngine: DetectionEngine;
  let personaManager: PersonaManager;
  let resourceManager: ResourceZoneManager;
  let qualityGates: QualityGatesFramework;
  let flagManager: FlagManager;

  beforeEach(() => {
    detectionEngine = new DetectionEngine();
    personaManager = new PersonaManager();
    resourceManager = new ResourceZoneManager();
    qualityGates = new QualityGatesFramework();
    flagManager = new FlagManager();
    
    waveEngine = new WaveOrchestrationEngine(
      detectionEngine,
      personaManager,
      resourceManager,
      qualityGates,
      flagManager
    );
  });

  describe('Wave Mode Detection', () => {
    it('should activate wave mode for complex operations', () => {
      const shouldUse = waveEngine.shouldUseWaveMode({
        operation: 'comprehensive-audit',
        domains: [CryptoDomain.SECURITY, CryptoDomain.DEFI],
        operations: [OperationType.SCANNING, OperationType.VALIDATION, OperationType.OPTIMIZATION],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.6,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      });
      
      expect(shouldUse).toBe(true);
    });

    it('should not activate for simple operations', () => {
      const shouldUse = waveEngine.shouldUseWaveMode({
        operation: 'simple-query',
        domains: [CryptoDomain.MARKET],
        operations: [OperationType.ANALYSIS],
        complexity: 0.3,
        fileCount: 5,
        operationTypes: 1,
        riskLevel: 0.2,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      });
      
      expect(shouldUse).toBe(false);
    });

    it('should check all three criteria', () => {
      // High complexity but low file count
      const result1 = waveEngine.shouldUseWaveMode({
        operation: 'test',
        domains: [],
        operations: [],
        complexity: 0.9,
        fileCount: 10,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      });
      expect(result1).toBe(false);

      // High file count but low complexity
      const result2 = waveEngine.shouldUseWaveMode({
        operation: 'test',
        domains: [],
        operations: [],
        complexity: 0.5,
        fileCount: 30,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      });
      expect(result2).toBe(false);

      // All criteria met
      const result3 = waveEngine.shouldUseWaveMode({
        operation: 'test',
        domains: [],
        operations: [],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      });
      expect(result3).toBe(true);
    });
  });

  describe('Wave Planning', () => {
    it('should create wave execution plan', async () => {
      const context = {
        operation: 'security-audit',
        domains: [CryptoDomain.SECURITY],
        operations: [OperationType.SCANNING, OperationType.VALIDATION],
        complexity: 0.8,
        fileCount: 30,
        operationTypes: 3,
        riskLevel: 0.7,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      
      expect(plan).toBeDefined();
      expect(plan.id).toContain('wave_plan_');
      expect(plan.strategy).toBeDefined();
      expect(plan.waves).toBeDefined();
      expect(plan.waves.length).toBeGreaterThan(0);
      expect(plan.estimatedDuration).toBeGreaterThan(0);
      expect(plan.estimatedTokens).toBeGreaterThan(0);
      expect(plan.riskAssessment).toBeDefined();
    });

    it('should select appropriate strategy', async () => {
      // Security-focused operation
      const securityContext = {
        operation: 'security-audit',
        domains: [CryptoDomain.SECURITY],
        operations: [OperationType.SCANNING],
        complexity: 0.9,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.9,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      };
      
      const securityPlan = await waveEngine.planWaveExecution(securityContext);
      expect(securityPlan.strategy).toBe(WaveStrategy.SYSTEMATIC);
      
      // Performance optimization - using YIELD as closest match
      const perfContext = {
        operation: 'performance-optimization',
        domains: [CryptoDomain.YIELD],
        operations: [OperationType.OPTIMIZATION],
        complexity: 0.7,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.3,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      };
      
      const perfPlan = await waveEngine.planWaveExecution(perfContext);
      expect(perfPlan.strategy).toBe(WaveStrategy.PROGRESSIVE);
    });

    it('should create waves with proper stages', async () => {
      const context = {
        operation: 'comprehensive-analysis',
        domains: [CryptoDomain.DEFI, CryptoDomain.SECURITY],
        operations: [OperationType.ANALYSIS, OperationType.OPTIMIZATION],
        complexity: 0.8,
        fileCount: 30,
        operationTypes: 4,
        riskLevel: 0.5,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      
      const stages = plan.waves.map(w => w.stage);
      expect(stages).toContain(WaveStage.DISCOVERY);
      expect(stages).toContain(WaveStage.PLANNING);
      expect(stages).toContain(WaveStage.IMPLEMENTATION);
      expect(stages).toContain(WaveStage.VALIDATION);
    });

    it('should set wave dependencies correctly', async () => {
      const context = {
        operation: 'test',
        domains: [CryptoDomain.DEFI],
        operations: [OperationType.ANALYSIS],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      
      // First wave should have no dependencies
      expect(plan.waves[0].dependencies).toEqual([]);
      
      // Later waves should depend on previous ones
      for (let i = 1; i < plan.waves.length; i++) {
        expect(plan.waves[i].dependencies.length).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Wave Execution', () => {
    it('should execute waves in sequence', async () => {
      const context = {
        operation: 'security-scan',
        domains: [CryptoDomain.SECURITY],
        operations: [OperationType.SCANNING],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.7,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      };
      
      const result = await waveEngine.executeWithWaves(context);
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.waves).toBeDefined();
      expect(result.totalDuration).toBeGreaterThan(0);
    });
    
    it('should handle resource constraints', async () => {
      const context = {
        operation: 'test',
        domains: [CryptoDomain.DEFI],
        operations: [OperationType.ANALYSIS],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: ResourceZone.YELLOW, // Limited resources
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      
      // Should adjust wave size for resource constraints
      expect(plan.waves.length).toBeGreaterThan(0);
      expect(plan.strategy).toBe(WaveStrategy.ADAPTIVE);
    });
  });
  
  describe('Wave Checkpointing', () => {
    it('should save checkpoint after each wave', async () => {
      const context = {
        operation: 'test',
        domains: [CryptoDomain.DEFI],
        operations: [OperationType.ANALYSIS],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      };
      
      const result = await waveEngine.executeWithWaves(context);
      
      expect(result.checkpoints).toBeDefined();
      expect(result.checkpoints.length).toBeGreaterThan(0);
    });
    
    it('should recover from checkpoint on failure', async () => {
      const context = {
        operation: 'test-recovery',
        domains: [CryptoDomain.SECURITY],
        operations: [OperationType.SCANNING],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      };
      
      // Simulate partial execution with checkpoint
      const checkpoint = {
        planId: 'test-plan',
        completedWaves: ['wave_1', 'wave_2'],
        lastCheckpoint: new Date(),
        context,
      };
      
      const result = await waveEngine.resumeFromCheckpoint(checkpoint);
      expect(result).toBeDefined();
    });
    
    it('should validate critical operations', async () => {
      const context = {
        operation: 'critical-security-fix',
        domains: [CryptoDomain.SECURITY],
        operations: [OperationType.VALIDATION],
        complexity: 0.9,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.9,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      
      // Should require validation for critical operations
      expect(plan.requiresValidation).toBe(true);
      expect(plan.validationGates).toBeDefined();
    });
  });
  
  describe('Strategy Selection', () => {
    it('should use systematic strategy for security', async () => {
      const context = {
        operation: 'security-audit',
        domains: [CryptoDomain.SECURITY],
        operations: [OperationType.SCANNING, OperationType.VALIDATION],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.8,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      expect(plan.strategy).toBe(WaveStrategy.SYSTEMATIC);
    });
    
    it('should use progressive strategy for improvements', async () => {
      const context = {
        operation: 'iterative-improvement',
        domains: [CryptoDomain.DEFI],
        operations: [OperationType.OPTIMIZATION],
        complexity: 0.7,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.3,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      expect(plan.strategy).toBe(WaveStrategy.PROGRESSIVE);
    });
    
    it('should use adaptive strategy for mixed operations', async () => {
      const context = {
        operation: 'comprehensive-refactor',
        domains: [CryptoDomain.SECURITY, CryptoDomain.DEFI],
        operations: [OperationType.ANALYSIS, OperationType.VALIDATION],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 4,
        riskLevel: 0.5,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      expect(plan.strategy).toBe(WaveStrategy.ADAPTIVE);
    });
    
    it('should use enterprise strategy for large scale', async () => {
      const context = {
        operation: 'enterprise-migration',
        domains: [CryptoDomain.MARKET, CryptoDomain.DEFI, CryptoDomain.NFT],
        operations: [OperationType.ANALYSIS, OperationType.OPTIMIZATION, OperationType.TRACKING],
        complexity: 0.9,
        fileCount: 150,
        operationTypes: 5,
        riskLevel: 0.7,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      expect(plan.strategy).toBe(WaveStrategy.ENTERPRISE);
    });
  });
});