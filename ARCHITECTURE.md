# OnChainAgents Architecture

## System Overview

OnChainAgents implements a complete SuperClaude Framework-inspired architecture optimized for crypto/blockchain operations. The system consists of 20 core components working in harmony to provide institutional-grade crypto intelligence.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                  Claude Desktop/Web                   │
│         (or any MCP-compatible AI platform)          │
└────────────────────┬─────────────────────────────────┘
                     │ MCP Protocol
                     ▼
┌──────────────────────────────────────────────────────┐
│         OnChainAgents Local MCP Server               │
│              (src/orchestrator/mcp-server.ts)        │
│                                                       │
│  Exposes 10 crypto-specific tools:                   │
│  • oca_analyze   • oca_hunt      • oca_defi         │
│  • oca_security  • oca_sentiment • oca_bridge       │
│  • oca_track     • oca_research  • oca_portfolio    │
│  • oca_market                                        │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│              Intelligent Orchestrator                │
│              (src/orchestrator/index.ts)             │
│                                                       │
│  • Detection Engine - Analyzes request complexity    │
│  • Router - Determines optimal execution strategy    │
│  • Resource Manager - Manages tokens & resources     │
└────────────────────┬─────────────────────────────────┘
                     │
        ┌────────────┴────────────┬──────────────┐
        ▼                         ▼              ▼
┌──────────────┐        ┌──────────────┐ ┌──────────────┐
│   Security   │        │    Market    │ │   Research   │
│   Agents     │        │   Agents     │ │   Agents     │
│              │        │              │ │              │
│ • RugDetector│        │ • AlphaHunter│ │ • Researcher │
│ • RiskAnalyzer        │ • Sentiment  │ │ • DeFi       │
└──────────────┘        │ • WhaleTracker │ • Portfolio  │
                        └──────────────┘ └──────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────┐
