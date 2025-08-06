import { RugDetector } from '../../../src/agents/security/RugDetector';
import { HiveClient } from '../../../src/mcp/HiveClient';
import { AgentContext } from '../../../src/agents/base/BaseAgent';

// Mock HiveClient
jest.mock('../../../src/mcp/HiveClient');

describe('RugDetector', () => {
  let rugDetector: RugDetector;
  let mockHiveClient: jest.Mocked<HiveClient>;

  beforeEach(() => {
    mockHiveClient = new HiveClient({ apiKey: 'test-key' }) as jest.Mocked<HiveClient>;
    rugDetector = new RugDetector(mockHiveClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyze', () => {
    it('should detect high-risk rugpull patterns', async () => {
      const context: AgentContext = {
        target: '0xscam123',
        network: 'bsc',
        options: {},
      };

      // Mock Hive API responses
      mockHiveClient.request.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('/contract')) {
          return {
            data: {
              hasHoneypot: true,
              hasMintFunction: true,
              ownerCanChangeBalance: true,
              liquidityLocked: false,
            },
          };
        }
        if (endpoint.includes('/liquidity')) {
          return {
            data: {
              totalLiquidity: 5000,
              lockedPercentage: 0,
            },
          };
        }
        if (endpoint.includes('/ownership')) {
          return {
            data: {
              renounced: false,
              ownerBalance: 50,
              topHoldersPercentage: 85,
            },
          };
        }
        return { data: {} };
      });

      const result = await rugDetector.analyze(context);

      expect(result.data.riskScore).toBeGreaterThan(80);
      expect(result.data.verdict).toBe('HIGH_RISK');
      expect(result.data.flags).toContain('HONEYPOT_DETECTED');
      expect(result.data.flags).toContain('LIQUIDITY_NOT_LOCKED');
      expect(result.data.flags).toContain('OWNERSHIP_NOT_RENOUNCED');
    });

    it('should identify safe tokens', async () => {
      const context: AgentContext = {
        target: '0xsafe456',
        network: 'ethereum',
        options: {},
      };

      // Mock safe token responses
      mockHiveClient.request.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('/contract')) {
          return {
            data: {
              hasHoneypot: false,
              hasMintFunction: false,
              ownerCanChangeBalance: false,
              liquidityLocked: true,
            },
          };
        }
        if (endpoint.includes('/liquidity')) {
          return {
            data: {
              totalLiquidity: 5000000,
              lockedPercentage: 100,
              lockDuration: 365,
            },
          };
        }
        if (endpoint.includes('/ownership')) {
          return {
            data: {
              renounced: true,
              ownerBalance: 0,
              topHoldersPercentage: 35,
            },
          };
        }
        if (endpoint.includes('/audit')) {
          return {
            data: {
              audited: true,
              auditor: 'CertiK',
              score: 95,
            },
          };
        }
        return { data: {} };
      });

      const result = await rugDetector.analyze(context);

      expect(result.data.riskScore).toBeLessThan(30);
      expect(result.data.verdict).toBe('SAFE');
      expect(result.data.flags).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      const context: AgentContext = {
        target: '0xerror789',
        network: 'polygon',
        options: {},
      };

      mockHiveClient.request.mockRejectedValue(new Error('API Error'));

      const result = await rugDetector.analyze(context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('API Error');
    });

    it('should calculate risk score based on multiple factors', async () => {
      const context: AgentContext = {
        target: '0xmedium123',
        network: 'arbitrum',
        options: {},
      };

      mockHiveClient.request.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('/contract')) {
          return {
            data: {
              hasHoneypot: false,
              hasMintFunction: true, // Medium risk
              ownerCanChangeBalance: false,
              liquidityLocked: true,
            },
          };
        }
        if (endpoint.includes('/liquidity')) {
          return {
            data: {
              totalLiquidity: 100000, // Medium liquidity
              lockedPercentage: 50, // Partially locked
            },
          };
        }
        return { data: {} };
      });

      const result = await rugDetector.analyze(context);

      expect(result.data.riskScore).toBeGreaterThan(30);
      expect(result.data.riskScore).toBeLessThan(70);
      expect(result.data.verdict).toBe('MODERATE');
    });

    it('should detect honeypot patterns', async () => {
      const context: AgentContext = {
        target: '0xhoneypot',
        network: 'bsc',
        options: {},
      };

      mockHiveClient.request.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('/transactions')) {
          return {
            data: {
              buyCount: 1000,
              sellCount: 2, // Very few successful sells
              failedSells: 498, // Many failed sells
            },
          };
        }
        return { data: {} };
      });

      const result = await rugDetector.analyze(context);

      expect(result.data.honeypotIndicators).toBeDefined();
      expect(result.data.honeypotIndicators.suspiciousSellPattern).toBe(true);
      expect(result.data.flags).toContain('HONEYPOT_PATTERN_DETECTED');
    });
  });

  describe('input validation', () => {
    it('should reject invalid contract addresses', async () => {
      const context: AgentContext = {
        target: 'invalid-address',
        network: 'ethereum',
        options: {},
      };

      const result = await rugDetector.analyze(context);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid contract address');
    });

    it('should handle unsupported networks', async () => {
      const context: AgentContext = {
        target: '0xvalid123',
        network: 'unsupported-chain',
        options: {},
      };

      const result = await rugDetector.analyze(context);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unsupported network');
    });
  });

  describe('caching', () => {
    it('should cache results for repeated requests', async () => {
      const context: AgentContext = {
        target: '0xcached123',
        network: 'ethereum',
        options: {},
      };

      mockHiveClient.request.mockResolvedValue({ data: {} });

      // First call
      await rugDetector.analyze(context);
      expect(mockHiveClient.request).toHaveBeenCalledTimes(5); // Multiple API calls

      // Second call (should use cache)
      await rugDetector.analyze(context);
      expect(mockHiveClient.request).toHaveBeenCalledTimes(5); // No additional calls
    });
  });
});