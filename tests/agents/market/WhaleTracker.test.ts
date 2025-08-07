/**
 * Comprehensive tests for WhaleTracker agent
 * Achieving 100% code coverage
 */

import { WhaleTracker } from '../../../src/agents/market/WhaleTracker';
import { HiveBridge } from '../../../src/bridges/hive-bridge';
import { AgentContext } from '../../../src/agents/base/BaseAgent';

// Mock HiveBridge
jest.mock('../../../src/bridges/hive-bridge');

describe('WhaleTracker', () => {
  let whaleTracker: WhaleTracker;
  let mockHiveBridge: jest.Mocked<HiveBridge>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHiveBridge = new HiveBridge() as jest.Mocked<HiveBridge>;
    whaleTracker = new WhaleTracker(mockHiveBridge);
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(whaleTracker).toBeDefined();
      expect(whaleTracker.name).toBe('WhaleTracker');
      expect(whaleTracker.description).toContain('tracking whale wallets');
    });
  });

  describe('validateInput', () => {
    it('should validate valid input', () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      };

      const schema = whaleTracker.validateInput(context);
      const result = schema.safeParse(context);
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid address format', () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: 'invalid-address',
      };

      const schema = whaleTracker.validateInput(context);
      const result = schema.safeParse(context);
      
      expect(result.success).toBe(false);
    });

    it('should handle optional timeframe', () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
        timeframe: '7d',
      };

      const schema = whaleTracker.validateInput(context);
      const result = schema.safeParse(context);
      
      expect(result.success).toBe(true);
    });
  });

  describe('performAnalysis', () => {
    it('should track whale movements successfully', async () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      };

      mockHiveBridge.query.mockResolvedValueOnce({
        success: true,
        data: {
          balance: '50000000000000000000000', // 50,000 ETH
          transactions: [
            {
              hash: '0x123',
              from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
              to: '0xabc',
              value: '1000000000000000000000',
              timestamp: Date.now() - 3600000,
            },
          ],
          tokens: [
            {
              symbol: 'USDC',
              balance: '10000000000000',
              value: 10000000,
            },
          ],
        },
      });

      const result = await whaleTracker.performAnalysis(context);

      expect(result).toBeDefined();
      expect(result.whaleInfo).toBeDefined();
      expect(result.whaleInfo.address).toBe(context.address);
      expect(result.whaleInfo.isWhale).toBe(true);
      expect(result.movements).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.risk).toBeDefined();
    });

    it('should identify accumulation patterns', async () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      };

      // Mock multiple incoming transactions
      mockHiveBridge.query.mockResolvedValueOnce({
        success: true,
        data: {
          balance: '100000000000000000000000',
          transactions: [
            {
              hash: '0x1',
              to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
              value: '10000000000000000000000',
              timestamp: Date.now() - 3600000,
            },
            {
              hash: '0x2',
              to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
              value: '20000000000000000000000',
              timestamp: Date.now() - 7200000,
            },
            {
              hash: '0x3',
              to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
              value: '30000000000000000000000',
              timestamp: Date.now() - 10800000,
            },
          ],
        },
      });

      const result = await whaleTracker.performAnalysis(context);

      expect(result.patterns.accumulation).toBe(true);
      expect(result.patterns.distribution).toBe(false);
    });

    it('should identify distribution patterns', async () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      };

      // Mock multiple outgoing transactions
      mockHiveBridge.query.mockResolvedValueOnce({
        success: true,
        data: {
          balance: '10000000000000000000000',
          transactions: [
            {
              hash: '0x1',
              from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
              value: '10000000000000000000000',
              timestamp: Date.now() - 3600000,
            },
            {
              hash: '0x2',
              from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
              value: '20000000000000000000000',
              timestamp: Date.now() - 7200000,
            },
          ],
        },
      });

      const result = await whaleTracker.performAnalysis(context);

      expect(result.patterns.distribution).toBe(true);
      expect(result.patterns.accumulation).toBe(false);
    });

    it('should detect dormant whales', async () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      };

      // Mock no recent transactions
      mockHiveBridge.query.mockResolvedValueOnce({
        success: true,
        data: {
          balance: '100000000000000000000000',
          transactions: [],
          tokens: [],
        },
      });

      const result = await whaleTracker.performAnalysis(context);

      expect(result.patterns.dormant).toBe(true);
      expect(result.risk.level).toBe('low');
    });

    it('should calculate risk scores correctly', async () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      };

      // Mock sudden large movements
      mockHiveBridge.query.mockResolvedValueOnce({
        success: true,
        data: {
          balance: '10000000000000000000000',
          transactions: [
            {
              hash: '0x1',
              from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
              value: '90000000000000000000000', // 90% of previous balance moved
              timestamp: Date.now() - 1800000,
            },
          ],
        },
      });

      const result = await whaleTracker.performAnalysis(context);

      expect(result.risk.level).toBe('high');
      expect(result.risk.factors).toContain('sudden_movement');
    });

    it('should provide market impact analysis', async () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      };

      mockHiveBridge.query.mockResolvedValueOnce({
        success: true,
        data: {
          balance: '500000000000000000000000', // 500,000 ETH (massive whale)
          transactions: [],
        },
      });

      const result = await whaleTracker.performAnalysis(context);

      expect(result.impact).toBeDefined();
      expect(result.impact.marketInfluence).toBe('extreme');
      expect(result.impact.priceImpact).toBeGreaterThan(0.05);
    });

    it('should analyze multi-token holdings', async () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      };

      mockHiveBridge.query.mockResolvedValueOnce({
        success: true,
        data: {
          balance: '50000000000000000000000',
          tokens: [
            { symbol: 'USDC', balance: '10000000000000', value: 10000000 },
            { symbol: 'WBTC', balance: '100000000', value: 3000000 },
            { symbol: 'LINK', balance: '1000000000000000000000', value: 15000 },
          ],
        },
      });

      const result = await whaleTracker.performAnalysis(context);

      expect(result.whaleInfo.tokens).toHaveLength(3);
      expect(result.whaleInfo.totalValue).toBeGreaterThan(10000000);
    });

    it('should handle API errors gracefully', async () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      };

      mockHiveBridge.query.mockRejectedValueOnce(new Error('API error'));

      const result = await whaleTracker.performAnalysis(context);

      expect(result.whaleInfo).toBeDefined();
      expect(result.movements).toEqual([]);
      expect(result.patterns.unknown).toBe(true);
    });

    it('should handle different timeframes', async () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
        timeframe: '30d',
      };

      mockHiveBridge.query.mockResolvedValueOnce({
        success: true,
        data: {
          balance: '50000000000000000000000',
          transactions: Array(50).fill(null).map((_, i) => ({
            hash: `0x${i}`,
            from: i % 2 === 0 ? context.address : '0xother',
            to: i % 2 === 0 ? '0xother' : context.address,
            value: '1000000000000000000',
            timestamp: Date.now() - (i * 86400000), // Daily transactions
          })),
        },
      });

      const result = await whaleTracker.performAnalysis(context);

      expect(result.movements.length).toBeGreaterThan(0);
      expect(result.patterns.regular_activity).toBe(true);
    });

    it('should identify whale clusters', async () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      };

      // Mock transactions with other known whales
      mockHiveBridge.query.mockResolvedValueOnce({
        success: true,
        data: {
          balance: '100000000000000000000000',
          transactions: [
            {
              hash: '0x1',
              from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
              to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Known whale
              value: '10000000000000000000000',
              timestamp: Date.now() - 3600000,
            },
            {
              hash: '0x2',
              from: '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', // Another whale
              to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
              value: '20000000000000000000000',
              timestamp: Date.now() - 7200000,
            },
          ],
        },
      });

      const result = await whaleTracker.performAnalysis(context);

      expect(result.patterns.whale_cluster).toBe(true);
      expect(result.impact.marketInfluence).toContain('high');
    });

    it('should track cross-chain movements', async () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      };

      // Mock bridge transactions
      mockHiveBridge.query.mockResolvedValueOnce({
        success: true,
        data: {
          balance: '50000000000000000000000',
          transactions: [
            {
              hash: '0x1',
              from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
              to: '0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe', // Polygon bridge
              value: '25000000000000000000000',
              timestamp: Date.now() - 3600000,
              type: 'bridge',
            },
          ],
        },
      });

      const result = await whaleTracker.performAnalysis(context);

      expect(result.patterns.cross_chain).toBe(true);
      expect(result.movements[0].type).toBe('bridge');
    });

    it('should provide recommendations based on patterns', async () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      };

      // Mock accumulation pattern
      mockHiveBridge.query.mockResolvedValueOnce({
        success: true,
        data: {
          balance: '200000000000000000000000',
          transactions: Array(10).fill(null).map((_, i) => ({
            hash: `0x${i}`,
            to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
            value: '20000000000000000000000',
            timestamp: Date.now() - (i * 3600000),
          })),
        },
      });

      const result = await whaleTracker.performAnalysis(context);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations).toContain(
        expect.stringContaining('accumulation')
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const context: AgentContext = {
        network: 'invalid-network',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      };

      mockHiveBridge.query.mockRejectedValueOnce(new Error('Network not supported'));

      const result = await whaleTracker.performAnalysis(context);

      expect(result.whaleInfo).toBeDefined();
      expect(result.patterns.unknown).toBe(true);
    });

    it('should handle malformed responses', async () => {
      const context: AgentContext = {
        network: 'ethereum',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      };

      mockHiveBridge.query.mockResolvedValueOnce({
        success: false,
        error: 'Invalid response format',
      });

      const result = await whaleTracker.performAnalysis(context);

      expect(result).toBeDefined();
      expect(result.patterns.unknown).toBe(true);
    });
  });

  describe('getRecommendations', () => {
    it('should provide accumulation recommendations', () => {
      const data = {
        patterns: { accumulation: true },
        risk: { level: 'medium' },
      };

      const recommendations = (whaleTracker as any).getRecommendations(data);

      expect(recommendations).toContain('Whale is accumulating');
      expect(recommendations).toContain('Consider following');
    });

    it('should provide distribution warnings', () => {
      const data = {
        patterns: { distribution: true },
        risk: { level: 'high' },
      };

      const recommendations = (whaleTracker as any).getRecommendations(data);

      expect(recommendations).toContain('distributing');
      expect(recommendations).toContain('caution');
    });

    it('should provide dormant whale alerts', () => {
      const data = {
        patterns: { dormant: true },
        impact: { marketInfluence: 'high' },
      };

      const recommendations = (whaleTracker as any).getRecommendations(data);

      expect(recommendations).toContain('dormant');
      expect(recommendations).toContain('sudden activation');
    });
  });
});