import {
  describe, it, expect, jest, beforeEach, afterEach
} from '@jest/globals';
import { ClusterApiImpl } from '../cluster';
import { Store } from 'vuex';

describe('clusterApiImpl', () => {
  let mockStore: Store<any>;
  let clusterApi: ClusterApiImpl;
  let mockDispatch: jest.Mock;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Mock console.error to avoid cluttering test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create mock store with dispatch
    mockDispatch = jest.fn() as any;
    mockStore = { dispatch: mockDispatch } as any;

    // Instantiate the API
    clusterApi = new ClusterApiImpl(mockStore);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('get', () => {
    it('should successfully get a resource by type and id', async() => {
      // Arrange
      const mockResource = {
        metadata: { name: 'test-pod', namespace: 'default' },
        spec:     { containers: [] }
      };

      mockDispatch.mockResolvedValue(mockResource);

      // Act
      const result = await clusterApi.get('pod', 'test-pod', { watch: true });

      // Assert
      expect(result).toStrictEqual(mockResource);
      expect(mockDispatch).toHaveBeenCalledWith('cluster/find', {
        type: 'pod',
        id:   'test-pod',
        opt:  { watch: true }
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should pass empty options object when no options provided', async() => {
      // Arrange
      const mockResource = { metadata: { name: 'test-pod' } };

      mockDispatch.mockResolvedValue(mockResource);

      // Act
      await clusterApi.get('pod', 'test-pod');

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('cluster/find', {
        type: 'pod',
        id:   'test-pod',
        opt:  {}
      });
    });

    it('should return null and log error when dispatch fails', async() => {
      // Arrange
      const error = new Error('Network error');

      mockDispatch.mockRejectedValue(error);

      // Act
      const result = await clusterApi.get('pod', 'test-pod');

      // Assert
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get resource pod/test-pod:',
        error
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
      const result = await clusterApi.get('apps.deployment', 'test-deployment');

      // Assert
      expect(result).toStrictEqual(mockDeployment);
      expect(mockDispatch).toHaveBeenCalledWith('cluster/find', {
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
        { metadata: { name: 'pod-1' } },
        { metadata: { name: 'pod-2' } },
        { metadata: { name: 'pod-3' } }
      ];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      const result = await clusterApi.list('pod');

      // Assert
      expect(result).toStrictEqual(mockResources);
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findPage', {
        type: 'pod',
        opt:  {}
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should pass pagination options correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'pod-1' } }];
      const options = {
        pagination: {
          page:     1,
          pageSize: 10
        },
        watch: true
      };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await clusterApi.list('pod', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findPage', {
        type: 'pod',
        opt:  options
      });
    });

    it('should return empty array and log error when dispatch fails', async() => {
      // Arrange
      const error = new Error('Network error');

      mockDispatch.mockRejectedValue(error);

      // Act
      const result = await clusterApi.list('pod');

      // Assert
      expect(result).toStrictEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to list resources pod:',
        error
      );
    });

    it('should handle empty results', async() => {
      // Arrange
      mockDispatch.mockResolvedValue([]);

      // Act
      const result = await clusterApi.list('pod');

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('listAll', () => {
    it('should successfully fetch all resources by type', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'pod-1' } },
        { metadata: { name: 'pod-2' } },
        { metadata: { name: 'pod-3' } }
      ];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      const result = await clusterApi.listAll('pod');

      // Assert
      expect(result).toStrictEqual(mockResources);
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', {
        type: 'pod',
        opt:  {}
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should pass incremental loading options correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'pod-1' } }];
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
      await clusterApi.listAll('pod', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', {
        type: 'pod',
        opt:  options
      });
    });

    it('should pass depaginate option correctly', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'pod-1' } },
        { metadata: { name: 'pod-2' } }
      ];
      const options = { depaginate: true };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await clusterApi.listAll('pod', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', {
        type: 'pod',
        opt:  options
      });
    });

    it('should pass namespaced filter correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'pod-1', namespace: 'default' } }];
      const options = { namespaced: ['default', 'kube-system'] };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await clusterApi.listAll('pod', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', {
        type: 'pod',
        opt:  options
      });
    });

    it('should pass watch option correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'pod-1' } }];
      const options = { watch: true };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await clusterApi.listAll('pod', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', {
        type: 'pod',
        opt:  options
      });
    });

    it('should return empty array and log error when dispatch fails', async() => {
      // Arrange
      const error = new Error('Network error');

      mockDispatch.mockRejectedValue(error);

      // Act
      const result = await clusterApi.listAll('pod');

      // Assert
      expect(result).toStrictEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to list all resources pod:',
        error
      );
    });

    it('should handle empty results', async() => {
      // Arrange
      mockDispatch.mockResolvedValue([]);

      // Act
      const result = await clusterApi.listAll('pod');

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('labelSelector', () => {
    it('should successfully find resources by label selector', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'pod-1', labels: { app: 'nginx' } } },
        { metadata: { name: 'pod-2', labels: { app: 'nginx' } } }
      ];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      const result = await clusterApi.labelSelector('app=nginx');

      // Assert
      expect(result).toStrictEqual(mockResources);
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findLabelSelector', {
        selector: 'app=nginx',
        opt:      {}
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should pass options correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'pod-1' } }];
      const options = { depaginate: true, namespaced: 'default' };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await clusterApi.labelSelector('app=nginx,env=prod', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findLabelSelector', {
        selector: 'app=nginx,env=prod',
        opt:      options
      });
    });

    it('should handle complex label selectors', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'pod-1' } }];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await clusterApi.labelSelector('app=nginx,env=prod,tier!=backend');

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('cluster/findLabelSelector', {
        selector: 'app=nginx,env=prod,tier!=backend',
        opt:      {}
      });
    });

    it('should return empty array and log error when dispatch fails', async() => {
      // Arrange
      const error = new Error('Invalid selector');

      mockDispatch.mockRejectedValue(error);

      // Act
      const result = await clusterApi.labelSelector('app=nginx');

      // Assert
      expect(result).toStrictEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to find resources with selector app=nginx:',
        error
      );
    });

    it('should handle empty selector results', async() => {
      // Arrange
      mockDispatch.mockResolvedValue([]);

      // Act
      const result = await clusterApi.labelSelector('app=nonexistent');

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });
});
