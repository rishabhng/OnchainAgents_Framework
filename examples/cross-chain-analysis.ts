/**
 * Cross-Chain Analysis Examples
 * Shows how to use CrossChainNavigator and MarketStructureAnalyst agents
 */

import { OnChainAgents } from '../src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const oca = new OnChainAgents({
  hiveApiKey: process.env.HIVE_API_KEY,
});

async function findBestBridgeRoute() {
  console.log('🌉 Finding optimal bridge route...\n');
  
  // Find best route to bridge USDC from Ethereum to Arbitrum
  const result = await oca.analyze('cross-chain', 'bridge', {
    depth: 'deep',
  });
  
  const bridgeData = result.data.specialized?.crossChain;
  
  console.log('Bridge Route Analysis:');
  console.log('=' .repeat(30));
  console.log('From: Ethereum → To: Arbitrum');
  console.log('Asset: USDC');
  console.log('Amount: $10,000\n');
  
  console.log('🌟 Best Route:');
  const bestRoute = bridgeData?.routes?.[0];
  if (bestRoute) {
    console.log(`  Bridge: ${bestRoute.bridge}`);
    console.log(`  Total Cost: $${bestRoute.totalCost.toFixed(2)}`);
    console.log(`  Time: ${bestRoute.estimatedTime}`);
    console.log(`  Steps: ${bestRoute.steps.length}`);
    
    console.log('\n  Route Steps:');
    bestRoute.steps.forEach((step: any, i: number) => {
      console.log(`    ${i + 1}. ${step.action} on ${step.chain}`);
    });
  }
  
  console.log('\n💰 Cost Breakdown:');
  const costs = bridgeData?.costAnalysis;
  if (costs) {
    console.log(`  Gas (Source): $${costs.sourceGas.toFixed(2)}`);
    console.log(`  Gas (Destination): $${costs.destGas.toFixed(2)}`);
    console.log(`  Bridge Fee: $${costs.bridgeFee.toFixed(2)}`);
    console.log(`  Slippage: $${costs.slippage.toFixed(2)}`);
    console.log(`  Total: $${costs.total.toFixed(2)}`);
  }
  
  console.log('\n⚠️  Risk Factors:');
  bridgeData?.risks?.forEach((risk: string) => {
    console.log(`  • ${risk}`);
  });
  
  return result;
}

async function analyzeMarketStructure() {
  console.log('📊 Analyzing market microstructure...\n');
  
  // Analyze market structure for ETH
  const result = await oca.analyze('ethereum', 'ETH', {
    depth: 'deep',
  });
  
  const market = result.data.specialized?.marketStructure;
  
  console.log('Market Structure Analysis - ETH:');
  console.log('=' .repeat(30));
  
  console.log('\n📈 Order Book Analysis:');
  const orderBook = market?.orderBook;
  if (orderBook) {
    console.log(`  Bid-Ask Spread: ${orderBook.spread.toFixed(4)}%`);
    console.log(`  Depth (±2%): $${orderBook.depth2Percent.toLocaleString()}`);
    console.log(`  Buy Pressure: ${orderBook.buyPressure.toFixed(2)}%`);
    console.log(`  Sell Pressure: ${orderBook.sellPressure.toFixed(2)}%`);
    console.log(`  Imbalance: ${orderBook.imbalance > 0 ? 'Bullish' : 'Bearish'} (${Math.abs(orderBook.imbalance).toFixed(2)}%)`);
  }
  
  console.log('\n💧 Liquidity Analysis:');
  const liquidity = market?.liquidity;
  if (liquidity) {
    console.log(`  Total Liquidity: $${liquidity.total.toLocaleString()}`);
    console.log(`  CEX Liquidity: $${liquidity.cex.toLocaleString()} (${liquidity.cexPercent.toFixed(1)}%)`);
    console.log(`  DEX Liquidity: $${liquidity.dex.toLocaleString()} (${liquidity.dexPercent.toFixed(1)}%)`);
    console.log(`  Fragmentation Score: ${liquidity.fragmentation}/10`);
  }
  
  console.log('\n⚡ MEV Analysis:');
  const mev = market?.mev;
  if (mev) {
    console.log(`  MEV Opportunities: ${mev.opportunities}`);
    console.log(`  Sandwich Risk: ${mev.sandwichRisk}`);
    console.log(`  Frontrun Protection: ${mev.hasProtection ? 'Yes' : 'No'}`);
    console.log(`  Average MEV Value: $${mev.avgValue.toFixed(2)}`);
  }
  
  console.log('\n🎯 Trading Recommendations:');
  market?.recommendations?.forEach((rec: string) => {
    console.log(`  • ${rec}`);
  });
  
  return result;
}

