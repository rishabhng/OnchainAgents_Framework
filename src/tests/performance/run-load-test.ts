#!/usr/bin/env node

/**
 * OnChainAgents Load Test Runner
 * Execute comprehensive performance testing suite
 */

import { LoadTester } from './load-test';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🚀 OnChainAgents Performance Testing Suite');
  console.log('==========================================\n');

  const tester = new LoadTester();

  try {
    // Initialize testing environment
    await tester.initialize();

    // Add progress listener
    let requestCount = 0;
    tester.on('request', (metric) => {
      requestCount++;
      if (requestCount % 100 === 0) {
        console.log(`   Processed ${requestCount} requests...`);
      }
    });

    // Run comprehensive test suite
    console.log('Starting comprehensive load test suite...\n');
    const results = await tester.runComprehensiveSuite();

    // Generate report
    const report = tester.generateReport(results);

    // Save report to file
    const reportPath = path.join(
      process.cwd(),
      'performance-report-' + new Date().toISOString().replace(/:/g, '-') + '.md',
    );
    fs.writeFileSync(reportPath, report);

    console.log('\n==========================================');
    console.log('📊 Performance Test Complete!');
    console.log(`📄 Report saved to: ${reportPath}`);

    // Print summary
    console.log('\n📈 Quick Summary:');
    for (const [name, result] of results) {
      const status = result.errorRate < 1 && result.p99ResponseTime < 3000 ? '✅' : '❌';
      console.log(
        `${status} ${name}: ${result.totalRequests} requests, ${result.errorRate.toFixed(2)}% errors, ${result.p99ResponseTime.toFixed(0)}ms P99`,
      );
    }

    // Exit code based on production readiness
    let exitCode = 0;
    for (const [_, result] of results) {
      if (result.errorRate >= 1 || result.p99ResponseTime >= 3000) {
        exitCode = 1;
        break;
      }
    }

    if (exitCode === 0) {
      console.log('\n✅ System is PRODUCTION READY!');
    } else {
      console.log('\n❌ System needs optimization before production deployment.');
    }

    // Cleanup
    tester.cleanup();
    process.exit(exitCode);
  } catch (error) {
    console.error('❌ Load test failed:', error);
    tester.cleanup();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runLoadTest };
