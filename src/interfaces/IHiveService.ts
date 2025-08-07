/**
 * Unified interface for Hive service interactions
 * This interface unifies HiveMCPClient, HiveBridge, and HiveClient
 */

export interface HiveResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}

export interface IHiveService {
  // Core execution method
  execute(tool: string, params?: Record<string, any>): Promise<HiveResponse>;
  
  // Lifecycle methods
  initialize?(): Promise<void>;
  disconnect?(): Promise<void>;
  healthCheck(): Promise<boolean>;
  
  // Configuration
  updateSettings?(settings: Record<string, any>): Promise<void>;
  
  // Tool discovery
  listTools?(): Promise<string[]>;
  describeTool?(tool: string): Promise<any>;
  getCapabilities?(): Promise<string[]>;
  
  // Legacy compatibility methods (required for agents)
  request(endpoint: string, params?: Record<string, any>): Promise<HiveResponse>;
  callTool(tool: string, params?: Record<string, any>): Promise<HiveResponse>;
}

/**
 * Adapter to convert any Hive client to IHiveService
 */
export class HiveServiceAdapter implements IHiveService {
  private client: any;
  
  constructor(client: any) {
    this.client = client;
  }
  
  async execute(tool: string, params?: Record<string, any>): Promise<HiveResponse> {
    // Try different method names based on what the client supports
    if (this.client.execute) {
      return this.client.execute(tool, params);
    }
    if (this.client.callTool) {
      return this.client.callTool(tool, params);
    }
    if (this.client.request) {
      return this.client.request(tool, params);
    }
    
    // Fallback for HiveMCPClient
    if (this.client.call) {
      const result = await this.client.call(tool, params);
      return {
        success: true,
        data: result,
      };
    }
    
    throw new Error('No compatible execution method found on client');
  }
  
  async initialize(): Promise<void> {
    if (this.client.initialize) {
      return this.client.initialize();
    }
    if (this.client.connect) {
      return this.client.connect();
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.client.disconnect) {
      return this.client.disconnect();
    }
    if (this.client.close) {
      return this.client.close();
    }
  }
  
  async healthCheck(): Promise<boolean> {
    if (this.client.healthCheck) {
      return this.client.healthCheck();
    }
    if (this.client.ping) {
      return this.client.ping();
    }
    if (this.client.isConnected) {
      return this.client.isConnected();
    }
    return true; // Assume healthy if no health check method
  }
  
  async updateSettings(settings: Record<string, any>): Promise<void> {
    if (this.client.updateSettings) {
      return this.client.updateSettings(settings);
    }
    if (this.client.configure) {
      return this.client.configure(settings);
    }
  }
  
  async listTools(): Promise<string[]> {
    if (this.client.listTools) {
      return this.client.listTools();
    }
    if (this.client.getTools) {
      return this.client.getTools();
    }
    return [];
  }
  
  async describeTool(tool: string): Promise<any> {
    if (this.client.describeTool) {
      return this.client.describeTool(tool);
    }
    if (this.client.getTool) {
      return this.client.getTool(tool);
    }
    return {};
  }
  
  async getCapabilities(): Promise<string[]> {
    if (this.client.getCapabilities) {
      return this.client.getCapabilities();
    }
    if (this.client.capabilities) {
      return this.client.capabilities;
    }
    return [];
  }
  
  // Legacy compatibility
  async request(endpoint: string, params?: Record<string, any>): Promise<HiveResponse> {
    return this.execute(endpoint, params);
  }
  
  async callTool(tool: string, params?: Record<string, any>): Promise<HiveResponse> {
    return this.execute(tool, params);
  }
}