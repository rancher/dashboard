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
  let mockUrlFor: jest.Mock;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockDispatch = jest.fn() as any;
    mockSchemaFor = jest.fn() as any;
    mockPaginationEnabled = jest.fn() as any;
    mockUrlFor = jest.fn() as any;
    mockUrlFor.mockImplementation((type: string, id: string) => {
      const schema = mockSchemaFor(type);

      if (!schema) {
        throw new Error(`No schema found for type "${ type }"`);
      }

      return id ? `${ schema.linkFor() }/${ id }` : schema.linkFor();
    });

    mockStore = {
      dispatch: mockDispatch,
      getters:  {
        [`${ storeType }/schemaFor`]:         mockSchemaFor,
        [`${ storeType }/paginationEnabled`]: mockPaginationEnabled,
        [`${ storeType }/urlFor`]:            mockUrlFor
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
      expect(result).toMatchObject(mockResource);
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
      expect(result).toMatchObject(mockResource);
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
        `Resource API error - ${ storeType } - Resource "pod" is namespaced. The resourceId must be in "namespace/name" format, but received "test-pod"`,
        undefined
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
      expect(result).toMatchObject(mockResource);
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
        `Resource API error - ${ storeType } - Failed to find resource pod/default/test-pod: Network error`,
        expect.any(Error)
      );
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
      expect(result).toMatchObject(mockDeployment);
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
      expect(result).toHaveLength(2);
      expect((result as any[])[0]).toMatchObject(mockResources[0]);
      expect((result as any[])[1]).toMatchObject(mockResources[1]);
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
        `Resource API error - ${ storeType } - Failed to find filtered resources pod: Network error`,
        expect.any(Error)
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
      expect(result).toHaveProperty('data');
      expect((result as any).data).toHaveLength(1);
      expect((result as any).data[0]).toMatchObject({ metadata: { name: 'pod-1' } });
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
      expect(result).toHaveLength(2);
      expect((result as any[])[0]).toMatchObject(mockResources[0]);
      expect((result as any[])[1]).toMatchObject(mockResources[1]);
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
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect((result as any).data).toHaveLength(1);
      expect((result as any).data[0]).toMatchObject({ metadata: { name: 'pod-1' } });
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
        `Resource API error - ${ storeType } - findFiltered requests with FindFilteredPageOptions are only supported when resourceType is enabled with server-side pagination`
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Resource API error - ${ storeType } - findFiltered requests with FindFilteredPageOptions are only supported when resourceType is enabled with server-side pagination`,
        undefined
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
        expect.stringContaining('findFiltered request was made with unknown options'),
        undefined
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
      expect(result).toHaveLength(3);
      expect((result as any[])[0]).toMatchObject(mockResources[0]);
      expect((result as any[])[1]).toMatchObject(mockResources[1]);
      expect((result as any[])[2]).toMatchObject(mockResources[2]);
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
        `Resource API error - ${ storeType } - Failed to find all resources pod: Network error`,
        expect.any(Error)
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

  describe('create', () => {
    it('should send a POST request with the resource data', async() => {
      // Arrange
      const inputData = {
        type:     'configmap',
        metadata: { name: 'my-config', namespace: 'default' },
      };
      const mockResponse = {
        type:     'configmap',
        metadata: { name: 'my-config', namespace: 'default' },
      };

      mockSchemaFor.mockReturnValue({
        attributes: { namespaced: true },
        linkFor:    () => 'https://rancher/v1/configmaps'
      });
      mockDispatch.mockResolvedValue(mockResponse);

      // Act
      const result = await resourcesApi.create(inputData);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/request`, {
        opt: {
          url:     'https://rancher/v1/configmaps',
          method:  'POST',
          headers: { 'content-type': 'application/json' },
          data:    inputData,
        }
      });
      expect(result).toStrictEqual(mockResponse);
    });

    it('should throw when data.type is missing', async() => {
      // Act & Assert
      await expect(resourcesApi.create({} as any)).rejects.toThrow(
        `Resource API error - ${ storeType } - Resource data must include a "type" property`
      );
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should throw error and log when request fails', async() => {
      // Arrange
      mockSchemaFor.mockReturnValue({
        attributes: { namespaced: false },
        linkFor:    () => 'https://rancher/v1/configmaps'
      });
      mockDispatch.mockRejectedValue(new Error('Request failed'));

      // Act & Assert
      await expect(resourcesApi.create({ type: 'configmap' })).rejects.toThrow(
        `Resource API error - ${ storeType } - Failed to create resource of type "configmap": Request failed`
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Resource API error - ${ storeType } - Failed to create resource of type "configmap": Request failed`,
        expect.any(Error)
      );
    });
  });

  describe('update', () => {
    it('should send a PATCH request with strategic-merge-patch content type', async() => {
      // Arrange
      const mockResponse = { metadata: { name: 'my-config' }, data: { key: 'patched' } };

      mockSchemaFor.mockReturnValue({
        attributes: { namespaced: true },
        linkFor:    () => 'https://rancher/v1/configmaps'
      });
      mockDispatch.mockResolvedValue(mockResponse);

      // Act
      const result = await resourcesApi.update('configmap', 'default/my-config', { data: { key: 'patched' } });

      // Assert
      expect(result).toStrictEqual(mockResponse);
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/request`, {
        opt: {
          url:     'https://rancher/v1/configmaps/default/my-config',
          method:  'patch',
          headers: { 'content-type': 'application/strategic-merge-patch+json' },
          data:    { data: { key: 'patched' } },
        }
      });
    });

    it('should throw error for namespaced resource without namespace in id', async() => {
      // Arrange
      mockSchemaFor.mockReturnValue({ attributes: { namespaced: true } });

      // Act & Assert
      await expect(resourcesApi.update('configmap', 'my-config', {})).rejects.toThrow(
        `Resource API error - ${ storeType } - Resource "configmap" is namespaced. The resourceId must be in "namespace/name" format, but received "my-config"`
      );
    });

    it('should throw error when no schema is found', async() => {
      // Arrange
      mockSchemaFor.mockReturnValue(null);

      // Act & Assert
      await expect(resourcesApi.update('configmap', 'default/my-config', {})).rejects.toThrow(
        'No schema found for type "configmap"'
      );
    });

    it('should throw error and log when request fails', async() => {
      // Arrange
      mockSchemaFor.mockReturnValue({
        attributes: { namespaced: false },
        linkFor:    () => 'https://rancher/v1/nodes'
      });
      mockDispatch.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(resourcesApi.update('node', 'worker-1', {})).rejects.toThrow(
        `Resource API error - ${ storeType } - Failed to update resource node/worker-1: Network error`
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Resource API error - ${ storeType } - Failed to update resource node/worker-1: Network error`,
        expect.any(Error)
      );
    });
  });

  describe('replace', () => {
    it('should send a PUT request with cleanForSave applied', async() => {
      // Arrange
      const inputData = {
        type:     'configmap',
        metadata: { name: 'my-config', namespace: 'default' },
        data:     { key: 'value' },
      };
      const cleanedData = { ...inputData };
      const mockModel = { cleanForSave: jest.fn<any, any[]>().mockReturnValue(cleanedData) };
      const mockResponse = { ...inputData, metadata: { ...inputData.metadata, resourceVersion: '2' } };

      mockSchemaFor.mockReturnValue({
        attributes: { namespaced: true },
        linkFor:    () => 'https://rancher/v1/configmaps'
      });
      // First dispatch: create (returns model), second dispatch: request (returns response)
      mockDispatch
        .mockResolvedValueOnce(mockModel)
        .mockResolvedValueOnce(mockResponse);

      // Act
      const result = await resourcesApi.replace('configmap', 'default/my-config', inputData);

      // Assert
      expect(result).toStrictEqual(mockResponse);
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/create`, inputData);
      expect(mockModel.cleanForSave).toHaveBeenCalledWith({ ...inputData });
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/request`, {
        opt: {
          url:     'https://rancher/v1/configmaps/default/my-config',
          method:  'put',
          headers: { 'content-type': 'application/json' },
          data:    cleanedData,
        }
      });
    });

    it('should throw error for namespaced resource without namespace in id', async() => {
      // Arrange
      mockSchemaFor.mockReturnValue({ attributes: { namespaced: true } });

      // Act & Assert
      await expect(resourcesApi.replace('configmap', 'my-config', {})).rejects.toThrow(
        `Resource API error - ${ storeType } - Resource "configmap" is namespaced. The resourceId must be in "namespace/name" format, but received "my-config"`
      );
    });

    it('should throw error and log when request fails', async() => {
      // Arrange
      const mockModel = { cleanForSave: jest.fn<any, any[]>().mockReturnValue({}) };

      mockSchemaFor.mockReturnValue({
        attributes: { namespaced: false },
        linkFor:    () => 'https://rancher/v1/nodes'
      });
      mockDispatch
        .mockResolvedValueOnce(mockModel)
        .mockRejectedValueOnce(new Error('Conflict'));

      // Act & Assert
      await expect(resourcesApi.replace('node', 'worker-1', {})).rejects.toThrow(
        `Resource API error - ${ storeType } - Failed to update resource node/worker-1: Conflict`
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Resource API error - ${ storeType } - Failed to update resource node/worker-1: Conflict`,
        expect.any(Error)
      );
    });
  });

  describe('delete', () => {
    it('should send a DELETE request with the correct URL', async() => {
      // Arrange
      mockSchemaFor.mockReturnValue({
        attributes: { namespaced: true },
        linkFor:    () => 'https://rancher/v1/configmaps'
      });
      mockDispatch.mockResolvedValue(undefined);

      // Act
      await resourcesApi.delete('configmap', 'default/my-config');

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/request`, {
        opt: {
          url:    'https://rancher/v1/configmaps/default/my-config',
          method: 'delete',
        }
      });
    });

    it('should work with cluster-scoped resources', async() => {
      // Arrange
      mockSchemaFor.mockReturnValue({
        attributes: { namespaced: false },
        linkFor:    () => 'https://rancher/v1/nodes'
      });
      mockDispatch.mockResolvedValue(undefined);

      // Act
      await resourcesApi.delete('node', 'worker-1');

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(`${ storeType }/request`, {
        opt: {
          url:    'https://rancher/v1/nodes/worker-1',
          method: 'delete',
        }
      });
    });

    it('should throw error for namespaced resource without namespace in id', async() => {
      // Arrange
      mockSchemaFor.mockReturnValue({ attributes: { namespaced: true } });

      // Act & Assert
      await expect(resourcesApi.delete('configmap', 'my-config')).rejects.toThrow(
        `Resource API error - ${ storeType } - Resource "configmap" is namespaced. The resourceId must be in "namespace/name" format, but received "my-config"`
      );
    });

    it('should throw error and log when request fails', async() => {
      // Arrange
      mockSchemaFor.mockReturnValue({
        attributes: { namespaced: false },
        linkFor:    () => 'https://rancher/v1/nodes'
      });
      mockDispatch.mockRejectedValue(new Error('Not Found'));

      // Act & Assert
      await expect(resourcesApi.delete('node', 'worker-1')).rejects.toThrow(
        `Resource API error - ${ storeType } - Failed to delete resource node/worker-1: Not Found`
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Resource API error - ${ storeType } - Failed to delete resource node/worker-1: Not Found`,
        expect.any(Error)
      );
    });
  });
});