async function crossChainArbitrage() {
  console.log('💰 Scanning for cross-chain arbitrage...\n');
  
  // Find arbitrage opportunities across chains
  const result = await oca.hunt({
    category: 'arbitrage',
  });
  
  console.log('Cross-Chain Arbitrage Opportunities:');
  console.log('=' .repeat(30));
  
  const opportunities = result.data.opportunities?.filter((o: any) => o.type === 'arbitrage');
  
  opportunities?.slice(0, 5).forEach((arb: any) => {
    console.log(`\n🎯 ${arb.token} Arbitrage`);
    console.log(`  Buy on: ${arb.buyChain} @ $${arb.buyPrice}`);
    console.log(`  Sell on: ${arb.sellChain} @ $${arb.sellPrice}`);
    console.log(`  Profit: $${arb.profit.toFixed(2)} (${arb.profitPercent.toFixed(2)}%)`);
    console.log(`  Volume Required: $${arb.minVolume.toLocaleString()}`);
    console.log(`  Time Window: ${arb.timeWindow}`);
    
    if (arb.steps) {
      console.log('\n  Execution Steps:');
      arb.steps.forEach((step: string, i: number) => {
        console.log(`    ${i + 1}. ${step}`);
      });
    }
  });
  
  return result;
}

async function liquidityMapping() {
  console.log('🗺️  Mapping liquidity across chains...\n');
  
  // Map liquidity for major tokens across chains
  const tokens = ['USDC', 'ETH', 'WBTC'];
  const chains = ['ethereum', 'arbitrum', 'polygon', 'optimism', 'bsc'];
  
  console.log('Multi-Chain Liquidity Map:');
  console.log('=' .repeat(60));
  console.log('| Token | ' + chains.map(c => c.slice(0, 8).padEnd(10)).join('| ') + '|');
  console.log('|' + '-'.repeat(58) + '|');
  
  for (const token of tokens) {
    const liquidityData: string[] = [];
    
    for (const chain of chains) {
      // Simulate liquidity check (would use actual agent in production)
      const analysis = await oca.analyze(chain, token);
      const liquidity = analysis.data.specialized?.marketStructure?.liquidity?.total || 0;
      liquidityData.push(`$${(liquidity / 1e6).toFixed(1)}M`);
    }
    
    console.log(`| ${token.padEnd(5)} | ${liquidityData.map(l => l.padEnd(10)).join('| ')} |`);
  }
  
  console.log('=' .repeat(60));
}

async function optimalExecutionStrategy() {
  console.log('🎯 Creating optimal execution strategy...\n');
  
  // Create execution strategy for large trade
  const tradeSize = 1000000; // $1M USDC → ETH
  
  console.log('Trade Parameters:');
  console.log(`  Size: $${tradeSize.toLocaleString()}`);
  console.log(`  Pair: USDC → ETH`);
  console.log(`  Urgency: Medium\n`);
  
  const result = await oca.analyze('ethereum', 'execution-strategy');
  const strategy = result.data.specialized?.marketStructure?.executionStrategy;
  
  console.log('Optimal Execution Strategy:');
  console.log('=' .repeat(30));
  
  if (strategy) {
    console.log(`\n📋 Strategy: ${strategy.type}`);
    console.log(`  Split into: ${strategy.chunks} orders`);
    console.log(`  Time frame: ${strategy.timeframe}`);
    console.log(`  Expected slippage: ${strategy.expectedSlippage.toFixed(2)}%`);
    console.log(`  Expected cost: $${strategy.expectedCost.toFixed(2)}`);
    
    console.log('\n🏪 Venue Allocation:');
    strategy.venues?.forEach((venue: any) => {
      console.log(`  ${venue.name}: ${venue.percentage}% ($${venue.amount.toLocaleString()})`);
    });
    
    console.log('\n⏰ Execution Schedule:');
    strategy.schedule?.forEach((slot: any, i: number) => {
      console.log(`  ${i + 1}. ${slot.time}: $${slot.amount.toLocaleString()} on ${slot.venue}`);
    });
    
    console.log('\n⚠️  Risk Management:');
    console.log(`  Max slippage: ${strategy.maxSlippage}%`);
    console.log(`  Stop loss: ${strategy.stopLoss}%`);
    console.log(`  MEV protection: ${strategy.mevProtection ? 'Enabled' : 'Disabled'}`);
  }
  
  return result;
}

// Main execution
async function main() {
  try {
    console.log('='.repeat(50));
    console.log('🌐 OnChainAgents Cross-Chain Analysis Examples');
    console.log('='.repeat(50));
    
    // Example 1: Find best bridge route
    await findBestBridgeRoute();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 2: Analyze market structure
    await analyzeMarketStructure();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 3: Cross-chain arbitrage
    await crossChainArbitrage();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 4: Liquidity mapping
    await liquidityMapping();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 5: Optimal execution strategy
    await optimalExecutionStrategy();
    
    console.log('\n✅ All cross-chain analysis examples completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { 
  findBestBridgeRoute,
  analyzeMarketStructure,
  crossChainArbitrage,
  liquidityMapping,
  optimalExecutionStrategy
};