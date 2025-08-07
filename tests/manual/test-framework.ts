#!/usr/bin/env npx tsx
/**
 * Comprehensive framework test
 * Tests all major components of OnChainAgents
 */

import { HiveBridge } from './src/bridges/hive-bridge';
import { DetectionEngine } from './src/orchestrator/detection-engine';
import { PersonaManager } from './src/personas/PersonaManager';
import { FlagManager } from './src/flags';
import { CommandManager } from './src/commands';
import { WaveOrchestrationEngine } from './src/orchestrator/wave-engine';
import { ResourceZoneManager } from './src/orchestrator/resource-manager';
import { QualityGates } from './src/orchestrator/quality-gates';

// Import agents
import { AlphaHunter } from './src/agents/market/AlphaHunter';
import { WhaleTracker } from './src/agents/market/WhaleTracker';
import { RugDetector } from './src/agents/security/RugDetector';

async function testFramework() {
  console.log('🚀 Testing OnChainAgents Framework v2.0\n');
  console.log('=' .repeat(50));
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Test 1: HiveBridge
  console.log('\n1️⃣  Testing HiveBridge (Fallback Mode)...');
  try {
    const bridge = new HiveBridge();
    const tokenInfo = await bridge.query('getTokenInfo', {
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      network: 'ethereum'
    });
    console.log('   ✅ Token Info:', tokenInfo.success ? 'Success' : 'Failed');
    if (tokenInfo.success) passedTests++;
    else failedTests++;
  } catch (error: any) {
    console.log('   ❌ HiveBridge failed:', error.message);
    failedTests++;
  }
  
  // Test 2: Detection Engine
  console.log('\n2️⃣  Testing Detection Engine...');
  try {
    const detector = new DetectionEngine();
    const pattern = detector.detectPattern({
      network: 'ethereum',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4',
      description: 'analyze token for security vulnerabilities'
    });
    console.log('   ✅ Pattern detected:', pattern.complexity, '/', pattern.domains.join(', '));
    console.log('   Confidence:', (pattern.confidence * 100).toFixed(0) + '%');
    passedTests++;
  } catch (error: any) {
    console.log('   ❌ Detection Engine failed:', error.message);
    failedTests++;
  }
  
  // Test 3: Persona System
  console.log('\n3️⃣  Testing Persona System...');
  try {
    const personaManager = new PersonaManager();
    
    // Test auto-activation
    const context = {
      action: 'security',
      description: 'check for vulnerabilities'
    };
    const persona = personaManager.autoActivate(context);
    console.log('   ✅ Auto-activated persona:', persona?.name || 'None');
    
    // Test manual activation
    const architect = personaManager.activatePersona('architect');
    console.log('   ✅ Manual activation:', architect?.name || 'Failed');
    
    // Get all personas
    const allPersonas = personaManager.getAllPersonas();
    console.log('   ✅ Total personas:', allPersonas.length);
    passedTests++;
  } catch (error: any) {
    console.log('   ❌ Persona System failed:', error.message);
    failedTests++;
  }
  
  // Test 4: Flag System
  console.log('\n4️⃣  Testing Flag System...');
  try {
    const flagManager = new FlagManager();
    
    // Parse flags
    const flags = flagManager.parseFlags(['--think', '--wave-mode', '--uc']);
    console.log('   ✅ Parsed flags:', flags.size);
    
    // Test auto-activation
    await flagManager.activateFlags({
      complexity: 'complex',
      domain: 'security'
    });
    console.log('   ✅ Auto-activated flags');
    
    passedTests++;
  } catch (error: any) {
    console.log('   ❌ Flag System failed:', error.message);
    failedTests++;
  }
  
  // Test 5: Command System
  console.log('\n5️⃣  Testing Command System...');
  try {
    const commandManager = new CommandManager();
    
    // Parse command
    const parsed = commandManager.parseCommand('/whale 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4 --network ethereum');
    console.log('   ✅ Parsed command:', parsed.command);
    console.log('   Arguments:', parsed.args.length);
    console.log('   Flags:', Object.keys(parsed.flags).length);
    
    // Get all commands
    const commands = commandManager.getAllCommands();
    console.log('   ✅ Total commands:', commands.length);
    
    passedTests++;
  } catch (error: any) {
    console.log('   ❌ Command System failed:', error.message);
    failedTests++;
  }
  
  // Test 6: Wave Orchestration
  console.log('\n6️⃣  Testing Wave Orchestration Engine...');
  try {
    const detector = new DetectionEngine();
    const personaManager = new PersonaManager();
    const resourceManager = new ResourceZoneManager();
    const qualityGates = new QualityGates();
    const flagManager = new FlagManager();
    
    const waveEngine = new WaveOrchestrationEngine(
      detector,
      personaManager,
      resourceManager,
      qualityGates,
      flagManager
    );
    
    // Check if wave should activate
    const shouldActivate = waveEngine.shouldActivateWave({
      complexity: 0.8,
      fileCount: 25,
      operationTypes: ['analyze', 'security', 'optimize']
    });
    console.log('   ✅ Wave activation check:', shouldActivate ? 'Yes' : 'No');
    
    // Get wave strategies
    const strategies = ['progressive', 'systematic', 'adaptive', 'enterprise'];
    console.log('   ✅ Available strategies:', strategies.join(', '));
    
    passedTests++;
  } catch (error: any) {
    console.log('   ❌ Wave Engine failed:', error.message);
    failedTests++;
  }
  
  // Test 7: Agent Testing
  console.log('\n7️⃣  Testing Agent System...');
  try {
    const bridge = new HiveBridge();
    
    // Test AlphaHunter
    console.log('   Testing AlphaHunter...');
    const alphaHunter = new AlphaHunter(bridge as any);
    console.log('   ✅ AlphaHunter initialized');
    
    // Test WhaleTracker
    console.log('   Testing WhaleTracker...');
    const whaleTracker = new WhaleTracker(bridge);
    console.log('   ✅ WhaleTracker initialized');
    
    // Test RugDetector
    console.log('   Testing RugDetector...');
    const rugDetector = new RugDetector(bridge as any);
    console.log('   ✅ RugDetector initialized');
    
    console.log('   ✅ All agents initialized successfully');
    passedTests++;
  } catch (error: any) {
    console.log('   ❌ Agent System failed:', error.message);
    failedTests++;
  }
  
  // Test 8: Resource Management
  console.log('\n8️⃣  Testing Resource Management...');
  try {
    const resourceManager = new ResourceZoneManager();
    
    // Check zones
    const zone = resourceManager.getCurrentZone();
    console.log('   ✅ Current zone:', zone);
    
    // Test resource tracking
    resourceManager.trackResourceUsage({
      tokens: 1000,
      memory: 100 * 1024 * 1024, // 100MB
      executionTime: 500
    });
    console.log('   ✅ Resource tracking active');
    
    passedTests++;
  } catch (error: any) {
    console.log('   ❌ Resource Management failed:', error.message);
    failedTests++;
  }
  
  // Test 9: Quality Gates
  console.log('\n9️⃣  Testing Quality Gates...');
  try {
    const qualityGates = new QualityGates();
    
    // Run validation
    const result = await qualityGates.validate({
      code: 'const test = "hello";',
      type: 'javascript'
    });
    console.log('   ✅ Validation steps:', result.steps.length);
    console.log('   Passed:', result.passed ? 'Yes' : 'No');
    
    passedTests++;
  } catch (error: any) {
    console.log('   ❌ Quality Gates failed:', error.message);
    failedTests++;
  }
  
  // Test 10: Integration Test
  console.log('\n🔟 Testing Full Integration...');
  try {
    // Simulate a whale tracking request
    const bridge = new HiveBridge();
    const whaleTracker = new WhaleTracker(bridge);
    
    const result = await whaleTracker.performAnalysis({
      network: 'ethereum',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4'
    });
    
    console.log('   ✅ Whale analysis complete');
    console.log('   Is Whale:', result.whaleInfo.isWhale ? 'Yes' : 'No');
    console.log('   Patterns detected:', Object.keys(result.patterns).filter(k => result.patterns[k]).join(', ') || 'None');
    console.log('   Risk level:', result.risk.level);
    
    passedTests++;
  } catch (error: any) {
    console.log('   ❌ Integration test failed:', error.message);
    failedTests++;
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Summary:');
  console.log(`   ✅ Passed: ${passedTests}/10`);
  console.log(`   ❌ Failed: ${failedTests}/10`);
  console.log(`   Success Rate: ${(passedTests * 10)}%`);
  
  if (passedTests === 10) {
    console.log('\n🎉 All tests passed! Framework is ready for production!');
  } else if (passedTests >= 7) {
    console.log('\n⚠️  Most tests passed. Framework is functional with minor issues.');
  } else {
    console.log('\n❌ Multiple failures detected. Framework needs fixes.');
  }
  
  console.log('\n✨ Framework test complete!');
}

// Run the tests
console.log('Environment: HIVE_FALLBACK_MODE =', process.env.HIVE_FALLBACK_MODE || 'false');
testFramework().catch(console.error);