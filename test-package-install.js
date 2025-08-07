#!/usr/bin/env node

/**
 * Test script to verify the npm package can be installed and used
 * This simulates what a user would experience when installing from npm
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing OnChainAgents Package Installation\n');
console.log('='.repeat(50));

// Create a temporary test directory
const testDir = path.join(__dirname, 'test-package-install-temp');

// Clean up if exists
if (fs.existsSync(testDir)) {
  console.log('Cleaning up existing test directory...');
  fs.rmSync(testDir, { recursive: true, force: true });
}

// Create test directory
console.log(`Creating test directory: ${testDir}`);
fs.mkdirSync(testDir);

// Copy the package tarball
const packageFile = 'onchainagents-core-1.0.0.tgz';
const packagePath = path.join(__dirname, packageFile);
const testPackagePath = path.join(testDir, packageFile);

if (!fs.existsSync(packagePath)) {
  console.error(`❌ Package file not found: ${packageFile}`);
  console.error('Please run "npm pack" first');
  process.exit(1);
}

console.log(`Copying package to test directory...`);
fs.copyFileSync(packagePath, testPackagePath);

// Create a test project
console.log('\n📦 Creating test project...');

// Create package.json
const testPackageJson = {
  name: 'test-onchainagents-install',
  version: '1.0.0',
  description: 'Test installation of OnChainAgents',
  type: 'module',
  dependencies: {}
};

fs.writeFileSync(
  path.join(testDir, 'package.json'),
  JSON.stringify(testPackageJson, null, 2)
);

// Install the package
console.log('\n📥 Installing OnChainAgents package...');
try {
  execSync(`npm install ${packageFile}`, {
    cwd: testDir,
    stdio: 'inherit'
  });
  console.log('✅ Package installed successfully!');
} catch (error) {
  console.error('❌ Failed to install package:', error.message);
  process.exit(1);
}

// Create a test script
console.log('\n📝 Creating test script...');
const testScript = `
// Test script to verify OnChainAgents works after installation
import { HiveBridge } from '@onchainagents/core/dist/bridges/hive-bridge.js';
import { AlphaHunter } from '@onchainagents/core/dist/agents/market/AlphaHunter.js';
import { RugDetector } from '@onchainagents/core/dist/agents/security/RugDetector.js';

console.log('\\n🚀 Testing OnChainAgents Package\\n');

// Initialize Hive service
const hiveService = new HiveBridge({
  fallbackMode: true,
  logLevel: 'error'
});

async function runTest() {
  try {
    // Initialize Hive
    await hiveService.initialize();
    console.log('✅ HiveBridge initialized');
    
    // Test AlphaHunter
    const alphaHunter = new AlphaHunter(hiveService);
    console.log('✅ AlphaHunter created');
    
    // Test RugDetector
    const rugDetector = new RugDetector(hiveService);
    console.log('✅ RugDetector created');
    
    // Perform a simple analysis
    const result = await alphaHunter.analyze({
      network: 'ethereum',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    });
    
    console.log('✅ Analysis completed successfully');
    console.log('\\n📊 Sample Result:');
    console.log('  Opportunities found:', result.opportunities?.length || 0);
    
    console.log('\\n🎉 All tests passed! Package is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
`;

fs.writeFileSync(path.join(testDir, 'test.mjs'), testScript);

// Run the test script
console.log('\n🏃 Running test script...');
try {
  execSync('node test.mjs', {
    cwd: testDir,
    stdio: 'inherit',
    env: { ...process.env, HIVE_FALLBACK_MODE: 'true' }
  });
} catch (error) {
  console.error('❌ Test script failed:', error.message);
  process.exit(1);
}

// Clean up
console.log('\n🧹 Cleaning up...');
fs.rmSync(testDir, { recursive: true, force: true });

console.log('\n' + '='.repeat(50));
console.log('✅ Package installation and usage test completed successfully!');
console.log('The package is ready to be published to npm.');
console.log('\nNext steps:');
console.log('1. Create an npm account: https://www.npmjs.com/signup');
console.log('2. Create @onchainagents organization');
console.log('3. Login: npm login');
console.log('4. Publish: npm publish --access public');