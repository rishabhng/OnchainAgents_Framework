/**
 * OnChainAgents Examples
 * Export all example modules for easy access
 */

export * from './quick-start';
export * from './security-analysis';
export * from './market-intelligence';
export * from './defi-research';
export * from './cross-chain-analysis';
export * from './advanced-strategies';

// Example runner
import { quickStart } from './quick-start';

async function runAllExamples() {
  console.log('🚀 Running OnChainAgents Examples\n');
  console.log('This will demonstrate all available features.\n');
  console.log('=' .repeat(50));
  
  const examples = [
    { name: 'Quick Start', module: () => import('./quick-start').then(m => m.quickStart()) },
    { name: 'Security Analysis', module: () => import('./security-analysis').then(m => m.detectRugPull()) },
    { name: 'Market Intelligence', module: () => import('./market-intelligence').then(m => m.huntForAlpha()) },
    { name: 'DeFi Research', module: () => import('./defi-research').then(m => m.researchToken()) },
    { name: 'Cross-Chain Analysis', module: () => import('./cross-chain-analysis').then(m => m.findBestBridgeRoute()) },
    { name: 'Advanced Strategies', module: () => import('./advanced-strategies').then(m => m.mevProtectedSwap()) },
  ];
  
  for (const example of examples) {
    try {
      console.log(`\n📘 Running: ${example.name}`);
      console.log('-'.repeat(30));
      await example.module();
    } catch (error) {
      console.log(`   ⚠️ ${example.name} requires API connection`);
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ All examples completed!');
  console.log('\nTo run individual examples:');
  console.log('  npm run example:security');
  console.log('  npm run example:market');
  console.log('  npm run example:defi');
  console.log('  npm run example:cross-chain');
  console.log('  npm run example:advanced');
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}