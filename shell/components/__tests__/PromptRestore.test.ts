import { nextTick } from 'vue';
import { shallowMount } from '@vue/test-utils';
import PromptRestore from '@shell/components/PromptRestore.vue';
import { createStore } from 'vuex';
import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { CAPI } from '@shell/config/types';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

const RKE2_CLUSTER_NAME = 'rke2_cluster_name';
const RKE2_SUCCESSFUL_SNAPSHOT_1 = {
  clusterName:  RKE2_CLUSTER_NAME,
  type:         CAPI.RANCHER_CLUSTER,
  created:      'Thu Jul 20 2023 11:11:39',
  snapshotFile: { status: STATES_ENUM.SUCCESSFUL },
  id:           'rke2_id_1',
  name:         'rke2_name_1'
};
const RKE2_SUCCESSFUL_SNAPSHOT_2 = {
  clusterName:  RKE2_CLUSTER_NAME,
  type:         CAPI.RANCHER_CLUSTER,
  created:      'Thu Jul 20 2022 11:11:39',
  snapshotFile: { status: STATES_ENUM.SUCCESSFUL },
  id:           'rke2_id_2',
  name:         'rke2_name_2'
};
const RKE2_FAILED_SNAPSHOT = {
  clusterName:  RKE2_CLUSTER_NAME,
  type:         CAPI.RANCHER_CLUSTER,
  created:      'Thu Jul 20 2021 11:11:39',
  snapshotFile: { status: STATES_ENUM.FAILED },
  id:           'rke2_id_3',
  name:         'rke2_name_3'
};

describe('component: PromptRestore', () => {
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
});
