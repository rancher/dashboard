import ResourceTable from '@shell/components/ResourceTable.vue';

const { summaryBaseUrl } = (ResourceTable as any).computed;

describe('ResourceTable', () => {
  describe('summaryBaseUrl', () => {
    const nsFilter = { param: 'filter', fields: [{ field: 'metadata.namespace', value: 'kube-system' }] };
    const viewFilter = { param: 'filter', fields: [{ field: 'metadata.name', value: 'nginx' }] };

    function createContext({
      args = undefined as any,
      viewFilters = [] as any[],
    } = {}) {
      const calls: any[] = [];

      return {
        calls,
        inStore:                'cluster',
        schema:                 { id: 'pod' },
        externalPaginationArgs: args,
        serverViewFilters:      { filters: viewFilters, unsupported: [] },
        $store:                 {
          getters: {
            'cluster/urlFor': (type: string, id: any, opt: any) => {
              calls.push({
                type, id, opt
              });

              return '/v1/pods?pagesize=100';
            }
          }
        },
      };
    }

    it('should ask for a plain url when the list has no pagination args', () => {
      const ctx = createContext();

      expect(summaryBaseUrl.call(ctx)).toBe('/v1/pods?pagesize=100');
      expect(ctx.calls[0].opt).toBeUndefined();
    });

    it('should scope the summary by the list\'s project and namespace filter', () => {
      const ctx = createContext({ args: { projectsOrNamespaces: ['p-abc'], filters: [] } });

      summaryBaseUrl.call(ctx);

      expect(ctx.calls[0].opt.pagination.projectsOrNamespaces).toStrictEqual(['p-abc']);
    });

    it('should keep the filters the list applies on the user\'s behalf', () => {
      const ctx = createContext({ args: { filters: [nsFilter] } });

      summaryBaseUrl.call(ctx);

      expect(ctx.calls[0].opt.pagination.filters).toStrictEqual([nsFilter]);
    });

    it('should drop the view\'s own query filters, so a field is not narrowed by its own term', () => {
      const ctx = createContext({ args: { filters: [nsFilter, viewFilter] }, viewFilters: [viewFilter] });

      summaryBaseUrl.call(ctx);

      expect(ctx.calls[0].opt.pagination.filters).toStrictEqual([nsFilter]);
    });

    it('should not ask for a page or a sort, as a summary counts the whole matching set', () => {
      const ctx = createContext({
        args: {
          page: 3, pageSize: 100, sort: [{ field: 'metadata.name', asc: true }], filters: []
        }
      });

      summaryBaseUrl.call(ctx);

      expect(ctx.calls[0].opt.pagination.page).toBeUndefined();
      expect(ctx.calls[0].opt.pagination.sort).toBeUndefined();
    });
  });
});
