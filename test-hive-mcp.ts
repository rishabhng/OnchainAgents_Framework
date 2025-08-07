#!/usr/bin/env ts-node

/**
 * Test script for Hive Intelligence MCP connection
 * 
 * Usage:
 *   npm run test:hive-mcp
 * 
 * This script tests both the HiveMCPRemoteClient for programmatic access
 * and provides instructions for Claude Desktop setup
 */

import { HiveMCPRemoteClient } from './src/mcp/HiveMCPRemoteClient';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

const TESTS = {
  CONNECTION: 'Connection Test',
  LIST_TOOLS: 'List Available Tools',
  TOKEN_INFO: 'Get Token Information',
  SECURITY_SCAN: 'Security Analysis',
  FALLBACK: 'Fallback Mode Test',
};

async function printHeader() {
  console.log(chalk.cyan('\n' + '='.repeat(60)));
  console.log(chalk.cyan.bold('🔌 Hive Intelligence MCP Connection Test'));
  console.log(chalk.cyan('='.repeat(60) + '\n'));
  
  console.log(chalk.yellow('Configuration:'));
  console.log(`  MCP URL: ${chalk.white(process.env.HIVE_MCP_URL || 'https://hiveintelligence.xyz/mcp')}`);
  console.log(`  API Key: ${chalk.white(process.env.HIVE_API_KEY ? '✓ Configured' : '✗ Not configured')}`);
  console.log(`  Fallback Mode: ${chalk.white(process.env.HIVE_FALLBACK_MODE === 'true' ? 'Enabled' : 'Disabled')}`);
  console.log();
}

async function testConnection(client: HiveMCPRemoteClient): Promise<boolean> {
  console.log(chalk.blue(`\n▶ ${TESTS.CONNECTION}`));
  
  try {
    const result = await client.testConnection();
    
    if (result.connected) {
      console.log(chalk.green(`  ✓ Connected successfully`));
      if (result.latency) {
        console.log(chalk.gray(`    Latency: ${result.latency}ms`));
      }
      return true;
    } else {
      console.log(chalk.red(`  ✗ Connection failed: ${result.error}`));
      return false;
    }
  } catch (error) {
    console.log(chalk.red(`  ✗ Connection error: ${error}`));
    return false;
  }
}

async function listTools(client: HiveMCPRemoteClient): Promise<void> {
  console.log(chalk.blue(`\n▶ ${TESTS.LIST_TOOLS}`));
  
  try {
    const tools = await client.listTools();
    console.log(chalk.green(`  ✓ Found ${tools.length} tools:`));
    
    tools.forEach(tool => {
      console.log(chalk.gray(`    • ${tool}`));
    });
  } catch (error) {
    console.log(chalk.yellow(`  ⚠ Using fallback tool list`));
    const fallbackTools = client.getAvailableTools();
    fallbackTools.forEach(tool => {
      console.log(chalk.gray(`    • ${tool}`));
    });
  }
}

async function testTokenInfo(client: HiveMCPRemoteClient): Promise<void> {
  console.log(chalk.blue(`\n▶ ${TESTS.TOKEN_INFO}`));
  
  try {
    const result = await client.callTool('hive_token_data', {
      network: 'ethereum',
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    });
    
    if (result.success) {
      console.log(chalk.green(`  ✓ Token data retrieved successfully`));
      if (result.data) {
        const data = result.data as any;
        console.log(chalk.gray(`    Name: ${data.name || 'N/A'}`));
        console.log(chalk.gray(`    Symbol: ${data.symbol || 'N/A'}`));
        console.log(chalk.gray(`    Price: $${data.price || 'N/A'}`));
      }
    } else {
      console.log(chalk.red(`  ✗ Failed to get token data: ${result.error}`));
    }
  } catch (error) {
    console.log(chalk.red(`  ✗ Error calling tool: ${error}`));
  }
}