│                  Hive Bridge                         │
│              (src/bridges/hive-bridge.ts)            │
│                                                       │
│  Connects to Hive Intelligence Remote MCP            │
│  • Real-time blockchain data                         │
│  • 60+ networks, 250TB daily processing              │
└──────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────┐
│           Hive Intelligence MCP Server               │
│         (https://hiveintelligence.xyz/mcp)           │
│                                                       │
│  Remote MCP server providing blockchain data         │
└──────────────────────────────────────────────────────┘
```

## Key Components

### 1. MCP Server (`src/orchestrator/mcp-server.ts`)
- **Purpose**: Entry point for Claude Desktop/Web connections
- **Protocol**: Model Context Protocol (MCP)
- **Tools**: Exposes 10 crypto-specific tools
- **Transport**: stdio (standard input/output)

### 2. Orchestrator (`src/orchestrator/`)
The brain of the system, consisting of:

#### Detection Engine (`detector.ts`)
- Analyzes incoming requests
- Determines complexity (simple/moderate/complex)
- Identifies required agents
- Estimates resource requirements

#### Router (`router.ts`)
- Determines execution strategy
- Manages agent dependencies
- Decides parallel vs sequential execution
- Handles fallback strategies

#### Resource Manager (`resource-manager.ts`)
- Tracks token usage
- Monitors memory and execution time
- Implements resource zones (green/yellow/orange/red/critical)
- Prevents resource exhaustion

### 3. Agents (`src/agents/`)
Specialized AI agents for different crypto domains:

#### Security Agents
- **RugDetector**: Identifies scams and honeypots
- **RiskAnalyzer**: Comprehensive risk assessment

#### Market Intelligence
- **AlphaHunter**: Finds early opportunities
- **SentimentAnalyzer**: Social sentiment analysis
- **WhaleTracker**: Monitors large wallet movements

#### Research & Analysis
- **TokenResearcher**: Fundamental analysis
- **DeFiAnalyzer**: DeFi protocol analysis
- **PortfolioTracker**: Portfolio composition analysis

### 4. Hive Bridge (`src/bridges/hive-bridge.ts`)
- Connects to Hive Intelligence remote MCP
- Manages data caching
- Handles fallback mode for development
- Transforms MCP responses for agents

## Data Flow

1. **Request Initiation**
   - User asks Claude: "Analyze token 0x..."
   - Claude invokes `oca_analyze` tool

2. **MCP Server Processing**
   - Receives tool request via MCP protocol
   - Passes to Orchestrator

3. **Orchestration**
   - Detection Engine analyzes request
   - Router determines strategy
   - Resource Manager checks availability

4. **Agent Execution**
   - Appropriate agents are activated
   - Agents request data from Hive Bridge
   - Parallel or sequential execution based on strategy

5. **Data Retrieval**
   - Hive Bridge connects to Hive Intelligence MCP
   - Fetches real-time blockchain data
   - Caches responses for efficiency

6. **Response Compilation**
   - Orchestrator compiles agent results
   - Formats response for Claude
   - Returns via MCP protocol

## Configuration

### Claude Desktop Setup
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

### Environment Variables
- `HIVE_MCP_URL`: Hive Intelligence MCP endpoint
- `HIVE_FALLBACK_MODE`: Use simulated data (development)
- `LOG_LEVEL`: Logging verbosity
- `CACHE_TTL`: Cache duration in seconds

## SuperClaude Pattern Implementation

### 1. Intelligent Routing
- Pattern detection based on keywords and context
- Complexity assessment (simple/moderate/complex)
- Domain identification (security/market/research)

### 2. Resource Management
- Token budget allocation
- Memory monitoring
- Execution time limits
- Progressive resource zones

### 3. Multi-Agent Coordination
- Parallel execution when possible
- Dependency resolution
- Fallback strategies
- Result aggregation

### 4. Caching Strategy
- Tool-level caching
- Agent-level caching
- Time-based invalidation
- Cache key generation

## Production Considerations

### Performance
- Parallel agent execution
- Intelligent caching
- Resource optimization
- Connection pooling

### Reliability
- Fallback mode for development
- Retry logic with exponential backoff
- Error recovery strategies
- Health monitoring

### Security
- Input validation
- Rate limiting (planned)
- Secure data handling
- No credential storage

### Scalability
- Stateless design
- Horizontal scaling capability
- Cache distribution (planned)
- Load balancing support

## Development Mode

### Fallback Mode
When `HIVE_FALLBACK_MODE=true`:
- Uses simulated data instead of real Hive connection
- Allows development without Hive access
- Returns mock responses with realistic structure

### Testing
```bash
# Test MCP server
npx ts-node src/orchestrator/mcp-server.ts

# Test with Claude Desktop
# Add to Claude config and restart

# Test individual agents
npm test
```

## Future Enhancements

1. **Additional Agents**
   - NFT analyzer
   - MEV detector
   - Governance tracker

2. **Advanced Features**
   - Real-time monitoring
   - Alert system
   - Historical analysis

3. **Performance**
   - WebSocket connections
   - Distributed caching
   - Query optimization

4. **Integration**
   - Additional MCP servers
   - Direct API access
   - Webhook support

## Comparison with SuperClaude

| Feature | SuperClaude | OnChainAgents |
|---------|-------------|---------------|
| Architecture | MCP-based | MCP-based |
| Orchestration | Intelligent routing | Intelligent routing |
| Personas/Agents | 11 development personas | 10 crypto agents |
| Commands | Slash commands | MCP tools |
| External Integration | Context7, Sequential, etc | Hive Intelligence |
| Resource Management | Token & memory limits | Token & memory limits |
| Caching | Session-based | TTL-based |
| Focus | Software development | Crypto intelligence |

## Summary

OnChainAgents successfully implements the SuperClaude architectural pattern for crypto intelligence use cases. The system provides:

- **MCP-native integration** with Claude and other AI platforms
- **Intelligent orchestration** for optimal agent selection
- **Resource management** to prevent exhaustion
- **Flexible architecture** that's easy to extend
- **Production-ready** with fallback and caching

This architecture enables sophisticated crypto analysis while maintaining the elegance and efficiency of the SuperClaude Framework.