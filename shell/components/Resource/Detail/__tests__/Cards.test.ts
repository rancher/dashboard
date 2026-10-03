import { flushPromises, mount } from '@vue/test-utils';
import { nextTick, reactive } from 'vue';
import { createStore } from 'vuex';
import Cards from '@shell/components/Resource/Detail/Cards.vue';
import Workload, { scaleQueues } from '@shell/models/workload.js';
import { WORKLOAD_TYPES } from '@shell/config/types';

/**
 * These mount the pods card the way the application does: through `Cards.vue`, from a live model
 * getter, rather than mounting the card directly with fixed props.
 *
 * That distinction matters. `Cards.vue` renders `<component :is="card.component">`, so anything
 * that changes the component's identity between two evaluations of the getter remounts the card
 * and blanks it. It is also the only level at which the count on screen, the clicks and the
 * requests can be watched together, which is what a burst of clicks is about.
 */
describe('component: Cards', () => {
  const mockPod = { stateSimpleColor: 'success', stateDisplay: 'Running' };

  // Requests are queued per resource, so each test needs its own workload rather than another one
  // wearing the same id
  let nextId = 0;

  const scalableWorkload = (replicas: number, podCount: number) => {
    // The replica count in each request body, in order, and the resolver for each of those
    // requests. Requests stay in flight until the test settles them.
    const writes: number[] = [];
    const settlers: Array<(err?: Error) => void> = [];

    const name = `test-${ ++nextId }`;

    const workload = new Workload({
      id:       `default/${ name }`,
      type:     WORKLOAD_TYPES.DEPLOYMENT,
      metadata: {
        name, namespace: 'default', generation: 10
      },
      spec: { replicas }
    }, {
      getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
      dispatch:    jest.fn(),
      rootGetters: { 'i18n/t': (key: string) => key },
    });

    Object.defineProperty(workload, 'pods', { get: () => new Array(podCount).fill(mockPod) });
    Object.defineProperty(workload, 'canUpdate', { get: () => true });

    // A patch carries the count it was given and answers with the generation the write produced,
    // the way the cluster does. It does not touch the resource: what the cluster holds only reaches
    // the model when the change comes back round the websocket, which `echo` below stands in for.
    let nextGeneration = 10;

    workload.patch = jest.fn((data: any) => {
      writes.push(data.spec.replicas);

      const produced = ++nextGeneration;

      return new Promise((resolve, reject) => {
        settlers.push((err?: Error) => (err ? reject(err) : resolve({ metadata: { generation: produced } })));
      });
    });

    const reactiveWorkload = reactive(workload);

    return {
      // Only the card under test, so that the other cards' getters do not need mocking
      resource: {
        get cards() {
          return [reactiveWorkload.podsCard];
        }
      },
      workload: reactiveWorkload,
      writes,
      // A websocket update landing on the resource: the count it now holds, and the generation
      // that produced it
      echo:     (count: number, generation = nextGeneration) => {
        reactiveWorkload.spec.replicas = count;
        (reactiveWorkload.metadata as any).generation = generation;
      },
      settleAll: async(err?: Error) => {
        // A settled request can queue the next one, so keep going until nothing is left in flight
        while (settlers.length) {
          settlers.shift()?.(err);
          await flushPromises();
        }
      },
    };
  };

  // Process wide state, so an entry left behind changes what the next test sees
  afterEach(() => {
    scaleQueues.forEach((queue: any) => clearTimeout(queue.forget));
    scaleQueues.clear();
  });

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

  it('should move the count on every click without waiting for the request', async() => {
    const { resource } = scalableWorkload(2, 4);

    const wrapper = await mountCards(resource);
    const increase = wrapper.find('[data-testid="scaler-increase"]');

    // Nothing is settled at any point here, so every one of these lands whilst a request is in
    // flight. The number has to follow the clicks anyway.
    await increase.trigger('click');
    expect(wrapper.find('[data-testid="scaler-value"]').text()).toBe('3');

    await increase.trigger('click');
    expect(wrapper.find('[data-testid="scaler-value"]').text()).toBe('4');

    await increase.trigger('click');
    expect(wrapper.find('[data-testid="scaler-value"]').text()).toBe('5');

    // And no click was refused on the way
    expect(increase.attributes('aria-disabled')).toBe('false');
    expect(wrapper.find('[data-testid="scaler-decrease"]').attributes('aria-disabled')).toBe('false');
    // The same button element throughout, so the card was patched rather than remounted
    expect(wrapper.find('[data-testid="scaler-increase"]').element).toBe(increase.element);
  });

  it('should coalesce a burst of clicks into fewer requests than clicks, and land on the last one', async() => {
    const { resource, writes, settleAll } = scalableWorkload(2, 4);

    const wrapper = await mountCards(resource);
    const increase = wrapper.find('[data-testid="scaler-increase"]');

    await increase.trigger('click');
    await increase.trigger('click');
    await increase.trigger('click');

    await settleAll();

    // Three clicks, at most two requests: the one already in flight, and one carrying everything
    // clicked whilst it ran
    expect(writes.length).toBeLessThan(3);
    // Every request carries an absolute target worked out at click time, so no two can ask for the
    // same number, which is what loses a click to a read-modify-write race
    expect(new Set(writes).size).toBe(writes.length);
    expect(writes[writes.length - 1]).toBe(5);
    expect(wrapper.find('[data-testid="scaler-value"]').text()).toBe('5');
  });

  it('should keep the clicked count on screen when an older one lands behind it', async() => {
    const {
      resource, writes, echo, settleAll
    } = scalableWorkload(2, 4);

    const wrapper = await mountCards(resource);
    const increase = wrapper.find('[data-testid="scaler-increase"]');

    await increase.trigger('click');
    await increase.trigger('click');

    // The first request's change comes back round the websocket carrying 3, a count the user has
    // already moved past. The rocker must not drop back to it, at any point.
    expect(writes[0]).toBe(3);
    echo(3);
    await nextTick();

    expect(wrapper.find('[data-testid="scaler-value"]').text()).toBe('4');

    await settleAll();

    expect(writes).toStrictEqual([3, 4]);
    expect(wrapper.find('[data-testid="scaler-value"]').text()).toBe('4');
  });

  it('should put the count back and send nothing more when a request fails', async() => {
    const { resource, writes, settleAll } = scalableWorkload(2, 4);

    const wrapper = await mountCards(resource);
    const increase = wrapper.find('[data-testid="scaler-increase"]');

    await increase.trigger('click');
    await increase.trigger('click');

    await settleAll(new Error('Forbidden'));

    // One request went out and was refused. The target clicked behind it must not be left queued
    // for a request that will never be sent, and the count on screen must be one the cluster
    // actually holds.
    expect(writes).toStrictEqual([3]);
    expect(wrapper.find('[data-testid="scaler-value"]').text()).toBe('2');

    // ...and the rocker still works afterwards
    await increase.trigger('click');

    expect(writes).toStrictEqual([3, 3]);
    expect(wrapper.find('[data-testid="scaler-value"]').text()).toBe('3');
  });
});
