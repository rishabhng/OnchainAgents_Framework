#!/usr/bin/env node

import chalk from 'chalk';
import { execSync } from 'child_process';
import { RetroLoader, createModemLoader } from '../retro-loader';
import fs from 'fs';
import path from 'path';
import os from 'os';

export class HiveMCPAutoInstaller {
  private spinner: RetroLoader | null = null;

  constructor() {
    // Spinner will be created when needed
  }

  /**
   * Main installation flow
   */
  public async install(): Promise<void> {
    console.log(chalk.cyan.bold('\n🚀 OnChainAgents.fun Auto-Installer\n'));
    console.log(chalk.gray('Setting up Hive Intelligence MCP integration...\n'));

    try {
      await this.checkPrerequisites();
      await this.detectClaudeCode();
      await this.installHiveMCP();
      await this.configureSettings();
      await this.verifyInstallation();

      this.showSuccess();
    } catch (error) {
      this.showError(error as Error);
      process.exit(1);
    }
  }

  /**
   * Check system prerequisites
   */
  private async checkPrerequisites(): Promise<void> {
    this.spinner = new RetroLoader('green', 'modem');
    this.spinner.start('Checking prerequisites...');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required. Current version: ${nodeVersion}`);
    }

    // Check npm
    try {
      execSync('npm --version', { stdio: 'ignore' });
    } catch {
      throw new Error('npm is not installed');
    }

    if (this.spinner) this.spinner.succeed('Prerequisites checked');
  }

  /**
   * Detect Claude Code installation
   */
  private async detectClaudeCode(): Promise<void> {
    this.spinner = new RetroLoader('amber', 'scanline');
    this.spinner.start('Detecting Claude Code...');

    const platform = os.platform();
    let claudeConfigPath: string;

    switch (platform) {
      case 'darwin':
        claudeConfigPath = path.join(os.homedir(), '.config', 'claude');
        break;
      case 'win32':
        claudeConfigPath = path.join(os.homedir(), 'AppData', 'Roaming', 'claude');
        break;
      case 'linux':
        claudeConfigPath = path.join(os.homedir(), '.config', 'claude');
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    if (!fs.existsSync(claudeConfigPath)) {
      // Warning message with retro style
      if (this.spinner) this.spinner.stop();
      console.log(chalk.yellow('⚠ Claude Code not detected. Creating configuration directory...'));
      fs.mkdirSync(claudeConfigPath, { recursive: true });
    }

    if (this.spinner) this.spinner.succeed('Claude Code configuration detected');
  }

  /**
   * Install Hive MCP server
   */
  private async installHiveMCP(): Promise<void> {
    this.spinner = new RetroLoader('cyan', 'matrix');
    this.spinner.start('Installing Hive Intelligence MCP server...');

    try {
      // Check if already installed
      try {
        execSync('claude mcp list | grep hive-intelligence', { stdio: 'ignore' });
        if (this.spinner) this.spinner.stop();
        console.log(chalk.blue('ℹ Hive MCP already installed'));
        return;
      } catch {
        // Not installed, proceed with installation
      }

      // Install using Claude MCP command
      execSync('npx @modelcontextprotocol/create-server hive-intelligence', {
        stdio: 'ignore',
      });

      if (this.spinner) this.spinner.succeed('Hive MCP server installed');
    } catch (error) {
      // Fallback to manual installation
      if (this.spinner) this.spinner.stop();
      console.log(chalk.yellow('⚠ Claude MCP command not available. Installing manually...'));
      await this.manualInstall();
    }
  }

  /**
   * Manual installation fallback
   */
  private async manualInstall(): Promise<void> {
    const configPath = this.getConfigPath();
    const mcpServersPath = path.join(configPath, 'mcp_servers.json');

    let mcpConfig: any = {};

    if (fs.existsSync(mcpServersPath)) {
      const content = fs.readFileSync(mcpServersPath, 'utf-8');
      mcpConfig = JSON.parse(content);
    }

    // Add Hive Intelligence server
    mcpConfig['hive-intelligence'] = {
      command: 'npx',
      args: ['-y', '@hive-agent/mcp-server'],
      env: {
        HIVE_API_KEY: process.env.HIVE_API_KEY || 'YOUR_API_KEY_HERE',
      },
    };

    fs.writeFileSync(mcpServersPath, JSON.stringify(mcpConfig, null, 2));
    if (this.spinner) this.spinner.succeed('Hive MCP server configured manually');
  }

  /**
   * Configure Claude settings
   */
  private async configureSettings(): Promise<void> {
    this.spinner = new RetroLoader('green', 'bbs');
    this.spinner.start('Configuring settings...');

    const configPath = this.getConfigPath();
    const settingsPath = path.join(configPath, 'settings.json');

    let settings: any = {};

    if (fs.existsSync(settingsPath)) {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      settings = JSON.parse(content);
    }

    // Add OnChainAgents configuration
    settings.onchainagents = {
      enabled: true,
      autoStart: true,
      hiveApiKey: process.env.HIVE_API_KEY || '',
      defaultNetwork: 'ethereum',
      cacheEnabled: true,
    };

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    // Create .env file if it doesn't exist
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      const envContent = `# Hive Intelligence API Configuration
HIVE_API_KEY=your_api_key_here
HIVE_API_URL=https://api.hiveintelligence.xyz

# OnChainAgents Configuration
LOG_LEVEL=info
CACHE_TTL=3600
MAX_RETRIES=3
`;
      fs.writeFileSync(envPath, envContent);
      if (this.spinner) this.spinner.stop();
      console.log(chalk.blue('ℹ .env file created. Please add your Hive API key.'));
    }

    if (this.spinner) this.spinner.succeed('Settings configured');
  }

  /**
   * Verify installation
   */
  private async verifyInstallation(): Promise<void> {
    this.spinner = new RetroLoader('green', 'phosphor');
    this.spinner.start('Verifying installation...');

    // Check if MCP server is accessible
    try {
      const configPath = this.getConfigPath();
      const mcpServersPath = path.join(configPath, 'mcp_servers.json');

      if (!fs.existsSync(mcpServersPath)) {
        throw new Error('MCP servers configuration not found');
      }

      const content = fs.readFileSync(mcpServersPath, 'utf-8');
      const config = JSON.parse(content);

      if (!config['hive-intelligence']) {
        throw new Error('Hive Intelligence server not configured');
      }

      if (this.spinner) this.spinner.succeed('Installation verified');
    } catch (error) {
      throw new Error(`Verification failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get Claude configuration path
   */
  private getConfigPath(): string {
    const platform = os.platform();

    switch (platform) {
      case 'darwin':
        return path.join(os.homedir(), '.config', 'claude');
      case 'win32':
        return path.join(os.homedir(), 'AppData', 'Roaming', 'claude');
      case 'linux':
        return path.join(os.homedir(), '.config', 'claude');
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Show success message
   */
  private showSuccess(): void {
    console.log('\n' + chalk.green.bold('✅ Installation Complete!\n'));

    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray('1. Add your Hive API key to .env file'));
    console.log(chalk.gray('2. Restart Claude Code'));
    console.log(chalk.gray('3. Start using OnChainAgents commands!\n'));

    console.log(chalk.yellow('Quick start:'));
    console.log(chalk.gray('  import { OnChainAgents } from "@onchainagents/core";'));
    console.log(chalk.gray('  const oca = new OnChainAgents();'));
    console.log(chalk.gray('  const result = await oca.analyze("ethereum", "0x...");'));

    console.log('\n' + chalk.blue('Documentation: https://docs.onchainagents.fun'));
    console.log(chalk.blue('Discord: https://discord.gg/onchainagents\n'));
  }

  /**
   * Show error message
   */
  private showError(error: Error): void {
    if (this.spinner) this.spinner.fail('Installation failed');
    console.log('\n' + chalk.red.bold('❌ Error:'), chalk.red(error.message));
    console.log('\n' + chalk.yellow('Need help?'));
    console.log(chalk.gray('- Documentation: https://docs.onchainagents.fun/troubleshooting'));
    console.log(chalk.gray('- Discord: https://discord.gg/onchainagents'));
    console.log(
      chalk.gray('- GitHub Issues: https://github.com/onchainagents/onchainagents.fun/issues\n'),
    );
  }
}

// Run installer if called directly
if (require.main === module) {
  const installer = new HiveMCPAutoInstaller();
  installer.install().catch(console.error);
}
