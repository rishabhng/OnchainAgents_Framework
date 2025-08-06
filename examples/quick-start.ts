/**
 * Quick Start Guide
 * Simple examples to get started with OnChainAgents
 */

import { OnChainAgents } from '../src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OnChainAgents
const oca = new OnChainAgents({
  hiveApiKey: process.env.HIVE_API_KEY || 'your-api-key-here',
});

async function quickStart() {
  console.log('🚀 OnChainAgents Quick Start Guide\n');
  console.log('=' .repeat(50));
  
  // 1. Check if a token is safe
  console.log('\n1️⃣ Checking token safety...');
  try {
    const safety = await oca.security('0x1234...'); // Replace with actual token
    console.log(`   Risk Score: ${safety.data.rugDetection?.data?.riskScore}/100`);
    console.log(`   Verdict: ${safety.data.rugDetection?.data?.verdict}`);
  } catch (error) {
    console.log('   ⚠️  Security check requires valid token address');
  }
  
  // 2. Find opportunities
  console.log('\n2️⃣ Finding opportunities...');
  try {
    const opportunities = await oca.hunt({ risk: 'low' });
    const count = opportunities.data.opportunities?.length || 0;
    console.log(`   Found ${count} low-risk opportunities`);
    
    const top = opportunities.data.opportunities?.[0];
    if (top) {
      console.log(`   Top pick: ${top.symbol} (${top.confidence}% confidence)`);
    }
  } catch (error) {
    console.log('   ⚠️  Hunt requires API connection');
  }
  
  // 3. Check market sentiment
  console.log('\n3️⃣ Checking market sentiment...');
  try {
    const sentiment = await oca.sentiment('BTC');
    console.log(`   Bitcoin sentiment: ${sentiment.data.sentiment}`);
    console.log(`   Score: ${sentiment.data.score}/100`);
  } catch (error) {
    console.log('   ⚠️  Sentiment analysis requires API connection');
  }
  
  // 4. Research a token
  console.log('\n4️⃣ Researching a token...');
  try {
    const research = await oca.research('ETH');
    console.log(`   Research Score: ${research.data.research?.researchScore}/100`);
    console.log(`   Investment Thesis: ${research.data.research?.investmentThesis?.verdict}`);
  } catch (error) {
    console.log('   ⚠️  Research requires API connection');
  }
  
  // 5. Track a whale
  console.log('\n5️⃣ Tracking whale activity...');
  try {
    const whale = await oca.track('0xwhale...');
    console.log(`   Is Whale: ${whale.data.whaleActivity?.data?.isWhale ? 'Yes' : 'No'}`);
    console.log(`   Wallet Type: ${whale.data.whaleActivity?.data?.walletType}`);
  } catch (error) {
    console.log('   ⚠️  Tracking requires valid wallet address');
  }
  
  // 6. Comprehensive analysis
  console.log('\n6️⃣ Running comprehensive analysis...');
  try {
    const analysis = await oca.analyze('ethereum', 'UNI');
    console.log(`   Overall Score: ${analysis.data.summary?.score}/100`);
    console.log(`   Verdict: ${analysis.data.summary?.verdict}`);
    
    if (analysis.data.summary?.recommendations?.length > 0) {
      console.log('   Recommendations:');
      analysis.data.summary.recommendations.slice(0, 2).forEach((rec: string) => {
        console.log(`     • ${rec}`);
      });
    }
  } catch (error) {
    console.log('   ⚠️  Analysis requires API connection');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Quick start complete! Check out the other examples for more.');
}

// Simple examples for each command
const examples = {
  // Security check
  async checkSecurity() {
    console.log('🛡️ Security Check Example:\n');
    const result = await oca.security('0xtoken...');
    console.log('Risk Score:', result.data.rugDetection?.data?.riskScore);
    return result;
  },
  
  // Token research
  async researchToken() {
    console.log('🔬 Token Research Example:\n');
    const result = await oca.research('UNI');
    console.log('Research Score:', result.data.research?.researchScore);
    return result;
  },
  
  // Find opportunities
  async findOpportunities() {
    console.log('🎯 Opportunity Hunt Example:\n');
    const result = await oca.hunt({ risk: 'medium' });
    console.log('Opportunities found:', result.data.opportunities?.length);
    return result;
  },
  
  // Track wallet
  async trackWallet() {
    console.log('🐋 Wallet Tracking Example:\n');
    const result = await oca.track('0xwallet...');
    console.log('Is Whale:', result.data.whaleActivity?.data?.isWhale);
    return result;
  },
  
  // Check sentiment
  async checkSentiment() {
    console.log('😊 Sentiment Analysis Example:\n');
    const result = await oca.sentiment('ETH');
    console.log('Sentiment:', result.data.sentiment);
    return result;
  },
  
  // Full analysis
  async fullAnalysis() {
    console.log('📊 Comprehensive Analysis Example:\n');
    const result = await oca.analyze('ethereum', 'USDC');
    console.log('Overall Score:', result.data.summary?.score);
    return result;
  },
};

// Main execution
async function main() {
  try {
    // Run quick start guide
    await quickStart();
    
    console.log('\n\n🎉 Want to try individual commands? Uncomment the examples below:');
    console.log('// await examples.checkSecurity();');
    console.log('// await examples.researchToken();');
    console.log('// await examples.findOpportunities();');
    console.log('// await examples.trackWallet();');
    console.log('// await examples.checkSentiment();');
    console.log('// await examples.fullAnalysis();');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.log('\n💡 Make sure you have:');
    console.log('   1. Set HIVE_API_KEY in your .env file');
    console.log('   2. Installed dependencies with: npm install');
    console.log('   3. Built the project with: npm run build');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { quickStart, examples };