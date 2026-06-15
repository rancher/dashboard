import Kubeconfig from '@shell/models/ext.cattle.io.kubeconfig';
import { MANAGEMENT } from '@shell/config/types';

// SteveModel is JS, so we need to type the constructor
const KubeconfigModel = Kubeconfig as unknown as new (data: object) => Kubeconfig;

describe('class Kubeconfig', () => {
  const mockT = jest.fn((key: string, opts?: { name: string }) => {
    if (key === '"ext.cattle.io.kubeconfig".deleted') {
      return `${ opts?.name } (deleted)`;
    }

    return key;
  });

  const createKubeconfig = (data: object, rootGetters: object = {}) => {
    const kubeconfig = new KubeconfigModel(data);

    // Mock $rootGetters before any getters are accessed
    // Cast to any since $rootGetters is inherited from JS SteveModel
    jest.spyOn(kubeconfig as any, '$rootGetters', 'get').mockReturnValue({
      'i18n/t':          mockT,
      'management/all':  () => [],
      'management/byId': () => null,
      ...rootGetters
    });

    return kubeconfig;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('expiresAt', () => {
    it('should return null when ttl is not set', () => {
      const kubeconfig = createKubeconfig({
        metadata: { creationTimestamp: '2024-01-01T00:00:00Z' },
        spec:     {}
      });

      expect(kubeconfig.expiresAt).toBeNull();
    });

    it('should return null when creationTimestamp is not set', () => {
      const kubeconfig = createKubeconfig({
        metadata: {},
        spec:     { ttl: 3600 }
      });

      expect(kubeconfig.expiresAt).toBeNull();
    });

    it('should calculate expiry correctly', () => {
      const kubeconfig = createKubeconfig({
        metadata: { creationTimestamp: '2024-01-01T00:00:00Z' },
        spec:     { ttl: 3600 } // 1 hour in seconds
      });

      expect(kubeconfig.expiresAt).toBe('2024-01-01T01:00:00.000Z');
    });

    it('should handle large ttl values', () => {
      const kubeconfig = createKubeconfig({
        metadata: { creationTimestamp: '2024-01-01T00:00:00Z' },
        spec:     { ttl: 86400 } // 24 hours in seconds
      });

      expect(kubeconfig.expiresAt).toBe('2024-01-02T00:00:00.000Z');
    });
  });

  describe('referencedClusters', () => {
    const mockProvCluster = { detailLocation: { name: 'c-cluster-product-resource-id', params: { cluster: 'my-cluster' } } };

    const mockMgmtClusterWithProv = {
      id:          'c-m-abc123',
      nameDisplay: 'my-cluster',
      provCluster: mockProvCluster
    };

    const mockMgmtCluster = {
      id:             'c-m-def456',
      nameDisplay:    'mgmt-cluster',
      detailLocation: { name: 'c-cluster-product-resource-id', params: { cluster: 'mgmt-cluster' } }
    };

    it('should return empty array when no clusters are specified', () => {
      const kubeconfig = createKubeconfig({
        metadata: {},
        spec:     {}
      });

      expect(kubeconfig.referencedClusters).toStrictEqual([]);
    });

    it('should map provisioning cluster by mgmt id', () => {
      const kubeconfig = createKubeconfig(
        {
          metadata: {},
          spec:     { clusters: ['c-m-abc123'] }
        },
        {
          'management/byId': (type: string, id: string) => {
            if (type === MANAGEMENT.CLUSTER && id === 'c-m-abc123') {
              return mockMgmtClusterWithProv;
            }

            return null;
          }
        }
      );

      expect(kubeconfig.referencedClusters).toStrictEqual([
        {
          label:    'my-cluster',
          location: mockProvCluster.detailLocation
        }
      ]);
    });

    it('should map management cluster when no provisioning cluster found', () => {
      const kubeconfig = createKubeconfig(
        {
          metadata: {},
          spec:     { clusters: ['c-m-def456'] }
        },
        {
          'management/byId': (type: string, id: string) => {
            if (type === MANAGEMENT.CLUSTER && id === 'c-m-def456') {
              return mockMgmtCluster;
            }

            return null;
          }
        }
      );

      expect(kubeconfig.referencedClusters).toStrictEqual([
        {
          label:    'mgmt-cluster',
          location: mockMgmtCluster.detailLocation
        }
      ]);
    });

    it('should return deleted label when cluster not found', () => {
      const kubeconfig = createKubeconfig({
        metadata: {},
        spec:     { clusters: ['c-m-deleted'] }
      });

      expect(kubeconfig.referencedClusters).toStrictEqual([
        {
          label:    'c-m-deleted (deleted)',
          location: null
        }
      ]);
      expect(mockT).toHaveBeenCalledWith('"ext.cattle.io.kubeconfig".deleted', { name: 'c-m-deleted' });
    });

    it('should prefer provisioning cluster over management cluster for location', () => {
      const mgmtClusterBothLocs = {
        id:             'c-m-abc123',
        nameDisplay:    'my-cluster',
        detailLocation: { name: 'mgmt-location' },
        provCluster:    { detailLocation: { name: 'prov-location' } }
      };

      const kubeconfig = createKubeconfig(
        {
          metadata: {},
          spec:     { clusters: ['c-m-abc123'] }
        },
        {
          'management/byId': (type: string, id: string) => {
            if (type === MANAGEMENT.CLUSTER && id === 'c-m-abc123') {
              return mgmtClusterBothLocs;
            }

            return null;
          }
        }
      );

      expect(kubeconfig.referencedClusters).toStrictEqual([
        {
          label:    'my-cluster',
          location: { name: 'prov-location' }
        }
      ]);
    });
  });

  describe('sortedReferencedClusters', () => {
    it('should sort existing clusters before deleted clusters', () => {
      const existingCluster = {
        id:             'c-m-exists',
        nameDisplay:    'existing-cluster',
        detailLocation: { name: 'location' }
      };

      const kubeconfig = createKubeconfig(
        {
          metadata: {},
          spec:     { clusters: ['deleted-1', 'c-m-exists', 'deleted-2'] }
        },
        {
          'management/byId': (type: string, id: string) => {
            if (type === MANAGEMENT.CLUSTER && id === 'c-m-exists') {
              return existingCluster;
            }

            return null;
          }
        }
      );

      const sorted = kubeconfig.sortedReferencedClusters;

      expect(sorted[0].label).toBe('existing-cluster');
      expect(sorted[0].location).not.toBeNull();
      expect(sorted[1].location).toBeNull();
      expect(sorted[2].location).toBeNull();
    });

    it('should sort existing clusters alphabetically', () => {
      const clusters: Record<string, any> = {
        'c-m-zebra': {
          id: 'c-m-zebra', nameDisplay: 'zebra', detailLocation: { name: 'z' }
        },
        'c-m-alpha': {
          id: 'c-m-alpha', nameDisplay: 'alpha', detailLocation: { name: 'a' }
        },
        'c-m-beta': {
          id: 'c-m-beta', nameDisplay: 'beta', detailLocation: { name: 'b' }
        }
      };

      const kubeconfig = createKubeconfig(
        {
          metadata: {},
          spec:     { clusters: ['c-m-zebra', 'c-m-alpha', 'c-m-beta'] }
        },
        {
          'management/byId': (type: string, id: string) => {
            if (type === MANAGEMENT.CLUSTER) {
              return clusters[id] || null;
            }

            return null;
          }
        }
      );

      const sorted = kubeconfig.sortedReferencedClusters;

      expect(sorted.map((c) => c.label)).toStrictEqual(['alpha', 'beta', 'zebra']);
    });

    it('should sort numerically when names contain numbers', () => {
      const clusters: Record<string, any> = {
        'c-m-2': {
          id: 'c-m-2', nameDisplay: 'cluster2', detailLocation: { name: 'c2' }
        },
        'c-m-10': {
          id: 'c-m-10', nameDisplay: 'cluster10', detailLocation: { name: 'c10' }
        },
        'c-m-1': {
          id: 'c-m-1', nameDisplay: 'cluster1', detailLocation: { name: 'c1' }
        }
      };

      const kubeconfig = createKubeconfig(
        {
          metadata: {},
          spec:     { clusters: ['c-m-2', 'c-m-10', 'c-m-1'] }
        },
        {
          'management/byId': (type: string, id: string) => {
            if (type === MANAGEMENT.CLUSTER) {
              return clusters[id] || null;
            }

            return null;
          }
        }
      );

      const sorted = kubeconfig.sortedReferencedClusters;

      expect(sorted.map((c) => c.label)).toStrictEqual(['cluster1', 'cluster2', 'cluster10']);
    });
  });

  describe('referencedClustersSortable', () => {
    it('should return comma-separated lowercase labels', () => {
      const clusters: Record<string, any> = {
        'c-m-1': {
          id: 'c-m-1', nameDisplay: 'Alpha', detailLocation: { name: 'a' }
        },
        'c-m-2': {
          id: 'c-m-2', nameDisplay: 'Beta', detailLocation: { name: 'b' }
        }
      };

      const kubeconfig = createKubeconfig(
        {
          metadata: {},
          spec:     { clusters: ['c-m-1', 'c-m-2'] }
        },
        {
          'management/byId': (type: string, id: string) => {
            if (type === MANAGEMENT.CLUSTER) {
              return clusters[id] || null;
            }

            return null;
          }
        }
      );

      expect(kubeconfig.referencedClustersSortable).toBe('alpha,beta');
    });

    it('should return empty string when no clusters', () => {
      const kubeconfig = createKubeconfig({
        metadata: {},
        spec:     {}
      });

      expect(kubeconfig.referencedClustersSortable).toBe('');
    });
  });

  describe('_availableActions', () => {
    it('should filter out goToEdit, goToEditYaml, cloneYaml, and download actions', () => {
      const kubeconfig = createKubeconfig({
        metadata: {},
        spec:     {}
      });

      const mockActions = [
        { action: 'goToClone' },
        { action: 'divider' },
        { action: 'goToEdit' },
        { action: 'goToEditYaml' },
        { action: 'cloneYaml' },
        { action: 'download' },
        { action: 'promptRemove' }
      ];

      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(kubeconfig)), '_availableActions', 'get')
        .mockReturnValue(mockActions);

      const actions = kubeconfig._availableActions;

      expect(actions).toStrictEqual([
        { action: 'goToClone' },
        { action: 'promptRemove' }
      ]);
    });
  });
});
