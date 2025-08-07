/**
 * Tests for Router
 * Testing routing logic and agent coordination
 */

import { Router } from '../../src/orchestrator/router';
import { DetectionResult } from '../../src/orchestrator/detector';

describe('Router', () => {
  let router: Router;

  beforeEach(() => {
    jest.clearAllMocks();
    router = new Router();
  });

  describe('constructor', () => {
    it('should initialize routing table', () => {
      expect(router).toBeDefined();
      expect((router as any).routingTable).toBeDefined();
      expect((router as any).routingTable.size).toBeGreaterThan(0);
    });
  });

  describe('determineRoute', () => {
    it('should route simple security analysis', async () => {
      const context: DetectionResult = {
        tool: 'oca_security',
        agents: ['RugDetector'],
        complexity: 'simple',
        confidence: 0.9,
        args: {},
        domain: 'security',
        requiresHive: true,
        estimatedTime: 5000,
        estimatedTokens: 5000,
      };

      const result = await router.determineRoute(context);

      expect(result).toBeDefined();
      expect(result.strategy).toBe('simple');
      expect(result.agents).toContain('RugDetector');
      expect(result.priority).toBe('high');
      expect(result.requiresValidation).toBe(true);
    });

    it('should route complex multi-agent analysis', async () => {
      const context: DetectionResult = {
        tool: 'oca_analyze',
        agents: ['RugDetector', 'MarketAnalyzer', 'SentimentAnalyzer'],
        complexity: 'complex',
        confidence: 0.85,
        args: {},
        domain: 'multi',
        requiresHive: true,
        estimatedTime: 30000,
        estimatedTokens: 20000,
      };

      const result = await router.determineRoute(context);

      expect(result).toBeDefined();
      expect(result.strategy).toBe('parallel');
      expect(result.agents.length).toBeGreaterThan(1);
      expect(result.cacheEnabled).toBe(true);
    });

    it('should route whale tracking', async () => {
      const context: DetectionResult = {
        tool: 'oca_track',
        agents: ['WhaleTracker'],
        complexity: 'moderate',
        confidence: 0.95,
        args: {},
        domain: 'tracking',
        requiresHive: true,
        estimatedTime: 15000,
        estimatedTokens: 10000,
      };

      const result = await router.determineRoute(context);

      expect(result).toBeDefined();
      expect(result.strategy).toBe('sequential');
      expect(result.agents).toContain('WhaleTracker');
      expect(result.cacheEnabled).toBe(false); // Real-time tracking
    });

    it('should route DeFi analysis', async () => {
      const context: DetectionResult = {
        tool: 'oca_defi',
        agents: ['DeFiAnalyzer'],
        complexity: 'moderate',
        confidence: 0.88,
        args: {},
        domain: 'defi',
        requiresHive: true,
        estimatedTime: 15000,
        estimatedTokens: 10000,
      };

      const result = await router.determineRoute(context);

      expect(result).toBeDefined();
      expect(result.strategy).toBe('parallel');
      expect(result.agents).toContain('DeFiAnalyzer');
      expect(result.requiresValidation).toBe(true);
    });

    it('should route alpha hunting', async () => {
      const context: DetectionResult = {
        tool: 'oca_hunt',
        agents: ['AlphaHunter'],
        complexity: 'simple',
        confidence: 0.75,
        args: {},
        domain: 'alpha',
        requiresHive: true,
        estimatedTime: 5000,
        estimatedTokens: 5000,
      };

      const result = await router.determineRoute(context);

      expect(result).toBeDefined();
      expect(result.strategy).toBe('parallel');
      expect(result.agents).toContain('AlphaHunter');
      expect(result.cacheEnabled).toBe(false); // Always fresh data for alpha
    });

    it('should handle comprehensive analysis with multiple agents', async () => {
      const context: DetectionResult = {
        tool: 'oca_analyze',
        agents: ['RugDetector', 'MarketAnalyzer', 'WhaleTracker', 'SentimentAnalyzer'],
        complexity: 'complex',
        confidence: 0.92,
        args: {},
        domain: 'multi',
        requiresHive: true,
        estimatedTime: 30000,
        estimatedTokens: 25000,
      };

      const result = await router.determineRoute(context);

      expect(result).toBeDefined();
      expect(result.agents.length).toBe(4);
      expect(result.strategy).toBe('parallel');
      expect(result.requiresValidation).toBe(true);
    });

    it('should route sentiment analysis', async () => {
      const context: DetectionResult = {
        tool: 'oca_sentiment',
        agents: ['SentimentAnalyzer'],
        complexity: 'simple',
        confidence: 0.7,
        args: {},
        domain: 'social',
        requiresHive: true,
        estimatedTime: 5000,
        estimatedTokens: 5000,
      };

      const result = await router.determineRoute(context);

      expect(result).toBeDefined();
      expect(result.strategy).toBe('simple');
      expect(result.agents).toContain('SentimentAnalyzer');
      expect(result.priority).toBe('low');
    });

    it('should route portfolio analysis', async () => {
      const context: DetectionResult = {
        tool: 'oca_portfolio',
        agents: ['PortfolioTracker'],
        complexity: 'moderate',
        confidence: 0.8,
        args: {},
        domain: 'portfolio',
        requiresHive: true,
        estimatedTime: 15000,
        estimatedTokens: 10000,
      };

      const result = await router.determineRoute(context);

      expect(result).toBeDefined();
      expect(result.strategy).toBe('parallel');
      expect(result.agents).toContain('PortfolioTracker');
      expect(result.cacheEnabled).toBe(true);
    });

    it('should handle unknown tool with default routing', async () => {
      const context: DetectionResult = {
        tool: 'unknown_tool',
        agents: ['SomeAgent'],
        complexity: 'simple',
        confidence: 0.5,
        args: {},
        domain: 'unknown',
        requiresHive: false,
        estimatedTime: 5000,
        estimatedTokens: 5000,
      };

      const result = await router.determineRoute(context);

      expect(result).toBeDefined();
      expect(result.strategy).toBe('simple');
      expect(result.cacheEnabled).toBe(true); // Default
      expect(result.requiresValidation).toBe(false); // Default
    });

    it('should determine parallel execution correctly', async () => {
      const context: DetectionResult = {
        tool: 'oca_market',
        agents: ['MarketMaker', 'MarketAnalyzer'],
        complexity: 'moderate',
        confidence: 0.85,
        args: {},
        domain: 'market',
        requiresHive: true,
        estimatedTime: 15000,
        estimatedTokens: 12000,
      };

      const result = await router.determineRoute(context);

      expect(result).toBeDefined();
      expect(result.strategy).toBe('hybrid');
      expect(result.agents.length).toBe(2);
    });
  });
});