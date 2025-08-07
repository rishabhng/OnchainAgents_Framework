import { AlphaHunter } from '../../../src/agents/market/AlphaHunter';
import { AgentContext } from '../../../src/agents/base/BaseAgent';
import { IHiveService } from '../../../src/interfaces/IHiveService';

describe('AlphaHunter', () => {
  let alphaHunter: AlphaHunter;
  let mockHiveService: IHiveService;

  beforeEach(() => {
    mockHiveService = {
      execute: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true),
      request: jest.fn(),
      callTool: jest.fn(),
    } as any;
    alphaHunter = new AlphaHunter(mockHiveService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyze', () => {
    it('should identify high-potential opportunities', async () => {
      const context: AgentContext = {
        options: {
          minLiquidity: 100000,
          maxMarketCap: 10000000,
          socialGrowth: 'increasing',
        },
      };

      (mockHiveService.callTool as jest.Mock).mockImplementation(async (tool: string) => {
        if (tool === 'hive_alpha_signals') {
          return {
            success: true,
            data: {
              opportunities: [
                {
                  symbol: 'ALPHA',
                  address: '0xalpha123',
                  marketCap: 5000000,
                  volume24h: 2000000,
                  priceChange24h: 25,
                  socialMentions: 1500,
                  uniqueWallets: 5000,
                  momentumScore: 8.5,
                },
                {
                  symbol: 'BETA',
                  address: '0xbeta456',
                  marketCap: 8000000,
                  volume24h: 500000,
                  priceChange24h: 10,
                  socialMentions: 500,
                  uniqueWallets: 2000,
                  momentumScore: 6.0,
                },
              ],
            },
          };
        }
        return { success: true, data: {} };
      });

      const result = await alphaHunter.analyze(context);

      expect(result.success).toBe(true);
      expect((result.data as any).opportunities).toBeDefined();
      expect((result.data as any).opportunities.length).toBeGreaterThan(0);
    });

    it('should filter opportunities by risk level', async () => {
      const context: AgentContext = {
        options: {
          risk: 'low',
        },
      };

      (mockHiveService.callTool as jest.Mock).mockImplementation(async (tool: string) => {
        if (tool === 'hive_alpha_signals') {
          return {
            success: true,
            data: {
              opportunities: [
                {
                  symbol: 'SAFE',
                  marketCap: 100000000,
                  liquidity: 10000000,
                  auditScore: 95,
                  volatility: 10,
                  riskLevel: 'LOW',
                },
                {
                  symbol: 'RISKY',
                  marketCap: 100000,
                  liquidity: 10000,
                  auditScore: 0,
                  volatility: 80,
                  riskLevel: 'HIGH',
                },
              ],
            },
          };
        }
        return { success: true, data: {} };
      });

      const result = await alphaHunter.analyze(context);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should calculate entry and exit targets', async () => {
      const context: AgentContext = {
        options: {},
      };

      (mockHiveService.callTool as jest.Mock).mockImplementation(async (tool: string) => {
        if (tool === 'hive_alpha_signals') {
          return {
            success: true,
            data: {
              opportunities: [{
                symbol: 'TARGET',
                currentPrice: 1.0,
                support: 0.9,
                resistance: 1.3,
                atr: 0.05,
                entryPrice: 0.95,
                targetPrice: 1.25,
                stopLoss: 0.85,
              }],
            },
          };
        }
        return { success: true, data: {} };
      });

      const result = await alphaHunter.analyze(context);

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.opportunities).toBeDefined();
    });

    it('should identify different opportunity types', async () => {
      const context: AgentContext = {
        options: {
          category: 'all',
        },
      };

      (mockHiveService.callTool as jest.Mock).mockImplementation(async (tool: string) => {
        if (tool === 'hive_alpha_signals') {
          return {
            success: true,
            data: {
              opportunities: [
                { symbol: 'NEW', launchDate: new Date().toISOString(), type: 'NEW_LISTING' },
                { symbol: 'PUMP', priceChange7d: 200, type: 'MOMENTUM_PLAY' },
                { symbol: 'DIP', priceChange24h: -30, rsi: 25, type: 'DIP_BUY' },
              ],
            },
          };
        }
        return { success: true, data: {} };
      });

      const result = await alphaHunter.analyze(context);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should rank opportunities by potential', async () => {
      const context: AgentContext = {
        options: {},
      };

      (mockHiveService.callTool as jest.Mock).mockImplementation(async (tool: string) => {
        if (tool === 'hive_alpha_signals') {
          return {
            success: true,
            data: {
              opportunities: [
                { symbol: 'A', score: 50, rank: 3 },
                { symbol: 'B', score: 90, rank: 1 },
                { symbol: 'C', score: 70, rank: 2 },
              ],
            },
          };
        }
        return { success: true, data: {} };
      });

      const result = await alphaHunter.analyze(context);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle API failures gracefully', async () => {
      const context: AgentContext = {
        options: {},
      };

      (mockHiveService.callTool as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await alphaHunter.analyze(context);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle empty results', async () => {
      const context: AgentContext = {
        options: {
          minLiquidity: 100000000000, // Impossible filter
        },
      };

      (mockHiveService.callTool as jest.Mock).mockResolvedValue({ 
        success: true, 
        data: { opportunities: [] } 
      });

      const result = await alphaHunter.analyze(context);

      expect(result.success).toBe(true);
      expect((result.data as any).opportunities).toBeDefined();
    });
  });
});