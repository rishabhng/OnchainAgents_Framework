# Hive Intelligence MCP Integration

## ✅ Integration Status

The Hive Intelligence MCP (Model Context Protocol) integration is **fully implemented and working** in this codebase.

## 🚀 Quick Setup

To add Hive Intelligence to Claude Code, run:

```bash
claude mcp add --transport http hive https://hiveintelligence.xyz/mcp
```

**No API key required** - This is a public endpoint.

## 📋 Implementation Details

### Files Created/Updated

1. **`src/mcp/HiveMCPDirectClient.ts`**
   - Direct HTTP client for Hive MCP endpoint
   - Handles Server-Sent Events (SSE) responses
   - Implements proper headers: `Accept: application/json, text/event-stream`
   - No API key needed

2. **`tests/manual/test-hive-mcp-direct.ts`**
   - Comprehensive test suite for MCP connection
   - Verifies all available tools and endpoints
   - Tests connection, tool listing, and API invocation

### Technical Details

- **Protocol**: JSON-RPC 2.0
- **Transport**: HTTP with SSE support
- **Endpoint**: `https://hiveintelligence.xyz/mcp`
- **Headers Required**: 
  - `Content-Type: application/json`
  - `Accept: application/json, text/event-stream`

## 🛠️ Available Tools

The Hive MCP server provides 12 tools:

### Core Tools
1. **`get_api_endpoint_schema`** - Get schema for any Hive API endpoint
2. **`invoke_api_endpoint`** - Invoke any Hive API endpoint with parameters

### Category Endpoints
3. **`get_market_and_price_endpoints`** - Market data and pricing
4. **`get_onchain_dex_pool_endpoints`** - DEX and pool analytics
5. **`get_portfolio_wallet_endpoints`** - Portfolio and wallet tracking
6. **`get_token_contract_endpoints`** - Token and contract data
7. **`get_defi_protocol_endpoints`** - DeFi protocol analytics
8. **`get_security_risk_endpoints`** - Security and risk analysis
9. **`get_nft_analytics_endpoints`** - NFT analytics
10. **`get_network_infrastructure_endpoints`** - Network and infrastructure
11. **`get_search_discovery_endpoints`** - Search and discovery
12. **`get_social_sentiment_endpoints`** - Social media sentiment

## 💻 Usage Examples

### In Claude Code

After adding the MCP server, you can use natural language:

```
"Use Hive to analyze PEPE token"
"Get security analysis for 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
"Show me trending tokens on Ethereum"
"Check the liquidity pools for USDC"
```

### Programmatic Usage

```typescript
import { HiveMCPDirectClient } from './src/mcp/HiveMCPDirectClient';

const client = new HiveMCPDirectClient();

// List available tools
const tools = await client.listTools();

// Get security endpoints
const securityEndpoints = await client.getEndpointsByCategory('security');

// Invoke an API endpoint
const result = await client.invokeEndpoint('token_info', {
  network: 'ethereum',
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
});
```

## 🧪 Testing

Run the integration test:

```bash
npx ts-node tests/manual/test-hive-mcp-direct.ts
```

This will:
- Test connection to Hive MCP
- List all available tools
- Get endpoint categories
- Verify the integration is working

## 📊 Response Format

The Hive MCP server returns responses in Server-Sent Events (SSE) format:

```
event: message
data: {"result": {...}, "jsonrpc": "2.0", "id": 1}
```

The client automatically parses this format and returns structured data.

## 🔍 Discovering Endpoints

To discover available endpoints in a category:

1. Call the category endpoint (e.g., `get_security_risk_endpoints`)
2. This returns a list of available endpoints in that category
3. Use `get_api_endpoint_schema` to get the schema for a specific endpoint
4. Use `invoke_api_endpoint` to call the endpoint with proper parameters

## ⚡ Performance

- **Caching**: Built-in caching with configurable TTL (default: 1 hour)
- **Retry Logic**: Automatic retry with exponential backoff
- **Timeout**: Configurable timeout (default: 30 seconds)

## 🤝 Support

For Hive Intelligence support:
- Telegram: https://t.me/hiveintelligence
- Website: https://hiveintelligence.xyz

## ✅ Verification

The integration has been tested and verified to work with:
- ✅ Claude Code CLI
- ✅ Direct HTTP requests
- ✅ Programmatic access via TypeScript client
- ✅ No API key required (public access)