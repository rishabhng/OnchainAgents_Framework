// Test script for Hive Intelligence MCP
/**
 * Test script for Hive Intelligence MCP connection
 * Verifies the HTTP endpoint is accessible and working
 */

import axios from 'axios';

const HIVE_MCP_ENDPOINT = 'https://hiveintelligence.xyz/mcp';

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

async function testHiveMCP() {
  console.log('🔬 Testing Hive Intelligence MCP Connection');
  console.log('==========================================');
  console.log(`Endpoint: ${HIVE_MCP_ENDPOINT}`);
  console.log('');

  // Test basic connectivity with correct headers
  console.log('Testing HTTP connectivity with MCP protocol...');
  try {
    const response = await axios.post(HIVE_MCP_ENDPOINT, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    }, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream' // Required by Hive MCP
      },
      timeout: 10000
    });
    
    console.log('✅ Connection successful\!');
    console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 500));
  } catch (error: any) {
    console.log('❌ Connection failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testHiveMCP().catch(console.error);
