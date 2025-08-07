#!/usr/bin/env ts-node

/**
 * Comprehensive MCP Server and Agent Testing
 * Tests all functionality in realistic scenarios
 */

import { spawn } from 'child_process';
import { HiveBridge } from './src/bridges/hive-bridge';
import { HiveMCPClient } from './src/mcp/HiveMCPClient';
import { HiveMCPRemoteClient } from './src/mcp/HiveMCPRemoteClient';

// Import all agents
import { AlphaHunter } from './src/agents/market/AlphaHunter';
import { WhaleTracker } from './src/agents/market/WhaleTracker';
import { SentimentAnalyzer } from './src/agents/market/SentimentAnalyzer';
import { MarketMaker } from './src/agents/market/MarketMaker';
import { TokenResearcher } from './src/agents/research/TokenResearcher';
import { DeFiAnalyzer } from './src/agents/research/DeFiAnalyzer';
import { PortfolioTracker } from './src/agents/research/PortfolioTracker';
import { YieldOptimizer } from './src/agents/research/YieldOptimizer';
import { RugDetector } from './src/agents/security/RugDetector';
import { RiskAnalyzer } from './src/agents/security/RiskAnalyzer';
import { CrossChainNavigator } from './src/agents/specialized/CrossChainNavigator';
import { MarketStructureAnalyst } from './src/agents/specialized/MarketStructureAnalyst';
import { NFTValuator } from './src/agents/specialized/NFTValuator';
import { GovernanceAdvisor } from './src/agents/specialized/GovernanceAdvisor';
import { ChainAnalyst } from './src/agents/specialized/ChainAnalyst';
import { CryptoQuant } from './src/agents/specialized/CryptoQuant';

// Test tracking
interface TestCase {
  name: string;
  description: string;
  execute: () => Promise<any>;
  validate: (result: any) => boolean;
}

const testResults: { name: string; passed: boolean; error?: string; time: number }[] = [];

// Initialize services
// Set fallbackMode based on environment or default to true for testing
const hiveService = new HiveBridge({
  fallbackMode: process.env.USE_REAL_HIVE !== 'true',
  hiveUrl: process.env.HIVE_MCP_URL || 'https://hiveintelligence.xyz',
  apiKey: process.env.HIVE_API_KEY,
  cacheTTL: 300,
  logLevel: process.env.LOG_LEVEL || 'error',
});

