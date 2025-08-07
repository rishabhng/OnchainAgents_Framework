# MCP Setup Guide - OnChainAgents & Hive Intelligence

## Overview

This guide covers setting up OnChainAgents with Claude Code and other MCP-compatible clients. OnChainAgents provides blockchain data and crypto intelligence through the Model Context Protocol (MCP), powered by Hive Intelligence.

## 🚀 Claude Code Setup (Recommended)

### Quick Setup
```bash
# Install OnChainAgents globally
npm install -g @onchainagents/core

# Run automatic setup
npx @onchainagents/core setup-claude

# Test in Claude Code with:
# "Use oca_analyze to check ethereum USDC"
```

**Full Claude Code Guide**: [CLAUDE_CODE_SETUP.md](../CLAUDE_CODE_SETUP.md)

## Important Notes

⚠️ **Claude Desktop vs Claude Code**
- **Claude Code**: Has CLI commands for MCP configuration
- **Claude Desktop**: Must be configured through GUI (no CLI commands)
- Both support the same MCP protocol and tools

## Setup Methods

### Method 1: Claude Desktop (GUI Configuration)

**Steps:**
1. Open Claude Desktop application
2. Navigate to **Settings** → **Manage Connectors**
3. Click **Add Connector**
4. Enter the URL: `https://hiveintelligence.xyz/mcp`
5. Save the configuration
6. The MCP server will now be available in Claude Desktop

**What this enables:**
- Direct access to Hive Intelligence tools within Claude Desktop
- No API key required for basic access
- Tools will appear in Claude's available actions

### Method 2: Claude Code (CLI Configuration)

**Automatic Setup:**
```bash
# Install and configure
npm install -g @onchainagents/core
npx @onchainagents/core setup-claude
```

**Manual Setup:**
```bash
# Edit Claude Code config
nano ~/.config/claude/claude_code_config.json
```

Add the OnChainAgents MCP server configuration (see Method 3 below).

### Method 3: Programmatic Access (Node.js)

For integrating OnChainAgents into your applications:

```typescript
import { HiveMCPRemoteClient } from '@onchainagents/core';

// Create client instance
const client = new HiveMCPRemoteClient({
  mcpServerUrl: 'https://hiveintelligence.xyz/mcp',
  apiKey: process.env.HIVE_API_KEY, // Optional
});

// Call a tool
const result = await client.callTool('hive_token_data', {
  network: 'ethereum',
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
});
```

### Method 4: Manual Configuration File

If you prefer to manually edit configuration files:

**For Claude Code:** `~/.config/claude/claude_code_config.json`
**For Claude Desktop:** `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "hive-intelligence": {
      "command": "npx",
      "args": ["@onchainagents/core", "mcp-server"],
      "env": {
        "HIVE_MCP_URL": "https://hiveintelligence.xyz/mcp",
        "HIVE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Environment Variables

Create a `.env` file in your project root:

```env
# Required for programmatic access
HIVE_MCP_URL=https://hiveintelligence.xyz/mcp

# Optional - for enhanced access
HIVE_API_KEY=your_api_key_here

# Enable fallback mode for testing
HIVE_FALLBACK_MODE=true
```

## Available Tools

Once connected, you'll have access to these OnChainAgents tools:

### In Claude Code:
- **oca_analyze** - Comprehensive token analysis
- **oca_security** - Security and rug detection
- **oca_hunt** - Find alpha opportunities
- **oca_track** - Track whale wallets
- **oca_sentiment** - Social sentiment analysis
- **oca_research** - Deep token research
- **oca_defi** - DeFi protocol analysis
- **oca_bridge** - Cross-chain routing
- **oca_portfolio** - Portfolio analysis
- **oca_market** - Market structure analysis

### Direct Hive Intelligence Tools:
- **hive_token_data** - Get comprehensive token information
- **hive_security_scan** - Perform security analysis and rug detection
- **hive_whale_tracker** - Track whale wallet activity
- **hive_sentiment_analysis** - Analyze social sentiment
- **hive_alpha_signals** - Discover emerging opportunities
- **hive_portfolio_analyzer** - Analyze portfolio holdings
- **hive_defi_monitor** - Monitor DeFi protocols
- **hive_cross_chain_bridge** - Get cross-chain bridge information

## Testing Your Connection

Run the provided test script:

```bash
npm run test:hive-mcp
```

This will:
1. Test connection to Hive Intelligence
2. List available tools
3. Make sample API calls
4. Verify fallback mode
5. Display setup instructions

## Troubleshooting

### Connection Issues

**404 Not Found Error:**
- The endpoint `/rpc` may not be available yet
- Enable fallback mode: `HIVE_FALLBACK_MODE=true`
- Contact Hive Intelligence for API access

**Authentication Failed:**
- Verify your API key is correct
- Check if API key is required for your access level

**Timeout Errors:**
- Check your internet connection
- Verify the MCP URL is correct
- Try increasing the timeout in client configuration

### Fallback Mode

When the Hive Intelligence API is unavailable, enable fallback mode:

```typescript
// In your code
const client = new HiveMCPRemoteClient({
  mcpServerUrl: 'https://hiveintelligence.xyz/mcp',
  // Fallback mode will use simulated data
});

// Or via environment variable
process.env.HIVE_FALLBACK_MODE = 'true';
```

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Claude Desktop  │────▶│   MCP Protocol   │────▶│ Hive Intelligence│
│   (GUI Setup)   │     │                  │     │    MCP Server   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               ▲
                               │
┌─────────────────┐            │
│   Node.js App   │────────────┘
│ (Programmatic)  │
└─────────────────┘
```

## Client Comparison

| Feature | HiveMCPClient | HiveMCPRemoteClient |
|---------|---------------|---------------------|
| Protocol | stdio (local) | HTTP (remote) |
| Use Case | Local MCP servers | Hive Intelligence API |
| Authentication | Not required | API key (optional) |
| Caching | ✓ Built-in | ✓ Built-in |
| Retry Logic | Basic | ✓ Advanced with backoff |
| Fallback Mode | Limited | ✓ Full simulation |
| Recommended For | Development | Production |

## Getting API Access

For enhanced access and higher rate limits:

1. Contact Hive Intelligence: https://t.me/hiveintelligence
2. Request an API key
3. Add the key to your `.env` file
4. Remove `HIVE_FALLBACK_MODE` or set to `false`

## Security Best Practices

1. **Never commit API keys** to version control
2. Use environment variables for sensitive data
3. Enable rate limiting in production
4. Implement proper error handling
5. Use caching to reduce API calls
6. Monitor usage and set alerts

## Support

- **Documentation**: https://docs.hiveintelligence.xyz
- **Telegram**: https://t.me/hiveintelligence
- **GitHub Issues**: https://github.com/onchainagents/onchainagents.fun/issues

---

*Last Updated: 2025-08-07*