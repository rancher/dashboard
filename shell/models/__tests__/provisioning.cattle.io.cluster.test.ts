import ProvCluster from '@shell/models/provisioning.cattle.io.cluster';
import MgmtCluster from '@shell/models/management.cattle.io.cluster';
import { IMPORTED_DAY_2_OPS } from '@shell/config/features';
import { OPERATION_ANNOTATIONS } from '@shell/config/labels-annotations';
import { SETTING } from '@shell/config/settings';
import { MANAGEMENT, OPERATION, LOCAL_CLUSTER, NAMESPACE } from '@shell/config/types';
import { createOperationCR } from '@shell/utils/operation-cr';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import sideNavService from '@shell/components/nav/TopLevelMenu.helper';

jest.mock('@shell/utils/operation-cr', () => ({ createOperationCR: jest.fn() }));

jest.mock('@shell/components/nav/TopLevelMenu.helper', () => ({ default: { someMethod: jest.fn() } }));

jest.mock('@shell/utils/provider', () => ({
  isHostedProvider: jest.fn().mockImplementation((context, provider) => {
    return ['GKE', 'EKS', 'AKS'].includes(provider);
  }),
  isCAPIProvider: jest.fn().mockImplementation((context, provider) => {
    return ['capa', 'capv'].includes(provider.toLowerCase());
  })
}));

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

