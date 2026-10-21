import MgmtCluster from '@shell/models/management.cattle.io.cluster';
import { CAPI, EXT, MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { IMPORTED_CLUSTER_VERSION_MANAGEMENT } from '@shell/config/labels-annotations';
import { PINNED_CLUSTERS } from '@shell/store/prefs';
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

  const kubeConfigErrorGrowl = (message: string) => ['growl/error', {
    title: 'cluster.kubeConfig.error.title',
    message,
  }, { root: true }];

  describe('copyKubeConfig', () => {
    let cluster: any;
    const mockGenerateKubeConfig = jest.fn();
    const mockDispatch = jest.fn();
    const mockConfig = 'apiVersion: v1\nkind: Config\nclusters:\n- name: test-cluster';

    beforeEach(() => {
      jest.clearAllMocks();
      cluster = new MgmtCluster({
        id:       'test-cluster-1',
        metadata: { name: 'test-cluster-1' }
      }, { dispatch: mockDispatch, rootGetters: { 'i18n/t': (key: string) => key } });
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

    it('should return true when the kubeconfig was copied', async() => {
      mockGenerateKubeConfig.mockResolvedValue(mockConfig);

      await expect(cluster.copyKubeConfig()).resolves.toBe(true);
    });

    it('should return false when config generation returns null', async() => {
      mockGenerateKubeConfig.mockResolvedValue(null);

      await expect(cluster.copyKubeConfig()).resolves.toBe(false);
    });

    it('should return false when config generation fails', async() => {
      mockGenerateKubeConfig.mockRejectedValue(new Error('Generation failed'));

      await expect(cluster.copyKubeConfig()).resolves.toBe(false);
    });

    it('should growl the error message when config generation fails', async() => {
      mockGenerateKubeConfig.mockRejectedValue(new Error('Generation failed'));

      await cluster.copyKubeConfig();

      expect(mockDispatch).toHaveBeenCalledWith(...kubeConfigErrorGrowl('Generation failed'));
    });

    it.each([
      ['an empty 404 response', { data: '' }],
      ['an undefined error', undefined],
    ])('should growl a generic message for %s', async(_, err) => {
      mockGenerateKubeConfig.mockRejectedValue(err);

      await cluster.copyKubeConfig();

      expect(mockDispatch).toHaveBeenCalledWith(...kubeConfigErrorGrowl('cluster.kubeConfig.error.requestFailed'));
    });

    it('should return false and growl when writing to the clipboard fails', async() => {
      mockGenerateKubeConfig.mockResolvedValue(mockConfig);
      (copyTextToClipboard as jest.Mock).mockRejectedValueOnce(new Error('Clipboard denied'));

      await expect(cluster.copyKubeConfig()).resolves.toBe(false);
      expect(mockDispatch).toHaveBeenCalledWith(...kubeConfigErrorGrowl('Clipboard denied'));
    });

    it('should not growl when the kubeconfig was copied', async() => {
      mockGenerateKubeConfig.mockResolvedValue(mockConfig);

      await cluster.copyKubeConfig();

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('copyKubeConfigBulk', () => {
    let cluster: any;
    const mockGenerateKubeConfig = jest.fn();
    const mockDispatch = jest.fn();
    const mockConfig = 'apiVersion: v1\nkind: Config\nclusters:\n- name: cluster-1\n- name: cluster-2';

    beforeEach(() => {
      jest.clearAllMocks();
      cluster = new MgmtCluster({
        id:       'cluster-1',
        metadata: { name: 'cluster-1' }
      }, { dispatch: mockDispatch, rootGetters: { 'i18n/t': (key: string) => key } });
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

    it('should return true when the kubeconfig was copied', async() => {
      mockGenerateKubeConfig.mockResolvedValue(mockConfig);

      await expect(cluster.copyKubeConfigBulk([{ id: 'cluster-1' }])).resolves.toBe(true);
    });

    it('should return false and growl when config generation fails', async() => {
      mockGenerateKubeConfig.mockRejectedValue(new Error('Generation failed'));

      await expect(cluster.copyKubeConfigBulk([{ id: 'cluster-1' }])).resolves.toBe(false);
      expect(mockDispatch).toHaveBeenCalledWith(...kubeConfigErrorGrowl('Generation failed'));
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

  describe('downloadKubeConfig', () => {
    let cluster: any;
    const mockGenerateKubeConfig = jest.fn();
    const mockDispatch = jest.fn();
    const mockConfig = 'apiVersion: v1\nkind: Config';

    beforeEach(() => {
      jest.clearAllMocks();
      cluster = new MgmtCluster({
        id:       'cluster-1',
        metadata: { name: 'cluster-1' }
      }, { dispatch: mockDispatch, rootGetters: { 'i18n/t': (key: string) => key } });
      cluster.generateKubeConfig = mockGenerateKubeConfig;
    });

    it('should download a kubeconfig named after the cluster', async() => {
      mockGenerateKubeConfig.mockResolvedValue(mockConfig);

      await cluster.downloadKubeConfig();

      expect(downloadFile).toHaveBeenCalledWith('cluster-1.yaml', mockConfig, 'application/yaml');
    });

    it('should not download a file when no config was generated', async() => {
      mockGenerateKubeConfig.mockResolvedValue(undefined);

      await cluster.downloadKubeConfig();

      expect(downloadFile).not.toHaveBeenCalled();
    });

    it('should not download a file when config generation fails', async() => {
      mockGenerateKubeConfig.mockRejectedValue(new Error('Generation failed'));

      await expect(cluster.downloadKubeConfig()).resolves.toBeUndefined();
      expect(downloadFile).not.toHaveBeenCalled();
    });

    it('should growl the error message when config generation fails', async() => {
      mockGenerateKubeConfig.mockRejectedValue(new Error('Generation failed'));

      await cluster.downloadKubeConfig();

      expect(mockDispatch).toHaveBeenCalledWith(...kubeConfigErrorGrowl('Generation failed'));
    });
  });

  describe('downloadKubeConfigBulk', () => {
    let cluster: any;
    const mockGenerateKubeConfig = jest.fn();
    const mockDispatch = jest.fn();
    const mockConfig = 'apiVersion: v1\nkind: Config';

    beforeEach(() => {
      jest.clearAllMocks();
      cluster = new MgmtCluster({ id: 'cluster-1' }, { dispatch: mockDispatch, rootGetters: { 'i18n/t': (key: string) => key } });
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

    it('should not download a file and should growl when config generation fails', async() => {
      mockGenerateKubeConfig.mockRejectedValue(new Error('Generation failed'));

      await expect(cluster.downloadKubeConfigBulk([{ id: 'mgmt-1' }])).resolves.toBeUndefined();
      expect(downloadFile).not.toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(...kubeConfigErrorGrowl('Generation failed'));
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

    it('pin sends a single PINNED_CLUSTERS mutation that adds the cluster at the top, idempotently', async() => {
      const { cluster, calls } = makeCluster('c-a');

      await cluster.pin();

      const mutations = calls[0].payload;

      expect(mutations).toHaveLength(1);
      expect(mutations[0].key).toBe(PINNED_CLUSTERS);
      expect(mutations[0].apply([])).toStrictEqual(['c-a']);
      // The shelf renders this pref in order, so a new pin belongs at the head of it.
      expect(mutations[0].apply(['c-b'])).toStrictEqual(['c-a', 'c-b']);
      expect(mutations[0].apply(['c-a'])).toStrictEqual(['c-a']); // already pinned — no duplicate
      // Re-pinning one that is already down the list moves it up rather than adding it twice.
      expect(mutations[0].apply(['c-b', 'c-a', 'c-c'])).toStrictEqual(['c-a', 'c-b', 'c-c']);
    });

    // RECENT is a log of clusters the user actually went to, so unpinning must not write to it: an
    // unpinned cluster keeps whatever place its own visits earned, and one never visited stays absent.
    it('unpin touches PINNED only', async() => {
      const { cluster, calls } = makeCluster('c-a');

      await cluster.unpin();

      const mutations = calls[0].payload;

      expect(calls.map((c) => c.action)).toStrictEqual(['prefs/applyPrefsOptimistic', 'prefs/reconcilePrefs']);
      expect(mutations.map((m: any) => m.key)).toStrictEqual([PINNED_CLUSTERS]);
      expect(mutations[0].apply(['c-a', 'c-b'])).toStrictEqual(['c-b']);
    });

    it('unpin of local touches PINNED only', async() => {
      const { cluster, calls } = makeCluster('local');

      await cluster.unpin();

      const mutations = calls[0].payload;

      expect(mutations.map((m: any) => m.key)).toStrictEqual([PINNED_CLUSTERS]);
      expect(mutations[0].apply(['local', 'c-b'])).toStrictEqual(['c-b']);
    });

    it('pinBulk pins a whole selection in one write, in the order selected', async() => {
      const { cluster, calls } = makeCluster('c-a');

      await cluster.pinBulk([{ id: 'c-a' }, { id: 'prov-b', mgmt: { id: 'c-b' } }]);

      expect(calls.map((c) => c.action)).toStrictEqual(['prefs/applyPrefsOptimistic', 'prefs/reconcilePrefs']);

      const mutations = calls[0].payload;

      expect(mutations).toHaveLength(1);
      expect(mutations[0].key).toBe(PINNED_CLUSTERS);
      expect(mutations[0].apply(['c-z'])).toStrictEqual(['c-a', 'c-b', 'c-z']);
      expect(mutations[0].apply(['c-b'])).toStrictEqual(['c-a', 'c-b']);
    });

    it('unpinBulk unpins a whole selection in one write, leaving the rest pinned', async() => {
      const { cluster, calls } = makeCluster('c-a');

      await cluster.unpinBulk([{ id: 'c-a' }, { id: 'prov-b', mgmt: { id: 'c-b' } }]);

      const mutations = calls[0].payload;

      expect(mutations).toHaveLength(1);
      expect(mutations[0].apply(['c-a', 'c-z', 'c-b'])).toStrictEqual(['c-z']);
    });
  });

  describe('isAutoscalerEnabled', () => {
    const makeCluster = (machinePools: any[] | undefined) => {
      const provCluster = machinePools === undefined ? undefined : { spec: { rkeConfig: { machinePools } } };

      return new MgmtCluster({ id: 'c-a', metadata: { name: 'c-a' } }, {
        rootGetters: { 'management/byId': (type: string) => (type === CAPI.RANCHER_CLUSTER ? provCluster : undefined) },
        getters:     {},
      });
    };

    it.each([
      ['a pool with both bounds', [{ autoscalingMinSize: 1, autoscalingMaxSize: 4 }], true],
      ['a pool with only a min bound', [{ autoscalingMinSize: 1 }], false],
      ['a pool with only a max bound', [{ autoscalingMaxSize: 4 }], false],
      ['one autoscaling pool among several', [{ quantity: 1 }, { autoscalingMinSize: 1, autoscalingMaxSize: 4 }], true],
      ['no autoscaling pools', [{ quantity: 1 }], false],
      ['no pools', [], false],
      ['no provisioning cluster', undefined, false],
    ])('should report %s', (_label, machinePools, expected) => {
      expect(makeCluster(machinePools).isAutoscalerEnabled).toStrictEqual(expected);
    });
  });

  describe('pin actions', () => {
    const dispatch = jest.fn();

    const mgmtCluster = (id: string, pinned: string[] = []) => new MgmtCluster({ id, links: {} }, {
      dispatch,
      rootGetters: {
        'i18n/t':               (key: string) => key,
        'prefs/get':            () => pinned,
        'management/schemaFor': () => undefined,
        isRancher:              true,
      },
    }) as any;

    const actionsOf = (cluster: any) => {
      jest.spyOn(Object.getPrototypeOf(MgmtCluster.prototype), '_availableActions', 'get').mockReturnValue([]);

      return cluster._availableActions;
    };

    const pinAction = (cluster: any, action: string) => actionsOf(cluster).find((a: any) => a.action === action);

    beforeEach(() => dispatch.mockClear());

    it('offers the pin only while the cluster is unpinned, and the unpin only while it is pinned', () => {
      const unpinned = mgmtCluster('c-a');
      const pinned = mgmtCluster('c-a', ['c-a']);

      expect(pinAction(unpinned, 'pinCluster').enabled).toBe(true);
      expect(pinAction(unpinned, 'unpinCluster').enabled).toBe(false);
      expect(pinAction(pinned, 'pinCluster').enabled).toBe(false);
      expect(pinAction(pinned, 'unpinCluster').enabled).toBe(true);
    });

    it('offers neither for local', () => {
      const local = mgmtCluster('local');

      jest.spyOn(local, 'isLocal', 'get').mockReturnValue(true);

      expect(pinAction(local, 'pinCluster').enabled).toBe(false);
      expect(pinAction(local, 'unpinCluster').enabled).toBe(false);
    });

    it('matches the provisioning cluster pair, so a mixed selection shares one bulk Pin and Unpin', () => {
      const bulk = actionsOf(mgmtCluster('c-a'))
        .filter((a: any) => a.bulkable)
        .sort((a: any, b: any) => (b.weight || 0) - (a.weight || 0));

      expect(bulk.slice(0, 2).map(({ action, bulkAction }: any) => ({ action, bulkAction }))).toStrictEqual([
        { action: 'pinCluster', bulkAction: 'pinClusterBulk' },
        { action: 'unpinCluster', bulkAction: 'unpinClusterBulk' },
      ]);
    });

    it.each([
      ['pinCluster', 'pin'],
      ['unpinCluster', 'unpin'],
    ])('%s writes through %s', async(action, method) => {
      const cluster = mgmtCluster('c-a');
      const write = jest.spyOn(cluster, method).mockResolvedValue({});

      await cluster[action]();

      expect(write).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['pinClusterBulk', 'pinBulk'],
      ['unpinClusterBulk', 'unpinBulk'],
    ])('%s hands the whole selection to %s, for one write', async(action, method) => {
      const cluster = mgmtCluster('c-a');
      const write = jest.spyOn(cluster, method).mockResolvedValue({});
      const items = [{ id: 'c-a' }, { id: 'c-b' }];

      await cluster[action](items);

      expect(write).toHaveBeenCalledWith(items);
    });

    it.each([
      ['pinCluster', 'pin'],
      ['unpinCluster', 'unpin'],
      ['pinClusterBulk', 'pinBulk'],
      ['unpinClusterBulk', 'unpinBulk'],
    ])('%s growls when the preference write is rejected', async(action, method) => {
      const cluster = mgmtCluster('c-a');

      jest.spyOn(cluster, method).mockResolvedValue({ type: 'error', status: 500 });

      await cluster[action]([]);

      expect(dispatch).toHaveBeenCalledWith('growl/fromError', expect.objectContaining({ title: 'nav.pinClusterError' }), { root: true });
    });

    it('stays quiet when the preference write lands', async() => {
      const cluster = mgmtCluster('c-a');

      jest.spyOn(cluster, 'pin').mockResolvedValue({});

      await cluster.pinCluster();

      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('isVersionManagementEnabled', () => {
    const createCluster = (annotation: string | undefined, globalSetting: string | undefined) => {
      const byId = jest.fn((type: string, id: string) => {
        if (type === MANAGEMENT.SETTING && id === SETTING.IMPORTED_CLUSTER_VERSION_MANAGEMENT && globalSetting !== undefined) {
          return { value: globalSetting };
        }

        return undefined;
      });
      const annotations = annotation === undefined ? {} : { [IMPORTED_CLUSTER_VERSION_MANAGEMENT]: annotation };

      return new MgmtCluster({ metadata: { annotations } }, { rootGetters: { 'management/byId': byId } });
    };

    it.each([
      ['true', 'false', true],
      ['true', undefined, true],
      ['false', 'true', false],
      ['false', undefined, false],
      ['system-default', 'true', true],
      ['system-default', 'false', false],
      ['system-default', undefined, false],
      [undefined, 'true', true],
      [undefined, 'false', false],
      [undefined, undefined, false],
      ['unexpected', 'true', true],
      ['unexpected', 'false', false],
    ])('annotation %p with global setting %p should be %p', (annotation, globalSetting, expected) => {
      expect(createCluster(annotation, globalSetting).isVersionManagementEnabled).toBe(expected);
    });
  });
});
