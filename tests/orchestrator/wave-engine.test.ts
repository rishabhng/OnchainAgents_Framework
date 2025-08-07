/**
 * Comprehensive tests for the Wave Orchestration Engine
 * Tests multi-stage execution, strategies, and checkpointing
 */

import { WaveOrchestrationEngine, WaveStrategy, WaveStage } from '../../src/orchestrator/wave-engine';
import { DetectionEngine } from '../../src/orchestrator/detection-engine';
import { PersonaManager } from '../../src/personas';
import { ResourceZoneManager } from '../../src/orchestrator/resource-zones';
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
        domains: ['SECURITY', 'DEFI'],
        operations: ['SCANNING', 'VALIDATION', 'OPTIMIZATION'],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.6,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      });
      
      expect(shouldUse).toBe(true);
    });

    it('should not activate for simple operations', () => {
      const shouldUse = waveEngine.shouldUseWaveMode({
        operation: 'simple-query',
        domains: ['MARKET'],
        operations: ['QUERY'],
        complexity: 0.3,
        fileCount: 5,
        operationTypes: 1,
        riskLevel: 0.2,
        resourceZone: 'GREEN',
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
        resourceZone: 'GREEN',
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
        resourceZone: 'GREEN',
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
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      });
      expect(result3).toBe(true);
    });
  });

  describe('Wave Planning', () => {
    it('should create wave execution plan', async () => {
      const context = {
        operation: 'security-audit',
        domains: ['SECURITY'],
        operations: ['SCANNING', 'VALIDATION'],
        complexity: 0.8,
        fileCount: 30,
        operationTypes: 3,
        riskLevel: 0.7,
        resourceZone: 'GREEN',
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
        domains: ['SECURITY'],
        operations: ['SCANNING'],
        complexity: 0.9,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.9,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const securityPlan = await waveEngine.planWaveExecution(securityContext);
      expect(securityPlan.strategy).toBe(WaveStrategy.SYSTEMATIC);
      
      // Performance optimization
      const perfContext = {
        operation: 'performance-optimization',
        domains: ['PERFORMANCE'],
        operations: ['OPTIMIZATION'],
        complexity: 0.7,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.3,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const perfPlan = await waveEngine.planWaveExecution(perfContext);
      expect(perfPlan.strategy).toBe(WaveStrategy.PROGRESSIVE);
    });

    it('should create waves with proper stages', async () => {
      const context = {
        operation: 'comprehensive-analysis',
        domains: ['DEFI', 'SECURITY'],
        operations: ['ANALYSIS', 'OPTIMIZATION'],
        complexity: 0.8,
        fileCount: 30,
        operationTypes: 4,
        riskLevel: 0.5,
        resourceZone: 'GREEN',
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
        domains: ['TEST'],
        operations: ['TEST'],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      
      // Discovery wave should have no dependencies
      const discoveryWave = plan.waves.find(w => w.stage === WaveStage.DISCOVERY);
      expect(discoveryWave?.dependencies.length).toBe(0);
      
      // Implementation should depend on planning
      const implWave = plan.waves.find(w => w.stage === WaveStage.IMPLEMENTATION);
      const planningWave = plan.waves.find(w => w.stage === WaveStage.PLANNING);
      if (implWave && planningWave) {
        expect(implWave.dependencies).toContain(planningWave.id);
      }
    });

    it('should determine checkpoints based on strategy', async () => {
      const context = {
        operation: 'critical-operation',
        domains: ['SECURITY'],
        operations: ['CRITICAL'],
        complexity: 0.9,
        fileCount: 50,
        operationTypes: 5,
        riskLevel: 0.9,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context, WaveStrategy.SYSTEMATIC);
      
      expect(plan.checkpoints).toBeDefined();
      expect(plan.checkpoints.length).toBeGreaterThan(0);
      
      // Should checkpoint after validation stages
      const validationWaves = plan.waves.filter(w => w.stage === WaveStage.VALIDATION);
      validationWaves.forEach(wave => {
        expect(plan.checkpoints).toContain(wave.id);
      });
    });
  });

  describe('Wave Execution', () => {
    it('should execute waves sequentially by default', async () => {
      const context = {
        operation: 'test-execution',
        domains: ['TEST'],
        operations: ['TEST'],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      const executionOrder: string[] = [];
      
      // Mock wave execution to track order
      jest.spyOn(waveEngine as any, 'executeWave').mockImplementation(async (wave) => {
        executionOrder.push(wave.id);
        return {
          waveId: wave.id,
          success: true,
          outputs: {},
          metrics: {
            duration: 100,
            tokensUsed: 1000,
            toolsUsed: [],
            errorsEncountered: 0,
          },
          evidence: {},
        };
      });
      
      await waveEngine.executeWavePlan(plan, context);
      
      // Verify sequential execution
      for (let i = 0; i < plan.waves.length; i++) {
        expect(executionOrder[i]).toBe(plan.waves[i].id);
      }
    });

    it('should handle wave dependencies', async () => {
      const context = {
        operation: 'test',
        domains: ['TEST'],
        operations: ['TEST'],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      
      // Create a wave with unmet dependencies
      const testWave = {
        id: 'test_wave',
        stage: WaveStage.IMPLEMENTATION,
        sequence: 99,
        tasks: [],
        dependencies: ['non_existent_wave'],
        status: 'pending' as const,
      };
      
      plan.waves.push(testWave);
      
      const results = await waveEngine.executeWavePlan(plan, context);
      
      // Wave with unmet dependencies should be skipped
      expect(results.has('test_wave')).toBe(false);
    });

    it('should create checkpoints during execution', async () => {
      const context = {
        operation: 'test',
        domains: ['TEST'],
        operations: ['TEST'],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      
      // Add checkpoint for first wave
      if (plan.waves.length > 0) {
        plan.checkpoints = [plan.waves[0].id];
      }
      
      const checkpoints = (waveEngine as any).checkpoints;
      const initialSize = checkpoints.size;
      
      await waveEngine.executeWavePlan(plan, context);
      
      // Should have created checkpoint
      expect(checkpoints.size).toBeGreaterThan(initialSize);
    });

    it('should validate wave results when required', async () => {
      const context = {
        operation: 'test',
        domains: ['TEST'],
        operations: ['TEST'],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      
      // Mock validation
      jest.spyOn(waveEngine as any, 'validateWaveResult').mockResolvedValue({
        passed: true,
        failures: [],
      });
      
      await waveEngine.executeWavePlan(plan, context);
      
      // Validation should be called for each wave
      expect((waveEngine as any).validateWaveResult).toHaveBeenCalled();
    });

    it('should handle wave rollback on failure', async () => {
      const context = {
        operation: 'test',
        domains: ['TEST'],
        operations: ['TEST'],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      
      // Mock validation failure
      jest.spyOn(waveEngine as any, 'validateWaveResult').mockResolvedValue({
        passed: false,
        failures: ['test-failure'],
      });
      
      // Mock rollback
      jest.spyOn(waveEngine as any, 'rollbackWave').mockResolvedValue(true);
      
      await expect(waveEngine.executeWavePlan(plan, context)).rejects.toThrow();
      
      // Rollback should be called
      expect((waveEngine as any).rollbackWave).toHaveBeenCalled();
    });
  });

  describe('Strategy Selection', () => {
    it('should select PROGRESSIVE for incremental improvements', async () => {
      const context = {
        operation: 'incremental-improvement',
        domains: ['OPTIMIZATION'],
        operations: ['IMPROVEMENT'],
        complexity: 0.7,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.3,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const strategy = (waveEngine as any).selectOptimalStrategy(context);
      expect(strategy).toBe(WaveStrategy.PROGRESSIVE);
    });

    it('should select SYSTEMATIC for complex analysis', async () => {
      const context = {
        operation: 'complex-analysis',
        domains: ['SECURITY', 'DEFI'],
        operations: ['ANALYSIS', 'VALIDATION'],
        complexity: 0.9,
        fileCount: 30,
        operationTypes: 4,
        riskLevel: 0.7,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const strategy = (waveEngine as any).selectOptimalStrategy(context);
      expect(strategy).toBe(WaveStrategy.SYSTEMATIC);
    });

    it('should select ADAPTIVE for varying complexity', async () => {
      const context = {
        operation: 'mixed-operation',
        domains: ['MARKET', 'DEFI', 'NFT'],
        operations: ['ANALYSIS', 'OPTIMIZATION', 'TRACKING'],
        complexity: 0.75,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const strategy = (waveEngine as any).selectOptimalStrategy(context);
      expect(strategy).toBe(WaveStrategy.ADAPTIVE);
    });

    it('should select ENTERPRISE for large-scale operations', async () => {
      const context = {
        operation: 'enterprise-migration',
        domains: ['INFRASTRUCTURE'],
        operations: ['MIGRATION'],
        complexity: 0.8,
        fileCount: 150,
        operationTypes: 5,
        riskLevel: 0.6,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 500000 },
      };
      
      const strategy = (waveEngine as any).selectOptimalStrategy(context);
      expect(strategy).toBe(WaveStrategy.ENTERPRISE);
    });
  });

  describe('Resource Management', () => {
    it('should check resource availability before wave execution', async () => {
      const context = {
        operation: 'test',
        domains: ['TEST'],
        operations: ['TEST'],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: 'YELLOW', // Limited resources
        tokens: { used: 80000, budget: 100000 }, // Near limit
      };
      
      jest.spyOn(waveEngine as any, 'checkResourceAvailability').mockReturnValue(false);
      jest.spyOn(waveEngine as any, 'waitForResources').mockResolvedValue(true);
      
      const plan = await waveEngine.planWaveExecution(context);
      await waveEngine.executeWavePlan(plan, context);
      
      expect((waveEngine as any).checkResourceAvailability).toHaveBeenCalled();
      expect((waveEngine as any).waitForResources).toHaveBeenCalled();
    });

    it('should estimate token usage accurately', async () => {
      const context = {
        operation: 'test',
        domains: ['TEST'],
        operations: ['TEST'],
        complexity: 0.8,
        fileCount: 50,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      
      expect(plan.estimatedTokens).toBeGreaterThan(0);
      expect(plan.estimatedTokens).toBeLessThan(context.tokens.budget);
      
      // Higher complexity should mean more tokens
      const complexContext = { ...context, complexity: 0.95, fileCount: 100 };
      const complexPlan = await waveEngine.planWaveExecution(complexContext);
      
      expect(complexPlan.estimatedTokens).toBeGreaterThan(plan.estimatedTokens);
    });
  });

  describe('Risk Assessment', () => {
    it('should assess risks based on context', async () => {
      const context = {
        operation: 'high-risk-operation',
        domains: ['SECURITY'],
        operations: ['CRITICAL'],
        complexity: 0.9,
        fileCount: 50,
        operationTypes: 5,
        riskLevel: 0.9,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      
      expect(plan.riskAssessment).toBeDefined();
      expect(plan.riskAssessment.level).toBeGreaterThan(0.7);
      expect(plan.riskAssessment.factors).toBeDefined();
      expect(plan.riskAssessment.factors.length).toBeGreaterThan(0);
      expect(plan.riskAssessment.mitigations).toBeDefined();
    });

    it('should include appropriate mitigations', async () => {
      const context = {
        operation: 'security-critical',
        domains: ['SECURITY'],
        operations: ['CRITICAL'],
        complexity: 0.95,
        fileCount: 30,
        operationTypes: 4,
        riskLevel: 0.95,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      
      const mitigations = plan.riskAssessment.mitigations;
      expect(mitigations).toContain('checkpoint');
      expect(mitigations).toContain('validation');
      expect(mitigations).toContain('rollback');
    });
  });

  describe('Event Emission', () => {
    it('should emit wave-mode-recommended event', (done) => {
      waveEngine.on('wave-mode-recommended', (data) => {
        expect(data.complexity).toBeGreaterThanOrEqual(0.7);
        expect(data.fileCount).toBeGreaterThan(20);
        expect(data.operationTypes).toBeGreaterThan(2);
        expect(data.recommendation).toContain('Wave mode recommended');
        done();
      });
      
      waveEngine.shouldUseWaveMode({
        operation: 'test',
        domains: [],
        operations: [],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      });
    });

    it('should emit wave-plan-created event', (done) => {
      waveEngine.on('wave-plan-created', (data) => {
        expect(data.plan).toBeDefined();
        expect(data.duration).toBeGreaterThan(0);
        done();
      });
      
      const context = {
        operation: 'test',
        domains: ['TEST'],
        operations: ['TEST'],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      waveEngine.planWaveExecution(context);
    });

    it('should emit wave-execution-started event', (done) => {
      waveEngine.on('wave-execution-started', (data) => {
        expect(data.planId).toContain('wave_plan_');
        expect(data.waveCount).toBeGreaterThan(0);
        expect(data.strategy).toBeDefined();
        done();
      });
      
      const context = {
        operation: 'test',
        domains: ['TEST'],
        operations: ['TEST'],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.5,
        resourceZone: 'GREEN',
        tokens: { used: 0, budget: 100000 },
      };
      
      waveEngine.planWaveExecution(context).then(plan => {
        waveEngine.executeWavePlan(plan, context);
      });
    });
  });
});