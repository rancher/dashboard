import ProvCluster from '@shell/models/provisioning.cattle.io.cluster';
jest.mock('@shell/utils/provider', () => ({
  isHostedProvider: jest.fn().mockImplementation((context, provider) => {
    return ['GKE', 'EKS', 'AKS'].includes(provider);
  })
}));
describe('class ProvCluster', () => {
  const gkeClusterWithPrivateEndpoint = {
    clusterName: 'test',
    provisioner: 'GKE',
    spec:        { },
    mgmt:        { spec: { gkeConfig: { privateClusterConfig: { enablePrivateEndpoint: true } } } }
  };

  const eksClusterWithPrivateEndpoint = {
    clusterName: 'test',
    provisioner: 'EKS',
    spec:        { },
    mgmt:        { spec: { eksConfig: { privateAccess: true } } }
  };

  const aksClusterWithPrivateEndpoint = {
    clusterName: 'test',
    provisioner: 'AKS',
    spec:        { },
    mgmt:        { spec: { aksConfig: { privateCluster: true } } }
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

      jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue(
        clusterData.mgmt
      );
      jest.spyOn(cluster, 'provisioner', 'get').mockReturnValue(
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
          providerConfig:             { imported: true }
        },
        expected: true
      },
      {
        description: 'should return false for a provisioned hosted cluster',
        clusterData: {
          isLocal:                    false,
          isHostedKubernetesProvider: true,
          providerConfig:             { imported: false }
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
      const cluster = new ProvCluster({});

      // Mock getters
      jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue(
        clusterData.mgmt
      );
      if (clusterData.isLocal !== undefined) {
        jest.spyOn(cluster, 'isLocal', 'get').mockReturnValue(clusterData.isLocal);
      }
      if (clusterData.isHostedKubernetesProvider !== undefined) {
        jest.spyOn(cluster, 'isHostedKubernetesProvider', 'get').mockReturnValue(clusterData.isHostedKubernetesProvider);
      }
      if (clusterData.providerConfig !== undefined) {
        jest.spyOn(cluster, 'providerConfig', 'get').mockReturnValue(clusterData.providerConfig);
      }
      if (clusterData.provisioner !== undefined) {
        jest.spyOn(cluster, 'provisioner', 'get').mockReturnValue(clusterData.provisioner);
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
      const cluster = new ProvCluster({ status: { conditions } }, ctx);

      expect(cluster.hasError).toBe(expected);
      resetMocks();
    }
    );
  });
});
