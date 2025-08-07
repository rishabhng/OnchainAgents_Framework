# 🤖 onchainagents.fun

<div align="center">
  
  [![npm version](https://img.shields.io/npm/v/@onchainagents/core.svg)](https://www.npmjs.com/package/@onchainagents/core)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Build Status](https://github.com/onchainagents/onchainagents.fun/workflows/CI/badge.svg)](https://github.com/onchainagents/onchainagents.fun/actions)
  [![codecov](https://codecov.io/gh/onchainagents/onchainagents.fun/branch/main/graph/badge.svg)](https://codecov.io/gh/onchainagents/onchainagents.fun)
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
  [![npm downloads](https://img.shields.io/npm/dm/@onchainagents/core.svg)](https://www.npmjs.com/package/@onchainagents/core)
  [![GitHub stars](https://img.shields.io/github/stars/onchainagents/onchainagents.fun?style=social)](https://github.com/onchainagents/onchainagents.fun)
  
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/onchainagents/onchainagents.fun/pulls)
  [![Discord](https://img.shields.io/discord/1234567890?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/onchainagents)
  [![Twitter Follow](https://img.shields.io/twitter/follow/onchainagents?style=social)](https://twitter.com/onchainagents)
  
  **imagine having 16 crypto experts working for you 24/7... for free**
  
  [🌐 Website](https://onchainagents.fun) • [📖 Docs](https://docs.onchainagents.fun) • [💬 Discord](https://discord.gg/onchainagents) • [🐦 Twitter](https://twitter.com/onchainagents)

</div>

---

## 🎉 v2.0 - Advanced Crypto Intelligence Platform

**OnChainAgents** is a comprehensive crypto intelligence framework featuring 16 specialized AI agents that provide real-time market analysis, security audits, and DeFi insights powered by Hive Intelligence.

### Core Features:
- ✅ **16 Specialized Agents**: Expert crypto analysis across all domains
- ✅ **11 Core Commands**: Streamlined crypto operations
- ✅ **Advanced Orchestration**: Multi-stage execution with intelligent routing
- ✅ **Real-time Data**: Powered by Hive Intelligence API
- ✅ **Security First**: Built-in risk analysis and rug detection
- ✅ **MCP Integration**: Connect with your preferred AI tools
- ✅ **Quality Gates**: 8-step validation for all operations
- ✅ **Token Optimization**: Efficient resource management

## 🏗️ Architecture

OnChainAgents implements a modular, extensible architecture:

```
MCP Server → Orchestrator → Agent Selection → Hive Intelligence
                   ↓                              ↓
            Wave Engine → Multi-Agent         Real-time Data
                   ↓         Coordination          ↓
            Quality Gates → Validated Results → Response
```

### System Components:
- **Intelligent Orchestrator**: Automatic agent selection based on query type
- **Resource Management**: Efficient handling of API calls and caching
- **Wave Engine**: Complex multi-step operations with checkpoints
- **16 Specialized Agents**: Domain experts for every crypto use case
- **Multi-Source Data**: Hive Intelligence with fallback providers
- **Quality Validation**: Comprehensive result verification

## ⚡ Quick Start

### Installation

```bash
# Install from npm
npm install @onchainagents/core

# Or clone and build locally
git clone https://github.com/onchainagents/onchainagents.fun
cd onchainagents.fun
npm install
npm run build

# Test MCP connection (optional)
npm run test:hive-mcp
```

### Basic Usage

```typescript
import { OnChainAgents } from '@onchainagents/core';

const oca = new OnChainAgents({
  hiveApiKey: 'your-api-key', // Optional - get from https://t.me/hiveintelligence
  hiveMcpUrl: 'https://hiveintelligence.xyz/mcp' // Default endpoint
});

// Analyze a token
const analysis = await oca.analyze('ethereum', '0x...');

// Check for rugs
const security = await oca.security('0x...');

// Find alpha opportunities
const alpha = await oca.alpha('ethereum');
```

## 🤖 Claude Code Integration

### Quick Setup (2 minutes)

```bash
# Install globally
npm install -g @onchainagents/core

# Configure Claude Code
npx @onchainagents/core setup-claude

# Test it works - in Claude Code, try:
# "Use oca_analyze to check ethereum USDC"
```

**That's it!** OnChainAgents is now available in Claude Code. 

📚 **Full Setup Guide**: [CLAUDE_CODE_SETUP.md](./CLAUDE_CODE_SETUP.md)

### Available in Claude Code

Once configured, you can use these tools directly in Claude Code:
- `oca_analyze` - Comprehensive token analysis
- `oca_security` - Security and rug detection
- `oca_hunt` - Find alpha opportunities
- `oca_track` - Track whale wallets
- `oca_sentiment` - Social sentiment analysis
- [View all 10 tools](./.claude/tools.md)

### Example Claude Code Prompts

```
"Use oca_analyze to analyze Ethereum USDC and tell me if it's safe"
"Find alpha opportunities on BSC using oca_hunt"
"Check if 0x... is a rug pull with oca_security"
```

[See more examples](./.claude/prompts.md)

## 🖥️ Claude Desktop & Other MCP Clients

### For Claude Desktop:
1. Go to Settings → Manage Connectors
2. Click "Add Connector"
3. Enter URL: `https://hiveintelligence.xyz/mcp`

### Run OnChainAgents as MCP Server:

```bash
# Start the MCP server
npm run mcp

# Server runs on http://localhost:3000/mcp
```

Configure your AI tool to connect to:
```json
{
  "mcpServers": {
    "onchainagents": {
      "command": "npx",
      "args": ["@onchainagents/core", "oca-mcp"],
      "env": {
        "HIVE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## 📚 Available Agents

### Security & Risk
- **🛡️ RugDetector**: Advanced rugpull and honeypot detection
- **⚠️ RiskAnalyzer**: Comprehensive risk assessment
- **🔍 WhaleTracker**: Monitor large wallet movements

### Market Intelligence  
- **🎯 AlphaHunter**: Early opportunity detection
- **📊 MarketMaker**: Liquidity and spread analysis
- **💭 SentimentAnalyzer**: Social sentiment aggregation
- **📈 MarketStructureAnalyst**: Market microstructure analysis

### DeFi & Research
- **🔬 TokenResearcher**: Deep token analysis
- **💰 YieldOptimizer**: Yield farming optimization
- **📋 PortfolioTracker**: Multi-chain portfolio management
- **🏦 DeFiAnalyzer**: Protocol analysis and TVL tracking

### Specialized Analysis
- **🎨 NFTValuator**: NFT pricing and rarity
- **🗳️ GovernanceAdvisor**: DAO proposal analysis
- **🔗 CrossChainNavigator**: Bridge and cross-chain routing
- **📐 CryptoQuant**: On-chain metrics and quant analysis
- **🔎 ChainAnalyst**: Blockchain forensics and tracing

## 💪 Commands

### Core Commands
```bash
# Market Analysis
oca whale <address>        # Track whale movements
oca alpha <network>        # Find alpha opportunities
oca sentiment <token>      # Analyze market sentiment

# Security
oca audit <address>        # Security audit
oca risk <token>           # Risk assessment

# DeFi Operations
oca yield <network>        # Find best yields
oca trace <txHash>         # Transaction analysis

# Advanced Analysis
oca quant <token>          # Quantitative metrics
oca mm <pair>              # Market maker analysis
oca governance <protocol>  # Governance insights
oca nft <collection>       # NFT analytics
```

### Command Flags
```bash
--network <chain>     # Specify blockchain
--detailed           # Verbose output
--json              # JSON format
--cache             # Use cached data
--parallel          # Parallel execution
--validate          # Extra validation
```

## 🎯 Example Workflows

### Token Security Check
```typescript
// Comprehensive security analysis
const security = await oca.analyze('ethereum', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', {
  flags: ['--detailed', '--validate']
});

if (security.riskScore > 70) {
  console.warn('High risk token detected!');
}
```

### DeFi Yield Optimization
```typescript
// Find best yield opportunities
const yields = await oca.yield('ethereum', {
  minTvl: 1000000,
  minApy: 10,
  protocols: ['aave', 'compound', 'curve']
});
```

### Whale Monitoring
```typescript
// Track whale activities
const whales = await oca.whale('0x...', {
  timeframe: '24h',
  minValue: 1000000
});
```

## 📊 Performance

- **Response Time**: <500ms for cached queries
- **API Efficiency**: Intelligent caching and batching
- **Concurrency**: Handles 100+ simultaneous requests
- **Uptime**: 99.9% availability target
- **Rate Limiting**: Built-in protection

## 🔧 Configuration

Create a `.env` file:
```env
# Hive Intelligence MCP
HIVE_MCP_URL=https://hiveintelligence.xyz/mcp
HIVE_API_KEY=your-hive-api-key  # Optional - get from https://t.me/hiveintelligence

# Optional Settings
HIVE_FALLBACK_MODE=false  # Use simulated data for testing
NODE_ENV=production
PORT=3000
CACHE_TTL=3600
MAX_RETRIES=3
CIRCUIT_BREAKER_THRESHOLD=5
```

## 🧪 Testing

```bash
# Run tests
npm test

# With coverage
npm run test:coverage

# Test specific agent
npm test -- --testNamePattern="RugDetector"
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## 📚 Documentation

- [Full Documentation](https://docs.onchainagents.fun)
- [API Reference](https://docs.onchainagents.fun/api)
- [Agent Guides](./docs/agents/)
- [MCP Setup](./docs/MCP_SETUP_GUIDE.md)

## 🛠️ Tech Stack

- **Language**: TypeScript 5.3+
- **Runtime**: Node.js 18+
- **Testing**: Jest
- **API**: Hive Intelligence
- **Protocols**: MCP (Model Context Protocol)
- **Architecture**: Event-driven, modular

## 📜 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- [Hive Intelligence](https://hiveintelligence.xyz) - Real-time crypto data
- [MCP Protocol](https://modelcontextprotocol.io) - AI tool integration
- Open source community

## 🔗 Links

- **Website**: [onchainagents.fun](https://onchainagents.fun)
- **Documentation**: [docs.onchainagents.fun](https://docs.onchainagents.fun)
- **GitHub**: [github.com/onchainagents](https://github.com/onchainagents)
- **Discord**: [discord.gg/onchainagents](https://discord.gg/onchainagents)
- **Twitter**: [@onchainagents](https://twitter.com/onchainagents)

---

<div align="center">
  <b>Built with ❤️ for the crypto community</b>
  <br>
  <sub>Free • Open Source • Community Driven</sub>
</div>