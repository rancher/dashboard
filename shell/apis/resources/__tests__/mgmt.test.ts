import {
  describe, it, expect, jest, beforeEach, afterEach
} from '@jest/globals';
import { MgmtApiImpl } from '../mgmt';
import { Store } from 'vuex';

describe('mgmtApiImpl', () => {
  let mockStore: Store<any>;
  let mgmtApi: MgmtApiImpl;
  let mockDispatch: jest.Mock;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Mock console.error to avoid cluttering test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create mock store with dispatch
    mockDispatch = jest.fn() as any;
    mockStore = { dispatch: mockDispatch } as any;

    // Instantiate the API
    mgmtApi = new MgmtApiImpl(mockStore);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('get', () => {
    it('should successfully get a resource by type and id', async() => {
      // Arrange
      const mockResource = {
        metadata: { name: 'test-user' },
        username: 'admin'
      };

      mockDispatch.mockResolvedValue(mockResource);

      // Act
      const result = await mgmtApi.get('user', 'u-xyz123', { watch: true });

      // Assert
      expect(result).toStrictEqual(mockResource);
      expect(mockDispatch).toHaveBeenCalledWith('management/find', {
        type: 'user',
        id:   'u-xyz123',
        opt:  { watch: true }
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should pass empty options object when no options provided', async() => {
      // Arrange
      const mockResource = { metadata: { name: 'test-cluster' } };

      mockDispatch.mockResolvedValue(mockResource);

      // Act
      await mgmtApi.get('cluster', 'c-abc123');

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('management/find', {
        type: 'cluster',
        id:   'c-abc123',
        opt:  {}
      });
    });

    it('should return null and log error when dispatch fails', async() => {
      // Arrange
      const error = new Error('Network error');

      mockDispatch.mockRejectedValue(error);

      // Act
      const result = await mgmtApi.get('user', 'u-xyz123');

      // Assert
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get resource user/u-xyz123:',
        error
      );
    });

    it('should handle resources with different types correctly', async() => {
      // Arrange
      const mockCluster = {
        metadata: { name: 'test-cluster' },
        spec:     { displayName: 'Test Cluster' }
      };

      mockDispatch.mockResolvedValue(mockCluster);

      // Act
      const result = await mgmtApi.get('management.cattle.io.cluster', 'c-abc123');

      // Assert
      expect(result).toStrictEqual(mockCluster);
      expect(mockDispatch).toHaveBeenCalledWith('management/find', {
        type: 'management.cattle.io.cluster',
        id:   'c-abc123',
        opt:  {}
      });
    });
  });

  describe('list', () => {
    it('should successfully list resources by type', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'user-1' }, username: 'admin' },
        { metadata: { name: 'user-2' }, username: 'user1' },
        { metadata: { name: 'user-3' }, username: 'user2' }
      ];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      const result = await mgmtApi.list('user');

      // Assert
      expect(result).toStrictEqual(mockResources);
      expect(mockDispatch).toHaveBeenCalledWith('management/findPage', {
        type: 'user',
        opt:  {}
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should pass pagination options correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'cluster-1' } }];
      const options = {
        pagination: {
          page:     1,
          pageSize: 10
        },
        watch: true
      };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await mgmtApi.list('cluster', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('management/findPage', {
        type: 'cluster',
        opt:  options
      });
    });

    it('should return empty array and log error when dispatch fails', async() => {
      // Arrange
      const error = new Error('Network error');

      mockDispatch.mockRejectedValue(error);

      // Act
      const result = await mgmtApi.list('user');

      // Assert
      expect(result).toStrictEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to list resources user:',
        error
      );
    });

    it('should handle empty results', async() => {
      // Arrange
      mockDispatch.mockResolvedValue([]);

      // Act
      const result = await mgmtApi.list('user');

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('listAll', () => {
    it('should successfully fetch all resources by type', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'user-1' }, username: 'admin' },
        { metadata: { name: 'user-2' }, username: 'user1' },
        { metadata: { name: 'user-3' }, username: 'user2' }
      ];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      const result = await mgmtApi.listAll('user');

      // Assert
      expect(result).toStrictEqual(mockResources);
      expect(mockDispatch).toHaveBeenCalledWith('management/findAll', {
        type: 'user',
        opt:  {}
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should pass incremental loading options correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'cluster-1' } }];
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
      await mgmtApi.listAll('cluster', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('management/findAll', {
        type: 'cluster',
        opt:  options
      });
    });

    it('should pass depaginate option correctly', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'user-1' } },
        { metadata: { name: 'user-2' } }
      ];
      const options = { depaginate: true };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await mgmtApi.listAll('user', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('management/findAll', {
        type: 'user',
        opt:  options
      });
    });

    it('should pass namespaced filter correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'cluster-1' } }];
      const options = { namespaced: ['default', 'kube-system'] };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await mgmtApi.listAll('cluster', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('management/findAll', {
        type: 'cluster',
        opt:  options
      });
    });

    it('should pass watch option correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'user-1' } }];
      const options = { watch: true };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await mgmtApi.listAll('user', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('management/findAll', {
        type: 'user',
        opt:  options
      });
    });

    it('should pass limit option correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'user-1' } }];
      const options = { limit: 100 };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await mgmtApi.listAll('user', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('management/findAll', {
        type: 'user',
        opt:  options
      });
    });

    it('should return empty array and log error when dispatch fails', async() => {
      // Arrange
      const error = new Error('Network error');

      mockDispatch.mockRejectedValue(error);

      // Act
      const result = await mgmtApi.listAll('user');

      // Assert
      expect(result).toStrictEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to list all resources user:',
        error
      );
    });

    it('should handle empty results', async() => {
      // Arrange
      mockDispatch.mockResolvedValue([]);

      // Act
      const result = await mgmtApi.listAll('cluster');

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('labelSelector', () => {
    it('should successfully find resources by label selector', async() => {
      // Arrange
      const mockResources = [
        { metadata: { name: 'cluster-1', labels: { status: 'active' } } },
        { metadata: { name: 'cluster-2', labels: { status: 'active' } } }
      ];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      const result = await mgmtApi.labelSelector('status=active');

      // Assert
      expect(result).toStrictEqual(mockResources);
      expect(mockDispatch).toHaveBeenCalledWith('management/findLabelSelector', {
        selector: 'status=active',
        opt:      {}
      });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('should pass options correctly', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'cluster-1' } }];
      const options = { depaginate: true, namespaced: 'default' };

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await mgmtApi.labelSelector('env=prod,tier=frontend', options);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('management/findLabelSelector', {
        selector: 'env=prod,tier=frontend',
        opt:      options
      });
    });

    it('should handle complex label selectors', async() => {
      // Arrange
      const mockResources = [{ metadata: { name: 'cluster-1' } }];

      mockDispatch.mockResolvedValue(mockResources);

      // Act
      await mgmtApi.labelSelector('status=active,region=us-west,tier!=test');

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith('management/findLabelSelector', {
        selector: 'status=active,region=us-west,tier!=test',
        opt:      {}
      });
    });

    it('should return empty array and log error when dispatch fails', async() => {
      // Arrange
      const error = new Error('Invalid selector');

      mockDispatch.mockRejectedValue(error);

      // Act
      const result = await mgmtApi.labelSelector('status=active');

      // Assert
      expect(result).toStrictEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to find resources with selector status=active:',
        error
      );
    });

    it('should handle empty selector results', async() => {
      // Arrange
      mockDispatch.mockResolvedValue([]);

      // Act
      const result = await mgmtApi.labelSelector('status=nonexistent');

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });
});
