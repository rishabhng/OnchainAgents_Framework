/**
 * Sub-Agent Delegation Engine for OnChainAgents
 * Inspired by SuperClaude's parallel processing and task delegation
 * Enables efficient parallel blockchain analysis across multiple agents
 */

import { EventEmitter } from 'events';
import { DetectionEngine, CryptoDomain, OperationType } from './detection-engine';
import { PersonaType } from '../personas';
import { ResourceZoneManager, ResourceZone } from './resource-zones';
import { QualityGatesFramework } from './quality-gates';

// Delegation strategies
export enum DelegationStrategy {
  FILES = 'files',           // Delegate individual file analysis
  FOLDERS = 'folders',       // Delegate directory-level analysis
  TASKS = 'tasks',           // Delegate by task type
  DOMAINS = 'domains',       // Delegate by crypto domain
  AUTO = 'auto',             // Auto-detect optimal strategy
  PARALLEL_DIRS = 'parallel_dirs',     // Parallel directory processing
  PARALLEL_FOCUS = 'parallel_focus',   // Parallel focus areas
  ADAPTIVE = 'adaptive',     // Adaptive based on workload
}

// Sub-agent types for crypto operations
export enum SubAgentType {
  WHALE_TRACKER = 'WhaleTracker',
  DEFI_ANALYZER = 'DeFiAnalyzer',
  SECURITY_SCANNER = 'SecurityScanner',
  NFT_VALUATOR = 'NFTValuator',
  MARKET_MONITOR = 'MarketMonitor',
  CHAIN_EXPLORER = 'ChainExplorer',
  YIELD_CALCULATOR = 'YieldCalculator',
  RISK_ASSESSOR = 'RiskAssessor',
  SENTIMENT_ANALYZER = 'SentimentAnalyzer',
  GOVERNANCE_TRACKER = 'GovernanceTracker',
  BRIDGE_MONITOR = 'BridgeMonitor',
  ALPHA_HUNTER = 'AlphaHunter',
}

// Sub-agent configuration
export interface SubAgentConfig {
  type: SubAgentType;
  persona?: PersonaType;
  domains: CryptoDomain[];
  operations: OperationType[];
  maxConcurrency: number;
  timeout: number;
  retryAttempts: number;
  priority: number;
  capabilities: string[];
}

// Delegation task
export interface DelegationTask {
  id: string;
  type: string;
  description: string;
  agent: SubAgentType;
  inputs: Record<string, any>;
  priority: number;
  dependencies: string[];
  timeout: number;
  retryCount: number;
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'retrying';
  result?: DelegationResult;
  assignedAt?: number;
  startedAt?: number;
  completedAt?: number;
}

// Delegation result
export interface DelegationResult {
  taskId: string;
  agentType: SubAgentType;
  success: boolean;
  outputs: any;
  metrics: {
    duration: number;
    tokensUsed: number;
    resourceUsage: number;
    accuracy?: number;
  };
  errors?: string[];
  warnings?: string[];
  evidence?: any;
}

// Delegation plan
export interface DelegationPlan {
  id: string;
  strategy: DelegationStrategy;
  tasks: DelegationTask[];
  estimatedDuration: number;
  estimatedTokens: number;
  maxConcurrency: number;
  resourceAllocation: Map<SubAgentType, number>;
}

// Sub-agent instance
export interface SubAgent {
  id: string;
  type: SubAgentType;
  config: SubAgentConfig;
  status: 'idle' | 'busy' | 'error' | 'offline';
  currentTask?: DelegationTask;
  taskHistory: string[];
  metrics: {
    tasksCompleted: number;
    successRate: number;
    averageDuration: number;
    totalTokensUsed: number;
  };
}

/**
 * Sub-Agent Delegation Engine
 * Manages parallel task execution across specialized agents
 */
export class DelegationEngine extends EventEmitter {
  private detectionEngine: DetectionEngine;
  private resourceManager: ResourceZoneManager;
  private qualityGates: QualityGatesFramework;
  
