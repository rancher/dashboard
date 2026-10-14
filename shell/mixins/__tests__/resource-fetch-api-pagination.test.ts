import paginationMixin, { parseStateFilter } from '@shell/mixins/resource-fetch-api-pagination';
import { PaginationFilterEquality } from '@shell/types/store/pagination.types';

describe('parseStateFilter', () => {
  it('should return null for null input', () => {
    expect(parseStateFilter(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(parseStateFilter(undefined)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseStateFilter('')).toBeNull();
  });

  it('should parse a single state', () => {
    const result = parseStateFilter('running');

    expect(result).toHaveLength(1);
    expect(result?.[0].field).toStrictEqual('metadata.state.name');
    expect(result?.[0].value).toStrictEqual('running');
    expect(result?.[0].equality).toStrictEqual(PaginationFilterEquality.IN);
  });

  it('should parse multiple comma-separated states', () => {
    const result = parseStateFilter('running,active');

    expect(result).toHaveLength(1);
    expect(result?.[0].field).toStrictEqual('metadata.state.name');
    expect(result?.[0].value).toStrictEqual('running,active');
    expect(result?.[0].equality).toStrictEqual(PaginationFilterEquality.IN);
  });

  it('should parse three comma-separated states', () => {
    const result = parseStateFilter('running,active,waiting');

    expect(result).toHaveLength(1);
    expect(result?.[0].value).toStrictEqual('running,active,waiting');
  });

  it('should ignore empty segments from trailing commas', () => {
    const result = parseStateFilter('running,,active,');

    expect(result).toHaveLength(1);
    expect(result?.[0].value).toStrictEqual('running,active');
  });
});

describe('mixin: resource-fetch-api-pagination', () => {
  describe('computed: paginationScope', () => {
    interface ScopeRequest {
      sort: { field: string }[];
      filters: object[];
    }

    const scopeOf = (ctx: Record<string, unknown> = {}) => paginationMixin.computed.paginationScope.call({
      requestFilters: { filters: [], projectsOrNamespaces: [] },
      apiFilter:      undefined,
      ...ctx,
    });

    it('should carry the fields of a whole request, not only the two the scope is about', () => {
      const scope = scopeOf();

      expect(scope.sort).toStrictEqual([]);
      expect(scope.filters).toStrictEqual([]);
      expect(scope.projectsOrNamespaces).toStrictEqual([]);
    });

    it('should not trip a page filter that reads a field the scope does not set', () => {
      // The project secrets list rewrites a sort field, so it reads `sort` on whatever it is given
      const apiFilter = jest.fn((pagination: ScopeRequest) => {
        pagination.sort.find((s) => s.field === 'metadata.name');

        return pagination;
      });

      expect(() => scopeOf({ apiFilter })).not.toThrow();
      expect(apiFilter).toHaveBeenCalledTimes(1);
    });

    it('should keep a page filter away from the request it is scoping', () => {
      const filters = [{ fields: [{ field: 'metadata.name' }] }];
      const apiFilter = (pagination: ScopeRequest) => {
        pagination.filters.push({ fields: [{ field: 'metadata.namespace' }] });

        return pagination;
      };

      const scope = scopeOf({ requestFilters: { filters, projectsOrNamespaces: [] }, apiFilter });

      expect(filters).toHaveLength(1);
      expect(scope.filters).toHaveLength(2);
    });
  });
});

describe('paginationChanged', () => {
  const event = {
    page: 1, perPage: 100, filter: { searchQuery: '', searchFields: [] }, sort: ['metadata.name'], descending: false
  };

  const stateFieldsFor = (tableViews: boolean, query: Record<string, string> = {}) => {
    const debouncedSetPagination = jest.fn();

    paginationMixin.methods.paginationChanged.call({
      debouncedSetPagination,
      requestFilters: { filters: [], projectsOrNamespaces: [] },
      $route:         { query },
      $store:         { getters: { 'features/get': () => tableViews } },
    }, event);

    return debouncedSetPagination.mock.calls[0][0].filters
      .flatMap((filter: { fields: { field: string }[] }) => filter.fields)
      .filter((field: { field: string }) => field.field === 'metadata.state.name');
  };

  it('should ask for the linked states without table views', () => {
    const [field] = stateFieldsFor(false, { stateFilter: 'completed,running' });

    expect(field.value).toStrictEqual('completed,running');
    expect(field.equality).toStrictEqual(PaginationFilterEquality.IN);
  });

  it('should leave the linked states to the table views when they are on', () => {
    expect(stateFieldsFor(true, { stateFilter: 'completed' })).toStrictEqual([]);
  });
});

describe('watch: stateFilter', () => {
  const watcher = paginationMixin.watch['$route.query.stateFilter'];
  const run = (tableViews: boolean) => {
    const paginationChanged = jest.fn();

    watcher.call({
      paginationChanged, paginationFromList: { page: 1 }, $store: { getters: { 'features/get': () => tableViews } }
    });

    return paginationChanged;
  };

  it('should ask for the list again, as it was asked for, when the linked states change', () => {
    expect(run(false)).toHaveBeenCalledWith({ page: 1 });
  });

  it('should leave it to the table views when they are on', () => {
    expect(run(true)).not.toHaveBeenCalled();
  });
});
