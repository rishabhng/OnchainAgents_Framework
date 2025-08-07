import { HiveServiceAdapter } from '../../src/interfaces/IHiveService';

describe('HiveServiceAdapter', () => {
  let adapter: HiveServiceAdapter;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {};
    adapter = new HiveServiceAdapter(mockClient);
  });

  describe('execute', () => {
    it('should use execute method if available', async () => {
      mockClient.execute = jest.fn().mockResolvedValue({ success: true, data: 'test' });
      
      const result = await adapter.execute('tool', { param: 'value' });
      
      expect(mockClient.execute).toHaveBeenCalledWith('tool', { param: 'value' });
      expect(result).toEqual({ success: true, data: 'test' });
    });

    it('should use callTool method if execute not available', async () => {
      mockClient.callTool = jest.fn().mockResolvedValue({ success: true, data: 'test' });
      
      const result = await adapter.execute('tool', { param: 'value' });
      
      expect(mockClient.callTool).toHaveBeenCalledWith('tool', { param: 'value' });
      expect(result).toEqual({ success: true, data: 'test' });
    });

    it('should use request method if others not available', async () => {
      mockClient.request = jest.fn().mockResolvedValue({ success: true, data: 'test' });
      
      const result = await adapter.execute('endpoint', { param: 'value' });
      
      expect(mockClient.request).toHaveBeenCalledWith('endpoint', { param: 'value' });
      expect(result).toEqual({ success: true, data: 'test' });
    });

    it('should use call method and wrap result', async () => {
      mockClient.call = jest.fn().mockResolvedValue({ result: 'data' });
      
      const result = await adapter.execute('tool', { param: 'value' });
      
      expect(mockClient.call).toHaveBeenCalledWith('tool', { param: 'value' });
      expect(result).toEqual({ success: true, data: { result: 'data' } });
    });

    it('should throw error if no compatible method found', async () => {
      await expect(adapter.execute('tool')).rejects.toThrow('No compatible execution method found on client');
    });
  });

  describe('initialize', () => {
    it('should call initialize if available', async () => {
      mockClient.initialize = jest.fn().mockResolvedValue(undefined);
      
      await adapter.initialize();
      
      expect(mockClient.initialize).toHaveBeenCalled();
    });

    it('should call connect if initialize not available', async () => {
      mockClient.connect = jest.fn().mockResolvedValue(undefined);
      
      await adapter.initialize();
      
      expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should not throw if neither method available', async () => {
      await expect(adapter.initialize()).resolves.toBeUndefined();
    });
  });

  describe('disconnect', () => {
    it('should call disconnect if available', async () => {
      mockClient.disconnect = jest.fn().mockResolvedValue(undefined);
      
      await adapter.disconnect();
      
      expect(mockClient.disconnect).toHaveBeenCalled();
    });

    it('should call close if disconnect not available', async () => {
      mockClient.close = jest.fn().mockResolvedValue(undefined);
      
      await adapter.disconnect();
      
      expect(mockClient.close).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should call healthCheck if available', async () => {
      mockClient.healthCheck = jest.fn().mockResolvedValue(true);
      
      const result = await adapter.healthCheck();
      
      expect(mockClient.healthCheck).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should call ping if healthCheck not available', async () => {
      mockClient.ping = jest.fn().mockResolvedValue(true);
      
      const result = await adapter.healthCheck();
      
      expect(mockClient.ping).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should call isConnected if others not available', async () => {
      mockClient.isConnected = jest.fn().mockReturnValue(true);
      
      const result = await adapter.healthCheck();
      
      expect(mockClient.isConnected).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return true if no health check method available', async () => {
      const result = await adapter.healthCheck();
      
      expect(result).toBe(true);
    });
  });

  describe('updateSettings', () => {
    it('should call updateSettings if available', async () => {
      mockClient.updateSettings = jest.fn().mockResolvedValue(undefined);
      const settings = { key: 'value' };
      
      await adapter.updateSettings(settings);
      
      expect(mockClient.updateSettings).toHaveBeenCalledWith(settings);
    });

    it('should call configure if updateSettings not available', async () => {
      mockClient.configure = jest.fn().mockResolvedValue(undefined);
      const settings = { key: 'value' };
      
      await adapter.updateSettings(settings);
      
      expect(mockClient.configure).toHaveBeenCalledWith(settings);
    });
  });

  describe('listTools', () => {
    it('should call listTools if available', async () => {
      mockClient.listTools = jest.fn().mockResolvedValue(['tool1', 'tool2']);
      
      const result = await adapter.listTools();
      
      expect(mockClient.listTools).toHaveBeenCalled();
      expect(result).toEqual(['tool1', 'tool2']);
    });

    it('should call getTools if listTools not available', async () => {
      mockClient.getTools = jest.fn().mockResolvedValue(['tool1', 'tool2']);
      
      const result = await adapter.listTools();
      
      expect(mockClient.getTools).toHaveBeenCalled();
      expect(result).toEqual(['tool1', 'tool2']);
    });

    it('should return empty array if no method available', async () => {
      const result = await adapter.listTools();
      
      expect(result).toEqual([]);
    });
  });

  describe('describeTool', () => {
    it('should call describeTool if available', async () => {
      mockClient.describeTool = jest.fn().mockResolvedValue({ name: 'tool', description: 'desc' });
      
      const result = await adapter.describeTool('tool');
      
      expect(mockClient.describeTool).toHaveBeenCalledWith('tool');
      expect(result).toEqual({ name: 'tool', description: 'desc' });
    });

    it('should call getTool if describeTool not available', async () => {
      mockClient.getTool = jest.fn().mockResolvedValue({ name: 'tool', description: 'desc' });
      
      const result = await adapter.describeTool('tool');
      
      expect(mockClient.getTool).toHaveBeenCalledWith('tool');
      expect(result).toEqual({ name: 'tool', description: 'desc' });
    });

    it('should return empty object if no method available', async () => {
      const result = await adapter.describeTool('tool');
      
      expect(result).toEqual({});
    });
  });

  describe('getCapabilities', () => {
    it('should call getCapabilities if available', async () => {
      mockClient.getCapabilities = jest.fn().mockResolvedValue(['cap1', 'cap2']);
      
      const result = await adapter.getCapabilities();
      
      expect(mockClient.getCapabilities).toHaveBeenCalled();
      expect(result).toEqual(['cap1', 'cap2']);
    });

    it('should return capabilities property if method not available', async () => {
      mockClient.capabilities = ['cap1', 'cap2'];
      
      const result = await adapter.getCapabilities();
      
      expect(result).toEqual(['cap1', 'cap2']);
    });

    it('should return empty array if nothing available', async () => {
      const result = await adapter.getCapabilities();
      
      expect(result).toEqual([]);
    });
  });

  describe('legacy methods', () => {
    it('request should call execute', async () => {
      const executeSpy = jest.spyOn(adapter, 'execute').mockResolvedValue({ success: true, data: 'test' });
      
      const result = await adapter.request('endpoint', { param: 'value' });
      
      expect(executeSpy).toHaveBeenCalledWith('endpoint', { param: 'value' });
      expect(result).toEqual({ success: true, data: 'test' });
    });

    it('callTool should call execute', async () => {
      const executeSpy = jest.spyOn(adapter, 'execute').mockResolvedValue({ success: true, data: 'test' });
      
      const result = await adapter.callTool('tool', { param: 'value' });
      
      expect(executeSpy).toHaveBeenCalledWith('tool', { param: 'value' });
      expect(result).toEqual({ success: true, data: 'test' });
    });
  });
});