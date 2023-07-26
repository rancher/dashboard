import { shallowMount, createLocalVue } from '@vue/test-utils';
import PromptRestore from '@shell/components/PromptRestore.vue';
import Vuex from 'vuex';
import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { CAPI } from '@shell/config/types';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

const SUCCESSFUL_SNAPSHOT_1 = {
  isRke2:       true,
  type:         CAPI.RANCHER_CLUSTER,
  created:      'Thu Jul 20 2023 11:11:39',
  snapshotFile: { status: STATES_ENUM.SUCCESSFUL },
  id:           'id',
  name:         'name'
};
const SUCCESSFUL_SNAPSHOT_2 = {
  isRke2:       true,
  type:         CAPI.RANCHER_CLUSTER,
  created:      'Thu Jul 20 2022 11:11:39',
  snapshotFile: { status: STATES_ENUM.SUCCESSFUL },
  id:           'id2',
  name:         'name2'
};
const FAILED_SNAPSHOT = {
  isRke2:       true,
  type:         CAPI.RANCHER_CLUSTER,
  created:      'Thu Jul 20 2021 11:11:39',
  snapshotFile: { status: STATES_ENUM.FAILED },
  id:           'id_3',
  name:         'name_3'
};

describe('component: GrowlManager', () => {
  const localVue = createLocalVue();

  localVue.use(Vuex);

  const testCases = [
    [[], 0],
    [[FAILED_SNAPSHOT], 0],
    [[SUCCESSFUL_SNAPSHOT_1], 1],
    [[SUCCESSFUL_SNAPSHOT_1, SUCCESSFUL_SNAPSHOT_2], 2],
    [[FAILED_SNAPSHOT, SUCCESSFUL_SNAPSHOT_1, SUCCESSFUL_SNAPSHOT_2], 2]
  ];

  it.each(testCases)('should list RKE2 snapshots properly', async(snapShots, expected) => {
    const store = new Vuex.Store({
      modules: {
        'action-menu': {
          namespaced: true,
          state:      {
            showPromptRestore: true,
            toRestore:         snapShots
          },
        },
      },
      getters: { 'i18n/t': () => jest.fn(), 'prefs/get': () => jest.fn() },
      actions: { 'management/findAll': jest.fn().mockResolvedValue(snapShots), 'rancher/findAll': jest.fn().mockResolvedValue([]) }
    });

    const wrapper = shallowMount(PromptRestore as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      store,
      localVue
    });

    await wrapper.vm.fetchSnapshots();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.clusterSnapshots).toHaveLength(expected);
  });
});
