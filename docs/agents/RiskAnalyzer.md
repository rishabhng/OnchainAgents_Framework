# RiskAnalyzer Agent

## Overview
The RiskAnalyzer agent provides comprehensive risk assessment for DeFi protocols, smart contracts, and investment strategies. It evaluates technical, financial, and systemic risks to help you make informed decisions and protect your capital.

## Capabilities

### Protocol Risk Assessment
- **Smart Contract Risks**: Code quality, complexity, upgrade risks
- **Economic Risks**: Tokenomics, incentive alignment, sustainability
- **Governance Risks**: Centralization, admin keys, voting power
- **Oracle Risks**: Price feed reliability, manipulation potential
- **Composability Risks**: Integration dependencies, cascade failures

### Financial Risk Analysis
- **Liquidity Risk**: Depth, slippage, exit availability
- **Volatility Risk**: Price stability, correlation analysis
- **Counterparty Risk**: Protocol solvency, insurance coverage
- **Market Risk**: Systematic and unsystematic risks
- **Impermanent Loss**: LP position risk calculation

### Security Evaluation
- **Audit Coverage**: Number and quality of audits
- **Bug Bounty**: Program size and responsiveness
- **Incident History**: Past exploits and responses
- **Attack Vectors**: Known and potential vulnerabilities
- **Insurance Options**: Coverage availability and cost

## Usage

### Basic Risk Assessment
```typescript
const risk = await oca.analyze('ethereum', 'AAVE', {
  focus: 'risk'
});

// Returns comprehensive risk analysis
```

### Protocol Risk Analysis
```typescript
const protocolRisk = await oca.security('0xProtocolAddress', {
  type: 'protocol',
  depth: 'comprehensive',
  includeSimulation: true     // Simulate attack scenarios
});
```

### Portfolio Risk Assessment
```typescript
const portfolioRisk = await oca.analyze('portfolio', '0xWalletAddress', {
  riskMetrics: ['var', 'cvar', 'sharpe', 'correlation'],
  stressTest: true
});
```

## Risk Scoring Framework

### Overall Risk Score
| Score | Risk Level | Description | Recommended Action |
|-------|------------|-------------|-------------------|
| 0-20 | Very Low | Minimal risk, well-established | Full allocation possible |
| 21-40 | Low | Acceptable risk, proven track record | Standard allocation |
| 41-60 | Medium | Moderate risk, some concerns | Reduced allocation |
| 61-80 | High | Significant risk, caution advised | Small allocation only |
| 81-100 | Critical | Extreme risk, avoid | Do not invest |

### Risk Categories
| Category | Weight | Key Factors |
|----------|--------|-------------|
| Smart Contract | 30% | Complexity, audits, upgrades |
| Economic | 25% | Sustainability, token model |
| Liquidity | 20% | Exit options, market depth |
| Operational | 15% | Team, governance, admin keys |
| Market | 10% | Volatility, correlation, beta |

## API Response Format

```typescript
interface RiskAnalyzerResult {
  success: boolean;
  data: {
    protocol: string;
    network: string;
    
    riskScore: {
      overall: number;              // 0-100
      level: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
    };
    
    breakdown: {
      smartContract: {
        score: number;
        
        factors: {
          complexity: number;       // Lines of code, dependencies
          timeDeployed: number;     // Months since deployment
          upgradeability: boolean;
          adminKeys: boolean;
          timelocks: boolean;
        };
        
        audits: Array<{
          firm: string;
          date: string;
          severity: {
            critical: number;
            high: number;
            medium: number;
            low: number;
          };
          resolved: boolean;
        }>;
        
        vulnerabilities: Array<{
          type: string;
          severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
          description: string;
          mitigation: string;
        }>;
      };
      
      economic: {
        score: number;
        
        sustainability: {
          revenue: number;
          expenses: number;
          runway: number;           // Months
          tokenInflation: number;
        };
        
        tokenomics: {
          supplyControl: string;
          valueAccrual: string;
          incentiveAlignment: number;
          vestingRisk: number;
        };
        
        dependencies: Array<{
          protocol: string;
          type: string;
          impact: 'HIGH' | 'MEDIUM' | 'LOW';
        }>;
      };
      
      liquidity: {
        score: number;
        
        metrics: {
          tvl: number;
          volume24h: number;
          depthMinus2Percent: number;
          depthPlus2Percent: number;
        };
        
        concentration: {
          top10Percent: number;
          whaleRisk: boolean;
          exitFeasibility: number;
        };
        
        impermanentLoss: {
          current: number;
          projected30d: number;
          historical: number;
        };
      };
      
      operational: {
        score: number;
        
        team: {
          doxxed: boolean;
          experience: number;       // Years
          trackRecord: string[];
        };
        
        governance: {
          type: string;
          votingPower: {
            top10: number;
            quorum: number;
            participation: number;
          };
          proposalSuccess: number;
        };
        
        insurance: {
          available: boolean;
          providers: string[];
          coverage: number;
          premium: number;
        };
      };
      
      market: {
        score: number;
        
        volatility: {
          daily: number;
          weekly: number;
          monthly: number;
          beta: number;
        };
        
        correlation: {
          btc: number;
          eth: number;
          market: number;
        };
        
        liquidity: {
          bidAskSpread: number;
          orderBookDepth: number;
          slippage1k: number;
          slippage10k: number;
          slippage100k: number;
        };
      };
    };
    
    scenarios: {
      bestCase: {
        probability: number;
        return: number;
        description: string;
      };
      baseCase: {
        probability: number;
        return: number;
        description: string;
      };
      worstCase: {
        probability: number;
        loss: number;
        description: string;
      };
    };
    
    recommendations: {
      maxAllocation: number;        // Percentage of portfolio
      riskMitigation: string[];
      hedgingStrategies: string[];
      monitoring: string[];
    };
    
    comparisons: Array<{
      protocol: string;
      riskScore: number;
      advantages: string[];
      disadvantages: string[];
    }>;
  };
  timestamp: string;
}
```

