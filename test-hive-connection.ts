#!/usr/bin/env ts-node

/**
 * Test Hive Intelligence Connection
 * Tests both MCP and direct API connections
 */

import { HiveBridge } from './src/bridges/hive-bridge';

async function testHiveConnection() {
  console.log('🔬 Testing Hive Intelligence Connection\n');
  console.log('=' .repeat(50));
  
  // Test 1: Fallback mode (API-only)
  console.log('\n📡 Test 1: Fallback Mode (Direct API)\n');
  const fallbackBridge = new HiveBridge({
    fallbackMode: true,
    hiveUrl: process.env.HIVE_URL || 'https://hiveintelligence.xyz',
    apiKey: process.env.HIVE_API_KEY,
    logLevel: 'info',
  });
  
  try {
    await fallbackBridge.initialize();
    console.log('✅ Fallback bridge initialized');
    
    const healthCheck = await fallbackBridge.healthCheck();
    console.log(`✅ Health check: ${healthCheck ? 'PASSED' : 'FAILED'}`);
    
    // Test a simple tool call
    const result = await fallbackBridge.callTool('hive_token_data', {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      network: 'ethereum',
    });
    
    console.log('✅ Tool call result:', result.success ? 'SUCCESS' : 'FAILED');
    if (result.success && result.data) {
      console.log('   Data received:', Object.keys(result.data).join(', '));
    }
  } catch (error) {
    console.error('❌ Fallback mode test failed:', error);
  }
  
  // Test 2: Full MCP mode
  if (process.env.USE_REAL_HIVE === 'true') {
    console.log('\n📡 Test 2: Full MCP Mode\n');
    const mcpBridge = new HiveBridge({
      fallbackMode: false,
      hiveUrl: process.env.HIVE_MCP_URL || 'https://hiveintelligence.xyz',
      apiKey: process.env.HIVE_API_KEY,
      logLevel: 'info',
    });
    
    try {
      await mcpBridge.initialize();
      console.log('✅ MCP bridge initialized');
      
      const tools = mcpBridge.getAvailableTools();
      console.log(`✅ Available tools: ${tools.length}`);
      tools.forEach(tool => {
        console.log(`   - ${tool.name}: ${tool.description}`);
      });
      
      // Test a tool call via MCP
      const result = await mcpBridge.callTool('hive_security_scan', {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        network: 'ethereum',
      });
      
      console.log('✅ MCP tool call result:', result.success ? 'SUCCESS' : 'FAILED');
      if (result.success && result.data) {
        console.log('   Security verdict:', result.data.verdict);
        console.log('   Security score:', result.data.score);
      }
    } catch (error) {
      console.error('❌ MCP mode test failed:', error);
    }
  } else {
    console.log('\n⚠️ Skipping MCP mode test (set USE_REAL_HIVE=true to enable)');
  }
  
  // Test 3: Agent integration
  console.log('\n📡 Test 3: Agent Integration\n');
  
  const { RugDetector } = await import('./src/agents/security/RugDetector');
  const { AlphaHunter } = await import('./src/agents/market/AlphaHunter');
  
  const bridge = new HiveBridge({
    fallbackMode: process.env.USE_REAL_HIVE !== 'true',
    hiveUrl: process.env.HIVE_URL || 'https://hiveintelligence.xyz',
    apiKey: process.env.HIVE_API_KEY,
    logLevel: 'error',
  });
  
  await bridge.initialize();
  
  // Test RugDetector with Hive
  const rugDetector = new RugDetector(bridge);
  try {
    const rugResult = await rugDetector.analyze({
      network: 'ethereum',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    });
    
    console.log('✅ RugDetector analysis completed');
    console.log('   Result:', rugResult);
    if (rugResult && typeof rugResult === 'object') {
      const result = rugResult as any;
      console.log('   Verdict:', result.verdict || 'N/A');
      console.log('   Score:', result.score || 'N/A');
    }
  } catch (error) {
    console.error('❌ RugDetector test failed:', error);
  }
  
  // Test AlphaHunter with Hive
  const alphaHunter = new AlphaHunter(bridge);
  try {
    const alphaResult = await alphaHunter.analyze({
      network: 'ethereum',
      address: '0x0000000000000000000000000000000000000000',
    });
    
    console.log('✅ AlphaHunter analysis completed');
    console.log('   Result:', alphaResult);
    if (alphaResult && typeof alphaResult === 'object') {
      const result = alphaResult as any;
      console.log('   Opportunities found:', result.opportunities?.length || 0);
    }
  } catch (error) {
    console.error('❌ AlphaHunter test failed:', error);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Hive connection tests completed');
  console.log('\nTo connect to real Hive Intelligence:');
  console.log('1. Set HIVE_API_KEY environment variable');
  console.log('2. Set USE_REAL_HIVE=true to enable MCP connection');
  console.log('3. Set HIVE_URL or HIVE_MCP_URL if using custom endpoint');
}

// Run the test
testHiveConnection().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});