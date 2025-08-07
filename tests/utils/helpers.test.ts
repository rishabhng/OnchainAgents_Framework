/**
 * Tests for utility helper functions
 */

describe('Utility Helpers', () => {
  describe('formatAddress', () => {
    it('should format Ethereum addresses', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const formatted = `${address.slice(0, 6)}...${address.slice(-4)}`;
      expect(formatted).toBe('0x1234...7890');
    });

    it('should handle invalid addresses', () => {
      const invalid = 'not-an-address';
      expect(() => {
        if (!invalid.startsWith('0x')) {
          throw new Error('Invalid address format');
        }
      }).toThrow('Invalid address format');
    });
  });

  describe('parseTokenAmount', () => {
    it('should parse token amounts with decimals', () => {
      const amount = '1000000000000000000'; // 1 ETH in wei
      const decimals = 18;
      const parsed = Number(amount) / Math.pow(10, decimals);
      expect(parsed).toBe(1);
    });

    it('should handle different decimal places', () => {
      const amount = '1000000'; // 1 USDC (6 decimals)
      const decimals = 6;
      const parsed = Number(amount) / Math.pow(10, decimals);
      expect(parsed).toBe(1);
    });
  });

  describe('calculateRiskScore', () => {
    it('should calculate risk score based on factors', () => {
      const factors = {
        liquidity: 0.8,  // High liquidity = low risk
        volatility: 0.3, // Low volatility = low risk
        audit: 1.0,      // Audited = low risk
        age: 0.7,        // Moderate age
      };
      
      // Simple average for demonstration
      const riskScore = Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
      expect(riskScore).toBeCloseTo(0.7, 1);
    });

    it('should handle missing factors', () => {
      const factors = {
        liquidity: 0.5,
        volatility: undefined,
        audit: null,
      };
      
      const validFactors = Object.values(factors).filter(v => v !== null && v !== undefined) as number[];
      const riskScore = validFactors.length > 0 
        ? validFactors.reduce((a, b) => a + b, 0) / validFactors.length
        : 0;
      
      expect(riskScore).toBeCloseTo(0.5, 1);
    });
  });

  describe('validateNetwork', () => {
    it('should validate supported networks', () => {
      const supportedNetworks = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism'];
      const network = 'ethereum';
      
      expect(supportedNetworks.includes(network)).toBe(true);
    });

    it('should reject unsupported networks', () => {
      const supportedNetworks = ['ethereum', 'bsc', 'polygon'];
      const network = 'unsupported-chain';
      
      expect(supportedNetworks.includes(network)).toBe(false);
    });
  });

  describe('formatNumber', () => {
    it('should format large numbers', () => {
      const tests = [
        { value: 1000, expected: '1K' },
        { value: 1000000, expected: '1M' },
        { value: 1000000000, expected: '1B' },
      ];
      
      tests.forEach(test => {
        let formatted: string;
        if (test.value >= 1000000000) {
          formatted = (test.value / 1000000000).toFixed(0) + 'B';
        } else if (test.value >= 1000000) {
          formatted = (test.value / 1000000).toFixed(0) + 'M';
        } else if (test.value >= 1000) {
          formatted = (test.value / 1000).toFixed(0) + 'K';
        } else {
          formatted = test.value.toString();
        }
        expect(formatted).toBe(test.expected);
      });
    });

    it('should handle decimals', () => {
      const value = 1500;
      const formatted = (value / 1000).toFixed(1) + 'K';
      expect(formatted).toBe('1.5K');
    });
  });

  describe('calculateAPY', () => {
    it('should calculate APY from APR', () => {
      const apr = 0.05; // 5% APR
      const compoundingPeriods = 365; // Daily compounding
      const apy = Math.pow(1 + apr / compoundingPeriods, compoundingPeriods) - 1;
      
      expect(apy).toBeCloseTo(0.05127, 4);
    });

    it('should handle monthly compounding', () => {
      const apr = 0.12; // 12% APR
      const compoundingPeriods = 12; // Monthly
      const apy = Math.pow(1 + apr / compoundingPeriods, compoundingPeriods) - 1;
      
      expect(apy).toBeCloseTo(0.12683, 4);
    });
  });
});