  private subAgents: Map<string, SubAgent> = new Map();
  private activeTasks: Map<string, DelegationTask> = new Map();
  private taskQueue: DelegationTask[] = [];
  private delegationPlans: Map<string, DelegationPlan> = new Map();
  
  private maxConcurrency: number = 7; // Default from SuperClaude
  private autoActivationThreshold = {
    fileCount: 50,
    directoryCount: 7,
    complexity: 0.6,
    operations: 5,
  };
  
  constructor(
    detectionEngine: DetectionEngine,
    resourceManager: ResourceZoneManager,
    qualityGates: QualityGatesFramework
  ) {
    super();
    this.detectionEngine = detectionEngine;
    this.resourceManager = resourceManager;
    this.qualityGates = qualityGates;
    this.initializeSubAgents();
  }
  
  /**
   * Initialize sub-agents with crypto-specific capabilities
   */
  private initializeSubAgents(): void {
    const agentConfigs: SubAgentConfig[] = [
      {
        type: SubAgentType.WHALE_TRACKER,
        persona: PersonaType.WHALE_HUNTER,
        domains: [CryptoDomain.WHALE],
        operations: [OperationType.TRACKING],
        maxConcurrency: 3,
        timeout: 30000,
        retryAttempts: 2,
        priority: 9,
        capabilities: ['wallet_analysis', 'transaction_tracking', 'accumulation_detection'],
      },
      {
        type: SubAgentType.DEFI_ANALYZER,
        persona: PersonaType.DEFI_ARCHITECT,
        domains: [CryptoDomain.DEFI, CryptoDomain.YIELD],
        operations: [OperationType.ANALYSIS, OperationType.OPTIMIZATION],
        maxConcurrency: 5,
        timeout: 45000,
        retryAttempts: 3,
        priority: 7,
        capabilities: ['protocol_analysis', 'yield_calculation', 'risk_assessment'],
      },
      {
        type: SubAgentType.SECURITY_SCANNER,
        persona: PersonaType.SECURITY_AUDITOR,
        domains: [CryptoDomain.SECURITY],
        operations: [OperationType.SCANNING, OperationType.VALIDATION],
        maxConcurrency: 2,
        timeout: 60000,
        retryAttempts: 1,
        priority: 10,
        capabilities: ['vulnerability_scanning', 'contract_audit', 'exploit_detection'],
      },
      {
        type: SubAgentType.ALPHA_HUNTER,
        persona: PersonaType.ALPHA_SEEKER,
        domains: [CryptoDomain.ALPHA],
        operations: [OperationType.DISCOVERY],
        maxConcurrency: 10,
        timeout: 20000,
        retryAttempts: 3,
        priority: 6,
        capabilities: ['trend_detection', 'early_signals', 'momentum_tracking'],
      },
      {
        type: SubAgentType.MARKET_MONITOR,
        persona: PersonaType.MARKET_MAKER,
        domains: [CryptoDomain.MARKET],
        operations: [OperationType.MONITORING],
        maxConcurrency: 5,
        timeout: 15000,
        retryAttempts: 2,
        priority: 8,
        capabilities: ['price_monitoring', 'volume_analysis', 'liquidity_tracking'],
      },
      {
        type: SubAgentType.CHAIN_EXPLORER,
        persona: PersonaType.CHAIN_ANALYST,
        domains: [CryptoDomain.BRIDGE, CryptoDomain.GOVERNANCE],
        operations: [OperationType.ANALYSIS],
        maxConcurrency: 4,
        timeout: 40000,
        retryAttempts: 2,
        priority: 5,
        capabilities: ['block_analysis', 'transaction_exploration', 'cross_chain_tracking'],
      },
    ];
    
    // Create sub-agent instances
    for (const config of agentConfigs) {
      const agent: SubAgent = {
        id: `agent_${config.type}_${Date.now()}`,
        type: config.type,
        config,
        status: 'idle',
        taskHistory: [],
        metrics: {
          tasksCompleted: 0,
          successRate: 0,
          averageDuration: 0,
          totalTokensUsed: 0,
        },
      };
      
      this.subAgents.set(agent.id, agent);
    }
  }
  
