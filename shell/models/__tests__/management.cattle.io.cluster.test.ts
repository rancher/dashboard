import MgmtCluster from '@shell/models/management.cattle.io.cluster';
import { copyTextToClipboard } from '@shell/utils/clipboard';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

describe('class MgmtCluster', () => {
  describe('provisioner', () => {
    const testCases = [
      [{ provider: 'rke2', driver: 'imported' }, 'rke2'],
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

  describe('copyKubeConfig', () => {
    let cluster: any;
    const mockGenerateKubeConfig = jest.fn();
    const mockConfig = 'apiVersion: v1\nkind: Config\nclusters:\n- name: test-cluster';

    beforeEach(() => {
      jest.clearAllMocks();
      cluster = new MgmtCluster({
        id:       'test-cluster-1',
        metadata: { name: 'test-cluster-1' }
      });
      cluster.generateKubeConfig = mockGenerateKubeConfig;
    });

    it('should copy single cluster kubeconfig to clipboard', async() => {
      mockGenerateKubeConfig.mockResolvedValue(mockConfig);

      await cluster.copyKubeConfig();

      expect(mockGenerateKubeConfig).toHaveBeenCalledWith();
      expect(copyTextToClipboard).toHaveBeenCalledWith(mockConfig);
    });

    it('should not copy to clipboard if config generation returns null', async() => {
      mockGenerateKubeConfig.mockResolvedValue(null);

      await cluster.copyKubeConfig();

      expect(mockGenerateKubeConfig).toHaveBeenCalledWith();
      expect(copyTextToClipboard).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async() => {
      mockGenerateKubeConfig.mockRejectedValue(new Error('Generation failed'));

      await expect(cluster.copyKubeConfig()).resolves.not.toThrow();
      expect(copyTextToClipboard).not.toHaveBeenCalled();
    });
  });

  describe('copyKubeConfigBulk', () => {
    let cluster: any;
    const mockGenerateKubeConfig = jest.fn();
    const mockConfig = 'apiVersion: v1\nkind: Config\nclusters:\n- name: cluster-1\n- name: cluster-2';

    beforeEach(() => {
      jest.clearAllMocks();
      cluster = new MgmtCluster({
        id:       'cluster-1',
        metadata: { name: 'cluster-1' }
      });
      cluster.generateKubeConfig = mockGenerateKubeConfig;
    });

    it('should copy multiple cluster kubeconfigs to clipboard', async() => {
      const items = [
        { id: 'cluster-1', mgmt: { id: 'mgmt-cluster-1' } },
        { id: 'cluster-2', mgmt: { id: 'mgmt-cluster-2' } },
        { id: 'cluster-3', mgmt: { id: 'mgmt-cluster-3' } }
      ];

      mockGenerateKubeConfig.mockResolvedValue(mockConfig);

      await cluster.copyKubeConfigBulk(items);

      expect(mockGenerateKubeConfig).toHaveBeenCalledWith(['mgmt-cluster-1', 'mgmt-cluster-2', 'mgmt-cluster-3']);
      expect(copyTextToClipboard).toHaveBeenCalledWith(mockConfig);
    });

    it('should use item.id when mgmt.id is not available', async() => {
      const items = [
        { id: 'cluster-1' },
        { id: 'cluster-2' },
        { id: 'cluster-3', mgmt: { id: 'mgmt-cluster-3' } }
      ];

      mockGenerateKubeConfig.mockResolvedValue(mockConfig);

      await cluster.copyKubeConfigBulk(items);

      expect(mockGenerateKubeConfig).toHaveBeenCalledWith(['cluster-1', 'cluster-2', 'mgmt-cluster-3']);
      expect(copyTextToClipboard).toHaveBeenCalledWith(mockConfig);
    });

    it('should handle single cluster in bulk action', async() => {
      const items = [{ id: 'cluster-1', mgmt: { id: 'mgmt-cluster-1' } }];

      mockGenerateKubeConfig.mockResolvedValue(mockConfig);

      await cluster.copyKubeConfigBulk(items);

      expect(mockGenerateKubeConfig).toHaveBeenCalledWith(['mgmt-cluster-1']);
      expect(copyTextToClipboard).toHaveBeenCalledWith(mockConfig);
    });

    it('should not copy to clipboard if config generation returns null', async() => {
      const items = [
        { id: 'cluster-1', mgmt: { id: 'mgmt-cluster-1' } },
        { id: 'cluster-2', mgmt: { id: 'mgmt-cluster-2' } }
      ];

      mockGenerateKubeConfig.mockResolvedValue(null);

      await cluster.copyKubeConfigBulk(items);

      expect(mockGenerateKubeConfig).toHaveBeenCalledWith(['mgmt-cluster-1', 'mgmt-cluster-2']);
      expect(copyTextToClipboard).not.toHaveBeenCalled();
    });

    it('should not copy to clipboard if config is empty string', async() => {
      const items = [
        { id: 'cluster-1', mgmt: { id: 'mgmt-cluster-1' } }
      ];

      mockGenerateKubeConfig.mockResolvedValue('');

      await cluster.copyKubeConfigBulk(items);

      expect(mockGenerateKubeConfig).toHaveBeenCalledWith(['mgmt-cluster-1']);
      expect(copyTextToClipboard).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async() => {
      const items = [
        { id: 'cluster-1', mgmt: { id: 'mgmt-cluster-1' } }
      ];

      mockGenerateKubeConfig.mockRejectedValue(new Error('Generation failed'));

      await expect(cluster.copyKubeConfigBulk(items)).resolves.not.toThrow();
      expect(copyTextToClipboard).not.toHaveBeenCalled();
    });

    it('should handle empty items array', async() => {
      const items: any[] = [];

      mockGenerateKubeConfig.mockResolvedValue(mockConfig);

      await cluster.copyKubeConfigBulk(items);

      expect(mockGenerateKubeConfig).toHaveBeenCalledWith([]);
      expect(copyTextToClipboard).toHaveBeenCalledWith(mockConfig);
    });
  });
});
