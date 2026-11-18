import SortableTable from '@shell/components/SortableTable/index.vue';

type Column = { hide?: boolean, isColVisible?: boolean } | null | undefined;
type Row = Record<string, unknown>;

const methods = SortableTable.methods as unknown as {
  isColumnVisible: (this: { hasAdvancedFiltering: boolean }, col: Column) => boolean;
  expandAll: (this: { rows: Row[], keyField: string, expanded: Record<string, boolean> }) => void;
  collapseAll: (this: { expanded: Record<string, boolean> }) => void;
};

describe('sortableTable methods', () => {
  describe('isColumnVisible', () => {
    it.each([
      ['a missing column', undefined, false, false],
      ['a hidden column', { hide: true }, false, false],
      ['a column with no advanced filtering', { isColVisible: false }, false, true],
      ['a column included by advanced filtering', { isColVisible: true }, true, true],
      ['a column excluded by advanced filtering', { isColVisible: false }, true, false],
    ])('should determine visibility for %s', (_label, col, hasAdvancedFiltering, expected) => {
      expect(methods.isColumnVisible.call({ hasAdvancedFiltering }, col)).toStrictEqual(expected);
    });
  });

  describe('expandAll', () => {
    it('should mark every row expanded using the configured key field', () => {
      const ctx = {
        rows:     [{ id: 'one' }, { id: 'two' }],
        keyField: 'id',
        expanded: { stale: true },
      };

      methods.expandAll.call(ctx);

      expect(ctx.expanded).toStrictEqual({ one: true, two: true });
    });
  });

  describe('collapseAll', () => {
    it('should clear the expanded state', () => {
      const ctx = { expanded: { one: true, two: true } };

      methods.collapseAll.call(ctx);

      expect(ctx.expanded).toStrictEqual({});
    });
  });
});
