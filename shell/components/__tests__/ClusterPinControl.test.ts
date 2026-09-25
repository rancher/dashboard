import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ClusterPinControl from '@shell/components/ClusterPinControl.vue';
import { isMac } from '@shell/utils/platform';

describe('component: ClusterPinControl', () => {
  const PIN_SELECTOR = '.cluster-pin';

  const cluster = (over = {}) => ({
    id: 'c-abc', nameDisplay: 'prod', isLocal: false, pinned: false, pin: jest.fn(), unpin: jest.fn(), ...over
  });

  const mountControl = (value: any, stubs: any = {}, attached = false) => mount(ClusterPinControl as any, {
    props:    { cluster: value },
    attachTo: attached ? document.body : undefined,
    global:   {
      plugins:    [createStore({})],
      stubs,
      directives: { shortkey: {}, 'clean-tooltip': {} },
    },
  });

  const pinStub = (toggle: jest.Mock) => ({ Pinned: { template: '<span />', methods: { toggle } } });

  it('offers a pin for the cluster the page is about', () => {
    const wrapper = mountControl(cluster());

    expect(wrapper.find(PIN_SELECTOR).exists()).toBe(true);
    expect((wrapper.vm as any).pinnable).toMatchObject({ pinned: false, label: 'prod' });
  });

  it.each([
    ['local', cluster({ isLocal: true, nameDisplay: 'local' })],
    ['no cluster', null],
  ])('offers no pin for %s', (_label, value) => {
    const wrapper = mountControl(value);

    expect(wrapper.find(PIN_SELECTOR).exists()).toBe(false);
    expect((wrapper.vm as any).pinnable).toBeNull();
  });

  it('reaches the management cluster behind a provisioning cluster', () => {
    const wrapper = mountControl({ nameDisplay: 'prov', mgmt: cluster({ pinned: true }) });

    expect((wrapper.vm as any).pinnable).toMatchObject({ pinned: true, label: 'prod' });
  });

  it('names the action for the state the pin is in', () => {
    expect((mountControl(cluster()).vm as any).tooltip).toContain('nav.header.pinCluster');
    expect((mountControl(cluster({ pinned: true })).vm as any).tooltip).toContain('nav.header.unpinCluster');
  });

  it('advertises the keys it binds', () => {
    const vm = mountControl(cluster()).vm as any;

    expect(vm.shortcutKeys).toStrictEqual({ windows: ['alt', 'p'], mac: ['meta', 'shift', 'p'] });
    expect(vm.shortcut).toBe(isMac ? '⌘-Shift-P' : 'Alt-P');
    expect(vm.ariaShortcut).toBe(isMac ? 'Meta+Shift+P' : 'Alt+P');
  });

  describe('the pin shortcut', () => {
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

  describe('announcing the toggle', () => {
    it.each([
      ['pinned', true, 'nav.switcher.aria.pinnedCluster'],
      ['unpinned', false, 'nav.switcher.aria.unpinnedCluster'],
    ])('should announce a cluster being %s when the pin does not hold focus', async(_l, pinned, key) => {
      const wrapper = mountControl(cluster());

      (wrapper.vm as any).announce({ label: 'prod' }, pinned);
      // Cleared first and set on the next tick: one tick to land, another to render.
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
