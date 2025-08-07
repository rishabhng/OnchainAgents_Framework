#!/usr/bin/env node

/**
 * MCP Server for OnChainAgents.fun
 * Provides Claude Code integration with Hive Intelligence blockchain data
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
  ListToolsResult
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { OnChainAgents } from '../index.js';

// Initialize OnChainAgents
const oca = new OnChainAgents();

// Initialize MCP Server
const server = new Server(
  {
    name: 'onchainagents',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: 'oca_analyze',
    description: 'Comprehensive multi-agent analysis of a token or protocol using 10 specialized AI agents',
    inputSchema: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          description: 'Blockchain network (ethereum, bsc, polygon, arbitrum, etc.)',
        },
        target: {
          type: 'string',
          description: 'Token address or symbol to analyze',
        },
        depth: {
          type: 'string',
          enum: ['quick', 'standard', 'deep'],
          description: 'Analysis depth level',
          default: 'standard'
        }
      },
      required: ['network', 'target'],
    },
  },
  {
    name: 'oca_security',
    description: 'Security-focused analysis including advanced rug pull detection and contract risk assessment',
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
          default: 'ethereum'
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'oca_hunt',
    description: 'Hunt for alpha opportunities and emerging gems before they become mainstream',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category (defi, gaming, ai, infrastructure, etc.)',
        },
        risk: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Risk tolerance level',
          default: 'medium'
        },
        marketCapMin: {
          type: 'number',
          description: 'Minimum market cap filter'
        },
        marketCapMax: {
          type: 'number', 
          description: 'Maximum market cap filter'
        }
      },
      required: [],
    },
  },
  {
    name: 'oca_track',
    description: 'Track whale wallets and monitor large transaction activities',
    inputSchema: {
      type: 'object',
      properties: {
        wallet: {
          type: 'string',
          description: 'Wallet address to track',
        },
        alerts: {
          type: 'boolean',
          description: 'Enable real-time alerts for significant movements',
          default: false
        },
      },
      required: ['wallet'],
    },
  },
  {
    name: 'oca_sentiment',
    description: 'Analyze social sentiment across Twitter, Telegram, Discord, and Reddit',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Token symbol or name',
        },
        sources: {
          type: 'string',
          description: 'Comma-separated list of sources (twitter,telegram,discord,reddit)',
          default: 'twitter,telegram,reddit'
        },
        timeframe: {
          type: 'string',
          description: 'Analysis timeframe (1h, 4h, 24h, 7d)',
          default: '24h'
        }
      },
      required: ['token'],
    },
  },
  {
    name: 'oca_research',
    description: 'Deep fundamental research and investment thesis analysis',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Token symbol to research',
        },
        deep: {
          type: 'boolean',
          description: 'Enable comprehensive deep research mode',
          default: false
        },
      },
      required: ['token'],
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async (): Promise<ListToolsResult> => {
  return {
    tools: tools,
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;

  try {
    if (!args) {
      throw new Error('No arguments provided');
    }

    switch (name) {
      case 'oca_analyze':
        const analyzeResult = await oca.analyze(
          args.network as string, 
          args.target as string, 
          {
            depth: (args.depth as string) || 'standard'
          }
        );
        
        return {
          content: [
            {
              type: 'text',
              text: formatAnalysisResult(analyzeResult),
            },
          ],
        };

      case 'oca_security':
        const securityResult = await oca.security(args.address as string, {
          network: (args.network as string) || 'ethereum'
        });
        
        return {
          content: [
            {
              type: 'text',
              text: formatSecurityResult(securityResult),
            },
          ],
        };

      case 'oca_hunt':
        const huntResult = await oca.hunt({
          category: args.category as string,
          risk: (args.risk as 'low' | 'medium' | 'high') || 'medium'
        });
        
        return {
          content: [
            {
              type: 'text',
              text: formatHuntResult(huntResult),
            },
          ],
        };

      case 'oca_track':
        const trackResult = await oca.track(args.wallet as string, {
          alerts: (args.alerts as boolean) || false
        });
        
        return {
          content: [
            {
              type: 'text',
              text: formatTrackResult(trackResult),
            },
          ],
        };

      case 'oca_sentiment':
        const sentimentResult = await oca.sentiment(args.token as string, {
          sources: (args.sources as string) || 'twitter,telegram,reddit'
        });
        
        return {
          content: [
            {
              type: 'text',
              text: formatSentimentResult(sentimentResult),
            },
          ],
        };

      case 'oca_research':
        const researchResult = await oca.research(args.token as string, {
          deep: (args.deep as boolean) || false
        });
        
        return {
          content: [
            {
              type: 'text',
              text: formatResearchResult(researchResult),
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error executing ${name}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Format helper functions
function formatAnalysisResult(result: any): string {
  if (!result.success) {
    return `❌ Analysis failed: ${result.errors?.join(', ') || 'Unknown error'}`;
  }
  
  const { data } = result;
  let output = '🔍 **Comprehensive Token Analysis**\n\n';
  
  // Security section
  if (data.security) {
    output += '🛡️ **Security Analysis**\n';
    if (data.security.rugDetection?.data) {
      const rug = data.security.rugDetection.data;
      output += `• Risk Score: ${rug.riskScore}/100\n`;
      output += `• Verdict: ${rug.verdict}\n`;
      if (rug.flags?.length > 0) {
        output += `• Flags: ${rug.flags.join(', ')}\n`;
      }
    }
    output += '\n';
  }
  
  // Market section
  if (data.market) {
    output += '📊 **Market Intelligence**\n';
    if (data.market.sentiment?.data) {
      output += `• Sentiment: ${data.market.sentiment.data.overallSentiment}\n`;
    }
    if (data.market.opportunities?.data?.opportunities) {
      output += `• Alpha Opportunities: ${data.market.opportunities.data.opportunities.length} found\n`;
    }
    output += '\n';
  }
  
  // Summary
  if (data.summary) {
    output += '📋 **Summary**\n';
    output += `• Overall Score: ${data.summary.score}/100\n`;
    output += `• Verdict: ${data.summary.verdict}\n`;
    
    if (data.summary.recommendations?.length > 0) {
      output += '\n**Recommendations:**\n';
      data.summary.recommendations.forEach((rec: string) => {
        output += `• ${rec}\n`;
      });
    }
  }
  
  return output;
}

function formatSecurityResult(result: any): string {
  if (!result.success) {
    return `❌ Security analysis failed: ${result.errors?.join(', ') || 'Unknown error'}`;
  }
  
  let output = '🛡️ **Security Analysis Results**\n\n';
  
  if (result.data.rugDetection) {
    const rug = result.data.rugDetection.data;
    output += `**Rug Pull Detection**\n`;
    output += `• Risk Score: ${rug?.riskScore || 0}/100\n`;
    output += `• Verdict: ${rug?.verdict || 'UNKNOWN'}\n`;
    
    if (rug?.flags?.length > 0) {
      output += `\n**Risk Flags:**\n`;
      rug.flags.forEach((flag: string) => {
        output += `• ${flag}\n`;
      });
    }
  }
  
  return output;
}

function formatHuntResult(result: any): string {
  if (!result.success) {
    return `❌ Alpha hunt failed: ${result.errors?.join(', ') || 'Unknown error'}`;
  }
  
  let output = '🎯 **Alpha Opportunities**\n\n';
  
  if (result.data.opportunities?.length > 0) {
    output += `Found **${result.data.opportunities.length}** opportunities:\n\n`;
    
    result.data.opportunities.slice(0, 5).forEach((opp: any, index: number) => {
      output += `**${index + 1}. ${opp.symbol || opp.name}**\n`;
      output += `• Score: ${opp.score || opp.momentumScore}/100\n`;
      output += `• Type: ${opp.type || 'Opportunity'}\n`;
      output += `• Confidence: ${opp.confidence || opp.convictionLevel}%\n\n`;
    });
  } else {
    output += 'No opportunities found with current filters.\n';
  }
  
  return output;
}

function formatTrackResult(result: any): string {
  if (!result.success) {
    return `❌ Wallet tracking failed: ${result.errors?.join(', ') || 'Unknown error'}`;
  }
  
  let output = '🐋 **Wallet Analysis**\n\n';
  
  if (result.data.whaleActivity) {
    const whale = result.data.whaleActivity.data;
    output += `**Whale Status:** ${whale?.isWhale ? 'Yes 🐋' : 'No'}\n`;
    output += `**Wallet Type:** ${whale?.walletType || 'Unknown'}\n\n`;
  }
  
  if (result.data.portfolio) {
    const portfolio = result.data.portfolio.data?.portfolio;
    if (portfolio) {
      output += `**Portfolio Overview:**\n`;
      output += `• Total Value: $${formatNumber(portfolio.totalValue)}\n`;
      output += `• P&L: ${portfolio.totalPnLPercent > 0 ? '+' : ''}${portfolio.totalPnLPercent.toFixed(2)}%\n`;
      output += `• Assets: ${portfolio.numberOfAssets}\n`;
    }
  }
  
  return output;
}

function formatSentimentResult(result: any): string {
  if (!result.success) {
    return `❌ Sentiment analysis failed: ${result.errors?.join(', ') || 'Unknown error'}`;
  }
  
  let output = '😊 **Sentiment Analysis**\n\n';
  
  output += `**Overall Sentiment:** ${getSentimentEmoji(result.data.sentiment)}\n`;
  output += `**Score:** ${result.data.score.toFixed(2)}/100\n\n`;
  
  if (result.data.analysis?.sources) {
    output += '**By Platform:**\n';
    Object.entries(result.data.analysis.sources).forEach(([source, data]: [string, any]) => {
      output += `• ${source}: ${data.sentiment || 'N/A'}\n`;
    });
  }
  
  return output;
}

function formatResearchResult(result: any): string {
  if (!result.success) {
    return `❌ Research failed: ${result.errors?.join(', ') || 'Unknown error'}`;
  }
  
  let output = '🔬 **Token Research**\n\n';
  
  if (result.data.research) {
    const research = result.data.research;
    output += `**Research Score:** ${research.researchScore}/100\n`;
    output += `**Investment Conviction:** ${research.investmentThesis?.conviction || 'N/A'}\n`;
    output += `**Market Position:** ${research.competitivePosition?.marketPosition || 'N/A'}\n\n`;
  }
  
  if (result.data.summary?.recommendations?.length > 0) {
    output += '**Key Insights:**\n';
    result.data.summary.recommendations.forEach((rec: string) => {
      output += `• ${rec}\n`;
    });
  }
  
  return output;
}

// Helper functions
function getSentimentEmoji(sentiment: string): string {
  switch (sentiment?.toLowerCase()) {
    case 'very_positive':
    case 'bullish':
      return '🚀 Very Positive';
    case 'positive':
      return '😊 Positive';
    case 'neutral':
      return '😐 Neutral';
    case 'negative':
      return '😟 Negative';
    case 'very_negative':
    case 'bearish':
      return '😱 Very Negative';
    default:
      return '❓ Unknown';
  }
}

function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('OnChainAgents MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});