#!/usr/bin/env ts-node

/**
 * Comprehensive test script for all OnChainAgents personas
 * Tests all 12 specialized agents to ensure they work correctly
 */

import { HiveBridge } from '../../src/bridges/hive-bridge';
import { AlphaHunter } from '../../src/agents/market/AlphaHunter';
import { WhaleTracker } from '../../src/agents/market/WhaleTracker';
import { SentimentAnalyzer } from '../../src/agents/market/SentimentAnalyzer';
import { MarketMaker } from '../../src/agents/market/MarketMaker';
import { TokenResearcher } from '../../src/agents/research/TokenResearcher';
import { DeFiAnalyzer } from '../../src/agents/research/DeFiAnalyzer';
import { PortfolioTracker } from '../../src/agents/research/PortfolioTracker';
import { YieldOptimizer } from '../../src/agents/research/YieldOptimizer';
import { RugDetector } from '../../src/agents/security/RugDetector';
import { RiskAnalyzer } from '../../src/agents/security/RiskAnalyzer';
import { CrossChainNavigator } from '../../src/agents/specialized/CrossChainNavigator';
import { MarketStructureAnalyst } from '../../src/agents/specialized/MarketStructureAnalyst';
import { NFTValuator } from '../../src/agents/specialized/NFTValuator';
import { GovernanceAdvisor } from '../../src/agents/specialized/GovernanceAdvisor';
import { ChainAnalyst } from '../../src/agents/specialized/ChainAnalyst';
import { CryptoQuant } from '../../src/agents/specialized/CryptoQuant';

// Test result tracking
interface TestResult {
  agent: string;
  success: boolean;
  error?: string;
  executionTime: number;
}

const results: TestResult[] = [];

// Configure Hive Bridge in fallback mode for testing
const hiveService = new HiveBridge({
  fallbackMode: true,
  cacheTTL: 300,
  logLevel: 'error', // Reduce noise during testing
});

// Initialize Hive service
async function initializeHive() {
  console.log('🔧 Initializing Hive service...');
  await hiveService.initialize();
  const healthy = await hiveService.healthCheck();
  if (!healthy) {
    throw new Error('Hive service health check failed');
  }
  console.log('✅ Hive service initialized successfully\n');
}

// Test helper function
async function testAgent(
  name: string,
  agent: any,
  testContext: any
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log(`🧪 Testing ${name}...`);
    const result = await agent.analyze(testContext);
    
    if (!result) {
      throw new Error('Agent returned null/undefined result');
    }
    
    const executionTime = Date.now() - startTime;
    console.log(`✅ ${name} test passed (${executionTime}ms)`);
    
    return {
      agent: name,
      success: true,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ ${name} test failed: ${errorMessage}`);
    
    return {
      agent: name,
      success: false,
      error: errorMessage,
      executionTime,
    };
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 OnChainAgents Comprehensive Test Suite\n');
  console.log('=' .repeat(50));
  console.log('Testing 12 specialized crypto agents\n');
  
  try {
    // Initialize Hive service
    await initializeHive();
    
    // Test contexts for different agent types
    const tokenContext = {
      network: 'ethereum',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    };
    
    const walletContext = {
      address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // Binance wallet
      network: 'ethereum',
    };
    
    const sentimentContext = {
      token: 'BTC',
      category: 'cryptocurrency',
      options: {
        timeframe: '24h',
      },
    };
    
    const portfolioContext = {
      wallets: [
        {
          address: '0x123...',
          network: 'ethereum',
        },
      ],
    };
    
    const nftContext = {
      collection: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // BAYC
      tokenId: 1,
      network: 'ethereum',
    };
    
    const quantContext = {
      assets: ['BTC', 'ETH'],
      options: {
        analysis: 'correlation',
        timeframe: '30d',
      },
    };
    
    // Market Intelligence Agents
    console.log('\n📊 Market Intelligence Agents\n' + '-'.repeat(30));
    results.push(await testAgent('AlphaHunter', new AlphaHunter(hiveService), tokenContext));
    results.push(await testAgent('WhaleTracker', new WhaleTracker(hiveService), walletContext));
    results.push(await testAgent('SentimentAnalyzer', new SentimentAnalyzer(hiveService), sentimentContext));
    results.push(await testAgent('MarketMaker', new MarketMaker(hiveService), tokenContext));
    
    // Research Agents
    console.log('\n🔬 Research Agents\n' + '-'.repeat(30));
    results.push(await testAgent('TokenResearcher', new TokenResearcher(hiveService), tokenContext));
    results.push(await testAgent('DeFiAnalyzer', new DeFiAnalyzer(hiveService), tokenContext));
    results.push(await testAgent('PortfolioTracker', new PortfolioTracker(hiveService), portfolioContext));
    results.push(await testAgent('YieldOptimizer', new YieldOptimizer(hiveService), tokenContext));
    
    // Security Agents
    console.log('\n🛡️ Security Agents\n' + '-'.repeat(30));
    results.push(await testAgent('RugDetector', new RugDetector(hiveService), tokenContext));
    results.push(await testAgent('RiskAnalyzer', new RiskAnalyzer(hiveService), portfolioContext));
    
    // Specialized Agents
    console.log('\n🎯 Specialized Agents\n' + '-'.repeat(30));
    results.push(await testAgent('CrossChainNavigator', new CrossChainNavigator(hiveService), {
      fromNetwork: 'ethereum',
      toNetwork: 'polygon',
      token: 'USDC',
      amount: 1000,
    }));
    results.push(await testAgent('MarketStructureAnalyst', new MarketStructureAnalyst(hiveService), tokenContext));
    results.push(await testAgent('NFTValuator', new NFTValuator(hiveService), nftContext));
    results.push(await testAgent('GovernanceAdvisor', new GovernanceAdvisor(hiveService), {
      protocol: 'uniswap',
      proposalId: '1',
    }));
    results.push(await testAgent('ChainAnalyst', new ChainAnalyst(hiveService), walletContext));
    results.push(await testAgent('CryptoQuant', new CryptoQuant(hiveService), quantContext));
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 TEST RESULTS SUMMARY\n');
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);
    const avgTime = Math.round(totalTime / results.length);
    
    console.log(`✅ Passed: ${passed}/${results.length}`);
    console.log(`❌ Failed: ${failed}/${results.length}`);
    console.log(`⏱️  Total execution time: ${totalTime}ms`);
    console.log(`📊 Average time per agent: ${avgTime}ms`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.agent}: ${r.error}`);
        });
    }
    
    // Performance analysis
    console.log('\n⚡ Performance Analysis:');
    const sorted = [...results].sort((a, b) => a.executionTime - b.executionTime);
    console.log(`  Fastest: ${sorted[0].agent} (${sorted[0].executionTime}ms)`);
    console.log(`  Slowest: ${sorted[sorted.length - 1].agent} (${sorted[sorted.length - 1].executionTime}ms)`);
    
    // Exit with appropriate code
    if (failed > 0) {
      console.log('\n❌ Some tests failed. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed successfully! 🎉');
      console.log('The OnChainAgents package is ready for use.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error during test execution:', error);
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});