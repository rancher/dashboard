import ProvCluster from '@shell/models/provisioning.cattle.io.cluster';

describe('class ProvCluster', () => {
  const importedClusterInfo = {
    clusterName: 'test', provisioner: 'imported', mgmt: { spec: { gkeConfig: {} } }, spec: {}
  };
  const importedGkeClusterInfo = {
    clusterName: 'test', provisioner: 'rke2', mgmt: { spec: { gkeConfig: { imported: true } } }
  };
  const importedAksClusterInfo = {
    clusterName: 'test', provisioner: 'rke2', mgmt: { spec: { aksConfig: { imported: true } } }
  };
  const importedEksClusterInfo = {
    clusterName: 'test', provisioner: 'rke2', mgmt: { spec: { eksConfig: { imported: true } } }
  };
  const notImportedGkeClusterInfo = {
    clusterName: 'test', provisioner: 'rke2', mgmt: { spec: { gkeConfig: { imported: false } }, rkeConfig: {} }
  };
  const importedClusterInfoWithProviderForEmberParam = {
    clusterName: 'test', provisioner: 'rke2', mgmt: { providerForEmberParam: 'import' }
  };
  const localClusterInfo = {
    clusterName: 'test', provisioner: 'imported', mgmt: { isLocal: true, spec: { gkeConfig: {} } }, spec: {}
  };
  const doRke2Info = {
    clusterName: 'test', provisioner: 'rke2', mgmt: { isLocal: false, providerForEmberParam: 'import' }, spec: { rkeConfig: {} }
  };

  describe('isImported', () => {
    const testCases = [
      [importedClusterInfo, true],
      [importedGkeClusterInfo, true],
      [importedAksClusterInfo, true],
      [importedEksClusterInfo, true],
      [notImportedGkeClusterInfo, false],
      [importedClusterInfoWithProviderForEmberParam, true],
      [localClusterInfo, false],
      [doRke2Info, false],
      [{}, false],
    ];
    const resetMocks = () => {
      // Clear all mock function calls:
      jest.clearAllMocks();
    };

    it.each(testCases)('should return the isImported value properly based on the props data', (clusterData: Object, expected: Boolean) => {
      const cluster = new ProvCluster({ spec: clusterData.spec });

      jest.spyOn(cluster, 'mgmt', 'get').mockReturnValue(
        clusterData.mgmt
      );
      jest.spyOn(cluster, 'provisioner', 'get').mockReturnValue(
        clusterData.provisioner
      );

      expect(cluster.isImported).toBe(expected);
      resetMocks();
    }
    );
  });

  describe('mgmt', () => {
    const testCases = [
      [importedClusterInfo, importedClusterInfo.mgmt],
      [importedGkeClusterInfo, importedGkeClusterInfo.mgmt],
      [importedAksClusterInfo, importedAksClusterInfo.mgmt],
      [importedEksClusterInfo, importedEksClusterInfo.mgmt],
      [notImportedGkeClusterInfo, notImportedGkeClusterInfo.mgmt],
      [importedClusterInfoWithProviderForEmberParam, importedClusterInfoWithProviderForEmberParam.mgmt],
      [localClusterInfo, localClusterInfo.mgmt],
      [doRke2Info, doRke2Info.mgmt],
      [{}, null],
    ];

    const resetMocks = () => {
      // Clear all mock function calls:
      jest.clearAllMocks();
    };

    it.each(testCases)('should return the isImported value properly based on the props data', (clusterData: Object, expected: Object) => {
      const clusterMock = jest.fn(() => clusterData.mgmt);
      const ctx = { rootGetters: { 'management/byId': clusterMock } };
      const cluster = new ProvCluster({ status: { clusterName: clusterData.clusterName } }, ctx);

      expect(cluster.mgmt).toBe(expected);
      resetMocks();
    }
    );
  });
});
