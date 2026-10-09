import paginationMixin from '@shell/mixins/resource-fetch-api-pagination';

describe('paginationScope', () => {
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
