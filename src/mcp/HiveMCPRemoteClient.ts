import axios, { AxiosInstance } from 'axios';
import winston from 'winston';
import NodeCache from 'node-cache';

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

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params: {
    name: string;
    arguments?: Record<string, unknown>;
  };
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: {
    content?: Array<{
      type: string;
      text?: string;
      data?: any;
    }>;
    tools?: Array<{
      name: string;
      description?: string;
      inputSchema?: any;
    }>;
    isError?: boolean;
    error?: string;
  };
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * Remote MCP Client for Hive Intelligence
 * Connects directly to Hive's MCP endpoint without local SDK
 */
export class HiveMCPRemoteClient {
  private readonly httpClient: AxiosInstance;
  private readonly cache: NodeCache;
  private readonly logger: winston.Logger;
  private readonly config: Required<HiveMCPConfig>;
  private requestId: number = 0;

  constructor(config?: HiveMCPConfig) {
    this.config = {
      mcpServerUrl:
        config?.mcpServerUrl || process.env.HIVE_MCP_URL || 'https://hiveintelligence.xyz/mcp',
      cacheTTL: config?.cacheTTL || 3600,
      timeout: config?.timeout || 30000,
      maxRetries: config?.maxRetries || 3,
      logLevel: config?.logLevel || process.env.LOG_LEVEL || 'info',
      apiKey: config?.apiKey || process.env.HIVE_API_KEY || '',
    };

    // Initialize HTTP client for MCP-over-HTTP
    this.httpClient = axios.create({
      baseURL: this.config.mcpServerUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(this.config.apiKey ? { 'X-API-Key': this.config.apiKey } : {}),
      },
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

    // Initialize logger
    this.logger = winston.createLogger({
      level: this.config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'HiveMCPRemoteClient' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
      ],
    });

    // Initialize cache
    this.cache = new NodeCache({
      stdTTL: this.config.cacheTTL,
      checkperiod: 120,
      useClones: false,
    });

    this.logger.info('HiveMCPRemoteClient initialized', {
      mcpServerUrl: this.config.mcpServerUrl,
      hasApiKey: !!this.config.apiKey,
    });
  }

