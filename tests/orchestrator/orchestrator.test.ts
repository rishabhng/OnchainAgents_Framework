/**
 * Comprehensive tests for the integrated Orchestrator
 * Tests wave engine, persona activation, command execution, and flag processing
 */

import { Orchestrator } from '../../src/orchestrator';
import { HiveBridge } from '../../src/bridges/hive-bridge';
import { CommandManager } from '../../src/commands';
import { PersonaType } from '../../src/personas';
import { CryptoDomain, OperationType } from '../../src/orchestrator/detection-engine';
import { ResourceZone } from '../../src/orchestrator/resource-zones';

// Mock HiveBridge
jest.mock('../../src/bridges/hive-bridge');

describe('Orchestrator Integration', () => {
  let orchestrator: Orchestrator;
  let mockHiveBridge: jest.Mocked<HiveBridge>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHiveBridge = new HiveBridge() as jest.Mocked<HiveBridge>;
    orchestrator = new Orchestrator({
      maxConcurrency: 5,
      cacheEnabled: true,
      cacheTTL: 3600,
      resourceLimits: {
        maxTokens: 100000,
        maxTime: 60000,
        maxMemory: 512 * 1024 * 1024,
      },
    });
  });

  describe('Agent Initialization', () => {
    it('should initialize all 16 agents', () => {
      const agents = (orchestrator as any).agents;
      expect(agents.size).toBe(16);
      
      // Security agents
      expect(agents.has('rugDetector')).toBe(true);
      expect(agents.has('riskAnalyzer')).toBe(true);
      
      // Market agents
      expect(agents.has('alphaHunter')).toBe(true);
      expect(agents.has('whaleTracker')).toBe(true);
      expect(agents.has('sentimentAnalyzer')).toBe(true);
      expect(agents.has('marketMaker')).toBe(true);
      
      // Research agents
      expect(agents.has('tokenResearcher')).toBe(true);
      expect(agents.has('defiAnalyzer')).toBe(true);
      expect(agents.has('portfolioTracker')).toBe(true);
      expect(agents.has('yieldOptimizer')).toBe(true);
      
      // Specialized agents
      expect(agents.has('chainAnalyst')).toBe(true);
      expect(agents.has('crossChainNavigator')).toBe(true);
      expect(agents.has('cryptoQuant')).toBe(true);
      expect(agents.has('governanceAdvisor')).toBe(true);
      expect(agents.has('marketStructureAnalyst')).toBe(true);
      expect(agents.has('nftValuator')).toBe(true);
    });
  });

  describe('Command Execution', () => {
    it('should execute whale tracking command', async () => {
      const result = await orchestrator.executeCommand('/whale 0x1234567890123456789012345678901234567890');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.persona).toBeDefined();
    });

    it('should execute security audit command', async () => {
      const result = await orchestrator.executeCommand('/audit 0x1234567890123456789012345678901234567890 --deep');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metadata?.waveMode).toBe(true); // Deep audit should trigger wave mode
    });

    it('should execute alpha hunting command', async () => {
      const result = await orchestrator.executeCommand('/alpha --trending --whale-backed');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.opportunities).toBeDefined();
    });

    it('should execute yield optimization command', async () => {
      const result = await orchestrator.executeCommand('/yield 10000 --stable-only');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.recommendedStrategies).toBeDefined();
      expect(result.data.totalAPY).toBeGreaterThan(0);
    });

    it('should execute sentiment analysis command', async () => {
      const result = await orchestrator.executeCommand('/sentiment BTC --social');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.sentiment).toBeDefined();
      expect(result.data.score).toBeGreaterThanOrEqual(0);
      expect(result.data.score).toBeLessThanOrEqual(1);
    });

    it('should handle invalid commands gracefully', async () => {
      const result = await orchestrator.executeCommand('/invalid-command');
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should handle missing required arguments', async () => {
      const result = await orchestrator.executeCommand('/whale'); // Missing address
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Missing required argument');
    });
  });

  describe('Wave Engine Integration', () => {
    it('should activate wave mode for complex operations', async () => {
      const waveEngine = (orchestrator as any).waveEngine;
      const shouldUseWave = waveEngine.shouldUseWaveMode({
        operation: 'complex-analysis',
        domains: [CryptoDomain.DEFI, CryptoDomain.SECURITY],
        operations: [OperationType.ANALYSIS, OperationType.OPTIMIZATION],
        complexity: 0.8,
        fileCount: 25,
        operationTypes: 3,
        riskLevel: 0.6,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      });
      
      expect(shouldUseWave).toBe(true);
    });

    it('should not activate wave mode for simple operations', async () => {
      const waveEngine = (orchestrator as any).waveEngine;
      const shouldUseWave = waveEngine.shouldUseWaveMode({
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
      
      expect(shouldUseWave).toBe(false);
    });

    it('should create wave execution plan', async () => {
      const waveEngine = (orchestrator as any).waveEngine;
      const context = {
        operation: 'comprehensive-audit',
        domains: [CryptoDomain.SECURITY],
        operations: [OperationType.SCANNING, OperationType.VALIDATION],
        complexity: 0.9,
        fileCount: 30,
        operationTypes: 4,
        riskLevel: 0.8,
        resourceZone: ResourceZone.GREEN,
        tokens: { used: 0, budget: 100000 },
      };
      
      const plan = await waveEngine.planWaveExecution(context);
      
      expect(plan).toBeDefined();
      expect(plan.waves).toBeDefined();
      expect(plan.waves.length).toBeGreaterThan(0);
      expect(plan.strategy).toBeDefined();
      expect(plan.estimatedTokens).toBeGreaterThan(0);
    });
  });

  describe('Persona Activation', () => {
    it('should activate whale hunter persona for whale tracking', async () => {
      const activationEngine = (orchestrator as any).personaActivationEngine;
      const persona = await activationEngine.activateBestPersona({
        domains: [CryptoDomain.WHALE],
        operations: [OperationType.TRACKING],
        keywords: ['whale', 'track', 'movement'],
        complexity: 0.6,
        riskLevel: 0.3,
        urgency: 0.4,
      });
      
      expect(persona).toBeDefined();
      expect((persona as any).config.type).toBe(PersonaType.WHALE_HUNTER);
    });

    it('should activate security auditor for audit operations', async () => {
      const activationEngine = (orchestrator as any).personaActivationEngine;
      const persona = await activationEngine.activateBestPersona({
        domains: [CryptoDomain.SECURITY],
        operations: [OperationType.SCANNING, OperationType.VALIDATION],
        keywords: ['audit', 'security', 'vulnerability'],
        complexity: 0.8,
        riskLevel: 0.8,
        urgency: 0.5,
      });
      
      expect(persona).toBeDefined();
      expect((persona as any).config.type).toBe(PersonaType.SECURITY_AUDITOR);
    });

    it('should activate alpha seeker for opportunity discovery', async () => {
      const activationEngine = (orchestrator as any).personaActivationEngine;
      const persona = await activationEngine.activateBestPersona({
        domains: [CryptoDomain.ALPHA],
        operations: [OperationType.DISCOVERY],
        keywords: ['alpha', 'opportunity', 'gem'],
        complexity: 0.7,
        riskLevel: 0.6,
        urgency: 0.6,
      });
      
      expect(persona).toBeDefined();
      expect((persona as any).config.type).toBe(PersonaType.ALPHA_SEEKER);
    });

    it('should provide alternative personas when confidence is lower', async () => {
      const activationEngine = (orchestrator as any).personaActivationEngine;
      const result = await activationEngine.determinePersona({
        domains: [CryptoDomain.MARKET, CryptoDomain.DEFI],
        operations: [OperationType.ANALYSIS],
        keywords: ['general', 'analysis'],
        complexity: 0.5,
        riskLevel: 0.5,
        urgency: 0.5,
      });
      
      expect(result.alternativePersonas).toBeDefined();
      expect(result.alternativePersonas.length).toBeGreaterThan(0);
    });
  });

  describe('Flag System', () => {
    it('should parse and activate flags from commands', async () => {
      const flagManager = (orchestrator as any).flagManager;
      const flags = flagManager.parseFlags('--deep --realtime --wave-mode');
      
      expect(flags.size).toBe(3);
      expect(flags.get('--deep')).toBe(true);
      expect(flags.get('--realtime')).toBe(true);
      expect(flags.get('--wave-mode')).toBe(true);
    });

    it('should handle flag values correctly', async () => {
      const flagManager = (orchestrator as any).flagManager;
      const flags = flagManager.parseFlags('--network polygon --depth 5 --risk high');
      
      expect(flags.get('--network')).toBe('polygon');
      expect(flags.get('--depth')).toBe('5');
      expect(flags.get('--risk')).toBe('high');
    });

    it('should activate implied flags', async () => {
      const flagManager = (orchestrator as any).flagManager;
      const flags = flagManager.parseFlags('--think');
      const activated = await flagManager.activateFlags(flags, {
        complexity: 0.6,
        domains: [CryptoDomain.DEFI],
      });
      
      // --think implies --seq
      expect(activated.has('--seq')).toBe(true);
    });

    it('should handle flag conflicts', async () => {
      const flagManager = (orchestrator as any).flagManager;
      const flags = flagManager.parseFlags('--safe-mode --ultrafast');
      const activated = await flagManager.activateFlags(flags);
      
      // --safe-mode should override --ultrafast
      expect(activated.get('--safe-mode')?.active).toBe(true);
      expect(activated.get('--ultrafast')?.active).toBeFalsy();
    });

    it('should auto-activate flags based on context', async () => {
      const flagManager = (orchestrator as any).flagManager;
      const flags = new Map();
      const activated = await flagManager.activateFlags(flags, {
        complexity: 0.9,
        resourceUsage: 0.8,
        domains: [CryptoDomain.SECURITY],
      });
      
      // High complexity and resource usage should activate compression
      expect(activated.has('--uc') || activated.has('--ultracompressed')).toBe(true);
    });
  });

  describe('Resource Management', () => {
    it('should check resource availability before execution', async () => {
      const resourceManager = (orchestrator as any).resourceManager;
      const available = await resourceManager.checkAvailability({
        estimatedTokens: 50000,
        estimatedTime: 30000,
      });
      
      expect(available.available).toBe(true);
    });

    it('should reject operations exceeding resource limits', async () => {
      const resourceManager = (orchestrator as any).resourceManager;
      const available = await resourceManager.checkAvailability({
        estimatedTokens: 200000, // Exceeds default max of 100000
        estimatedTime: 30000,
      });
      
      expect(available.available).toBe(false);
      expect(available.reason).toContain('Token limit');
    });

    it('should track resource usage', async () => {
      const resourceManager = (orchestrator as any).resourceManager;
      await resourceManager.recordUsage({
        tool: 'test',
        executionTime: 1000,
        tokensUsed: 5000,
      });
      
      const stats = resourceManager.getUsageStatistics();
      expect(stats.totalTokensUsed).toBeGreaterThanOrEqual(5000);
      expect(stats.totalExecutionTime).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Quality Gates', () => {
    it('should validate operations through quality gates', async () => {
      const qualityGates = (orchestrator as any).qualityGates;
      const validation = await qualityGates.validate({
        operation: 'deploy',
        code: 'contract Test {}',
        tests: ['test1', 'test2'],
        coverage: 0.85,
      });
      
      expect(validation).toBeDefined();
      expect(validation.passed).toBeDefined();
    });

    it('should fail validation for low test coverage', async () => {
      const qualityGates = (orchestrator as any).qualityGates;
      const validation = await qualityGates.validate({
        operation: 'deploy',
        code: 'contract Test {}',
        tests: [],
        coverage: 0.3, // Below threshold
      });
      
      expect(validation.passed).toBe(false);
      expect(validation.failures).toContain('coverage');
    });
  });

  describe('End-to-End Command Scenarios', () => {
    it('should execute complex whale tracking with deep analysis', async () => {
      const result = await orchestrator.executeCommand(
        '/whale 0x1234567890123456789012345678901234567890 --deep --history --alert'
      );
      
      expect(result.success).toBe(true);
      expect(result.metadata?.waveMode).toBeDefined();
      expect(result.metadata?.persona).toBe('WhaleHunter');
    });

    it('should execute multi-chain yield optimization', async () => {
      const result = await orchestrator.executeCommand(
        '/yield 50000 --risk high --multi-chain --auto-compound'
      );
      
      expect(result.success).toBe(true);
      expect(result.data.recommendedStrategies).toBeDefined();
      expect(result.data.recommendedStrategies.length).toBeGreaterThan(0);
    });

    it('should execute comprehensive security audit with wave mode', async () => {
      const result = await orchestrator.executeCommand(
        '/audit 0x1234567890123456789012345678901234567890 --depth deep --include-deps --simulate'
      );
      
      expect(result.success).toBe(true);
      expect(result.metadata?.waveMode).toBe(true);
      expect(result.data.securityScore).toBeDefined();
    });

    it('should chain multiple commands in sequence', async () => {
      // First, find alpha
      const alphaResult = await orchestrator.executeCommand('/alpha --trending');
      expect(alphaResult.success).toBe(true);
      
      // Then audit the top opportunity
      if (alphaResult.data?.opportunities?.[0]) {
        const auditResult = await orchestrator.executeCommand(
          `/audit ${alphaResult.data.opportunities[0].address}`
        );
        expect(auditResult.success).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockHiveBridge.query = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const result = await orchestrator.execute('oca_analyze', {
        target: 'PEPE',
        network: 'ethereum',
      });
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle timeout errors', async () => {
      jest.setTimeout(10000);
      
      // Mock a slow operation
      mockHiveBridge.query = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 5000))
      );
      
      const orchestratorWithTimeout = new Orchestrator({
        resourceLimits: { maxTime: 100 }, // 100ms timeout
      });
      
      const result = await orchestratorWithTimeout.execute('oca_analyze', {
        target: 'SLOW',
      });
      
      expect(result.success).toBe(false);
    });

    it('should handle invalid input gracefully', async () => {
      const result = await orchestrator.executeCommand('/whale invalid-address');
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Invalid address format');
    });
  });

  describe('Performance', () => {
    it('should execute simple commands quickly', async () => {
      const start = Date.now();
      const result = await orchestrator.executeCommand('/sentiment BTC');
      const duration = Date.now() - start;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent commands', async () => {
      const commands = [
        '/sentiment BTC',
        '/sentiment ETH',
        '/alpha',
        '/yield 1000',
      ];
      
      const results = await Promise.all(
        commands.map(cmd => orchestrator.executeCommand(cmd))
      );
      
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should cache repeated operations', async () => {
      const start1 = Date.now();
      const result1 = await orchestrator.executeCommand('/sentiment BTC');
      const duration1 = Date.now() - start1;
      
      const start2 = Date.now();
      const result2 = await orchestrator.executeCommand('/sentiment BTC');
      const duration2 = Date.now() - start2;
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(duration2).toBeLessThan(duration1); // Cached should be faster
    });
  });
});