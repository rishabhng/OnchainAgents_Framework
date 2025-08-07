/**
 * OnChainAgents Load Testing Suite
 * Comprehensive performance analysis for production readiness
 */

import { performance } from 'perf_hooks';
import { Worker } from 'worker_threads';
import * as os from 'os';
import { EventEmitter } from 'events';
import { Orchestrator } from '../../orchestrator';
import { HiveBridge } from '../../bridges/hive-bridge';
import { ResourceManager } from '../../orchestrator/resource-manager';

// Performance metrics collector
interface PerformanceMetrics {
  requestId: string;
  tool: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  tokensUsed?: number;
}

interface LoadTestScenario {
  name: string;
  duration: number; // milliseconds
  rps: number; // requests per second
  concurrency: number;
  pattern: 'steady' | 'burst' | 'ramp' | 'spike';
  tools: string[];
  complexity: 'simple' | 'moderate' | 'complex';
}

interface LoadTestResults {
  scenario: LoadTestScenario;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  throughput: number; // requests per second achieved
  errorRate: number;
  memoryLeaks: boolean;
  resourceExhaustion: boolean;
  bottlenecks: string[];
  recommendations: string[];
}

export class LoadTester extends EventEmitter {
  private orchestrator: Orchestrator;
  private hiveBridge: HiveBridge;
  private resourceManager: ResourceManager;
  private metrics: PerformanceMetrics[] = [];
  private activeRequests: number = 0;
  private maxConcurrency: number = 0;
  private memoryCheckInterval?: NodeJS.Timeout;
  private initialMemory?: NodeJS.MemoryUsage;
  
  constructor() {
    super();
    this.orchestrator = new Orchestrator({
      maxConcurrency: 10,
      cacheEnabled: true,
      cacheTTL: 3600,
      resourceLimits: {
        maxTokens: 1000000,
        maxTime: 600000, // 10 minutes
        maxMemory: 1024 * 1024 * 1024, // 1GB
      },
    });
    this.hiveBridge = new HiveBridge({
      fallbackMode: true, // Use mock data for testing
      cacheTTL: 300,
    });
    this.resourceManager = new ResourceManager({
      maxTokens: 1000000,
      maxTime: 600000,
      maxMemory: 1024 * 1024 * 1024,
    });
  }
  
  /**
   * Initialize load testing environment
   */
  public async initialize(): Promise<void> {
    console.log('🚀 Initializing load testing environment...');
    await this.hiveBridge.initialize();
    this.initialMemory = process.memoryUsage();
    this.startMemoryMonitoring();
    console.log('✅ Load testing environment ready');
  }
  
  /**
   * Run a specific load test scenario
   */
  public async runScenario(scenario: LoadTestScenario): Promise<LoadTestResults> {
    console.log(`\n📊 Starting scenario: ${scenario.name}`);
    console.log(`   Duration: ${scenario.duration}ms`);
    console.log(`   Target RPS: ${scenario.rps}`);
    console.log(`   Concurrency: ${scenario.concurrency}`);
    console.log(`   Pattern: ${scenario.pattern}`);
    
    this.metrics = [];
    this.activeRequests = 0;
    this.maxConcurrency = 0;
    
    const startTime = Date.now();
    const endTime = startTime + scenario.duration;
    
    // Generate request schedule based on pattern
    const requestSchedule = this.generateRequestSchedule(scenario);
    
    // Execute requests according to schedule
    const requestPromises: Promise<void>[] = [];
    
    for (const scheduledTime of requestSchedule) {
      const delay = scheduledTime - Date.now();
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      if (Date.now() >= endTime) break;
      
      // Enforce concurrency limit
      while (this.activeRequests >= scenario.concurrency) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const requestPromise = this.executeRequest(scenario);
      requestPromises.push(requestPromise);
    }
    
    // Wait for all requests to complete
    await Promise.allSettled(requestPromises);
    
    // Analyze results
    const results = this.analyzeResults(scenario);
    
    // Check for memory leaks
    results.memoryLeaks = this.checkMemoryLeaks();
    
    // Identify bottlenecks
    results.bottlenecks = this.identifyBottlenecks();
    
    // Generate recommendations
    results.recommendations = this.generateRecommendations(results);
    
    return results;
  }
  
