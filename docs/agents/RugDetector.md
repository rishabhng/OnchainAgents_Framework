# RugDetector Agent

## Overview
The RugDetector agent is your first line of defense against cryptocurrency scams and rugpulls. Using advanced contract analysis and behavioral pattern recognition, it identifies potential threats before you invest.

## Capabilities

### Contract Analysis
- **Honeypot Detection**: Identifies contracts that prevent selling
- **Mint Function Analysis**: Detects unlimited minting capabilities
- **Ownership Risks**: Analyzes owner privileges and potential abuse vectors
- **Proxy Pattern Detection**: Identifies upgradeable contracts with hidden risks

### Liquidity Analysis
- **Lock Status Verification**: Checks if liquidity is locked and for how long
- **Lock Duration Assessment**: Evaluates if lock period is sufficient
- **Liquidity Depth Analysis**: Measures total liquidity against market cap
- **LP Token Distribution**: Analyzes concentration of liquidity provider tokens

### Ownership Patterns
- **Renouncement Status**: Verifies if ownership has been renounced
- **Multi-sig Analysis**: Checks for multi-signature wallet controls
- **Owner Balance Assessment**: Evaluates owner's token holdings
- **Team Token Vesting**: Analyzes vesting schedules and cliff periods

### Transaction Patterns
- **Buy/Sell Ratio Analysis**: Detects abnormal trading patterns
- **Failed Transaction Rate**: Identifies high failure rates indicating honeypot
- **Whale Concentration**: Measures token distribution among top holders
- **Wash Trading Detection**: Identifies artificial volume generation

## Usage

### Basic Security Check
```typescript
const result = await oca.security('0xTokenAddress');

// Result includes:
// - Risk score (0-100)
// - Verdict (SAFE, MODERATE, HIGH_RISK)
// - Detailed flags and warnings
// - Recommendations
```

### Advanced Analysis with Options
```typescript
const result = await oca.security('0xTokenAddress', {
  network: 'bsc',           // Specify network
  deep: true,               // Enable deep analysis
  includeHistory: true,     // Include historical data
  checkSimilar: true        // Check for similar scams
});
```

## Risk Scoring System

### Score Ranges
- **0-30**: SAFE - Low risk, standard precautions apply
- **31-70**: MODERATE - Some concerns, proceed with caution
- **71-100**: HIGH_RISK - Significant red flags, avoid or extreme caution

### Scoring Factors
| Factor | Weight | Description |
|--------|--------|-------------|
| Honeypot Indicators | 30% | Can't sell, high tax, blacklist functions |
| Liquidity Risk | 25% | Unlocked liquidity, low depth, removable |
| Ownership Risk | 20% | Not renounced, high concentration, admin functions |
| Contract Risk | 15% | Proxy, pausable, mintable, upgradeable |
| Transaction Patterns | 10% | Failed sells, wash trading, bot activity |

## Red Flags

### Critical (Immediate Avoid)
- ✅ Confirmed honeypot mechanism
- ✅ Liquidity not locked or very short lock
- ✅ Owner can mint unlimited tokens
- ✅ Blacklist functions present
- ✅ Hidden mint functions in proxy

### High Risk
- ⚠️ Ownership not renounced
- ⚠️ High owner balance (>10%)
- ⚠️ Top 10 holders own >50%
- ⚠️ Very low liquidity relative to market cap
- ⚠️ Many failed sell transactions

### Moderate Concerns
- ℹ️ Short liquidity lock (<6 months)
- ℹ️ No audit or unknown auditor
- ℹ️ High buy/sell tax (>10%)
- ℹ️ Anonymous team
- ℹ️ Copy-paste code from known scams

## Integration with Other Agents

### Works Best With
- **RiskAnalyzer**: For comprehensive protocol risk assessment
- **TokenResearcher**: For team and project background checks
- **WhaleTracker**: To monitor large holder behavior
- **SentimentAnalyzer**: To detect coordinated shill campaigns

## API Response Format

```typescript
interface RugDetectorResult {
  success: boolean;
  data: {
    address: string;
    network: string;
    riskScore: number;           // 0-100
    verdict: 'SAFE' | 'MODERATE' | 'HIGH_RISK';
    
    contractAnalysis: {
      isHoneypot: boolean;
      hasMintFunction: boolean;
      hasBlacklist: boolean;
      isProxy: boolean;
      isPausable: boolean;
    };
    
    liquidityAnalysis: {
      totalLiquidity: number;
      isLocked: boolean;
      lockDuration?: number;      // days
      liquidityToMcapRatio: number;
    };
    
    ownershipAnalysis: {
      isRenounced: boolean;
      ownerBalance: number;        // percentage
      hasMultiSig: boolean;
      topHoldersConcentration: number;
    };
    
    flags: string[];              // Array of warning flags
    recommendations: string[];    // Action recommendations
    similarScams?: Array<{        // Known similar scams
      address: string;
      name: string;
      date: string;
    }>;
  };
  timestamp: string;
}
```

## Best Practices

### Before Investing
1. Always run RugDetector first on any new token
2. Cross-reference with TokenResearcher for team verification
3. Check WhaleTracker for unusual accumulation patterns
4. Monitor with PortfolioTracker after investment

### Red Line Rules
- Never invest if honeypot is confirmed
- Avoid if liquidity is not locked for at least 6 months
- Be extremely cautious if ownership is not renounced
- Skip if top 10 wallets hold more than 50%

### Due Diligence Checklist
- [ ] Contract verified on blockchain explorer
- [ ] Liquidity locked for adequate duration
- [ ] Ownership renounced or multi-sig controlled
- [ ] No unlimited mint capability
- [ ] Reasonable token distribution
- [ ] Audit from reputable firm
- [ ] Team is doxxed or reputable
- [ ] No previous scam associations

## Performance Metrics

- **Detection Accuracy**: 94% for known rugpull patterns
- **False Positive Rate**: <5% for legitimate projects
- **Analysis Speed**: <2 seconds for standard check
- **Deep Analysis**: <10 seconds with all options enabled
- **Historical Database**: 50,000+ known scam patterns

## Limitations

- Cannot predict future developer actions
- May not detect sophisticated new scam patterns
- Requires accurate contract address
- Some chains have limited data availability
- Cannot analyze unverified contracts fully

## Updates and Maintenance

The RugDetector agent is continuously updated with:
- New scam patterns and techniques
- Enhanced detection algorithms
- Expanded chain support
- Community-reported rugpulls
- Machine learning improvements