import { nextTick } from 'vue';
import { shallowMount } from '@vue/test-utils';
import PromptRestore from '@shell/components/PromptRestore.vue';
import { createStore } from 'vuex';
import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { CAPI, MANAGEMENT, OPERATION, SNAPSHOT } from '@shell/config/types';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { createOperationCR } from '@shell/utils/operation-cr';

jest.mock('@shell/utils/operation-cr', () => ({ createOperationCR: jest.fn() }));

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

describe('component: PromptRestore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const rke2TestCases = [
    [[], 0],
    [[RKE2_FAILED_SNAPSHOT], 0],
    [[RKE2_SUCCESSFUL_SNAPSHOT_1], 1],
    [[RKE2_SUCCESSFUL_SNAPSHOT_1, RKE2_SUCCESSFUL_SNAPSHOT_2], 2],
    [[RKE2_FAILED_SNAPSHOT, RKE2_SUCCESSFUL_SNAPSHOT_1, RKE2_SUCCESSFUL_SNAPSHOT_2], 2]
  ];

  it.each(rke2TestCases)('should list RKE2 snapshots properly', async(snapShots, expected) => {
    const store = createStore({
      modules: {
        'action-menu': {
          namespaced: true,
          state:      {
            showPromptRestore: true,
            toRestore:         [{
              isRke2:   true,
              type:     CAPI.RANCHER_CLUSTER,
              metadata: { name: RKE2_CLUSTER_NAME },
              snapShots
            }]
          },
        },
      },
      getters: { 'i18n/t': () => jest.fn(), 'prefs/get': () => jest.fn() },
      actions: { 'management/findAll': jest.fn().mockResolvedValue(snapShots), 'rancher/findAll': jest.fn().mockResolvedValue([]) }
    });

    const wrapper = shallowMount(
      PromptRestore as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      { global: { mocks: { $store: store } } }
    );

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
      modules: {
        'action-menu': {
          namespaced: true,
          state:      {
            showPromptRestore: true,
            toRestore:         [importedCluster]
          },
          mutations: { togglePromptRestore: jest.fn() }
        },
      },
      getters,
      actions: {
        'management/findAll': jest.fn().mockResolvedValue([]),
        'growl/success':      jest.fn(),
      }
    });

    const wrapper = shallowMount(
      PromptRestore as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      { global: { mocks: { $store: store } } }
    );

    wrapper.vm.allSnapshots = {
      'snapshot-1': {
        name:         'snapshot-1',
        snapshotFile: { name: 'snapshot-file-1' }
      }
    };
    wrapper.vm.selectedSnapshot = 'snapshot-1';

    await wrapper.vm.apply(buttonDone);

    expect(createOperationCR).toHaveBeenCalledTimes(1);
    expect((createOperationCR as jest.Mock).mock.calls[0][1]).toBe(OPERATION.ETCD_SNAPSHOT_RESTORE);
    expect((createOperationCR as jest.Mock).mock.calls[0][2]).toStrictEqual({
      clusterRef: {
        apiVersion: 'management.cattle.io/v3',
        kind:       'Cluster',
        name:       'c-m-imported',
      },
      args: { name: 'snapshot-file-1' },
    });
    expect((createOperationCR as jest.Mock).mock.calls[0][3]).toBe('c-m-imported');
    expect((createOperationCR as jest.Mock).mock.calls[0][4]).toBe('c-m-imported');
    expect(clusterSave).not.toHaveBeenCalled();
    expect(buttonDone).toHaveBeenCalledWith(true);
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
      modules: {
        'action-menu': {
          namespaced: true,
          state:      {
            showPromptRestore: true,
            toRestore:         [{
              type:         SNAPSHOT,
              metadata:     { namespace: 'fleet-default' },
              spec:         { clusterName: 'imported-cluster', clusterRef: { name: 'c-m-imported' } },
              snapshotFile: { name: 'snapshot-file-2' },
              nameDisplay:  'snapshot-2',
            }]
          },
          mutations: { togglePromptRestore: jest.fn() }
        },
      },
      getters,
      actions: { 'growl/success': jest.fn() }
    });

    const wrapper = shallowMount(
      PromptRestore as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      { global: { mocks: { $store: store } } }
    );

    await wrapper.vm.apply(buttonDone);

    expect(createOperationCR).toHaveBeenCalledTimes(1);
    expect((createOperationCR as jest.Mock).mock.calls[0][1]).toBe(OPERATION.ETCD_SNAPSHOT_RESTORE);
    expect((createOperationCR as jest.Mock).mock.calls[0][2]).toStrictEqual({
      clusterRef: {
        apiVersion: 'management.cattle.io/v3',
        kind:       'Cluster',
        name:       'c-m-imported',
      },
      args: { name: 'snapshot-file-2' },
    });
    expect((createOperationCR as jest.Mock).mock.calls[0][3]).toBe('c-m-imported');
    expect((createOperationCR as jest.Mock).mock.calls[0][4]).toBe('c-m-imported');
    expect(buttonDone).toHaveBeenCalledWith(true);
    expect(byId).toHaveBeenCalledWith(CAPI.RANCHER_CLUSTER, 'fleet-default/imported-cluster');
  });
});
