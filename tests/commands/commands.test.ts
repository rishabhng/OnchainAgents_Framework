/**
 * Comprehensive tests for the Command System
 * Tests all 11+ commands with various flags and scenarios
 */

import { CommandManager } from '../../src/commands';
import { DetectionEngine } from '../../src/orchestrator/detection-engine';
import { PersonaManager } from '../../src/personas';
import { PersonaActivationEngine } from '../../src/personas/activation-engine';

describe('Command System', () => {
  let commandManager: CommandManager;
  let detectionEngine: DetectionEngine;
  let personaManager: PersonaManager;
  let activationEngine: PersonaActivationEngine;

  beforeEach(() => {
    detectionEngine = new DetectionEngine();
    personaManager = new PersonaManager();
    activationEngine = new PersonaActivationEngine(personaManager);
    commandManager = new CommandManager(detectionEngine, personaManager, activationEngine);
  });

  describe('Command Registration', () => {
    it('should register all 11 core commands', () => {
      const commands = (commandManager as any).commands;
      
      expect(commands.has('/whale')).toBe(true);
      expect(commands.has('/audit')).toBe(true);
      expect(commands.has('/alpha')).toBe(true);
      expect(commands.has('/yield')).toBe(true);
      expect(commands.has('/sentiment')).toBe(true);
      expect(commands.has('/nft')).toBe(true);
      expect(commands.has('/governance')).toBe(true);
      expect(commands.has('/risk')).toBe(true);
      expect(commands.has('/trace')).toBe(true);
      expect(commands.has('/quant')).toBe(true);
      expect(commands.has('/mm')).toBe(true);
      
      expect(commands.size).toBeGreaterThanOrEqual(11);
    });
  });

  describe('Command Parsing', () => {
    it('should parse simple commands', () => {
      const { command, args, flags } = commandManager.parseInput('/whale 0x123');
      
      expect(command).toBe('/whale');
      expect(args.address).toBe('0x123');
      expect(flags).toEqual({});
    });

    it('should parse commands with flags', () => {
      const { command, args, flags } = commandManager.parseInput('/whale 0x123 --deep --realtime');
      
      expect(command).toBe('/whale');
      expect(args.address).toBe('0x123');
      expect(flags.deep).toBe(true);
      expect(flags.realtime).toBe(true);
    });

    it('should parse commands with flag values', () => {
      const { command, args, flags } = commandManager.parseInput('/yield 10000 --risk high --duration 30d');
      
      expect(command).toBe('/yield');
      expect(args.amount).toBe('10000');
      expect(flags.risk).toBe('high');
      expect(flags.duration).toBe('30d');
    });

    it('should parse complex commands', () => {
      const { command, args, flags } = commandManager.parseInput(
        '/audit 0xcontract --depth deep --include-deps --simulate --report'
      );
      
      expect(command).toBe('/audit');
      expect(args.contract).toBe('0xcontract');
      expect(flags.depth).toBe('deep');
      expect(flags['include-deps']).toBe(true);
      expect(flags.simulate).toBe(true);
      expect(flags.report).toBe(true);
    });
  });

  describe('Whale Command', () => {
    it('should execute whale tracking', async () => {
      const result = await commandManager.execute('/whale 0x1234567890123456789012345678901234567890');
      
      expect(result.success).toBe(true);
      expect(result.data.whale).toBeDefined();
      expect(result.data.whale.address).toBe('0x1234567890123456789012345678901234567890');
      expect(result.metadata?.persona).toBe('WhaleHunter');
    });

    it('should handle deep whale analysis', async () => {
      const result = await commandManager.execute('/whale 0x1234567890123456789012345678901234567890 --deep');
      
      expect(result.success).toBe(true);
      expect(result.metadata?.waveMode).toBe(false); // Single flag doesn't trigger wave
    });

    it('should validate address format', async () => {
      const result = await commandManager.execute('/whale invalid-address');
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Invalid address format');
    });
  });

  describe('Audit Command', () => {
    it('should perform basic security audit', async () => {
      const result = await commandManager.execute('/audit 0x1234567890123456789012345678901234567890');
      
      expect(result.success).toBe(true);
      expect(result.data.securityScore).toBeDefined();
      expect(result.data.vulnerabilities).toBeDefined();
    });

    it('should trigger wave mode for deep audits', async () => {
      const result = await commandManager.execute(
        '/audit 0x1234567890123456789012345678901234567890 --depth deep'
      );
      
      expect(result.success).toBe(true);
      expect(result.metadata?.waveMode).toBe(true);
      expect(result.metadata?.persona).toBe('SecurityAuditor');
    });

    it('should handle critical-only flag', async () => {
      const result = await commandManager.execute(
        '/audit 0x1234567890123456789012345678901234567890 --critical-only'
      );
      
      expect(result.success).toBe(true);
      expect(result.warnings?.length).toBe(0);
    });
  });

  describe('Alpha Command', () => {
    it('should discover alpha opportunities', async () => {
      const result = await commandManager.execute('/alpha');
      
      expect(result.success).toBe(true);
      expect(result.data.opportunities).toBeDefined();
      expect(result.data.opportunities.length).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const result = await commandManager.execute('/alpha defi');
      
      expect(result.success).toBe(true);
      expect(result.data.opportunities).toBeDefined();
    });

    it('should apply trending filter', async () => {
      const result = await commandManager.execute('/alpha --trending');
      
      expect(result.success).toBe(true);
      expect(result.data.opportunities.length).toBe(1); // Trending returns top 1
    });

    it('should handle risk levels', async () => {
      const result = await commandManager.execute('/alpha --risk high');
      
      expect(result.success).toBe(true);
      expect(result.metadata?.persona).toBe('AlphaSeeker');
    });
  });

  describe('Yield Command', () => {
    it('should optimize yield strategies', async () => {
      const result = await commandManager.execute('/yield 10000');
      
      expect(result.success).toBe(true);
      expect(result.data.recommendedStrategies).toBeDefined();
      expect(result.data.totalAPY).toBeGreaterThan(0);
    });

    it('should handle stable-only flag', async () => {
      const result = await commandManager.execute('/yield 10000 --stable-only');
      
      expect(result.success).toBe(true);
      const strategies = result.data.recommendedStrategies;
      expect(strategies.every((s: any) => s.risk === 'low')).toBe(true);
    });

    it('should support multi-chain optimization', async () => {
      const result = await commandManager.execute('/yield 50000 --multi-chain');
      
      expect(result.success).toBe(true);
      const strategies = result.data.recommendedStrategies;
      expect(strategies.some((s: any) => s.chain !== 'Ethereum')).toBe(true);
    });

    it('should validate amount', async () => {
      const result = await commandManager.execute('/yield invalid-amount');
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Invalid number');
    });
  });

  describe('Sentiment Command', () => {
    it('should analyze token sentiment', async () => {
      const result = await commandManager.execute('/sentiment BTC');
      
      expect(result.success).toBe(true);
      expect(result.data.sentiment).toBeDefined();
      expect(result.data.score).toBeGreaterThanOrEqual(0);
      expect(result.data.score).toBeLessThanOrEqual(1);
    });

    it('should include social sources', async () => {
      const result = await commandManager.execute('/sentiment ETH --social');
      
      expect(result.success).toBe(true);
      expect(result.data.sources).toContain('Twitter');
    });

    it('should handle realtime flag', async () => {
      const result = await commandManager.execute('/sentiment PEPE --realtime');
      
      expect(result.success).toBe(true);
      expect(result.metadata?.persona).toBeDefined();
    });
  });

  describe('NFT Command', () => {
    it('should analyze NFT collections', async () => {
      const result = await commandManager.execute('/nft 0xabc123');
      
      expect(result.success).toBe(true);
      expect(result.data.collection).toBe('0xabc123');
      expect(result.data.floorPrice).toBeDefined();
    });

    it('should provide rarity analysis', async () => {
      const result = await commandManager.execute('/nft BAYC --rarity');
      
      expect(result.success).toBe(true);
      expect(result.data.rarity).toBeDefined();
    });
  });

  describe('Governance Command', () => {
    it('should analyze DAO governance', async () => {
      const result = await commandManager.execute('/governance uniswap');
      
      expect(result.success).toBe(true);
      expect(result.data.dao).toBe('uniswap');
      expect(result.data.activeProposals).toBeDefined();
    });

    it('should show proposals', async () => {
      const result = await commandManager.execute('/governance aave --proposals');
      
      expect(result.success).toBe(true);
      expect(result.data.activeProposals).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Risk Command', () => {
    it('should analyze portfolio risk', async () => {
      const result = await commandManager.execute('/risk');
      
      expect(result.success).toBe(true);
      expect(result.data.riskScore).toBeDefined();
      expect(result.data.recommendations).toBeDefined();
    });

    it('should calculate VaR', async () => {
      const result = await commandManager.execute('/risk --var');
      
      expect(result.success).toBe(true);
      expect(result.data.var95).toBeDefined();
    });

    it('should trigger wave mode for stress testing', async () => {
      const result = await commandManager.execute('/risk --stress');
      
      expect(result.success).toBe(true);
      expect(result.metadata?.waveMode).toBe(true);
    });
  });

  describe('Trace Command', () => {
    it('should trace transactions', async () => {
      const result = await commandManager.execute('/trace 0xabc123');
      
      expect(result.success).toBe(true);
      expect(result.data.transaction).toBe('0xabc123');
      expect(result.data.addresses).toBeDefined();
    });

    it('should handle depth parameter', async () => {
      const result = await commandManager.execute('/trace 0xdef456 --depth 5');
      
      expect(result.success).toBe(true);
      expect(result.metadata?.waveMode).toBe(true); // Complex tracing uses waves
    });
  });

  describe('Quant Command', () => {
    it('should perform quantitative analysis', async () => {
      const result = await commandManager.execute('/quant');
      
      expect(result.success).toBe(true);
      expect(result.data.strategy).toBe('arbitrage');
      expect(result.data.sharpeRatio).toBeDefined();
    });

    it('should support backtesting', async () => {
      const result = await commandManager.execute('/quant arbitrage --backtest');
      
      expect(result.success).toBe(true);
      expect(result.data.expectedReturn).toBeDefined();
    });

    it('should apply GARCH models', async () => {
      const result = await commandManager.execute('/quant --model garch');
      
      expect(result.success).toBe(true);
      expect(result.data.model).toContain('GARCH');
    });
  });

  describe('Market Maker Command', () => {
    it('should analyze market making opportunities', async () => {
      const result = await commandManager.execute('/mm ETH/USDC');
      
      expect(result.success).toBe(true);
      expect(result.data.pair).toBe('ETH/USDC');
      expect(result.data.bidAskSpread).toBeDefined();
    });

    it('should handle spread parameter', async () => {
      const result = await commandManager.execute('/mm BTC/USDT --spread 0.3');
      
      expect(result.success).toBe(true);
      expect(result.data.depth).toBeDefined();
    });
  });

  describe('Command Help System', () => {
    it('should provide general help', () => {
      const help = commandManager.getHelp();
      
      expect(help).toContain('Available Commands');
      expect(help).toContain('/whale');
      expect(help).toContain('/audit');
      expect(help).toContain('/alpha');
    });

    it('should provide command-specific help', () => {
      const help = commandManager.getHelp('/whale');
      
      expect(help).toContain('/whale');
      expect(help).toContain('Track and analyze whale wallet movements');
      expect(help).toContain('Arguments:');
      expect(help).toContain('address');
      expect(help).toContain('Flags:');
      expect(help).toContain('--deep');
    });

    it('should handle unknown commands in help', () => {
      const help = commandManager.getHelp('/unknown');
      
      expect(help).toContain('Unknown command: /unknown');
    });
  });

  describe('Command Statistics', () => {
    it('should track command execution statistics', async () => {
      await commandManager.execute('/sentiment BTC');
      await commandManager.execute('/alpha');
      await commandManager.execute('/sentiment ETH');
      
      const stats = commandManager.getStatistics();
      
      expect(stats.totalExecutions).toBe(3);
      expect(stats.commandUsage['/sentiment']).toBe(2);
      expect(stats.commandUsage['/alpha']).toBe(1);
      expect(stats.successRate).toBeGreaterThan(0);
    });

    it('should track execution time', async () => {
      await commandManager.execute('/whale 0x1234567890123456789012345678901234567890');
      
      const stats = commandManager.getStatistics();
      
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle execution errors gracefully', async () => {
      // Mock an error in persona activation
      jest.spyOn(activationEngine, 'activateBestPersona').mockRejectedValue(
        new Error('Activation failed')
      );
      
      const result = await commandManager.execute('/whale 0x1234567890123456789012345678901234567890');
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Execution error');
    });

    it('should validate required arguments', async () => {
      const result = await commandManager.execute('/whale'); // Missing address
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Missing required argument: address');
    });

    it('should validate argument types', async () => {
      const result = await commandManager.execute('/yield not-a-number');
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Invalid number: amount');
    });

    it('should validate network types', async () => {
      const result = await commandManager.execute(
        '/whale 0x1234567890123456789012345678901234567890 --network invalid'
      );
      
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('Invalid network');
    });
  });

  describe('Persona Integration', () => {
    it('should activate correct persona for each command', async () => {
      const commands = [
        { cmd: '/whale 0x1234567890123456789012345678901234567890', persona: 'WhaleHunter' },
        { cmd: '/audit 0x1234567890123456789012345678901234567890', persona: 'SecurityAuditor' },
        { cmd: '/alpha', persona: 'AlphaSeeker' },
        { cmd: '/yield 10000', persona: 'DeFiArchitect' },
      ];
      
      for (const { cmd, persona } of commands) {
        const result = await commandManager.execute(cmd);
        expect(result.metadata?.persona).toBe(persona);
      }
    });
  });

  describe('Wave Mode Integration', () => {
    it('should activate wave mode for complex commands', async () => {
      const result = await commandManager.execute(
        '/audit 0x1234567890123456789012345678901234567890 --depth deep --include-deps'
      );
      
      expect(result.success).toBe(true);
      expect(result.metadata?.waveMode).toBe(true);
    });

    it('should not activate wave mode for simple commands', async () => {
      const result = await commandManager.execute('/sentiment BTC');
      
      expect(result.success).toBe(true);
      expect(result.metadata?.waveMode).toBe(false);
    });
  });
});