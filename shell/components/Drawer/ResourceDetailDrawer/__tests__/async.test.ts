import { defineComponent } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import { ResourceDetailDrawerAsync, preloadResourceDetailDrawer } from '@shell/components/Drawer/ResourceDetailDrawer/async';

// Stands in for the real drawer so these tests never pull the editor in. Throwing makes every
// load fail, which is what exercises the fallback and the warm-up's error handling.
jest.mock('@shell/components/Drawer/ResourceDetailDrawer/index.vue', () => {
  throw new Error('Loading chunk 42 failed');
});

describe('fx: ResourceDetailDrawerAsync', () => {
  it('should load the drawer on demand rather than bundling it up front', () => {
    // An async wrapper that has not resolved. This is the regression guard: making the drawer a
    // static dependency again puts CodeMirror, the diff viewer and the highlighter back into the
    // initial bundle of the dashboard and of every extension
    expect(typeof (ResourceDetailDrawerAsync as any).__asyncLoader).toBe('function');
    expect((ResourceDetailDrawerAsync as any).__asyncResolved).toBeUndefined();
  });

  it('should fall back to the drawer placeholder when the chunk cannot be loaded', async() => {
    const dispatch = jest.fn();
    const commit = jest.fn();
    const store = createStore({
      getters: {
        'slideInPanel/componentProps': () => ({ resource: { type: 'pod', nameDisplay: 'my-pod' } }),
        'type-map/labelFor':           () => () => 'Pod',
        'i18n/t':                      () => (key: string) => key,
      }
    });

    store.dispatch = dispatch;
    store.commit = commit;

    const host = defineComponent({
      components: { ResourceDetailDrawerAsync },
      template:   '<ResourceDetailDrawerAsync />'
    });

    mount(host, { global: { plugins: [store] } });

    await flushPromises();

    // The fallback took over and reported the failure rather than leaving an empty panel
    expect(dispatch).toHaveBeenCalledWith('growl/fromError', {
      title: 'component.drawer.resourceDetailDrawer.loadFailed',
      err:   expect.any(Error),
    }, { root: true });
    expect(commit).toHaveBeenCalledWith('slideInPanel/close');
  });
});

describe('fx: preloadResourceDetailDrawer', () => {
  it('should not surface a failed warm-up, since the user has not asked for the drawer', async() => {
    const unhandled = jest.fn();

    process.on('unhandledRejection', unhandled);

    expect(() => preloadResourceDetailDrawer()).not.toThrow();

    // Let the rejected import settle, and anything watching for an escaped rejection run
    await new Promise((resolve) => setTimeout(resolve, 0));

    process.off('unhandledRejection', unhandled);

    expect(unhandled.mock.calls).toStrictEqual([]);
  });
});
