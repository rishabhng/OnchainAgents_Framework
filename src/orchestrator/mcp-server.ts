#!/usr/bin/env node

/**
 * OnChainAgents MCP Server
 * Local MCP server that Claude connects to for crypto intelligence
 * Architecture inspired by SuperClaude Framework
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
  ListToolsResult,
  TextContent,
  ImageContent,
  EmbeddedResource,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Orchestrator } from './index.js';
import { HiveBridge } from '../bridges/hive-bridge.js';

// Initialize components
const orchestrator = new Orchestrator();
const hiveBridge = new HiveBridge();

// Initialize MCP Server
const server = new Server(
  {
    name: 'onchainagents',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

/**
 * Define crypto-specific tools following SuperClaude pattern
 */
const tools: Tool[] = [
  // Core Analysis Tools
  {
    name: 'oca_analyze',
    description: 'Comprehensive multi-agent token analysis with security, market, and research insights',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Token address or symbol to analyze',
        },
        network: {
          type: 'string',
          description: 'Blockchain network (ethereum, bsc, polygon, etc.)',
          default: 'ethereum',
        },
        depth: {
          type: 'string',
          enum: ['quick', 'standard', 'deep', 'forensic'],
          description: 'Analysis depth level',
          default: 'standard',
        },
      },
      required: ['target'],
    },
  },
  
  // Security Tools
  {
    name: 'oca_security',
    description: 'Advanced security analysis and rug pull detection',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Token contract address',
        },
        network: {
          type: 'string',
          description: 'Blockchain network',
          default: 'ethereum',
        },
        includeAudit: {
          type: 'boolean',
          description: 'Include smart contract audit analysis',
          default: true,
        },
      },
      required: ['address'],
    },
  },
  
  // Market Intelligence Tools
  {
    name: 'oca_hunt',
    description: 'Hunt for alpha opportunities using AI-powered pattern recognition',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['defi', 'gaming', 'ai', 'infrastructure', 'meme', 'all'],
          description: 'Category to search',
          default: 'all',
        },
        risk: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'degen'],
          description: 'Risk tolerance level',
          default: 'medium',
        },
        marketCapRange: {
          type: 'object',
          properties: {
            min: { type: 'number', description: 'Minimum market cap' },
            max: { type: 'number', description: 'Maximum market cap' },
          },
        },
        timeframe: {
          type: 'string',
          enum: ['1h', '4h', '24h', '7d', '30d'],
          default: '24h',
        },
      },
    },
  },
  
  // Whale Tracking
  {
    name: 'oca_track',
    description: 'Track whale wallets and smart money movements',
    inputSchema: {
      type: 'object',
      properties: {
        wallet: {
          type: 'string',
          description: 'Wallet address to track',
        },
        network: {
          type: 'string',
          description: 'Blockchain network',
          default: 'ethereum',
        },
        includeHistory: {
          type: 'boolean',
          description: 'Include historical transaction analysis',
          default: false,
        },
        alertThreshold: {
          type: 'number',
          description: 'Alert for transactions above this USD value',
        },
      },
      required: ['wallet'],
    },
  },
  
  // Sentiment Analysis
  {
    name: 'oca_sentiment',
    description: 'Analyze social sentiment across multiple platforms',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Token symbol or name',
        },
        platforms: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['twitter', 'telegram', 'discord', 'reddit', 'all'],
          },
          default: ['all'],
        },
        timeframe: {
          type: 'string',
          enum: ['1h', '4h', '24h', '7d'],
          default: '24h',
        },
      },
      required: ['token'],
    },
  },
  
  // Research Tools
  {
    name: 'oca_research',
    description: 'Deep fundamental research and investment thesis generation',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Token symbol or project name',
        },
        aspects: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['team', 'tokenomics', 'technology', 'market', 'competitors', 'risks', 'all'],
          },
          default: ['all'],
        },
        format: {
          type: 'string',
          enum: ['summary', 'detailed', 'report'],
          default: 'summary',
        },
      },
      required: ['token'],
    },
  },
  
  // DeFi Analysis
  {
    name: 'oca_defi',
    description: 'Analyze DeFi protocols, yields, and opportunities',
    inputSchema: {
      type: 'object',
      properties: {
        protocol: {
          type: 'string',
          description: 'Protocol name or token',
        },
        analysis: {
          type: 'string',
          enum: ['yields', 'risks', 'tvl', 'tokenomics', 'comprehensive'],
          default: 'comprehensive',
        },
        network: {
          type: 'string',
          description: 'Blockchain network',
          default: 'ethereum',
        },
      },
      required: ['protocol'],
    },
  },
  
  // Cross-Chain Tools
  {
    name: 'oca_bridge',
    description: 'Cross-chain bridge analysis and routing',
    inputSchema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Source network',
        },
        to: {
          type: 'string',
          description: 'Destination network',
        },
        token: {
          type: 'string',
          description: 'Token to bridge',
        },
        amount: {
          type: 'number',
          description: 'Amount to bridge (optional for quote)',
        },
      },
      required: ['from', 'to', 'token'],
    },
  },
  
  // Portfolio Analysis
  {
    name: 'oca_portfolio',
    description: 'Analyze wallet portfolio composition and performance',
    inputSchema: {
      type: 'object',
      properties: {
        wallet: {
          type: 'string',
          description: 'Wallet address',
        },
        networks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Networks to analyze',
          default: ['ethereum', 'bsc', 'polygon'],
        },
        metrics: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['value', 'pnl', 'risk', 'diversification', 'all'],
          },
          default: ['all'],
        },
      },
      required: ['wallet'],
    },
  },
  
  // Market Structure
  {
    name: 'oca_market',
    description: 'Analyze market structure, trends, and dynamics',
    inputSchema: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['overview', 'sector', 'token', 'trend'],
          default: 'overview',
        },
        target: {
          type: 'string',
          description: 'Specific sector or token (if applicable)',
        },
        timeframe: {
          type: 'string',
          enum: ['1d', '7d', '30d', '90d'],
          default: '7d',
        },
      },
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async (): Promise<ListToolsResult> => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;
  
  try {
    console.error(`[MCP] Executing tool: ${name}`, args);
    
    // Route to orchestrator for intelligent processing
    const result = await orchestrator.execute(name, args || {});
    
    // Format response
    const content: Array<TextContent | ImageContent | EmbeddedResource> = [];
    
    if (typeof result === 'string') {
      content.push({
        type: 'text',
        text: result,
      });
    } else if (result.text) {
      content.push({
        type: 'text',
        text: result.text,
      });
    }
    
    if (result.data) {
      content.push({
        type: 'text',
        text: `\n\n📊 **Data:**\n\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\``,
      });
    }
    
    return { content };
    
  } catch (error) {
    console.error(`[MCP] Tool execution failed:`, error);
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the MCP server
async function main() {
  console.error('[OnChainAgents] Starting MCP server v2.0...');
  
  // Initialize Hive bridge connection
  await hiveBridge.initialize();
  
  // Start MCP server on stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('[OnChainAgents] MCP server running. Ready for Claude connection.');
  console.error('[OnChainAgents] Available tools:', tools.map(t => t.name).join(', '));
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('[OnChainAgents] Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[OnChainAgents] Uncaught exception:', error);
  process.exit(1);
});

// Start server
main().catch((error) => {
  console.error('[OnChainAgents] Failed to start server:', error);
  process.exit(1);
});