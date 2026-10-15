import { nextTick } from 'vue';
import { flushPromises, mount, shallowMount } from '@vue/test-utils';
import PromptRestore from '@shell/dialog/PromptRestore.vue';
import DateFormatter from '@shell/components/formatter/Date.vue';
import { createStore } from 'vuex';
import { CAPI, MANAGEMENT, OPERATION, SNAPSHOT } from '@shell/config/types';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { createOperationCR } from '@shell/utils/operation-cr';

jest.mock('@shell/utils/operation-cr', () => ({ createOperationCR: jest.fn() }));
jest.mock('focus-trap', () => ({
  createFocusTrap: jest.fn(() => ({
    activate:   jest.fn(),
    deactivate: jest.fn(),
  })),
}));

const RKE2_CLUSTER_NAME = 'rke2_cluster_name';
const RKE2_SUCCESSFUL_SNAPSHOT_1 = {
  clusterName:    RKE2_CLUSTER_NAME,
  type:           CAPI.RANCHER_CLUSTER,
  created:        'Thu Jul 20 2023 11:11:39',
  restoreEnabled: true,
  snapshotFile:   { status: STATES_ENUM.SUCCESSFUL },
  id:             'rke2_id_1',
  name:           'rke2_name_1'
};
const RKE2_SUCCESSFUL_SNAPSHOT_2 = {
  clusterName:    RKE2_CLUSTER_NAME,
  type:           CAPI.RANCHER_CLUSTER,
  created:        'Thu Jul 20 2022 11:11:39',
  restoreEnabled: true,
  snapshotFile:   { status: STATES_ENUM.SUCCESSFUL },
  id:             'rke2_id_2',
  name:           'rke2_name_2'
};
const RKE2_FAILED_SNAPSHOT = {
  clusterName:    RKE2_CLUSTER_NAME,
  type:           CAPI.RANCHER_CLUSTER,
  created:        'Thu Jul 20 2021 11:11:39',
  restoreEnabled: false,
  snapshotFile:   { status: STATES_ENUM.FAILED },
  id:             'rke2_id_3',
  name:           'rke2_name_3'
};

type Rke2Snapshot = typeof RKE2_SUCCESSFUL_SNAPSHOT_1;

