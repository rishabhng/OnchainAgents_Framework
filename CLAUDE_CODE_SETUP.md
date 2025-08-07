# 🤖 Claude Code Integration Guide for OnChainAgents

Welcome! This guide will help you integrate OnChainAgents with Claude Code for powerful crypto intelligence directly in your AI-powered development workflow.

## 🚀 Quick Start (2 Minutes)

### Option 1: NPM Package (Recommended)
```bash
# Install globally
npm install -g @onchainagents/core

# Configure Claude Code
claude mcp add onchainagents

# Test it works
# In Claude Code, try: "Use oca_analyze to check ethereum USDC"
```

### Option 2: GitHub Repository
```bash
# Clone the repository
git clone https://github.com/onchainagents/onchainagents.fun
cd onchainagents.fun

# Install dependencies
npm install

# Build the project
npm run build

# Link for global access
npm link

# Configure Claude Code
claude mcp add onchainagents
```

## 📋 Prerequisites

- **Claude Code CLI**: Install from [Anthropic](https://claude.ai/code)
- **Node.js 18+**: Required for running the MCP server
- **API Key** (Optional): Get from [Hive Intelligence](https://t.me/hiveintelligence) for production use

## 🔧 Detailed Setup

### Step 1: Install OnChainAgents

#### Using NPM (Simple)
```bash
npm install -g @onchainagents/core
```

#### Using GitHub (Development)
```bash
# Clone repository
git clone https://github.com/onchainagents/onchainagents.fun
cd onchainagents.fun

# Install and build
npm install
npm run build

# Make available globally
npm link
```

### Step 2: Configure Claude Code

#### Automatic Configuration
```bash
# Run our setup script
./setup-claude.sh

# Or use npx
npx @onchainagents/core setup-claude
```

#### Manual Configuration
Add to your Claude Code configuration:

```json
{
  "mcpServers": {
    "onchainagents": {
      "command": "npx",
      "args": ["@onchainagents/core", "oca-mcp"],
      "env": {
        "HIVE_FALLBACK_MODE": "true"
      }
    }
  }
}
```

Configuration file location:
- **macOS/Linux**: `~/.config/claude/claude_code_config.json`
- **Windows**: `%APPDATA%\claude\claude_code_config.json`

### Step 3: Verify Installation

In Claude Code, test with:
```
Use oca_analyze to analyze ethereum 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
```

You should receive a comprehensive USDC token analysis.

## 💬 Usage Examples

### Basic Token Analysis
```
Analyze the ethereum token 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
```

### Security Check
```
Use oca_security to check if 0x... is a rug pull
```

### Find Alpha Opportunities
```
Use oca_hunt to find alpha opportunities on ethereum
```

### Track Whale Activity
```
Use oca_track to monitor whale wallet 0x...
```

### DeFi Research
```
Use oca_defi to analyze Aave protocol on ethereum
```

## 🛠️ Available Tools

| Tool | Purpose | Example |
|------|---------|---------|
| `oca_analyze` | Comprehensive token analysis | "Analyze PEPE token" |
| `oca_security` | Rug pull & security detection | "Check if this is safe: 0x..." |
| `oca_hunt` | Find alpha opportunities | "Find new gems on BSC" |
| `oca_track` | Whale wallet tracking | "Track vitalik.eth movements" |
| `oca_sentiment` | Social sentiment analysis | "What's the sentiment on SHIB?" |
| `oca_research` | Deep token research | "Research Uniswap tokenomics" |
| `oca_defi` | DeFi protocol analysis | "Analyze Compound yields" |
| `oca_bridge` | Cross-chain routing | "Best bridge from ETH to Polygon" |
| `oca_portfolio` | Portfolio analysis | "Analyze portfolio 0x..." |
| `oca_market` | Market structure analysis | "Analyze ETH/USDC liquidity" |

## 🎯 Common Workflows

### 1. Pre-Investment Research
```
1. Use oca_analyze to analyze [token address]
2. Use oca_security to check for red flags
3. Use oca_sentiment to gauge market sentiment
4. Use oca_track to see whale activity
```

### 2. DeFi Yield Hunting
```
1. Use oca_defi to find best yields on ethereum
2. Use oca_analyze on the protocol token
3. Use oca_bridge to optimize cross-chain moves
```

### 3. Portfolio Management
```
1. Use oca_portfolio to analyze my wallet [address]
2. Use oca_market to check liquidity depth
3. Use oca_hunt to find rebalancing opportunities
```

## ⚙️ Configuration Options

### Environment Variables
Create a `.env` file in your project:

```env
# API Configuration
HIVE_API_KEY=your-api-key-here        # Get from https://t.me/hiveintelligence
HIVE_FALLBACK_MODE=false              # Use real data (requires API key)

# Performance
CACHE_TTL=3600                         # Cache duration in seconds
MAX_RETRIES=3                          # API retry attempts

# Advanced
NODE_ENV=production                    # Environment mode
PORT=3000                              # MCP server port
LOG_LEVEL=info                         # Logging verbosity
```

### Claude Code Settings
Customize behavior in Claude Code:

```json
{
  "mcpServers": {
    "onchainagents": {
      "command": "npx",
      "args": ["@onchainagents/core", "oca-mcp"],
      "env": {
        "HIVE_API_KEY": "your-api-key",
        "HIVE_FALLBACK_MODE": "false",
        "CACHE_TTL": "1800",
        "LOG_LEVEL": "warn"
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Tools Not Appearing in Claude Code
1. Restart Claude Code after configuration
2. Check configuration file syntax
3. Verify npm package is installed globally
4. Run `claude mcp list` to verify registration

### Connection Errors
```bash
# Test MCP server directly
npx @onchainagents/core oca-mcp test

# Check logs
claude mcp logs onchainagents
```

### API Rate Limits
- Enable `HIVE_FALLBACK_MODE=true` for testing
- Get API key from [Hive Intelligence](https://t.me/hiveintelligence)
- Implement caching with appropriate `CACHE_TTL`

### Permission Issues
```bash
# Fix npm permissions
sudo npm install -g @onchainagents/core

# Or use npm prefix
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

## 🔄 Updating

### Update NPM Package
```bash
npm update -g @onchainagents/core
```

### Update from GitHub
```bash
cd onchainagents.fun
git pull
npm install
npm run build
```

## 🎓 Advanced Usage

### Custom Agent Workflows
Create complex multi-agent workflows:

```javascript
// In Claude Code, ask:
"Create a comprehensive analysis workflow that:
1. Analyzes top 10 tokens by volume
2. Checks each for security issues
3. Identifies arbitrage opportunities
4. Generates investment report"
```

### Batch Operations
Process multiple tokens efficiently:

```javascript
// Ask Claude Code:
"Analyze these tokens and rank by safety:
- 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
- 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
- 0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE"
```

### Integration with Development
```javascript
// Use in your code generation:
"Generate a React component that:
1. Uses oca_analyze to fetch token data
2. Displays security score from oca_security
3. Shows real-time sentiment from oca_sentiment"
```

## 📚 Resources

- **Documentation**: [docs.onchainagents.fun](https://docs.onchainagents.fun)
- **GitHub**: [github.com/onchainagents](https://github.com/onchainagents/onchainagents.fun)
- **Discord**: [discord.gg/onchainagents](https://discord.gg/onchainagents)
- **API Access**: [t.me/hiveintelligence](https://t.me/hiveintelligence)

## 🤝 Getting Help

### Community Support
- Discord: [discord.gg/onchainagents](https://discord.gg/onchainagents)
- GitHub Issues: [Report bugs or request features](https://github.com/onchainagents/onchainagents.fun/issues)

### Direct Support
- Telegram: [@onchainagents](https://t.me/onchainagents)
- Email: support@onchainagents.fun

## 🎉 You're Ready!

Start using OnChainAgents in Claude Code:
```
"Hey Claude, use oca_analyze to find the best performing tokens on ethereum today"
```

---

**Pro Tip**: Star the [GitHub repo](https://github.com/onchainagents/onchainagents.fun) to stay updated with new features! 🌟