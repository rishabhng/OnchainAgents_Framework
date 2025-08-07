/**
 * Mock HiveBridge for testing
 */

export class HiveBridge {
  execute = jest.fn();
  initialize = jest.fn().mockResolvedValue(true);
  disconnect = jest.fn().mockResolvedValue(true);
  getCapabilities = jest.fn().mockResolvedValue([]);
  healthCheck = jest.fn().mockResolvedValue(true);
  updateSettings = jest.fn().mockResolvedValue(true);
  listTools = jest.fn().mockResolvedValue([]);
  describeTool = jest.fn().mockResolvedValue({});
  callTool = jest.fn().mockResolvedValue({ success: true, data: {} });
  
  constructor(config?: any) {
    // Mock constructor
  }
}

export default HiveBridge;