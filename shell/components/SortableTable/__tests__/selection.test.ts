import { reactive } from 'vue';
import selection from '@shell/components/SortableTable/selection';

const { methods } = selection as any;

/** The table's own state, reactive as its data is, around rows a list gave as plain objects */
const table = () => {
  const ctx = reactive({
    selectedRows: [] as object[],
    keyField:     'id',
    $nextTick:    (fn: () => void) => fn(),
    $emit:        jest.fn(),
  }) as any;

  Object.entries(methods).forEach(([name, fn]) => {
    ctx[name] = (fn as (...args: unknown[]) => unknown).bind(ctx);
  });
  // The checkboxes it ticks are in the page, which these tests don't draw
  ctx.updateInput = jest.fn();

  return ctx;
};

describe('sortableTable selection', () => {
  // As a list that builds its own rows passes them, eg JWT Authentication
  const rowA = { id: 'a' };
  const rowB = { id: 'b' };

  it('should unselect a plain row selected before', () => {
    const t = table();

    t.toggle(rowA);
    t.toggle(rowA);

    expect(t.selectedRows).toHaveLength(0);
  });

  it('should only unselect the row asked for', () => {
    const t = table();

    t.update([rowA, rowB], []);
    t.update([], [rowA]);

    expect(t.selectedRows.map((r: { id: string }) => r.id)).toStrictEqual(['b']);
  });

  it('should keep the selected rows still on the page, and drop the ones that left it', () => {
    const t = table();

    t.update([rowA, rowB], []);
    t.pageChanged([rowB]);

    expect(t.selectedRows.map((r: { id: string }) => r.id)).toStrictEqual(['b']);
  });
});
