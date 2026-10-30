import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import WorkloadHealthScale from '@shell/components/formatter/WorkloadHealthScale.vue';
import PlusMinus from '@shell/components/form/PlusMinus.vue';
import { WORKLOAD_TYPES } from '@shell/config/types';

const createWrapper = async(row: any) => {
  const wrapper = shallowMount(WorkloadHealthScale, {
    props: {
      row, col: {}, rowKey: 'default-test'
    },
    global: { plugins: [createStore({ getters: { 'i18n/t': () => (key: string) => key } })] },
  });

  await wrapper.setData({ loading: false });

  return wrapper;
};

const createRow = (canScale: boolean) => ({
  type:      WORKLOAD_TYPES.DEPLOYMENT,
  name:      'test',
  canScale,
  canUpdate: false,
  spec:      { replicas: 1 },
  scaleUp:   jest.fn(),
  scaleDown: jest.fn(),
});

describe('component: WorkloadHealthScale', () => {
  it('should offer scaling when the workload can scale, without update permission', async() => {
    const wrapper = await createWrapper(createRow(true));

    expect(wrapper.findComponent(PlusMinus).exists()).toBe(true);
  });

  it('should not offer scaling when the workload cannot scale', async() => {
    const wrapper = await createWrapper(createRow(false));

    expect(wrapper.findComponent(PlusMinus).exists()).toBe(false);
  });

  it.each([
    ['plus', 'scaleUp'],
    ['minus', 'scaleDown'],
  ] as const)('should scale the workload on %s', async(event, method) => {
    const row = createRow(true);
    const wrapper = await createWrapper(row);

    wrapper.findComponent(PlusMinus).vm.$emit(event);

    expect(row[method]).toHaveBeenCalledWith();
  });
});
