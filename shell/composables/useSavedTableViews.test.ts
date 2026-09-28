import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';

import { useSavedTableViews } from '@shell/composables/useSavedTableViews';
import { TABLE_VIEWS } from '@shell/store/prefs';
import type { TableViewSaved } from '@shell/types/table-views';

const view = (id: string, name = id): TableViewSaved => ({
  id, name, query: '', columns: null, labelColumns: [], groupBy: null
});

function setup(stored: Record<string, unknown>, type = 'pod') {
  const setPref = jest.fn();
  const store = createStore({
    getters: { 'prefs/get': () => (key: string) => (key === TABLE_VIEWS ? stored : undefined) },
    actions: { 'prefs/set': (_ctx: unknown, payload: unknown) => setPref(payload) },
  });
  let saved: ReturnType<typeof useSavedTableViews>;

  mount(defineComponent({
    setup() {
      saved = useSavedTableViews(() => type);

      return () => h('div');
    }
  }), { global: { plugins: [store] } });

  const written = () => setPref.mock.calls[setPref.mock.calls.length - 1][0].value;

  return {
    saved: saved!, setPref, written
  };
}

describe('useSavedTableViews', () => {
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

    expect(written().pod.defaultViewId).toBeNull();
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
});
