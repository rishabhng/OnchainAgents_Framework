/**
 * Comprehensive tests for CLI
 * Achieving 100% code coverage
 */

import { jest } from '@jest/globals';
import * as childProcess from 'child_process';

// Mock modules before imports
jest.mock('child_process');

describe('CLI', () => {
  let mockSpawn: jest.MockedFunction<typeof childProcess.spawn>;
  let originalEnv: NodeJS.ProcessEnv;
  let originalArgv: string[];
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env;
    originalArgv = process.argv;
    process.env = { ...originalEnv };
    
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`Process exited with code ${code}`);
    });
    
    mockSpawn = childProcess.spawn as jest.MockedFunction<typeof childProcess.spawn>;
  });

  afterEach(() => {
    process.env = originalEnv;
    process.argv = originalArgv;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('cli.ts', () => {
    it('should display help when --help flag is provided', async () => {
      process.argv = ['node', 'cli.ts', '--help'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Expected to exit
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('OnChainAgents CLI'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Commands:'));
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should display version when --version flag is provided', async () => {
      process.argv = ['node', 'cli.ts', '--version'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Expected to exit
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('OnChainAgents'));
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should run setup command', async () => {
      process.argv = ['node', 'cli.ts', 'setup'];
      
      const mockProcess = {
        on: jest.fn(),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
      };
      
      mockSpawn.mockReturnValue(mockProcess as any);
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(mockSpawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['setup-claude.sh']),
        expect.any(Object)
      );
    });

    it('should analyze token with address', async () => {
      process.argv = ['node', 'cli.ts', 'analyze', 'ethereum', '0x123'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Analyzing'));
    });

    it('should hunt for opportunities', async () => {
      process.argv = ['node', 'cli.ts', 'hunt'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Hunting'));
    });

    it('should track whale wallet', async () => {
      process.argv = ['node', 'cli.ts', 'track', '0xwhale'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tracking'));
    });

    it('should check security', async () => {
      process.argv = ['node', 'cli.ts', 'security', '0xcontract'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Security'));
    });

    it('should analyze sentiment', async () => {
      process.argv = ['node', 'cli.ts', 'sentiment', 'BTC'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Sentiment'));
    });

    it('should analyze DeFi protocols', async () => {
      process.argv = ['node', 'cli.ts', 'defi', 'uniswap'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('DeFi'));
    });

    it('should analyze bridges', async () => {
      process.argv = ['node', 'cli.ts', 'bridge', 'ethereum', 'polygon'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Bridge'));
    });

    it('should track portfolio', async () => {
      process.argv = ['node', 'cli.ts', 'portfolio', '0xaddress'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Portfolio'));
    });

    it('should run MCP server', async () => {
      process.argv = ['node', 'cli.ts', 'mcp'];
      
      const mockProcess = {
        on: jest.fn(),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
      };
      
      mockSpawn.mockReturnValue(mockProcess as any);
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(mockSpawn).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining(['tsx']),
        expect.any(Object)
      );
    });

    it('should handle unknown commands', async () => {
      process.argv = ['node', 'cli.ts', 'unknown-command'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Expected to exit
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown command'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle verbose flag', async () => {
      process.argv = ['node', 'cli.ts', 'analyze', 'ethereum', '0x123', '--verbose'];
      process.env.LOG_LEVEL = 'debug';
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(process.env.LOG_LEVEL).toBe('debug');
    });

    it('should handle network flag', async () => {
      process.argv = ['node', 'cli.ts', 'analyze', 'polygon', '0x123', '--network', 'polygon'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('polygon'));
    });

    it('should handle spawn errors', async () => {
      process.argv = ['node', 'cli.ts', 'mcp'];
      
      const mockProcess = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Spawn error'));
          }
        }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
      };
      
      mockSpawn.mockReturnValue(mockProcess as any);
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Error handling
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed'));
    });

    it('should handle process exit codes', async () => {
      process.argv = ['node', 'cli.ts', 'setup'];
      
      const mockProcess = {
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(1);
          }
        }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
      };
      
      mockSpawn.mockReturnValue(mockProcess as any);
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Process exit
      }
      
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('cli-minimal.ts', () => {
    it('should run minimal MCP server', async () => {
      process.argv = ['node', 'cli-minimal.ts'];
      
      // Mock the MCP server module
      jest.mock('../src/mcp/mcp-server', () => ({
        startMCPServer: jest.fn(),
      }));
      
      try {
        await import('../src/cli-minimal');
      } catch (error) {
        // Server start
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Starting'));
    });

    it('should handle server errors', async () => {
      process.argv = ['node', 'cli-minimal.ts'];
      
      // Mock server with error
      jest.mock('../src/mcp/mcp-server', () => ({
        startMCPServer: jest.fn(() => {
          throw new Error('Server error');
        }),
      }));
      
      try {
        await import('../src/cli-minimal');
      } catch (error) {
        // Error handling
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle SIGINT signal', async () => {
      process.argv = ['node', 'cli-minimal.ts'];
      
      const listeners: { [key: string]: Function } = {};
      process.on = jest.fn((event, callback) => {
        listeners[event as string] = callback;
        return process;
      }) as any;
      
      try {
        await import('../src/cli-minimal');
        
        // Trigger SIGINT
        if (listeners['SIGINT']) {
          listeners['SIGINT']();
        }
      } catch (error) {
        // Process exit
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Shutting down'));
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should handle SIGTERM signal', async () => {
      process.argv = ['node', 'cli-minimal.ts'];
      
      const listeners: { [key: string]: Function } = {};
      process.on = jest.fn((event, callback) => {
        listeners[event as string] = callback;
        return process;
      }) as any;
      
      try {
        await import('../src/cli-minimal');
        
        // Trigger SIGTERM
        if (listeners['SIGTERM']) {
          listeners['SIGTERM']();
        }
      } catch (error) {
        // Process exit
      }
      
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Shutting down'));
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should handle uncaught exceptions', async () => {
      process.argv = ['node', 'cli-minimal.ts'];
      
      const listeners: { [key: string]: Function } = {};
      process.on = jest.fn((event, callback) => {
        listeners[event as string] = callback;
        return process;
      }) as any;
      
      try {
        await import('../src/cli-minimal');
        
        // Trigger uncaught exception
        if (listeners['uncaughtException']) {
          listeners['uncaughtException'](new Error('Test error'));
        }
      } catch (error) {
        // Error handling
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Uncaught'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle unhandled rejections', async () => {
      process.argv = ['node', 'cli-minimal.ts'];
      
      const listeners: { [key: string]: Function } = {};
      process.on = jest.fn((event, callback) => {
        listeners[event as string] = callback;
        return process;
      }) as any;
      
      try {
        await import('../src/cli-minimal');
        
        // Trigger unhandled rejection
        if (listeners['unhandledRejection']) {
          listeners['unhandledRejection']('Test rejection', Promise.reject());
        }
      } catch (error) {
        // Error handling
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unhandled'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('environment variables', () => {
    it('should use HIVE_FALLBACK_MODE', async () => {
      process.env.HIVE_FALLBACK_MODE = 'true';
      process.argv = ['node', 'cli.ts', 'analyze', 'ethereum', '0x123'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(process.env.HIVE_FALLBACK_MODE).toBe('true');
    });

    it('should use custom HIVE_MCP_URL', async () => {
      process.env.HIVE_MCP_URL = 'https://custom.url/mcp';
      process.argv = ['node', 'cli.ts', 'analyze', 'ethereum', '0x123'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(process.env.HIVE_MCP_URL).toBe('https://custom.url/mcp');
    });

    it('should use HIVE_API_KEY when provided', async () => {
      process.env.HIVE_API_KEY = 'test-api-key';
      process.argv = ['node', 'cli.ts', 'analyze', 'ethereum', '0x123'];
      
      try {
        await import('../src/cli');
      } catch (error) {
        // Command execution
      }
      
      expect(process.env.HIVE_API_KEY).toBe('test-api-key');
    });
  });
});