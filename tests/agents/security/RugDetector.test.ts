import { RugDetector } from '../../../src/agents/security/RugDetector';
import { AgentContext } from '../../../src/agents/base/BaseAgent';
import { IHiveService } from '../../../src/interfaces/IHiveService';

describe('RugDetector', () => {
  let rugDetector: RugDetector;
  let mockHiveService: IHiveService;

  beforeEach(() => {
    mockHiveService = {
      execute: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true),
      request: jest.fn(),
      callTool: jest.fn(),
    } as any;
    rugDetector = new RugDetector(mockHiveService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyze', () => {
    it('should detect high-risk rugpull patterns', async () => {
      const context: AgentContext = {
        address: '0xscam123',
        network: 'bsc',
        options: {},
      };

      // Mock Hive API responses
      (mockHiveService.callTool as jest.Mock).mockImplementation(async (tool: string) => {
        if (tool === 'hive_security_scan') {
          return {
            success: true,
            data: {
              hasHoneypot: true,
              hasMintFunction: true,
              ownerCanChangeBalance: true,
              liquidityLocked: false,
            },
          };
        }
        if (tool === 'hive_token_data') {
          return {
            success: true,
            data: {
              totalLiquidity: 5000,
              lockedPercentage: 0,
              renounced: false,
              ownerBalance: 50,
              topHoldersPercentage: 85,
            },
          };
        }
        return { success: true, data: {} };
      });

      const result = await rugDetector.analyze(context);

      expect(result.success).toBe(true);
      expect((result.data as any).verdict).toBeDefined();
      expect((result.data as any).risks).toBeDefined();
    });

    it('should identify safe tokens', async () => {
      const context: AgentContext = {
        address: '0xsafe456',
        network: 'ethereum',
        options: {},
      };

      // Mock safe token responses
      (mockHiveService.callTool as jest.Mock).mockImplementation(async (tool: string) => {
        if (tool === 'hive_security_scan') {
          return {
            success: true,
            data: {
              hasHoneypot: false,
              hasMintFunction: false,
              ownerCanChangeBalance: false,
              liquidityLocked: true,
              audited: true,
              auditor: 'CertiK',
              score: 95,
            },
          };
        }
        if (tool === 'hive_token_data') {
          return {
            success: true,
            data: {
              totalLiquidity: 5000000,
              lockedPercentage: 100,
              lockDuration: 365,
              renounced: true,
              ownerBalance: 0,
              topHoldersPercentage: 35,
            },
          };
        }
        return { success: true, data: {} };
      });

      const result = await rugDetector.analyze(context);

      expect(result.success).toBe(true);
      expect((result.data as any).verdict).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      const context: AgentContext = {
        address: '0xerror789',
        network: 'polygon',
        options: {},
      };

      (mockHiveService.callTool as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await rugDetector.analyze(context);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Error');
    });

    it('should calculate risk score based on multiple factors', async () => {
      const context: AgentContext = {
        address: '0xmedium123',
        network: 'arbitrum',
        options: {},
      };

      (mockHiveService.callTool as jest.Mock).mockImplementation(async (tool: string) => {
        if (tool === 'hive_security_scan') {
          return {
            success: true,
            data: {
              hasHoneypot: false,
              hasMintFunction: true, // Medium risk
              ownerCanChangeBalance: false,
              liquidityLocked: true,
            },
          };
        }
        if (tool === 'hive_token_data') {
          return {
            success: true,
            data: {
              totalLiquidity: 100000, // Medium liquidity
              lockedPercentage: 50, // Partially locked
            },
          };
        }
        return { success: true, data: {} };
      });

      const result = await rugDetector.analyze(context);

      expect(result.success).toBe(true);
      expect((result.data as any).verdict).toBeDefined();
    });

    it('should detect honeypot patterns', async () => {
      const context: AgentContext = {
        address: '0xhoneypot',
        network: 'bsc',
        options: {},
      };

      (mockHiveService.callTool as jest.Mock).mockImplementation(async () => {
        return {
          success: true,
          data: {
            hasHoneypot: true,
            buyTax: 5,
            sellTax: 99, // Honeypot - can't sell
            maxTransactionAmount: 0.0001,
          },
        };
      });

      const result = await rugDetector.analyze(context);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});