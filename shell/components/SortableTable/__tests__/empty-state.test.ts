import SortableTable from '@shell/components/SortableTable/index.vue';

const { noResults, noRows } = SortableTable.computed as unknown as Record<string, (this: object) => boolean>;

/** A table whose rows came in already filtered, or not, by a query from outside it */
function table({ queried = false, searchQuery = '', rows = [] as object[] } = {}) {
  const ctx = {
    queried, searchQuery, rows, pagedRows: rows, noResults: false
  };

  ctx.noResults = noResults.call(ctx);

  return ctx;
}

describe('sortableTable', () => {
  describe('an empty table', () => {
    it('should say nothing matched when a query from outside it emptied it', () => {
      const ctx = table({ queried: true });

      expect(ctx.noResults).toBe(true);
      expect(noRows.call(ctx)).toBe(false);
    });

    it('should say there are no rows when nothing narrowed it', () => {
      const ctx = table();

      expect(ctx.noResults).toBe(false);
      expect(noRows.call(ctx)).toBe(true);
    });

    it('should say nothing matched its own search', () => {
      expect(table({ searchQuery: 'x' }).noResults).toBe(true);
    });

    it('should show the rows a query left', () => {
      const ctx = table({ queried: true, rows: [{ id: 'a' }] });

      expect(ctx.noResults).toBe(false);
      expect(noRows.call(ctx)).toBe(false);
    });
  });
});
