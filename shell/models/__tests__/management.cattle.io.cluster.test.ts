import MgmtCluster from '@shell/models/management.cattle.io.cluster';
import { EXT } from '@shell/config/types';
import { PINNED_CLUSTERS, RECENT_CLUSTERS } from '@shell/store/prefs';
import { copyTextToClipboard } from '@shell/utils/clipboard';
import { downloadFile } from '@shell/utils/download';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

jest.mock('@shell/utils/download', () => {
  return { downloadFile: jest.fn(() => Promise.resolve({})) };
});

describe('class MgmtCluster', () => {
  describe('provisioner', () => {
    const testCases: [Record<string, string>, string][] = [
      [{ provider: 'rke2', driver: 'imported' }, 'rke2'],
      [{ provider: 'k3s', driver: 'K3S' }, 'K3S'],
      [{ provider: 'aks', driver: 'AKS' }, 'AKS'],
      [{}, 'imported'],
    ];

    it.each(testCases)('should return provisioner value properly based on the props data', (clusterData, expected) => {
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

  describe('generateKubeConfig', () => {
    const mockConfig = 'apiVersion: v1\nkind: Config';
    let mockSave: jest.Mock;
    let mockDispatch: jest.Mock;

    const makeCluster = (id = 'cluster-1') => {
      const ctx = {
        dispatch:    mockDispatch,
        rootGetters: { 'i18n/t': (key: string) => key }
      };

      return new MgmtCluster({ id, metadata: { name: id } }, ctx) as any;
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockSave = jest.fn().mockResolvedValue({ status: { value: mockConfig } });
      mockDispatch = jest.fn().mockResolvedValue({ save: mockSave });
    });

    it('should request a kubeconfig for this cluster without the default `rancher` entry', async() => {
      const cluster = makeCluster();

      const res = await cluster.generateKubeConfig();

      expect(mockDispatch).toHaveBeenCalledWith('management/create', {
        type: EXT.KUBECONFIG,
        spec: { clusters: ['cluster-1'], includeDefaultEntry: false }
      }, { root: true });
      expect(mockSave).toHaveBeenCalledWith();
      expect(res).toBe(mockConfig);
    });

    it('should pass an explicit list of clusters through, still excluding the default entry', async() => {
      const cluster = makeCluster();

      await cluster.generateKubeConfig(['cluster-1', 'cluster-2']);

      expect(mockDispatch).toHaveBeenCalledWith('management/create', {
        type: EXT.KUBECONFIG,
        spec: { clusters: ['cluster-1', 'cluster-2'], includeDefaultEntry: false }
      }, { root: true });
    });

    it('should not make a request when there are no clusters', async() => {
      const cluster = makeCluster();

      const res = await cluster.generateKubeConfig([]);

      expect(mockDispatch).not.toHaveBeenCalledWith('management/create', expect.anything(), expect.anything());
      expect(res).toBeUndefined();
    });

    it('should growl an error when there are no clusters', async() => {
      const cluster = makeCluster();

      await cluster.generateKubeConfig([]);

      expect(mockDispatch).toHaveBeenCalledWith('growl/error', {
        title:   'cluster.kubeConfig.error.title',
        message: 'cluster.kubeConfig.error.noClusters',
      }, { root: true });
    });

    it('should return undefined when the response has no value', async() => {
      mockSave.mockResolvedValue({});
      const cluster = makeCluster();

      const res = await cluster.generateKubeConfig();

      expect(res).toBeUndefined();
    });
  });

  describe('kubeConfigClusterIds', () => {
    const cluster = () => new MgmtCluster({ id: 'cluster-1' }) as any;

    it('should prefer the management cluster id over the row id', () => {
      const items = [{ id: 'prov-1', mgmt: { id: 'mgmt-1' } }, { id: 'prov-2' }];

      expect(cluster().kubeConfigClusterIds(items)).toStrictEqual(['mgmt-1', 'prov-2']);
    });

    it('should de-duplicate ids that resolve to the same management cluster', () => {
      const items = [
        { id: 'prov-1', mgmt: { id: 'mgmt-1' } },
        { id: 'mgmt-1' },
        { id: 'prov-2', mgmt: { id: 'mgmt-2' } }
      ];

      expect(cluster().kubeConfigClusterIds(items)).toStrictEqual(['mgmt-1', 'mgmt-2']);
    });

    it('should drop rows without an id', () => {
      const items = [{ id: 'mgmt-1' }, {}, { id: '' }];

      expect(cluster().kubeConfigClusterIds(items)).toStrictEqual(['mgmt-1']);
    });

    it('should handle no items', () => {
      expect(cluster().kubeConfigClusterIds()).toStrictEqual([]);
      expect(cluster().kubeConfigClusterIds([])).toStrictEqual([]);
    });
  });

  describe('downloadKubeConfigBulk', () => {
    let cluster: any;
    const mockGenerateKubeConfig = jest.fn();
    const mockConfig = 'apiVersion: v1\nkind: Config';

    beforeEach(() => {
      jest.clearAllMocks();
      cluster = new MgmtCluster({ id: 'cluster-1' });
      cluster.generateKubeConfig = mockGenerateKubeConfig;
    });

    it('should download a kubeconfig for the de-duplicated set of clusters', async() => {
      const items = [
        { id: 'prov-1', mgmt: { id: 'mgmt-1' } },
        { id: 'mgmt-1' }
      ];

      mockGenerateKubeConfig.mockResolvedValue(mockConfig);

      await cluster.downloadKubeConfigBulk(items);

      expect(mockGenerateKubeConfig).toHaveBeenCalledWith(['mgmt-1']);
      expect(downloadFile).toHaveBeenCalledWith('kubeconfig.yaml', mockConfig, 'application/yaml');
    });

    it('should not download a file when no config was generated', async() => {
      mockGenerateKubeConfig.mockResolvedValue(undefined);

      await cluster.downloadKubeConfigBulk([]);

      expect(downloadFile).not.toHaveBeenCalled();
    });
  });

  describe('pin / unpin', () => {
    // A dispatch that records what the model sends to the shared cluster-pref writer.
    const makeCluster = (id: string) => {
      const calls: { action: string, payload: any }[] = [];
      const dispatch = jest.fn((action: string, payload: any) => {
        calls.push({ action, payload });

        return Promise.resolve(action === 'prefs/applyPrefsOptimistic' ? {} : undefined);
      });

      return { cluster: new MgmtCluster({ id }, { dispatch }) as any, calls };
    };

    it('pin routes through the shared writer (one optimistic commit, then one reconcile)', async() => {
      const { cluster, calls } = makeCluster('c-a');

      await cluster.pin();

      expect(calls.map((c) => c.action)).toStrictEqual(['prefs/applyPrefsOptimistic', 'prefs/reconcilePrefs']);
    });

    it('pin sends a single PINNED_CLUSTERS mutation that adds the cluster idempotently', async() => {
      const { cluster, calls } = makeCluster('c-a');

      await cluster.pin();

      const mutations = calls[0].payload;

      expect(mutations).toHaveLength(1);
      expect(mutations[0].key).toBe(PINNED_CLUSTERS);
      expect(mutations[0].apply([])).toStrictEqual(['c-a']);
      expect(mutations[0].apply(['c-b'])).toStrictEqual(['c-b', 'c-a']);
      expect(mutations[0].apply(['c-a'])).toStrictEqual(['c-a']); // already pinned — no duplicate
    });

    it('unpin removes from PINNED and promotes the cluster to the front of RECENT in one write', async() => {
      const { cluster, calls } = makeCluster('c-a');

      await cluster.unpin();

      const mutations = calls[0].payload;

      expect(mutations.map((m: any) => m.key)).toStrictEqual([PINNED_CLUSTERS, RECENT_CLUSTERS]);
      expect(mutations[0].apply(['c-a', 'c-b'])).toStrictEqual(['c-b']);
      expect(mutations[1].apply(['c-c'])).toStrictEqual(['c-a', 'c-c']);
    });

    it('unpin of local touches PINNED only (local is never listed under RECENT)', async() => {
      const { cluster, calls } = makeCluster('local');

      await cluster.unpin();

      const mutations = calls[0].payload;

      expect(mutations.map((m: any) => m.key)).toStrictEqual([PINNED_CLUSTERS]);
      expect(mutations[0].apply(['local', 'c-b'])).toStrictEqual(['c-b']);
    });
  });
});
