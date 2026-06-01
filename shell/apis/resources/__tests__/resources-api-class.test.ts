import {
  describe, it, expect, jest, beforeEach, afterEach
} from '@jest/globals';
import { ResourcesApiClassImpl } from '../resources-api-class';
import { Store } from 'vuex';

describe.each(['cluster', 'management'] as const)('resourcesApiClassImpl with storeType: %s', (storeType) => {
  let mockStore: Store<any>;
  let resourcesApi: ResourcesApiClassImpl;
  let mockDispatch: jest.Mock;
  let mockSchemaFor: jest.Mock;
  let mockPaginationEnabled: jest.Mock;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockDispatch = jest.fn() as any;
    mockSchemaFor = jest.fn() as any;
    mockPaginationEnabled = jest.fn() as any;

    mockStore = {
      dispatch: mockDispatch,
      getters:  {
        [`${ storeType }/schemaFor`]:         mockSchemaFor,
        [`${ storeType }/paginationEnabled`]: mockPaginationEnabled
      }
    } as any;

    resourcesApi = new ResourcesApiClassImpl(mockStore, storeType);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('find', () => {
    it('should successfully find a namespaced resource with namespace/name id', async() => {
      // Arrange
      const mockResource = {
        metadata: { name: 'test-resource', namespace: 'default' },
        spec:     { data: 'value' }
      };

      mockSchemaFor.mockReturnValue({ attributes: { namespaced: true } });
      mockDispatch.mockResolvedValue(mockResource);

      // Act
      const result = await resourcesApi.find('pod', 'default/test-pod', { watch: true });

      // Assert
      expect(result).toStrictEqual(mockResource);
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/find`, {
        type: 'pod',
        id:   'default/test-pod',
        opt:  { watch: true }
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should successfully find a cluster-scoped resource with plain id', async() => {
      // Arrange
      const mockResource = {
        metadata: { name: 'worker-1' },
        status:   { conditions: [] }
      };

      mockSchemaFor.mockReturnValue({ attributes: { namespaced: false } });
      mockDispatch.mockResolvedValue(mockResource);

      // Act
      const result = await resourcesApi.find('node', 'worker-1');

      // Assert
      expect(result).toStrictEqual(mockResource);
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/find`, {
        type: 'node',
        id:   'worker-1',
        opt:  {}
      });
    });

    it('should throw error when namespaced resource id does not contain namespace', async() => {
      // Arrange
      mockSchemaFor.mockReturnValue({ attributes: { namespaced: true } });

      // Act & Assert
      await expect(resourcesApi.find('pod', 'test-pod')).rejects.toThrow(
        `Resource API error - ${ storeType } - Resource "pod" is namespaced. The resourceId must be in "namespace/name" format, but received "test-pod"`
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Resource API error - ${ storeType } - Resource "pod" is namespaced. The resourceId must be in "namespace/name" format, but received "test-pod"`
      );
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not validate namespace when schema is not found', async() => {
      // Arrange
      const mockResource = { metadata: { name: 'custom-resource' } };

      mockSchemaFor.mockReturnValue(null);
      mockDispatch.mockResolvedValue(mockResource);

      // Act
      const result = await resourcesApi.find('custom.crd', 'my-resource');

      // Assert
      expect(result).toStrictEqual(mockResource);
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/find`, {
        type: 'custom.crd',
        id:   'my-resource',
        opt:  {}
      });
    });

    it('should throw error and log when dispatch fails', async() => {
      // Arrange
      const error = new Error('Network error');

      mockSchemaFor.mockReturnValue({ attributes: { namespaced: true } });
      mockDispatch.mockRejectedValue(error);

      // Act & Assert
      await expect(resourcesApi.find('pod', 'default/test-pod')).rejects.toThrow(
        `Resource API error - ${ storeType } - Failed to find resource pod/default/test-pod: Network error`
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Resource API error - ${ storeType } - Failed to find resource pod/default/test-pod: Network error`
      );
    });

    it('should return null when dispatch returns undefined', async() => {
      // Arrange
      mockSchemaFor.mockReturnValue({ attributes: { namespaced: true } });
      mockDispatch.mockResolvedValue(undefined);

      // Act
      const result = await resourcesApi.find('pod', 'default/nonexistent-pod');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle resources with different types correctly', async() => {
      // Arrange
      const mockDeployment = {
        metadata: { name: 'test-deployment', namespace: 'kube-system' },
        spec:     { replicas: 3 }
      };

      mockSchemaFor.mockReturnValue({ attributes: { namespaced: true } });
      mockDispatch.mockResolvedValue(mockDeployment);

      // Act
      const result = await resourcesApi.find('apps.deployment', 'kube-system/test-deployment');

      // Assert
      expect(result).toStrictEqual(mockDeployment);
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/find`, {
        type: 'apps.deployment',
        id:   'kube-system/test-deployment',
        opt:  {}
      });
    });
  });

  describe('findFiltered', () => {
    it('should find resources with a label selector', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'resource-1', labels: { app: 'nginx' } } },
        { metadata: { name: 'resource-2', labels: { app: 'nginx' } } }
      ];
      const labelSelector = { matchLabels: { app: 'nginx' } };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      const result = await resourcesApi.findFiltered('pod', { labelSelector });

      // Assert
      expect(result).toStrictEqual(mockResources);
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findLabelSelector`, {
        type:     'pod',
        matching: {
          namespace: undefined,
          labelSelector
        },
        opt: {}
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should pass namespace to matching when namespaced is provided', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'resource-1' } }];
      const labelSelector = { matchLabels: { app: 'nginx' } };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await resourcesApi.findFiltered('pod', { labelSelector, namespaced: 'default' });

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findLabelSelector`, {
        type:     'pod',
        matching: {
          namespace: 'default',
          labelSelector
        },
        opt: {}
      });
    });

    it('should pass additional options through to opt', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'resource-1' } }];
      const labelSelector = { matchLabels: { tier: 'frontend' } };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await resourcesApi.findFiltered('pod', { labelSelector, force: true });

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findLabelSelector`, {
        type:     'pod',
        matching: {
          namespace: undefined,
          labelSelector
        },
        opt: { force: true }
      });
    });

    it('should handle matchExpressions in label selector', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'resource-1' } }];
      const labelSelector = {
        matchLabels:      { app: 'nginx' },
        matchExpressions: [{
          key: 'env', operator: 'In' as const, values: ['prod', 'staging']
        }]
      };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await resourcesApi.findFiltered('pod', { labelSelector, namespaced: 'kube-system' });

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findLabelSelector`, {
        type:     'pod',
        matching: {
          namespace: 'kube-system',
          labelSelector
        },
        opt: {}
      });
    });

    it('should throw error and log when dispatch fails', async() => {
      // Arrange
      const error = new Error('Network error');
      const labelSelector = { matchLabels: { app: 'nginx' } };

      mockDispatch.mockRejectedValue(error);

      // Act & Assert
      await expect(resourcesApi.findFiltered('pod', { labelSelector })).rejects.toThrow(
        `Resource API error - ${ storeType } - Failed to find filtered resources pod: Network error`
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Resource API error - ${ storeType } - Failed to find filtered resources pod: Network error`
      );
    });

    it('should handle empty results', async() => {
      // Arrange
      const labelSelector = { matchLabels: { app: 'nonexistent' } };

      mockDispatch.mockResolvedValue([]);

      // Act
      const result = await resourcesApi.findFiltered('pod', { labelSelector });

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should return transient response from label selector mode', async() => {
      // Arrange
      const transientResponse = { data: [{ metadata: { name: 'pod-1' } }] };
      const labelSelector = { matchLabels: { app: 'nginx' } };

      mockDispatch.mockResolvedValue(transientResponse);

      // Act
      const result = await resourcesApi.findFiltered('pod', {
        labelSelector,
        force: true
      } as any);

      // Assert
      expect(result).toStrictEqual(transientResponse);
      expect(result).toHaveProperty('data');
    });

    it('should find resources with pagination options when enabled', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'pod-1', labels: { app: 'nginx' } } },
        { metadata: { name: 'pod-2', labels: { app: 'nginx' } } }
      ];
      const paginationOptions = {
        pagination: {
          page:     1,
          pageSize: 10,
          sort:     []
        }
      };

      mockPaginationEnabled.mockReturnValue(true);
      mockDispatch.mockResolvedValue(mockResources);

      // Act
      const result = await resourcesApi.findFiltered('pod', paginationOptions as any);

      // Assert
      expect(result).toStrictEqual(mockResources);
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findPage`, {
        type: 'pod',
        opt:  paginationOptions
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockPaginationEnabled).toHaveBeenCalledWith('pod');
    });

    it('should return transient response from pagination mode', async() => {
      // Arrange
      const transientResponse = {
        data:       [{ metadata: { name: 'pod-1' } }],
        pagination: {
          page: 1, pageSize: 10, total: 50
        }
      };
      const paginationOptions = {
        pagination: {
          page:     1,
          pageSize: 10,
          sort:     []
        },
        transient: true
      };

      mockPaginationEnabled.mockReturnValue(true);
      mockDispatch.mockResolvedValue(transientResponse);

      // Act
      const result = await resourcesApi.findFiltered('pod', paginationOptions as any);

      // Assert
      expect(result).toStrictEqual(transientResponse);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
    });

    it('should throw error when pagination is not enabled', async() => {
      // Arrange
      const paginationOptions = {
        pagination: {
          page: 1,
          sort: []
        }
      };

      mockPaginationEnabled.mockReturnValue(false);

      // Act & Assert
      await expect(resourcesApi.findFiltered('pod', paginationOptions as any)).rejects.toThrow(
        `Resource API error - ${ storeType } - findFiltered requests with FindFilteredPageOptions are only supported when ui-sql-cache is enabled`
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Resource API error - ${ storeType } - findFiltered requests with FindFilteredPageOptions are only supported when ui-sql-cache is enabled`
      );
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should throw error when options are neither pagination nor labelSelector', async() => {
      // Arrange
      const invalidOptions = { someUnknownProp: 'value' } as any;

      // Act & Assert
      await expect(resourcesApi.findFiltered('pod', invalidOptions)).rejects.toThrow(
        /findFiltered request was made with unknown options/
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('findFiltered request was made with unknown options')
      );
    });

    it('should pass pagination options with additional properties', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'pod-1' } }];
      const paginationOptions = {
        pagination: {
          page:    1,
          sort:    [],
          filters: []
        },
        watch: true,
        force: true
      };

      mockPaginationEnabled.mockReturnValue(true);
      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await resourcesApi.findFiltered('pod', paginationOptions as any);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findPage`, {
        type: 'pod',
        opt:  paginationOptions
      });
    });
  });

  describe('findAll', () => {
    it('should successfully fetch all resources by type', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'resource-1' } },
        { metadata: { name: 'resource-2' } },
        { metadata: { name: 'resource-3' } }
      ];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      const result = await resourcesApi.findAll('pod');

      // Assert
      expect(result).toStrictEqual(mockResources);
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/findAll`, {
        type: 'pod',
        opt:  {}
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should pass empty options when none provided', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'resource-1' } },
        { metadata: { name: 'resource-2' } }
      ];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await resourcesApi.findAll('pod');

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
      await resourcesApi.findAll('pod', options);

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
      await resourcesApi.findAll('pod', options);

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
      await resourcesApi.findAll('pod', options);

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
      await expect(resourcesApi.findAll('pod')).rejects.toThrow(
        `Resource API error - ${ storeType } - Failed to find all resources pod: Network error`
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Resource API error - ${ storeType } - Failed to find all resources pod: Network error`
      );
    });

    it('should handle empty results', async() => {
      // Arrange
      mockDispatch.mockResolvedValue([]);

      // Act
      const result = await resourcesApi.findAll('pod');

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });
});