  /**
   * Run comprehensive load test suite
   */
  public async runComprehensiveSuite(): Promise<Map<string, LoadTestResults>> {
    const results = new Map<string, LoadTestResults>();
    
    // Define test scenarios
    const scenarios: LoadTestScenario[] = [
      // Baseline test
      {
        name: 'Baseline (10 RPS)',
        duration: 60000, // 1 minute
        rps: 10,
        concurrency: 5,
        pattern: 'steady',
        tools: ['oca_analyze', 'oca_security', 'oca_hunt'],
        complexity: 'simple',
      },
      
      // 100 concurrent requests
      {
        name: '100 Concurrent Requests',
        duration: 30000, // 30 seconds
        rps: 100,
        concurrency: 100,
        pattern: 'steady',
        tools: ['oca_analyze', 'oca_sentiment', 'oca_market'],
        complexity: 'moderate',
      },
      
      // 1000 requests per minute
      {
        name: '1000 Requests/Minute',
        duration: 60000, // 1 minute
        rps: 16.67, // ~1000 per minute
        concurrency: 20,
        pattern: 'steady',
        tools: ['oca_analyze', 'oca_security', 'oca_hunt', 'oca_track'],
        complexity: 'moderate',
      },
      
      // Sustained load (10 minutes)
      {
        name: 'Sustained Load (10 min)',
        duration: 600000, // 10 minutes
        rps: 20,
        concurrency: 30,
        pattern: 'steady',
        tools: ['oca_analyze', 'oca_security', 'oca_hunt', 'oca_sentiment', 'oca_market'],
        complexity: 'complex',
      },
      
      // Burst traffic
      {
        name: 'Burst Traffic',
        duration: 60000, // 1 minute
        rps: 50,
        concurrency: 50,
        pattern: 'burst',
        tools: ['oca_analyze', 'oca_hunt'],
        complexity: 'simple',
      },
      
      // Spike test
      {
        name: 'Spike Test',
        duration: 60000, // 1 minute
        rps: 200,
        concurrency: 100,
        pattern: 'spike',
        tools: ['oca_analyze', 'oca_security'],
        complexity: 'simple',
      },
      
      // Ramp up test
      {
        name: 'Ramp Up Test',
        duration: 120000, // 2 minutes
        rps: 50,
        concurrency: 50,
        pattern: 'ramp',
        tools: ['oca_analyze', 'oca_hunt', 'oca_sentiment'],
        complexity: 'moderate',
      },
    ];
    
    // Run each scenario
    for (const scenario of scenarios) {
      try {
        const result = await this.runScenario(scenario);
        results.set(scenario.name, result);
        
        // Cool down between scenarios
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      } catch (error) {
        console.error(`❌ Scenario "${scenario.name}" failed:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Execute a single request
   */
  private async executeRequest(scenario: LoadTestScenario): Promise<void> {
    this.activeRequests++;
    this.maxConcurrency = Math.max(this.maxConcurrency, this.activeRequests);
    
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tool = scenario.tools[Math.floor(Math.random() * scenario.tools.length)];
    const startTime = performance.now();
    const cpuStart = process.cpuUsage();
    
    const metric: PerformanceMetrics = {
      requestId,
      tool,
      startTime,
      endTime: 0,
      duration: 0,
      success: false,
      memoryUsage: process.memoryUsage(),
      cpuUsage: { user: 0, system: 0 },
    };
    
    try {
      // Generate test arguments based on tool
      const args = this.generateTestArgs(tool, scenario.complexity);
      
      // Execute the request
      const result = await this.orchestrator.execute(tool, args);
      
      metric.success = result.success;
      metric.tokensUsed = result.metadata?.tokensUsed;
      
      if (!result.success) {
        metric.error = result.errors?.join(', ');
      }
    } catch (error) {
      metric.success = false;
      metric.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.cpuUsage = process.cpuUsage(cpuStart);
      
      this.metrics.push(metric);
      this.activeRequests--;
      
      this.emit('request', metric);
    }
  }
  
  /**
   * Generate request schedule based on pattern
   */
  private generateRequestSchedule(scenario: LoadTestScenario): number[] {
    const schedule: number[] = [];
    const startTime = Date.now();
    const endTime = startTime + scenario.duration;
    const interval = 1000 / scenario.rps; // milliseconds between requests
    
    switch (scenario.pattern) {
      case 'steady':
        // Constant rate
        for (let t = startTime; t < endTime; t += interval) {
          schedule.push(t);
        }
        break;
        
      case 'burst':
        // Alternating burst and quiet periods
        for (let t = startTime; t < endTime; t += 5000) {
          // Burst for 2 seconds
          for (let b = 0; b < 2000 && t + b < endTime; b += interval / 2) {
            schedule.push(t + b);
          }
          // Quiet for 3 seconds
        }
        break;
        
      case 'spike':
        // Normal load with occasional spikes
        for (let t = startTime; t < endTime; t += interval) {
          schedule.push(t);
          // Add spike every 10 seconds
          if ((t - startTime) % 10000 < 1000) {
            // 10x spike for 1 second
            for (let s = 0; s < 10; s++) {
              schedule.push(t + (interval / 10) * s);
            }
          }
        }
        break;
        
      case 'ramp':
        // Gradually increase load
        const rampSteps = 10;
        const stepDuration = scenario.duration / rampSteps;
        for (let step = 0; step < rampSteps; step++) {
          const stepRps = (scenario.rps / rampSteps) * (step + 1);
          const stepInterval = 1000 / stepRps;
          const stepStart = startTime + step * stepDuration;
          const stepEnd = stepStart + stepDuration;
          
          for (let t = stepStart; t < stepEnd && t < endTime; t += stepInterval) {
            schedule.push(t);
          }
        }
        break;
    }
    
    return schedule;
  }
  
  /**
   * Generate test arguments for a tool
   */
  private generateTestArgs(tool: string, complexity: string): Record<string, any> {
    const testAddresses = [
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    ];
    
    const testWallets = [
      '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503',
      '0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2',
      '0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae',
    ];
    
    switch (tool) {
      case 'oca_analyze':
        return {
          target: testAddresses[Math.floor(Math.random() * testAddresses.length)],
          network: 'ethereum',
          depth: complexity === 'complex' ? 'deep' : complexity === 'moderate' ? 'standard' : 'quick',
        };
        
      case 'oca_security':
        return {
          address: testAddresses[Math.floor(Math.random() * testAddresses.length)],
          network: 'ethereum',
          includeAudit: complexity !== 'simple',
        };
        
      case 'oca_hunt':
        return {
          category: ['defi', 'gaming', 'ai', 'all'][Math.floor(Math.random() * 4)],
          risk: complexity === 'complex' ? 'high' : 'medium',
          timeframe: '24h',
        };
        
      case 'oca_track':
        return {
          wallet: testWallets[Math.floor(Math.random() * testWallets.length)],
          network: 'ethereum',
          includeHistory: complexity !== 'simple',
        };
        
      case 'oca_sentiment':
        return {
          token: ['UNI', 'USDC', 'ETH', 'BTC'][Math.floor(Math.random() * 4)],
          platforms: complexity === 'complex' ? ['all'] : ['twitter'],
          timeframe: '24h',
        };
        
      case 'oca_market':
        return {
          scope: complexity === 'complex' ? 'sector' : 'overview',
          timeframe: '7d',
        };
        
      default:
        return {};
    }
  }
  
  /**
   * Analyze test results
   */
  private analyzeResults(scenario: LoadTestScenario): LoadTestResults {
    const successfulRequests = this.metrics.filter(m => m.success);
    const failedRequests = this.metrics.filter(m => !m.success);
    const responseTimes = this.metrics.map(m => m.duration).sort((a, b) => a - b);
    
    const totalRequests = this.metrics.length;
    const actualDuration = this.metrics.length > 0
      ? Math.max(...this.metrics.map(m => m.endTime)) - Math.min(...this.metrics.map(m => m.startTime))
      : 0;
    
    return {
      scenario,
      totalRequests,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
      medianResponseTime: responseTimes[Math.floor(responseTimes.length / 2)] || 0,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
      minResponseTime: Math.min(...responseTimes) || 0,
      maxResponseTime: Math.max(...responseTimes) || 0,
      throughput: totalRequests / (actualDuration / 1000) || 0,
      errorRate: (failedRequests.length / totalRequests) * 100 || 0,
      memoryLeaks: false,
      resourceExhaustion: false,
      bottlenecks: [],
      recommendations: [],
    };
  }
  
  /**
   * Check for memory leaks
   */
  private checkMemoryLeaks(): boolean {
    if (!this.initialMemory) return false;
    
    const currentMemory = process.memoryUsage();
    const memoryGrowth = currentMemory.heapUsed - this.initialMemory.heapUsed;
    const growthPercentage = (memoryGrowth / this.initialMemory.heapUsed) * 100;
    
    // Consider it a leak if memory grew by more than 50%
    return growthPercentage > 50;
  }
  
  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    
    // Analyze response time distribution
    const responseTimes = this.metrics.map(m => m.duration);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const p99ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.99)];
    
    if (p99ResponseTime > avgResponseTime * 3) {
      bottlenecks.push('High response time variance - possible resource contention');
    }
    
    // Check for specific tool bottlenecks
    const toolMetrics = new Map<string, number[]>();
    for (const metric of this.metrics) {
      if (!toolMetrics.has(metric.tool)) {
        toolMetrics.set(metric.tool, []);
      }
      toolMetrics.get(metric.tool)!.push(metric.duration);
    }
    
    for (const [tool, times] of toolMetrics.entries()) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      if (avgTime > 1000) {
        bottlenecks.push(`${tool} averaging ${avgTime.toFixed(0)}ms - needs optimization`);
      }
    }
    
    // Check for concurrency issues
    if (this.maxConcurrency > 50 && avgResponseTime > 500) {
      bottlenecks.push('Concurrency bottleneck - consider connection pooling or worker threads');
    }
    
    // Check for memory pressure
    const memoryMetrics = this.metrics.map(m => m.memoryUsage.heapUsed);
    const maxMemory = Math.max(...memoryMetrics);
    if (maxMemory > 500 * 1024 * 1024) { // 500MB
      bottlenecks.push('High memory usage - possible memory leak or inefficient caching');
    }
    
    // Check for CPU bottlenecks
    const cpuMetrics = this.metrics.map(m => m.cpuUsage.user + m.cpuUsage.system);
    const avgCpu = cpuMetrics.reduce((a, b) => a + b, 0) / cpuMetrics.length;
    if (avgCpu > 100000) { // 100ms CPU time per request
      bottlenecks.push('High CPU usage - consider optimizing algorithms or using worker threads');
    }
    
    return bottlenecks;
  }
  
  /**
   * Generate performance recommendations
   */
  private generateRecommendations(results: LoadTestResults): string[] {
    const recommendations: string[] = [];
    
    // Response time recommendations
    if (results.p99ResponseTime > 1000) {
      recommendations.push('Implement request caching for frequently accessed data');
      recommendations.push('Consider using Redis for distributed caching');
    }
    
    if (results.p99ResponseTime > 3000) {
      recommendations.push('Add circuit breakers to prevent cascade failures');
      recommendations.push('Implement request timeout and retry logic');
    }
    
    // Throughput recommendations
    if (results.throughput < results.scenario.rps * 0.8) {
      recommendations.push('System cannot meet target RPS - scale horizontally');
      recommendations.push('Consider implementing a queue-based architecture');
    }
    
    // Error rate recommendations
    if (results.errorRate > 5) {
      recommendations.push('High error rate detected - improve error handling');
      recommendations.push('Implement graceful degradation for overload scenarios');
    }
    
    if (results.errorRate > 10) {
      recommendations.push('Critical error rate - add health checks and monitoring');
      recommendations.push('Implement rate limiting to prevent overload');
    }
    
    // Memory recommendations
    if (results.memoryLeaks) {
      recommendations.push('Memory leak detected - review object lifecycle management');
      recommendations.push('Implement periodic cache cleanup');
      recommendations.push('Use weak references for cache entries');
    }
    
    // Concurrency recommendations
    if (results.scenario.concurrency > 50 && results.averageResponseTime > 500) {
      recommendations.push('Implement connection pooling for Hive bridge');
      recommendations.push('Use worker threads for CPU-intensive operations');
      recommendations.push('Consider implementing a job queue with workers');
    }
    
    // Bottleneck-specific recommendations
    for (const bottleneck of results.bottlenecks) {
      if (bottleneck.includes('resource contention')) {
        recommendations.push('Implement resource pooling and queuing');
      }
      if (bottleneck.includes('needs optimization')) {
        recommendations.push('Profile and optimize slow operations');
      }
      if (bottleneck.includes('memory')) {
        recommendations.push('Implement memory-efficient data structures');
      }
      if (bottleneck.includes('CPU')) {
        recommendations.push('Offload CPU-intensive work to background jobs');
      }
    }
    
    return [...new Set(recommendations)]; // Remove duplicates
  }
  
  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.memoryCheckInterval = setInterval(() => {
      const usage = process.memoryUsage();
      if (usage.heapUsed > 800 * 1024 * 1024) { // 800MB warning
        console.warn('⚠️ High memory usage detected:', {
          heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
          external: `${(usage.external / 1024 / 1024).toFixed(2)}MB`,
        });
      }
    }, 5000);
  }
  
  /**
   * Generate performance report
   */
  public generateReport(results: Map<string, LoadTestResults>): string {
    let report = '# OnChainAgents Performance Test Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Platform: ${os.platform()} ${os.arch()}\n`;
    report += `Node.js: ${process.version}\n`;
    report += `CPUs: ${os.cpus().length} x ${os.cpus()[0].model}\n`;
    report += `Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB\n\n`;
    
    report += '## Executive Summary\n\n';
    
    // Calculate overall statistics
    let totalRequests = 0;
    let totalErrors = 0;
    let avgResponseTimes: number[] = [];
    let p99ResponseTimes: number[] = [];
    
    for (const [name, result] of results) {
      totalRequests += result.totalRequests;
      totalErrors += result.failedRequests;
      avgResponseTimes.push(result.averageResponseTime);
      p99ResponseTimes.push(result.p99ResponseTime);
    }
    
    const overallErrorRate = (totalErrors / totalRequests) * 100;
    const avgOfAvgResponseTime = avgResponseTimes.reduce((a, b) => a + b, 0) / avgResponseTimes.length;
    const maxP99ResponseTime = Math.max(...p99ResponseTimes);
    
    report += `- **Total Requests Processed**: ${totalRequests}\n`;
    report += `- **Overall Error Rate**: ${overallErrorRate.toFixed(2)}%\n`;
    report += `- **Average Response Time**: ${avgOfAvgResponseTime.toFixed(2)}ms\n`;
    report += `- **Worst P99 Response Time**: ${maxP99ResponseTime.toFixed(2)}ms\n\n`;
    
    // Production readiness assessment
    report += '## Production Readiness Assessment\n\n';
    
    const isProductionReady = overallErrorRate < 1 && maxP99ResponseTime < 3000;
    
    if (isProductionReady) {
      report += '✅ **Status: PRODUCTION READY**\n\n';
      report += 'The system meets basic production requirements:\n';
      report += '- Error rate below 1%\n';
      report += '- P99 response time below 3 seconds\n\n';
    } else {
      report += '❌ **Status: NOT PRODUCTION READY**\n\n';
      report += 'Critical issues that need to be addressed:\n';
      if (overallErrorRate >= 1) {
        report += `- High error rate: ${overallErrorRate.toFixed(2)}% (target: <1%)\n`;
      }
      if (maxP99ResponseTime >= 3000) {
        report += `- High P99 latency: ${maxP99ResponseTime.toFixed(2)}ms (target: <3000ms)\n`;
      }
      report += '\n';
    }
    
    // Detailed scenario results
    report += '## Scenario Results\n\n';
    
    for (const [name, result] of results) {
      report += `### ${name}\n\n`;
      report += '| Metric | Value |\n';
      report += '|--------|-------|\n';
      report += `| Total Requests | ${result.totalRequests} |\n`;
      report += `| Successful | ${result.successfulRequests} |\n`;
      report += `| Failed | ${result.failedRequests} |\n`;
      report += `| Error Rate | ${result.errorRate.toFixed(2)}% |\n`;
      report += `| Throughput | ${result.throughput.toFixed(2)} req/s |\n`;
      report += `| Avg Response Time | ${result.averageResponseTime.toFixed(2)}ms |\n`;
      report += `| Median Response Time | ${result.medianResponseTime.toFixed(2)}ms |\n`;
      report += `| P95 Response Time | ${result.p95ResponseTime.toFixed(2)}ms |\n`;
      report += `| P99 Response Time | ${result.p99ResponseTime.toFixed(2)}ms |\n`;
      report += `| Min Response Time | ${result.minResponseTime.toFixed(2)}ms |\n`;
      report += `| Max Response Time | ${result.maxResponseTime.toFixed(2)}ms |\n`;
      report += `| Memory Leak | ${result.memoryLeaks ? '⚠️ Yes' : '✅ No'} |\n`;
      
      if (result.bottlenecks.length > 0) {
        report += '\n**Bottlenecks:**\n';
        for (const bottleneck of result.bottlenecks) {
          report += `- ${bottleneck}\n`;
        }
      }
      
      if (result.recommendations.length > 0) {
        report += '\n**Recommendations:**\n';
        for (const rec of result.recommendations) {
          report += `- ${rec}\n`;
        }
      }
      
      report += '\n';
    }
    
    // Critical bottlenecks summary
    report += '## Critical Bottlenecks\n\n';
    
    const allBottlenecks = new Set<string>();
    for (const [_, result] of results) {
      result.bottlenecks.forEach(b => allBottlenecks.add(b));
    }
    
    if (allBottlenecks.size > 0) {
      report += 'The following bottlenecks were identified across all scenarios:\n\n';
      for (const bottleneck of allBottlenecks) {
        report += `1. ${bottleneck}\n`;
      }
    } else {
      report += 'No critical bottlenecks identified.\n';
    }
    
    // Optimization recommendations
    report += '\n## Optimization Recommendations\n\n';
    
    const allRecommendations = new Set<string>();
    for (const [_, result] of results) {
      result.recommendations.forEach(r => allRecommendations.add(r));
    }
    
    if (allRecommendations.size > 0) {
      report += 'Based on the performance analysis, we recommend:\n\n';
      
      // Prioritize recommendations
      const priorities = {
        high: [] as string[],
        medium: [] as string[],
        low: [] as string[],
      };
      
      for (const rec of allRecommendations) {
        if (rec.includes('Critical') || rec.includes('circuit breaker') || rec.includes('memory leak')) {
          priorities.high.push(rec);
        } else if (rec.includes('cache') || rec.includes('pool') || rec.includes('optimize')) {
          priorities.medium.push(rec);
        } else {
          priorities.low.push(rec);
        }
      }
      
      if (priorities.high.length > 0) {
        report += '### High Priority\n';
        priorities.high.forEach((r, i) => report += `${i + 1}. ${r}\n`);
        report += '\n';
      }
      
      if (priorities.medium.length > 0) {
        report += '### Medium Priority\n';
        priorities.medium.forEach((r, i) => report += `${i + 1}. ${r}\n`);
        report += '\n';
      }
      
      if (priorities.low.length > 0) {
        report += '### Low Priority\n';
        priorities.low.forEach((r, i) => report += `${i + 1}. ${r}\n`);
        report += '\n';
      }
    }
    
    // Architecture improvements
    report += '## Architecture Improvements\n\n';
    report += 'For handling 10,000+ concurrent users, consider:\n\n';
    report += '1. **Horizontal Scaling**\n';
    report += '   - Deploy multiple MCP server instances behind a load balancer\n';
    report += '   - Use Kubernetes for auto-scaling based on CPU/memory metrics\n\n';
    
    report += '2. **Caching Layer**\n';
    report += '   - Implement Redis for distributed caching\n';
    report += '   - Cache Hive API responses with intelligent TTLs\n';
    report += '   - Use CDN for static content\n\n';
    
    report += '3. **Queue Architecture**\n';
    report += '   - Implement RabbitMQ or AWS SQS for async processing\n';
    report += '   - Separate read and write operations\n';
    report += '   - Use worker pools for CPU-intensive tasks\n\n';
    
    report += '4. **Database Optimization**\n';
    report += '   - Implement read replicas for query distribution\n';
    report += '   - Use connection pooling with optimal pool sizes\n';
    report += '   - Add indexes for frequently queried fields\n\n';
    
    report += '5. **Monitoring & Observability**\n';
    report += '   - Implement APM with DataDog or New Relic\n';
    report += '   - Add distributed tracing with OpenTelemetry\n';
    report += '   - Set up alerts for SLA violations\n\n';
    
    return report;
  }
  
  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
  }
}

// Export for use in tests
export default LoadTester;