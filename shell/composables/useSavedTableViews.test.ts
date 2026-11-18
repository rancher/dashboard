import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';

import { useSavedTableViews } from '@shell/composables/useSavedTableViews';
import { TABLE_VIEWS } from '@shell/store/prefs';
import { SAVED_VIEWS_VERSION, savedViewsByType } from '@shell/utils/table-views/views';
import type { TableViewSaved } from '@shell/types/table-views';

const view = (id: string, name = id): TableViewSaved => ({
  id, name, query: '', columns: null, labelColumns: [], groupBy: null
});

/** `view` as it is written: without its null and empty string properties */
const stored = (id: string, name = id) => ({
  id, name, labelColumns: []
});

/** A type's entry as written: its views, and the pages keeping their own */
interface WrittenEntry {
  views: TableViewSaved[];
  defaultViewId?: string | null;
  allIndex?: number;
  order?: string[];
  pages: Record<string, WrittenEntry>;
}

function setup(stored: Record<string, unknown>, type = 'pod', page: string | null = null, shared: TableViewSaved[] = []) {
  const setPref = jest.fn();
  const store = createStore({
    getters: { 'prefs/get': () => (key: string) => (key === TABLE_VIEWS ? stored : undefined) },
    actions: { 'prefs/set': (_ctx: unknown, payload: unknown) => setPref(payload) },
  });
  let saved: ReturnType<typeof useSavedTableViews>;

  mount(defineComponent({
    setup() {
      saved = useSavedTableViews(() => type, () => page, () => shared);

      return () => h('div');
    }
  }), { global: { plugins: [store] } });

  const writtenPref = () => setPref.mock.calls[setPref.mock.calls.length - 1][0].value;
  /** What was written, inside the version it was written with */
  const written = () => savedViewsByType<WrittenEntry>(writtenPref());

  return {
    saved: saved!, setPref, written, writtenPref
  };
}