## Risk Assessment Strategies

### Conservative Approach
```typescript
const conservative = await oca.analyze('protocol', 'AAVE', {
  riskTolerance: 'low',
  requirements: {
    minAudits: 3,
    maxComplexity: 'medium',
    requireInsurance: true,
    minTVL: 1000000000
  }
});
```

### Balanced Approach
```typescript
const balanced = await oca.analyze('protocol', 'UNI', {
  riskTolerance: 'medium',
  acceptableRisks: ['IL', 'volatility'],
  unacceptableRisks: ['rugpull', 'exploit']
});
```

### Aggressive Approach
```typescript
const aggressive = await oca.analyze('protocol', 'NewDeFi', {
  riskTolerance: 'high',
  focusOnReward: true,
  acceptBeta: true
});
```

## Risk Mitigation Strategies

### Smart Contract Risk
- Use only audited protocols
- Prefer battle-tested code
- Avoid upgradeable contracts
- Check timelock durations
- Monitor admin key usage

### Economic Risk
- Diversify across protocols
- Understand token mechanics
- Monitor revenue sustainability
- Track inflation rates
- Assess value capture

### Liquidity Risk
- Check exit liquidity before entering
- Use limit orders when possible
- Avoid concentrated positions
- Monitor TVL trends
- Have emergency exit plans

## Integration with Other Agents

### Risk-Aware Portfolio Management
```typescript
// Combine with PortfolioTracker
const portfolio = await oca.track('0xWallet');
const risks = await Promise.all(
  portfolio.positions.map(p => oca.analyze('risk', p.protocol))
);

// Calculate portfolio risk
const portfolioRisk = calculateWeightedRisk(risks, portfolio.weights);
```

### Risk-Adjusted Opportunity Hunting
```typescript
// Combine with AlphaHunter
const opportunities = await oca.hunt();
const withRisk = await Promise.all(
  opportunities.map(async (opp) => ({
    ...opp,
    risk: await oca.analyze('risk', opp.protocol)
  }))
);

// Filter by risk-adjusted returns
const bestRiskReward = withRisk
  .filter(o => o.risk.score < 40)
  .sort((a, b) => b.expectedReturn / b.risk.score - a.expectedReturn / a.risk.score);
```

## Advanced Risk Metrics

### Value at Risk (VaR)
```typescript
const var95 = await oca.analyze('var', {
  confidence: 0.95,
  timeHorizon: '1d',
  method: 'historical'        // or 'montecarlo', 'parametric'
});
```

### Stress Testing
```typescript
const stressTest = await oca.analyze('stress', {
  scenarios: [
    { name: 'Market Crash', btcDrop: -50, ethDrop: -60 },
    { name: 'DeFi Contagion', protocolFailure: 'AAVE' },
    { name: 'Stablecoin Depeg', usdcDepeg: -10 }
  ]
});
```

## Best Practices

### Risk Management Rules
1. Never invest more than you can afford to lose
2. Diversify across protocols and chains
3. Start small with new protocols
4. Monitor risks continuously
5. Have exit strategies ready

### Risk Monitoring
- Daily risk score checks
- Weekly deep risk analysis
- Immediate alerts on score changes >10
- Quarterly strategy review
- Post-incident analysis

### Red Lines
- 🚫 Never use protocols with risk score >80
- 🚫 Avoid unaudited contracts with >$1M TVL
- 🚫 Skip protocols with anonymous teams
- 🚫 Don't ignore critical vulnerabilities
- 🚫 Never concentrate >20% in high-risk protocols

## Performance Metrics

### Risk Prediction Accuracy
- **Exploit Prediction**: 67% identified before incident
- **Economic Failure**: 73% predicted 30 days prior
- **Risk Score Accuracy**: 81% correlation with incidents
- **False Positives**: 12% of high-risk ratings

## Limitations

- Cannot predict black swan events
- New exploits may not be detected
- Dependent on data availability
- Human factor unpredictable
- Market irrationality not captured

## Updates and Improvements

The RiskAnalyzer agent is continuously enhanced with:
- Machine learning risk models
- Expanded vulnerability database
- Real-time monitoring systems
- Community risk reporting
- Cross-chain risk analysis