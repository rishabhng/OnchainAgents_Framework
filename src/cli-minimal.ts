#!/usr/bin/env node

/**
 * OnChainAgents CLI - Minimal version for testing
 */

import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { OnChainAgents } from './index-minimal';
import { RetroLoader } from './retro-loader';

// Load environment variables
dotenv.config();

// Create CLI program
const program = new Command();

// Retro ASCII Art Banner
const banner = `
${chalk.yellow('▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀')}
${chalk.yellow('█')} ${chalk.cyan.bold('OnChainAgents.fun v1.0.0')} ${chalk.yellow('█')}
${chalk.yellow('█')} ${chalk.dim.cyan('Crypto Intelligence × Hive MCP')} ${chalk.yellow('█')}
${chalk.yellow('▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄')}
${chalk.dim.green('> INITIALIZING QUANTUM BLOCKCHAIN MATRIX...')}
`;

// Initialize OnChainAgents
let oca: OnChainAgents;

try {
  oca = new OnChainAgents({
    mcpServerUrl: process.env.HIVE_MCP_URL,
    logLevel: process.env.LOG_LEVEL,
  });
} catch (error) {
  console.error(chalk.red('❌ Failed to initialize OnChainAgents'));
  console.error(chalk.yellow('Please ensure Hive Intelligence MCP server is accessible'));
  process.exit(1);
}

// Configure program
program
  .name('oca')
  .description('OnChainAgents CLI - Your crypto intelligence command center')
  .version('1.0.0')
  .addHelpText('before', chalk.cyan(banner));

// Security command
program
  .command('security <address>')
  .description('Security analysis and rug detection')
  .option('-n, --network <network>', 'Blockchain network', 'ethereum')
  .action(async (address, options) => {
    const spinner = new RetroLoader('cyan', 'matrix');
    spinner.start('Running security analysis...');

    try {
      const result = await oca.security(address, {
        network: options.network,
      });

      spinner.succeed('Security analysis complete!');
      console.log('\n' + formatSecurityResult(result));
    } catch (error) {
      spinner.fail('Security analysis failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Hunt command
program
  .command('hunt')
  .description('Hunt for alpha opportunities')
  .option('-r, --risk <level>', 'Risk level (low, medium, high)', 'medium')
  .action(async (options) => {
    const spinner = new RetroLoader('green', 'bbs');
    spinner.start('Hunting for opportunities...');

    try {
      const result = await oca.hunt({
        risk: options.risk,
      });

      spinner.succeed('Hunt complete!');
      console.log('\n' + formatHuntResult(result));
    } catch (error) {
      spinner.fail('Hunt failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Health check command
program
  .command('health')
  .description('Check system health')
  .action(async () => {
    const spinner = new RetroLoader('amber', 'phosphor');
    spinner.start('Checking system health...');

    try {
      const healthy = await oca.healthCheck();

      if (healthy) {
        spinner.succeed('System is healthy!');
        console.log(chalk.green('✓ Hive Intelligence MCP connection successful'));
        console.log(chalk.green('✓ Core agents operational'));
      } else {
        spinner.fail('System health check failed');
      }
    } catch (error) {
      spinner.fail('Health check failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Display functions
function formatSecurityResult(result: any): string {
  if (!result.success) {
    return chalk.red(`❌ Analysis failed: ${result.errors?.join(', ') || 'Unknown error'}`);
  }

  let output = chalk.cyan('🛡️  SECURITY ANALYSIS RESULTS\n');
  output += chalk.cyan('═'.repeat(40)) + '\n\n';

  if (result.data.rugDetection?.data) {
    const rug = result.data.rugDetection.data;
    output += chalk.yellow.bold('Rug Detection:\n');
    output += `  Risk Score: ${getRiskColor(rug.score || 0)}\n`;
    output += `  Verdict: ${getVerdictColor(rug.verdict || 'UNKNOWN')}\n`;

    if (rug.recommendations?.length > 0) {
      output += '\n  Recommendations:\n';
      rug.recommendations.forEach((rec: string) => {
        output += `    • ${rec}\n`;
      });
    }
  }

  return output;
}

function formatHuntResult(result: any): string {
  if (!result.success) {
    return chalk.red(`❌ Hunt failed: ${result.errors?.join(', ') || 'Unknown error'}`);
  }

  let output = chalk.cyan('🎯 ALPHA OPPORTUNITIES\n');
  output += chalk.cyan('═'.repeat(40)) + '\n\n';

  if (result.data.opportunities?.length > 0) {
    output += chalk.yellow.bold(`Found ${result.data.opportunities.length} opportunities:\n\n`);

    result.data.opportunities.slice(0, 3).forEach((opp: any, index: number) => {
      output += `  ${index + 1}. ${chalk.bold(opp.token?.symbol || 'Unknown')}\n`;
      output += `     Score: ${opp.momentumScore || 0}/10\n`;
      output += `     Verdict: ${opp.recommendedAction || 'Monitor'}\n\n`;
    });
  } else {
    output += chalk.yellow('No opportunities found with current filters\n');
  }

  return output;
}

// Helper functions
function getRiskColor(score: number): string {
  if (score > 70) return chalk.green(`${score}/100 (Low Risk)`);
  if (score > 50) return chalk.yellow(`${score}/100 (Medium Risk)`);
  return chalk.red(`${score}/100 (High Risk)`);
}

function getVerdictColor(verdict: string): string {
  switch (verdict.toUpperCase()) {
    case 'SAFE':
      return chalk.green.bold(verdict);
    case 'MODERATE':
    case 'WARNING':
      return chalk.yellow.bold(verdict);
    case 'DANGER':
    case 'HIGH_RISK':
      return chalk.red.bold(verdict);
    case 'CRITICAL':
      return chalk.red.bold(verdict);
    default:
      return chalk.gray(verdict);
  }
}

// Parse and execute
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
