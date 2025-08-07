# Hive Intelligence Integration Guide

## Overview

OnChainAgents integrates with Hive Intelligence to provide real-time crypto data, security analysis, and market intelligence. This guide explains how to configure and use the Hive Intelligence integration.

## Architecture

### Connection Modes

1. **Direct API Mode** (Default)
   - Uses HTTP/HTTPS requests to Hive Intelligence API
   - Fallback mode for when MCP is not available
   - Suitable for most use cases

2. **MCP Mode** (Advanced)
   - Uses Model Context Protocol for enhanced capabilities
   - WebSocket or stdio transport
   - Real-time data streaming

3. **Fallback Mode** (Development)
   - Returns minimal valid data structures
   - Allows testing without Hive API access
   - Automatically activated when Hive is unreachable

## Configuration

### Environment Variables

```bash
# Hive API Configuration
HIVE_API_KEY=your-api-key-here        # Your Hive Intelligence API key
HIVE_URL=https://hiveintelligence.xyz # Hive API endpoint (optional)
HIVE_MCP_URL=wss://hiveintelligence.xyz/mcp # MCP WebSocket endpoint (optional)

# Mode Selection
USE_REAL_HIVE=true                    # Enable real Hive connection
HIVE_FALLBACK_MODE=false             # Force fallback mode (for testing)

# Logging
LOG_LEVEL=info                        # Log level (error, warn, info, debug)
```

### Programmatic Configuration

```typescript
import { HiveBridge } from '@onchainagents/core';

// Basic configuration
const hiveService = new HiveBridge({
  apiKey: 'your-api-key',
  fallbackMode: false,
  cacheTTL: 3600,
  logLevel: 'info'
});

// Initialize connection
await hiveService.initialize();
```

## Available Tools

### Token Data
```typescript
const tokenData = await hiveService.callTool('hive_token_data', {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  network: 'ethereum'
});
```

### Security Scanning
```typescript
const securityScan = await hiveService.callTool('hive_security_scan', {
  address: '0x...',
  network: 'ethereum'
});
```

### Whale Activity Tracking
```typescript
const whaleActivity = await hiveService.callTool('hive_whale_activity', {
  wallet: '0x...',
  timeframe: '24h'
});
```

### Social Sentiment Analysis
```typescript
const sentiment = await hiveService.callTool('hive_social_sentiment', {
  symbol: 'BTC',
  platforms: ['twitter', 'telegram', 'reddit']
});
```

### Alpha Signal Discovery
```typescript
const alphaSignals = await hiveService.callTool('hive_alpha_signals', {
  category: 'defi',
  risk: 'medium'
});
```

## Agent Integration

All OnChainAgents automatically use Hive Intelligence when configured:

```typescript
import { AlphaHunter, RugDetector } from '@onchainagents/core';

// Initialize Hive
const hiveService = new HiveBridge({ apiKey: process.env.HIVE_API_KEY });
await hiveService.initialize();

// Create agents with Hive
const alphaHunter = new AlphaHunter(hiveService);
const rugDetector = new RugDetector(hiveService);

// Agents will automatically use Hive data
const opportunities = await alphaHunter.analyze({
  network: 'ethereum',
  risk: 'medium'
});
```

## Testing

### Test Connection
```bash
# Test with fallback mode (no API key required)
npm run test:hive

# Test with real Hive API
HIVE_API_KEY=your-key USE_REAL_HIVE=true npm run test:hive
```

### Test Script
```bash
npx ts-node test-hive-connection.ts
```

## Error Handling

The Hive Bridge implements automatic error handling:

1. **Retry Logic**: Automatic retry with exponential backoff
2. **Fallback Data**: Returns minimal valid structures when API is unavailable
3. **Caching**: Reduces API calls and improves performance
4. **Circuit Breaker**: Prevents cascading failures

## API Response Structure

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "cached": false
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "data": null
}
```

### Fallback Response
```json
{
  "success": true,
  "data": {
    "error": "Hive API unavailable",
    ...minimal_valid_structure
  },
  "cached": false
}
```

## Performance Optimization

### Caching
- Default TTL: 3600 seconds (1 hour)
- Configurable per instance
- Automatic cache invalidation

### Connection Pooling
- Reuses HTTP connections
- WebSocket connection persistence
- Automatic reconnection

### Rate Limiting
- Respects Hive API rate limits
- Automatic throttling
- Queue management for bulk requests

## Troubleshooting

### Connection Issues
```bash
# Check connectivity
curl https://hiveintelligence.xyz/health

# Test with verbose logging
LOG_LEVEL=debug npm run test:hive
```

### Common Errors

1. **404 Not Found**
   - Check API endpoint configuration
   - Verify API key permissions
   - Ensure correct network parameter

2. **401 Unauthorized**
   - Verify API key is set correctly
   - Check API key validity
   - Ensure proper authentication headers

3. **Connection Refused**
   - Check network connectivity
   - Verify firewall settings
   - Test with fallback mode

## Getting a Hive API Key

1. Visit [Hive Intelligence](https://hiveintelligence.xyz)
2. Sign up for an account
3. Navigate to API settings
4. Generate an API key
5. Add to your environment variables

## Support

For issues with Hive Intelligence integration:
- Check the [Hive Documentation](https://docs.hiveintelligence.xyz)
- Open an issue on [GitHub](https://github.com/yourusername/onchainagents)
- Contact Hive support for API-specific issues

## License

The Hive Intelligence integration is subject to Hive's Terms of Service and API usage policies.