async function testSecurityScan(client: HiveMCPRemoteClient): Promise<void> {
  console.log(chalk.blue(`\n▶ ${TESTS.SECURITY_SCAN}`));
  
  try {
    const result = await client.callTool('hive_security_scan', {
      network: 'ethereum',
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      depth: 'basic',
    });
    
    if (result.success) {
      console.log(chalk.green(`  ✓ Security scan completed`));
      if (result.data) {
        const data = result.data as any;
        console.log(chalk.gray(`    Verdict: ${data.verdict || 'N/A'}`));
        console.log(chalk.gray(`    Score: ${data.score || 'N/A'}/100`));
        console.log(chalk.gray(`    Contract Verified: ${data.contractVerified ? 'Yes' : 'No'}`));
      }
    } else {
      console.log(chalk.red(`  ✗ Security scan failed: ${result.error}`));
    }
  } catch (error) {
    console.log(chalk.red(`  ✗ Error during security scan: ${error}`));
  }
}

async function testFallbackMode(): Promise<void> {
  console.log(chalk.blue(`\n▶ ${TESTS.FALLBACK}`));
  
  // Temporarily enable fallback mode
  const originalMode = process.env.HIVE_FALLBACK_MODE;
  process.env.HIVE_FALLBACK_MODE = 'true';
  
  const fallbackClient = new HiveMCPRemoteClient({
    mcpServerUrl: 'https://invalid.url.test', // Intentionally invalid
  });
  
  try {
    const result = await fallbackClient.callTool('hive_token_data', {
      network: 'ethereum',
      address: '0xtest',
    });
    
    if (result.success) {
      console.log(chalk.green(`  ✓ Fallback mode working`));
      console.log(chalk.gray(`    Using simulated data for testing`));
    } else {
      console.log(chalk.red(`  ✗ Fallback mode failed`));
    }
  } catch (error) {
    console.log(chalk.red(`  ✗ Fallback mode error: ${error}`));
  } finally {
    // Restore original mode
    process.env.HIVE_FALLBACK_MODE = originalMode;
  }
}

function printClaudeDesktopInstructions() {
  console.log(chalk.cyan('\n' + '='.repeat(60)));
  console.log(chalk.cyan.bold('📱 Claude Desktop Setup Instructions'));
  console.log(chalk.cyan('='.repeat(60) + '\n'));
  
  console.log(chalk.white('To use Hive Intelligence in Claude Desktop:\n'));
  console.log(chalk.yellow('1.') + ' Open Claude Desktop');
  console.log(chalk.yellow('2.') + ' Go to ' + chalk.bold('Settings → Manage Connectors'));
  console.log(chalk.yellow('3.') + ' Click ' + chalk.bold('Add Connector'));
  console.log(chalk.yellow('4.') + ' Enter URL: ' + chalk.green('https://hiveintelligence.xyz/mcp'));
  console.log(chalk.yellow('5.') + ' The MCP server will be available in Claude Desktop\n');
  
  console.log(chalk.gray('Note: There is no CLI command for adding MCP servers.'));
  console.log(chalk.gray('The "claude mcp add" command does not exist.'));
  console.log(chalk.gray('MCP servers must be configured through the GUI.\n'));
}

async function main() {
  await printHeader();
  
  // Create client
  const client = new HiveMCPRemoteClient({
    mcpServerUrl: process.env.HIVE_MCP_URL,
    apiKey: process.env.HIVE_API_KEY,
  });
  
  // Run tests
  const connected = await testConnection(client);
  
  if (connected || process.env.HIVE_FALLBACK_MODE === 'true') {
    await listTools(client);
    await testTokenInfo(client);
    await testSecurityScan(client);
  }
  
  // Always test fallback mode
  await testFallbackMode();
  
  // Print Claude Desktop instructions
  printClaudeDesktopInstructions();
  
  console.log(chalk.cyan('\n' + '='.repeat(60)));
  console.log(chalk.cyan.bold('✅ Test Complete'));
  console.log(chalk.cyan('='.repeat(60) + '\n'));
  
  if (!process.env.HIVE_API_KEY) {
    console.log(chalk.yellow('💡 Tip: Get your API key from Hive Intelligence'));
    console.log(chalk.yellow('   Contact: https://t.me/hiveintelligence\n'));
  }
}

// Run the test
main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});