describe('class ProvCluster', () => {
  const gkeClusterWithPrivateEndpoint = {
    clusterName: 'test',
    provisioner: 'GKE',
    spec:        { },
    mgmt:        new MgmtCluster({ spec: { gkeConfig: { privateClusterConfig: { enablePrivateEndpoint: true } } } }),
  };

  const eksClusterWithPrivateEndpoint = {
    clusterName: 'test',
    provisioner: 'EKS',
    spec:        { },
    mgmt:        new MgmtCluster({ spec: { eksConfig: { privateAccess: true } } }),
  };

  const aksClusterWithPrivateEndpoint = {
    clusterName: 'test',
    provisioner: 'AKS',
    spec:        { },
    mgmt:        new MgmtCluster({ spec: { aksConfig: { privateCluster: true } } }),
  };

  // Related to https://github.com/rancher/dashboard/issues/9402
  describe('isHostedKubernetesProvider + isPrivateHostedProvider', () => {
    const testCases = [
      [gkeClusterWithPrivateEndpoint, true],
      [eksClusterWithPrivateEndpoint, true],
      [aksClusterWithPrivateEndpoint, true],
    ];
    const resetMocks = () => {
      // Clear all mock function calls:
      jest.clearAllMocks();
    };

    it.each(testCases)('should return the isHostedKubernetesProvider and isPrivateHostedProvider values properly based on the props data', (clusterData: Object, expected: Boolean) => {
      const cluster = new ProvCluster({ spec: clusterData.spec });

      jest.spyOn(clusterData.mgmt, 'provCluster', 'get').mockReturnValue(
        clusterData
      );

      jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue(
        clusterData.mgmt
      );
      jest.spyOn(clusterData.mgmt, 'provisioner', 'get').mockReturnValue(
        clusterData.provisioner
      );

      expect(cluster.isRke2).toBe(false);
      expect(cluster.isHostedKubernetesProvider).toBe(expected);
      expect(cluster.isPrivateHostedProvider).toBe(expected);
      resetMocks();
    });
  });

  describe('isImported', () => {
    const testCases = [
      {
        description: 'should return false for a local cluster',
        clusterData: { isLocal: true },
        expected:    false
      },
      {
        description: 'should return true for an imported k3s cluster',
        clusterData: {
          isLocal: false,
          mgmt:    { status: { provider: 'k3s', driver: 'k3s' } }
        },
        expected: true
      },
      {
        description: 'should return true for an imported k3s cluster in waiting state',
        clusterData: {
          isLocal: false,
          mgmt:    { status: { provider: undefined, driver: 'k3s' } }
        },
        expected: true
      },
      {
        description: 'should return true for an imported rke2 cluster in waiting state',
        clusterData: {
          isLocal: false,
          mgmt:    { status: { provider: undefined, driver: 'rke2' } }
        },
        expected: true
      },
      {
        description: 'should return false for a provisioned k3s cluster',
        clusterData: {
          isLocal: false,
          mgmt:    { status: { provider: 'k3s', driver: 'imported' } }
        },
        expected: false
      },
      {
        description: 'should return true for an imported rke2 cluster',
        clusterData: {
          isLocal: false,
          mgmt:    { status: { provider: 'rke2', driver: 'rke2' } }
        },
        expected: true
      },
      {
        description: 'should return false for a provisioned rke2 cluster',
        clusterData: {
          isLocal: false,
          mgmt:    { status: { provider: 'rke2', driver: 'imported' } }
        },
        expected: false
      },
      {
        description: 'should return true for an imported hosted cluster',
        clusterData: {
          isLocal:                    false,
          isHostedKubernetesProvider: true,
          providerConfig:             { imported: true },
          mgmt:                       { status: { provider: '', driver: 'EKS' } }
        },
        expected: true
      },
      {
        description: 'should return false for a provisioned hosted cluster',
        clusterData: {
          isLocal:                    false,
          isHostedKubernetesProvider: true,
          providerConfig:             { imported: false },
          mgmt:                       { status: { provider: '', driver: 'EKS' } }
        },
        expected: false
      },
      {
        description: 'should return true for a generic imported cluster',
        clusterData: {
          isLocal:     false,
          provisioner: 'imported'
        },
        expected: true
      },
      {
        description: 'should return false for a generic provisioned cluster',
        clusterData: {
          isLocal:     false,
          provisioner: 'rke2'
        },
        expected: false
      }
    ];
    const resetMocks = () => {
      // Clear all mock function calls:
      jest.clearAllMocks();
    };

    it.each(testCases)('$description', ({ clusterData, expected }) => {
      const mgmtCluster = new MgmtCluster(clusterData.mgmt || {});
      const cluster = new ProvCluster({});

      // Mock getters
      jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue(
        mgmtCluster
      );
      jest.spyOn(mgmtCluster, 'provCluster', 'get').mockReturnValue(
        cluster
      );
      if (clusterData.isLocal !== undefined) {
        jest.spyOn(mgmtCluster, 'isLocal', 'get').mockReturnValue(clusterData.isLocal);
      }
      if (clusterData.isHostedKubernetesProvider !== undefined) {
        jest.spyOn(mgmtCluster, 'isHostedKubernetesProvider', 'get').mockReturnValue(clusterData.isHostedKubernetesProvider);
      }
      if (clusterData.providerConfig !== undefined) {
        jest.spyOn(cluster, 'providerConfig', 'get').mockReturnValue(clusterData.providerConfig);
      }
      if (clusterData.provisioner !== undefined) {
        jest.spyOn(mgmtCluster, 'provisioner', 'get').mockReturnValue(clusterData.provisioner);
      }

      expect(cluster.isImported).toBe(expected);
      resetMocks();
    });
  });

  describe('hasError', () => {
    const conditionsWithoutError = [
      {
        error:          false,
        lastUpdateTime: '2022-10-17T23:09:15Z',
        status:         'True',
        transitioning:  false,
        type:           'Ready'
      },
    ];

    const conditionsWithoutReady = [
      {
        error:          true,
        lastUpdateTime: '2022-10-17T23:09:15Z',
        status:         'False',
        message:        'some-error-message',
        transitioning:  false,
        type:           'Pending'
      },
    ];

    const noConditions:[] = [];

    const conditionsWithReadyLatest = [
      {
        error:          true,
        lastUpdateTime: '2022-10-17T23:09:15Z',
        status:         'False',
        message:        'some-error-message',
        transitioning:  false,
        type:           'Pending'
      },
      {
        error:          false,
        lastUpdateTime: '2023-10-17T23:09:15Z',
        status:         'True',
        transitioning:  false,
        type:           'Ready'
      }
    ];

    const conditionsWithErrorLatest = [
      {
        error:          false,
        lastUpdateTime: '2022-10-17T23:09:15Z',
        status:         'True',
        transitioning:  false,
        type:           'Ready'
      },
      {
        error:          true,
        lastUpdateTime: '2023-10-17T23:09:15Z',
        status:         'False',
        message:        'some-error-message',
        transitioning:  false,
        type:           'Pending'
      }
    ];

    const conditionsWithProblemInLastUpdateTimeProp = [
      {
        error:          true,
        lastUpdateTime: '',
        status:         'False',
        message:        'some-error-message',
        transitioning:  false,
        type:           'Pending'
      },
      {
        error:          false,
        lastUpdateTime: '2023-10-17T23:09:15Z',
        status:         'True',
        transitioning:  false,
        type:           'Ready'
      }
    ];

    const testCases = [
      ['conditionsWithoutError', conditionsWithoutError, false],
      ['conditionsWithoutReady', conditionsWithoutReady, true],
      ['noConditions', noConditions, false],
      ['conditionsWithReadyLatest', conditionsWithReadyLatest, false],
      ['conditionsWithErrorLatest', conditionsWithErrorLatest, true],
      ['conditionsWithProblemInLastUpdateTimeProp', conditionsWithProblemInLastUpdateTimeProp, false],
    ];

    const resetMocks = () => {
      // Clear all mock function calls
      jest.clearAllMocks();
    };

    it.each(testCases)('should return the hasError value properly based on the "status.conditions" props data for testcase %p', (testName: string, conditions: Array, expected: Boolean) => {
      const ctx = { rootGetters: { 'management/byId': jest.fn() } };
      const mgmtCluster = new MgmtCluster({ status: { conditions } }, ctx);
      const cluster = new ProvCluster({}, ctx);

      jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue(mgmtCluster);

      expect(cluster.hasError).toBe(expected);
      resetMocks();
    }
    );
  });

  describe('supportsWindows', () => {
    const testCases = [
      {
        description: 'should return false for k3s',
        clusterData: { isK3s: true },
        expected:    false
      },
      {
        description: 'should return false for imported k3s',
        clusterData: { isImportedK3s: true },
        expected:    false
      },
      {
        description: 'should return windowsPreferedCluster for rke1',
        clusterData: { isRke1: true, mgmt: { spec: { windowsPreferedCluster: true } } },
        expected:    true
      },
      {
        description: 'should return false for rke1 if windowsPreferedCluster is false/missing',
        clusterData: { isRke1: true, mgmt: { spec: { windowsPreferedCluster: false } } },
        expected:    false
      },
      {
        description: 'should return false if not rke2 (and not rke1 or k3s)',
        clusterData: { isRke2: false },
        expected:    false
      },
      {
        description: 'should return false if kubernetesVersion is missing',
        clusterData: { isRke2: true, kubernetesVersion: undefined },
        expected:    false
      },
      {
        description: 'should return false if kubernetesVersion is less than v1.21.0',
        clusterData: { isRke2: true, kubernetesVersion: 'v1.20.9' },
        expected:    false
      },
      {
        description: 'should return false if cni is not calico or flannel',
        clusterData: {
          isRke2: true, kubernetesVersion: 'v1.34.0', spec: { rkeConfig: { machineGlobalConfig: { cni: 'cilium' } } }
        },
        expected: false
      },
      {
        description: 'should return true if cni is calico',
        clusterData: {
          isRke2: true, kubernetesVersion: 'v1.34.0', spec: { rkeConfig: { machineGlobalConfig: { cni: 'calico' } } }
        },
        expected: true
      },
      {
        description: 'should return false if cni is flannel and kubernetesVersion is less than v1.29.2 (e.g. v1.29.1)',
        clusterData: {
          isRke2: true, kubernetesVersion: 'v1.29.1', spec: { rkeConfig: { machineGlobalConfig: { cni: 'flannel' } } }
        },
        expected: false
      },
      {
        description: 'should return true if cni is flannel and kubernetesVersion is exactly v1.29.2',
        clusterData: {
          isRke2: true, kubernetesVersion: 'v1.29.2', spec: { rkeConfig: { machineGlobalConfig: { cni: 'flannel' } } }
        },
        expected: true
      },
      {
        description: 'should return true if cni is flannel and kubernetesVersion is >= v1.29.2 (e.g. v1.35.0)',
        clusterData: {
          isRke2: true, kubernetesVersion: 'v1.35.0', spec: { rkeConfig: { machineGlobalConfig: { cni: 'flannel' } } }
        },
        expected: true
      },
      {
        description: 'should return true if cni is empty/undefined',
        clusterData: {
          isRke2: true, kubernetesVersion: 'v1.34.0', spec: { rkeConfig: { machineGlobalConfig: {} } }
        },
        expected: true
      },
    ];

    it.each(testCases)('$description', ({ clusterData, expected }) => {
      const cluster = new ProvCluster({ spec: clusterData.spec });

      jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue(clusterData.mgmt);
      jest.spyOn(cluster, 'isK3s', 'get').mockReturnValue(clusterData.isK3s || false);
      jest.spyOn(cluster, 'isImportedK3s', 'get').mockReturnValue(clusterData.isImportedK3s || false);
      jest.spyOn(cluster, 'isRke1', 'get').mockReturnValue(clusterData.isRke1 || false);
      jest.spyOn(cluster, 'isRke2', 'get').mockReturnValue(clusterData.isRke2 || false);
      jest.spyOn(cluster, 'kubernetesVersion', 'get').mockReturnValue(clusterData.kubernetesVersion);

      expect(cluster.supportsWindows).toBe(expected);
      jest.clearAllMocks();
    });
  });

  describe('isCapiWithoutExtension', () => {
    const testCases = [
      {
        description:    'should return undefined when mgmt is undefined',
        isCapiHybrid:   undefined,
        isCAPIProvider: undefined,
        expected:       undefined,
      },
      {
        description:    'should return false when not a CAPI cluster',
        isCapiHybrid:   false,
        isCAPIProvider: false,
        expected:       false,
      },
      {
        description:    'should return false when CAPI cluster and a registered CAPI provider extension exists',
        isCapiHybrid:   true,
        isCAPIProvider: true,
        expected:       false,
      },
      {
        description:    'should return true when CAPI cluster but no registered CAPI provider extension',
        isCapiHybrid:   true,
        isCAPIProvider: false,
        expected:       true,
      },
    ];

    it.each(testCases)('$description', ({ isCapiHybrid, isCAPIProvider, expected }) => {
      const cluster = new ProvCluster({});

      if (isCapiHybrid === undefined) {
        jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue(undefined);
      } else {
        const mgmtCluster = new MgmtCluster({});

        jest.spyOn(mgmtCluster, 'isCapiHybrid', 'get').mockReturnValue(isCapiHybrid);
        jest.spyOn(mgmtCluster, 'isCAPIProvider', 'get').mockReturnValue(isCAPIProvider);
        jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue(mgmtCluster);
      }

      expect(cluster.isCapiWithoutExtension).toStrictEqual(expected);
      jest.clearAllMocks();
    });
  });
  describe('day 2 operations', () => {
    const createContext = ({
      byId = jest.fn(),
      all = jest.fn(() => []),
      schemaFor = jest.fn(() => ({})),
    } = {}) => {
      return {
        getters:     { schemaFor },
        rootGetters: {
          'management/byId': byId,
          'management/all':  all,
        }
      };
    };

    it('should return true when the day 2 operations feature is enabled', () => {
      const byId = jest.fn().mockImplementation((type, id) => {
        if (type === MANAGEMENT.FEATURE && id === IMPORTED_DAY_2_OPS) {
          return { enabled: true };
        }

        return undefined;
      });
      const cluster = new ProvCluster({}, createContext({ byId }));

      expect(cluster.isDayTwoOpsFeatureEnabled).toBe(true);
    });

    it('should return true for imported RKE2 day 2 operations when the annotation is enabled', () => {
      const byId = jest.fn().mockImplementation((type, id) => {
        if (type === MANAGEMENT.FEATURE && id === IMPORTED_DAY_2_OPS) {
          return { enabled: true };
        }

        return undefined;
      });
      const cluster = new ProvCluster({}, createContext({ byId }));

      jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue({ metadata: { annotations: { [OPERATION_ANNOTATIONS.ENABLED]: 'true' } } });
      jest.spyOn(cluster, 'isImportedRke2K3s', 'get').mockReturnValue(true);

      expect(cluster.isImportedWithDayTwoOps).toBe(true);
    });

    it('should return true for imported RKE2 day 2 operations when the global setting is enabled', () => {
      const byId = jest.fn().mockImplementation((type, id) => {
        if (type === MANAGEMENT.FEATURE && id === IMPORTED_DAY_2_OPS) {
          return { enabled: true };
        }

        if (type === MANAGEMENT.SETTING && id === SETTING.IMPORTED_CLUSTER_DAY2_OPS_DEFAULT) {
          return { value: 'true' };
        }

        return undefined;
      });
      const cluster = new ProvCluster({}, createContext({ byId }));

      jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue({ metadata: { annotations: {} } });
      jest.spyOn(cluster, 'isImportedRke2K3s', 'get').mockReturnValue(true);

      expect(cluster.isImportedWithDayTwoOps).toBe(true);
    });

    it('should return false for imported RKE2 day 2 operations when the feature is disabled', () => {
      const byId = jest.fn().mockImplementation((type, id) => {
        if (type === MANAGEMENT.SETTING && id === SETTING.IMPORTED_CLUSTER_DAY2_OPS_DEFAULT) {
          return { value: 'true' };
        }

        return undefined;
      });
      const cluster = new ProvCluster({}, createContext({ byId }));

      jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue({ metadata: { annotations: { [OPERATION_ANNOTATIONS.ENABLED]: 'true' } } });
      jest.spyOn(cluster, 'isImportedRke2K3s', 'get').mockReturnValue(true);

      expect(cluster.isImportedWithDayTwoOps).toBeFalsy();
    });

    it('should return false for imported RKE2 day 2 operations when operation schema is missing', () => {
      const byId = jest.fn().mockImplementation((type, id) => {
        if (type === MANAGEMENT.FEATURE && id === IMPORTED_DAY_2_OPS) {
          return { enabled: true };
        }

        if (type === MANAGEMENT.SETTING && id === SETTING.IMPORTED_CLUSTER_DAY2_OPS_DEFAULT) {
          return { value: 'true' };
        }

        return undefined;
      });
      const schemaFor = jest.fn().mockReturnValue(undefined);
      const cluster = new ProvCluster({}, createContext({ byId, schemaFor }));

      jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue({ metadata: { annotations: { [OPERATION_ANNOTATIONS.ENABLED]: 'true' } } });
      jest.spyOn(cluster, 'isImportedRke2K3s', 'get').mockReturnValue(true);

      expect(cluster.isImportedWithDayTwoOps).toBeFalsy();
    });

    it('should filter etcd snapshots by management cluster fields for imported day 2 operations clusters', () => {
      const snapshots = [
        {
          metadata: { namespace: 'c-m-1' },
          spec:     { clusterName: 'imported-cluster' }
        },
        {
          metadata: { namespace: 'c-m-1' },
          spec:     { clusterName: 'other-cluster' }
        },
        {
          metadata: { namespace: 'c-m-2' },
          spec:     { clusterName: 'imported-cluster' }
        }
      ];
      const all = jest.fn().mockReturnValue(snapshots);
      const cluster = new ProvCluster({}, createContext({ all }));

      jest.spyOn(cluster, 'isImportedWithDayTwoOps', 'get').mockReturnValue(true);
      jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue({ id: 'c-m-1', metadata: { name: 'imported-cluster' } });

      expect(cluster.etcdSnapshots).toStrictEqual([snapshots[0]]);
    });

    it('should create an operation CR when taking a snapshot on an imported RKE2 or K3s cluster', () => {
      const cluster = new ProvCluster({}, createContext());

      (createOperationCR as jest.Mock).mockResolvedValue(undefined);

      jest.spyOn(cluster, 'isRke1', 'get').mockReturnValue(false);
      jest.spyOn(cluster, 'isImportedWithDayTwoOps', 'get').mockReturnValue(true);
      jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue({ id: 'c-m-1', metadata: { name: 'imported-cluster' } });

      cluster.takeSnapshot();

      expect(createOperationCR).toHaveBeenCalledTimes(1);
      expect((createOperationCR as jest.Mock).mock.calls[0][1]).toBe(OPERATION.ETCD_SNAPSHOT);
      expect((createOperationCR as jest.Mock).mock.calls[0][2]).toStrictEqual({
        clusterRef: {
          apiVersion: 'management.cattle.io/v3',
          kind:       'Cluster',
          name:       'c-m-1',
        }
      });
      expect((createOperationCR as jest.Mock).mock.calls[0][3]).toBe('c-m-1');
      expect((createOperationCR as jest.Mock).mock.calls[0][4]).toBe('imported-cluster');
    });
  });

  describe('namespaceLocation', () => {
    const setLocalClusterAccess = ({ pinned, others }: { pinned: boolean, others: boolean }) => {
      sideNavService.helper.clustersPinned.length = 0;
      sideNavService.helper.clustersOthers.length = 0;

      if (pinned) {
        sideNavService.helper.clustersPinned.push({ id: LOCAL_CLUSTER } as any);
      }
      if (others) {
        sideNavService.helper.clustersOthers.push({ id: LOCAL_CLUSTER } as any);
      }
    };

    it('should route to the local cluster explorer when local is in the pinned side-nav clusters', () => {
      setLocalClusterAccess({ pinned: true, others: false });
      const cluster = new ProvCluster({ metadata: { namespace: 'fleet-default' } });

      expect(cluster.namespaceLocation).toStrictEqual({
        name:   'c-cluster-product-resource-id',
        params: {
          cluster:  LOCAL_CLUSTER,
          product:  EXPLORER,
          resource: NAMESPACE,
          id:       'fleet-default',
        },
      });
    });

    it('should route to the local cluster explorer when local is in the unpinned side-nav clusters', () => {
      setLocalClusterAccess({ pinned: false, others: true });
      const cluster = new ProvCluster({ metadata: { namespace: 'fleet-default' } });

      expect(cluster.namespaceLocation?.params.cluster).toBe(LOCAL_CLUSTER);
      expect(cluster.namespaceLocation?.params.product).toBe(EXPLORER);
    });

    it('should return null when the user has no access to the local cluster', () => {
      setLocalClusterAccess({ pinned: false, others: false });
      const cluster = new ProvCluster({ metadata: { namespace: 'fleet-default' } });

      expect(cluster.namespaceLocation).toBeNull();
    });
  });
});
