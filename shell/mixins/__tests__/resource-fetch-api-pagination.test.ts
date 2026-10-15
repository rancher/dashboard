import paginationMixin, { parseNameFilter, parseStateFilter } from '@shell/mixins/resource-fetch-api-pagination';
import { PaginationFilterEquality, PaginationFilterField } from '@shell/types/store/pagination.types';

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

describe('function: parseNameFilter', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an empty string', ''],
  ])('should return null for %s', (_, input) => {
    expect(parseNameFilter(input)).toBeNull();
  });

  it('should return a single partial-match filter on metadata.name', () => {
    const result = parseNameFilter('nginx');

    expect(result).toStrictEqual([new PaginationFilterField({
      field: 'metadata.name',
      value: 'nginx',
      exact: false,
    })]);
  });

  it('should use the contains equality', () => {
    const result = parseNameFilter('nginx');

    expect(result?.[0].equality).toStrictEqual(PaginationFilterEquality.CONTAINS);
  });

  it('should pass the value through unchanged, including commas', () => {
    const result = parseNameFilter('nginx,web');

    expect(result?.[0].value).toStrictEqual('nginx,web');
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

  const fieldsFor = (path: string) => (tableViews: boolean, query: Record<string, string> = {}) => {
    const debouncedSetPagination = jest.fn();

    paginationMixin.methods.paginationChanged.call({
      debouncedSetPagination,
      requestFilters: { filters: [], projectsOrNamespaces: [] },
      $route:         { query },
      $store:         { getters: { 'features/get': () => tableViews } },
    }, event);

    return debouncedSetPagination.mock.calls[0][0].filters
      .flatMap((filter: { fields: { field: string }[] }) => filter.fields)
      .filter((field: { field: string }) => field.field === path);
  };
  const stateFieldsFor = fieldsFor('metadata.state.name');
  const nameFieldsFor = fieldsFor('metadata.name');

  it('should ask for the linked states without table views', () => {
    const [field] = stateFieldsFor(false, { stateFilter: 'completed,running' });

    expect(field.value).toStrictEqual('completed,running');
    expect(field.equality).toStrictEqual(PaginationFilterEquality.IN);
  });

  it('should leave the linked states to the table views when they are on', () => {
    expect(stateFieldsFor(true, { stateFilter: 'completed' })).toStrictEqual([]);
  });

  it('should ask for the linked name, as a partial match, without table views', () => {
    const [field] = nameFieldsFor(false, { nameFilter: 'nginx' });

    expect(field.value).toStrictEqual('nginx');
    expect(field.equality).toStrictEqual(PaginationFilterEquality.CONTAINS);
  });

  it('should ask for the linked name alongside the linked states', () => {
    expect(nameFieldsFor(false, { nameFilter: 'nginx', stateFilter: 'running' })).toHaveLength(1);
    expect(stateFieldsFor(false, { nameFilter: 'nginx', stateFilter: 'running' })).toHaveLength(1);
  });

  it('should leave the linked name to the table views when they are on', () => {
    expect(nameFieldsFor(true, { nameFilter: 'nginx' })).toStrictEqual([]);
  });
});

describe.each(['stateFilter', 'nameFilter'])('watch: %s', (key) => {
  const watcher = paginationMixin.watch[`$route.query.${ key }` as '$route.query.stateFilter'];
  const run = (tableViews: boolean) => {
    const paginationChanged = jest.fn();

    watcher.call({
      linkedFilterChanged: paginationMixin.methods.linkedFilterChanged,
      paginationChanged,
      paginationFromList:  { page: 1 },
      $store:              { getters: { 'features/get': () => tableViews } },
    });

    return paginationChanged;
  };

  it('should ask for the list again, as it was asked for, when the link changes', () => {
    expect(run(false)).toHaveBeenCalledWith({ page: 1 });
  });

  it('should leave it to the table views when they are on', () => {
    expect(run(true)).not.toHaveBeenCalled();
  });
});
