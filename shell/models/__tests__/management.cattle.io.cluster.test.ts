import MgmtCluster from '@shell/models/management.cattle.io.cluster';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

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
});
