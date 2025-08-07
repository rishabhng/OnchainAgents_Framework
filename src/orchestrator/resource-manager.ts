/**
 * Resource Manager for OnChainAgents
 * Manages token usage, memory, and execution limits
 * Inspired by SuperClaude's resource management
 */

export interface ResourceLimits {
  maxTokens?: number;
  maxTime?: number;
  maxMemory?: number;
}

export interface ResourceCheck {
  available: boolean;
  reason?: string;
  currentUsage: {
    tokens: number;
    time: number;
    memory: number;
  };
  remainingCapacity: {
    tokens: number;
    time: number;
    memory: number;
  };
}

export interface UsageRecord {
  tool: string;
  executionTime: number;
  tokensUsed: number;
  timestamp?: number;
}

export class ResourceManager {
  private limits: Required<ResourceLimits>;
  private currentUsage: {
    tokens: number;
    time: number;
    memory: number;
  };
  private usageHistory: UsageRecord[];
  private startTime: number;
  
  constructor(limits?: ResourceLimits) {
    this.limits = {
      maxTokens: limits?.maxTokens || 100000,
      maxTime: limits?.maxTime || 60000, // 60 seconds
      maxMemory: limits?.maxMemory || 512 * 1024 * 1024, // 512MB
    };
    
    this.currentUsage = {
      tokens: 0,
      time: 0,
      memory: 0,
    };
    
    this.usageHistory = [];
    this.startTime = Date.now();
    
    // Start memory monitoring
    this.startMemoryMonitoring();
  }
  
  /**
   * Check if resources are available for operation
   */
  public async checkAvailability(context: any): Promise<ResourceCheck> {
    const estimatedTokens = context.estimatedTokens || 1000;
    const estimatedTime = context.estimatedTime || 5000;
    const currentMemory = this.getCurrentMemoryUsage();
    
    // Calculate remaining capacity
    const remainingTokens = this.limits.maxTokens - this.currentUsage.tokens;
    const remainingTime = this.limits.maxTime - (Date.now() - this.startTime);
    const remainingMemory = this.limits.maxMemory - currentMemory;
    
    // Check if we have enough resources
    const hasTokens = remainingTokens >= estimatedTokens;
    const hasTime = remainingTime >= estimatedTime;
    const hasMemory = remainingMemory > 50 * 1024 * 1024; // Keep 50MB buffer
    
    let available = hasTokens && hasTime && hasMemory;
    let reason: string | undefined;
    
    if (!hasTokens) {
      reason = `Token limit exceeded. Remaining: ${remainingTokens}, Required: ${estimatedTokens}`;
    } else if (!hasTime) {
      reason = `Time limit exceeded. Remaining: ${remainingTime}ms, Required: ${estimatedTime}ms`;
    } else if (!hasMemory) {
      reason = `Memory limit exceeded. Available: ${(remainingMemory / 1024 / 1024).toFixed(2)}MB`;
    }
    
    // Determine resource zone
    const tokenUsagePercent = (this.currentUsage.tokens / this.limits.maxTokens) * 100;
    const timeUsagePercent = ((Date.now() - this.startTime) / this.limits.maxTime) * 100;
    const memoryUsagePercent = (currentMemory / this.limits.maxMemory) * 100;
    
    const maxUsagePercent = Math.max(tokenUsagePercent, timeUsagePercent, memoryUsagePercent);
    
    // Apply resource management thresholds (from SuperClaude pattern)
    if (maxUsagePercent >= 95) {
      // Critical Zone - Essential operations only
      if (context.priority !== 'critical') {
        available = false;
        reason = `Critical resource zone (${maxUsagePercent.toFixed(1)}%). Only critical operations allowed.`;
      }
    } else if (maxUsagePercent >= 85) {
      // Red Zone - Block resource-intensive operations
      if (context.complexity === 'complex') {
        available = false;
        reason = `High resource usage (${maxUsagePercent.toFixed(1)}%). Complex operations blocked.`;
      }
    } else if (maxUsagePercent >= 75) {
      // Orange Zone - Defer non-critical operations
      if (context.priority === 'low') {
        available = false;
        reason = `Resource warning (${maxUsagePercent.toFixed(1)}%). Low priority operations deferred.`;
      }
    }
    
    return {
      available,
      reason,
      currentUsage: {
        tokens: this.currentUsage.tokens,
        time: Date.now() - this.startTime,
        memory: currentMemory,
      },
      remainingCapacity: {
        tokens: remainingTokens,
        time: Math.max(0, remainingTime),
        memory: remainingMemory,
      },
    };
  }
  
