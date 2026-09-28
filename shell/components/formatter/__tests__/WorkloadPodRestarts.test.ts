import { flushPromises, shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import WorkloadPodRestarts from '@shell/components/formatter/WorkloadPodRestarts.vue';

const createWrapper = (row: any) => shallowMount(WorkloadPodRestarts, {
  props:  { row },
  global: { plugins: [createStore({ getters: { 'i18n/t': () => (key: string) => key } })] },
});

const workloadWithPods = (pods?: any[]) => ({ id: 'default/frontend-567d5b464c', matchingPods: jest.fn(() => Promise.resolve(pods)) });

describe('component: WorkloadPodRestarts', () => {
  it('should fetch the pods of the workload when shown', async() => {
    const row = workloadWithPods([]);

    createWrapper(row);
    await flushPromises();

    expect(row.matchingPods).toHaveBeenCalledWith();
  });

  it('should show a spinner while the pods are fetched', () => {
    const row = { id: 'default/frontend-567d5b464c', matchingPods: jest.fn(() => new Promise(() => undefined)) };

    const wrapper = createWrapper(row);
    const spinner = wrapper.find('.icon-spinner');

    expect(spinner.exists()).toBe(true);
    expect(spinner.attributes('role')).toStrictEqual('status');
    expect(spinner.attributes('aria-label')).toStrictEqual('component.resource.detail.glance.ariaLabel.loading');
  });

  it.each([
    ['no pods', [], '0'],
    ['no pods returned at all', undefined, '0'],
    ['pods that never restarted', [{ totalRestartCount: 0 }, { totalRestartCount: 0 }], '0'],
    ['pods that restarted', [{ totalRestartCount: 17 }, { totalRestartCount: 16 }, { totalRestartCount: 18 }], '51'],
    ['a pod without a restart count', [{ totalRestartCount: 2 }, {}], '2'],
    ['a very large number of restarts', [{ totalRestartCount: Number.MAX_SAFE_INTEGER - 1 }, { totalRestartCount: 1 }], `${ Number.MAX_SAFE_INTEGER }`],
  ])('should add up the restarts of %s', async(_, pods, expected) => {
    const wrapper = createWrapper(workloadWithPods(pods));

    await flushPromises();

    expect(wrapper.find('.icon-spinner').exists()).toBe(false);
    expect(wrapper.text()).toStrictEqual(expected);
  });

  it.each([
    ['the pods cannot be fetched', { id: 'default/broken', matchingPods: jest.fn(() => Promise.reject(new Error('forbidden'))) }],
    ['the workload cannot fetch its pods', { id: 'default/broken' }],
  ])('should show a dash when %s', async(_, row) => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const wrapper = createWrapper(row);

    await flushPromises();

    expect(wrapper.find('.icon-spinner').exists()).toBe(false);
    expect(wrapper.text()).toStrictEqual('—');
    expect(error).toHaveBeenCalledWith('Error fetching data', expect.any(Error));

    error.mockRestore();
  });
});
