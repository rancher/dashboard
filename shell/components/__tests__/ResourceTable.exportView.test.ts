import ResourceTableViews from '@shell/mixins/resource-table-views';
import { fieldsFor } from '@shell/utils/table-views/fields';

// The table views half of ResourceTable is its own mixin, so that is where these live
const { methods } = ResourceTableViews;

const HEADERS = [
  {
    name: 'name', label: 'Name', value: 'metadata.name', sort: ['nameSort']
  },
  {
    name: 'namespace', label: 'Namespace', value: 'metadata.namespace', sort: ['metadata.namespace']
  },
];

interface Row {
  nameSort: string;
  id: string;
  metadata: { name: string, namespace: string };
}

const row = (name: string, namespace: string): Row => ({
  nameSort: name, id: `${ namespace }/${ name }`, metadata: { name, namespace }
});
const ROWS = [row('c', 'kube'), row('a', 'default'), row('b', 'kube'), row('d', 'default')];

/** A list that is not server side paginated, holding ROWS, with the methods under test on it */
function list(overrides: Record<string, unknown> = {}) {
  const ctx: Record<string, unknown> = {
    _headers:             HEADERS,
    showTableViews:       false,
    serverSideTableViews: false,
    filteredRows:         ROWS,
    viewFields:           fieldsFor(HEADERS, ROWS),
    defaultSort:          { sortBy: 'name', descending: false },
    _mandatorySort:       null,
    ...overrides,
  };

  // No fields of the list's own for the query here, so it reads the columns alone
  ctx.viewQueryFields = ctx.viewFields;

  Object.entries(methods).forEach(([name, method]) => {
    ctx[name] = method.bind(ctx);
  });

  return ctx as Record<string, unknown> & typeof methods;
}

const names = (rows: Row[]) => rows.map((r) => r.metadata.name);

describe('ResourceTable', () => {
  describe('exporting a view that is not on screen', () => {
    it('should take the rows its own query matches, not the ones on screen', async() => {
      const rows = await list().rowsForView({ query: 'namespace:kube' }, undefined, 100);

      expect(names(rows)).toStrictEqual(['b', 'c']);
    });

    it('should take every row when its query is empty', async() => {
      const rows = await list().rowsForView({ query: '' }, undefined, 100);

      expect(names(rows)).toStrictEqual(['a', 'b', 'c', 'd']);
    });

    it('should order them by the column the view sorts on, the way it asks', () => {
      const rows = list().orderRowsFor({ sort: 'name', sortDescending: true }, ROWS);

      expect(names(rows)).toStrictEqual(['d', 'c', 'b', 'a']);
    });

    it('should fall back to the table\'s own sort when the view sorts on nothing it shows', () => {
      const rows = list().orderRowsFor({ sort: 'gone', sortDescending: true }, ROWS);

      expect(names(rows)).toStrictEqual(['a', 'b', 'c', 'd']);
    });

    it('should gather the rows by the view\'s grouping before sorting within it', () => {
      const rows = list().orderRowsFor({ groupBy: 'namespace', sort: 'name' }, ROWS);

      expect(rows.map((r: Row) => `${ r.metadata.namespace }/${ r.metadata.name }`)).toStrictEqual(['default/a', 'default/d', 'kube/b', 'kube/c']);
    });

    it('should ask the api for its own filters, under the list\'s scope, on a paginated list', async() => {
      const dispatch = jest.fn().mockResolvedValue({ data: [row('a', 'default')], pagination: { result: { count: 1 } } });
      const ctx = list({
        serverSideTableViews: true,
        schema:               { id: 'pod' },
        inStore:              'cluster',
        listScopeFilters:     ['scope'],
        listScopeNamespaces:  ['default'],
        viewFields:           fieldsFor(HEADERS, ROWS, undefined, [{ ...HEADERS[1], search: 'metadata.namespace' }]),
        $store:               { dispatch },
      });

      await ctx.rowsForView({ query: 'namespace:kube' }, undefined, 100);

      const pagination = dispatch.mock.calls[0][1].opt.pagination;

      expect(pagination.projectsOrNamespaces).toStrictEqual(['default']);
      expect(pagination.filters[0]).toBe('scope');
      expect(JSON.stringify(pagination.filters.slice(1))).toContain('metadata.namespace');
    });

    it('should ask the api for the rows in the view\'s order, and keep it', async() => {
      // Answered in an order no local sort would give, to show the api's is kept
      const dispatch = jest.fn().mockResolvedValue({ data: [row('c', 'kube'), row('a', 'default')], pagination: { result: { count: 2 } } });
      const ctx = list({
        serverSideTableViews: true,
        schema:               { id: 'pod' },
        inStore:              'cluster',
        listScopeFilters:     [],
        listScopeNamespaces:  [],
        $store:               { dispatch },
      });

      const rows = await ctx.rowsForView({
        query: '', sort: 'name', sortDescending: true
      }, undefined, 100);

      expect(dispatch.mock.calls[0][1].opt.pagination.sort).toStrictEqual([{ field: 'nameSort', asc: false }, { field: 'id', asc: false }]);
      expect(names(rows)).toStrictEqual(['c', 'a']);
    });

    it('should export another tab with its own rows and its own columns', async() => {
      const ctx = list({
        $store:        { dispatch: jest.fn().mockResolvedValue('notification') },
        t:             (key: string) => key,
        exportColumns: [{ label: 'on screen' }],
      });
      const onScreen = jest.fn();
      const writeExport = jest.fn().mockResolvedValue('file.csv');

      ctx.allMatchingRows = onScreen;
      ctx.writeExport = writeExport;

      await ctx.handleExport({
        format: 'csv', name: 'Other', view: { query: 'namespace:kube' }
      });

      expect(onScreen).not.toHaveBeenCalled();

      const [rows, format, , columns] = writeExport.mock.calls[0];

      expect(names(rows)).toStrictEqual(['b', 'c']);
      expect(format).toBe('csv');
      expect(columns).not.toStrictEqual([{ label: 'on screen' }]);
    });

    it('should export the view on screen as it always has when no view comes with it', async() => {
      const ctx = list({
        $store:        { dispatch: jest.fn().mockResolvedValue('notification') },
        t:             (key: string) => key,
        exportColumns: [{ label: 'on screen' }],
      });

      const allMatchingRows = jest.fn().mockResolvedValue(ROWS);
      const writeExport = jest.fn().mockResolvedValue('file.csv');

      ctx.allMatchingRows = allMatchingRows;
      ctx.writeExport = writeExport;

      await ctx.handleExport({ format: 'csv', name: 'Shown' });

      expect(allMatchingRows).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));
      expect(writeExport.mock.calls[0][3]).toStrictEqual([{ label: 'on screen' }]);
    });
  });
});
