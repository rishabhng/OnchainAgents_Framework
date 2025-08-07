# Hive Intelligence MCP Integration Guide

## Overview

Hive Intelligence provides blockchain data through an HTTP-based MCP (Model Context Protocol) endpoint. This guide explains how to properly integrate OnChainAgents with Hive Intelligence through Claude.

## 🔗 Official Hive Intelligence MCP Endpoint

**Endpoint**: `https://hiveintelligence.xyz/mcp`  
**Transport**: HTTP  
**Protocol**: MCP (Model Context Protocol)

## 🚀 Quick Setup

### Option 1: Direct Claude Integration (Recommended)

Add Hive Intelligence directly to Claude using the MCP command:

```bash
claude mcp add --transport http hive https://hiveintelligence.xyz/mcp
```

This command:
- Adds Hive Intelligence as an MCP server named "hive"
- Uses HTTP transport (not stdio)
- Connects directly to Hive's remote endpoint

### Option 2: OnChainAgents Local MCP Server

If you want to use OnChainAgents' orchestration layer with multiple agents:

```bash
# 1. Clone and setup OnChainAgents
git clone https://github.com/yourusername/onchainagents-fun
cd onchainagents-fun
npm install

# 2. Start the local MCP server
npx tsx src/orchestrator/mcp-server.ts

# 3. Add to Claude (in another terminal)
claude mcp add onchainagents
```

## 📋 Available Tools from Hive Intelligence

When connected, Hive Intelligence provides these MCP tools:

### Core Blockchain Tools
- `hive_token_data` - Get comprehensive token information
- `hive_wallet_info` - Analyze wallet holdings and activity
- `hive_transaction_trace` - Trace transaction flow
- `hive_security_scan` - Security audit for contracts
- `hive_defi_positions` - DeFi protocol positions

### Market Intelligence Tools
- `hive_alpha_signals` - Alpha opportunities discovery
- `hive_whale_tracking` - Monitor large holder movements
- `hive_sentiment_analysis` - Social sentiment metrics
- `hive_market_structure` - Market microstructure analysis

### Cross-Chain Tools
- `hive_bridge_routes` - Optimal bridging paths
- `hive_cross_chain_activity` - Multi-chain activity analysis

## 🏗️ Architecture

### Direct Hive Integration
```
Claude Desktop/CLI
       ↓
   MCP Protocol (HTTP)
       ↓
Hive Intelligence MCP
(https://hiveintelligence.xyz/mcp)
       ↓
Hive Intelligence Network
(60+ blockchains, 250TB daily)
```

### OnChainAgents Enhanced Integration
```
Claude Desktop/CLI
       ↓
OnChainAgents MCP Server (stdio)
       ↓
Orchestrator + 16 Agents
       ↓
HiveMCPRemoteClient (HTTP)
       ↓
Hive Intelligence MCP
(https://hiveintelligence.xyz/mcp)
```

## 🛠️ Configuration

### For Direct Hive Usage

No configuration needed! Just run:
```bash
claude mcp add --transport http hive https://hiveintelligence.xyz/mcp
```

### For OnChainAgents Integration

1. **Update MCP Remote Client Configuration**:
```typescript
// src/mcp/HiveMCPRemoteClient.ts
const DEFAULT_CONFIG = {
  mcpServerUrl: 'https://hiveintelligence.xyz/mcp',
  transport: 'http',
  // No API key needed - it's a public MCP endpoint
}
```

2. **Environment Variables** (Optional):
```bash
# .env file
HIVE_MCP_URL=https://hiveintelligence.xyz/mcp
HIVE_FALLBACK_MODE=false  # Set to true for testing without connection
```

## 📝 Usage Examples

### With Claude CLI

After adding Hive MCP:

```bash
# Use Hive tools directly
claude "Using hive, analyze the token at 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4"

# Get whale movements
claude "Using hive, track whale movements for address 0xwhale on ethereum"

# Security audit
claude "Using hive, perform a security scan on contract 0xcontract"
```

### With OnChainAgents CLI

```bash
# Analyze token
npx tsx src/cli.ts analyze ethereum 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4

# Hunt for alpha
npx tsx src/cli.ts hunt --network ethereum

# Track whale
npx tsx src/cli.ts track 0xwhale
```

## 🔍 Testing the Connection

### Test Hive MCP Directly

```bash
# List available MCP servers
claude mcp list

# Should show:
# - hive (http://hiveintelligence.xyz/mcp)

# Test a query
claude "Using hive, what tools are available?"
```

### Test OnChainAgents Connection

```typescript
// test-hive-connection.ts
import { HiveMCPRemoteClient } from './src/mcp/HiveMCPRemoteClient';

async function testConnection() {
  const client = new HiveMCPRemoteClient({
    mcpServerUrl: 'https://hiveintelligence.xyz/mcp'
  });
  
  // List available tools
  const tools = await client.listTools();
  console.log('Available tools:', tools);
  
  // Test a simple query
  const result = await client.callTool('hive_token_data', {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
    network: 'ethereum'
  });
  console.log('Token data:', result);
}

testConnection().catch(console.error);
```

Run with:
```bash
npx tsx test-hive-connection.ts
```

## ⚠️ Important Notes

1. **No API Key Required**: Hive Intelligence MCP is a public endpoint
2. **HTTP Transport**: Uses HTTP, not stdio (standard input/output)
3. **Direct URL**: The endpoint is `https://hiveintelligence.xyz/mcp`
4. **Rate Limiting**: Public endpoint may have rate limits
5. **Fallback Mode**: Use `HIVE_FALLBACK_MODE=true` for testing without connection

## 🐛 Troubleshooting

### Connection Issues

If you can't connect to Hive:

1. **Check MCP is added correctly**:
```bash
claude mcp list
# Should show hive with HTTP transport
```

2. **Test the endpoint directly**:
```bash
curl -X POST https://hiveintelligence.xyz/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

3. **Use fallback mode for testing**:
```bash
HIVE_FALLBACK_MODE=true npx tsx src/cli.ts analyze ethereum 0xtoken
```

### Common Errors

| Error | Solution |
|-------|----------|
| "Cannot connect to MCP server" | Check internet connection and firewall |
| "Invalid transport" | Ensure using `--transport http` not stdio |
| "Tool not found" | Check tool name matches Hive's tool list |
| "Rate limited" | Wait and retry, or implement caching |

## 📚 Resources

- **Hive Intelligence**: https://hiveintelligence.xyz
- **MCP Documentation**: https://modelcontextprotocol.io
- **OnChainAgents**: https://github.com/yourusername/onchainagents-fun

## 🤝 Support

- **Hive Intelligence Discord**: [Join Discord](https://discord.gg/hiveintelligence)
- **GitHub Issues**: Report issues on the OnChainAgents repo
- **Twitter**: @hiveintelligence

---

*Last Updated: August 2024*
*OnChainAgents Version: 2.0*
*Hive MCP Endpoint: https://hiveintelligence.xyz/mcp*