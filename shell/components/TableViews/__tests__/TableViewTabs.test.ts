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
  isDirty: boolean;
  openExport(tab: { id: string, name: string, view: TableViewSaved }): void;
  doExport(format: string): void;
  deleteView(view: TableViewSaved): void;
  discardChanges(tab: { id: string | null, name: string, view?: TableViewSaved }): void;
  saveChanges(tab: { id: string | null, name: string, view?: TableViewSaved }): void;
  openSaveAsNew(tab: { id: string | null, name: string, view?: TableViewSaved }): void;
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

  describe('a tab\'s own menu', () => {
    const first = makeView('aaa', 'Need attention', { query: 'state:Running' });
    const second = makeView('bbb', 'test', { query: 'name:foo' });

    // jsdom has no layout, so the strip's "bring the tab into sight" has nothing to scroll
    beforeAll(() => {
      Element.prototype.scrollIntoView = jest.fn();
    });

    /** A strip whose saved views change as they are written, the way the preference does */
    function createWrapper({
      views = [first, second], defaultViewId = null as string | null, view = { ...EMPTY }, initialViewId = undefined as string | undefined
    } = {}) {
      const growl = jest.fn();
      const store = createStore({
        state:     { stored: { test: { views, defaultViewId } } as Record<string, unknown> },
        getters:   { 'prefs/get': (state) => (key: string) => (key === TABLE_VIEWS ? state.stored : undefined) },
        mutations: { write: (state, value) => (state.stored = value) },
        actions:   {
          'prefs/set':     ({ commit }, { value }) => commit('write', value),
          'growl/success': (_ctx: unknown, payload: unknown) => growl(payload),
        },
      });
      const wrapper = mount(TableViewTabs, {
        props: {
          view, resourceType: 'test', initialViewId
        },
        global:  { plugins: [store] },
        shallow: true,
      });

      const stored = () => (store.state.stored as { test: { views: TableViewSaved[] } }).test.views;
      const shown = () => wrapper.emitted<[TableViewState]>('update:view')?.pop()?.[0];

      return {
        wrapper, vm: internals(wrapper), stored, shown, growl
      };
    }

    const tabFor = (view: TableViewSaved) => ({
      id: view.id, name: view.name, view
    });

    describe('on a tab that is not the one in front', () => {
      // `aaa` is in front with changes of its own, and `bbb` was left with others
      const setup = () => {
        const out = createWrapper({ view: { ...EMPTY, query: 'state:Running name:x' }, initialViewId: 'aaa' });

        out.vm.drafts = { bbb: { ...EMPTY, query: 'name:bar' } };

        return out;
      };

      it('should discard that tab\'s changes and leave the one in front alone', () => {
        const { vm, wrapper } = setup();

        vm.discardChanges(tabFor(second));

        expect(vm.drafts).toStrictEqual({});
        expect(vm.isDirty).toBe(true);
        expect(wrapper.emitted('update:view')).toBeUndefined();
      });

      it('should save that tab\'s changes over it, not the ones in front', () => {
        const { vm, stored } = setup();

        vm.saveChanges(tabFor(second));

        expect(stored().map((v) => `${ v.id }=${ v.query }`)).toStrictEqual(['aaa=state:Running', 'bbb=name:bar']);
        expect(vm.drafts).toStrictEqual({});
        expect(vm.isDirty).toBe(true);
      });

      it('should save that tab\'s changes as a new view, and leave them on that tab too', () => {
        const { vm, stored } = setup();

        vm.openSaveAsNew(tabFor(second));

        const added = stored()[2];

        expect(added.query).toBe('name:bar');
        expect(added.name).toContain('test');
        expect(vm.drafts.bbb?.query).toBe('name:bar');
        // The tab that was in front keeps its own changes for when it is gone back to
        expect(vm.drafts.aaa?.query).toBe('state:Running name:x');
      });
    });

    it('should leave the changes on the tab in front when it is saved as a new view', () => {
      const { vm, stored } = createWrapper({ view: { ...EMPTY, query: 'state:Running name:x' }, initialViewId: 'aaa' });

      vm.openSaveAsNew(tabFor(first));

      expect(stored()[2].query).toBe('state:Running name:x');
      expect(stored()[0].query).toBe('state:Running');
      expect(vm.drafts.aaa?.query).toBe('state:Running name:x');
    });

    describe('deleting a view', () => {
      it('should drop the view from the saved list and offer it back', () => {
        const { vm, stored, growl } = createWrapper();

        vm.deleteView(second);

        // Written without its null properties
        expect(stored()).toStrictEqual([{
          id: first.id, name: first.name, query: first.query, labelColumns: first.labelColumns
        }]);
        expect(growl).toHaveBeenCalledWith(expect.objectContaining({ action: expect.objectContaining({ run: expect.any(Function) }) }));
      });

      it('should go to the tab on its left when the one in front is deleted', () => {
        const { vm, shown } = createWrapper({ view: { ...EMPTY, query: 'name:foo' }, initialViewId: 'bbb' });

        vm.deleteView(second);

        expect(shown()).toMatchObject({ query: 'state:Running' });
        expect(vm.selectedViewId).toBe('aaa');
      });

      it('should leave none of the deleted tab\'s changes on the tab that takes its place', async() => {
        const { vm, shown, wrapper } = createWrapper({ view: { ...EMPTY, query: 'name:foo name:zzz' }, initialViewId: 'bbb' });

        vm.deleteView(second);
        // As the owning table does
        await wrapper.setProps({ view: shown() });

        expect(wrapper.props('view').query).toBe('state:Running');
        expect(vm.isDirty).toBe(false);
      });

      it('should bring back the changes held for the tab it goes to', () => {
        const { vm, shown } = createWrapper({ view: { ...EMPTY, query: 'name:foo' }, initialViewId: 'bbb' });

        vm.drafts = { aaa: { ...EMPTY, query: 'state:Running name:held' } };
        vm.deleteView(second);

        expect(shown()?.query).toBe('state:Running name:held');
      });

      it('should go to the table\'s own tab when that is on its left', () => {
        const { vm, shown } = createWrapper({ view: { ...EMPTY, query: 'state:Running name:zzz' }, initialViewId: 'aaa' });

        vm.deleteView(first);

        expect(shown()).toMatchObject({ query: '', groupBy: null });
        expect(vm.selectedViewId).toBeNull();
      });

      it('should go to the tab on its right when it leads the strip', () => {
        // The default view leads, so `bbb` is first and the table's own tab follows it
        const { vm, shown } = createWrapper({
          defaultViewId: 'bbb', view: { ...EMPTY, query: 'name:foo' }, initialViewId: 'bbb'
        });

        vm.deleteView(second);

        expect(shown()).toMatchObject({ query: '' });
        expect(vm.selectedViewId).toBeNull();
      });

      it('should leave the tab in front alone when a different one is deleted', () => {
        const { vm, wrapper } = createWrapper({ view: { ...EMPTY, query: 'name:foo' }, initialViewId: 'bbb' });

        vm.deleteView(first);

        expect(wrapper.emitted('update:view')).toBeUndefined();
      });
    });
  });
});
