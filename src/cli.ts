#!/usr/bin/env node

/**
 * OnChainAgents CLI - Command-line interface for crypto intelligence
 */

import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { RetroLoader } from './retro-loader';
import { OnChainAgents } from './index';

// Load environment variables
dotenv.config();

// Create CLI program
const program = new Command();

// Retro ASCII Art Banner
const banner = `
${chalk.green('░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░')}
${chalk.green('▒▒▒')} ${chalk.cyan.bold('⚡ OnChainAgents.fun v1.0.0 ⚡')} ${chalk.green('▒▒▒')}
${chalk.green('▓▓▓')} ${chalk.dim.green('[ 16 AI Agents ][ 60+ Chains ]')} ${chalk.green('▓▓▓')}
${chalk.green('███')} ${chalk.dim.green('[ 100% Free ][ Hive Powered ]')} ${chalk.green('███')}
${chalk.green('░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░')}
${chalk.dim.cyan('> SYSTEM READY. AWAITING COMMAND...')}
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

// Analyze command
program
  .command('analyze <network> <target>')
  .description('Comprehensive multi-agent analysis of a token or protocol')
  .option('-d, --depth <level>', 'Analysis depth (quick, standard, deep)', 'standard')
  .option('-o, --output <format>', 'Output format (json, text)', 'text')
  .action(async (network, target, options) => {
    const spinner = new RetroLoader('green', 'phosphor');
    spinner.start('Running comprehensive analysis...');

    try {
      const result = await oca.analyze(network, target, {
        depth: options.depth,
      });

      spinner.succeed('Analysis complete!');

      if (options.output === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        displayAnalysisResult(result);
      }
    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Research command
program
  .command('research <token>')
  .description('Deep fundamental research on a token')
  .option('--deep', 'Enable comprehensive analysis')
  .option('-o, --output <format>', 'Output format (json, text)', 'text')
  .action(async (token, options) => {
    const spinner = new RetroLoader('amber', 'scanline');
    spinner.start('Conducting research...');

    try {
      const result = await oca.research(token, {
        deep: options.deep,
      });

      spinner.succeed('Research complete!');

      if (options.output === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        displayResearchResult(result);
      }
    } catch (error) {
      spinner.fail('Research failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Security command
program
  .command('security <address>')
  .description('Security-focused analysis including rug detection')
  .option('-n, --network <network>', 'Blockchain network', 'ethereum')
  .option('-o, --output <format>', 'Output format (json, text)', 'text')
  .action(async (address, options) => {
    const spinner = new RetroLoader('cyan', 'matrix');
    spinner.start('Running security analysis...');

    try {
      const result = await oca.security(address, {
        network: options.network,
      });

      spinner.succeed('Security analysis complete!');

      if (options.output === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        displaySecurityResult(result);
      }
    } catch (error) {
      spinner.fail('Security analysis failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Hunt command
program
  .command('hunt')
  .description('Hunt for alpha opportunities across markets')
  .option('-c, --category <category>', 'Filter by category (defi, gaming, ai, etc.)')
  .option('-r, --risk <level>', 'Risk level (low, medium, high)', 'medium')
  .option('-o, --output <format>', 'Output format (json, text)', 'text')
  .action(async (options) => {
    const spinner = new RetroLoader('green', 'bbs');
    spinner.start('Hunting for opportunities...');

    try {
      const result = await oca.hunt({
        category: options.category,
        risk: options.risk,
      });

      spinner.succeed('Hunt complete!');

      if (options.output === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        displayHuntResult(result);
      }
    } catch (error) {
      spinner.fail('Hunt failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Track command
program
  .command('track <wallet>')
  .description('Track whale wallets and portfolio activity')
  .option('--alerts', 'Enable real-time alerts')
  .option('-o, --output <format>', 'Output format (json, text)', 'text')
  .action(async (wallet, options) => {
    const spinner = new RetroLoader('amber', 'modem');
    spinner.start('Tracking wallet...');

    try {
      const result = await oca.track(wallet, {
        alerts: options.alerts,
      });

      spinner.succeed('Tracking complete!');

      if (options.output === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        displayTrackResult(result);
      }
    } catch (error) {
      spinner.fail('Tracking failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// Sentiment command
program
  .command('sentiment <token>')
  .description('Analyze social sentiment for a token')
  .option('-s, --sources <sources>', 'Comma-separated sources (twitter,telegram,discord,reddit)')
  .option('-o, --output <format>', 'Output format (json, text)', 'text')
  .action(async (token, options) => {
    const spinner = new RetroLoader('cyan', 'glitch');
    spinner.start('Analyzing sentiment...');

    try {
      const result = await oca.sentiment(token, {
        sources: options.sources,
      });

      spinner.succeed('Sentiment analysis complete!');

      if (options.output === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        displaySentimentResult(result);
      }
    } catch (error) {
      spinner.fail('Sentiment analysis failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

// List agents command
program
  .command('agents')
  .description('List all available AI agents')
  .action(() => {
    console.log(chalk.cyan('\n📋 Available AI Agents:\n'));

    const agents = [
      { name: 'RugDetector', category: 'Security', description: 'Advanced rug pull detection' },
      { name: 'RiskAnalyzer', category: 'Security', description: 'Protocol risk assessment' },
      { name: 'AlphaHunter', category: 'Market', description: 'Finds emerging opportunities' },
      { name: 'WhaleTracker', category: 'Market', description: 'Whale movement monitoring' },
      { name: 'SentimentAnalyzer', category: 'Market', description: 'Social sentiment analysis' },
      { name: 'TokenResearcher', category: 'Research', description: 'Fundamental analysis' },
      { name: 'DeFiAnalyzer', category: 'Research', description: 'DeFi protocol analysis' },
      { name: 'PortfolioTracker', category: 'Research', description: 'Portfolio management' },
      { name: 'CrossChainNavigator', category: 'Specialized', description: 'Bridge optimization' },
      {
        name: 'MarketStructureAnalyst',
        category: 'Specialized',
        description: 'Market microstructure',
      },
    ];

    agents.forEach((agent) => {
      console.log(`  ${chalk.green('●')} ${chalk.bold(agent.name)} (${agent.category})`);
      console.log(`    ${agent.description}\n`);
    });
  });

// Health check command
program
  .command('health')
  .description('Check system health and API connectivity')
  .action(async () => {
    const spinner = new RetroLoader('green', 'phosphor');
    spinner.start('Checking system health...');

    try {
      const healthy = await oca.healthCheck();

      if (healthy) {
        spinner.succeed('System is healthy!');
        console.log(chalk.green('✓ API connection successful'));
        console.log(chalk.green('✓ All agents operational'));
        console.log(chalk.green('✓ Data pipeline active'));
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
function displayAnalysisResult(result: any) {
  console.log('\n' + chalk.cyan('═══════════════════════════════════════'));
  console.log(chalk.cyan.bold('         ANALYSIS RESULTS'));
  console.log(chalk.cyan('═══════════════════════════════════════\n'));

  const { data } = result;

  // Security section
  if (data.security) {
    console.log(chalk.yellow.bold('🛡️  SECURITY'));
    console.log(`  Rug Risk: ${getRiskColor(data.security.rugDetection?.data?.riskScore || 0)}`);
    console.log(`  Overall Risk: ${data.security.riskAnalysis?.data?.overallRisk || 'Unknown'}\n`);
  }

  // Market section
  if (data.market) {
    console.log(chalk.yellow.bold('📊 MARKET'));
    if (data.market.sentiment?.data) {
      console.log(`  Sentiment: ${getSentimentEmoji(data.market.sentiment.data.overallSentiment)}`);
    }
    console.log('');
  }

  // Summary
  if (data.summary) {
    console.log(chalk.yellow.bold('📋 SUMMARY'));
    console.log(`  Verdict: ${getVerdictColor(data.summary.verdict)}`);
    console.log(`  Score: ${data.summary.score}/100`);

    if (data.summary.recommendations?.length > 0) {
      console.log('\n  Recommendations:');
      data.summary.recommendations.forEach((rec: string) => {
        console.log(`    • ${rec}`);
      });
    }
  }

  console.log('\n' + chalk.cyan('═══════════════════════════════════════\n'));
}

function displayResearchResult(result: any) {
  console.log('\n' + chalk.cyan('═══════════════════════════════════════'));
  console.log(chalk.cyan.bold('         RESEARCH RESULTS'));
  console.log(chalk.cyan('═══════════════════════════════════════\n'));

  const { data } = result;

  if (data.research) {
    const research = data.research;
    console.log(chalk.yellow.bold('📚 FUNDAMENTAL ANALYSIS'));
    console.log(`  Research Score: ${research.researchScore}/100`);
    console.log(`  Conviction: ${research.investmentThesis?.conviction || 'N/A'}`);
    console.log(`  Market Position: ${research.competitivePosition?.marketPosition || 'N/A'}\n`);
  }

  if (data.summary) {
    console.log(chalk.yellow.bold('📋 VERDICT'));
    console.log(`  ${getVerdictColor(data.summary.verdict)}`);

    if (data.summary.recommendations?.length > 0) {
      console.log('\n  Key Points:');
      data.summary.recommendations.forEach((rec: string) => {
        console.log(`    • ${rec}`);
      });
    }
  }

  console.log('\n' + chalk.cyan('═══════════════════════════════════════\n'));
}

function displaySecurityResult(result: any) {
  console.log('\n' + chalk.cyan('═══════════════════════════════════════'));
  console.log(chalk.cyan.bold('        SECURITY ANALYSIS'));
  console.log(chalk.cyan('═══════════════════════════════════════\n'));

  const { data } = result;

  if (data.rugDetection) {
    const rug = data.rugDetection.data;
    console.log(chalk.yellow.bold('🔍 RUG DETECTION'));
    console.log(`  Risk Score: ${getRiskColor(rug?.riskScore || 0)}`);
    console.log(`  Verdict: ${getVerdictColor(rug?.verdict || 'UNKNOWN')}\n`);

    if (rug?.flags?.length > 0) {
      console.log('  Flags:');
      rug.flags.forEach((flag: string) => {
        console.log(`    • ${flag}`);
      });
      console.log('');
    }
  }

  if (data.riskAnalysis) {
    const risk = data.riskAnalysis.data;
    console.log(chalk.yellow.bold('⚠️  RISK ANALYSIS'));
    console.log(`  Overall Risk: ${risk?.overallRisk || 'Unknown'}\n`);

    if (risk?.categories) {
      console.log('  Risk Categories:');
      Object.entries(risk.categories).forEach(([category, level]) => {
        console.log(`    • ${category}: ${level}`);
      });
    }
  }

  console.log('\n' + chalk.cyan('═══════════════════════════════════════\n'));
}

function displayHuntResult(result: any) {
  console.log('\n' + chalk.cyan('═══════════════════════════════════════'));
  console.log(chalk.cyan.bold('        ALPHA OPPORTUNITIES'));
  console.log(chalk.cyan('═══════════════════════════════════════\n'));

  const { data } = result;

  if (data.opportunities?.length > 0) {
    console.log(chalk.yellow.bold(`🎯 FOUND ${data.opportunities.length} OPPORTUNITIES\n`));

    data.opportunities.slice(0, 5).forEach((opp: any, index: number) => {
      console.log(`  ${index + 1}. ${chalk.bold(opp.symbol || opp.name)}`);
      console.log(`     Score: ${opp.score}/100`);
      console.log(`     Type: ${opp.type}`);
      console.log(`     Confidence: ${opp.confidence}%\n`);
    });
  } else {
    console.log(chalk.yellow('No opportunities found with current filters'));
  }

  if (data.recommendations?.length > 0) {
    console.log(chalk.yellow.bold('💡 RECOMMENDATIONS'));
    data.recommendations.forEach((rec: string) => {
      console.log(`  • ${rec}`);
    });
  }

  console.log('\n' + chalk.cyan('═══════════════════════════════════════\n'));
}

function displayTrackResult(result: any) {
  console.log('\n' + chalk.cyan('═══════════════════════════════════════'));
  console.log(chalk.cyan.bold('        WALLET TRACKING'));
  console.log(chalk.cyan('═══════════════════════════════════════\n'));

  const { data } = result;

  if (data.whaleActivity) {
    const whale = data.whaleActivity.data;
    console.log(chalk.yellow.bold('🐋 WHALE STATUS'));
    console.log(`  Is Whale: ${whale?.isWhale ? '✅ Yes' : '❌ No'}`);
    console.log(`  Wallet Type: ${whale?.walletType || 'Unknown'}\n`);
  }

  if (data.portfolio) {
    const portfolio = data.portfolio.data?.portfolio;
    if (portfolio) {
      console.log(chalk.yellow.bold('💼 PORTFOLIO'));
      console.log(`  Total Value: $${formatNumber(portfolio.totalValue)}`);
      console.log(
        `  P&L: ${portfolio.totalPnLPercent > 0 ? '+' : ''}${portfolio.totalPnLPercent.toFixed(2)}%`,
      );
      console.log(`  Assets: ${portfolio.numberOfAssets}\n`);
    }
  }

  if (data.insights) {
    console.log(chalk.yellow.bold('📊 INSIGHTS'));
    data.insights.insights?.forEach((insight: string) => {
      console.log(`  • ${insight}`);
    });
  }

  console.log('\n' + chalk.cyan('═══════════════════════════════════════\n'));
}

function displaySentimentResult(result: any) {
  console.log('\n' + chalk.cyan('═══════════════════════════════════════'));
  console.log(chalk.cyan.bold('       SENTIMENT ANALYSIS'));
  console.log(chalk.cyan('═══════════════════════════════════════\n'));

  const { data } = result;

  console.log(chalk.yellow.bold('😊 OVERALL SENTIMENT'));
  console.log(`  Sentiment: ${getSentimentEmoji(data.sentiment)}`);
  console.log(`  Score: ${data.score.toFixed(2)}/100\n`);

  if (data.analysis) {
    const analysis = data.analysis;

    if (analysis.sources) {
      console.log(chalk.yellow.bold('📱 SOURCES'));
      Object.entries(analysis.sources).forEach(([source, sentiment]: [string, any]) => {
        console.log(`  ${source}: ${sentiment.sentiment || 'N/A'}`);
      });
      console.log('');
    }

    if (analysis.keywords?.length > 0) {
      console.log(chalk.yellow.bold('🔤 TRENDING KEYWORDS'));
      analysis.keywords.slice(0, 5).forEach((keyword: string) => {
        console.log(`  • ${keyword}`);
      });
    }
  }

  console.log('\n' + chalk.cyan('═══════════════════════════════════════\n'));
}

// Helper functions
function getRiskColor(score: number): string {
  if (score < 30) return chalk.green(`${score} (Low Risk)`);
  if (score < 70) return chalk.yellow(`${score} (Medium Risk)`);
  return chalk.red(`${score} (High Risk)`);
}

function getVerdictColor(verdict: string): string {
  switch (verdict.toUpperCase()) {
    case 'SAFE':
    case 'STRONG_BUY':
    case 'BUY':
      return chalk.green.bold(verdict);
    case 'MODERATE':
    case 'HOLD':
      return chalk.yellow.bold(verdict);
    case 'RISKY':
    case 'SELL':
      return chalk.red.bold(verdict);
    case 'HIGH_RISK':
    case 'STRONG_SELL':
      return chalk.red.bold(verdict);
    default:
      return chalk.gray(verdict);
  }
}

function getSentimentEmoji(sentiment: string): string {
  switch (sentiment?.toLowerCase()) {
    case 'very_positive':
    case 'bullish':
      return '🚀 Very Positive';
    case 'positive':
      return '😊 Positive';
    case 'neutral':
      return '😐 Neutral';
    case 'negative':
      return '😟 Negative';
    case 'very_negative':
    case 'bearish':
      return '😱 Very Negative';
    default:
      return '❓ Unknown';
  }
}

function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

// Parse and execute
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
