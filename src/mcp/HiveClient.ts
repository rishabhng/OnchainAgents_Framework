import axios, { AxiosInstance, AxiosError } from 'axios';
import NodeCache from 'node-cache';
import winston from 'winston';
import PQueue from 'p-queue';

export interface HiveConfig {
  apiKey?: string;
  apiUrl?: string;
  maxConcurrent?: number;
  rateLimitPerMinute?: number;
  cacheTTL?: number;
  timeout?: number;
}

export interface HiveEndpoint {
  category: string;
  endpoint: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface HiveResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: number;
    latency: number;
    cached: boolean;
  };
}

export class HiveClient {
  private readonly axiosClient: AxiosInstance;
  private readonly cache: NodeCache;
  private readonly logger: winston.Logger;
  private readonly queue: PQueue;
  private readonly config: Required<HiveConfig>;
  
  constructor(config?: HiveConfig) {
    this.config = {
      apiKey: config?.apiKey || process.env.HIVE_API_KEY || '',
      apiUrl: config?.apiUrl || process.env.HIVE_API_URL || 'https://api.hiveintelligence.xyz',
      maxConcurrent: config?.maxConcurrent || 10,
      rateLimitPerMinute: config?.rateLimitPerMinute || 60,
      cacheTTL: config?.cacheTTL || 3600,
      timeout: config?.timeout || 30000,
    };
    
    if (!this.config.apiKey) {
      throw new Error('Hive API key is required. Set HIVE_API_KEY environment variable or pass in config.');
    }
    
    this.axiosClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'OnChainAgents/1.0',
      },
    });
    
    this.cache = new NodeCache({
      stdTTL: this.config.cacheTTL,
      checkperiod: 120,
      useClones: false,
    });
    
    this.queue = new PQueue({
      concurrency: this.config.maxConcurrent,
      interval: 60000,
      intervalCap: this.config.rateLimitPerMinute,
    });
    
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'HiveClient' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
    
    this.setupInterceptors();
    this.logger.info('HiveClient initialized');
  }
  
  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosClient.interceptors.request.use(
      (config) => {
        this.logger.debug('API Request', {
          method: config.method,
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        this.logger.error('Request Error', { error });
        return Promise.reject(error);
      },
    );
    
    // Response interceptor
    this.axiosClient.interceptors.response.use(
      (response) => {
        this.logger.debug('API Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: AxiosError) => {
        this.logger.error('Response Error', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });
        return Promise.reject(error);
      },
    );
  }
  
  /**
   * Make API request with caching and rate limiting
   */
  public async request<T>(
    endpoint: string,
    params?: Record<string, unknown>,
  ): Promise<HiveResponse<T>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(endpoint, params);
    
    // Check cache
    const cachedData = this.cache.get<T>(cacheKey);
    if (cachedData) {
      this.logger.debug('Cache hit', { endpoint, cacheKey });
      return {
        success: true,
        data: cachedData,
        metadata: {
          timestamp: Date.now(),
          latency: 0,
          cached: true,
        },
      };
    }
    
    // Queue the request
    return this.queue.add(async () => {
      try {
        const response = await this.axiosClient.get<T>(endpoint, { params });
        
        // Cache successful response
        this.cache.set(cacheKey, response.data);
        
        return {
          success: true,
          data: response.data,
          metadata: {
            timestamp: Date.now(),
            latency: Date.now() - startTime,
            cached: false,
          },
        };
      } catch (error) {
        const axiosError = error as AxiosError;
        
        return {
          success: false,
          error: axiosError.message,
          metadata: {
            timestamp: Date.now(),
            latency: Date.now() - startTime,
            cached: false,
          },
        };
      }
    }) as Promise<HiveResponse<T>>;
  }
  
  /**
   * Get available endpoints by category
   */
  public async getEndpoints(category: string): Promise<HiveEndpoint[]> {
    const response = await this.request<HiveEndpoint[]>(`/endpoints/${category}`);
    return response.data || [];
  }
  
  /**
   * Market and Price endpoints
   */
  public async getMarketData(params: {
    symbols?: string[];
    vs_currency?: string;
  }): Promise<HiveResponse> {
    return this.request('/market/prices', params);
  }
  
  /**
   * Token and Contract endpoints
   */
  public async getTokenInfo(params: {
    network: string;
    address: string;
  }): Promise<HiveResponse> {
    return this.request('/token/info', params);
  }
  
  /**
   * Security and Risk endpoints
   */
  public async getSecurityAnalysis(params: {
    network: string;
    address: string;
  }): Promise<HiveResponse> {
    return this.request('/security/analysis', params);
  }
  
  /**
   * DeFi Protocol endpoints
   */
  public async getDeFiProtocols(params?: {
    chain?: string;
    category?: string;
  }): Promise<HiveResponse> {
    return this.request('/defi/protocols', params);
  }
  
  /**
   * On-chain DEX and Pool endpoints
   */
  public async getDEXPools(params: {
    network: string;
    dex?: string;
    token?: string;
  }): Promise<HiveResponse> {
    return this.request('/dex/pools', params);
  }
  
  /**
   * Portfolio and Wallet endpoints
   */
  public async getWalletBalance(params: {
    network: string;
    address: string;
  }): Promise<HiveResponse> {
    return this.request('/wallet/balance', params);
  }
  
  /**
   * Social Media and Sentiment endpoints
   */
  public async getSentiment(params: {
    symbol: string;
    timeframe?: string;
  }): Promise<HiveResponse> {
    return this.request('/sentiment/analysis', params);
  }
  
  /**
   * NFT Analytics endpoints
   */
  public async getNFTCollection(params: {
    collection: string;
    network?: string;
  }): Promise<HiveResponse> {
    return this.request('/nft/collection', params);
  }
  
  /**
   * Generate cache key from endpoint and params
   */
  private getCacheKey(
    endpoint: string,
    params?: Record<string, unknown>,
  ): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramString}`;
  }
  
  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.flushAll();
    this.logger.info('Cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStats(): NodeCache.Stats {
    return this.cache.getStats();
  }
  
  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request('/health');
      return response.success;
    } catch {
      return false;
    }
  }
}