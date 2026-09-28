import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';

import TableViewTabs from '@shell/components/TableViews/TableViewTabs.vue';
import { TABLE_VIEWS } from '@shell/store/prefs';
import { isViewDirty, selectedViewIdFor } from '@shell/utils/table-views/views';
import type { TableViewSaved, TableViewState } from '@shell/types/table-views';

const EMPTY: TableViewState = {
  query: '', columns: null, labelColumns: [], groupBy: null
};

function makeView(id: string, name: string, overrides: Partial<TableViewState> = {}): TableViewSaved {
  return {
    id, name, ...EMPTY, ...overrides
  };
}

interface ExportArgs {
  format: string;
  name: string;
  view?: TableViewState;
}

/** The component's own state and handlers these tests reach into */
interface TabsInternals {
  selectedViewId: string | null;
  drafts: Record<string, TableViewState>;
  modal: { count: number | null } | null;
  openExport(tab: { id: string, name: string, view: TableViewSaved }): void;
  doExport(format: string): void;
  deleteView(view: TableViewSaved): void;
}

const internals = (wrapper: { vm: unknown }) => wrapper.vm as TabsInternals;

describe('TableViewTabs', () => {
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

    it('should select the view that changes add up to, before any tab is picked', () => {
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

  describe('opening on the default view', () => {
    // Two empty views and an empty All tab: nothing tells them apart but which one was picked
    const first = makeView('aaa', 'Untitled');
    const second = makeView('bbb', 'Untitled 2');

    function createWrapper(initialViewId?: string) {
      const stored = { test: { views: [first, second], defaultViewId: 'bbb' } };
      const store = createStore({
        getters: { 'prefs/get': () => (key: string) => (key === TABLE_VIEWS ? stored : undefined) },
        actions: { 'prefs/set': jest.fn() },
      });

      return mount(TableViewTabs, {
        props: {
          view: { ...EMPTY }, resourceType: 'test', initialViewId
        },
        global:  { plugins: [store] },
        shallow: true,
      });
    }

    it('should select the view the list opened on, even when its config matches others', () => {
      expect(internals(createWrapper('bbb')).selectedViewId).toBe('bbb');
    });

    it('should select the All tab when the list did not open on a saved view', () => {
      expect(internals(createWrapper()).selectedViewId).toBeNull();
    });
  });

  describe('exporting a tab from its own menu', () => {
    const shown = makeView('aaa', 'Shown', { query: 'state:Running' });
    const other = makeView('bbb', 'Other', { query: 'name:foo', columns: ['name'] });

    function createWrapper() {
      const stored = { test: { views: [shown, other], defaultViewId: null } };
      const store = createStore({
        getters: { 'prefs/get': () => (key: string) => (key === TABLE_VIEWS ? stored : undefined) },
        actions: { 'prefs/set': jest.fn() },
      });

      return mount(TableViewTabs, {
        props: {
          view:          { ...EMPTY, query: 'state:Running' },
          resourceType:  'test',
          initialViewId: 'aaa',
          matchCount:    7,
          viewCounts:    { 'state:Running': 7, 'name:foo': 51 },
        },
        global:  { plugins: [store] },
        shallow: true,
      });
    }

    const tabFor = (view: TableViewSaved) => ({
      id: view.id, name: view.name, view
    });

    it('should export the tab on screen as it stands, with no view of its own', () => {
      const wrapper = createWrapper();

      internals(wrapper).openExport(tabFor(shown));
      internals(wrapper).doExport('csv');

      expect(wrapper.emitted<[ExportArgs]>('export')?.[0]?.[0]).toStrictEqual({
        format: 'csv', name: 'Shown', view: undefined
      });
    });

    it('should export another tab with its own view and its own count, not the one on screen', () => {
      const wrapper = createWrapper();

      internals(wrapper).openExport(tabFor(other));

      expect(internals(wrapper).modal?.count).toBe(51);

      internals(wrapper).doExport('csv');

      const args = wrapper.emitted<[ExportArgs]>('export')?.[0]?.[0];

      expect(args?.name).toBe('Other');
      expect(args?.view).toMatchObject({ query: 'name:foo', columns: ['name'] });
    });

    it('should export another tab with the edits held for it, which is what its count counts', () => {
      const wrapper = createWrapper();
      const vm = internals(wrapper);

      vm.drafts = { bbb: { ...EMPTY, query: 'name:bar' } };
      vm.openExport(tabFor(other));
      vm.doExport('json');

      expect(wrapper.emitted<[ExportArgs]>('export')?.[0]?.[0]?.view?.query).toBe('name:bar');
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
      const growl = jest.fn();
      // Nothing here shares a config, so nothing else can match once a view is gone
      const stored = { test: { views: [first, second], defaultViewId: null } };

      const store = createStore({
        getters: { 'prefs/get': () => (key: string) => (key === TABLE_VIEWS ? stored : undefined) },
        actions: {
          'prefs/set':     (_ctx: unknown, payload: unknown) => setPref(payload),
          'growl/success': (_ctx: unknown, payload: unknown) => growl(payload),
        },
      });

      const wrapper = mount(TableViewTabs, {
        props: {
          view:         { ...EMPTY, query: 'name:foo' },
          resourceType: 'test',
        },
        // The bar is full of dropdowns and modals; only its own logic is under test here
        global:  { plugins: [store] },
        shallow: true,
      });

      return {
        wrapper, setPref, growl
      };
    }

    it('should drop the view from the saved list', () => {
      const { wrapper, setPref } = createWrapper();

      internals(wrapper).deleteView(second);

      expect(setPref).toHaveBeenCalledWith(expect.objectContaining({ key: TABLE_VIEWS }));
      expect(setPref.mock.calls[0][0].value.test.views).toStrictEqual([first]);
    });

    it('should say the view is gone and offer it back', () => {
      const { wrapper, growl } = createWrapper();

      internals(wrapper).deleteView(second);

      expect(growl).toHaveBeenCalledWith(expect.objectContaining({ action: expect.objectContaining({ run: expect.any(Function) }) }));
    });

    it('should go back to the All tab when the view being shown is deleted', () => {
      const { wrapper } = createWrapper();

      // `name:foo` is what `second` holds, so it is the tab in front of the user
      internals(wrapper).deleteView(second);

      expect(wrapper.emitted('update:view')?.pop()?.[0]).toMatchObject({ query: '' });
    });

    it('should leave the shown view alone when a different one is deleted', () => {
      const { wrapper } = createWrapper();

      internals(wrapper).deleteView(first);

      expect(wrapper.emitted('update:view')).toBeUndefined();
    });
  });
});
