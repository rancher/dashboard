import paginationMixin, { parseNameFilter, parseStateFilter } from '@shell/mixins/resource-fetch-api-pagination';
import { PaginationFilterEquality, PaginationArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';

describe('function: parseStateFilter', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an empty string', ''],
  ])('should return null for %s', (_, input) => {
    expect(parseStateFilter(input)).toBeNull();
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

  describe('method: paginationChanged', () => {
    const paginationChanged = (paginationMixin.methods as any).paginationChanged;

    const tableEvent = {
      page:       1,
      perPage:    10,
      filter:     { searchQuery: '', searchFields: [] },
      sort:       ['metadata.name'],
      descending: false,
    };

    function callPaginationChanged(query: Record<string, string> = {}) {
      const ctx = {
        $route:                 { query },
        requestFilters:         { filters: [], projectsOrNamespaces: [] },
        debouncedSetPagination: jest.fn(),
        paginationFromList:     null,
      };

      paginationChanged.call(ctx, tableEvent);

      return ctx.debouncedSetPagination.mock.calls[0][0] as PaginationArgs;
    }

    it('should add an empty name filter param when there is no nameFilter query', () => {
      const pagination = callPaginationChanged();

      expect(pagination.filters[2]).toStrictEqual(new PaginationParamFilter({ fields: [] }));
    });

    it('should add the nameFilter query as a partial match on metadata.name', () => {
      const pagination = callPaginationChanged({ nameFilter: 'nginx' });

      expect(pagination.filters[2]).toStrictEqual(new PaginationParamFilter({ fields: parseNameFilter('nginx') as PaginationFilterField[] }));
    });

    it('should apply the nameFilter alongside a stateFilter', () => {
      const pagination = callPaginationChanged({ nameFilter: 'nginx', stateFilter: 'running' });

      expect(pagination.filters.slice(1, 3)).toStrictEqual([
        new PaginationParamFilter({ fields: parseStateFilter('running') as PaginationFilterField[] }),
        new PaginationParamFilter({ fields: parseNameFilter('nginx') as PaginationFilterField[] }),
      ]);
    });
  });
});
