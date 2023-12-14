import MgmtCluster from '@shell/models/management.cattle.io.cluster';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

describe('class MgmtCluster', () => {
  describe('provisioner', () => {
    const testCases = [
      [{ provider: 'rke', driver: 'imported' }, 'rke'],
      [{ provider: 'k3s', driver: 'K3S' }, 'k3s'],
      [{ provider: 'aks', driver: 'AKS' }, 'aks'],
      [{}, 'imported'],
    ];

    it.each(testCases)('should return provisioner value properly based on the props data', (clusterData: Object, expected: String) => {
      const cluster = new MgmtCluster({ status: clusterData });

      expect(cluster.provisioner).toBe(expected);
    }
    );
  });
});