  /**
   * Determine if delegation should be used
   * Based on SuperClaude's auto-activation criteria
   */
  public shouldDelegate(context: {
    fileCount?: number;
    directoryCount?: number;
    complexity?: number;
    operations?: string[];
    domains?: CryptoDomain[];
  }): boolean {
    const fileCheck = (context.fileCount || 0) > this.autoActivationThreshold.fileCount;
    const dirCheck = (context.directoryCount || 0) > this.autoActivationThreshold.directoryCount;
    const complexityCheck = (context.complexity || 0) > this.autoActivationThreshold.complexity;
    const operationCheck = (context.operations?.length || 0) > this.autoActivationThreshold.operations;
    
    const shouldDelegate = fileCheck || dirCheck || (complexityCheck && operationCheck);
    
    if (shouldDelegate) {
      this.emit('delegation-recommended', {
        reason: {
          fileCount: fileCheck,
          directoryCount: dirCheck,
          complexity: complexityCheck,
          operations: operationCheck,
        },
        context,
      });
    }
    
    return shouldDelegate;
  }
  
  /**
   * Create delegation plan
   */
  public async createDelegationPlan(
    tasks: any[],
    strategy?: DelegationStrategy,
    context?: any
  ): Promise<DelegationPlan> {
    // Auto-detect strategy if not provided
    if (!strategy || strategy === DelegationStrategy.AUTO) {
      strategy = this.selectOptimalStrategy(tasks, context);
    }
    
    // Create delegation tasks based on strategy
    const delegationTasks = this.createDelegationTasks(tasks, strategy, context);
    
    // Allocate resources
    const resourceAllocation = this.allocateResources(delegationTasks);
    
    // Calculate estimates
    const estimatedDuration = this.estimateDuration(delegationTasks);
    const estimatedTokens = this.estimateTokens(delegationTasks);
    
    const plan: DelegationPlan = {
      id: `delegation_${Date.now()}`,
      strategy,
      tasks: delegationTasks,
      estimatedDuration,
      estimatedTokens,
      maxConcurrency: this.calculateMaxConcurrency(delegationTasks),
      resourceAllocation,
    };
    
    this.delegationPlans.set(plan.id, plan);
    
    this.emit('delegation-plan-created', {
      plan,
      taskCount: delegationTasks.length,
      strategy,
    });
    
    return plan;
  }
  
  /**
   * Execute delegation plan
   */
  public async executeDelegationPlan(plan: DelegationPlan): Promise<Map<string, DelegationResult>> {
    const results = new Map<string, DelegationResult>();
    
    this.emit('delegation-started', {
      planId: plan.id,
      taskCount: plan.tasks.length,
      strategy: plan.strategy,
    });
    
    // Add tasks to queue
    this.taskQueue.push(...plan.tasks);
    
    // Start processing
    const processingPromises: Promise<void>[] = [];
    const concurrency = Math.min(plan.maxConcurrency, this.maxConcurrency);
    
    for (let i = 0; i < concurrency; i++) {
      processingPromises.push(this.processTaskQueue(results));
    }
    
    // Wait for all tasks to complete
    await Promise.all(processingPromises);
    
    this.emit('delegation-completed', {
      planId: plan.id,
      results: Array.from(results.values()),
      success: Array.from(results.values()).every(r => r.success),
    });
    
    return results;
  }
  
  /**
   * Process task queue
   */
  private async processTaskQueue(results: Map<string, DelegationResult>): Promise<void> {
    while (this.taskQueue.length > 0) {
      // Check resource availability
      const zone = this.resourceManager.getCurrentZone();
      if (zone === ResourceZone.RED || zone === ResourceZone.CRITICAL) {
        this.emit('delegation-throttled', {
          reason: 'resource-constraints',
          zone,
        });
        await this.waitForResources();
      }
      
      // Get next task
      const task = this.getNextTask();
      if (!task) break;
      
      // Find available agent
      const agent = this.findAvailableAgent(task);
      if (!agent) {
        // No agent available, put task back
        this.taskQueue.unshift(task);
        await this.waitForAgent();
        continue;
      }
      
      // Execute task
      const result = await this.executeTask(task, agent);
      results.set(task.id, result);
      
      // Update metrics
      this.updateAgentMetrics(agent, result);
    }
  }
  
