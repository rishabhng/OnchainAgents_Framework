import { z } from 'zod';
import winston from 'winston';
import NodeCache from 'node-cache';
import { IHiveService } from '../../interfaces/IHiveService';

export interface AgentConfig {
  name: string;
  description: string;
  version: string;
  cacheTTL?: number;
  maxRetries?: number;
  timeout?: number;
}

export interface AnalysisResult {
  success: boolean;
  agent: string;
  timestamp: number;
  data: unknown;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

export interface AgentContext {
  network?: string;
  address?: string;
  symbol?: string;
  token?: string;
  category?: string;
  timeframe?: string;
  options?: Record<string, unknown>;
}

export abstract class BaseAgent {
  protected readonly config: AgentConfig;
  protected readonly logger: winston.Logger;
  protected readonly cache: NodeCache;
  protected readonly hiveService: IHiveService;
  
  constructor(config: AgentConfig, hiveService: IHiveService) {
    this.config = {
      cacheTTL: 3600,
      maxRetries: 3,
      timeout: 30000,
      ...config,
    };
    
    this.hiveService = hiveService;
    
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { agent: this.config.name },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
    
    this.cache = new NodeCache({
      stdTTL: this.config.cacheTTL,
      checkperiod: 120,
      useClones: false,
    });
    
    this.logger.info(`${this.config.name} agent initialized`, {
      version: this.config.version,
    });
  }
  
  /**
   * Abstract method that each agent must implement for their specific analysis
   */
  protected abstract performAnalysis(
    context: AgentContext,
  ): Promise<unknown>;
  
  /**
   * Abstract method for validating agent-specific input
   */
  protected abstract validateInput(
    context: AgentContext,
  ): z.ZodSchema;
  
  /**
   * Main analysis method with caching, validation, and error handling
   */
  public async analyze(context: AgentContext): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Validate input
      const schema = this.validateInput(context);
      const validatedContext = schema.parse(context);
      
      // Check cache
      const cacheKey = this.getCacheKey(validatedContext);
      const cachedResult = this.cache.get<AnalysisResult>(cacheKey);
      
      if (cachedResult) {
        this.logger.debug('Cache hit', { cacheKey });
        return cachedResult;
      }
      
      // Perform analysis with retry logic
      const data = await this.withRetry(
        () => this.performAnalysis(validatedContext),
        this.config.maxRetries!,
      );
      
      // Build result
      const result: AnalysisResult = {
        success: true,
        agent: this.config.name,
        timestamp: Date.now(),
        data,
        metadata: {
          executionTime: Date.now() - startTime,
          network: context.network,
          cached: false,
        },
      };
      
      // Cache result
      this.cache.set(cacheKey, result);
      
      this.logger.info('Analysis completed', {
        executionTime: result.metadata!.executionTime,
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('Analysis failed', { error });
      
      return {
        success: false,
        agent: this.config.name,
        timestamp: Date.now(),
        data: null,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }
  
  /**
   * Get agent information
   */
  public getInfo(): AgentConfig {
    return { ...this.config };
  }
  
  /**
   * Generate cache key from context
   */
  protected getCacheKey(context: AgentContext): string {
    const parts = [
      this.config.name,
      context.network || 'default',
      context.address || context.symbol || '',
      context.timeframe || 'default',
    ];
    
    return parts.join(':').toLowerCase();
  }
  
  /**
   * Retry logic for network requests
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    retries: number,
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
   * Format large numbers for display
   */
  protected formatNumber(num: number): string {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  }
  
  /**
   * Calculate percentage change
   */
  protected calculatePercentageChange(
    oldValue: number,
    newValue: number,
  ): number {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }
  
  /**
   * Normalize addresses across different chains
   */
  protected normalizeAddress(address: string): string {
    return address.toLowerCase();
  }
}