#!/usr/bin/env node

/**
 * Test connection to Hive Intelligence MCP server
 */

import dotenv from 'dotenv';
import chalk from 'chalk';
import { HiveMCPRemoteClient } from '../../src/mcp/HiveMCPRemoteClient';

// Load environment variables
dotenv.config();

async function testConnection() {
  console.log(chalk.cyan('\n🚀 Testing Hive Intelligence MCP Connection\n'));
  console.log(chalk.cyan('━'.repeat(50)));
  
  // Configuration
  const config = {
    mcpServerUrl: process.env.HIVE_MCP_URL || 'https://hiveintelligence.xyz/mcp',
    apiKey: process.env.HIVE_API_KEY,
    fallbackMode: process.env.HIVE_FALLBACK_MODE === 'true',
  };
  
  console.log('\n📋 Configuration:');
  console.log(`   MCP URL: ${chalk.yellow(config.mcpServerUrl)}`);
  console.log(`   API Key: ${config.apiKey ? chalk.green('✓ Configured') : chalk.red('✗ Not configured')}`);
  console.log(`   Fallback Mode: ${config.fallbackMode ? chalk.yellow('Enabled') : chalk.green('Disabled')}`);
  console.log();
  
  // Initialize client
  const client = new HiveMCPRemoteClient(config);
  
  try {
    // Test 1: Connection test
    console.log(chalk.blue('🔍 Test 1: Connection Test'));
    const connectionResult = await client.testConnection();
    
    if (connectionResult.connected) {
      console.log(chalk.green(`   ✓ Connected successfully (latency: ${connectionResult.latency}ms)`));
    } else {
      console.log(chalk.red(`   ✗ Connection failed: ${connectionResult.error}`));
      if (config.fallbackMode) {
        console.log(chalk.yellow('   ⚠️  Using fallback mode with simulated data'));
      }
    }
    
    // Test 2: Health check
    console.log(chalk.blue('\n🔍 Test 2: Health Check'));
    const healthy = await client.healthCheck();
    console.log(healthy ? chalk.green('   ✓ Server is healthy') : chalk.red('   ✗ Health check failed'));
    
    // Test 3: Tool call test
    console.log(chalk.blue('\n🔍 Test 3: Tool Call Test'));
    console.log('   Calling hive_security_scan for test token...');
    
    const result = await client.callTool('hive_security_scan', {
      network: 'ethereum',
      address: '0x0000000000000000000000000000000000000000',
      depth: 'basic',
    });
    
    if (result.success) {
      console.log(chalk.green('   ✓ Tool call successful'));
      console.log(`   Latency: ${result.metadata?.latency}ms`);
      console.log(`   Cached: ${result.metadata?.cached ? 'Yes' : 'No'}`);
      
      if (result.data) {
        console.log('\n   📊 Sample Response:');
        console.log(chalk.gray(JSON.stringify(result.data, null, 2).substring(0, 300) + '...'));
      }
    } else {
      console.log(chalk.red(`   ✗ Tool call failed: ${result.error}`));
    }
    
    // Test 4: Available tools
    console.log(chalk.blue('\n🔍 Test 4: Available Tools'));
    const tools = client.getAvailableTools();
    console.log(`   Found ${chalk.green(tools.length)} available tools:`);
    tools.slice(0, 5).forEach(tool => {
      console.log(`   • ${chalk.yellow(tool)}`);
    });
    if (tools.length > 5) {
      console.log(`   ... and ${tools.length - 5} more`);
    }
    
    // Summary
    console.log(chalk.cyan('\n' + '━'.repeat(50)));
    
    if (connectionResult.connected && healthy) {
      console.log(chalk.green.bold('\n✅ All tests passed! Ready for production.'));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('1. Set HIVE_FALLBACK_MODE=false in .env for production'));
      console.log(chalk.gray('2. Ensure HIVE_API_KEY is configured if required'));
      console.log(chalk.gray('3. Run npm publish to deploy to npm registry'));
    } else if (config.fallbackMode) {
      console.log(chalk.yellow.bold('\n⚠️  Running in fallback mode with simulated data'));
      console.log(chalk.gray('\nTo connect to real Hive Intelligence:'));
      console.log(chalk.gray('1. Obtain API key from https://t.me/hiveintelligence'));
      console.log(chalk.gray('2. Set HIVE_API_KEY in .env file'));
      console.log(chalk.gray('3. Set HIVE_FALLBACK_MODE=false'));
    } else {
      console.log(chalk.red.bold('\n❌ Connection issues detected'));
      console.log(chalk.gray('\nTroubleshooting:'));
      console.log(chalk.gray('1. Check your internet connection'));
      console.log(chalk.gray('2. Verify HIVE_MCP_URL is correct'));
      console.log(chalk.gray('3. Contact Hive Intelligence support if issues persist'));
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Unexpected error:'), error);
    process.exit(1);
  }
}

// Run the test
testConnection().catch(console.error);