/**
 * Simple integration tests for the Orchestrator
 * Focuses on basic functionality without full coverage
 */

import { Orchestrator } from '../../src/orchestrator';

describe('Orchestrator Basic Integration', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator({
      maxConcurrency: 5,
      cacheEnabled: true,
    });
  });

  describe('Agent Initialization', () => {
    it('should initialize all 16 agents', () => {
      const agents = (orchestrator as any).agents;
      expect(agents.size).toBe(16);
    });
  });

  describe('Command System', () => {
    it('should have command manager initialized', () => {
      const commandManager = (orchestrator as any).commandManager;
      expect(commandManager).toBeDefined();
    });

    it('should execute basic commands', async () => {
      const result = await orchestrator.executeCommand('/sentiment BTC');
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });

  describe('Wave Engine', () => {
    it('should have wave engine initialized', () => {
      const waveEngine = (orchestrator as any).waveEngine;
      expect(waveEngine).toBeDefined();
    });

    it('should detect wave mode criteria', () => {
      const waveEngine = (orchestrator as any).waveEngine;
      const shouldUse = waveEngine.shouldUseWaveMode({
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
      expect(shouldUse).toBe(true);
    });
  });

  describe('Persona System', () => {
    it('should have persona manager initialized', () => {
      const personaManager = (orchestrator as any).personaManager;
      expect(personaManager).toBeDefined();
    });

    it('should have activation engine initialized', () => {
      const activationEngine = (orchestrator as any).personaActivationEngine;
      expect(activationEngine).toBeDefined();
    });
  });

  describe('Flag System', () => {
    it('should have flag manager initialized', () => {
      const flagManager = (orchestrator as any).flagManager;
      expect(flagManager).toBeDefined();
    });

    it('should parse flags', () => {
      const flagManager = (orchestrator as any).flagManager;
      const flags = flagManager.parseFlags({ deep: true, realtime: true });
      expect(flags.size).toBe(2);
      expect(flags.get('--deep')).toBe(true);
      expect(flags.get('--realtime')).toBe(true);
    });
  });

  describe('Quality Gates', () => {
    it('should have quality gates initialized', () => {
      const qualityGates = (orchestrator as any).qualityGates;
      expect(qualityGates).toBeDefined();
    });
  });

  describe('Resource Management', () => {
    it('should have resource manager initialized', () => {
      const resourceManager = (orchestrator as any).resourceManager;
      expect(resourceManager).toBeDefined();
    });

    it('should have resource zone manager initialized', () => {
      const resourceZoneManager = (orchestrator as any).resourceZoneManager;
      expect(resourceZoneManager).toBeDefined();
    });
  });
});