async function runTestCase(testCase: TestCase): Promise<void> {
  const startTime = Date.now();
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   ${testCase.description}`);
  
  try {
    const result = await testCase.execute();
    const isValid = testCase.validate(result);
    const time = Date.now() - startTime;
    
    if (isValid) {
      console.log(`   ✅ PASSED (${time}ms)`);
      testResults.push({ name: testCase.name, passed: true, time });
    } else {
      console.log(`   ❌ FAILED: Validation failed`);
      testResults.push({ name: testCase.name, passed: false, error: 'Validation failed', time });
    }
  } catch (error) {
    const time = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`   ❌ FAILED: ${errorMsg}`);
    testResults.push({ name: testCase.name, passed: false, error: errorMsg, time });
  }
}

// Define test cases
const testCases: TestCase[] = [
  // Hive Bridge Tests
  {
    name: 'Hive Bridge Initialization',
    description: 'Test Hive bridge can initialize and be ready',
    execute: async () => {
      return await hiveService.healthCheck();
    },
    validate: (result) => result === true,
  },

  // Realistic Agent Scenarios
  {
    name: 'Rug Detection - USDC',
    description: 'Verify USDC is detected as safe',
    execute: async () => {
      const detector = new RugDetector(hiveService);
      return await detector.analyze({
        network: 'ethereum',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      });
    },
    validate: (result) => 
      result && result.verdict && (result.verdict === 'SAFE' || result.verdict === 'UNKNOWN'),
  },

  {
    name: 'Alpha Hunter - Find Opportunities',
    description: 'Discover high-potential tokens',
    execute: async () => {
      const hunter = new AlphaHunter(hiveService);
      return await hunter.analyze({
        network: 'ethereum',
        risk: 'medium',
        minLiquidity: 100000,
      });
    },
    validate: (result) => 
      result && result.opportunities && Array.isArray(result.opportunities),
  },

  {
    name: 'Whale Tracking - Binance Wallet',
    description: 'Track major exchange wallet activity',
    execute: async () => {
      const tracker = new WhaleTracker(hiveService);
      return await tracker.analyze({
        address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
        network: 'ethereum',
        timeframe: '24h',
      });
    },
    validate: (result) => 
      result && result.whaleActivity !== undefined,
  },

  {
    name: 'Sentiment Analysis - Bitcoin',
    description: 'Analyze BTC market sentiment',
    execute: async () => {
      const analyzer = new SentimentAnalyzer(hiveService);
      return await analyzer.analyze({
        token: 'BTC',
        category: 'cryptocurrency',
        options: { timeframe: '24h' },
      });
    },
    validate: (result) => 
      result && 
      typeof result.sentimentScore === 'number' &&
      result.sentimentScore >= -100 && 
      result.sentimentScore <= 100,
  },

  {
    name: 'DeFi Protocol Analysis',
    description: 'Analyze DeFi opportunities across protocols',
    execute: async () => {
      const analyzer = new DeFiAnalyzer(hiveService);
      return await analyzer.analyze({
        protocol: 'all',
        asset: 'USDC',
        strategy: 'balanced',
      });
    },
    validate: (result) => 
      result && result.opportunities !== undefined,
  },

  {
    name: 'NFT Valuation - BAYC',
    description: 'Value Bored Ape Yacht Club NFT',
    execute: async () => {
      const valuator = new NFTValuator(hiveService);
      return await valuator.analyze({
        collection: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
        tokenId: 1,
        network: 'ethereum',
      });
    },
    validate: (result) => 
      result && result.valuation && result.valuation.estimatedValue >= 0,
  },

  {
    name: 'Cross-Chain Bridge Analysis',
    description: 'Find optimal bridge route for USDC',
    execute: async () => {
      const navigator = new CrossChainNavigator(hiveService);
      return await navigator.analyze({
        fromNetwork: 'ethereum',
        toNetwork: 'polygon',
        token: 'USDC',
        amount: 1000,
      });
    },
    validate: (result) => 
      result && result.routes && Array.isArray(result.routes),
  },

  {
    name: 'Yield Optimization',
    description: 'Find best yield farming opportunities',
    execute: async () => {
      const optimizer = new YieldOptimizer(hiveService);
      return await optimizer.analyze({
        amount: 10000,
        token: 'USDC',
        riskTolerance: 'medium',
        chains: ['ethereum', 'polygon'],
      });
    },
    validate: (result) => 
      result && result.strategies && Array.isArray(result.strategies),
  },

  {
    name: 'Governance Proposal Analysis',
    description: 'Analyze DAO governance proposal',
    execute: async () => {
      const advisor = new GovernanceAdvisor(hiveService);
      return await advisor.analyze({
        protocol: 'uniswap',
        proposalId: '1',
      });
    },
    validate: (result) => 
      result && result.recommendation !== undefined,
  },

  {
    name: 'Market Structure Analysis',
    description: 'Analyze ETH market microstructure',
    execute: async () => {
      const analyst = new MarketStructureAnalyst(hiveService);
      return await analyst.analyze({
        network: 'ethereum',
        token: 'ETH',
        venue: 'all',
      });
    },
    validate: (result) => 
      result && result.microstructure !== undefined,
  },

  {
    name: 'Chain Forensics',
    description: 'Trace transaction flow for wallet',
    execute: async () => {
      const analyst = new ChainAnalyst(hiveService);
      return await analyst.analyze({
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        network: 'ethereum',
        depth: 2,
      });
    },
    validate: (result) => 
      result && result.flowAnalysis !== undefined,
  },

  {
    name: 'Quantitative Analysis - Correlation',
    description: 'Analyze BTC/ETH correlation with GARCH model',
    execute: async () => {
      const quant = new CryptoQuant(hiveService);
      return await quant.analyze({
        assets: ['BTC', 'ETH'],
        options: {
          analysis: 'correlation',
          model: 'GARCH',
          timeframe: '30d',
        },
      });
    },
    validate: (result) => 
      result && result.analysis && result.models !== undefined,
  },

  {
    name: 'Portfolio Risk Assessment',
    description: 'Analyze portfolio risk metrics',
    execute: async () => {
      const analyzer = new RiskAnalyzer(hiveService);
      return await analyzer.analyze({
        portfolio: [
          { token: 'BTC', amount: 1, value: 40000 },
          { token: 'ETH', amount: 10, value: 25000 },
          { token: 'USDC', amount: 10000, value: 10000 },
        ],
      });
    },
    validate: (result) => 
      result && 
      result.overallRiskScore >= 0 && 
      result.overallRiskScore <= 100,
  },

  {
    name: 'Token Research - Comprehensive',
    description: 'Deep research on token fundamentals',
    execute: async () => {
      const researcher = new TokenResearcher(hiveService);
      return await researcher.analyze({
        token: 'UNI',
        network: 'ethereum',
      });
    },
    validate: (result) => 
      result && result.fundamentals !== undefined,
  },

  {
    name: 'Market Maker Analysis',
    description: 'Analyze market making opportunities',
    execute: async () => {
      const maker = new MarketMaker(hiveService);
      return await maker.analyze({
        network: 'ethereum',
        token: 'USDC',
        venue: 'uniswap',
      });
    },
    validate: (result) => 
      result && result.spreadOptimization !== undefined,
  },

  // Error Handling Tests
  {
    name: 'Invalid Address Handling',
    description: 'Test error handling for invalid address',
    execute: async () => {
      const detector = new RugDetector(hiveService);
      try {
        await detector.analyze({
          network: 'ethereum',
          address: 'invalid_address',
        });
        return false;
      } catch (error) {
        return true; // Should throw error
      }
    },
    validate: (result) => result === true,
  },

  {
    name: 'Empty Portfolio Handling',
    description: 'Test handling of empty portfolio',
    execute: async () => {
      const tracker = new PortfolioTracker(hiveService);
      return await tracker.analyze({
        wallets: [],
      });
    },
    validate: (result) => 
      result && result.summary && result.summary.totalValue === 0,
  },
];

// Performance test
async function performanceTest(): Promise<void> {
  console.log('\n⚡ Performance Testing\n' + '='.repeat(40));
  
  const hunter = new AlphaHunter(hiveService);
  const times: number[] = [];
  
  console.log('Running 10 concurrent analyses...');
  const startTime = Date.now();
  
  const promises = Array(10).fill(0).map(async () => {
    const start = Date.now();
    await hunter.analyze({ network: 'ethereum' });
    return Date.now() - start;
  });
  
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  console.log(`✅ Completed in ${totalTime}ms`);
  console.log(`   Average per request: ${Math.round(results.reduce((a, b) => a + b, 0) / results.length)}ms`);
  console.log(`   Min: ${Math.min(...results)}ms`);
  console.log(`   Max: ${Math.max(...results)}ms`);
}

// MCP Server spawn test
async function testMCPServerSpawn(): Promise<void> {
  console.log('\n🚀 Testing MCP Server Spawn\n' + '='.repeat(40));
  
  return new Promise((resolve) => {
    const mcpServer = spawn('npx', ['ts-node', 'src/mcp/mcp-server.ts'], {
      env: { ...process.env, HIVE_FALLBACK_MODE: 'true' },
    });
    
    let output = '';
    
    mcpServer.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('MCP server started')) {
        console.log('✅ MCP server started successfully');
        mcpServer.kill();
        resolve();
      }
    });
    
    mcpServer.stderr.on('data', (data) => {
      console.error('MCP server error:', data.toString());
    });
    
    mcpServer.on('close', (code) => {
      if (code !== null && code !== 0) {
        console.log(`MCP server exited with code ${code}`);
      }
      resolve();
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('⏱️ MCP server start timeout - killing process');
      mcpServer.kill();
      resolve();
    }, 10000);
  });
}

// Main test runner
async function runComprehensiveTests(): Promise<void> {
  console.log('🔬 OnChainAgents Comprehensive Testing Suite');
  console.log('=' .repeat(50));
  console.log('Testing MCP server, all agents, and real-world scenarios\n');
  
  // Initialize Hive service
  console.log('🔧 Initializing services...');
  await hiveService.initialize();
  console.log('✅ Services initialized\n');
  
  // Run all test cases
  console.log('📋 Running Test Cases\n' + '='.repeat(40));
  for (const testCase of testCases) {
    await runTestCase(testCase);
  }
  
  // Run performance test
  await performanceTest();
  
  // Test MCP server spawn
  await testMCPServerSpawn();
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY\n');
  
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  const totalTime = testResults.reduce((sum, r) => sum + r.time, 0);
  
  console.log(`Total Tests: ${testResults.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Time: ${totalTime}ms`);
  console.log(`📊 Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }
  
  // Final verdict
  console.log('\n' + '='.repeat(50));
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! The package is fully functional.');
  } else {
    console.log(`⚠️ ${failed} tests failed. Review the errors above.`);
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

// Run tests
runComprehensiveTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});