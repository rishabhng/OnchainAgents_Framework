/**
 * Security Analysis Examples
 * Shows how to use RugDetector and RiskAnalyzer agents
 */

import { OnChainAgents } from '../src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const oca = new OnChainAgents({
  hiveApiKey: process.env.HIVE_API_KEY,
});

async function detectRugPull() {
  console.log('🔍 Checking token for rug pull risks...\n');
  
  // Check a suspicious token on BSC
  const result = await oca.security('0x123...suspicious', {
    network: 'bsc',
  });
  
  console.log('Rug Detection Results:');
  console.log('Risk Score:', result.data.rugDetection?.data?.riskScore);
  console.log('Verdict:', result.data.rugDetection?.data?.verdict);
  console.log('\nRed Flags:');
  result.data.rugDetection?.data?.flags?.forEach((flag: string) => {
    console.log(`  ⚠️  ${flag}`);
  });
  
  console.log('\nRisk Analysis:');
  console.log('Overall Risk:', result.data.riskAnalysis?.data?.overallRisk);
  
  return result;
}

async function analyzeProtocolRisk() {
  console.log('📊 Analyzing DeFi protocol risks...\n');
  
  // Analyze a DeFi protocol
  const result = await oca.analyze('ethereum', 'uniswap-v3');
  
  console.log('Protocol Risk Assessment:');
  console.log('Security Score:', result.data.security?.riskAnalysis?.data?.securityScore);
  console.log('Risk Categories:');
  
  const categories = result.data.security?.riskAnalysis?.data?.categories;
  if (categories) {
    Object.entries(categories).forEach(([category, level]) => {
      console.log(`  ${category}: ${level}`);
    });
  }
  
  return result;
}

async function checkMultipleTokens() {
  console.log('🔐 Batch security check for multiple tokens...\n');
  
  const tokens = [
    '0xtoken1...',
    '0xtoken2...',
    '0xtoken3...',
  ];
  
  const results = await Promise.all(
    tokens.map(token => oca.security(token))
  );
  
  console.log('Security Summary:');
  results.forEach((result, index) => {
    const score = result.data.rugDetection?.data?.riskScore || 0;
    const verdict = result.data.rugDetection?.data?.verdict || 'UNKNOWN';
    const emoji = score < 30 ? '✅' : score < 70 ? '⚠️' : '🚨';
    
    console.log(`${emoji} Token ${index + 1}: Score ${score}/100 - ${verdict}`);
  });
  
  return results;
}

async function realTimeMonitoring() {
  console.log('🚨 Starting real-time security monitoring...\n');
  
  // Monitor a token in real-time (simulation)
  const checkInterval = 60000; // 1 minute
  let checkCount = 0;
  
  const monitor = setInterval(async () => {
    checkCount++;
    console.log(`\nCheck #${checkCount} at ${new Date().toISOString()}`);
    
    const result = await oca.security('0xtoken...');
    const score = result.data.rugDetection?.data?.riskScore || 0;
    
    if (score > 70) {
      console.log('🚨 HIGH RISK DETECTED! Score:', score);
      console.log('Stopping monitoring - immediate action required!');
      clearInterval(monitor);
    } else if (score > 40) {
      console.log('⚠️  Medium risk detected. Score:', score);
    } else {
      console.log('✅ Token appears safe. Score:', score);
    }
    
    // Stop after 5 checks for demo
    if (checkCount >= 5) {
      console.log('\n✅ Monitoring complete - no major risks detected');
      clearInterval(monitor);
    }
  }, checkInterval);
}

// Main execution
async function main() {
  try {
    console.log('='.repeat(50));
    console.log('🛡️  OnChainAgents Security Analysis Examples');
    console.log('='.repeat(50));
    
    // Example 1: Detect rug pull
    await detectRugPull();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 2: Analyze protocol risk
    await analyzeProtocolRisk();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 3: Batch check
    await checkMultipleTokens();
    console.log('\n' + '-'.repeat(50) + '\n');
    
    // Example 4: Real-time monitoring (uncomment to run)
    // await realTimeMonitoring();
    
    console.log('✅ All security examples completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { detectRugPull, analyzeProtocolRisk, checkMultipleTokens, realTimeMonitoring };