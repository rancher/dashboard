import MgmtCluster from '@shell/models/management.cattle.io.cluster';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

const importedRKE2ClusterInfo = { status: { driver: 'rke2', provider: 'rke2' } };

const provisionedRKE2ClusterInfo = { status: { driver: 'rke2', provider: 'imported' } };

const importedK3sClusterInfo = { status: { driver: 'k3s', provider: 'k3s' } };

const provisionedK3sClusterInfo = { status: { driver: 'k3s', provider: 'imported' } };

const importedAksClusterInfo = { spec: { aksConfig: { imported: true } }, status: { provider: 'aks', driver: 'AKS' } };

const provisionedAksClusterInfo = { spec: { aksConfig: { imported: false } }, status: { provider: 'aks', driver: 'AKS' } };

const importedRKE1ClusterInfo = { status: { provider: 'rke', driver: 'imported' } };

const provisionedRKE1ClusterInfo = { status: { provider: 'rke', driver: 'rancherKubernetesEngine' } };

const localRKE1ClusterInfo = { status: { provider: 'rke', driver: 'imported' } };

const localRKE2ClusterInfo = { status: { provider: 'rke2', driver: 'rke2' } };

const localEKSClusterInfo = { status: { provider: 'eks', driver: 'imported' } };

describe('class MgmtCluster', () => {
  describe('provisioner', () => {
    const testCases = [
      [{ provider: 'rke', driver: 'imported' }, 'imported'],
      [{ provider: 'k3s', driver: 'K3S' }, 'K3S'],
      [{ provider: 'aks', driver: 'AKS' }, 'AKS'],
      [{}, 'imported'],
    ];

    it.each(testCases)('should return provisioner value properly based on the props data', (clusterData: Object, expected: String) => {
      const cluster = new MgmtCluster({ status: clusterData });

      expect(cluster.provisioner).toBe(expected);
    }
    );
  });

  describe('isImported', () => {
    it.each([
      [importedRKE2ClusterInfo, true],
      [provisionedRKE2ClusterInfo, false],
      [importedK3sClusterInfo, true],
      [provisionedK3sClusterInfo, false],
      [importedAksClusterInfo, true],
      [provisionedAksClusterInfo, false],
      [importedRKE1ClusterInfo, true],
      [provisionedRKE1ClusterInfo, false],
      [localRKE1ClusterInfo, true],
      [localRKE2ClusterInfo, true],
      [localEKSClusterInfo, true]
    ])('should return isImported based on props data', (clusterData, expected) => {
      const cluster = new MgmtCluster(clusterData);

      expect(cluster.isImported).toBe(expected);
    });
  });
});
