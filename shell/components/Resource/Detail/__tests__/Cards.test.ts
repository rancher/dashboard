import { flushPromises, mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { createStore } from 'vuex';
import Cards from '@shell/components/Resource/Detail/Cards.vue';
import Workload from '@shell/models/workload.js';
import { WORKLOAD_TYPES } from '@shell/config/types';

/**
 * These mount the pods card the way the application does: through `Cards.vue`, from a live model
 * getter, rather than mounting the card directly with fixed props.
 *
 * That distinction matters. `Cards.vue` renders `<component :is="card.component">`, so anything
 * that changes the component's identity between two evaluations of the getter remounts the card
 * and destroys its local state, and the scale button's in flight block is local state. Mounting
 * the card on its own can never catch that.
 */
describe('component: Cards', () => {
  const mockPod = { stateSimpleColor: 'success', stateDisplay: 'Running' };

  const scalableWorkload = (replicas: number, podCount: number) => {
    let resolveSave: () => void = () => {};

    const workload = new Workload({
      type:     WORKLOAD_TYPES.DEPLOYMENT,
      metadata: { name: 'test', namespace: 'default' },
      spec:     { replicas }
    }, {
      getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
      dispatch:    jest.fn(),
      rootGetters: { 'i18n/t': (key: string) => key },
    });

    Object.defineProperty(workload, 'pods', { get: () => new Array(podCount).fill(mockPod) });
    Object.defineProperty(workload, 'canUpdate', { get: () => true });

    // The scale request stays in flight until the test settles it. `save` resolves with the
    // resource, so the mock has to as well.
    workload.save = jest.fn(() => new Promise<Workload>((resolve) => {
      resolveSave = () => resolve(workload);
    }));

    const reactiveWorkload = reactive(workload);

    return {
      // Only the card under test, so that the other cards' getters do not need mocking
      resource: {
        get cards() {
          return [reactiveWorkload.podsCard];
        }
      },
      workload:   reactiveWorkload,
      settleSave: () => resolveSave(),
    };
  };

  const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });

  const mountCards = async(resource: any) => {
    const wrapper = mount(Cards, { props: { resource }, global: { provide: { store } } });

    // Resolve the async card component
    await flushPromises();

    return wrapper;
  };

  it('should show the replica count rather than the number of matching pods', async() => {
    const { resource } = scalableWorkload(2, 4);

    const wrapper = await mountCards(resource);

    expect(wrapper.find('[data-testid="scaler-value"]').text()).toBe('2');
  });

  it('should block the scale buttons until the scale request settles', async() => {
    const { resource, workload, settleSave } = scalableWorkload(2, 4);

    const wrapper = await mountCards(resource);
    const increaseBefore = wrapper.find('[data-testid="scaler-increase"]');

    expect(increaseBefore.attributes('aria-disabled')).toBe('false');

    await increaseBefore.trigger('click');

    // Mid flight: the replica count has been written optimistically, which re-evaluates the card's
    // getter. The card must survive that with its in flight state intact.
    const increaseDuring = wrapper.find('[data-testid="scaler-increase"]');

    expect(increaseDuring.exists()).toBe(true);
    expect(increaseDuring.attributes('aria-disabled')).toBe('true');
    expect(wrapper.find('[data-testid="scaler-decrease"]').attributes('aria-disabled')).toBe('true');
    expect(wrapper.find('[data-testid="scaler-value"]').text()).toBe('3');

    // A second click whilst blocked must not send a second write
    await increaseDuring.trigger('click');

    expect(workload.save).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-testid="scaler-value"]').text()).toBe('3');

    settleSave();
    await flushPromises();

    const increaseAfter = wrapper.find('[data-testid="scaler-increase"]');

    expect(increaseAfter.attributes('aria-disabled')).toBe('false');
    // The same button element throughout, so the card was patched rather than remounted
    expect(increaseAfter.element).toBe(increaseBefore.element);
  });
});