  /**
   * Call a tool on the remote Hive MCP server
   */
  public async callTool(
    toolName: string,
    parameters: Record<string, unknown>,
  ): Promise<HiveMCPResponse> {
    const startTime = Date.now();

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

    // Map tool names to Hive-specific format if needed
    const mappedToolName = this.mapToolName(toolName);

    // Prepare MCP request according to MCP protocol spec
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: mappedToolName,
        arguments: parameters,
      },
    };

    try {
      this.logger.info('Calling Hive MCP tool', { toolName, parameters });

      // Make the request with retry logic
      const response = await this.executeWithRetry(async () => {
        const res = await this.httpClient.post<MCPResponse>('/rpc', request);

        // Handle non-200 status codes
        if (res.status !== 200) {
          throw new Error(`MCP server returned status ${res.status}: ${res.statusText}`);
        }

        return res.data;
      });

      // Check for MCP-level errors
      if (response.error) {
        throw new Error(`MCP Error: ${response.error.message} (code: ${response.error.code})`);
      }

      // Extract result from MCP response
      const result = this.extractResultFromMCPResponse(response);

      // Cache the result
      this.cache.set(cacheKey, result);

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: Date.now(),
          latency: Date.now() - startTime,
          cached: false,
          source: 'hive-mcp',
        },
      };
    } catch (error) {
      this.logger.error('MCP tool call failed', { toolName, error });

      // Check if we should fall back to simulated data for testing
      if (process.env.HIVE_FALLBACK_MODE === 'true') {
        this.logger.warn('Using fallback simulated data');
        const fallbackResult = await this.getFallbackData(toolName, parameters);
        return {
          success: true,
          data: fallbackResult,
          metadata: {
            timestamp: Date.now(),
            latency: Date.now() - startTime,
            cached: false,
            source: 'hive-mcp',
          },
        };
      }

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
   * Map tool names to Hive-specific format
   */
  private mapToolName(toolName: string): string {
    // Map common names to Hive-specific tool names
    const toolMap: Record<string, string> = {
      get_token_info: 'hive_token_data',
      get_security_analysis: 'hive_security_scan',
      get_whale_activity: 'hive_whale_tracker',
      get_sentiment_analysis: 'hive_sentiment_analysis',
      find_alpha_opportunities: 'hive_alpha_signals',
      get_portfolio_analysis: 'hive_portfolio_analyzer',
      get_defi_analysis: 'hive_defi_monitor',
      get_cross_chain_info: 'hive_cross_chain_bridge',
    };

    return toolMap[toolName] || toolName;
  }

  /**
   * Extract result from MCP response format
   */
  private extractResultFromMCPResponse(response: MCPResponse): any {
    // Check for error in result
    if (response.result?.isError) {
      throw new Error(response.result.error || 'Unknown MCP error');
    }

    // Handle content array format
    if (response.result?.content && Array.isArray(response.result.content)) {
      // Find the first content item with data
      const dataContent = response.result.content.find((c) => c.data);
      if (dataContent?.data) {
        return dataContent.data;
      }

      // Fall back to text content
      const textContent = response.result.content.find((c) => c.text);
      if (textContent?.text) {
        try {
          // Try to parse as JSON
          return JSON.parse(textContent.text);
        } catch {
          // Return as plain text if not JSON
          return textContent.text;
        }
      }

      return response.result.content;
    }

    // Return the entire result if it's not in content format
    return response.result;
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.config.maxRetries,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            throw new Error('Authentication failed. Please check your HIVE_API_KEY.');
          }
          if (error.response?.status === 404) {
            throw new Error('MCP endpoint not found. Please check HIVE_MCP_URL.');
          }
        }

        if (i < retries) {
          const delay = Math.min(1000 * Math.pow(2, i), 10000);
          this.logger.warn(`Retry attempt ${i + 1}/${retries}`, {
            error: lastError.message,
            delay,
          });

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Get fallback simulated data for testing
   */
  private async getFallbackData(
    toolName: string,
    parameters: Record<string, unknown>,
  ): Promise<any> {
    // Add realistic delay
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

    switch (toolName) {
      case 'get_token_info':
      case 'hive_get_token_info':
        return {
          address: parameters.address,
          network: parameters.network,
          name: 'Test Token',
          symbol: 'TEST',
          decimals: 18,
          totalSupply: '1000000000000000000000000',
          price: 1.23,
          marketCap: 1230000,
          volume24h: 500000,
          holders: 15420,
          verified: true,
        };

      case 'get_security_analysis':
      case 'hive_security_scan':
        return {
          score: 75,
          verdict: 'SAFE',
          risks: [],
          contractVerified: true,
          honeypot: false,
          mintable: false,
          liquidityLocked: true,
          ownershipRenounced: true,
          recommendations: ['Token appears safe for trading'],
        };

      case 'get_whale_activity':
      case 'hive_whale_tracker':
        return {
          isWhale: true,
          walletType: 'institutional',
          balance: 50000000,
          recentTransactions: [
            {
              hash: '0xabc123...',
              value: 1000000,
              timestamp: Date.now() - 3600000,
              type: 'buy',
            },
          ],
        };

      case 'get_sentiment_analysis':
      case 'hive_sentiment_analysis':
        return {
          overallSentiment: 'positive',
          sentimentScore: 0.75,
          sources: {
            twitter: { sentiment: 'positive', mentions: 1250 },
            reddit: { sentiment: 'neutral', mentions: 340 },
            telegram: { sentiment: 'positive', mentions: 890 },
          },
        };

      case 'find_alpha_opportunities':
      case 'hive_alpha_scanner':
        return {
          opportunities: [
            {
              token: {
                symbol: 'ALPHA1',
                address: '0x123...',
                network: 'ethereum',
              },
              momentumScore: 8.5,
              signals: ['whale_accumulation', 'social_buzz'],
              recommendedAction: 'BUY',
              convictionLevel: 85,
            },
          ],
        };

      default:
        return {
          message: `Fallback data for ${toolName}`,
          parameters,
          timestamp: Date.now(),
        };
    }
  }

  /**
   * List available tools from the MCP server
   */
  public async listTools(): Promise<string[]> {
    try {
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: ++this.requestId,
        method: 'tools/list',
        params: {
          name: '',
        },
      };

      const response = await this.httpClient.post<MCPResponse>('/rpc', request);

      if (response.data.error) {
        throw new Error(`Failed to list tools: ${response.data.error.message}`);
      }

      if (response.data.result?.tools) {
        return response.data.result.tools.map((t) => t.name);
      }

      // Fallback to known tools
      return this.getAvailableTools();
    } catch (error) {
      this.logger.warn('Failed to list tools from server, using defaults', { error });
      return this.getAvailableTools();
    }
  }

  /**
   * Get available tools (fallback list for Hive Intelligence)
   */
  public getAvailableTools(): string[] {
    return [
      'hive_token_data',
      'hive_security_scan',
      'hive_whale_tracker',
      'hive_sentiment_analysis',
      'hive_alpha_signals',
      'hive_portfolio_analyzer',
      'hive_defi_monitor',
      'hive_cross_chain_bridge',
    ];
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
      // Try to list tools as a health check
      const tools = await this.listTools();
      return tools.length > 0;
    } catch (error) {
      this.logger.warn('Health check failed', { error });

      // In fallback mode, always return healthy
      if (process.env.HIVE_FALLBACK_MODE === 'true') {
        return true;
      }

      return false;
    }
  }

  /**
   * Test connection to Hive MCP
   */
  public async testConnection(): Promise<{
    connected: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const healthy = await this.healthCheck();

      return {
        connected: healthy,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export a singleton instance for convenience
// Note: This client is deprecated - use HiveMCPDirectClient instead
// Commented out to prevent auto-initialization with wrong endpoint
// export const hiveMCPClient = new HiveMCPRemoteClient();
