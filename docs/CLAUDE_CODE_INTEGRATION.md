# Claude Code Integration - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation Methods](#installation-methods)
4. [Configuration](#configuration)
5. [MCP Server Details](#mcp-server-details)
6. [Tool Implementation](#tool-implementation)
7. [Advanced Features](#advanced-features)
8. [Troubleshooting](#troubleshooting)
9. [Development Guide](#development-guide)
10. [API Reference](#api-reference)

## Overview

OnChainAgents integrates with Claude Code through the Model Context Protocol (MCP), providing seamless access to 16 specialized crypto intelligence agents directly within your AI-powered development workflow.

### Key Features
- **Native MCP Integration**: Direct tool access without leaving Claude Code
- **Multi-Agent Orchestration**: Intelligent routing to specialized agents
- **Real-time Data**: Powered by Hive Intelligence API
- **Caching & Optimization**: Efficient resource management
- **Fallback Mode**: Works without API key for testing

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Claude Code    │────▶│  MCP Protocol    │────▶│  OnChainAgents  │
│     (CLI)       │     │    (stdio)       │     │   MCP Server    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  Orchestrator   │
                                                  └─────────────────┘
                                                           │
                              ┌────────────────────────────┼────────────────────────────┐
                              ▼                            ▼                            ▼
                      ┌──────────────┐            ┌──────────────┐            ┌──────────────┐
                      │ Security     │            │ Market       │            │ Research     │
                      │ Agents       │            │ Agents       │            │ Agents       │
                      └──────────────┘            └──────────────┘            └──────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │ Hive Intelligence│
                                                  │      API        │
                                                  └─────────────────┘
```

### Component Descriptions

1. **Claude Code CLI**: The command-line interface that users interact with
2. **MCP Protocol**: Standard protocol for AI-tool communication
3. **OnChainAgents MCP Server**: Our server implementation handling tool requests
4. **Orchestrator**: Intelligent routing system selecting appropriate agents
5. **Specialized Agents**: 16 domain-specific agents for crypto analysis
6. **Hive Intelligence API**: Real-time blockchain data provider

## Installation Methods

### Method 1: NPM Global Package (Recommended)

```bash
# Install globally
npm install -g @onchainagents/core

# Verify installation
oca --version

# Configure Claude Code
claude mcp add onchainagents
```

### Method 2: GitHub Repository (Development)

```bash
# Clone repository
git clone https://github.com/onchainagents/onchainagents.fun
cd onchainagents.fun

# Install dependencies
npm install

# Build project
npm run build

# Link globally
npm link

# Configure Claude Code
claude mcp add onchainagents
```

### Method 3: Direct Configuration

```bash
# Edit Claude Code config directly
nano ~/.config/claude/claude_code_config.json
```

Add the following:
```json
{
  "mcpServers": {
    "onchainagents": {
      "command": "npx",
      "args": ["@onchainagents/core", "oca-mcp"],
      "env": {
        "HIVE_API_KEY": "your-api-key",
        "HIVE_FALLBACK_MODE": "false"
      }
    }
  }
}
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `HIVE_API_KEY` | Hive Intelligence API key | - | No |
| `HIVE_FALLBACK_MODE` | Use simulated data | `true` | No |
| `HIVE_MCP_URL` | MCP server endpoint | `https://hiveintelligence.xyz/mcp` | No |
| `CACHE_TTL` | Cache duration (seconds) | `3600` | No |
| `MAX_RETRIES` | API retry attempts | `3` | No |
| `LOG_LEVEL` | Logging verbosity | `info` | No |
| `PORT` | MCP server port | `3000` | No |
| `NODE_ENV` | Environment mode | `production` | No |

### Configuration Files

#### Global Configuration
Location: `~/.config/claude/claude_code_config.json`

```json
{
  "mcpServers": {
    "onchainagents": {
      "command": "npx",
      "args": ["@onchainagents/core", "oca-mcp"],
      "env": {
        "HIVE_API_KEY": "${HIVE_API_KEY}",
        "LOG_LEVEL": "warn"
      }
    }
  }
}
```

#### Project Configuration
Location: `.claude/claude.json` (in project root)

```json
{
  "name": "OnChainAgents",
  "version": "2.0.0",
  "mcp": {
    "server": {
      "command": "node",
      "args": ["./dist/orchestrator/mcp-server.js"]
    }
  }
}
```

## MCP Server Details

### Server Implementation

The MCP server (`src/orchestrator/mcp-server.ts`) implements:

1. **Tool Registration**: Defines available tools and their schemas
2. **Request Handling**: Processes incoming tool calls
3. **Response Formatting**: Returns structured results
4. **Error Management**: Handles failures gracefully

### Tool Schema Definition

```typescript
{
  name: 'oca_analyze',
  description: 'Comprehensive token analysis',
  inputSchema: {
    type: 'object',
    properties: {
      network: { type: 'string' },
      target: { type: 'string' },
      depth: { 
        type: 'string',
        enum: ['quick', 'standard', 'deep', 'forensic']
      }
    },
    required: ['target']
  }
}
```

### Communication Protocol

1. **Request**: Claude Code sends JSON-RPC request via stdio
2. **Processing**: MCP server routes to appropriate agent
3. **Execution**: Agent performs analysis using Hive API
4. **Response**: Formatted result returned to Claude Code

## Tool Implementation

### Tool Categories

#### Analysis Tools
- `oca_analyze`: Multi-agent token analysis
- `oca_research`: Deep fundamental research

#### Security Tools
- `oca_security`: Rug pull detection
- `oca_risk`: Risk assessment

#### Market Tools
- `oca_hunt`: Alpha opportunity finder
- `oca_track`: Whale wallet tracker
- `oca_sentiment`: Social sentiment analyzer
- `oca_market`: Market structure analysis

#### DeFi Tools
- `oca_defi`: Protocol analysis
- `oca_yield`: Yield optimization
- `oca_bridge`: Cross-chain routing

#### Portfolio Tools
- `oca_portfolio`: Portfolio analysis

### Agent Orchestration

```typescript
class Orchestrator {
  async route(tool: string, params: any): Promise<AgentResult> {
    // 1. Parse tool and parameters
    const { network, target, options } = this.parseParams(params);
    
    // 2. Select appropriate agents
    const agents = this.selectAgents(tool);
    
    // 3. Execute in parallel or sequence
    const results = await this.executeAgents(agents, params);
    
    // 4. Aggregate and format results
    return this.formatResponse(results);
  }
}
```

## Advanced Features

### Caching Strategy

```typescript
class CacheManager {
  // Token data: 1 hour
  tokenCache: NodeCache({ stdTTL: 3600 });
  
  // Security scans: 24 hours
  securityCache: NodeCache({ stdTTL: 86400 });
  
  // Market data: 5 minutes
  marketCache: NodeCache({ stdTTL: 300 });
}
```

### Rate Limiting

```typescript
class RateLimiter {
  limits = {
    free: { rpm: 10, rph: 100, rpd: 1000 },
    authenticated: { rpm: 60, rph: 1000, rpd: 10000 }
  };
}
```

### Error Recovery

```typescript
class ErrorHandler {
  async handleError(error: Error): Promise<FallbackResult> {
    if (error.code === 'RATE_LIMIT') {
      return this.waitAndRetry();
    }
    if (error.code === 'API_DOWN') {
      return this.useFallbackData();
    }
    if (error.code === 'INVALID_TOKEN') {
      return this.suggestAlternatives();
    }
  }
}
```

### Multi-Agent Coordination

```typescript
class MultiAgentCoordinator {
  async analyze(token: string): Promise<Analysis> {
    // Run agents in parallel
    const [security, market, research] = await Promise.all([
      this.securityAgent.analyze(token),
      this.marketAgent.analyze(token),
      this.researchAgent.analyze(token)
    ]);
    
    // Combine results
    return this.combineAnalysis({ security, market, research });
  }
}
```

## Troubleshooting

### Common Issues

#### Tools Not Available
```bash
# Check MCP server status
claude mcp status onchainagents

# Restart MCP server
claude mcp restart onchainagents

# View logs
claude mcp logs onchainagents
```

#### Connection Errors
```bash
# Test MCP server directly
npx @onchainagents/core oca-mcp test

# Check configuration
cat ~/.config/claude/claude_code_config.json | jq .mcpServers.onchainagents
```

#### API Issues
```bash
# Enable fallback mode
export HIVE_FALLBACK_MODE=true

# Test with fallback
claude mcp restart onchainagents
```

### Debug Mode

Enable detailed logging:
```json
{
  "env": {
    "LOG_LEVEL": "debug",
    "DEBUG": "onchainagents:*"
  }
}
```

### Performance Optimization

1. **Enable Caching**: Set appropriate `CACHE_TTL`
2. **Batch Requests**: Use multi-token analysis
3. **Use Appropriate Depth**: Don't use `forensic` for quick checks
4. **Implement Circuit Breaker**: Prevent cascade failures

## Development Guide

### Setting Up Development Environment

```bash
# Clone and setup
git clone https://github.com/onchainagents/onchainagents.fun
cd onchainagents.fun
npm install

# Development mode
npm run dev

# Run tests
npm test
npm run test:coverage

# Build
npm run build
```

### Creating Custom Agents

```typescript
import { BaseAgent } from './agents/base/BaseAgent';

export class CustomAgent extends BaseAgent {
  async analyze(params: AnalysisParams): Promise<Result> {
    // Validate input
    this.validateInput(params);
    
    // Perform analysis
    const data = await this.fetchData(params);
    const analysis = this.processData(data);
    
    // Return formatted result
    return this.formatResult(analysis);
  }
}
```

### Adding New Tools

1. Define tool schema in `mcp-server.ts`
2. Implement handler in orchestrator
3. Add agent if needed
4. Update documentation
5. Add tests

### Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests with Claude Code
npm run test:e2e

# Test specific agent
npm test -- --testNamePattern="AlphaHunter"
```

## API Reference

### Tool Endpoints

#### `oca_analyze`
```typescript
interface AnalyzeParams {
  network: string;      // blockchain network
  target: string;       // token address or symbol
  depth?: 'quick' | 'standard' | 'deep' | 'forensic';
}

interface AnalyzeResult {
  token: TokenInfo;
  security: SecurityScore;
  market: MarketMetrics;
  recommendation: string;
}
```

#### `oca_security`
```typescript
interface SecurityParams {
  address: string;      // contract address
  network: string;      // blockchain network
  includeAudit?: boolean;
}

interface SecurityResult {
  verdict: 'SAFE' | 'WARNING' | 'CRITICAL';
  riskScore: number;    // 0-100
  risks: Risk[];
  audit?: AuditReport;
}
```

### Response Format

All tools return standardized responses:

```typescript
interface ToolResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    agent: string;
    timestamp: number;
    cached: boolean;
    version: string;
  };
}
```

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `RATE_LIMIT` | Rate limit exceeded | Wait and retry |
| `INVALID_TOKEN` | Token not found | Check address/symbol |
| `NETWORK_ERROR` | Network unavailable | Check connection |
| `API_ERROR` | Hive API error | Enable fallback mode |
| `VALIDATION_ERROR` | Invalid parameters | Check input format |

## Best Practices

### For Users

1. **Start with Quick Analysis**: Use `quick` depth for initial checks
2. **Chain Tools Logically**: Security check before deep analysis
3. **Use Caching**: Don't repeat same queries rapidly
4. **Handle Errors Gracefully**: Implement fallback strategies

### For Developers

1. **Follow Agent Pattern**: Extend BaseAgent for consistency
2. **Implement Caching**: Reduce API calls
3. **Add Comprehensive Tests**: Maintain >90% coverage
4. **Document Changes**: Update this guide
5. **Version Appropriately**: Follow semantic versioning

## Support & Resources

### Getting Help
- **Discord**: [discord.gg/onchainagents](https://discord.gg/onchainagents)
- **GitHub Issues**: [Report bugs](https://github.com/onchainagents/onchainagents.fun/issues)
- **Documentation**: [docs.onchainagents.fun](https://docs.onchainagents.fun)

### Contributing
See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### License
MIT License - see [LICENSE](../LICENSE) file.

---

*Last Updated: 2025-08-07*