import SortableTable from '@shell/components/SortableTable/index.vue';

type Method = (this: object) => void;

const { paginationChanged } = SortableTable.methods as unknown as Record<string, Method>;
const { viewQuery: viewQueryChanged } = SortableTable.watch as unknown as Record<string, Method>;

describe('sortableTable extension table hooks', () => {
  function createContext({ viewQuery = null as string | null, searchQuery = 'from search box' } = {}) {
    return {
      viewQuery,
      searchQuery,
      searchFields:               ['name'],
      page:                       2,
      perPage:                    10,
      sortFields:                 ['name'],
      sortBy:                     'name',
      descending:                 false,
      externalPaginationEnabled:  false,
      $emit:                      jest.fn(),
      debouncedPaginationChanged: jest.fn(),
    };
  }

  it('should report the search box query without table views', () => {
    const ctx = createContext();

    paginationChanged.call(ctx);

    expect(ctx.$emit).toHaveBeenCalledWith('sortable-table-interaction', {
      pagination: { page: 2, perPage: 10 },
      filtering:  { searchFields: ['name'], searchQuery: 'from search box' },
      sorting:    {
        sort: ['name'], sortBy: 'name', descending: false
      },
    });
  });

  it('should report the table views query in place of the search box', () => {
    const ctx = createContext({ viewQuery: 'state:Error nginx' });

    paginationChanged.call(ctx);

    expect(ctx.$emit).toHaveBeenCalledWith('sortable-table-interaction', expect.objectContaining({ filtering: { searchFields: ['name'], searchQuery: 'state:Error nginx' } }));
  });

  it('should report an emptied table views query as empty, not as the search box query', () => {
    const ctx = createContext({ viewQuery: '' });

    paginationChanged.call(ctx);

    expect(ctx.$emit).toHaveBeenCalledWith('sortable-table-interaction', expect.objectContaining({ filtering: { searchFields: ['name'], searchQuery: '' } }));
  });

  it('should report the interaction again when the table views query changes', () => {
    const ctx = createContext({ viewQuery: 'nginx' });

    viewQueryChanged.call(ctx);

    expect(ctx.debouncedPaginationChanged).toHaveBeenCalledTimes(1);
  });

  it('should keep the search box query out of an external pagination request', () => {
    const ctx = {
      ...createContext({ viewQuery: 'nginx' }), externalPaginationEnabled: true, viewFilters: []
    };

    paginationChanged.call(ctx);

    expect(ctx.$emit).toHaveBeenCalledWith('pagination-changed', expect.objectContaining({ filter: { searchFields: ['name'], searchQuery: 'from search box' } }));
  });
});
