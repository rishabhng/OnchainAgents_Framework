import { AlphaHunter } from '../../../src/agents/market/AlphaHunter';
import { HiveClient } from '../../../src/mcp/HiveClient';
import { AgentContext } from '../../../src/agents/base/BaseAgent';

jest.mock('../../../src/mcp/HiveClient');

describe('AlphaHunter', () => {
  let alphaHunter: AlphaHunter;
  let mockHiveClient: jest.Mocked<HiveClient>;

  beforeEach(() => {
    mockHiveClient = new HiveClient({ apiKey: 'test-key' }) as jest.Mocked<HiveClient>;
    alphaHunter = new AlphaHunter(mockHiveClient);
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

      mockHiveClient.request.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('/trending')) {
          return {
            data: [
              {
                symbol: 'ALPHA',
                address: '0xalpha123',
                marketCap: 5000000,
                volume24h: 2000000,
                priceChange24h: 25,
                socialMentions: 1500,
                uniqueWallets: 5000,
              },
              {
                symbol: 'BETA',
                address: '0xbeta456',
                marketCap: 8000000,
                volume24h: 500000,
                priceChange24h: 10,
                socialMentions: 500,
                uniqueWallets: 2000,
              },
            ],
          };
        }
        if (endpoint.includes('/social')) {
          return {
            data: {
              growthRate: 150,
              sentiment: 'bullish',
              influencerMentions: 10,
            },
          };
        }
        if (endpoint.includes('/onchain')) {
          return {
            data: {
              whaleAccumulation: true,
              netFlow: 1000000,
              smartMoneyFlow: 'positive',
            },
          };
        }
        return { data: {} };
      });

      const result = await alphaHunter.analyze(context);

      expect(result.success).toBe(true);
      expect(result.data.opportunities).toBeDefined();
      expect(result.data.opportunities.length).toBeGreaterThan(0);
      
      const topOpp = result.data.opportunities[0];
      expect(topOpp.symbol).toBe('ALPHA');
      expect(topOpp.score).toBeGreaterThan(70);
      expect(topOpp.signals).toContain('HIGH_VOLUME');
      expect(topOpp.signals).toContain('SOCIAL_MOMENTUM');
    });

    it('should filter opportunities by risk level', async () => {
      const context: AgentContext = {
        options: {
          risk: 'low',
        },
      };

      mockHiveClient.request.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('/trending')) {
          return {
            data: [
              {
                symbol: 'SAFE',
                marketCap: 100000000,
                liquidity: 10000000,
                auditScore: 95,
                volatility: 10,
              },
              {
                symbol: 'RISKY',
                marketCap: 100000,
                liquidity: 10000,
                auditScore: 0,
                volatility: 80,
              },
            ],
          };
        }
        return { data: {} };
      });

      const result = await alphaHunter.analyze(context);

      expect(result.data.opportunities).toBeDefined();
      const lowRiskOpps = result.data.opportunities.filter(o => o.riskLevel === 'LOW');
      expect(lowRiskOpps.length).toBeGreaterThan(0);
      expect(lowRiskOpps[0].symbol).toBe('SAFE');
    });

    it('should calculate entry and exit targets', async () => {
      const context: AgentContext = {
        options: {},
      };

      mockHiveClient.request.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('/trending')) {
          return {
            data: [{
              symbol: 'TARGET',
              currentPrice: 1.0,
              support: 0.9,
              resistance: 1.3,
              atr: 0.05,
            }],
          };
        }
        if (endpoint.includes('/technicals')) {
          return {
            data: {
              rsi: 45,
              macd: 'bullish',
              trend: 'upward',
            },
          };
        }
        return { data: {} };
      });

      const result = await alphaHunter.analyze(context);

      const opp = result.data.opportunities[0];
      expect(opp.entryPrice).toBeDefined();
      expect(opp.targetPrice).toBeDefined();
      expect(opp.stopLoss).toBeDefined();
      expect(opp.targetPrice).toBeGreaterThan(opp.entryPrice);
      expect(opp.stopLoss).toBeLessThan(opp.entryPrice);
    });

    it('should identify different opportunity types', async () => {
      const context: AgentContext = {
        options: {
          category: 'all',
        },
      };

      mockHiveClient.request.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('/trending')) {
          return {
            data: [
              { symbol: 'NEW', launchDate: new Date().toISOString(), type: 'new_listing' },
              { symbol: 'PUMP', priceChange7d: 200, type: 'momentum' },
              { symbol: 'DIP', priceChange24h: -30, rsi: 25, type: 'oversold' },
            ],
          };
        }
        return { data: {} };
      });

      const result = await alphaHunter.analyze(context);

      const types = result.data.opportunities.map(o => o.type);
      expect(types).toContain('NEW_LISTING');
      expect(types).toContain('MOMENTUM_PLAY');
      expect(types).toContain('DIP_BUY');
    });

    it('should rank opportunities by potential', async () => {
      const context: AgentContext = {
        options: {},
      };

      mockHiveClient.request.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('/trending')) {
          return {
            data: [
              { symbol: 'A', score: 50 },
              { symbol: 'B', score: 90 },
              { symbol: 'C', score: 70 },
            ],
          };
        }
        return { data: {} };
      });

      const result = await alphaHunter.analyze(context);

      const opportunities = result.data.opportunities;
      expect(opportunities[0].rank).toBe(1);
      expect(opportunities[0].symbol).toBe('B');
      expect(opportunities[1].rank).toBe(2);
      expect(opportunities[2].rank).toBe(3);
    });
  });

  describe('signal detection', () => {
    it('should detect volume spikes', async () => {
      const context: AgentContext = {
        options: {},
      };

      mockHiveClient.request.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('/volume')) {
          return {
            data: {
              current: 5000000,
              average7d: 1000000,
              spike: true,
            },
          };
        }
        return { data: [{ symbol: 'SPIKE' }] };
      });

      const result = await alphaHunter.analyze(context);

      expect(result.data.opportunities[0].signals).toContain('VOLUME_SPIKE');
    });

    it('should detect smart money accumulation', async () => {
      const context: AgentContext = {
        options: {},
      };

      mockHiveClient.request.mockImplementation(async (endpoint: string) => {
        if (endpoint.includes('/wallets')) {
          return {
            data: {
              smartMoneyBuys: 50,
              smartMoneySells: 10,
              netAccumulation: 1000000,
            },
          };
        }
        return { data: [{ symbol: 'SMART' }] };
      });

      const result = await alphaHunter.analyze(context);

      expect(result.data.opportunities[0].signals).toContain('SMART_MONEY_ACCUMULATION');
    });
  });

  describe('error handling', () => {
    it('should handle API failures gracefully', async () => {
      const context: AgentContext = {
        options: {},
      };

      mockHiveClient.request.mockRejectedValue(new Error('API Error'));

      const result = await alphaHunter.analyze(context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty results', async () => {
      const context: AgentContext = {
        options: {
          minLiquidity: 100000000000, // Impossible filter
        },
      };

      mockHiveClient.request.mockResolvedValue({ data: [] });

      const result = await alphaHunter.analyze(context);

      expect(result.success).toBe(true);
      expect(result.data.opportunities).toHaveLength(0);
      expect(result.data.message).toContain('No opportunities found');
    });
  });
});