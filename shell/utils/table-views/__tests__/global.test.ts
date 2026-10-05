import {
  ALL_TAB_KEY, defaultViewIdFor, globalPageKey, globalViewsFor, tabOrderFor, viewConfigName
} from '@shell/utils/table-views/global';
import type { GlobalTableViews, TableConfiguration } from '@shell/utils/table-views/global';
import type { TableViewSaved } from '@shell/types/table-views';

const view = (id: string, name = id): TableViewSaved => ({ id, name });

const pageConfig = (name: string, page: string, views: TableViewSaved[], extra: Record<string, unknown> = {}, created = '2026-01-01T00:00:00Z'): TableConfiguration => ({
  metadata: { name, creationTimestamp: created },
  spec:     {
    type: 'PAGE', page, views, ...extra
  },
});

const viewConfig = (name: string, page: string, saved: TableViewSaved, created = '2026-01-01T00:00:00Z'): TableConfiguration => ({
  metadata: { name, creationTimestamp: created },
  spec:     {
    type: 'VIEW', page, view: saved
  },
});

const ids = (shared: GlobalTableViews) => shared.views.map((entry) => entry.view.id);

const none: GlobalTableViews = {
  views: [], defaultViewId: null, allIndex: 0
};

describe('shared table views', () => {
  describe('globalPageKey', () => {
    it('should file a list under its page when it keeps views of its own, else its type', () => {
      expect(globalPageKey('management.cattle.io.cluster', 'home')).toBe('home');
      expect(globalPageKey('pod', null)).toBe('pod');
    });
  });

  describe('globalViewsFor', () => {
    it('should read nothing without resources', () => {
      expect(globalViewsFor(undefined, 'pod')).toStrictEqual(none);
    });

    it('should take the PAGE resource\'s views in order, then each VIEW resource\'s, oldest first', () => {
      const shared = globalViewsFor([
        viewConfig('late', 'pod', view('v2'), '2026-03-01T00:00:00Z'),
        viewConfig('early', 'pod', view('v1'), '2026-02-01T00:00:00Z'),
        pageConfig('page', 'pod', [view('p1'), view('p2')]),
      ], 'pod');

      expect(ids(shared)).toStrictEqual(['p1', 'p2', 'v1', 'v2']);
    });

    it('should only read the page\'s own resources', () => {
      const shared = globalViewsFor([viewConfig('a', 'node', view('n1')), viewConfig('b', 'pod', view('v1'))], 'pod');

      expect(ids(shared)).toStrictEqual(['v1']);
    });

    it('should read only the oldest PAGE resource of a page', () => {
      const shared = globalViewsFor([
        pageConfig('newer', 'pod', [view('b')], {}, '2026-02-01T00:00:00Z'),
        pageConfig('older', 'pod', [view('a')], {}, '2026-01-01T00:00:00Z'),
      ], 'pod');

      expect(ids(shared)).toStrictEqual(['a']);
    });

    it('should keep the first of two views with the same id, and skip one without a name', () => {
      const shared = globalViewsFor([
        pageConfig('page', 'pod', [view('a', 'From the page')]),
        viewConfig('dup', 'pod', view('a', 'From a view')),
        viewConfig('nameless', 'pod', { id: 'b' } as TableViewSaved),
      ], 'pod');

      expect(shared.views.map((entry) => entry.view.name)).toStrictEqual(['From the page']);
    });

    it('should read the PAGE resource\'s default and tab place, ignoring a default it does not hold', () => {
      expect(globalViewsFor([pageConfig('page', 'pod', [view('a'), view('b')], { defaultViewId: 'b', allIndex: 1 })], 'pod')).toMatchObject({ defaultViewId: 'b', allIndex: 1 });
      expect(globalViewsFor([pageConfig('page', 'pod', [view('a')], { defaultViewId: 'gone', allIndex: 9 })], 'pod')).toMatchObject({ defaultViewId: null, allIndex: 1 });
    });

    it('should say which resource holds each view', () => {
      const page = pageConfig('page', 'pod', [view('a')]);
      const single = viewConfig('single', 'pod', view('b'));

      expect(globalViewsFor([page, single], 'pod').views.map((entry) => entry.config)).toStrictEqual([page, single]);
    });
  });

  describe('tabOrderFor', () => {
    const shared = (allIndex = 0): GlobalTableViews => ({
      views: [{ view: view('g1'), config: {} }, { view: view('g2'), config: {} }], defaultViewId: null, allIndex
    });

    it('should be the user\'s views around the table\'s own tab with nothing shared, as before', () => {
      expect(tabOrderFor({
        personal: [view('a'), view('b')], personalAllIndex: 1, global: none
      })).toStrictEqual(['a', ALL_TAB_KEY, 'b']);
    });

    it('should put the shared views around the table\'s own tab, in the user\'s views\' places', () => {
      expect(tabOrderFor({
        personal: [view('a'), view('b')], personalAllIndex: 1, global: shared()
      })).toStrictEqual(['a', ALL_TAB_KEY, 'g1', 'g2', 'b']);
      expect(tabOrderFor({
        personal: [view('a')], personalAllIndex: 0, global: shared(1)
      })).toStrictEqual(['g1', ALL_TAB_KEY, 'g2', 'a']);
    });

    it('should follow the user\'s own order, with views it does not name at the end and gone ones left out', () => {
      expect(tabOrderFor({
        personal: [view('a'), view('b')], global: shared(), order: ['g2', 'gone', 'a', ALL_TAB_KEY]
      })).toStrictEqual(['g2', 'a', ALL_TAB_KEY, 'g1', 'b']);
    });

    it('should keep the table\'s own tab when the user\'s order lost it', () => {
      expect(tabOrderFor({
        personal: [], global: shared(), order: ['g2', 'g1']
      })).toStrictEqual([ALL_TAB_KEY, 'g2', 'g1']);
    });

    it('should show a view that is both the user\'s and shared once, as shared', () => {
      expect(tabOrderFor({ personal: [view('g1'), view('a')], global: shared() })).toStrictEqual([ALL_TAB_KEY, 'g1', 'g2', 'a']);
    });
  });

  describe('defaultViewIdFor', () => {
    const shared: GlobalTableViews = {
      views: [{ view: view('g'), config: {} }], defaultViewId: 'g', allIndex: 0
    };

    it('should take the user\'s default over the page\'s shared one', () => {
      expect(defaultViewIdFor('a', shared, ['g', 'a'])).toBe('a');
    });

    it('should open the table\'s own tab when the user chose it over the shared default', () => {
      expect(defaultViewIdFor(ALL_TAB_KEY, shared, ['g'])).toBeNull();
    });

    it('should fall back to the shared default when the user has none, or theirs is gone', () => {
      expect(defaultViewIdFor(null, shared, ['g'])).toBe('g');
      expect(defaultViewIdFor('gone', shared, ['g'])).toBe('g');
    });

    it('should be the table\'s own tab with no default anywhere', () => {
      expect(defaultViewIdFor(null, none, ['a'])).toBeNull();
    });
  });

  describe('viewConfigName', () => {
    it('should make a resource name from the page and the view id', () => {
      expect(viewConfigName('management.cattle.io.cluster', 'AbC_12')).toBe('view-management-cattle-io-cluster-abc-12');
    });

    it('should keep the name within what a resource name allows', () => {
      const name = viewConfigName('x'.repeat(400), 'y'.repeat(100));

      expect(name.length).toBeLessThanOrEqual(253);
      expect(name).toMatch(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/);
    });
  });
});
