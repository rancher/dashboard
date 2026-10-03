import ResourceTableViews from '@shell/mixins/resource-table-views';

// The table views half of ResourceTable is its own mixin, so that is where these live
const { methods } = ResourceTableViews;

interface Sorted {
  sort?: string | null;
  sortDescending?: boolean;
}

/** A list showing `view`, whose table is sorted by name ascending until told otherwise */
function list(view: Sorted) {
  const table = {
    sortBy: 'name', descending: false, changeSort: jest.fn()
  };
  const ctx: Record<string, unknown> = {
    showTableViews: true,
    view:           { query: '', ...view },
    viewHeaders:    [{ name: 'name' }, { name: 'age' }],
    defaultSort:    null,
    $refs:          { table },
    $nextTick:      (fn: () => void) => fn(),
  };

  Object.entries(methods).forEach(([name, method]) => {
    ctx[name] = method.bind(ctx);
  });

  return { ctx: ctx as Record<string, unknown> & typeof methods & { view: Sorted }, table };
}

describe('ResourceTable', () => {
  describe('a view\'s own sort', () => {
    it.each([
      ['the same column the other way round', { sort: 'name', sortDescending: true }, ['name', true]],
      ['another column', { sort: 'age', sortDescending: false }, ['age', false]],
    ])('should survive the table\'s first report when it sorts by %s', (_, view, applied) => {
      const { ctx, table } = list(view);

      ctx.recordSort({ sortBy: 'name', descending: false });

      expect(ctx.view).toMatchObject(view);
      expect(ctx.defaultSort).toStrictEqual({ sortBy: 'name', descending: false });
      expect(table.changeSort).toHaveBeenCalledWith(...applied);
    });

    it('should take the table\'s first report as its default when the view has no sort', () => {
      const { ctx, table } = list({ sort: null });

      ctx.recordSort({ sortBy: 'name', descending: false });

      expect(ctx.view.sort).toBeNull();
      expect(table.changeSort).not.toHaveBeenCalled();
    });

    it('should record a sort the user picks afterwards', () => {
      const { ctx } = list({ sort: null });

      ctx.recordSort({ sortBy: 'name', descending: false });
      ctx.recordSort({ sortBy: 'name', descending: true });

      expect(ctx.view).toMatchObject({ sort: 'name', sortDescending: true });
    });
  });
});