describe('component: PromptRestore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const rke2TestCases: Array<[Rke2Snapshot[], number]> = [
    [[], 0],
    [[RKE2_FAILED_SNAPSHOT], 0],
    [[RKE2_SUCCESSFUL_SNAPSHOT_1], 1],
    [[RKE2_SUCCESSFUL_SNAPSHOT_1, RKE2_SUCCESSFUL_SNAPSHOT_2], 2],
    [[RKE2_FAILED_SNAPSHOT, RKE2_SUCCESSFUL_SNAPSHOT_1, RKE2_SUCCESSFUL_SNAPSHOT_2], 2]
  ];

  it.each(rke2TestCases)('should list RKE2 snapshots properly', async(snapShots: Rke2Snapshot[], expected: number) => {
    const store = createStore({
      getters: { 'i18n/t': () => jest.fn(), 'prefs/get': () => jest.fn() },
      actions: { 'management/findAll': jest.fn().mockResolvedValue(snapShots), 'rancher/findAll': jest.fn().mockResolvedValue([]) }
    });

    const wrapper = shallowMount(PromptRestore, {
      props: {
        resources: [{
          isRke2:   true,
          type:     CAPI.RANCHER_CLUSTER,
          metadata: { name: RKE2_CLUSTER_NAME },
          snapShots
        }],
        modal: { show: true, onClose: jest.fn() }
      },
      global: { mocks: { $store: store } }
    });

    await wrapper.vm.fetchSnapshots();
    await nextTick();

    expect(wrapper.vm.clusterSnapshots).toHaveLength(expected);
  });

  it('should restore imported cluster via operation CR', async() => {
    (createOperationCR as jest.Mock).mockResolvedValue(undefined);
    const clusterSave = jest.fn();
    const buttonDone = jest.fn();

    const importedCluster = {
      isImported:              true,
      isImportedWithDayTwoOps: true,
      type:                    CAPI.RANCHER_CLUSTER,
      metadata:                { name: 'imported-cluster' },
      mgmt:                    { id: 'c-m-imported' },
      save:                    clusterSave,
    };

    const getters: any = {};

    getters['i18n/t'] = () => (key: string) => key;

    const store = createStore({
      getters,
      actions: {
        'management/findAll': jest.fn().mockResolvedValue([]),
        'growl/success':      jest.fn(),
      }
    });

    const wrapper = shallowMount(PromptRestore, { props: { resources: [importedCluster], modal: { show: true, onClose: jest.fn() } }, global: { mocks: { $store: store } } });

    await flushPromises();
    wrapper.vm.allSnapshots = {
      'snapshot-1': {
        name:     'snapshot-1',
        metadata: { name: 'snapshot-1' }
      }
    };
    (wrapper.vm as any).selectedSnapshot = 'snapshot-1';

    await wrapper.vm.apply(buttonDone);

    expect(createOperationCR).toHaveBeenCalledTimes(1);
    expect((createOperationCR as jest.Mock).mock.calls[0][1]).toBe(OPERATION.ETCD_SNAPSHOT_RESTORE);
    expect((createOperationCR as jest.Mock).mock.calls[0][2]).toStrictEqual({
      clusterRef: {
        apiVersion: 'management.cattle.io/v3',
        kind:       'Cluster',
        name:       'c-m-imported',
      },
      args: { name: 'snapshot-1', restoreMode: 'none' },
    });
    expect((createOperationCR as jest.Mock).mock.calls[0][3]).toBe('c-m-imported');
    expect((createOperationCR as jest.Mock).mock.calls[0][4]).toBe('c-m-imported');
    expect(clusterSave).not.toHaveBeenCalled();
    expect(buttonDone).toHaveBeenCalledWith(true);
  });

  it('should not report the restore as started when the operation CR cannot be created', async() => {
    (createOperationCR as jest.Mock).mockRejectedValue({ status: 403, message: 'forbidden' });
    const buttonDone = jest.fn();
    const growlSuccess = jest.fn();

    const importedCluster = {
      isImported:              true,
      isImportedWithDayTwoOps: true,
      type:                    CAPI.RANCHER_CLUSTER,
      metadata:                { name: 'imported-cluster' },
      mgmt:                    { id: 'c-m-imported' },
      save:                    jest.fn(),
    };

    const getters: any = {};

    getters['i18n/t'] = () => (key: string) => key;

    const store = createStore({
      getters,
      actions: {
        'management/findAll': jest.fn().mockResolvedValue([]),
        'growl/success':      growlSuccess,
      }
    });

    const wrapper = shallowMount(PromptRestore, { props: { resources: [importedCluster], modal: { show: true, onClose: jest.fn() } }, global: { mocks: { $store: store } } });

    await flushPromises();
    wrapper.vm.allSnapshots = {
      'snapshot-1': {
        name:     'snapshot-1',
        metadata: { name: 'snapshot-1' }
      }
    };
    (wrapper.vm as any).selectedSnapshot = 'snapshot-1';

    await wrapper.vm.apply(buttonDone);

    expect(growlSuccess).toHaveBeenCalledTimes(0);
    expect((wrapper.vm as any).errors).toStrictEqual(['forbidden']);
    expect(buttonDone).toHaveBeenCalledWith(false);
  });

  it('should restore imported snapshot by resolving target cluster from store', async() => {
    (createOperationCR as jest.Mock).mockResolvedValue(undefined);
    const buttonDone = jest.fn();
    const byId = jest.fn();

    const importedCluster = {
      id:                      'fleet-default/imported-cluster',
      isImportedWithDayTwoOps: true,
      mgmt:                    { id: 'c-m-imported' },
      isImported:              true,
    };

    byId.mockImplementation((type: string, id: string) => {
      if (type === CAPI.RANCHER_CLUSTER && id === 'fleet-default/imported-cluster') {
        return importedCluster;
      }

      if (type === MANAGEMENT.CLUSTER && id === 'c-m-imported') {
        return importedCluster.mgmt;
      }

      return null;
    });

    const getters: any = {};

    getters['i18n/t'] = () => (key: string) => key;
    getters['management/byId'] = () => byId;

    const store = createStore({
      getters,
      actions: { 'growl/success': jest.fn() }
    });

    const wrapper = shallowMount(PromptRestore, {
      props: {
        resources: [{
          type:         SNAPSHOT,
          metadata:     { namespace: 'fleet-default', name: 'snapshot-file-2' },
          spec:         { clusterName: 'imported-cluster', clusterRef: { name: 'c-m-imported' } },
          snapshotFile: { name: 'snapshot-file-2' },
          nameDisplay:  'snapshot-2',
        }],
        modal: { show: true, onClose: jest.fn() }
      },
      global: { mocks: { $store: store } }
    });

    await wrapper.vm.apply(buttonDone);

    expect(createOperationCR).toHaveBeenCalledTimes(1);
    expect((createOperationCR as jest.Mock).mock.calls[0][1]).toBe(OPERATION.ETCD_SNAPSHOT_RESTORE);
    expect((createOperationCR as jest.Mock).mock.calls[0][2]).toStrictEqual({
      clusterRef: {
        apiVersion: 'management.cattle.io/v3',
        kind:       'Cluster',
        name:       'c-m-imported',
      },
      args: { name: 'snapshot-file-2', restoreMode: 'none' },
    });
    expect((createOperationCR as jest.Mock).mock.calls[0][3]).toBe('c-m-imported');
    expect((createOperationCR as jest.Mock).mock.calls[0][4]).toBe('c-m-imported');
    expect(buttonDone).toHaveBeenCalledWith(true);
    expect(byId).toHaveBeenCalledWith(CAPI.RANCHER_CLUSTER, 'fleet-default/imported-cluster');
  });

  describe('restore mode', () => {
    const ALL_MODES = ['none', 'kubernetesVersion', 'all'];

    const createWrapper = (toRestore: any[]) => {
      const getters: any = {};

      getters['i18n/t'] = () => (key: string) => key;
      getters['prefs/get'] = () => jest.fn();

      const store = createStore({
        getters,
        actions: {
          'management/findAll': jest.fn().mockResolvedValue([]),
          'growl/success':      jest.fn(),
        }
      });

      return shallowMount(PromptRestore, { props: { resources: toRestore, modal: { show: true, onClose: jest.fn() } }, global: { mocks: { $store: store } } });
    };

    const importedCluster = (isVersionManagementEnabled: boolean) => ({
      isImported:              true,
      isImportedWithDayTwoOps: true,
      type:                    CAPI.RANCHER_CLUSTER,
      metadata:                { name: 'imported-cluster' },
      mgmt:                    { id: 'c-m-imported', isVersionManagementEnabled },
      save:                    jest.fn(),
    });

    const rke2Cluster = () => ({
      isRke2:   true,
      type:     CAPI.RANCHER_CLUSTER,
      metadata: { name: RKE2_CLUSTER_NAME },
      spec:     { rkeConfig: {} },
      save:     jest.fn(),
    });

    // Let the dialog's own snapshot fetch (on open) settle first, so it can't overwrite the seeded snapshots
    const selectSnapshot = async(wrapper: any, name: string) => {
      await flushPromises();
      wrapper.vm.allSnapshots = { [name]: { name, metadata: { name } } };
      wrapper.vm.selectedSnapshot = name;
    };

    it.each([
      ['rke2 cluster', rke2Cluster(), ALL_MODES],
      ['imported cluster with version management enabled', importedCluster(true), ALL_MODES],
      ['imported cluster with version management disabled', importedCluster(false), ['none']],
    ])('should offer the correct restore modes for an %s', (_desc, cluster, expected) => {
      const wrapper = createWrapper([cluster]);

      expect(wrapper.vm.restoreModeOptions).toStrictEqual(expected);
      expect(wrapper.vm.restoreModeLabels).toHaveLength(expected.length);
    });

    it('should not offer kubernetes version labels for an imported cluster with version management disabled', () => {
      const wrapper = createWrapper([importedCluster(false)]);

      expect(wrapper.vm.restoreModeLabels).toStrictEqual(['promptRestore.restoreMode.onlyEtcd']);
    });

    it.each([
      ['rke2 cluster', rke2Cluster(), 'all'],
      ['imported cluster with version management enabled', importedCluster(true), 'all'],
      ['imported cluster with version management disabled', importedCluster(false), 'none'],
    ])('should default the restore mode for an %s when the dialog opens', async(_desc, cluster, expected) => {
      const wrapper = createWrapper([cluster]);

      await flushPromises();

      expect((wrapper.vm as any).restoreMode).toBe(expected);
    });

    it.each(ALL_MODES)('should send the selected restore mode %p for an imported cluster with version management enabled', async(mode) => {
      (createOperationCR as jest.Mock).mockResolvedValue(undefined);
      const wrapper = createWrapper([importedCluster(true)]);

      await selectSnapshot(wrapper, 'snapshot-1');
      (wrapper.vm as any).restoreMode = mode;

      await wrapper.vm.apply(jest.fn());

      expect((createOperationCR as jest.Mock).mock.calls[0][2].args).toStrictEqual({ name: 'snapshot-1', restoreMode: mode });
    });

    it.each(['kubernetesVersion', 'all'])('should never send restore mode %p for an imported cluster with version management disabled', async(mode) => {
      (createOperationCR as jest.Mock).mockResolvedValue(undefined);
      const wrapper = createWrapper([importedCluster(false)]);

      await selectSnapshot(wrapper, 'snapshot-1');
      (wrapper.vm as any).restoreMode = mode;

      await wrapper.vm.apply(jest.fn());

      expect((createOperationCR as jest.Mock).mock.calls[0][2].args).toStrictEqual({ name: 'snapshot-1', restoreMode: 'none' });
    });

    it('should reset an unavailable restore mode when the available modes change', async() => {
      const cluster = importedCluster(true);
      const wrapper = createWrapper([cluster]);

      (wrapper.vm as any).restoreMode = 'kubernetesVersion';
      await wrapper.setProps({ resources: [importedCluster(false)] });

      expect((wrapper.vm as any).restoreMode).toBe('none');
    });

    it.each(ALL_MODES)('should keep setting restoreRKEConfig %p for an rke2 cluster', async(mode) => {
      const cluster = rke2Cluster();
      const wrapper = createWrapper([cluster]);

      await selectSnapshot(wrapper, 'snapshot-1');
      (wrapper.vm as any).restoreMode = mode;

      await wrapper.vm.apply(jest.fn());

      expect(createOperationCR).not.toHaveBeenCalled();
      expect(cluster.spec.rkeConfig).toStrictEqual({
        etcdSnapshotRestore: {
          generation: 1, name: 'snapshot-1', restoreRKEConfig: mode
        }
      });
      expect(cluster.save).toHaveBeenCalledWith();
    });

    describe('restore-mode-options snapshot annotation', () => {
      const RESTORE_MODE_OPTIONS = 'etcdsnapshot.rke.io/restore-mode-options';

      const snapshotWith = (name: string, annotation?: string) => ({
        name,
        metadata: { name, annotations: annotation === undefined ? {} : { [RESTORE_MODE_OPTIONS]: annotation } }
      });

      const selectSnapshots = async(wrapper: any, snapshots: any[], selected: string) => {
        await flushPromises();
        wrapper.vm.allSnapshots = snapshots.reduce((acc: any, snap: any) => ({ ...acc, [snap.name]: snap }), {});
        wrapper.vm.selectedSnapshot = selected;
        await nextTick();
      };

      it.each([
        ['rke2 cluster', rke2Cluster, 'none', ['none']],
        ['rke2 cluster', rke2Cluster, 'none,kubernetesVersion', ['none', 'kubernetesVersion']],
        ['rke2 cluster', rke2Cluster, 'all,none', ['none', 'all']],
        ['rke2 cluster', rke2Cluster, ' none , all ,, ', ['none', 'all']],
        ['rke2 cluster', rke2Cluster, 'none,somethingNew,all', ['none', 'all']],
        ['imported cluster with version management enabled', () => importedCluster(true), 'none,kubernetesVersion', ['none', 'kubernetesVersion']],
        ['imported cluster with version management enabled', () => importedCluster(true), 'none,kubernetesVersion,all', ALL_MODES],
      ])('should only offer the modes the snapshot annotation lists for an %s (annotation %p)', async(_desc, cluster, annotation, expected) => {
        const wrapper = createWrapper([cluster()]);

        await selectSnapshots(wrapper, [snapshotWith('snapshot-1', annotation)], 'snapshot-1');

        expect(wrapper.vm.restoreModeOptions).toStrictEqual(expected);
      });

      it.each([
        ['rke2 cluster', rke2Cluster, undefined, ALL_MODES],
        ['rke2 cluster', rke2Cluster, '', ALL_MODES],
        ['rke2 cluster', rke2Cluster, ' , ', ALL_MODES],
        ['imported cluster with version management enabled', () => importedCluster(true), undefined, ALL_MODES],
        ['imported cluster with version management disabled', () => importedCluster(false), undefined, ['none']],
      ])('should fall back to the default modes for an %s when the annotation is %p', async(_desc, cluster, annotation, expected) => {
        const wrapper = createWrapper([cluster()]);

        await selectSnapshots(wrapper, [snapshotWith('snapshot-1', annotation)], 'snapshot-1');

        expect(wrapper.vm.restoreModeOptions).toStrictEqual(expected);
      });

      it.each([
        'none,kubernetesVersion,all',
        'kubernetesVersion,all',
      ])('should keep kubernetes version modes hidden for an imported cluster with version management disabled (annotation %p)', async(annotation) => {
        const wrapper = createWrapper([importedCluster(false)]);

        await selectSnapshots(wrapper, [snapshotWith('snapshot-1', annotation)], 'snapshot-1');

        expect(wrapper.vm.restoreModeOptions).toStrictEqual(['none']);
        expect(wrapper.vm.restoreModeLabels).toStrictEqual(['promptRestore.restoreMode.onlyEtcd']);
      });

      it.each([
        'somethingNew',
        'kubernetesVersion',
      ])('should fall back to "none" when nothing in annotation %p is allowed', async(annotation) => {
        const wrapper = createWrapper([importedCluster(false)]);

        await selectSnapshots(wrapper, [snapshotWith('snapshot-1', annotation)], 'snapshot-1');

        expect(wrapper.vm.restoreModeOptions).toStrictEqual(['none']);
      });

      it('should reset the selection to the last offered mode when the selected snapshot no longer offers it', async() => {
        const wrapper = createWrapper([rke2Cluster()]);
        const snapshots = [snapshotWith('snapshot-all', 'none,kubernetesVersion,all'), snapshotWith('snapshot-k8s', 'none,kubernetesVersion'), snapshotWith('snapshot-none', 'none')];

        await selectSnapshots(wrapper, snapshots, 'snapshot-all');
        (wrapper.vm as any).restoreMode = 'all';

        (wrapper.vm as any).selectedSnapshot = 'snapshot-k8s';
        await nextTick();
        expect((wrapper.vm as any).restoreMode).toBe('kubernetesVersion');

        (wrapper.vm as any).selectedSnapshot = 'snapshot-none';
        await nextTick();
        expect((wrapper.vm as any).restoreMode).toBe('none');
      });

      it('should keep the selection when the newly selected snapshot still offers it', async() => {
        const wrapper = createWrapper([rke2Cluster()]);
        const snapshots = [snapshotWith('snapshot-all', 'none,kubernetesVersion,all'), snapshotWith('snapshot-k8s', 'none,kubernetesVersion')];

        await selectSnapshots(wrapper, snapshots, 'snapshot-all');
        (wrapper.vm as any).restoreMode = 'kubernetesVersion';

        (wrapper.vm as any).selectedSnapshot = 'snapshot-k8s';
        await nextTick();
        expect((wrapper.vm as any).restoreMode).toBe('kubernetesVersion');
      });

      it('should send a mode offered by the annotation for an imported cluster', async() => {
        (createOperationCR as jest.Mock).mockResolvedValue(undefined);
        const wrapper = createWrapper([importedCluster(true)]);

        await selectSnapshots(wrapper, [snapshotWith('snapshot-1', 'none,kubernetesVersion')], 'snapshot-1');

        expect((wrapper.vm as any).restoreMode).toBe('kubernetesVersion');

        await wrapper.vm.apply(jest.fn());

        expect((createOperationCR as jest.Mock).mock.calls[0][2].args).toStrictEqual({ name: 'snapshot-1', restoreMode: 'kubernetesVersion' });
      });
    });
  });

  describe('modal', () => {
    const SNAPSHOT_NAME = 'snapshot-file-1';

    const snapshotToRestore = (cluster: any) => ({
      type:        SNAPSHOT,
      name:        SNAPSHOT_NAME,
      nameDisplay: 'snapshot-1',
      metadata:    { namespace: 'fleet-default', name: SNAPSHOT_NAME },
      cluster,
    });

    const rke2Cluster = () => ({
      isRke2:   true,
      type:     CAPI.RANCHER_CLUSTER,
      metadata: { name: RKE2_CLUSTER_NAME },
      spec:     { rkeConfig: {} },
      save:     jest.fn(),
    });

    const mountDialog = (resources: any[], { show = true, growlSuccess = jest.fn() } = {}) => {
      const getters: any = {};

      getters['i18n/t'] = () => (key: string) => key;
      getters['i18n/exists'] = () => () => false;
      getters['prefs/get'] = () => jest.fn();

      const store = createStore({ getters, actions: { 'growl/success': growlSuccess, 'management/findAll': jest.fn().mockResolvedValue([]) } });
      const onClose = jest.fn();

      const wrapper = mount(PromptRestore, {
        props:  { resources, modal: { show, onClose } },
        global: { mocks: { $store: store }, stubs: { teleport: true } },
      });

      return { wrapper, onClose };
    };

    const title = (wrapper: any) => wrapper.find('[data-testid="rc-modal-title"]');
    const cancelButton = (wrapper: any) => wrapper.find('[data-testid="rc-modal-cancel"]');
    const confirmButton = (wrapper: any) => wrapper.find('[data-testid="restore-snapshot-confirm"]');

    it('should render the dialog in an RcModal titled for the restore', () => {
      const { wrapper } = mountDialog([snapshotToRestore(rke2Cluster())]);

      expect(title(wrapper).text()).toBe('promptRestore.title');
      expect(wrapper.find('[data-testid="restore-snapshot-name"]').text()).toBe('snapshot-1');
    });

    it('should render nothing until it is told to show', () => {
      const { wrapper } = mountDialog([snapshotToRestore(rke2Cluster())], { show: false });

      expect(title(wrapper).exists()).toBe(false);
    });

    it('should not render a date section', () => {
      const { wrapper } = mountDialog([snapshotToRestore(rke2Cluster())]);
      const body = wrapper.find('[data-testid="rc-modal-body"]');

      expect(body.text()).not.toContain('promptRestore.date');
      expect(body.findAll('h3').map((h: any) => h.text())).toStrictEqual(['%promptRestore.name%', 'promptRestore.restoreMode.label']);
      expect(body.findComponent(DateFormatter).exists()).toBe(false);
    });

    it('should close through the owner when cancelled', async() => {
      const { wrapper, onClose } = mountDialog([snapshotToRestore(rke2Cluster())]);

      await cancelButton(wrapper).trigger('click');

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should hold the restore button while no snapshot is selected', async() => {
      const { wrapper } = mountDialog([rke2Cluster()]);

      await flushPromises();

      expect(confirmButton(wrapper).attributes('disabled')).toBeDefined();
    });

    it('should offer the restore button for a snapshot', () => {
      const { wrapper } = mountDialog([snapshotToRestore(rke2Cluster())]);

      expect(confirmButton(wrapper).attributes('disabled')).toBeUndefined();
    });

    it('should show the restore modes for an rke2 cluster', () => {
      const { wrapper } = mountDialog([snapshotToRestore(rke2Cluster())]);

      expect(wrapper.find('[data-testid="restore-snapshot-mode"]').exists()).toBe(true);
    });

    it('should restore, report it and close once the restore is requested', async() => {
      const growlSuccess = jest.fn();
      const cluster = rke2Cluster();
      const { wrapper, onClose } = mountDialog([snapshotToRestore(cluster)], { growlSuccess });

      await confirmButton(wrapper).trigger('click');
      await flushPromises();

      expect(cluster.save).toHaveBeenCalledWith();
      expect(growlSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should stay open and show the error when the restore fails', async() => {
      const cluster = { ...rke2Cluster(), save: jest.fn().mockRejectedValue({ message: 'forbidden' }) };
      const { wrapper, onClose } = mountDialog([snapshotToRestore(cluster)]);

      await confirmButton(wrapper).trigger('click');
      await flushPromises();

      expect(onClose).not.toHaveBeenCalled();
      expect(title(wrapper).exists()).toBe(true);
      expect(wrapper.find('[data-testid="rc-modal-body"]').text()).toContain('forbidden');
    });
  });
});
