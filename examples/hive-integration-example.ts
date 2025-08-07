#!/usr/bin/env ts-node

/**
 * Example: Using OnChainAgents with Hive Intelligence
 * 
 * This example demonstrates how to use OnChainAgents with Hive Intelligence
 * for real-time crypto analysis, security scanning, and market intelligence.
 */

import { HiveBridge } from '../src/bridges/hive-bridge';
import { AlphaHunter } from '../src/agents/market/AlphaHunter';
import { WhaleTracker } from '../src/agents/market/WhaleTracker';
import { SentimentAnalyzer } from '../src/agents/market/SentimentAnalyzer';
import { RugDetector } from '../src/agents/security/RugDetector';
import { TokenResearcher } from '../src/agents/research/TokenResearcher';
import { DeFiAnalyzer } from '../src/agents/research/DeFiAnalyzer';
import { CryptoQuant } from '../src/agents/specialized/CryptoQuant';

async function main() {
  console.log('🚀 OnChainAgents + Hive Intelligence Example\n');
  console.log('=' .repeat(50));
  
  // Initialize Hive Bridge
  // This will use fallback mode if HIVE_API_KEY is not set
  const hiveService = new HiveBridge({
    apiKey: process.env.HIVE_API_KEY,
    fallbackMode: !process.env.HIVE_API_KEY, // Auto-fallback if no API key
    cacheTTL: 3600, // Cache for 1 hour
    logLevel: 'info'
  });
  
  await hiveService.initialize();
  console.log('✅ Hive Intelligence connected\n');
  
  // Example 1: Check if a token is safe
  console.log('📊 Example 1: Security Analysis');
  console.log('-'.repeat(30));
  
  const rugDetector = new RugDetector(hiveService);
  const safetyCheck = await rugDetector.analyze({
    network: 'ethereum',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // USDC
  });
  
  console.log('Token: USDC');
  console.log('Safety Analysis:', safetyCheck);
  console.log();
  
  // Example 2: Find alpha opportunities
  console.log('🎯 Example 2: Alpha Discovery');
  console.log('-'.repeat(30));
  
  const alphaHunter = new AlphaHunter(hiveService);
  const opportunities = await alphaHunter.analyze({
    network: 'ethereum',
    address: '0x0000000000000000000000000000000000000000', // Analyze all tokens
    options: {
      minLiquidity: 100000,
      risk: 'medium'
    }
  } as any);
  
  console.log('Alpha Opportunities:', opportunities);
  console.log();
  
  // Example 3: Track whale activity
  console.log('🐋 Example 3: Whale Tracking');
  console.log('-'.repeat(30));
  
  const whaleTracker = new WhaleTracker(hiveService);
  const whaleActivity = await whaleTracker.analyze({
    address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // Known whale wallet
    network: 'ethereum',
    timeframe: '24h'
  });
  
  console.log('Whale Activity:', whaleActivity);
  console.log();
  
  // Example 4: Analyze market sentiment
  console.log('💭 Example 4: Sentiment Analysis');
  console.log('-'.repeat(30));
  
  const sentimentAnalyzer = new SentimentAnalyzer(hiveService);
  const sentiment = await sentimentAnalyzer.analyze({
    token: 'BTC',
    category: 'cryptocurrency',
    options: {
      timeframe: '24h',
      platforms: ['twitter', 'reddit']
    }
  });
  
  console.log('Bitcoin Sentiment:', sentiment);
  console.log();
  
  // Example 5: Research a token
  console.log('🔬 Example 5: Token Research');
  console.log('-'.repeat(30));
  
  const tokenResearcher = new TokenResearcher(hiveService);
  const research = await tokenResearcher.analyze({
    token: 'UNI',
    network: 'ethereum'
  });
  
  console.log('UNI Research:', research);
  console.log();
  
  // Example 6: Find DeFi opportunities
  console.log('💰 Example 6: DeFi Analysis');
  console.log('-'.repeat(30));
  
  const defiAnalyzer = new DeFiAnalyzer(hiveService);
  const defiOpps = await defiAnalyzer.analyze({
    network: 'ethereum',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    options: {
      protocol: 'all',
      strategy: 'balanced'
    }
  } as any);
  
  console.log('DeFi Opportunities:', defiOpps);
  console.log();
  
  // Example 7: Quantitative analysis with CryptoQuant
  console.log('📈 Example 7: Quantitative Analysis');
  console.log('-'.repeat(30));
  
  const cryptoQuant = new CryptoQuant(hiveService);
  const quantAnalysis = await cryptoQuant.analyze({
    network: 'ethereum',
    address: '0x0000000000000000000000000000000000000000',
    options: {
      assets: ['BTC', 'ETH'],
      analysis: 'correlation',
      model: 'GARCH',
      timeframe: '30d'
    }
  } as any);
  
  console.log('Quant Analysis:', quantAnalysis);
  console.log();
  
  // Summary
  console.log('=' .repeat(50));
  console.log('✅ Examples completed successfully!');
  console.log();
  console.log('💡 Tips:');
  console.log('1. Set HIVE_API_KEY for real data');
  console.log('2. Use fallback mode for testing');
  console.log('3. Enable caching to reduce API calls');
  console.log('4. Check logs for detailed information');
  console.log();
  console.log('📖 See HIVE_INTEGRATION.md for more details');
}

// Run the example
main().catch(error => {
  console.error('❌ Example failed:', error);
  process.exit(1);
});