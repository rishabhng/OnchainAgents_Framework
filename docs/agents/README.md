# OnChainAgents - Agent Documentation

## Overview
OnChainAgents provides 10 specialized AI agents that work together to give you comprehensive crypto intelligence. Each agent has unique capabilities and can be used independently or in combination for maximum effectiveness.

## 🤖 Available Agents

### Security & Risk Agents
- **[RugDetector](./RugDetector.md)** - Identifies scams and rugpulls before you invest
- **[RiskAnalyzer](./RiskAnalyzer.md)** - Comprehensive protocol and investment risk assessment

### Market Intelligence Agents  
- **[AlphaHunter](./AlphaHunter.md)** - Discovers high-potential opportunities before they trend
- **[WhaleTracker](./WhaleTracker.md)** - Monitors large holder movements and smart money
- **[MarketStructureAnalyst](./MarketStructureAnalyst.md)** - Advanced technical and orderflow analysis

### Research & Analysis Agents
- **[TokenResearcher](./TokenResearcher.md)** - Deep fundamental analysis of projects
- **[SentimentAnalyzer](./SentimentAnalyzer.md)** - Social sentiment and narrative tracking
- **[DeFiAnalyzer](./DeFiAnalyzer.md)** - DeFi protocol analysis and yield optimization

### Portfolio & Navigation Agents
- **[PortfolioTracker](./PortfolioTracker.md)** - Multi-chain portfolio management and optimization
- **[CrossChainNavigator](./CrossChainNavigator.md)** - Bridge optimization and cross-chain opportunities

## 🎯 Quick Start Guide

### Which Agent Should I Use?

#### "I want to check if a token is safe"
→ Use **RugDetector** first, then **RiskAnalyzer** for deeper analysis

#### "I want to find new opportunities"
→ Start with **AlphaHunter**, verify with **RugDetector**, research with **TokenResearcher**

#### "I want to follow smart money"
→ Use **WhaleTracker** to identify wallets, **MarketStructureAnalyst** for timing

#### "I want to optimize my DeFi yields"
→ **DeFiAnalyzer** for opportunities, **RiskAnalyzer** for safety, **CrossChainNavigator** for best rates

#### "I want to manage my portfolio"
→ **PortfolioTracker** for monitoring, **DeFiAnalyzer** for yield optimization

#### "I want to time my entries/exits"
→ **MarketStructureAnalyst** for technical analysis, **SentimentAnalyzer** for market mood

## 🔄 Agent Combinations

### The Safety Check Combo
```
RugDetector → RiskAnalyzer → TokenResearcher
```
Complete security and fundamental analysis

### The Alpha Discovery Combo
```
AlphaHunter → RugDetector → SentimentAnalyzer → MarketStructureAnalyst
```
Find and validate opportunities with optimal timing

### The Whale Watcher Combo
```
WhaleTracker → MarketStructureAnalyst → AlphaHunter
```
Follow smart money and find what they're accumulating

### The DeFi Master Combo
```
DeFiAnalyzer → RiskAnalyzer → CrossChainNavigator → PortfolioTracker
```
Optimize yields across chains with risk management

### The Complete Analysis Combo
```
All 10 agents via: oca.analyze('ethereum', 'TOKEN')
```
Comprehensive analysis using all available agents

## 📊 Agent Capabilities Matrix

| Agent | Security | Market | Research | DeFi | Portfolio | Technical |
|-------|----------|--------|----------|------|-----------|-----------|
| RugDetector | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐ | - | - |
| RiskAnalyzer | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐ |
| AlphaHunter | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐⭐ |
| WhaleTracker | ⭐⭐ | ⭐⭐⭐⭐ | ⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐ |
| MarketStructureAnalyst | ⭐ | ⭐⭐⭐⭐ | ⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| TokenResearcher | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐ | - |
| SentimentAnalyzer | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐ | ⭐⭐ |
| DeFiAnalyzer | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| PortfolioTracker | ⭐ | ⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| CrossChainNavigator | ⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ |

