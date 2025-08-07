/**
 * Hive Intelligence Bridge
 * Connects OnChainAgents to Hive's remote MCP server
 * This bridge allows our local MCP server to fetch data from Hive
 */

// MCP SDK imports - these will be used when properly configured
// import { Client } from '@modelcontextprotocol/sdk/client/index.js';
// import { WebSocketTransport } from '@modelcontextprotocol/sdk/transport/websocket.js';
// import { StdioClientTransport } from '@modelcontextprotocol/sdk/transport/stdio.js';

import NodeCache from 'node-cache';
import winston from 'winston';
import axios, { AxiosInstance } from 'axios';

// Define Tool interface locally until MCP SDK is properly configured
export interface Tool {
  name: string;
  description: string;
  inputSchema?: any;
}

export interface HiveBridgeConfig {
  hiveUrl?: string;
  mcpServerUrl?: string; // Alias for hiveUrl for compatibility
  cacheTTL?: number;
  maxRetries?: number;
  timeout?: number;
  fallbackMode?: boolean;
  logLevel?: string;
  apiKey?: string;
}

export interface HiveResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}

/**
 * Bridge to Hive Intelligence MCP
 * This acts as a client to Hive's remote MCP server
 */
export class HiveBridge {
  private config: HiveBridgeConfig;
  private cache: NodeCache;
  private logger: winston.Logger;
  private isInitialized: boolean = false;
  private availableTools: Tool[] = [];
  private mcpClient?: any; // Will be Client type when MCP SDK is configured
  private axiosClient: AxiosInstance;
  
