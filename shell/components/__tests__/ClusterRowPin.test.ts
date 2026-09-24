import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ClusterRowPin from '@shell/components/ClusterRowPin.vue';

describe('component: ClusterRowPin', () => {
  const PIN_SELECTOR = '[data-testid="cluster-row-pin"]';

  const cluster = (over = {}) => ({
    nameDisplay: 'prod',
    isLocal:     false,
    pinned:      false,
    pin:         jest.fn(),
    unpin:       jest.fn(),
    ...over,
  });

  // The pin control reads the store for its growl on a failed write, so it needs a real one injected.
  const mountPin = (row: any) => mount(ClusterRowPin as any, {
    props:  { cluster: row },
    global: { plugins: [createStore({})] },
  });

  it('should offer a pin for a cluster that can be pinned', () => {
    const wrapper = mountPin(cluster());

    expect(wrapper.find(PIN_SELECTOR).exists()).toBe(true);
  });

  // `local` holds a fixed slot on the shelf, and a row that cannot pin itself has no toggle to offer.
  it.each([
    ['local', {
      nameDisplay: 'local', isLocal: true, pin: jest.fn()
    }],
    ['a row that cannot pin itself', { nameDisplay: 'other' }],
  ])('should offer no pin for %s', (_label, row) => {
    expect(mountPin(row).find(PIN_SELECTOR).exists()).toBe(false);
  });

  it.each([
    ['pin an unpinned cluster', false, 'pin'],
    ['unpin a pinned cluster', true, 'unpin'],
  ])('should %s on click', async(_label, pinned, method) => {
    const row = cluster({ pinned });

    await mountPin(row).find(PIN_SELECTOR).trigger('click');

    expect((row as any)[method]).toHaveBeenCalledWith();
  });

  // The cluster management list hands over provisioning clusters; the pin is kept against the
  // management cluster behind them.
  it('should toggle the management cluster behind a provisioning row', async() => {
    const mgmt = cluster({ pinned: true });

    await mountPin({ nameDisplay: 'prov', mgmt }).find(PIN_SELECTOR).trigger('click');

    expect(mgmt.unpin).toHaveBeenCalledWith();
  });

  it('should mark the control as pressed while the cluster is pinned', () => {
    expect(mountPin(cluster({ pinned: true })).find(PIN_SELECTOR).attributes('aria-pressed')).toBe('true');
    expect(mountPin(cluster()).find(PIN_SELECTOR).attributes('aria-pressed')).toBe('false');
  });
});
