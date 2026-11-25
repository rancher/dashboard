import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { nextTick } from 'vue';
import WorkloadHealthScale from '@shell/components/formatter/WorkloadHealthScale.vue';
import { WORKLOAD_TYPES } from '@shell/config/types';

const createWrapper = (row: any) => shallowMount(WorkloadHealthScale, {
  props: {
    row,
    col:    {},
    rowKey: 'test-row',
  },
  global: {
    plugins: [createStore({ getters: { 'i18n/t': () => (key: string) => key } })],
    stubs:   { ProgressBarMulti: true, PlusMinus: true },
  },
});

describe('component: WorkloadHealthScale', () => {
  it('should show the health bar on mount when the row uses paginated workload health', async() => {
    const row = {
      type:                       WORKLOAD_TYPES.DEPLOYMENT,
      hasPaginatedWorkloadHealth: true,
      canUpdate:                  false,
      podGauges:                  { Running: { color: 'success', count: 1 } },
    };

    const wrapper = createWrapper(row);

    await nextTick();

    expect(wrapper.vm.loading).toBe(false);
    expect(wrapper.find('.hs-popover__loader').exists()).toBe(false);
    expect(wrapper.find('.hs-popover').exists()).toBe(true);
  });

  it('should keep the loader on mount when the row does not use paginated workload health', async() => {
    const row = {
      type:                       WORKLOAD_TYPES.DEPLOYMENT,
      hasPaginatedWorkloadHealth: false,
      canUpdate:                  false,
      podGauges:                  { Running: { color: 'success', count: 1 } },
    };

    const wrapper = createWrapper(row);

    await nextTick();

    expect(wrapper.vm.loading).toBe(true);
    expect(wrapper.find('.hs-popover__loader').exists()).toBe(true);
  });
});