  /**
   * Get next task from queue
   */
  private getNextTask(): DelegationTask | undefined {
    // Sort by priority and dependencies
    this.taskQueue.sort((a, b) => {
      // Check dependencies first
      if (a.dependencies.length === 0 && b.dependencies.length > 0) return -1;
      if (a.dependencies.length > 0 && b.dependencies.length === 0) return 1;
      
      // Then by priority
      return b.priority - a.priority;
    });
    
    // Find first task with met dependencies
    const index = this.taskQueue.findIndex(task => 
      this.areDependenciesMet(task)
    );
    
    if (index >= 0) {
      return this.taskQueue.splice(index, 1)[0];
    }
    
    return undefined;
  }
  
  /**
   * Find available agent for task
   */
  private findAvailableAgent(task: DelegationTask): SubAgent | undefined {
    const agents = Array.from(this.subAgents.values())
      .filter(agent => 
        agent.type === task.agent && 
        agent.status === 'idle'
      )
      .sort((a, b) => 
        // Prefer agents with higher success rate
        b.metrics.successRate - a.metrics.successRate
      );
    
    return agents[0];
  }
  
  /**
   * Execute task with agent
   */
  private async executeTask(task: DelegationTask, agent: SubAgent): Promise<DelegationResult> {
    task.status = 'assigned';
    task.assignedAt = Date.now();
    agent.status = 'busy';
    agent.currentTask = task;
    
    this.activeTasks.set(task.id, task);
    
    this.emit('task-assigned', {
      taskId: task.id,
      agentId: agent.id,
      agentType: agent.type,
    });
    
    try {
      task.status = 'running';
      task.startedAt = Date.now();
      
      // Simulate task execution
      // In production, this would call actual agent implementation
      const result = await this.simulateTaskExecution(task, agent);
      
      task.status = 'completed';
      task.completedAt = Date.now();
      task.result = result;
      
      this.emit('task-completed', {
        taskId: task.id,
        agentId: agent.id,
        duration: task.completedAt - task.startedAt!,
      });
      
      return result;
      
    } catch (error) {
      task.status = 'failed';
      task.completedAt = Date.now();
      
      // Retry logic
      if (task.retryCount < agent.config.retryAttempts) {
        task.retryCount++;
        task.status = 'retrying';
        this.taskQueue.unshift(task); // Put back in queue
        
        this.emit('task-retrying', {
          taskId: task.id,
          attempt: task.retryCount,
          maxAttempts: agent.config.retryAttempts,
        });
      } else {
        this.emit('task-failed', {
          taskId: task.id,
          error,
        });
      }
      
      return {
        taskId: task.id,
        agentType: agent.type,
        success: false,
        outputs: {},
        metrics: {
          duration: task.completedAt - task.startedAt!,
          tokensUsed: 0,
          resourceUsage: 0,
        },
        errors: [error.toString()],
      };
      
    } finally {
      agent.status = 'idle';
      agent.currentTask = undefined;
      agent.taskHistory.push(task.id);
      this.activeTasks.delete(task.id);
    }
  }
  
