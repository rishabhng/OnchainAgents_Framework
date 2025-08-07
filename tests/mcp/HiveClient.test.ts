/**
 * Comprehensive tests for HiveClient
 * Achieving 100% code coverage
 */

import { HiveClient } from '../../src/mcp/HiveClient';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HiveClient', () => {
  let hiveClient: HiveClient;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    hiveClient = new HiveClient();
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
      expect(hiveClient).toBeDefined();
      expect((hiveClient as any).baseUrl).toBe('https://hiveintelligence.xyz/mcp');
      expect((hiveClient as any).timeout).toBe(30000);
    });

    it('should use environment variables when provided', () => {
      process.env.HIVE_API_URL = 'https://custom.url/api';
      process.env.HIVE_API_KEY = 'test-api-key';
      process.env.HIVE_TIMEOUT = '60000';
      
      const customClient = new HiveClient();
      
      expect((customClient as any).baseUrl).toBe('https://custom.url/api');
      expect((customClient as any).apiKey).toBe('test-api-key');
      expect((customClient as any).timeout).toBe(60000);
    });

    it('should initialize request queue', () => {
      expect((hiveClient as any).requestQueue).toBeDefined();
      expect((hiveClient as any).requestQueue).toEqual([]);
    });

    it('should set default retry configuration', () => {
      expect((hiveClient as any).maxRetries).toBe(3);
      expect((hiveClient as any).retryDelay).toBe(1000);
    });
  });

  describe('request', () => {
    it('should make successful API request', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { balance: '1000' },
        },
      };
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await hiveClient.request('getBalance', { address: '0x123' });
      
      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://hiveintelligence.xyz/mcp',
        {
          method: 'getBalance',
          params: { address: '0x123' },
        },
        expect.objectContaining({
          timeout: 30000,
          headers: expect.any(Object),
        })
      );
    });

    it('should include API key in headers', async () => {
      process.env.HIVE_API_KEY = 'test-api-key';
      const clientWithKey = new HiveClient();
      
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: {} },
      });
      
      await clientWithKey.request('test', {});
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-api-key',
          }),
        })
      );
    });

    it('should retry on failure', async () => {
      mockedAxios.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { success: true, data: {} } });
      
      const result = await hiveClient.request('test', {});
      
      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));
      
      await expect(hiveClient.request('test', {})).rejects.toThrow('Network error');
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    it('should handle rate limiting', async () => {
      jest.useFakeTimers();
      
      mockedAxios.post
        .mockRejectedValueOnce({
          response: { status: 429, data: { error: 'Rate limited' } },
        })
        .mockResolvedValueOnce({ data: { success: true, data: {} } });
      
      const requestPromise = hiveClient.request('test', {});
      
      jest.advanceTimersByTime(2000);
      
      const result = await requestPromise;
      
      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });

    it('should queue requests when rate limited', async () => {
      (hiveClient as any).isRateLimited = true;
      
      const promise1 = hiveClient.request('test1', {});
      const promise2 = hiveClient.request('test2', {});
      
      expect((hiveClient as any).requestQueue.length).toBe(2);
      
      (hiveClient as any).isRateLimited = false;
      mockedAxios.post.mockResolvedValue({ data: { success: true } });
      
      await (hiveClient as any).processQueue();
      
      expect((hiveClient as any).requestQueue.length).toBe(0);
    });
  });

  describe('batch', () => {
    it('should batch multiple requests', async () => {
      const requests = [
        { method: 'getBalance', params: { address: '0x1' } },
        { method: 'getBalance', params: { address: '0x2' } },
        { method: 'getBalance', params: { address: '0x3' } },
      ];
      
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          results: [
            { success: true, data: { balance: '100' } },
            { success: true, data: { balance: '200' } },
            { success: true, data: { balance: '300' } },
          ],
        },
      });
      
      const results = await hiveClient.batch(requests);
      
      expect(results).toHaveLength(3);
      expect(results[0].data.balance).toBe('100');
      expect(results[1].data.balance).toBe('200');
      expect(results[2].data.balance).toBe('300');
    });

    it('should handle partial batch failures', async () => {
      const requests = [
        { method: 'getBalance', params: { address: '0x1' } },
        { method: 'invalid', params: {} },
      ];
      
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          results: [
            { success: true, data: { balance: '100' } },
            { success: false, error: 'Invalid method' },
          ],
        },
      });
      
      const results = await hiveClient.batch(requests);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });

    it('should handle batch request failure', async () => {
      const requests = [
        { method: 'test', params: {} },
      ];
      
      mockedAxios.post.mockRejectedValueOnce(new Error('Batch failed'));
      
      await expect(hiveClient.batch(requests)).rejects.toThrow('Batch failed');
    });

    it('should split large batches', async () => {
      const requests = Array(150).fill(null).map((_, i) => ({
        method: 'getBalance',
        params: { address: `0x${i}` },
      }));
      
      mockedAxios.post
        .mockResolvedValueOnce({
          data: {
            success: true,
            results: Array(100).fill({ success: true, data: {} }),
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            results: Array(50).fill({ success: true, data: {} }),
          },
        });
      
      const results = await hiveClient.batch(requests);
      
      expect(results).toHaveLength(150);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('stream', () => {
    it('should create stream subscription', async () => {
      const callback = jest.fn();
      
      const unsubscribe = await hiveClient.stream('newBlocks', {}, callback);
      
      expect(typeof unsubscribe).toBe('function');
      expect((hiveClient as any).activeStreams.size).toBe(1);
    });

    it('should handle stream data', async () => {
      const callback = jest.fn();
      
      // Mock WebSocket
      const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
        close: jest.fn(),
      };
      
      (hiveClient as any).ws = mockWs;
      
      await hiveClient.stream('newBlocks', {}, callback);
      
      // Simulate incoming data
      const messageHandler = mockWs.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      
      if (messageHandler) {
        messageHandler(JSON.stringify({
          type: 'data',
          data: { block: 123 },
        }));
      }
      
      expect(callback).toHaveBeenCalledWith({ block: 123 });
    });

    it('should handle stream errors', async () => {
      const callback = jest.fn();
      const errorCallback = jest.fn();
      
      const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
        close: jest.fn(),
      };
      
      (hiveClient as any).ws = mockWs;
      
      await hiveClient.stream('newBlocks', {}, callback, errorCallback);
      
      const errorHandler = mockWs.on.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];
      
      if (errorHandler) {
        errorHandler(new Error('Stream error'));
      }
      
      expect(errorCallback).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should unsubscribe from stream', async () => {
      const callback = jest.fn();
      
      const unsubscribe = await hiveClient.stream('newBlocks', {}, callback);
      
      expect((hiveClient as any).activeStreams.size).toBe(1);
      
      unsubscribe();
      
      expect((hiveClient as any).activeStreams.size).toBe(0);
    });

    it('should reconnect on disconnect', async () => {
      jest.useFakeTimers();
      
      const callback = jest.fn();
      const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
        close: jest.fn(),
        readyState: 1,
      };
      
      (hiveClient as any).ws = mockWs;
      
      await hiveClient.stream('newBlocks', {}, callback);
      
      // Simulate disconnect
      const closeHandler = mockWs.on.mock.calls.find(
        call => call[0] === 'close'
      )?.[1];
      
      if (closeHandler) {
        closeHandler();
      }
      
      jest.advanceTimersByTime(5000);
      
      expect((hiveClient as any).reconnectAttempts).toBeGreaterThan(0);
      
      jest.useRealTimers();
    });
  });

  describe('cache management', () => {
    it('should cache successful responses', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: { value: 'cached' } },
      });
      
      const result1 = await hiveClient.request('test', { param: 1 });
      const result2 = await hiveClient.request('test', { param: 1 });
      
      expect(result1).toEqual(result2);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should not cache failed responses', async () => {
      mockedAxios.post
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce({ data: { success: true } });
      
      try {
        await hiveClient.request('test', {});
      } catch (e) {
        // Expected error
      }
      
      const result = await hiveClient.request('test', {});
      
      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(4); // 3 retries + 1 success
    });

    it('should expire cache after TTL', async () => {
      jest.useFakeTimers();
      
      mockedAxios.post
        .mockResolvedValueOnce({ data: { success: true, data: { v: 1 } } })
        .mockResolvedValueOnce({ data: { success: true, data: { v: 2 } } });
      
      await hiveClient.request('test', {});
      
      jest.advanceTimersByTime(301000); // Default TTL is 5 minutes
      
      const result = await hiveClient.request('test', {});
      
      expect(result.data.v).toBe(2);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      
      jest.useRealTimers();
    });

    it('should clear cache on demand', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: {} },
      });
      
      await hiveClient.request('test', {});
      expect((hiveClient as any).cache.size).toBe(1);
      
      hiveClient.clearCache();
      expect((hiveClient as any).cache.size).toBe(0);
    });
  });

  describe('health check', () => {
    it('should perform health check', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, status: 'healthy' },
      });
      
      const health = await hiveClient.healthCheck();
      
      expect(health).toEqual({ success: true, status: 'healthy' });
    });

    it('should handle health check failure', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Unhealthy'));
      
      const health = await hiveClient.healthCheck();
      
      expect(health.success).toBe(false);
      expect(health.error).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('should return client metrics', () => {
      (hiveClient as any).requestCount = 100;
      (hiveClient as any).errorCount = 5;
      (hiveClient as any).avgResponseTime = 250;
      
      const metrics = hiveClient.getMetrics();
      
      expect(metrics.requestCount).toBe(100);
      expect(metrics.errorCount).toBe(5);
      expect(metrics.errorRate).toBe(0.05);
      expect(metrics.avgResponseTime).toBe(250);
    });

    it('should track response times', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true },
      });
      
      await hiveClient.request('test', {});
      
      const metrics = hiveClient.getMetrics();
      
      expect(metrics.requestCount).toBe(1);
      expect(metrics.avgResponseTime).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout',
      });
      
      await expect(hiveClient.request('test', {})).rejects.toThrow('timeout');
    });

    it('should handle malformed responses', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: null });
      
      await expect(hiveClient.request('test', {})).rejects.toThrow();
    });

    it('should handle server errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      });
      
      await expect(hiveClient.request('test', {})).rejects.toThrow();
    });

    it('should handle authentication errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Unauthorized' },
        },
      });
      
      await expect(hiveClient.request('test', {})).rejects.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      const mockWs = {
        close: jest.fn(),
      };
      
      (hiveClient as any).ws = mockWs;
      (hiveClient as any).activeStreams = new Set(['stream1', 'stream2']);
      
      hiveClient.destroy();
      
      expect(mockWs.close).toHaveBeenCalled();
      expect((hiveClient as any).activeStreams.size).toBe(0);
      expect((hiveClient as any).cache.size).toBe(0);
    });
  });
});