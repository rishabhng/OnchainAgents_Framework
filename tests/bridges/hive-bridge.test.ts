/**
 * Comprehensive tests for HiveBridge
 * Achieving 100% code coverage
 */

import { HiveBridge } from '../../src/bridges/hive-bridge';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HiveBridge', () => {
  let hiveBridge: HiveBridge;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    hiveBridge = new HiveBridge();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(hiveBridge).toBeDefined();
      expect((hiveBridge as any).baseUrl).toBe('https://hiveintelligence.xyz/mcp');
      expect((hiveBridge as any).fallbackMode).toBe(false);
    });

    it('should use environment variables when provided', () => {
      process.env.HIVE_MCP_URL = 'https://custom.url/mcp';
      process.env.HIVE_API_KEY = 'test-api-key';
      process.env.HIVE_FALLBACK_MODE = 'true';
      
      const customBridge = new HiveBridge();
      
      expect((customBridge as any).baseUrl).toBe('https://custom.url/mcp');
      expect((customBridge as any).apiKey).toBe('test-api-key');
      expect((customBridge as any).fallbackMode).toBe(true);
    });

    it('should initialize cache', () => {
      expect((hiveBridge as any).cache).toBeDefined();
      expect((hiveBridge as any).cache.size).toBe(0);
    });
  });

  describe('query', () => {
    it('should make successful API call', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { balance: '1000' },
        },
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await hiveBridge.query('getBalance', { address: '0x123' });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ balance: '1000' });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://hiveintelligence.xyz/mcp',
        expect.objectContaining({
          action: 'getBalance',
          params: { address: '0x123' },
        }),
        expect.any(Object)
      );
    });

    it('should include API key in headers when provided', async () => {
      process.env.HIVE_API_KEY = 'test-api-key';
      const bridgeWithKey = new HiveBridge();
      
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: {} },
      });
      
      await bridgeWithKey.query('test', {});
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should use cache for repeated queries', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { balance: '1000' },
        },
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      // First call
      const result1 = await hiveBridge.query('getBalance', { address: '0x123' });
      
      // Second call (should use cache)
      const result2 = await hiveBridge.query('getBalance', { address: '0x123' });
      
      expect(result1).toEqual(result2);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1); // Only one API call
    });

    it('should expire cache after TTL', async () => {
      jest.useFakeTimers();
      
      const mockResponse1 = {
        data: { success: true, data: { balance: '1000' } },
      };
      const mockResponse2 = {
        data: { success: true, data: { balance: '2000' } },
      };
      
      mockedAxios.post
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);
      
      // First call
      await hiveBridge.query('getBalance', { address: '0x123' });
      
      // Advance time beyond cache TTL (5 minutes)
      jest.advanceTimersByTime(6 * 60 * 1000);
      
      // Second call (cache expired, should make new API call)
      const result = await hiveBridge.query('getBalance', { address: '0x123' });
      
      expect(result.data.balance).toBe('2000');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await hiveBridge.query('getBalance', { address: '0x123' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Hive API error')
      );
    });

    it('should handle unsuccessful API responses', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: false,
          error: 'Invalid parameters',
        },
      });
      
      const result = await hiveBridge.query('getBalance', { address: '0x123' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid parameters');
    });

    it('should use fallback mode when enabled', async () => {
      process.env.HIVE_FALLBACK_MODE = 'true';
      const fallbackBridge = new HiveBridge();
      
      const result = await fallbackBridge.query('getBalance', { address: '0x123' });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle rate limiting with retry', async () => {
      jest.useFakeTimers();
      
      // First call returns rate limit error
      mockedAxios.post
        .mockRejectedValueOnce({
          response: { status: 429, data: { error: 'Rate limited' } },
        })
        .mockResolvedValueOnce({
          data: { success: true, data: { balance: '1000' } },
        });
      
      const queryPromise = hiveBridge.query('getBalance', { address: '0x123' });
      
      // Advance time for retry
      jest.advanceTimersByTime(2000);
      
      const result = await queryPromise;
      
      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });

    it('should handle timeout errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'Request timeout',
      });
      
      const result = await hiveBridge.query('getBalance', { address: '0x123' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('generateFallbackData', () => {
    beforeEach(() => {
      process.env.HIVE_FALLBACK_MODE = 'true';
      hiveBridge = new HiveBridge();
    });

    it('should generate fallback data for getTokenInfo', async () => {
      const result = await hiveBridge.query('getTokenInfo', {
        address: '0x123',
        network: 'ethereum',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.symbol).toBeDefined();
      expect(result.data.decimals).toBe(18);
      expect(result.data.totalSupply).toBeDefined();
    });

    it('should generate fallback data for getWalletInfo', async () => {
      const result = await hiveBridge.query('getWalletInfo', {
        address: '0x456',
        network: 'ethereum',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.balance).toBeDefined();
      expect(result.data.transactions).toBeDefined();
      expect(Array.isArray(result.data.transactions)).toBe(true);
    });

    it('should generate fallback data for getTransactions', async () => {
      const result = await hiveBridge.query('getTransactions', {
        address: '0x789',
        network: 'ethereum',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should generate fallback data for getDeFiPositions', async () => {
      const result = await hiveBridge.query('getDeFiPositions', {
        address: '0xabc',
        network: 'ethereum',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.positions).toBeDefined();
      expect(Array.isArray(result.data.positions)).toBe(true);
      expect(result.data.totalValue).toBeDefined();
    });

    it('should generate fallback data for getSentiment', async () => {
      const result = await hiveBridge.query('getSentiment', {
        symbol: 'BTC',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.sentiment).toBeDefined();
      expect(result.data.score).toBeGreaterThanOrEqual(0);
      expect(result.data.score).toBeLessThanOrEqual(1);
    });

    it('should generate fallback data for getBridgeRoutes', async () => {
      const result = await hiveBridge.query('getBridgeRoutes', {
        from: 'ethereum',
        to: 'polygon',
        token: 'USDC',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.routes).toBeDefined();
      expect(Array.isArray(result.data.routes)).toBe(true);
    });

    it('should generate fallback data for getAlphaOpportunities', async () => {
      const result = await hiveBridge.query('getAlphaOpportunities', {
        network: 'ethereum',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.opportunities).toBeDefined();
      expect(Array.isArray(result.data.opportunities)).toBe(true);
    });

    it('should generate fallback data for unknown actions', async () => {
      const result = await hiveBridge.query('unknownAction', {});
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        message: 'Fallback data for unknownAction',
        timestamp: expect.any(Number),
      });
    });

    it('should generate different whale addresses', () => {
      const addresses = new Set();
      for (let i = 0; i < 10; i++) {
        const data = (hiveBridge as any).generateFallbackData('getWalletInfo', {});
        if (data.data.isWhale) {
          addresses.add(data.data.address);
        }
      }
      
      expect(addresses.size).toBeGreaterThan(0);
    });

    it('should generate varying sentiment scores', () => {
      const scores = new Set();
      for (let i = 0; i < 10; i++) {
        const data = (hiveBridge as any).generateFallbackData('getSentiment', {});
        scores.add(data.data.score);
      }
      
      expect(scores.size).toBeGreaterThan(1); // Should have variety
    });
  });

  describe('cache management', () => {
    it('should clear expired cache entries', async () => {
      jest.useFakeTimers();
      
      mockedAxios.post.mockResolvedValue({
        data: { success: true, data: {} },
      });
      
      // Add multiple cache entries
      await hiveBridge.query('query1', { param: 1 });
      await hiveBridge.query('query2', { param: 2 });
      
      expect((hiveBridge as any).cache.size).toBe(2);
      
      // Advance time beyond TTL
      jest.advanceTimersByTime(6 * 60 * 1000);
      
      // Make new query to trigger cache cleanup
      await hiveBridge.query('query3', { param: 3 });
      
      // Old entries should be removed
      expect((hiveBridge as any).cache.size).toBe(1);
      
      jest.useRealTimers();
    });

    it('should handle cache key generation', () => {
      const key1 = (hiveBridge as any).getCacheKey('action1', { a: 1, b: 2 });
      const key2 = (hiveBridge as any).getCacheKey('action1', { b: 2, a: 1 });
      const key3 = (hiveBridge as any).getCacheKey('action2', { a: 1, b: 2 });
      
      expect(key1).toBe(key2); // Same params in different order
      expect(key1).not.toBe(key3); // Different action
    });

    it('should limit cache size', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { success: true, data: {} },
      });
      
      // Add many cache entries
      for (let i = 0; i < 150; i++) {
        await hiveBridge.query('query', { param: i });
      }
      
      // Cache should be limited
      expect((hiveBridge as any).cache.size).toBeLessThanOrEqual(100);
    });
  });

  describe('error handling', () => {
    it('should handle malformed responses', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: null });
      
      const result = await hiveBridge.query('test', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid response');
    });

    it('should handle network timeouts', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        code: 'ETIMEDOUT',
        message: 'Connection timed out',
      });
      
      const result = await hiveBridge.query('test', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('should handle server errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      });
      
      const result = await hiveBridge.query('test', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Internal server error');
    });

    it('should handle unauthorized errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Unauthorized' },
        },
      });
      
      const result = await hiveBridge.query('test', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });
  });
});