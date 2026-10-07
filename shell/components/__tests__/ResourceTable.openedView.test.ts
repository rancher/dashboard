import ResourceTableViews from '@shell/mixins/resource-table-views';
import { TABLE_VIEWS } from '@shell/store/prefs';

// The table views half of ResourceTable is its own mixin, so that is where this lives
const { data } = ResourceTableViews;

describe('ResourceTable', () => {
  describe('openedViewId', () => {
    const saved = {
      views: [
        {
          id: 'aaa', name: 'Untitled', query: '', columns: null, labelColumns: [], groupBy: null
        },
        {
          id: 'bbb', name: 'Untitled 2', query: '', columns: null, labelColumns: [], groupBy: null
        },
      ],
      defaultViewId: 'bbb',
    };

    function open(prefs: Record<string, unknown> = saved, table: Record<string, unknown> = {}) {
      return data.call({
        schema: { id: 'pod' },
        $store: { getters: { 'prefs/get': (key: string) => (key === TABLE_VIEWS ? { pod: prefs } : undefined) } },
        ...table,
      });
    }

    it('should name the default view when the list opens on it', () => {
      expect(open().openedViewId).toBe('bbb');
    });

    it('should name no view when the user has no default', () => {
      expect(open({ ...saved, defaultViewId: null }).openedViewId).toBeUndefined();
    });

    describe('a page keeping saved views of its own', () => {
      const views = (id: string, query: string) => ({
        views: [{
          id, name: id, query, columns: null, labelColumns: [], groupBy: null
        }],
        defaultViewId: id,
      });
      const both = { pod: { ...views('shared', 'state:error'), pages: { home: views('own', 'state:active') } } };

      function openWith(table: Record<string, unknown> = {}) {
        return data.call({
          schema: { id: 'pod' },
          $store: { getters: { 'prefs/get': (key: string) => (key === TABLE_VIEWS ? both : undefined) } },
          ...table,
        });
      }

      it('should open on its own default, kept under the type', () => {
        const opened = openWith({ tableViewsPage: 'home' });

        expect(opened.openedViewId).toBe('own');
        expect(opened.view.query).toBe('state:active');
      });

      it('should leave the plain type\'s views to the other lists', () => {
        expect(openWith().openedViewId).toBe('shared');
      });

      it('should start with none when the page has no views yet', () => {
        expect(openWith({ tableViewsPage: 'other' }).openedViewId).toBeUndefined();
      });
    });

    describe('a table without the saved view tabs', () => {
      const filtering = {
        ...saved,
        views: [{
          id: 'ccc', name: 'Errors', query: 'state:error', columns: ['name'], labelColumns: ['app'], groupBy: 'namespace'
        }],
        defaultViewId: 'ccc',
      };

      it.each([
        ['on a detail page\'s tab', { providedShowTableViewTabs: false }],
        ['told to hide them', { tableViewTabs: false }],
        ['on a page routed to one resource', { $route: { params: { id: 'rancher' } } }],
      ])('should open on its own view, not the saved default, %s', (_, table) => {
        const opened = open(filtering, table);

        expect(opened.openedViewId).toBeUndefined();
        expect(opened.view).toStrictEqual(expect.objectContaining({
          query: '', columns: null, labelColumns: [], groupBy: null
        }));
        expect(opened.settledQuery).toBe('');
      });

      it('should open on the saved default when told to show the tabs', () => {
        const opened = open(filtering, { tableViewTabs: true, $route: { params: { id: 'rancher' } } });

        expect(opened.openedViewId).toBe('ccc');
        expect(opened.view.query).toBe('state:error');
      });
    });
  });
});
