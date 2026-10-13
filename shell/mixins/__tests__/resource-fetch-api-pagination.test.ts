import paginationMixin from '@shell/mixins/resource-fetch-api-pagination';

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