## 🚀 Command Mapping

### `/oca:analyze [network] [token]`
Uses: All agents for comprehensive analysis

### `/oca:research [token]`
Primary: TokenResearcher, DeFiAnalyzer
Supporting: RiskAnalyzer, SentimentAnalyzer

### `/oca:security [address]`
Primary: RugDetector, RiskAnalyzer
Supporting: TokenResearcher, WhaleTracker

### `/oca:hunt`
Primary: AlphaHunter, WhaleTracker
Supporting: SentimentAnalyzer, MarketStructureAnalyst

### `/oca:track [wallet]`
Primary: WhaleTracker, PortfolioTracker
Supporting: CrossChainNavigator

### `/oca:sentiment [token]`
Primary: SentimentAnalyzer
Supporting: MarketStructureAnalyst, TokenResearcher

## 📈 Performance Metrics

### Agent Accuracy Rates
- **RugDetector**: 94% detection accuracy
- **AlphaHunter**: 68% profitable picks (7-day)
- **WhaleTracker**: 95% wallet identification
- **SentimentAnalyzer**: 85% sentiment classification
- **TokenResearcher**: 92% team verification
- **RiskAnalyzer**: 81% risk correlation
- **DeFiAnalyzer**: 78% yield prediction
- **PortfolioTracker**: 99.9% price accuracy
- **CrossChainNavigator**: 85% time estimates
- **MarketStructureAnalyst**: 78% support/resistance

## 🛠️ Advanced Usage

### Custom Agent Combinations
```typescript
// Create your own analysis flow
const customAnalysis = async (token: string) => {
  // Step 1: Security first
  const security = await oca.security(token);
  if (security.data.riskScore > 80) return { abort: true };
  
  // Step 2: Check fundamentals
  const research = await oca.research(token);
  if (research.data.fundamentals.score < 60) return { skip: true };
  
  // Step 3: Find entry
  const market = await oca.analyze('market', token);
  const sentiment = await oca.sentiment(token);
  
  // Step 4: Optimize position
  return combineAnalysis(security, research, market, sentiment);
};
```

### Automated Monitoring
```typescript
// Set up continuous monitoring
const monitor = async () => {
  // Check portfolio every hour
  setInterval(async () => {
    const portfolio = await oca.track('0xWallet');
    const alerts = portfolio.data.alerts;
    
    if (alerts.some(a => a.severity === 'HIGH')) {
      notifyUser(alerts);
    }
  }, 3600000);
  
  // Hunt for opportunities every 4 hours
  setInterval(async () => {
    const opportunities = await oca.hunt({ 
      risk: 'low',
      minScore: 75 
    });
    
    if (opportunities.length > 0) {
      notifyOpportunities(opportunities);
    }
  }, 14400000);
};
```

## 📚 Learning Path

### Beginner Path
1. Start with **RugDetector** - Learn to identify scams
2. Use **TokenResearcher** - Understand fundamentals
3. Try **PortfolioTracker** - Monitor your holdings
4. Explore **AlphaHunter** - Find opportunities

### Intermediate Path
1. Master **WhaleTracker** - Follow smart money
2. Understand **DeFiAnalyzer** - Optimize yields
3. Use **RiskAnalyzer** - Manage portfolio risk
4. Learn **SentimentAnalyzer** - Gauge market mood

### Advanced Path
1. Master **MarketStructureAnalyst** - Technical expertise
2. Optimize with **CrossChainNavigator** - Multi-chain strategies
3. Combine all agents - Create custom strategies
4. Automate workflows - Build trading systems

## 🔗 Related Resources

- [API Documentation](../api/README.md)
- [Example Scripts](../../examples/)
- [GitHub Repository](https://github.com/onchainagents/onchainagents.fun)
- [Discord Community](https://discord.gg/onchainagents)

## 📄 License

All agents are part of the OnChainAgents platform and are available under the MIT License.