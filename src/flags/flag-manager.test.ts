/**
 * Tests for Flag System
 */

import { FlagManager, FlagCategory, FlagPriority } from './index';
import { ResourceZone } from '../orchestrator/resource-zones';
import { CryptoDomain, OperationType } from '../orchestrator/detection-engine';
import { PersonaType } from '../personas';

describe('FlagManager', () => {
  let flagManager: FlagManager;
  
  beforeEach(() => {
    flagManager = new FlagManager();
  });
  
  describe('Flag Parsing', () => {
    it('should parse simple flags', () => {
      const flags = flagManager.parseFlags('--think --secure --mainnet');
      expect(flags.has('--think')).toBe(true);
      expect(flags.has('--secure')).toBe(true);
      expect(flags.has('--mainnet')).toBe(true);
    });
    
    it('should parse flags with values', () => {
      const flags = flagManager.parseFlags('--scope wallet --iterations 5 --wave-strategy progressive');
      expect(flags.get('--scope')).toBe('wallet');
      expect(flags.get('--iterations')).toBe('5');
      expect(flags.get('--wave-strategy')).toBe('progressive');
    });
    
    it('should handle array input', () => {
      const flags = flagManager.parseFlags(['--think', '--delegate', '--concurrency', '10']);
      expect(flags.has('--think')).toBe(true);
      expect(flags.has('--delegate')).toBe(true);
      expect(flags.get('--concurrency')).toBe('10');
    });
  });
  
  describe('Flag Activation', () => {
    it('should activate explicit flags', async () => {
      const flags = new Map([
        ['--think', true],
        ['--secure', true],
      ]);
      
      const activated = await flagManager.activateFlags(flags);
      expect(activated.has('--think')).toBe(true);
      expect(activated.has('--secure')).toBe(true);
      expect(activated.get('--think')?.source).toBe('explicit');
    });
    
    it('should handle flag aliases', async () => {
      const flags = new Map([
        ['--analyze', true], // Alias for --think
        ['--dry-run', true], // Alias for --simulate
      ]);
      
      const activated = await flagManager.activateFlags(flags);
      expect(activated.has('--think')).toBe(true);
      expect(activated.has('--simulate')).toBe(true);
    });
    
    it('should activate implied flags', async () => {
      const flags = new Map([
        ['--think', true], // Implies --seq
        ['--ultrathink', true], // Implies --seq, --hive, --all-sources
      ]);
      
      const activated = await flagManager.activateFlags(flags);
      expect(activated.has('--seq')).toBe(true);
      expect(activated.has('--hive')).toBe(true);
      expect(activated.has('--all-sources')).toBe(true);
    });
  });
  
  describe('Auto-Activation', () => {
    it('should auto-activate based on complexity', async () => {
      const context = {
        complexity: 0.8,
        domains: [CryptoDomain.DEFI],
        operations: [OperationType.ANALYSIS],
      };
      
      const activated = await flagManager.activateFlags(new Map(), context);
      // Should auto-activate --think-hard for high complexity
      expect(activated.has('--think-hard') || activated.has('--think')).toBe(true);
    });
    
    it('should auto-activate compression in resource constraints', async () => {
      const context = {
        resourceZone: ResourceZone.ORANGE,
        tokenUsage: 0.8,
      };
      
      const activated = await flagManager.activateFlags(new Map(), context);
      expect(activated.has('--uc')).toBe(true);
    });
    
    it('should auto-activate security for high-risk operations', async () => {
      const context = {
        riskLevel: 0.8,
        value: 50000,
        operation: 'security-audit',
      };
      
      const activated = await flagManager.activateFlags(new Map(), context);
      expect(activated.has('--secure') || activated.has('--validate')).toBe(true);
    });
    
    it('should auto-activate delegation for many files', async () => {
      const context = {
        fileCount: 100,
        operations: ['analyze', 'scan', 'track'],
      };
      
      const activated = await flagManager.activateFlags(new Map(), context);
      expect(activated.has('--delegate')).toBe(true);
    });
  });
  
  describe('Conflict Resolution', () => {
    it('should resolve conflicting flags by priority', async () => {
      const flags = new Map([
        ['--safe-mode', true], // High priority (SAFETY)
        ['--fast', true], // Conflicts with safe-mode, lower priority
      ]);
      
      const activated = await flagManager.activateFlags(flags);
      expect(activated.has('--safe-mode')).toBe(true);
      expect(activated.has('--fast')).toBe(false);
    });
    
    it('should handle thinking flag conflicts', async () => {
      const flags = new Map([
        ['--think', true],
        ['--think-hard', true],
        ['--ultrathink', true],
      ]);
      
      const activated = await flagManager.activateFlags(flags);
      // Only highest priority thinking flag should remain
      const thinkingFlags = ['--think', '--think-hard', '--ultrathink']
        .filter(f => activated.has(f));
      expect(thinkingFlags.length).toBe(1);
    });
    
    it('should handle network conflicts', async () => {
      const flags = new Map([
        ['--mainnet', true],
        ['--testnet', true], // Conflicts with mainnet
      ]);
      
      const activated = await flagManager.activateFlags(flags);
      // Only one network flag should be active
      const networkFlags = ['--mainnet', '--testnet']
        .filter(f => activated.has(f));
      expect(networkFlags.length).toBe(1);
    });
  });
  
  describe('Impact Calculation', () => {
    it('should calculate token impact', async () => {
      const flags = new Map([
        ['--think', true], // +20% tokens
        ['--uc', true], // -40% tokens
      ]);
      
      await flagManager.activateFlags(flags);
      const impact = flagManager.calculateTokenImpact();
      expect(impact).toBeLessThan(0); // Net reduction
    });
    
    it('should calculate performance impact', async () => {
      const flags = new Map([
        ['--delegate', true], // -0.4 performance
        ['--realtime', true], // +0.5 performance
      ]);
      
      await flagManager.activateFlags(flags);
      const impact = flagManager.calculatePerformanceImpact();
      expect(impact).toBeCloseTo(0.1, 1);
    });
  });
  
  describe('Flag Categories', () => {
    it('should categorize flags correctly', async () => {
      const flags = new Map([
        ['--think', true], // PLANNING
        ['--secure', true], // SECURITY
        ['--delegate', true], // DELEGATION
        ['--mainnet', true], // NETWORK
      ]);
      
      await flagManager.activateFlags(flags);
      
      const planningFlags = flagManager.getFlagsByCategory(FlagCategory.PLANNING);
      expect(planningFlags).toContain('--think');
      
      const securityFlags = flagManager.getFlagsByCategory(FlagCategory.SECURITY);
      expect(securityFlags).toContain('--secure');
      
      const delegationFlags = flagManager.getFlagsByCategory(FlagCategory.DELEGATION);
      expect(delegationFlags).toContain('--delegate');
      
      const networkFlags = flagManager.getFlagsByCategory(FlagCategory.NETWORK);
      expect(networkFlags).toContain('--mainnet');
    });
  });
  
  describe('Recommendations', () => {
    it('should recommend compression for high token usage', () => {
      const context = {
        tokenUsage: 0.8,
        complexity: 0.5,
      };
      
      const recommendations = flagManager.getRecommendations(context);
      expect(recommendations.some(r => r.includes('--uc'))).toBe(true);
    });
    
    it('should recommend delegation for many files', () => {
      const context = {
        fileCount: 100,
        complexity: 0.6,
      };
      
      const recommendations = flagManager.getRecommendations(context);
      expect(recommendations.some(r => r.includes('--delegate'))).toBe(true);
    });
    
    it('should recommend safe-mode for production', () => {
      const context = {
        environment: 'production',
        riskLevel: 0.4,
      };
      
      const recommendations = flagManager.getRecommendations(context);
      expect(recommendations.some(r => r.includes('--safe-mode'))).toBe(true);
    });
  });
  
  describe('Statistics', () => {
    it('should track flag usage statistics', async () => {
      // Activate flags multiple times
      await flagManager.activateFlags(new Map([['--think', true]]));
      await flagManager.activateFlags(new Map([['--secure', true]]));
      await flagManager.activateFlags(new Map([['--think', true]]));
      
      const stats = flagManager.getStatistics();
      expect(stats.totalActivations).toBeGreaterThan(0);
      expect(stats.commonFlags).toContain('--think');
      expect(stats.sourceDistribution.explicit).toBeGreaterThan(0);
    });
  });
  
  describe('Persona Requirements', () => {
    it('should check persona requirements', async () => {
      const context = {
        persona: PersonaType.SECURITY_AUDITOR,
      };
      
      const flags = new Map([
        ['--persona-security', true], // Requires SecurityAuditor
        ['--persona-whale', true], // Requires WhaleHunter
      ]);
      
      const activated = await flagManager.activateFlags(flags, context);
      expect(activated.has('--persona-security')).toBe(true);
      // --persona-whale should be blocked due to persona mismatch
    });
  });
  
  describe('Domain Requirements', () => {
    it('should check domain requirements', async () => {
      const context = {
        domains: [CryptoDomain.SECURITY, CryptoDomain.DEFI],
      };
      
      const flags = new Map([
        ['--ultrathink', true], // Requires SECURITY domain
      ]);
      
      const activated = await flagManager.activateFlags(flags, context);
      expect(activated.has('--ultrathink')).toBe(true);
    });
  });
});