  /**
   * Record resource usage
   */
  public async recordUsage(usage: UsageRecord): Promise<void> {
    // Update current usage
    this.currentUsage.tokens += usage.tokensUsed;
    this.currentUsage.time += usage.executionTime;
    
    // Add to history
    this.usageHistory.push({
      ...usage,
      timestamp: Date.now(),
    });
    
    // Trim old history (keep last 100 records)
    if (this.usageHistory.length > 100) {
      this.usageHistory = this.usageHistory.slice(-100);
    }
    
    // Log resource status
    this.logResourceStatus();
  }
  
  /**
   * Get current resource status
   */
  public getStatus(): {
    usage: typeof this.currentUsage;
    limits: typeof this.limits;
    percentage: {
      tokens: number;
      time: number;
      memory: number;
    };
    zone: string;
  } {
    const currentMemory = this.getCurrentMemoryUsage();
    const elapsedTime = Date.now() - this.startTime;
    
    const tokenPercent = (this.currentUsage.tokens / this.limits.maxTokens) * 100;
    const timePercent = (elapsedTime / this.limits.maxTime) * 100;
    const memoryPercent = (currentMemory / this.limits.maxMemory) * 100;
    
    const maxPercent = Math.max(tokenPercent, timePercent, memoryPercent);
    
    let zone = 'green';
    if (maxPercent >= 95) zone = 'critical';
    else if (maxPercent >= 85) zone = 'red';
    else if (maxPercent >= 75) zone = 'orange';
    else if (maxPercent >= 60) zone = 'yellow';
    
    return {
      usage: {
        tokens: this.currentUsage.tokens,
        time: elapsedTime,
        memory: currentMemory,
      },
      limits: this.limits,
      percentage: {
        tokens: tokenPercent,
        time: timePercent,
        memory: memoryPercent,
      },
      zone,
    };
  }
  
  /**
   * Reset resource counters
   */
  public reset(): void {
    this.currentUsage = {
      tokens: 0,
      time: 0,
      memory: 0,
    };
    this.usageHistory = [];
    this.startTime = Date.now();
  }
  
  /**
   * Get usage statistics
   */
  public getStatistics(): {
    totalOperations: number;
    averageTokens: number;
    averageTime: number;
    peakTokens: number;
    peakTime: number;
  } {
    if (this.usageHistory.length === 0) {
      return {
        totalOperations: 0,
        averageTokens: 0,
        averageTime: 0,
        peakTokens: 0,
        peakTime: 0,
      };
    }
    
    const totalTokens = this.usageHistory.reduce((sum, r) => sum + r.tokensUsed, 0);
    const totalTime = this.usageHistory.reduce((sum, r) => sum + r.executionTime, 0);
    const peakTokens = Math.max(...this.usageHistory.map(r => r.tokensUsed));
    const peakTime = Math.max(...this.usageHistory.map(r => r.executionTime));
    
    return {
      totalOperations: this.usageHistory.length,
      averageTokens: Math.round(totalTokens / this.usageHistory.length),
      averageTime: Math.round(totalTime / this.usageHistory.length),
      peakTokens,
      peakTime,
    };
  }
  
  // Private methods
  
  private getCurrentMemoryUsage(): number {
    const memUsage = process.memoryUsage();
    return memUsage.heapUsed + memUsage.external;
  }
  
  private startMemoryMonitoring(): void {
    // Update memory usage every 5 seconds
    setInterval(() => {
      this.currentUsage.memory = this.getCurrentMemoryUsage();
    }, 5000).unref(); // unref to not block process exit
  }
  
  private logResourceStatus(): void {
    const status = this.getStatus();
    
    // Log warnings based on zone
    if (status.zone === 'critical') {
      console.error('[ResourceManager] CRITICAL: Resource usage critical', status.percentage);
    } else if (status.zone === 'red') {
      console.error('[ResourceManager] WARNING: High resource usage', status.percentage);
    } else if (status.zone === 'orange') {
      console.warn('[ResourceManager] CAUTION: Elevated resource usage', status.percentage);
    }
  }
}