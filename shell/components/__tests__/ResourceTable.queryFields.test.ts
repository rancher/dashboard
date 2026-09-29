import ResourceTableViews from '@shell/mixins/resource-table-views';
import { pinnedQueryFields } from '@shell/utils/table-views/query-fields';
import { PaginationFilterEquality } from '@shell/types/store/pagination.types';
import type { TableViewField } from '@shell/types/table-views';

// The table views half of ResourceTable is its own mixin, so that is where these live
const { methods } = ResourceTableViews;
const { viewFieldValues, viewFilterFields } = ResourceTableViews.computed;

const NAME: TableViewField = {
  id:      'name',
  label:   'Name',
  isLabel: false,
  header:  {
    name: 'name', value: 'nameDisplay', sort: ['nameSort']
  },
  paginationHeader: { name: 'name', search: 'spec.displayName' }
};
const PROVIDER: TableViewField = {
  id:      'provider',
  label:   'Provider',
  isLabel: false,
  header:  {
    name: 'provider', value: 'provider', sort: ['provider']
  }
};

interface CountRequest {
  filters: { fields: { field: string, value: string, equality: string }[] }[];
}

/** A server side list of clusters, 2 of 7 pinned, that answers each count with `counts` */
function list({ counts = {} as Record<string, number>, fail = false } = {}) {
  const queryFields = pinnedQueryFields({
    label: 'Pinned', idLabel: 'Cluster ID', pinnedIds: () => ['c-1', 'c-2'], idPath: 'id', serverPath: 'metadata.name', pinnedCount: 1, total: 3
  });
  const requests: CountRequest[] = [];

  const ctx: Record<string, unknown> = {
    requests,
    queryFields,
    serverSideTableViews: true,
    inStore:              'management',
    schema:               { id: 'management.cattle.io.cluster' },
    fieldValues:          {},
    viewFields:           [NAME, PROVIDER],
    viewQueryFields:      [NAME, PROVIDER, ...queryFields],
    listScopeFilters:     [],
    listScopeNamespaces:  [],
    $store:               {
      getters:  { 'management/urlFor': (type: string, id: null, opt: { pagination: CountRequest }) => opt.pagination },
      dispatch: (action: string, { opt }: { opt: { url: CountRequest } }) => {
        requests.push(opt.url);

        if (fail) {
          return Promise.reject(new Error('down'));
        }

        const { equality } = opt.url.filters[0].fields[0];

        return Promise.resolve({ count: counts[equality] });
      },
    },
  };

  Object.entries(methods).forEach(([name, method]) => {
    ctx[name] = method.bind(ctx);
  });

  return ctx as Record<string, unknown> & typeof methods;
}

describe('ResourceTable', () => {
  describe('a field only for the query, on a server side list', () => {
    it('should count each of its values at the api, in the list\'s scope', async() => {
      const ctx = list({ counts: { [PaginationFilterEquality.IN]: 2, [PaginationFilterEquality.NOT_IN]: 5 } });

      await ctx.fetchFieldValues('pinned');

      expect((ctx.requests as CountRequest[]).map((r) => r.filters[0].fields.map((f) => [f.field, f.value, f.equality]))).toStrictEqual([
        [['metadata.name', 'c-1,c-2', PaginationFilterEquality.IN]],
        [['metadata.name', 'c-1,c-2', PaginationFilterEquality.NOT_IN]],
      ]);
      expect((ctx.fieldValues as Record<string, unknown>).pinned).toStrictEqual([{ value: 'true', count: 2 }, { value: 'false', count: 5 }]);
    });

    it('should ask once', async() => {
      const ctx = list({ counts: { [PaginationFilterEquality.IN]: 2, [PaginationFilterEquality.NOT_IN]: 5 } });

      await ctx.fetchFieldValues('pinned');
      await ctx.fetchFieldValues('pinned');

      expect(ctx.requests).toHaveLength(2);
    });

    it('should offer the values it knows up front when the api can\'t count them', async() => {
      const ctx = list({ fail: true });

      await ctx.fetchFieldValues('pinned');

      expect((ctx.fieldValues as Record<string, unknown>).pinned).toStrictEqual([{ value: 'true', count: 1 }, { value: 'false', count: 2 }]);
    });

    it('should not suggest the page\'s counts while the api\'s are on their way', () => {
      const ctx = list();

      expect(viewFieldValues.call(ctx)).toStrictEqual({});
      expect(viewFieldValues.call({ ...ctx, serverSideTableViews: false })).toStrictEqual({ pinned: [{ value: 'true', count: 1 }, { value: 'false', count: 2 }] });
    });

    it('should be suggested after the name', () => {
      const ctx = {
        ...list(), viewSortableFields: [NAME, PROVIDER], viewDateFields: []
      };

      expect(viewFilterFields.call(ctx).map((field: TableViewField) => field.id)).toStrictEqual(['name', 'pinned', 'provider']);
    });
  });
});
