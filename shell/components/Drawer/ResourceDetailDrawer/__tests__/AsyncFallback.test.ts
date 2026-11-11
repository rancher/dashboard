import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import AsyncFallback from '@shell/components/Drawer/ResourceDetailDrawer/AsyncFallback.vue';
import Drawer from '@shell/components/Drawer/Chrome.vue';
import Loading from '@shell/components/Loading.vue';

describe('component: ResourceDetailDrawer/AsyncFallback', () => {
  const resource = { type: 'pod', nameDisplay: 'my-pod' };

  function createWrapper({ error, componentProps }: { error?: unknown, componentProps?: Record<string, any> } = {}) {
    const commit = jest.fn();
    const dispatch = jest.fn();

    const store = createStore({
      getters: {
        'slideInPanel/componentProps': () => componentProps,
        'type-map/labelFor':           () => () => 'Pod',
        'i18n/t':                      () => (key: string) => key,
      }
    });

    // The real mutation/action surface is not under test here, only that the fallback reaches for it
    store.commit = commit;
    store.dispatch = dispatch;

    const wrapper = shallowMount(AsyncFallback, {
      props:  { error },
      global: {
        plugins: [store],
        // The chrome is stubbed by shallowMount, which would swallow the title and body it is
        // given. Rendered here so those slots can be asserted on.
        stubs:   { Drawer: { template: '<div><slot name="title" /><slot name="body" /></div>' } }
      }
    });

    return {
      wrapper, commit, dispatch
    };
  }

  describe('while the drawer is loading', () => {
    it('should render the drawer chrome so the panel has a title and a close button', () => {
      const { wrapper } = createWrapper({ componentProps: { resource } });

      expect(wrapper.findComponent(Drawer).exists()).toBe(true);
    });

    it('should show a loading indicator in the body', () => {
      const { wrapper } = createWrapper({ componentProps: { resource } });

      expect(wrapper.findComponent(Loading).exists()).toBe(true);
    });

    it('should name the panel after the resource it was opened for', () => {
      const { wrapper } = createWrapper({ componentProps: { resource } });

      expect(wrapper.text()).toContain('component.drawer.resourceDetailDrawer.title');
    });

    it('should not report an error', () => {
      const { commit, dispatch } = createWrapper({ componentProps: { resource } });

      expect(dispatch.mock.calls).toStrictEqual([]);
      expect(commit.mock.calls).toStrictEqual([]);
    });

    it('should still render when the panel has no resource to name', () => {
      const { wrapper } = createWrapper({ componentProps: undefined });

      expect(wrapper.findComponent(Drawer).exists()).toBe(true);
    });
  });

  describe('when the drawer fails to load', () => {
    const error = new Error('Loading chunk 42 failed');

    it('should report the failure as a growl', () => {
      const { dispatch } = createWrapper({ error, componentProps: { resource } });

      expect(dispatch).toHaveBeenCalledWith('growl/fromError', {
        title: 'component.drawer.resourceDetailDrawer.loadFailed',
        err:   error,
      }, { root: true });
    });

    it('should close the panel rather than leave it empty', () => {
      const { commit } = createWrapper({ error, componentProps: { resource } });

      expect(commit).toHaveBeenCalledWith('slideInPanel/close');
    });

    it('should render nothing, since the panel is closing', () => {
      const { wrapper } = createWrapper({ error, componentProps: { resource } });

      expect(wrapper.findComponent(Drawer).exists()).toBe(false);
    });
  });
});