  /**
   * Simulate task execution (placeholder for actual implementation)
   */
  private async simulateTaskExecution(
    task: DelegationTask,
    agent: SubAgent
  ): Promise<DelegationResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 1000));
    
    // Generate mock result based on agent type
    const outputs = this.generateMockOutputs(task, agent);
    
    return {
      taskId: task.id,
      agentType: agent.type,
      success: Math.random() > 0.1, // 90% success rate
      outputs,
      metrics: {
        duration: Date.now() - task.startedAt!,
        tokensUsed: Math.floor(Math.random() * 5000) + 1000,
        resourceUsage: Math.random() * 0.3,
        accuracy: 0.85 + Math.random() * 0.15,
      },
      warnings: Math.random() > 0.7 ? ['Minor issue detected'] : undefined,
      evidence: {
        processed: true,
        timestamp: Date.now(),
      },
    };
  }
  
  /**
   * Generate mock outputs based on agent type
   */
  private generateMockOutputs(task: DelegationTask, agent: SubAgent): any {
    switch (agent.type) {
      case SubAgentType.WHALE_TRACKER:
        return {
          whales: [
            { address: '0x123...', balance: 15000000, recent_activity: 'accumulating' },
            { address: '0x456...', balance: 8000000, recent_activity: 'dormant' },
          ],
          total_tracked: 2,
          accumulation_detected: true,
        };
        
      case SubAgentType.DEFI_ANALYZER:
        return {
          protocols: ['Aave', 'Compound', 'Curve'],
          total_tvl: 125000000,
          average_apy: 12.5,
          risk_score: 0.3,
        };
        
      case SubAgentType.SECURITY_SCANNER:
        return {
          vulnerabilities: [],
          security_score: 85,
          audit_complete: true,
          recommendations: ['Consider adding time locks'],
        };
        
      case SubAgentType.ALPHA_HUNTER:
        return {
          opportunities: [
            { token: 'NEWGEM', score: 0.85, potential: '10x' },
            { token: 'MOON', score: 0.72, potential: '5x' },
          ],
          signals_detected: 5,
        };
        
      default:
        return { processed: true };
    }
  }
  
  /**
   * Select optimal delegation strategy
   */
  private selectOptimalStrategy(tasks: any[], context?: any): DelegationStrategy {
    // File-heavy operations
    if (context?.fileCount > 100) {
      return DelegationStrategy.FILES;
    }
    
    // Directory-based operations
    if (context?.directoryCount > 10) {
      return DelegationStrategy.PARALLEL_DIRS;
    }
    
    // Multi-domain operations
    if (context?.domains?.length > 3) {
      return DelegationStrategy.DOMAINS;
    }
    
    // Focus-based operations
    if (context?.focusAreas?.length > 2) {
      return DelegationStrategy.PARALLEL_FOCUS;
    }
    
    // Default to task-based
    return DelegationStrategy.TASKS;
  }
  
  /**
   * Create delegation tasks based on strategy
   */
  private createDelegationTasks(
    tasks: any[],
    strategy: DelegationStrategy,
    context?: any
  ): DelegationTask[] {
    const delegationTasks: DelegationTask[] = [];
    
    switch (strategy) {
      case DelegationStrategy.FILES:
        // Create task per file
        for (const task of tasks) {
          delegationTasks.push(this.createFileTask(task));
        }
        break;
        
      case DelegationStrategy.DOMAINS:
        // Group by domain
        const domainGroups = this.groupByDomain(tasks);
        for (const [domain, domainTasks] of domainGroups) {
          delegationTasks.push(this.createDomainTask(domain, domainTasks));
        }
        break;
        
      case DelegationStrategy.PARALLEL_DIRS:
        // Create parallel directory tasks
        for (const task of tasks) {
          delegationTasks.push(this.createDirectoryTask(task));
        }
        break;
        
      default:
        // Generic task creation
        for (const task of tasks) {
          delegationTasks.push(this.createGenericTask(task));
        }
    }
    
    return delegationTasks;
  }
  
  /**
   * Create file-based task
   */
  private createFileTask(task: any): DelegationTask {
    return {
      id: `task_file_${Date.now()}_${Math.random()}`,
      type: 'file_analysis',
      description: `Analyze file: ${task.file || 'unknown'}`,
      agent: this.selectAgentForTask(task),
      inputs: task,
      priority: task.priority || 5,
      dependencies: [],
      timeout: 30000,
      retryCount: 0,
      status: 'pending',
    };
  }
  
  /**
   * Create domain-based task
   */
  private createDomainTask(domain: CryptoDomain, tasks: any[]): DelegationTask {
    return {
      id: `task_domain_${domain}_${Date.now()}`,
      type: 'domain_analysis',
      description: `Analyze domain: ${domain}`,
      agent: this.selectAgentForDomain(domain),
      inputs: { domain, tasks },
      priority: 7,
      dependencies: [],
      timeout: 60000,
      retryCount: 0,
      status: 'pending',
    };
  }
  
  /**
   * Create directory-based task
   */
  private createDirectoryTask(task: any): DelegationTask {
    return {
      id: `task_dir_${Date.now()}_${Math.random()}`,
      type: 'directory_analysis',
      description: `Analyze directory: ${task.directory || 'unknown'}`,
      agent: SubAgentType.CHAIN_EXPLORER,
      inputs: task,
      priority: 6,
      dependencies: [],
      timeout: 45000,
      retryCount: 0,
      status: 'pending',
    };
  }
  
  /**
   * Create generic task
   */
  private createGenericTask(task: any): DelegationTask {
    return {
      id: `task_generic_${Date.now()}_${Math.random()}`,
      type: task.type || 'generic',
      description: task.description || 'Generic task',
      agent: this.selectAgentForTask(task),
      inputs: task,
      priority: task.priority || 5,
      dependencies: task.dependencies || [],
      timeout: 30000,
      retryCount: 0,
      status: 'pending',
    };
  }
  
  /**
   * Select agent for task
   */
  private selectAgentForTask(task: any): SubAgentType {
    // Based on task type or domain
    if (task.type?.includes('whale')) return SubAgentType.WHALE_TRACKER;
    if (task.type?.includes('defi')) return SubAgentType.DEFI_ANALYZER;
    if (task.type?.includes('security')) return SubAgentType.SECURITY_SCANNER;
    if (task.type?.includes('alpha')) return SubAgentType.ALPHA_HUNTER;
    if (task.type?.includes('market')) return SubAgentType.MARKET_MONITOR;
    
    return SubAgentType.CHAIN_EXPLORER; // Default
  }
  
  /**
   * Select agent for domain
   */
  private selectAgentForDomain(domain: CryptoDomain): SubAgentType {
    const domainAgentMap: Record<CryptoDomain, SubAgentType> = {
      [CryptoDomain.WHALE]: SubAgentType.WHALE_TRACKER,
      [CryptoDomain.DEFI]: SubAgentType.DEFI_ANALYZER,
      [CryptoDomain.SECURITY]: SubAgentType.SECURITY_SCANNER,
      [CryptoDomain.ALPHA]: SubAgentType.ALPHA_HUNTER,
      [CryptoDomain.MARKET]: SubAgentType.MARKET_MONITOR,
      [CryptoDomain.NFT]: SubAgentType.NFT_VALUATOR,
      [CryptoDomain.YIELD]: SubAgentType.YIELD_CALCULATOR,
      [CryptoDomain.RISK]: SubAgentType.RISK_ASSESSOR,
      [CryptoDomain.SENTIMENT]: SubAgentType.SENTIMENT_ANALYZER,
      [CryptoDomain.GOVERNANCE]: SubAgentType.GOVERNANCE_TRACKER,
      [CryptoDomain.BRIDGE]: SubAgentType.BRIDGE_MONITOR,
    };
    
    return domainAgentMap[domain] || SubAgentType.CHAIN_EXPLORER;
  }
  
  /**
   * Group tasks by domain
   */
  private groupByDomain(tasks: any[]): Map<CryptoDomain, any[]> {
    const groups = new Map<CryptoDomain, any[]>();
    
    for (const task of tasks) {
      const domain = task.domain || CryptoDomain.MARKET;
      if (!groups.has(domain)) {
        groups.set(domain, []);
      }
      groups.get(domain)!.push(task);
    }
    
    return groups;
  }
  
  /**
   * Allocate resources to agents
   */
  private allocateResources(tasks: DelegationTask[]): Map<SubAgentType, number> {
    const allocation = new Map<SubAgentType, number>();
    
    // Count tasks per agent type
    for (const task of tasks) {
      const current = allocation.get(task.agent) || 0;
      allocation.set(task.agent, current + 1);
    }
    
    // Calculate resource percentage
    const total = tasks.length;
    for (const [agent, count] of allocation) {
      allocation.set(agent, (count / total) * 100);
    }
    
    return allocation;
  }
  
  /**
   * Calculate maximum concurrency
   */
  private calculateMaxConcurrency(tasks: DelegationTask[]): number {
    // Based on resource zone
    const zone = this.resourceManager.getCurrentZone();
    
    switch (zone) {
      case ResourceZone.GREEN:
        return Math.min(15, tasks.length);
      case ResourceZone.YELLOW:
        return Math.min(10, tasks.length);
      case ResourceZone.ORANGE:
        return Math.min(5, tasks.length);
      case ResourceZone.RED:
        return 2;
      case ResourceZone.CRITICAL:
        return 1;
      default:
        return 7;
    }
  }
  
  /**
   * Estimate duration
   */
  private estimateDuration(tasks: DelegationTask[]): number {
    if (tasks.length === 0) return 0;
    
    // Group by dependencies to find critical path
    const independentTasks = tasks.filter(t => t.dependencies.length === 0);
    const dependentTasks = tasks.filter(t => t.dependencies.length > 0);
    
    // Estimate based on parallelization
    const parallelTime = Math.max(...independentTasks.map(t => t.timeout)) || 0;
    const sequentialTime = dependentTasks.reduce((sum, t) => sum + t.timeout, 0);
    
    return parallelTime + sequentialTime;
  }
  
  /**
   * Estimate token usage
   */
  private estimateTokens(tasks: DelegationTask[]): number {
    // Base estimate per task
    const baseTokensPerTask = 2000;
    
    // Add complexity multiplier
    const complexityMultiplier = tasks.some(t => t.type === 'deep_analysis') ? 2 : 1;
    
    return tasks.length * baseTokensPerTask * complexityMultiplier;
  }
  
  /**
   * Check if dependencies are met
   */
  private areDependenciesMet(task: DelegationTask): boolean {
    return task.dependencies.every(dep => {
      const depTask = Array.from(this.activeTasks.values())
        .find(t => t.id === dep);
      return !depTask || depTask.status === 'completed';
    });
  }
  
  /**
   * Wait for resources
   */
  private async waitForResources(): Promise<void> {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        const zone = this.resourceManager.getCurrentZone();
        if (zone !== ResourceZone.RED && zone !== ResourceZone.CRITICAL) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 2000);
    });
  }
  
  /**
   * Wait for available agent
   */
  private async waitForAgent(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
  }
  
  /**
   * Update agent metrics
   */
  private updateAgentMetrics(agent: SubAgent, result: DelegationResult): void {
    agent.metrics.tasksCompleted++;
    
    // Update success rate
    const successCount = agent.metrics.tasksCompleted * agent.metrics.successRate;
    agent.metrics.successRate = (successCount + (result.success ? 1 : 0)) / 
      agent.metrics.tasksCompleted;
    
    // Update average duration
    const totalDuration = agent.metrics.averageDuration * (agent.metrics.tasksCompleted - 1);
    agent.metrics.averageDuration = (totalDuration + result.metrics.duration) / 
      agent.metrics.tasksCompleted;
    
    // Update token usage
    agent.metrics.totalTokensUsed += result.metrics.tokensUsed;
  }
  
  /**
   * Get statistics
   */
  public getStatistics(): any {
    const agents = Array.from(this.subAgents.values());
    
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'busy').length,
      totalTasksProcessed: agents.reduce((sum, a) => sum + a.metrics.tasksCompleted, 0),
      averageSuccessRate: agents.reduce((sum, a) => sum + a.metrics.successRate, 0) / agents.length,
      totalTokensUsed: agents.reduce((sum, a) => sum + a.metrics.totalTokensUsed, 0),
      taskQueueSize: this.taskQueue.length,
      activeTaskCount: this.activeTasks.size,
      agentUtilization: agents.map(a => ({
        type: a.type,
        status: a.status,
        tasksCompleted: a.metrics.tasksCompleted,
        successRate: a.metrics.successRate,
      })),
    };
  }
  
  /**
   * Set maximum concurrency
   */
  public setMaxConcurrency(value: number): void {
    this.maxConcurrency = Math.max(1, Math.min(15, value));
  }
  
  /**
   * Get available agents
   */
  public getAvailableAgents(): SubAgent[] {
    return Array.from(this.subAgents.values())
      .filter(agent => agent.status === 'idle');
  }
}

export default DelegationEngine;