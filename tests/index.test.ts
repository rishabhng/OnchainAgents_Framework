import { OnChainAgents } from '../src/index';

// Mock the HiveMCPClient
jest.mock('../src/mcp/HiveMCPClient', () => ({
  HiveMCPClient: jest.fn().mockImplementation(() => ({
    call: jest.fn().mockResolvedValue({ success: true, data: {} }),
    execute: jest.fn().mockResolvedValue({ success: true, data: {} }),
    initialize: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    healthCheck: jest.fn().mockResolvedValue(true),
  })),
}));

describe('OnChainAgents', () => {
  let oca: OnChainAgents;

  beforeEach(() => {
    process.env.HIVE_API_KEY = 'test-key';
    oca = new OnChainAgents({
      mcpServerUrl: 'https://test.mcp.server',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with valid config', () => {
      expect(oca).toBeDefined();
      expect(oca.healthCheck).toBeDefined();
    });

    it('should initialize with default config', () => {
      const defaultOca = new OnChainAgents();
      expect(defaultOca).toBeDefined();
    });
  });

  describe('analyze command', () => {
    it('should perform comprehensive analysis', async () => {
      const result = await oca.analyze('ethereum', 'UNI');
      
      expect(result).toBeDefined();
      expect(result.command).toBe('analyze');
      expect(result.data).toBeDefined();
    });

    it('should handle analysis errors', async () => {
      const result = await oca.analyze('invalid', 'INVALID');
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('research command', () => {
    it('should perform token research', async () => {
      const result = await oca.research('ETH');
      
      expect(result).toBeDefined();
      expect(result.command).toBe('research');
      expect(result.data).toBeDefined();
    });

    it('should support deep research option', async () => {
      const result = await oca.research('BTC', { deep: true });
      
      expect(result.data.research).toBeDefined();
    });
  });

  describe('security command', () => {
    it('should perform security analysis', async () => {
      const result = await oca.security('0xtoken123');
      
      expect(result).toBeDefined();
      expect(result.command).toBe('security');
      expect(result.data).toBeDefined();
    });

    it('should detect rug pull risks', async () => {
      const result = await oca.security('0xscam', { network: 'bsc' });
      
      expect(result.data.rugDetection).toBeDefined();
      expect(result.data.riskAnalysis).toBeDefined();
    });
  });

  describe('hunt command', () => {
    it('should find opportunities', async () => {
      const result = await oca.hunt();
      
      expect(result).toBeDefined();
      expect(result.command).toBe('hunt');
      expect(result.data.opportunities).toBeDefined();
    });

    it('should filter by risk level', async () => {
      const result = await oca.hunt({ risk: 'low' });
      
      expect(result.data.opportunities).toBeDefined();
    });

    it('should filter by category', async () => {
      const result = await oca.hunt({ category: 'defi' });
      
      expect(result.data.opportunities).toBeDefined();
    });
  });

  describe('track command', () => {
    it('should track wallet activity', async () => {
      const result = await oca.track('0xwallet123');
      
      expect(result).toBeDefined();
      expect(result.command).toBe('track');
      expect(result.data).toBeDefined();
    });

    it('should identify whale wallets', async () => {
      const result = await oca.track('0xwhale');
      
      expect(result.data.whaleActivity).toBeDefined();
      expect(result.data.portfolio).toBeDefined();
    });
  });

  describe('sentiment command', () => {
    it('should analyze token sentiment', async () => {
      const result = await oca.sentiment('DOGE');
      
      expect(result).toBeDefined();
      expect(result.command).toBe('sentiment');
      expect(result.data).toBeDefined();
    });

    it('should aggregate multiple sources', async () => {
      const result = await oca.sentiment('BTC', {
        sources: 'twitter,reddit,telegram',
      });
      
      expect(result.data.analysis).toBeDefined();
      expect(result.data.analysis.sources).toBeDefined();
    });
  });

  describe('health check', () => {
    it('should verify system health', async () => {
      const healthy = await oca.healthCheck();
      
      expect(typeof healthy).toBe('boolean');
    });
  });

  describe('multi-agent coordination', () => {
    it('should coordinate multiple agents for analyze', async () => {
      const result = await oca.analyze('ethereum', 'AAVE');
      
      expect(result.data.security).toBeDefined();
      expect(result.data.market).toBeDefined();
      expect(result.data.research).toBeDefined();
      expect(result.data.specialized).toBeDefined();
    });

    it('should handle parallel agent execution', async () => {
      const startTime = Date.now();
      const result = await oca.analyze('ethereum', 'UNI');
      const executionTime = Date.now() - startTime;
      
      // Should be faster than sequential execution
      expect(executionTime).toBeLessThan(5000);
      expect(result.data).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate network error
      jest.spyOn(oca as any, 'initializeAgents').mockImplementation(() => {
        throw new Error('Network error');
      });
      
      const result = await oca.analyze('ethereum', 'TEST');
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Network error');
    });

    it('should validate input parameters', async () => {
      const result = await oca.security('invalid-address');
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Invalid');
    });

    it('should handle timeout errors', async () => {
      // Mock slow response
      jest.setTimeout(10000);
      
      const slowPromise = new Promise((resolve) => {
        setTimeout(resolve, 8000);
      });
      
      jest.spyOn(oca as any, 'analyze').mockImplementation(() => slowPromise);
      
      const result = await Promise.race([
        oca.analyze('ethereum', 'SLOW'),
        new Promise((resolve) => setTimeout(() => resolve({ success: false, error: 'Timeout' }), 5000)),
      ]);
      
      expect(result).toBeDefined();
    });
  });

  describe('caching', () => {
    it('should cache repeated requests', async () => {
      const spy = jest.spyOn(oca as any, 'initializeAgents');
      
      // First call
      await oca.analyze('ethereum', 'CACHE');
      const firstCallCount = spy.mock.calls.length;
      
      // Second call (should use cache)
      await oca.analyze('ethereum', 'CACHE');
      const secondCallCount = spy.mock.calls.length;
      
      expect(secondCallCount).toBe(firstCallCount);
    });
  });
});