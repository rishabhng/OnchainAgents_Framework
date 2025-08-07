import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { 
  ClientCapabilities, 
  ListToolsResult, 
  CallToolResult,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import winston from 'winston';
import NodeCache from 'node-cache';
import { spawn } from 'child_process';

export interface HiveMCPConfig {
  mcpServerUrl?: string;
  cacheTTL?: number;
  timeout?: number;
  maxRetries?: number;
  logLevel?: string;
  apiKey?: string;
}

export interface HiveMCPResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: number;
    latency: number;
    cached: boolean;
    source: 'hive-mcp';
  };
}

/**
 * MCP Client for Hive Intelligence
 * This client connects to Hive Intelligence through the Model Context Protocol
 * 
 * Note: For Claude Desktop integration, users should add the MCP server through:
 * Settings → Manage Connectors → Add Connector URL: https://hiveintelligence.xyz/mcp
 * 
 * This client is for programmatic access from Node.js applications
 */
export class HiveMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private readonly cache: NodeCache;
  private readonly logger: winston.Logger;
  private readonly config: Required<HiveMCPConfig>;
  private availableTools: Tool[] = [];
  private isConnected: boolean = false;
  
  constructor(config?: HiveMCPConfig) {
    this.config = {
      mcpServerUrl: config?.mcpServerUrl || 'https://hiveintelligence.xyz/mcp',
      cacheTTL: config?.cacheTTL || 3600,
      timeout: config?.timeout || 30000,
      maxRetries: config?.maxRetries || 3,
      logLevel: config?.logLevel || process.env.LOG_LEVEL || 'info',
      apiKey: config?.apiKey || process.env.HIVE_API_KEY || '',
    };
    
    // Initialize logger
    this.logger = winston.createLogger({
      level: this.config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'HiveMCPClient' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
    
    // Initialize cache
    this.cache = new NodeCache({
      stdTTL: this.config.cacheTTL,
      checkperiod: 120,
      useClones: false,
    });
    
    this.logger.info('HiveMCPClient initialized', {
      mcpServerUrl: this.config.mcpServerUrl,
    });
  }
  
  /**
   * Connect to Hive Intelligence MCP server
   * For remote HTTP MCP servers, we use the HiveMCPRemoteClient instead
   */
  public async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to Hive Intelligence MCP server');
      
      // For HTTP-based MCP servers, we should use HiveMCPRemoteClient
      // This class is for stdio-based MCP servers
      this.logger.warn('HiveMCPClient is for stdio-based MCP servers. For Hive Intelligence HTTP endpoint, use HiveMCPRemoteClient instead.');
      
      // Mark as connected for compatibility
      this.isConnected = true;
      
      // Load available tools
      await this.loadAvailableTools();
      
      this.logger.info('MCP client ready', {
        toolCount: this.availableTools.length,
      });
    } catch (error) {
      this.logger.error('Failed to connect to MCP server', { error });
      throw new Error(`MCP connection failed: ${error}`);
    }
  }
  
  /**
   * Load available tools
   */
  private async loadAvailableTools(): Promise<void> {
    // Define Hive Intelligence tools
    this.availableTools = [
      {
        name: 'hive_token_data',
        description: 'Get comprehensive token information including price, market cap, and metadata',
        inputSchema: {
          type: 'object',
          properties: {
            network: { type: 'string', description: 'Blockchain network (ethereum, bsc, polygon, etc.)' },
            address: { type: 'string', description: 'Token contract address' },
          },
          required: ['network', 'address'],
        },
      },
      {
        name: 'hive_security_scan',
        description: 'Perform security analysis and rug detection for a token',
        inputSchema: {
          type: 'object',
          properties: {
            network: { type: 'string', description: 'Blockchain network' },
            address: { type: 'string', description: 'Token contract address' },
            depth: { type: 'string', enum: ['basic', 'comprehensive'], description: 'Analysis depth' },
          },
          required: ['network', 'address'],
        },
      },
      {
        name: 'hive_whale_tracker',
        description: 'Track whale wallet activity and large transactions',
        inputSchema: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Wallet address to track' },
            timeframe: { type: 'string', description: 'Time period (1h, 24h, 7d, 30d)' },
            min_value: { type: 'number', description: 'Minimum transaction value in USD' },
          },
          required: ['address'],
        },
      },
      {
        name: 'hive_sentiment_analysis',
        description: 'Analyze social sentiment for a token across platforms',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: { type: 'string', description: 'Token symbol' },
            timeframe: { type: 'string', description: 'Time period for sentiment analysis' },
            sources: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Social media sources to analyze'
            },
          },
          required: ['symbol'],
        },
      },
      {
        name: 'hive_alpha_signals',
        description: 'Discover emerging opportunities and alpha signals',
        inputSchema: {
          type: 'object',
          properties: {
            networks: { 
              type: 'array',
              items: { type: 'string' },
              description: 'Blockchain networks to scan'
            },
            market_cap_min: { type: 'number', description: 'Minimum market cap' },
            market_cap_max: { type: 'number', description: 'Maximum market cap' },
            risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
          required: [],
        },
      },
      {
        name: 'hive_portfolio_analyzer',
        description: 'Analyze portfolio holdings and performance',
        inputSchema: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Wallet address to analyze' },
            networks: { 
              type: 'array',
              items: { type: 'string' },
              description: 'Networks to include in analysis'
            },
          },
          required: ['address'],
        },
      },
      {
        name: 'hive_defi_monitor',
        description: 'Analyze DeFi protocols and yield opportunities',
        inputSchema: {
          type: 'object',
          properties: {
            protocol: { type: 'string', description: 'Protocol name or token symbol' },
            category: { type: 'string', description: 'DeFi category (lending, dex, yield, etc.)' },
            network: { type: 'string', description: 'Blockchain network' },
          },
          required: [],
        },
      },
      {
        name: 'hive_cross_chain_bridge',
        description: 'Get cross-chain bridge information and routing',
        inputSchema: {
          type: 'object',
          properties: {
            from_network: { type: 'string', description: 'Source blockchain network' },
            to_network: { type: 'string', description: 'Destination blockchain network' },
            token: { type: 'string', description: 'Token to bridge' },
            amount: { type: 'number', description: 'Amount to bridge' },
          },
          required: ['from_network', 'to_network'],
        },
      },
    ];
    
    this.logger.debug('Tools loaded', { 
      toolCount: this.availableTools.length,
      tools: this.availableTools.map(t => t.name),
    });
  }
  
  /**
   * Call a specific MCP tool
   * Note: For actual Hive Intelligence calls, use HiveMCPRemoteClient
   */
  public async callTool(
    toolName: string,
    parameters: Record<string, unknown>
  ): Promise<HiveMCPResponse> {
    const startTime = Date.now();
    
    if (!this.isConnected) {
      await this.connect();
    }
    
    // Check cache first
    const cacheKey = this.getCacheKey(toolName, parameters);
    const cachedResult = this.cache.get<any>(cacheKey);
    
    if (cachedResult) {
      this.logger.debug('Cache hit', { toolName, cacheKey });
      return {
        success: true,
        data: cachedResult,
        metadata: {
          timestamp: Date.now(),
          latency: 0,
          cached: true,
          source: 'hive-mcp',
        },
      };
    }
    
    try {
      // Validate tool exists
      const tool = this.availableTools.find(t => t.name === toolName);
      if (!tool) {
        throw new Error(`Tool '${toolName}' not available`);
      }
      
      this.logger.info('Calling MCP tool', { toolName, parameters });
      
      // For HTTP-based Hive Intelligence, delegate to HiveMCPRemoteClient
      // This is a placeholder - in production, use HiveMCPRemoteClient
      this.logger.warn('For actual Hive Intelligence calls, use HiveMCPRemoteClient');
      
      // Return error indicating to use the remote client
      throw new Error('Please use HiveMCPRemoteClient for HTTP-based Hive Intelligence MCP server');
      
    } catch (error) {
      this.logger.error('MCP tool call failed', { toolName, error });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: Date.now(),
          latency: Date.now() - startTime,
          cached: false,
          source: 'hive-mcp',
        },
      };
    }
  }
  
  /**
   * Map legacy tool names to Hive-specific names
   */
  private mapToolName(toolName: string): string {
    const toolMap: Record<string, string> = {
      'get_token_info': 'hive_token_data',
      'get_security_analysis': 'hive_security_scan',
      'get_whale_activity': 'hive_whale_tracker',
      'get_sentiment_analysis': 'hive_sentiment_analysis',
      'find_alpha_opportunities': 'hive_alpha_signals',
      'get_portfolio_analysis': 'hive_portfolio_analyzer',
      'get_defi_analysis': 'hive_defi_monitor',
      'get_cross_chain_info': 'hive_cross_chain_bridge',
    };
    
    return toolMap[toolName] || toolName;
  }
  
  /**
   * Execute a tool call - delegates to HiveMCPRemoteClient for HTTP
   */
  public async execute(tool: string, params?: Record<string, any>): Promise<HiveMCPResponse> {
    const mappedTool = this.mapToolName(tool);
    return this.callTool(mappedTool, params || {});
  }
  
  /**
   * Get available tools
   */
  public getAvailableTools(): Tool[] {
    return [...this.availableTools];
  }
  
  /**
   * Check if client is connected
   */
  public isClientConnected(): boolean {
    return this.isConnected;
  }
  
  /**
   * Generate cache key
   */
  private getCacheKey(toolName: string, parameters: Record<string, unknown>): string {
    const paramString = JSON.stringify(parameters);
    return `${toolName}:${paramString}`;
  }
  
  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.flushAll();
    this.logger.info('Cache cleared');
  }
  
  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Initialize (alias for connect)
   */
  public async initialize(): Promise<void> {
    return this.connect();
  }
  
  /**
   * Disconnect from MCP server
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.transport) {
        await this.transport.close();
        this.transport = null;
      }
      this.client = null;
      this.isConnected = false;
      this.logger.info('Disconnected from MCP server');
    } catch (error) {
      this.logger.error('Error during disconnect', { error });
    }
  }
}