  constructor(config?: HiveBridgeConfig) {
    this.config = {
      hiveUrl: config?.hiveUrl || config?.mcpServerUrl || process.env.HIVE_MCP_URL || 'https://hiveintelligence.xyz/mcp',
      cacheTTL: config?.cacheTTL || 3600,
      maxRetries: config?.maxRetries || 3,
      timeout: config?.timeout || 30000,
      fallbackMode: config?.fallbackMode ?? (process.env.HIVE_FALLBACK_MODE === 'true'),
    };
    
    // Initialize cache
    this.cache = new NodeCache({
      stdTTL: this.config.cacheTTL,
      checkperiod: 120,
      useClones: false,
    });
    
    // Initialize logger
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'HiveBridge' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
    
    // Initialize axios client for direct API calls
    this.axiosClient = axios.create({
      baseURL: this.config.hiveUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {}),
      },
    });
  }
  
  /**
   * Initialize connection to Hive MCP
   */
  public async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Hive Intelligence bridge', {
        url: this.config.hiveUrl,
        fallbackMode: this.config.fallbackMode,
      });
      
      if (!this.config.fallbackMode) {
        // Try to connect to Hive MCP server
        await this.connectToHiveMCP();
      } else {
        this.logger.info('Running in fallback mode - using direct API calls');
      }
      
      // List available tools from Hive
      await this.discoverTools();
      
      this.isInitialized = true;
      this.logger.info('Hive bridge initialized', {
        toolCount: this.availableTools.length,
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize Hive bridge', { error });
      
      if (!this.config.fallbackMode) {
        throw error;
      }
      
      // Fall back to mock mode
      this.logger.warn('Using fallback mode with simulated data');
      this.isInitialized = true;
    }
  }
  
  /**
   * Discover available tools from Hive MCP
   */
  /**
   * Connect to Hive MCP server
   * Currently using direct API calls until MCP SDK is fully configured
   */
  private async connectToHiveMCP(): Promise<void> {
    // MCP connection will be implemented when SDK is properly configured
    // For now, we'll use direct API calls
    this.logger.info('Using direct API connection to Hive Intelligence');
    this.mcpClient = undefined;
    
    // TODO: Implement actual MCP connection when SDK is available
    // This would involve:
    // 1. WebSocket connection to Hive MCP server
    // 2. Stdio connection as fallback
    // 3. Tool discovery and registration
  }
  
  private async discoverTools(): Promise<void> {
    // Try to get tools from MCP server
    if (this.mcpClient) {
      try {
        const tools = await this.mcpClient.listTools();
        if (tools && tools.tools) {
          this.availableTools = tools.tools;
          this.logger.info(`Discovered ${this.availableTools.length} tools from Hive MCP`);
          return;
        }
      } catch (error) {
        this.logger.warn('Failed to list tools from MCP', { error });
      }
    }
    
    // Fallback to known Hive tools
    this.availableTools = [
      {
        name: 'hive_token_data',
        description: 'Get real-time token data from Hive Intelligence',
        inputSchema: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            network: { type: 'string' },
          },
          required: ['address', 'network'],
        },
      },
      {
        name: 'hive_security_scan',
        description: 'Perform security analysis using Hive Intelligence',
        inputSchema: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            network: { type: 'string' },
          },
          required: ['address', 'network'],
        },
      },
      {
        name: 'hive_whale_activity',
        description: 'Track whale wallet activity',
        inputSchema: {
          type: 'object',
          properties: {
            wallet: { type: 'string' },
            timeframe: { type: 'string' },
          },
          required: ['wallet'],
        },
      },
      {
        name: 'hive_social_sentiment',
        description: 'Analyze social sentiment',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: { type: 'string' },
            platforms: { type: 'array', items: { type: 'string' } },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'hive_alpha_signals',
        description: 'Find alpha opportunities',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            risk: { type: 'string' },
          },
        },
      },
    ];
    
    this.logger.debug('Discovered Hive tools', {
      tools: this.availableTools.map(t => t.name),
    });
  }
  
  /**
   * Call a Hive MCP tool
   */
  public async callTool(name: string, args: Record<string, any>): Promise<HiveResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Check cache first
    const cacheKey = this.getCacheKey(name, args);
    const cachedResult = this.cache.get<any>(cacheKey);
    
    if (cachedResult) {
      this.logger.debug('Cache hit for Hive tool', { tool: name });
      return {
        success: true,
        data: cachedResult,
        cached: true,
      };
    }
    
    try {
      this.logger.info('Calling Hive tool', { tool: name, args });
      
      let result: any;
      
      // Try MCP client first
      if (this.mcpClient) {
        try {
          const response = await this.mcpClient.callTool({ name, arguments: args });
          result = response.content;
        } catch (error) {
          this.logger.warn('MCP tool call failed, trying direct API', { tool: name, error });
          result = await this.callHiveAPI(name, args);
        }
      } else {
        // Use direct API calls as fallback
        result = await this.callHiveAPI(name, args);
      }
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return {
        success: true,
        data: result,
        cached: false,
      };
      
    } catch (error) {
      this.logger.error('Hive tool call failed', { tool: name, error });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Analyze a token using Hive data
   */
  public async analyze(context: any): Promise<any> {
    // This is called by agents to get Hive data
    // It routes to appropriate Hive tools
    
    const { network, address, symbol } = context;
    
    if (address) {
      // Get token data from Hive
      const tokenData = await this.callTool('hive_token_data', {
        address,
        network: network || 'ethereum',
      });
      
      const securityData = await this.callTool('hive_security_scan', {
        address,
        network: network || 'ethereum',
      });
      
      return {
        token: tokenData.data,
        security: securityData.data,
      };
    }
    
    if (symbol) {
      // Get sentiment data
      const sentimentData = await this.callTool('hive_social_sentiment', {
        symbol,
        platforms: ['twitter', 'telegram', 'reddit'],
      });
      
      return {
        sentiment: sentimentData.data,
      };
    }
    
    // Get alpha signals
    const alphaData = await this.callTool('hive_alpha_signals', {
      category: context.category || 'all',
      risk: context.risk || 'medium',
    });
    
    return {
      opportunities: alphaData.data,
    };
  }
  
  /**
   * Get available Hive tools
   */
  public getAvailableTools(): Tool[] {
    return [...this.availableTools];
  }
  
  /**
   * Check if Hive bridge is healthy
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // Try a simple tool call
      const result = await this.callTool('hive_token_data', {
        address: '0x0000000000000000000000000000000000000000',
        network: 'ethereum',
      });
      
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Execute a tool call (alias for callTool for IHiveService compatibility)
   */
  public async execute(tool: string, params?: Record<string, any>): Promise<HiveResponse> {
    return this.callTool(tool, params || {});
  }

  /**
   * Make a request (alias for callTool for IHiveService compatibility)
   */
  public async request(endpoint: string, params?: Record<string, any>): Promise<HiveResponse> {
    return this.callTool(endpoint, params || {});
  }
  
  // Private methods
  
  private getCacheKey(tool: string, args: Record<string, any>): string {
    return `hive:${tool}:${JSON.stringify(args)}`;
  }
  
  /**
   * Call Hive API directly (fallback when MCP is not available)
   */
  private async callHiveAPI(tool: string, args: Record<string, any>): Promise<any> {
    // Map tool names to API endpoints
    const toolEndpointMap: Record<string, string> = {
      'hive_token_data': '/api/v1/token',
      'hive_security_scan': '/api/v1/security',
      'hive_whale_activity': '/api/v1/whale',
      'hive_social_sentiment': '/api/v1/sentiment',
      'hive_alpha_signals': '/api/v1/alpha',
      'hive_defi_opportunities': '/api/v1/defi',
      'hive_nft_analysis': '/api/v1/nft',
      'hive_market_structure': '/api/v1/market',
      'hive_cross_chain': '/api/v1/bridge',
      'hive_governance': '/api/v1/governance',
    };
    
    const endpoint = toolEndpointMap[tool];
    if (!endpoint) {
      throw new Error(`Unknown Hive tool: ${tool}`);
    }
    
    try {
      const response = await this.axiosClient.post(endpoint, args);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // If API is not available, return structured fallback data
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          this.logger.warn('Hive API not reachable, returning minimal fallback data');
          return this.getMinimalFallbackData(tool, args);
        }
        throw new Error(`Hive API error: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Get minimal fallback data when Hive is completely unavailable
   * This ensures the system can still function for testing
   */
  private getMinimalFallbackData(tool: string, args: Record<string, any>): any {
    // Return minimal valid structures that agents expect
    switch (tool) {
      case 'hive_token_data':
        return {
          address: args.address,
          network: args.network,
          symbol: 'UNKNOWN',
          name: 'Unknown Token',
          price: 0,
          marketCap: 0,
          volume24h: 0,
          holders: 0,
          liquidity: 0,
          error: 'Hive API unavailable',
        };
      
      case 'hive_security_scan':
        return {
          address: args.address,
          network: args.network,
          score: 0,
          verdict: 'UNKNOWN',
          risks: ['API unavailable'],
          contractVerified: false,
          liquidityLocked: false,
          ownershipRenounced: false,
          recommendations: ['Unable to analyze - Hive API unavailable'],
          error: 'Hive API unavailable',
        };
      
      case 'hive_whale_activity':
        return {
          wallet: args.wallet,
          isWhale: false,
          balance: 0,
          recentTransactions: [],
          walletType: 'unknown',
          whaleActivity: 0,
          error: 'Hive API unavailable',
        };
      
      case 'hive_social_sentiment':
        return {
          symbol: args.symbol,
          overall: 'neutral',
          score: 0,
          sentimentScore: 0,
          platforms: {},
          trending: false,
          error: 'Hive API unavailable',
        };
      
      case 'hive_alpha_signals':
        return {
          opportunities: [],
          category: args.category,
          risk: args.risk,
          error: 'Hive API unavailable',
        };
      
      default:
        return {
          error: 'Hive API unavailable',
          tool: tool,
          args: args,
        };
    }
  }
}