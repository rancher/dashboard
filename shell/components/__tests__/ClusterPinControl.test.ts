import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ClusterPinControl from '@shell/components/ClusterPinControl.vue';
import { isMac } from '@shell/utils/platform';

describe('component: ClusterPinControl', () => {
  const PIN_SELECTOR = '.cluster-pin';

  const cluster = (over = {}) => ({
    id: 'c-abc', nameDisplay: 'prod', isLocal: false, pinned: false, pin: jest.fn(), unpin: jest.fn(), ...over
  });

  // The control reads the store for its growl on a failed write, so it needs a real one injected.
  const mountControl = (value: any, stubs: any = {}, attached = false) => mount(ClusterPinControl as any, {
    props:    { cluster: value },
    // Focus only lands on an element that is in the document, which one test needs.
    attachTo: attached ? document.body : undefined,
    global:   {
      plugins:    [createStore({})],
      stubs,
      directives: { shortkey: {}, 'clean-tooltip': {} },
    },
  });

  // A stand-in for the pin that records the toggle, so these tests assert the shortcut reaches it
  // rather than re-testing the control it reaches.
  const pinStub = (toggle: jest.Mock) => ({ Pinned: { template: '<span />', methods: { toggle } } });

  it('offers a pin for the cluster the page is about', () => {
    const wrapper = mountControl(cluster());

    expect(wrapper.find(PIN_SELECTOR).exists()).toBe(true);
    expect((wrapper.vm as any).pinnable).toMatchObject({ pinned: false, label: 'prod' });
  });

  // `local` holds a fixed slot in the nav and is filtered out of PINNED, so a pin on it would be an
  // affordance that changes nothing.
  it.each([
    ['local', cluster({ isLocal: true, nameDisplay: 'local' })],
    ['no cluster', null],
  ])('offers no pin for %s', (_label, value) => {
    const wrapper = mountControl(value);

    expect(wrapper.find(PIN_SELECTOR).exists()).toBe(false);
    expect((wrapper.vm as any).pinnable).toBeNull();
  });

  // The cluster management row hands over a provisioning cluster; the pin is kept against the
  // management cluster behind it.
  it('reaches the management cluster behind a provisioning cluster', () => {
    const wrapper = mountControl({ nameDisplay: 'prov', mgmt: cluster({ pinned: true }) });

    expect((wrapper.vm as any).pinnable).toMatchObject({ pinned: true, label: 'prod' });
  });

  it('names the action for the state the pin is in', () => {
    // The suite renders keys rather than copy, so match the key each state resolves to.
    expect((mountControl(cluster()).vm as any).tooltip).toContain('nav.header.pinCluster');
    expect((mountControl(cluster({ pinned: true })).vm as any).tooltip).toContain('nav.header.unpinCluster');
  });

  // The label and the announced name have to name the keys the binding actually registers, or the
  // tooltip and a screen reader advertise a shortcut that does nothing.
  it('advertises the keys it binds', () => {
    const vm = mountControl(cluster()).vm as any;

    expect(vm.shortcutKeys).toStrictEqual({ windows: ['alt', 'p'], mac: ['meta', 'shift', 'p'] });
    // Whichever platform this runs on, the label and the announced name describe the same combo. Keyed
    // off the platform rather than off the label's own text: comparing against the label meant a change
    // to how it is WRITTEN silently sent this assertion down the other platform's branch.
    expect(vm.shortcut).toBe(isMac ? '⌘-Shift-P' : 'Alt-P');
    expect(vm.ariaShortcut).toBe(isMac ? 'Meta+Shift+P' : 'Alt+P');
  });

  describe('the pin shortcut', () => {
    // Matching, and staying out of text fields, is the `v-shortkey` directive's job — this handler runs
    // only once the directive has decided the shortcut fired.
    it('toggles the pin through the control, so the write and the animation stay on one path', () => {
      const toggle = jest.fn();
      const vm = mountControl(cluster(), pinStub(toggle)).vm as any;

      vm.onShortcut();

      expect(toggle).toHaveBeenCalledWith();
    });

    it('does nothing on a cluster that cannot be pinned', () => {
      const toggle = jest.fn();
      const vm = mountControl(cluster({ isLocal: true }), pinStub(toggle)).vm as any;

      vm.onShortcut();

      expect(toggle).not.toHaveBeenCalled();
    });
  });

  // The shortcut fires from anywhere on the page, so the toggle usually lands with focus somewhere
  // else and the control's own `aria-pressed` is never spoken. The live region covers that case —
  // and stays quiet when the control DOES have focus, or the change would be announced twice.
  describe('announcing the toggle', () => {
    it.each([
      ['pinned', true, 'nav.switcher.aria.pinnedCluster'],
      ['unpinned', false, 'nav.switcher.aria.unpinnedCluster'],
    ])('should announce a cluster being %s when the pin does not hold focus', async(_l, pinned, key) => {
      const wrapper = mountControl(cluster());

      (wrapper.vm as any).announce({ label: 'prod' }, pinned);
      // The announcement is cleared first and set on the next tick, so it takes one tick to land and
      // another to render.
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[role="status"]').text()).toContain(key);
    });

    it('should stay silent when the pin itself has focus', async() => {
      const wrapper = mountControl(cluster(), {}, true);

      (wrapper.find(PIN_SELECTOR).element as HTMLElement).focus();
      (wrapper.vm as any).announce({ label: 'prod' }, true);
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[role="status"]').text()).toStrictEqual('');
    });
  });
});
