/**
 * DeFi Research Examples
 * Shows how to use TokenResearcher, DeFiAnalyzer, and PortfolioTracker agents
 */

import { OnChainAgents } from '../src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const oca = new OnChainAgents({
  hiveApiKey: process.env.HIVE_API_KEY,
});

async function researchToken() {
  console.log('🔬 Conducting deep token research...\n');
  
  // Research a specific token
  const result = await oca.research('UNI', {
    deep: true,
  });
  
  const research = result.data.research;
  console.log('Token Research Report:');
  console.log('=' .repeat(30));
  console.log(`Token: ${research?.tokenInfo?.name} (${research?.tokenInfo?.symbol})`);
  console.log(`Research Score: ${research?.researchScore}/100`);
  console.log(`Investment Thesis: ${research?.investmentThesis?.verdict}`);
  console.log(`Conviction: ${research?.investmentThesis?.conviction}`);
  
  console.log('\n📊 Fundamentals:');
  console.log(`  Market Cap: $${research?.fundamentals?.marketCap?.toLocaleString()}`);
  console.log(`  FDV: $${research?.fundamentals?.fdv?.toLocaleString()}`);
  console.log(`  Circulating Supply: ${research?.fundamentals?.circulatingSupply?.toLocaleString()}`);
  
  console.log('\n💎 Tokenomics:');
  console.log(`  Token Type: ${research?.tokenomics?.type}`);
  console.log(`  Inflation Rate: ${research?.tokenomics?.inflationRate}%`);
  console.log(`  Burn Mechanism: ${research?.tokenomics?.hasBurnMechanism ? 'Yes' : 'No'}`);
  
  console.log('\n🎯 Investment Thesis:');
  research?.investmentThesis?.keyPoints?.forEach((point: string) => {
    console.log(`  • ${point}`);
  });
  
  return result;
}

async function analyzeDeFiProtocol() {
  console.log('🏦 Analyzing DeFi protocols and yield opportunities...\n');
  
  // Analyze DeFi opportunities
  const result = await oca.analyze('ethereum', 'defi', {
    depth: 'deep',
  });
  
  const defi = result.data.defi;
  
  console.log('DeFi Analysis Results:');
  console.log('=' .repeat(30));
  
  console.log('\n🌟 Top Yield Opportunities:');
  defi?.yieldOpportunities?.slice(0, 5).forEach((opp: any) => {
    console.log(`\n${opp.rank}. ${opp.protocol} - ${opp.asset}`);
    console.log(`   APY: ${opp.totalAPY.toFixed(2)}% (Base: ${opp.baseAPY}%, Rewards: ${opp.rewardAPY}%)`);
    console.log(`   TVL: $${opp.tvl.toLocaleString()}`);
    console.log(`   Risk-Adjusted Return: ${opp.riskAdjustedReturn.toFixed(2)}`);
    console.log(`   Chain: ${opp.chain}`);
    
    if (opp.risks.length > 0) {
      console.log(`   ⚠️  Risks: ${opp.risks.join(', ')}`);
    }
  });
  
  console.log('\n📊 Risk Scorecard:');
  const risks = defi?.riskScores;
  if (risks) {
    console.log(`  Smart Contract Risk: ${risks.smartContractRisk.level} (${risks.smartContractRisk.score}/10)`);
    console.log(`  Liquidity Risk: ${risks.liquidityRisk.level} (${risks.liquidityRisk.score}/10)`);
    console.log(`  Protocol Risk: ${risks.protocolRisk.level} (${risks.protocolRisk.score}/10)`);
    console.log(`  Overall Risk: ${risks.overallRisk.toFixed(1)}/10`);
  }
  
  console.log('\n💰 Optimal Allocation Strategy:');
  const allocation = defi?.optimalAllocation;
  if (allocation) {
    console.log(`  Total Amount: $${allocation.totalAmount.toLocaleString()}`);
    console.log(`  Expected APY: ${allocation.expectedAPY.toFixed(2)}%`);
    console.log(`  Risk Level: ${allocation.riskLevel}`);
    console.log(`  Rebalance: ${allocation.rebalanceFrequency}`);
    
    console.log('\n  Allocations:');
    allocation.allocations?.forEach((alloc: any) => {
      console.log(`    • ${alloc.protocol} (${alloc.chain}): $${alloc.amount.toLocaleString()} (${alloc.percentage.toFixed(1)}%)`);
    });
  }
  
  return result;
}