describe('useSavedTableViews', () => {
  describe('the version of the shape it is written in', () => {
    it('should write the views with the version of their shape', () => {
      const { saved, writtenPref } = setup({});

      saved.persist([view('a')]);

      expect(writtenPref()).toStrictEqual({ metadata: { version: SAVED_VIEWS_VERSION }, payload: { pod: { views: [stored('a')], allIndex: 0 } } });
      expect(SAVED_VIEWS_VERSION).toBe(1);
    });

    it('should keep the persistence id the preference holds', () => {
      const { saved, writtenPref } = setup({ metadata: { version: SAVED_VIEWS_VERSION, persistenceId: 'k1' }, payload: {} });

      saved.persist([view('a')]);

      expect(writtenPref().metadata).toStrictEqual({ version: SAVED_VIEWS_VERSION, persistenceId: 'k1' });
    });

    it('should read views written with a version', () => {
      const { saved } = setup({ metadata: { version: 1 }, payload: { pod: { views: [view('a')], defaultViewId: 'a' } } });

      expect(saved.savedViews.value.map((v) => v.id)).toStrictEqual(['a']);
      expect(saved.defaultViewId.value).toBe('a');
    });

    it('should read views written before there was a version, and write them with one', () => {
      const { saved, writtenPref } = setup({ pod: { views: [view('a')] }, node: { views: [view('z')] } });

      expect(saved.savedViews.value.map((v) => v.id)).toStrictEqual(['a']);

      saved.persist([view('a'), view('b')]);

      expect(writtenPref()).toStrictEqual({
        metadata: { version: 1 },
        payload:  { pod: { views: [stored('a'), stored('b')], allIndex: 0 }, node: { views: [view('z')] } },
      });
    });
  });

  it('should read the views, the default and the table tab\'s place for its own type', () => {
    const { saved } = setup({
      pod: {
        views: [view('a'), view('b')], defaultViewId: 'b', allIndex: 1
      },
      node: { views: [view('z')] },
    });

    expect(saved.savedViews.value.map((v) => v.id)).toStrictEqual(['a', 'b']);
    expect(saved.defaultViewId.value).toBe('b');
    expect(saved.allTabIndex.value).toBe(1);
  });

  it('should read views kept in the first shape they had, a bare list', () => {
    const { saved } = setup({ pod: [view('a')] });

    expect(saved.savedViews.value.map((v) => v.id)).toStrictEqual(['a']);
    expect(saved.defaultViewId.value).toBeNull();
  });

  it('should read nothing for a type that has no views, rather than failing', () => {
    const { saved } = setup({});

    expect(saved.savedViews.value).toStrictEqual([]);
    expect(saved.defaultViewId.value).toBeNull();
    expect(saved.allTabIndex.value).toBe(0);
  });

  it.each([
    [undefined, 0],
    [1.5, 0],
    [-3, 0],
    [9, 2],
  ])('should keep the table tab\'s place (%s) within the strip', (allIndex, expected) => {
    const { saved } = setup({ pod: { views: [view('a'), view('b')], allIndex } });

    expect(saved.allTabIndex.value).toBe(expected);
  });

  it('should write this type\'s views and leave every other type\'s alone', () => {
    const node = { views: [view('z')] };
    const { saved, written } = setup({ pod: { views: [view('a')] }, node });

    saved.persist([view('a'), view('b')]);

    expect(written().node).toBe(node);
    expect(written().pod.views.map((v: TableViewSaved) => v.id)).toStrictEqual(['a', 'b']);
  });

  it('should keep the default when the views are written', () => {
    const { saved, written } = setup({ pod: { views: [view('a'), view('b')], defaultViewId: 'b' } });

    saved.persist([view('b'), view('a')]);

    expect(written().pod.defaultViewId).toBe('b');
  });

  it('should drop a default that is no longer among the views', () => {
    const { saved, written } = setup({ pod: { views: [view('a'), view('b')], defaultViewId: 'b' } });

    saved.persistAll([view('a')], 'b');

    expect(written().pod.defaultViewId).toBeUndefined();
  });

  it('should keep the table tab\'s place within the views written', () => {
    const { saved, written } = setup({ pod: { views: [] } });

    saved.persistAll([view('a')], null, 7);

    expect(written().pod.allIndex).toBe(1);
  });

  it('should name a view after the first number no other view has', () => {
    const { saved } = setup({ pod: { views: [view('1', 'Untitled'), view('2', 'Untitled 1'), view('3', 'X (copy)')] } });

    expect(saved.unusedViewName('Fresh', 1)).toBe('Fresh');
    expect(saved.unusedViewName('Untitled', 1)).toBe('Untitled 2');
    expect(saved.unusedViewName('X (copy)', 2)).toBe('X (copy) 2');
  });

  describe('a page keeping views of its own', () => {
    it('should read the page\'s views, not the type\'s', () => {
      const { saved } = setup({
        pod: {
          views:         [view('shared')],
          defaultViewId: 'shared',
          pages:         {
            home: {
              views: [view('own')], defaultViewId: 'own', allIndex: 1
            }
          }
        }
      }, 'pod', 'home');

      expect(saved.savedViews.value.map((v) => v.id)).toStrictEqual(['own']);
      expect(saved.defaultViewId.value).toBe('own');
      expect(saved.allTabIndex.value).toBe(1);
    });

    it('should read nothing for a page with no views yet', () => {
      const { saved } = setup({ pod: { views: [view('shared')], defaultViewId: 'shared' } }, 'pod', 'home');

      expect(saved.savedViews.value).toStrictEqual([]);
      expect(saved.defaultViewId.value).toBeNull();
    });

    it('should save under the type, keeping the type\'s own views', () => {
      const { saved, written } = setup({
        pod: {
          views: [view('shared')], defaultViewId: 'shared', allIndex: 0
        }
      }, 'pod', 'home');

      saved.persistAll([view('own')], 'own');

      expect(written()).toStrictEqual({
        pod: {
          views:         [view('shared')],
          defaultViewId: 'shared',
          allIndex:      0,
          pages:         {
            home: {
              views: [stored('own')], defaultViewId: 'own', allIndex: 0
            }
          }
        }
      });
    });

    it('should keep the pages\' views when the type\'s own are saved', () => {
      const pages = {
        home: {
          views: [view('own')], defaultViewId: null, allIndex: 0
        }
      };
      const { saved, written } = setup({ pod: { views: [view('shared')], pages } });

      saved.persistAll([view('shared'), view('more')], null);

      expect(written().pod.pages).toStrictEqual(pages);
      expect(written().pod.views.map((v: TableViewSaved) => v.id)).toStrictEqual(['shared', 'more']);
    });

    it('should turn the bare list the type\'s views were first kept in into its entry', () => {
      const { saved, written } = setup({ pod: [view('shared')] }, 'pod', 'home');

      saved.persistAll([view('own')], null);

      expect(written().pod.views.map((v: TableViewSaved) => v.id)).toStrictEqual(['shared']);
      expect(written().pod.pages.home.views.map((v: TableViewSaved) => v.id)).toStrictEqual(['own']);
    });
  });

  describe('an entry left with nothing in it', () => {
    it('should drop the type\'s entry when its last view goes', () => {
      const { saved, written } = setup({ pod: { views: [view('a')], defaultViewId: 'a' }, node: { views: [view('z')] } });

      saved.persistAll([], null);

      expect(written()).toStrictEqual({ node: { views: [view('z')] } });
    });

    it('should drop a page\'s entry when its last view goes, keeping the type\'s', () => {
      const { saved, written } = setup({ pod: { views: [view('a')], pages: { home: { views: [view('own')] } } } }, 'pod', 'home');

      saved.persistAll([], null);

      expect(written().pod.views).toStrictEqual([view('a')]);
      expect(written().pod.pages).toBeUndefined();
    });

    it('should drop the type altogether when neither it nor its pages keep a view', () => {
      const { saved, written } = setup({ pod: { views: [], pages: { home: { views: [view('own')] } } } }, 'pod', 'home');

      saved.persistAll([], null);

      expect(written()).toStrictEqual({});
    });

    it('should keep a type with no views of its own while a page has some', () => {
      const { saved, written } = setup({ pod: { views: [view('a')], pages: { home: { views: [view('own')] } } } });

      saved.persistAll([], null);

      expect(written().pod.pages.home.views).toStrictEqual([view('own')]);
    });
  });

  describe('beside views shared with everyone', () => {
    it('should keep a default on a shared view', () => {
      const { saved, written } = setup({ pod: { views: [view('a')] } }, 'pod', null, [view('g')]);

      saved.persistAll([view('a')], 'g');

      expect(written().pod.defaultViewId).toBe('g');
    });

    it('should keep `all`, the table\'s own tab chosen over the page\'s shared default', () => {
      const { saved, written } = setup({ pod: { views: [] } }, 'pod', null, [view('g')]);

      saved.persistAll([], 'all');

      expect(written().pod.defaultViewId).toBe('all');
    });

    it('should keep a default on a shared view that has not loaded yet', () => {
      const { saved, written } = setup({ pod: { views: [view('a')], defaultViewId: 'g' } });

      saved.persist([view('a'), view('b')]);

      expect(written().pod.defaultViewId).toBe('g');
    });

    it('should write the order of every tab, and keep it when the views are written', () => {
      const { saved, written } = setup({ pod: { views: [view('a')] } }, 'pod', null, [view('g')]);

      saved.persistAll([view('a')], null, 1, ['g', 'all', 'a']);

      expect(written().pod.order).toStrictEqual(['g', 'all', 'a']);

      const again = setup({ pod: { views: [view('a')], order: ['g', 'all', 'a'] } }, 'pod', null, [view('g')]);

      again.saved.persist([view('a'), view('b')]);

      expect(again.written().pod.order).toStrictEqual(['g', 'all', 'a']);
    });

    it('should drop a view of the user\'s own from the order when it goes, but not one that went to the shared views', () => {
      const { saved, written } = setup({ pod: { views: [view('a'), view('b')], order: ['all', 'a', 'b'] } }, 'pod', null, [view('b')]);

      saved.persist([]);

      expect(written().pod.order).toStrictEqual(['all', 'b']);
    });

    it('should keep the stored order\'s shared views when a new order is written without them', () => {
      const { saved, written } = setup({ pod: { views: [view('a'), view('b')], order: ['all', 'g', 'a', 'b'] } });

      saved.persistAll([view('b'), view('a')], null, 0, ['all', 'b', 'a']);

      expect(written().pod.order).toStrictEqual(['all', 'g', 'b', 'a']);
    });

    it('should keep an entry with no views of the user\'s own while it holds their order or default', () => {
      const { saved, written } = setup({ pod: { views: [view('a')] } }, 'pod', null, [view('g')]);

      saved.persistAll([], 'g', 0, ['all', 'g']);

      expect(written().pod).toStrictEqual({
        views: [], defaultViewId: 'g', allIndex: 0, order: ['all', 'g']
      });
    });

    it('should not name a view after a shared one', () => {
      const { saved } = setup({ pod: { views: [] } }, 'pod', null, [view('g', 'Untitled')]);

      expect(saved.unusedViewName('Untitled', 1)).toBe('Untitled 1');
    });
  });

  describe('what is written', () => {
    it('should leave out null and empty string properties, keeping 0, false and empty lists', () => {
      const { saved, written } = setup({});

      saved.persistAll([{
        id: 'a', name: 'A', query: '', columns: null, columnOrder: null, labelColumns: [], groupBy: null, sort: null, sortDescending: false
      }], null, 0);

      expect(written()).toStrictEqual({
        pod: {
          views: [{
            id: 'a', name: 'A', labelColumns: [], sortDescending: false
          }],
          allIndex: 0
        }
      });
    });

    it('should read a view written that way as the one it came from', () => {
      const { saved } = setup({ pod: { views: [stored('a')] } });

      expect(saved.savedViews.value).toStrictEqual([stored('a')]);
      expect(saved.defaultViewId.value).toBeNull();
      expect(saved.allTabIndex.value).toBe(0);
    });
  });
});
