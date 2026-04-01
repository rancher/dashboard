import {
  describe, it, expect, jest, beforeEach, afterEach
} from '@jest/globals';
import { ResourcesApiClassImpl } from '../resources-api-class';
import { Store } from 'vuex';

describe.each(['cluster', 'management'] as const)('resourcesApiClassImpl with storeType: %s', (storeType) => {
  let mockStore: Store<any>;
  let resourcesApi: ResourcesApiClassImpl;
  let mockDispatch: jest.Mock;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Mock console.error to avoid cluttering test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create mock store with dispatch
    mockDispatch = jest.fn() as any;
    mockStore = { dispatch: mockDispatch } as any;

    // Instantiate the API
    resourcesApi = new ResourcesApiClassImpl(mockStore, storeType);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('get', () => {
    it('should successfully get a resource by type and id', async() => {
      // Arrange
      const mockResource = {
        metadata: { name: 'test-resource' },
        spec:     { data: 'value' }
      };

      mockDispatch.mockResolvedValue(mockResource);

      // Act
      const result = await resourcesApi.get('pod', 'test-pod', { watch: true });

      // Assert
      expect(result).toStrictEqual(mockResource);
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/find`, {
        type: 'pod',
        id:   'test-pod',
        opt:  { watch: true }
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should pass empty options object when no options provided', async() => {
      // Arrange
      const mockResource = { metadata: { name: 'test-resource' } };

      mockDispatch.mockResolvedValue(mockResource);

      // Act
      await resourcesApi.get('pod', 'test-pod');

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/find`, {
        type: 'pod',
        id:   'test-pod',
        opt:  {}
      });
    });

    it('should throw error and log when dispatch fails', async() => {
      // Arrange
      const error = new Error('Network error');

      mockDispatch.mockRejectedValue(error);

      // Act & Assert
      await expect(resourcesApi.get('pod', 'test-pod')).rejects.toThrow(
        `Resource API error - ${ storeType } - Failed to get resource pod/test-pod: Network error`
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Resource API error - ${ storeType } - Failed to get resource pod/test-pod: Network error`
      );
    });

    it('should handle resources with different types correctly', async() => {
      // Arrange
      const mockDeployment = {
        metadata: { name: 'test-deployment' },
        spec:     { replicas: 3 }
      };

      mockDispatch.mockResolvedValue(mockDeployment);

      // Act
      const result = await resourcesApi.get('apps.deployment', 'test-deployment');

      // Assert
      expect(result).toStrictEqual(mockDeployment);
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/find`, {
        type: 'apps.deployment',
        id:   'test-deployment',
        opt:  {}
      });
    });
  });

  describe('list', () => {
    it('should successfully list resources by type', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'resource-1' } },
        { metadata: { name: 'resource-2' } },
        { metadata: { name: 'resource-3' } }
      ];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      const result = await resourcesApi.list('pod');

      // Assert
      expect(result).toStrictEqual(mockResources);
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findPage`, {
        type: 'pod',
        opt:  {}
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should pass empty options when none provided', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'resource-1' } }];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await resourcesApi.list('pod');

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findPage`, {
        type: 'pod',
        opt:  {}
      });
    });

    it('should throw error and log when dispatch fails', async() => {
      // Arrange
      const error = new Error('Network error');

      mockDispatch.mockRejectedValue(error);

      // Act & Assert
      await expect(resourcesApi.list('pod')).rejects.toThrow(
        `Resource API error - ${ storeType } - Failed to list resources pod: Network error`
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Resource API error - ${ storeType } - Failed to list resources pod: Network error`
      );
    });

    it('should handle empty results', async() => {
      // Arrange
      mockDispatch.mockResolvedValue([]);

      // Act
      const result = await resourcesApi.list('pod');

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('listAll', () => {
    it('should successfully fetch all resources by type', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'resource-1' } },
        { metadata: { name: 'resource-2' } },
        { metadata: { name: 'resource-3' } }
      ];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      const result = await resourcesApi.listAll('pod');

      // Assert
      expect(result).toStrictEqual(mockResources);
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findAll`, {
        type: 'pod',
        opt:  {}
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should pass incremental loading options correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'resource-1' } }];
      const options = {
        incremental: {
          quickLoadCount:        10,
          resourcesPerIncrement: 50,
          increments:            5,
          pageByNumber:          false
        }
      };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await resourcesApi.listAll('pod', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findAll`, {
        type: 'pod',
        opt:  options
      });
    });

    it('should pass empty options when none provided', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'resource-1' } },
        { metadata: { name: 'resource-2' } }
      ];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await resourcesApi.listAll('pod');

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findAll`, {
        type: 'pod',
        opt:  {}
      });
    });

    it('should pass namespaced filter correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'resource-1', namespace: 'default' } }];
      const options = { namespaced: ['default', 'kube-system'] };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await resourcesApi.listAll('pod', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findAll`, {
        type: 'pod',
        opt:  options
      });
    });

    it('should pass watch option correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'resource-1' } }];
      const options = { watch: true };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await resourcesApi.listAll('pod', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findAll`, {
        type: 'pod',
        opt:  options
      });
    });

    it('should pass limit option correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'resource-1' } }];
      const options = { limit: 100 };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await resourcesApi.listAll('pod', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findAll`, {
        type: 'pod',
        opt:  options
      });
    });

    it('should throw error and log when dispatch fails', async() => {
      // Arrange
      const error = new Error('Network error');

      mockDispatch.mockRejectedValue(error);

      // Act & Assert
      await expect(resourcesApi.listAll('pod')).rejects.toThrow(
        `Resource API error - ${ storeType } - Failed to list all resources pod: Network error`
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Resource API error - ${ storeType } - Failed to list all resources pod: Network error`
      );
    });

    it('should handle empty results', async() => {
      // Arrange
      mockDispatch.mockResolvedValue([]);

      // Act
      const result = await resourcesApi.listAll('pod');

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('labelSelector', () => {
    it('should successfully find resources by label selector', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'resource-1', labels: { app: 'nginx' } } },
        { metadata: { name: 'resource-2', labels: { app: 'nginx' } } }
      ];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      const result = await resourcesApi.labelSelector('pod', 'app=nginx');

      // Assert
      expect(result).toStrictEqual(mockResources);
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findLabelSelector`, {
        type:     'pod',
        selector: 'app=nginx',
        opt:      {}
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should pass empty options when none provided', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'resource-1' } }];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await resourcesApi.labelSelector('pod', 'app=nginx,env=prod');

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findLabelSelector`, {
        type:     'pod',
        selector: 'app=nginx,env=prod',
        opt:      {}
      });
    });

    it('should handle complex label selectors', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'resource-1' } }];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await resourcesApi.labelSelector('pod', 'app=nginx,env=prod,tier!=backend');

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findLabelSelector`, {
        type:     'pod',
        selector: 'app=nginx,env=prod,tier!=backend',
        opt:      {}
      });
    });

    it('should throw error and log when dispatch fails', async() => {
      // Arrange
      const error = new Error('Invalid selector');

      mockDispatch.mockRejectedValue(error);

      // Act & Assert
      await expect(resourcesApi.labelSelector('pod', 'app=nginx')).rejects.toThrow(
        `Resource API error - ${ storeType } - Failed to find resources with selector app=nginx: Invalid selector`
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Resource API error - ${ storeType } - Failed to find resources with selector app=nginx: Invalid selector`
      );
    });

    it('should handle empty selector results', async() => {
      // Arrange
      mockDispatch.mockResolvedValue([]);

      // Act
      const result = await resourcesApi.labelSelector('pod', 'app=nonexistent');

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });
});
