/**
 * Market Intelligence Examples
 * Shows how to use AlphaHunter, WhaleTracker, and SentimentAnalyzer agents
 */

import { OnChainAgents } from '../src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const oca = new OnChainAgents({
  hiveApiKey: process.env.HIVE_API_KEY,
});

async function huntForAlpha() {
  console.log('🎯 Hunting for alpha opportunities...\n');
  
  // Find opportunities with specific criteria
  const result = await oca.hunt({
    category: 'defi',
    risk: 'medium',
  });
  
  console.log(`Found ${result.data.opportunities?.length || 0} opportunities:\n`);
  
  result.data.opportunities?.slice(0, 5).forEach((opp: any) => {
    console.log(`📈 ${opp.symbol || opp.name}`);
    console.log(`   Score: ${opp.score}/100`);
    console.log(`   Type: ${opp.type}`);
    console.log(`   Confidence: ${opp.confidence}%`);
    console.log(`   Entry: $${opp.entryPrice}`);
    console.log(`   Target: $${opp.targetPrice} (+${opp.potentialGain}%)\n`);
  });
  
  return result;
}

async function trackWhaleActivity() {
  console.log('🐋 Tracking whale movements...\n');
  
  // Track a known whale wallet
  const result = await oca.track('0xwhale...wallet');
  
  const whaleData = result.data.whaleActivity?.data;
  console.log('Whale Status:', whaleData?.isWhale ? '✅ Confirmed Whale' : '❌ Not a Whale');
  console.log('Wallet Type:', whaleData?.walletType);
  console.log('Total Holdings:', `$${whaleData?.totalValue?.toLocaleString()}`);
  
  console.log('\nRecent Activity:');
  whaleData?.recentTransactions?.slice(0, 3).forEach((tx: any) => {
    const action = tx.value > 0 ? '📥 Buy' : '📤 Sell';
    console.log(`  ${action} ${tx.tokenSymbol}: $${Math.abs(tx.value).toLocaleString()}`);
  });
  
  console.log('\nTop Holdings:');
  whaleData?.topHoldings?.slice(0, 5).forEach((holding: any) => {
    console.log(`  ${holding.symbol}: $${holding.value.toLocaleString()} (${holding.percentage}%)`);
  });
  
  return result;
}

async function analyzeSentiment() {
  console.log('😊 Analyzing market sentiment...\n');
  
  // Analyze sentiment for Bitcoin
  const result = await oca.sentiment('BTC', {
    sources: 'twitter,reddit,telegram',
  });
  
  const sentimentData = result.data;
  console.log('Overall Sentiment:', sentimentData.sentiment);
  console.log('Sentiment Score:', `${sentimentData.score}/100`);
  
  console.log('\nSentiment by Source:');
  if (sentimentData.analysis?.sources) {
    Object.entries(sentimentData.analysis.sources).forEach(([source, data]: [string, any]) => {
      console.log(`  ${source}: ${data.sentiment} (${data.score}/100)`);
    });
  }
  
  console.log('\nTrending Topics:');
  sentimentData.analysis?.keywords?.slice(0, 5).forEach((keyword: string) => {
    console.log(`  #${keyword}`);
  });
  
  console.log('\nInfluencer Mentions:');
  sentimentData.analysis?.influencers?.slice(0, 3).forEach((influencer: any) => {
    console.log(`  @${influencer.handle}: "${influencer.latestTweet}"`);
  });
  
  return result;
}

async function copyTradeWhales() {
  console.log('🔄 Setting up whale copy trading...\n');
  
  // Find whales to copy trade
  const whales = await oca.hunt({
    category: 'whale-trades',
  });
  
  console.log('Top Whales to Follow:\n');
  
  whales.data.opportunities?.slice(0, 3).forEach((whale: any) => {
    console.log(`🐋 Whale ${whale.address.slice(0, 10)}...`);
    console.log(`   Win Rate: ${whale.winRate}%`);
    console.log(`   Avg Profit: ${whale.avgProfit}%`);
    console.log(`   Recent Trade: ${whale.lastAction}`);
    console.log(`   Recommendation: ${whale.copyTrade ? '✅ Copy' : '❌ Skip'}\n`);
  });
  
  return whales;
}

async function marketOverview() {
  console.log('📊 Generating market overview...\n');
  
  // Get comprehensive market analysis
  const [sentiment, whales, opportunities] = await Promise.all([
    oca.sentiment('MARKET'), // Overall market sentiment
    oca.track('top-whales'),  // Top whale activity
    oca.hunt(),               // Best opportunities
  ]);
  
  console.log('=== MARKET OVERVIEW ===\n');
  
  console.log('📈 Market Sentiment:');
  console.log(`   Overall: ${sentiment.data.sentiment}`);
  console.log(`   Score: ${sentiment.data.score}/100`);
  console.log(`   Trend: ${sentiment.data.trend || 'Neutral'}\n`);
  
  console.log('🐋 Whale Activity:');
  console.log(`   Active Whales: ${whales.data.activeCount || 0}`);
  console.log(`   Net Flow: ${whales.data.netFlow > 0 ? '📥 Buying' : '📤 Selling'}`);
  console.log(`   Volume: $${Math.abs(whales.data.netFlow || 0).toLocaleString()}\n`);
  
  console.log('🎯 Top Opportunities:');
  opportunities.data.opportunities?.slice(0, 3).forEach((opp: any, i: number) => {
    console.log(`   ${i + 1}. ${opp.symbol}: ${opp.type} (${opp.confidence}% confidence)`);
  });
  
  return { sentiment, whales, opportunities };
}

// Main execution
async function main() {
  try {
    console.log('='.repeat(50));
    console.log('📊 OnChainAgents Market Intelligence Examples');
    console.log('='.repeat(50));
    
    // Example 1: Hunt for alpha
    await huntForAlpha();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 2: Track whale activity
    await trackWhaleActivity();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 3: Analyze sentiment
    await analyzeSentiment();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 4: Copy trade whales
    await copyTradeWhales();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 5: Market overview
    await marketOverview();
    
    console.log('\n✅ All market intelligence examples completed!');
    
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
  huntForAlpha, 
  trackWhaleActivity, 
  analyzeSentiment, 
  copyTradeWhales,
  marketOverview 
};