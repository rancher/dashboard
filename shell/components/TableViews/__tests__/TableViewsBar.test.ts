import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';

import TableViewsBar from '@shell/components/TableViews/TableViewsBar.vue';
import { TABLE_VIEWS } from '@shell/store/prefs';
import { isViewDirty, selectedViewIdFor } from '@shell/utils/table-views';

const EMPTY = {
  query: '', columns: null, labelColumns: [], groupBy: null
};

function makeView(id: string, name: string, overrides = {}) {
  return {
    id, name, ...EMPTY, ...overrides
  } as any;
}

describe('TableViewsBar', () => {
  describe('selectedViewIdFor', () => {
    // Two saved views can hold the same config - a duplicate, or one saved on top of another -
    // and a saved view can hold the same config as the All tab
    const running = { query: 'state:Running', groupBy: 'namespace' };
    const first = makeView('aaa', 'Need attention', running);
    const second = makeView('bbb', 'test', running);
    const sameAsAll = makeView('ccc', 'same as all');
    const saved = [first, second, sameAsAll];
    const applied = { ...EMPTY, ...running };

    it('should select the view that was picked, not the first one matching its config', () => {
      expect(selectedViewIdFor(saved, applied, 'bbb')).toBe('bbb');
    });

    it('should select nothing when the All tab was picked, even if a view holds the same config', () => {
      // Otherwise clicking All jumps to that view and All can never be got back to
      expect(selectedViewIdFor(saved, { ...EMPTY }, null)).toBeNull();
    });

    it('should select the matching view when one arrives in a shared url', () => {
      // Nothing picked here, so the config is the only handle on it
      expect(selectedViewIdFor(saved, applied, undefined)).toBe('aaa');
    });

    it('should select nothing on a fresh unmodified list', () => {
      // Nothing picked and nothing applied is the All tab, whatever configs happen to be saved
      expect(selectedViewIdFor(saved, { ...EMPTY }, undefined)).toBeNull();
    });

    it('should keep the picked view selected once it has been edited away from', () => {
      expect(selectedViewIdFor(saved, { ...EMPTY, query: 'state:Running name:foo' }, 'bbb')).toBe('bbb');
    });

    it('should fall back to the config when the picked view has been deleted', () => {
      expect(selectedViewIdFor(saved, applied, 'gone')).toBe('aaa');
    });
  });

  describe('isViewDirty', () => {
    const sameAsAll = makeView('ccc', 'same as all');

    it('should report changes made on top of the All tab as unsaved', () => {
      // Even when a saved view happens to hold the same config as what was typed
      expect(isViewDirty([sameAsAll], { ...EMPTY, query: 'name:foo' }, null)).toBe(true);
    });

    it('should report the All tab itself as clean', () => {
      expect(isViewDirty([sameAsAll], { ...EMPTY }, null)).toBe(false);
    });
  });

  describe('deleting a view', () => {
    const first = makeView('aaa', 'Need attention', { query: 'state:Running' });
    const second = makeView('bbb', 'test', { query: 'name:foo' });

    // jsdom has no layout, so the strip's "bring the tab into sight" has nothing to scroll
    beforeAll(() => {
      Element.prototype.scrollIntoView = jest.fn();
    });

    function createWrapper() {
      const setPref = jest.fn();
      // Nothing here shares a config, so nothing else can match once a view is gone
      const stored = { test: { views: [first, second], defaultViewId: null } };

      const store = createStore({
        getters: { 'prefs/get': () => (key: string) => (key === TABLE_VIEWS ? stored : undefined) },
        actions: { 'prefs/set': (_ctx: any, payload: any) => setPref(payload) },
      });

      const wrapper = mount(TableViewsBar, {
        props: {
          view:         { ...EMPTY, query: 'name:foo' },
          resourceType: 'test',
        },
        // The bar is full of dropdowns and modals; only its own logic is under test here
        global:  { plugins: [store] },
        shallow: true,
      });

      return { wrapper, setPref };
    }

    it('should drop the view from the saved list', () => {
      const { wrapper, setPref } = createWrapper();

      (wrapper.vm as any).deleteView(second);

      expect(setPref).toHaveBeenCalledWith(expect.objectContaining({ key: TABLE_VIEWS }));
      expect(setPref.mock.calls[0][0].value.test.views).toStrictEqual([first]);
    });

    it('should go back to the All tab when the view being shown is deleted', () => {
      const { wrapper } = createWrapper();

      // `name:foo` is what `second` holds, so it is the tab in front of the user
      (wrapper.vm as any).deleteView(second);

      expect(wrapper.emitted('update:view')?.pop()?.[0]).toMatchObject({ query: '' });
    });

    it('should leave the shown view alone when a different one is deleted', () => {
      const { wrapper } = createWrapper();

      (wrapper.vm as any).deleteView(first);

      expect(wrapper.emitted('update:view')).toBeUndefined();
    });
  });
});
