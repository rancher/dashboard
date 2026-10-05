import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';

import TableViewTabs from '@shell/components/TableViews/TableViewTabs.vue';
import { TABLE_VIEWS } from '@shell/store/prefs';
import { isViewDirty, selectedViewIdFor, savedViewsByType } from '@shell/utils/table-views/views';
import type { TableViewSaved, TableViewState } from '@shell/types/table-views';
import { decodeSharedViews } from '@shell/utils/table-views/share';
import type { SharedTableView } from '@shell/utils/table-views/share';

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
  modal: { kind: string, count?: number | null, text?: string } | null;
  isDirty: boolean;
  openExport(tab: { id: string, name: string, view: TableViewSaved }): void;
  doExport(format: string): void;
  deleteView(view: TableViewSaved): void;
  discardChanges(tab: { id: string | null, name: string, view?: TableViewSaved }): void;
  saveChanges(tab: { id: string | null, name: string, view?: TableViewSaved }): void;
  openSaveAsNew(tab: { id: string | null, name: string, view?: TableViewSaved }): void;
  resetTab(tab: { id: string | null, name: string, view?: TableViewSaved, isDefaultTab?: boolean }): void;
  persistAll(views: TableViewSaved[], defaultViewId: string | null, allIndex?: number): void;
  openShare(tab: { id: string | null, name: string, view?: TableViewSaved, isDefaultTab?: boolean }): void;
  openImport(): void;
  importView(view: SharedTableView): void;
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
      views = [first, second], defaultViewId = null as string | null, view = { ...EMPTY }, initialViewId = undefined as string | undefined,
      allIndex = 0
    } = {}) {
      const growl = jest.fn();
      const store = createStore({
        state: {
          stored: {
            test: {
              views, defaultViewId, allIndex
            }
          } as Record<string, unknown>
        },
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

      // Read as the table does, through the version the preference is written with
      const stored = () => savedViewsByType<{ views: TableViewSaved[] }>(store.state.stored).test.views;
      const storedAllIndex = () => savedViewsByType<{ allIndex?: number }>(store.state.stored).test.allIndex;
      const shown = () => wrapper.emitted<[TableViewState]>('update:view')?.pop()?.[0];

      return {
        wrapper, vm: internals(wrapper), stored, storedAllIndex, shown, growl
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

    it('should not save the table\'s own tab, nor save it as a new view', () => {
      const { vm, stored } = createWrapper({ view: { ...EMPTY, query: 'state:Running name:x' } });
      const before = stored();

      vm.saveChanges({ id: null, name: 'All' });

      expect(stored()).toStrictEqual(before);
    });

    it('should leave the changes on the tab in front when it is saved as a new view', () => {
      const { vm, stored } = createWrapper({ view: { ...EMPTY, query: 'state:Running name:x' }, initialViewId: 'aaa' });

      vm.openSaveAsNew(tabFor(first));

      expect(stored()[2].query).toBe('state:Running name:x');
      expect(stored()[0].query).toBe('state:Running');
      expect(vm.drafts.aaa?.query).toBe('state:Running name:x');
    });

    describe('resetting a tab to the table as it comes', () => {
      it('should clear the tab in front of everything, keeping it in front with unsaved changes', () => {
        const { vm, shown } = createWrapper({
          view: {
            ...EMPTY, ...first, groupBy: 'node'
          },
          initialViewId: 'aaa'
        });

        vm.resetTab(tabFor(first));

        expect(shown()).toStrictEqual({
          query: '', columns: null, columnOrder: null, labelColumns: [], groupBy: null, sort: null, sortDescending: false
        });
        expect(vm.selectedViewId).toBe('aaa');
      });

      it('should hold the reset as changes on a tab that is not in front, leaving the one in front alone', () => {
        const { vm, wrapper } = createWrapper({ view: { ...EMPTY, query: 'state:Running' }, initialViewId: 'aaa' });

        vm.resetTab(tabFor(second));

        expect(vm.drafts.bbb).toStrictEqual(expect.objectContaining({ query: '', groupBy: null }));
        expect(wrapper.emitted('update:view')).toBeUndefined();
      });

      it('should drop held changes when the view saved is already the table as it comes', () => {
        const plain = makeView('ccc', 'Plain');
        const { vm } = createWrapper({ view: { ...EMPTY, query: 'state:Running' }, initialViewId: 'aaa' });

        vm.drafts = { ccc: { ...EMPTY, query: 'name:x' } };
        vm.resetTab(tabFor(plain));

        expect(vm.drafts.ccc).toBeUndefined();
      });
    });

    describe('sharing a tab', () => {
      const sharedIn = (vm: TabsInternals) => decodeSharedViews(vm.modal?.text || '')?.tables;

      it('should hand out the tab in front as it stands, unsaved changes and all, under its name', () => {
        const { vm } = createWrapper({ view: { ...EMPTY, query: 'state:Running name:x' }, initialViewId: 'aaa' });

        vm.openShare(tabFor(first));

        expect(vm.modal?.kind).toBe('share');
        expect(sharedIn(vm)).toStrictEqual({ test: expect.objectContaining({ name: first.name, query: 'state:Running name:x' }) });
      });

      it('should hand out another tab with the changes held for it', () => {
        const { vm } = createWrapper({ view: { ...EMPTY, query: 'state:Running' }, initialViewId: 'aaa' });

        vm.drafts = { bbb: { ...EMPTY, query: 'name:held' } };
        vm.openShare(tabFor(second));

        expect(sharedIn(vm)?.test).toStrictEqual(expect.objectContaining({ name: second.name, query: 'name:held' }));
      });

      it('should open an empty import', () => {
        const { vm } = createWrapper();

        vm.openImport();

        expect(vm.modal).toStrictEqual({ kind: 'import' });
      });
    });

    describe('an imported view', () => {
      const imported = (view: TableViewSaved, name: string): SharedTableView => {
        const { id, name: _, ...state } = view;

        return {
          ...EMPTY, ...state, name
        };
      };

      it('should be kept as a view of the user\'s own and opened', () => {
        const { vm, stored } = createWrapper();

        vm.importView(imported(makeView('x', 'x', { query: 'name:new' }), 'Errors'));

        // The store here has no translations, so the name is the key and what it is given
        expect(stored().map((v) => v.name)).toStrictEqual([first.name, second.name, 'tableViews.tab.importedName-{"name":"Errors"}']);
        expect(vm.selectedViewId).toBe(stored()[2].id);
      });

      describe('imported again', () => {
        // The name the view is kept under; the store here has no translations
        const KEPT_NAME = 'tableViews.tab.importedName-{"name":"Theirs"}';
        const kept = makeView('kpt', KEPT_NAME, { query: 'name:shared' });
        const views = (more: TableViewSaved[]) => ({ views: [first, second, ...more] });

        it('should open the view it was kept as, keeping nothing more', () => {
          const { vm, stored } = createWrapper(views([kept]));

          vm.importView(imported(kept, 'Theirs'));

          expect(stored().map((v) => v.id)).toStrictEqual([first.id, second.id, kept.id]);
          expect(vm.selectedViewId).toBe(kept.id);
        });

        it('should keep it again once that view has been changed', () => {
          const changed = { ...kept, query: 'name:changed' };
          const { vm, stored } = createWrapper(views([changed]));

          vm.importView(imported(kept, 'Theirs'));

          expect(stored()).toHaveLength(4);
          expect(stored()[3].name).toBe(`${ KEPT_NAME } 2`);
        });

        it('should keep it under its own name beside a view of the user\'s holding the same config', () => {
          const mine = {
            ...kept, id: 'mine', name: 'Mine'
          };
          const { vm, stored } = createWrapper(views([mine]));

          vm.importView(imported(kept, 'Theirs'));

          expect(stored().map((v) => v.name)).toStrictEqual([first.name, second.name, 'Mine', KEPT_NAME]);
        });
      });
    });

    describe('deleting a view', () => {
      describe('the table\'s own tab', () => {
        const third = makeView('ccc', 'third', { query: 'name:baz' });

        // [first, All, second, third], with `third` the default, which leads: [third, first, All, second]
        const setup = () => createWrapper({
          views: [first, second, third], defaultViewId: 'ccc', allIndex: 1
        });

        it('should keep its place when a view before it goes', () => {
          const { vm, storedAllIndex } = setup();

          vm.deleteView(first);

          expect(storedAllIndex()).toBe(0);
          expect((vm as unknown as { tabs: { id: string | null }[] }).tabs.map((tab) => tab.id)).toStrictEqual(['ccc', null, 'bbb']);
        });

        it('should keep its place when a view after it goes', () => {
          const { vm, storedAllIndex } = setup();

          vm.deleteView(second);

          expect(storedAllIndex()).toBe(1);
          expect((vm as unknown as { tabs: { id: string | null }[] }).tabs.map((tab) => tab.id)).toStrictEqual(['ccc', 'aaa', null]);
        });

        it('should stay where it was moved to when the view is put back after the move', () => {
          // [third, first, second, All]
          const { vm, storedAllIndex, growl } = createWrapper({
            views: [first, second, third], defaultViewId: 'ccc', allIndex: 2
          });

          vm.deleteView(second);
          // Dragged in front of `first` before the undo: [third, All, first]
          vm.persistAll([first, third], 'ccc', 0);
          growl.mock.calls[0][0].action.run();

          expect(storedAllIndex()).toBe(0);
          expect((vm as unknown as { tabs: { id: string | null }[] }).tabs.map((tab) => tab.id)).toStrictEqual(['ccc', null, 'aaa', 'bbb']);
        });

        it('should be back where it was when the view is put back', () => {
          const { vm, storedAllIndex, growl } = setup();

          vm.deleteView(first);
          growl.mock.calls[0][0].action.run();

          expect(storedAllIndex()).toBe(1);
          expect((vm as unknown as { tabs: { id: string | null }[] }).tabs.map((tab) => tab.id)).toStrictEqual(['ccc', 'aaa', null, 'bbb']);
        });
      });

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

  describe('the tablist', () => {
    const first = makeView('aaa', 'Need attention');
    const second = makeView('bbb', 'test');

    function createWrapper() {
      const stored = { test: { views: [first, second], defaultViewId: null } };
      const store = createStore({
        getters: { 'prefs/get': () => (key: string) => (key === TABLE_VIEWS ? stored : undefined) },
        actions: { 'prefs/set': jest.fn() },
      });

      return mount(TableViewTabs, {
        props:  { view: { ...EMPTY }, resourceType: 'test' },
        global: {
          plugins: [store],
          stubs:   {
            RcDropdown:        { template: '<div><slot /></div>' },
            RcDropdownTrigger: { template: '<button><slot /></button>' },
          },
        },
        shallow: true,
      });
    }

    it('should not render a tab\'s menu button inside the tablist', () => {
      const wrapper = createWrapper();

      const buttons = wrapper.findAll('[role="tablist"] button:not([role="tab"])');

      expect(buttons).toHaveLength(0);
    });

    it('should own every tab from the tablist', () => {
      const wrapper = createWrapper();

      const owned = wrapper.find('[role="tablist"]').attributes('aria-owns')?.split(' ');
      const tabIds = wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('id'));

      expect(owned).toStrictEqual(tabIds);
    });
  });

  describe('views shared with everyone', () => {
    const mine = makeView('own', 'Mine', { query: 'name:mine' });
    const pageView = makeView('pv', 'Page view', { query: 'state:Running' });
    const single = makeView('sv', 'Single view', { query: 'name:single' });

    interface FakeConfig {
      metadata: { name: string, creationTimestamp: string };
      spec: Record<string, unknown>;
      canUpdate: boolean;
      canDelete: boolean;
      remove: jest.Mock;
    }

    interface SharedInternals extends TabsInternals {
      tabs: { id: string | null, shared?: boolean }[];
      shareView(tab: { id: string | null, name: string, view?: TableViewSaved, shared?: boolean }): Promise<void>;
      unshareView(tab: { id: string | null, name: string, view?: TableViewSaved, shared?: boolean }): Promise<void>;
      setDefaultView(tab: { id: string | null, name: string, view?: TableViewSaved, isDefaultTab?: boolean }): void;
    }

    beforeAll(() => {
      Element.prototype.scrollIntoView = jest.fn();
      Element.prototype.scrollTo = jest.fn();
    });

    const config = (name: string, spec: Record<string, unknown>, canEdit: boolean): FakeConfig => ({
      metadata:  { name, creationTimestamp: '2026-01-01T00:00:00Z' },
      spec,
      canUpdate: canEdit,
      canDelete: canEdit,
      remove:    jest.fn().mockResolvedValue(undefined),
    });

    function createWrapper({
      admin = true, configs = null as FakeConfig[] | null, view = { ...EMPTY }, initialViewId = undefined as string | undefined,
      defaultViewId = null as string | null, failWrites = false
    } = {}) {
      const all = configs || [
        config('page', {
          type: 'PAGE', page: 'test', views: [pageView], defaultViewId: 'pv'
        }, admin),
        config('single', {
          type: 'VIEW', page: 'test', view: single
        }, admin),
      ];
      const saves: { spec: Record<string, unknown> }[] = [];
      const created: { metadata: unknown, spec: Record<string, unknown> }[] = [];
      const fromError = jest.fn();
      const store = createStore({
        state: {
          stored:  { test: { views: [mine], defaultViewId } } as Record<string, unknown>,
          configs: all,
        },
        getters: {
          'prefs/get':            (state) => (key: string) => (key === TABLE_VIEWS ? state.stored : undefined),
          'management/schemaFor': () => () => ({ collectionMethods: admin ? ['GET', 'POST'] : ['GET'] }),
          'management/haveAll':   () => () => true,
          'management/all':       (state) => () => state.configs,
        },
        mutations: {
          write:   (state, value) => (state.stored = value),
          configs: (state, value) => (state.configs = value),
        },
        actions: {
          'prefs/set':          ({ commit }, { value }) => commit('write', value),
          'growl/success':      jest.fn(),
          'growl/fromError':    (_ctx: unknown, payload: unknown) => fromError(payload),
          'management/findAll': jest.fn(),
          // Saved into the store, as the api's answer is
          'management/create':  ({ state, commit }, data: { metadata: { name: string }, spec: Record<string, unknown> }) => ({
            ...data,
            save: () => {
              if (failWrites) {
                return Promise.reject(new Error('denied'));
              }

              created.push(data);
              commit('configs', state.configs.concat([config(data.metadata.name, data.spec, true)]));

              return Promise.resolve();
            },
          }),
          'management/clone': (_ctx: unknown, { resource }: { resource: FakeConfig }) => {
            const copy = { ...resource, spec: JSON.parse(JSON.stringify(resource.spec)) };

            return {
              ...copy,
              save: () => (failWrites ? Promise.reject(new Error('denied')) : Promise.resolve(saves.push(copy))),
            };
          },
        },
      });
      const wrapper = mount(TableViewTabs, {
        props: {
          view, resourceType: 'test', initialViewId
        },
        global:  { plugins: [store] },
        shallow: true,
      });

      type Entry = { views: TableViewSaved[], defaultViewId?: string, order?: string[] };
      const entry = () => savedViewsByType<Entry>(store.state.stored).test;

      return {
        wrapper, vm: wrapper.vm as unknown as SharedInternals, store, entry, saves, created, fromError, configs: all
      };
    }

    const tabFor = (view: TableViewSaved, shared = false) => ({
      id: view.id, name: view.name, view, shared
    });

    it('should show the shared views after the table\'s own tab, marked, and the user\'s after them', () => {
      const { vm } = createWrapper({ defaultViewId: 'all' });

      expect(vm.tabs.map((tab) => [tab.id, !!tab.shared])).toStrictEqual([[null, false], ['pv', true], ['sv', true], ['own', false]]);
    });

    it('should lead with the page\'s shared default when the user has none', () => {
      const { vm } = createWrapper();

      expect(vm.tabs[0].id).toBe('pv');
    });

    it('should open on the page\'s shared default when the shared views arrive after the list opened', async() => {
      const { wrapper, store, configs } = createWrapper({ configs: [] });

      store.commit('configs', [config('page', {
        type: 'PAGE', page: 'test', views: [pageView], defaultViewId: 'pv'
      }, true)]);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted<[TableViewState]>('update:view')?.pop()?.[0].query).toBe('state:Running');
      expect(configs).toHaveLength(0);
    });

    it('should not move a list the user has already changed when the shared views arrive', async() => {
      const { wrapper, store } = createWrapper({ configs: [], view: { ...EMPTY, query: 'name:typed' } });

      store.commit('configs', [config('page', {
        type: 'PAGE', page: 'test', views: [pageView], defaultViewId: 'pv'
      }, true)]);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:view')).toBeUndefined();
    });

    it('should keep `all` as the user\'s choice of the table\'s own tab over a shared default', () => {
      const { vm, entry } = createWrapper();

      vm.setDefaultView({
        id: null, name: 'All', isDefaultTab: true
      });

      expect(entry().defaultViewId).toBe('all');
      expect(vm.tabs[0].id).toBeNull();
    });

    describe('for a user who can only read them', () => {
      it('should not save changes over a shared view', async() => {
        const { vm, saves } = createWrapper({
          admin: false, view: { ...EMPTY, query: 'name:changed' }, initialViewId: 'sv'
        });

        vm.saveChanges(tabFor(single, true));
        await Promise.resolve();

        expect(saves).toHaveLength(0);
        expect(vm.isDirty).toBe(true);
      });

      it('should not delete a shared view', async() => {
        const { vm, configs } = createWrapper({ admin: false });

        await vm.deleteView(single);

        expect(configs[1].remove).not.toHaveBeenCalled();
      });
    });

    describe('for an administrator', () => {
      it('should save changes over a shared view in its own resource', async() => {
        const { vm, saves } = createWrapper({ view: { ...EMPTY, query: 'name:changed' }, initialViewId: 'sv' });

        vm.saveChanges(tabFor(single, true));
        await new Promise((resolve) => setTimeout(resolve));

        expect(saves[0].spec.view).toStrictEqual({
          id: 'sv', name: 'Single view', query: 'name:changed', labelColumns: [], sortDescending: false
        });
      });

      it('should save changes over a view of the PAGE resource in its list', async() => {
        const { vm, saves } = createWrapper({ view: { ...EMPTY, query: 'name:changed' }, initialViewId: 'pv' });

        vm.saveChanges(tabFor(pageView, true));
        await new Promise((resolve) => setTimeout(resolve));

        expect((saves[0].spec.views as TableViewSaved[])[0].query).toBe('name:changed');
      });

      it('should share a view of the user\'s under its id, and keep its place', async() => {
        const { vm, created, entry } = createWrapper({ defaultViewId: 'all' });
        const before = vm.tabs.map((tab) => tab.id || 'all');

        await vm.shareView(tabFor(mine));

        expect(created[0]).toStrictEqual({
          type:     'ui.cattle.io.tableconfiguration',
          metadata: { name: 'view-test-own' },
          spec:     {
            type: 'VIEW',
            page: 'test',
            view: {
              id: 'own', name: 'Mine', query: 'name:mine', labelColumns: []
            }
          },
        });
        expect(entry().order).toStrictEqual(before);
      });

      it('should keep the user\'s view when sharing it fails', async() => {
        const { vm, entry, fromError } = createWrapper({ failWrites: true });

        await vm.shareView(tabFor(mine));

        expect(entry().views.map((v) => v.id)).toStrictEqual(['own']);
        expect(fromError).toHaveBeenCalledWith(expect.objectContaining({ err: expect.any(Error) }));
      });

      it('should delete a shared view for everyone, leaving the user\'s views alone', async() => {
        const { vm, configs, entry } = createWrapper();

        await vm.deleteView(single);

        expect(configs[1].remove).toHaveBeenCalledWith();
        expect(entry().views.map((v) => v.id)).toStrictEqual(['own']);
      });

      it('should stop sharing a view by making it the user\'s first, in its place, then deleting its resource', async() => {
        const { vm, configs, entry } = createWrapper();

        await vm.unshareView(tabFor(single, true));

        expect(entry().views.map((v) => v.id)).toStrictEqual(['sv', 'own']);
        expect(configs[1].remove).toHaveBeenCalledWith();
      });

      it('should give the view back to everyone when deleting its resource fails', async() => {
        const { vm, configs, entry } = createWrapper();

        configs[1].remove.mockRejectedValue(new Error('denied'));
        await vm.unshareView(tabFor(single, true));

        expect(entry().views.map((v) => v.id)).toStrictEqual(['own']);
      });
    });
  });
});