async function trackPortfolio() {
  console.log('💼 Tracking portfolio performance...\n');
  
  // Track a wallet portfolio
  const result = await oca.track('0xportfolio...wallet', {
    alerts: true,
  });
  
  const portfolio = result.data.portfolio?.data?.portfolio;
  
  console.log('Portfolio Overview:');
  console.log('=' .repeat(30));
  console.log(`Total Value: $${portfolio?.totalValue?.toLocaleString()}`);
  console.log(`Number of Assets: ${portfolio?.numberOfAssets}`);
  console.log(`Total P&L: ${portfolio?.totalPnL > 0 ? '+' : ''}$${portfolio?.totalPnL?.toLocaleString()} (${portfolio?.totalPnLPercent?.toFixed(2)}%)`);
  
  console.log('\n📈 Performance Metrics:');
  const metrics = portfolio?.performance;
  if (metrics) {
    console.log(`  24h Change: ${metrics.change24h > 0 ? '+' : ''}${metrics.change24h.toFixed(2)}%`);
    console.log(`  7d Change: ${metrics.change7d > 0 ? '+' : ''}${metrics.change7d.toFixed(2)}%`);
    console.log(`  30d Change: ${metrics.change30d > 0 ? '+' : ''}${metrics.change30d.toFixed(2)}%`);
    console.log(`  Best Performer: ${metrics.bestPerformer?.symbol} (+${metrics.bestPerformer?.change}%)`);
    console.log(`  Worst Performer: ${metrics.worstPerformer?.symbol} (${metrics.worstPerformer?.change}%)`);
  }
  
  console.log('\n💎 Top Holdings:');
  portfolio?.assets?.slice(0, 5).forEach((asset: any) => {
    const profit = asset.pnl > 0 ? '🟢' : '🔴';
    console.log(`  ${profit} ${asset.symbol}: $${asset.value.toLocaleString()} (${asset.percentage.toFixed(1)}%)`);
    console.log(`     P&L: ${asset.pnl > 0 ? '+' : ''}$${asset.pnl.toLocaleString()} (${asset.pnlPercent.toFixed(2)}%)`);
  });
  
  console.log('\n🎯 Recommendations:');
  result.data.portfolio?.data?.recommendations?.forEach((rec: any) => {
    console.log(`  • ${rec.action}: ${rec.description}`);
  });
  
  return result;
}

async function yieldFarmingStrategy() {
  console.log('🌾 Creating yield farming strategy...\n');
  
  // Create a comprehensive yield farming strategy
  const result = await oca.research('farming', {
    deep: true,
  });
  
  console.log('Yield Farming Strategy:');
  console.log('=' .repeat(30));
  
  // Get DeFi analysis for yield opportunities
  const defiAnalysis = await oca.analyze('multi-chain', 'defi', {
    depth: 'deep',
  });
  
  const topYields = defiAnalysis.data.defi?.yieldOpportunities?.slice(0, 3);
  
  console.log('\n🌟 Recommended Farms:');
  topYields?.forEach((farm: any, i: number) => {
    console.log(`\n${i + 1}. ${farm.protocol} - ${farm.asset} Pool`);
    console.log(`   Chain: ${farm.chain}`);
    console.log(`   APY: ${farm.totalAPY.toFixed(2)}%`);
    console.log(`   TVL: $${farm.tvl.toLocaleString()}`);
    console.log(`   Complexity: ${farm.requirements.complexity}`);
    
    console.log('\n   Strategy:');
    console.log(`   1. Bridge assets to ${farm.chain}`);
    console.log(`   2. Deposit into ${farm.protocol}`);
    console.log(`   3. Stake LP tokens for rewards`);
    console.log(`   4. Compound rewards ${farm.requirements.complexity === 'SIMPLE' ? 'weekly' : 'daily'}`);
    
    if (farm.requirements.lockPeriod) {
      console.log(`   ⏰ Lock Period: ${farm.requirements.lockPeriod} days`);
    }
  });
  
  return { result, defiAnalysis };
}

async function compareProtocols() {
  console.log('⚖️  Comparing DeFi protocols...\n');
  
  const protocols = ['aave', 'compound', 'maker'];
  
  console.log('Protocol Comparison:');
  console.log('=' .repeat(50));
  console.log('| Protocol | TVL       | Best APY | Risk | Audit |');
  console.log('|' + '-'.repeat(48) + '|');
  
  for (const protocol of protocols) {
    const analysis = await oca.analyze('ethereum', protocol);
    const data = analysis.data.defi;
    
    const tvl = `$${(data?.protocols?.[0]?.tvl / 1e9).toFixed(2)}B`;
    const apy = `${data?.yieldOpportunities?.[0]?.totalAPY?.toFixed(2)}%`;
    const risk = data?.riskScores?.overallRisk?.toFixed(1) || 'N/A';
    const audit = data?.protocols?.[0]?.auditStatus?.audited ? '✅' : '❌';
    
    console.log(`| ${protocol.padEnd(8)} | ${tvl.padEnd(9)} | ${apy.padEnd(8)} | ${risk.toString().padEnd(4)} | ${audit.padEnd(5)} |`);
  }
  
  console.log('=' .repeat(50));
}

// Main execution
async function main() {
  try {
    console.log('='.repeat(50));
    console.log('🔬 OnChainAgents DeFi Research Examples');
    console.log('='.repeat(50));
    
    // Example 1: Research a token
    await researchToken();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 2: Analyze DeFi protocol
    await analyzeDeFiProtocol();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 3: Track portfolio
    await trackPortfolio();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 4: Yield farming strategy
    await yieldFarmingStrategy();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 5: Compare protocols
    await compareProtocols();
    
    console.log('\n✅ All DeFi research examples completed!');
    
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
  researchToken,
  analyzeDeFiProtocol,
  trackPortfolio,
  yieldFarmingStrategy,
  compareProtocols
};