/**
 * Direct HTTP MCP Client for Hive Intelligence
 * This client connects to Hive's MCP endpoint using the correct protocol
 * No API key required - public access
 */

import axios, { AxiosInstance } from 'axios';
import winston from 'winston';
import NodeCache from 'node-cache';

export interface HiveMCPConfig {
  mcpServerUrl?: string;
  cacheTTL?: number;
  timeout?: number;
  maxRetries?: number;
  logLevel?: string;
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
  params: Record<string, unknown>;
}

// Removed unused interface - responses are parsed as any

/**
 * Direct MCP Client for Hive Intelligence
 * Connects directly to https://hiveintelligence.xyz/mcp
 * No API key required - uses public MCP endpoint
 */
export class HiveMCPDirectClient {
  private readonly httpClient: AxiosInstance;
  private readonly cache: NodeCache;
  private readonly logger: winston.Logger;
  private readonly config: Required<HiveMCPConfig>;
  private requestId: number = 0;

  constructor(config?: HiveMCPConfig) {
    this.config = {
      mcpServerUrl: config?.mcpServerUrl || 'https://hiveintelligence.xyz/mcp',
      cacheTTL: config?.cacheTTL || 3600,
      timeout: config?.timeout || 30000,
      maxRetries: config?.maxRetries || 3,
      logLevel: config?.logLevel || process.env.LOG_LEVEL || 'info',
    };

    // Initialize HTTP client with correct headers for MCP
    this.httpClient = axios.create({
      baseURL: this.config.mcpServerUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream', // Required for Hive MCP
      },
      validateStatus: (status) => status < 500,
    });

    // Initialize logger
    this.logger = winston.createLogger({
      level: this.config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'HiveMCPDirectClient' },
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

    this.logger.info('HiveMCPDirectClient initialized', {
      mcpServerUrl: this.config.mcpServerUrl,
    });
  }

  /**
   * Parse Server-Sent Events (SSE) response from Hive MCP
   */
  private parseSSEResponse(data: string): any {
    // Split by double newline to get individual events
    const events = data.split('\n\n');
    
    for (const event of events) {
      // Look for data: line
      const lines = event.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6);
          try {
            return JSON.parse(jsonStr);
          } catch (e) {
            this.logger.debug('Failed to parse SSE data line', { line, error: e });
          }
        }
      }
    }
    
    // If no SSE format, try parsing as plain JSON
    try {
      return JSON.parse(data);
    } catch (e) {
      this.logger.error('Failed to parse MCP response', { data, error: e });
      throw new Error('Invalid MCP response format');
    }
  }

  /**
   * List available tools from Hive MCP
   */
  public async listTools(): Promise<any[]> {
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/list',
      params: {},
    };

    try {
      const response = await this.httpClient.post('', request, {
        responseType: 'text', // Get raw text to handle SSE format
      });

      const parsed = this.parseSSEResponse(response.data);
      
      if (parsed.error) {
        throw new Error(`MCP Error: ${parsed.error.message}`);
      }

      return parsed.result?.tools || [];
    } catch (error) {
      this.logger.error('Failed to list tools', { error });
      throw error;
    }
  }

  /**
   * Get API endpoint schema
   */
  public async getEndpointSchema(endpoint: string): Promise<any> {
    return this.callTool('get_api_endpoint_schema', { endpoint });
  }

  /**
   * Get available endpoints by category
   */
  public async getEndpointsByCategory(category: string): Promise<any> {
    const categoryMap: Record<string, string> = {
      'market': 'get_market_and_price_endpoints',
      'dex': 'get_onchain_dex_pool_endpoints',
      'portfolio': 'get_portfolio_wallet_endpoints',
      'token': 'get_token_contract_endpoints',
      'defi': 'get_defi_protocol_endpoints',
      'nft': 'get_nft_analytics_endpoints',
      'security': 'get_security_risk_endpoints',
      'network': 'get_network_infrastructure_endpoints',
      'search': 'get_search_discovery_endpoints',
      'social': 'get_social_sentiment_endpoints',
    };

    const toolName = categoryMap[category.toLowerCase()] || `get_${category}_endpoints`;
    return this.callTool(toolName, {});
  }

  /**
   * Invoke a Hive API endpoint through MCP
   */
  public async invokeEndpoint(
    endpointName: string,
    args: Record<string, unknown>,
  ): Promise<HiveMCPResponse> {
    return this.callTool('invoke_api_endpoint', {
      endpoint_name: endpointName,
      args,
    });
  }

  /**
   * Call a tool on the Hive MCP server
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

    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: parameters,
      },
    };

    try {
      this.logger.info('Calling Hive MCP tool', { toolName, parameters });

      const response = await this.executeWithRetry(async () => {
        const res = await this.httpClient.post('', request, {
          responseType: 'text',
        });

        if (res.status !== 200) {
          throw new Error(`MCP server returned status ${res.status}`);
        }

        return this.parseSSEResponse(res.data);
      });

      if (response.error) {
        throw new Error(`MCP Error: ${response.error.message}`);
      }

      const result = response.result;

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
   * Get token information using Hive API
   */
  public async getTokenInfo(params: {
    network: string;
    address: string;
  }): Promise<HiveMCPResponse> {
    // First, get the schema for the token endpoint (for reference)
    await this.getEndpointSchema('token_info');
    
    // Then invoke the endpoint with proper parameters
    return this.invokeEndpoint('token_info', params);
  }

  /**
   * Get security analysis for a token
   */
  public async getSecurityAnalysis(params: {
    network: string;
    address: string;
  }): Promise<HiveMCPResponse> {
    return this.invokeEndpoint('token_security', params);
  }

  /**
   * Search for tokens
   */
  public async searchTokens(query: string): Promise<HiveMCPResponse> {
    return this.invokeEndpoint('search', { query });
  }

  /**
   * Get trending tokens
   */
  public async getTrendingTokens(): Promise<HiveMCPResponse> {
    return this.invokeEndpoint('trending', {});
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const tools = await this.listTools();
      return tools.length > 0;
    } catch (error) {
      this.logger.warn('Health check failed', { error });
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
    tools?: number;
  }> {
    const startTime = Date.now();

    try {
      const tools = await this.listTools();

      return {
        connected: true,
        latency: Date.now() - startTime,
        tools: tools.length,
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
export const hiveMCPDirectClient = new HiveMCPDirectClient();