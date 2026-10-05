import ResourceTableViews from '@shell/mixins/resource-table-views';
import { isNavigating } from '@shell/config/router/navigation-guards/navigation-state';
import { TABLE_VIEWS } from '@shell/store/prefs';

jest.mock('@shell/config/router/navigation-guards/navigation-state', () => ({ isNavigating: jest.fn(() => false) }));

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

    describe('a link naming some of the list\'s states', () => {
      const linked = (table: Record<string, unknown> = {}) => open(saved, { $route: { path: '/c/local/explorer/pod', query: { stateFilter: 'running,active' } }, ...table });

      it('should open the table\'s own tab, filtered to them, rather than the default view', () => {
        const opened = linked();

        expect(opened.openedViewId).toBeNull();
        expect(opened.view.query).toBe('state:running state:active');
        expect(opened.settledQuery).toBe('state:running state:active');
      });

      describe('its parameter, once the query holds the states', () => {
        const { dropStateLink } = (ResourceTableViews as unknown as { methods: { dropStateLink: (this: object) => void } }).methods;
        const table = (more: Record<string, unknown> = {}) => {
          const ctx: Record<string, unknown> = {
            stateLinkPending: true,
            showTableViews:   true,
            $route:           {
              path: '/c/local/explorer/pod', query: { stateFilter: 'running', other: 'kept' }, hash: '#x'
            },
            $router: { replace: jest.fn(() => Promise.resolve()) },
            ...more,
          };

          ctx.dropStateLink = () => dropStateLink.call(ctx);

          return ctx as { stateLinkPending: boolean, dropStateLink: () => void, $router: { replace: jest.Mock } };
        };

        afterEach(() => {
          jest.mocked(isNavigating).mockReturnValue(false);
          jest.useRealTimers();
        });

        it('should leave the URL, keeping the rest of it, so a reload after the query was cleared doesn\'t filter again', () => {
          const ctx = table();

          ctx.dropStateLink();
          ctx.dropStateLink();

          expect(ctx.$router.replace).toHaveBeenCalledTimes(1);
          expect(ctx.$router.replace).toHaveBeenCalledWith({
            path: '/c/local/explorer/pod', query: { other: 'kept' }, hash: '#x'
          });
          expect(ctx.stateLinkPending).toBe(false);
        });

        it('should wait while another page is on its way, so as not to call that navigation off', () => {
          jest.useFakeTimers();
          jest.mocked(isNavigating).mockReturnValue(true);
          const ctx = table();

          ctx.dropStateLink();
          jest.advanceTimersByTime(900);
          expect(ctx.$router.replace).not.toHaveBeenCalled();

          jest.mocked(isNavigating).mockReturnValue(false);
          jest.advanceTimersByTime(300);
          expect(ctx.$router.replace).toHaveBeenCalledTimes(1);
        });

        describe('as the query changes', () => {
          const queryChanged = (ResourceTableViews as unknown as { watch: Record<string, (this: object, neu: string, old: string) => void> }).watch['view.query'];
          const watching = () => {
            const debouncedSettleQuery = Object.assign(jest.fn(), { cancel: jest.fn(), flush: jest.fn() });

            return {
              stateLinkPending: true, stateLinkQuery: 'state:running', settledQuery: 'state:running', debouncedSettleQuery, dropStateLink: jest.fn()
            };
          };

          it('should keep the link\'s states in the URL while the query is still theirs, so Back or a reload filters again', () => {
            const ctx = watching();

            queryChanged.call(ctx, 'state:running', '');

            expect(ctx.dropStateLink).not.toHaveBeenCalled();
          });

          it.each([
            ['typed into', 'state:running name:web'],
            ['cleared', ''],
            ['swapped for a tab\'s', 'namespace:default'],
          ])('should drop them once the query is %s', (_, query) => {
            const ctx = watching();

            queryChanged.call(ctx, query, 'state:running');

            expect(ctx.dropStateLink).toHaveBeenCalledTimes(1);
          });

          it('should leave the URL alone once they are gone', () => {
            const ctx = { ...watching(), stateLinkPending: false };

            queryChanged.call(ctx, '', 'state:running');

            expect(ctx.dropStateLink).not.toHaveBeenCalled();
          });
        });

        it.each([
          ['until the table shows its views', { showTableViews: false }],
          ['when no link named any states', { stateLinkPending: false }],
        ])('should leave the URL alone %s', (_, more) => {
          const ctx = table(more);

          ctx.dropStateLink();

          expect(ctx.$router.replace).not.toHaveBeenCalled();
        });
      });

      it.each([
        ['on a table without the saved view tabs', { providedShowTableViewTabs: false }],
        ['with table views turned off', {
          $store: {
            getters: {
              'prefs/get':    (key: string) => (key === TABLE_VIEWS ? { pod: saved } : undefined),
              'features/get': () => false,
            }
          }
        }],
      ])('should leave the link alone %s', (_, table) => {
        const opened = linked(table);

        expect(opened.view.query).toBe('');
      });
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

    describe('views shared with everyone', () => {
      const pageConfig = {
        metadata: { name: 'page', creationTimestamp: '2026-01-01T00:00:00Z' },
        spec:     {
          type:  'PAGE',
          page:  'pod',
          views: [{
            id: 'team', name: 'Team', query: 'state:error'
          }],
          defaultViewId: 'team'
        },
      };

      function openShared(prefs: Record<string, unknown> | undefined, loaded = true) {
        return data.call({
          schema: { id: 'pod' },
          $store: {
            getters: {
              'prefs/get':            (key: string) => (key === TABLE_VIEWS && prefs ? { pod: prefs } : undefined),
              'management/schemaFor': () => ({ id: 'ui.cattle.io.tableconfiguration' }),
              'management/haveAll':   () => loaded,
              'management/all':       () => [pageConfig],
            }
          },
        });
      }

      it('should open on the page\'s shared default when the user has none', () => {
        const opened = openShared(undefined);

        expect(opened.openedViewId).toBe('team');
        expect(opened.view.query).toBe('state:error');
      });

      it('should open on the user\'s default over the shared one', () => {
        expect(openShared(saved).openedViewId).toBe('bbb');
      });

      it('should open on the table\'s own tab when the user chose it over the shared default', () => {
        expect(openShared({ ...saved, defaultViewId: 'all' }).openedViewId).toBeUndefined();
      });

      it('should open on a shared view the user made their default', () => {
        expect(openShared({ ...saved, defaultViewId: 'team' }).openedViewId).toBe('team');
      });

      it('should leave the shared default to the tabs while the shared views are still loading', () => {
        expect(openShared(undefined, false).openedViewId).toBeUndefined();
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
