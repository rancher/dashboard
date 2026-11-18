import { reactive } from 'vue';
import selection from '@shell/components/SortableTable/selection';

type Row = { id: string };

/** The table's own state and the methods these tests call, bound to it */
interface Table {
  selectedRows: Row[];
  keyField: string;
  $nextTick: (fn: () => void) => void;
  $emit: jest.Mock;
  updateInput: jest.Mock;
  toggle: (row: Row) => void;
  update: (toAdd: Row[], toRemove: Row[]) => void;
  pageChanged: (rows: Row[]) => void;
}

const { methods } = selection as unknown as { methods: Record<string, (...args: unknown[]) => unknown> };

/** Reactive as the table's data is, around rows a list gave as plain objects */
const table = (): Table => {
  const ctx = reactive({
    selectedRows: [] as Row[],
    keyField:     'id',
    $nextTick:    (fn: () => void) => fn(),
    $emit:        jest.fn(),
  }) as unknown as Table & Record<string, unknown>;

  Object.entries(methods).forEach(([name, fn]) => {
    ctx[name] = fn.bind(ctx);
  });
  // The checkboxes it ticks are in the page, which these tests don't draw
  ctx.updateInput = jest.fn();

  return ctx;
};

describe('sortableTable selection', () => {
  // As a list that builds its own rows passes them, eg JWT Authentication
  const rowA = { id: 'a' };
  const rowB = { id: 'b' };

  it('should stop updating nested rows at a row containing a sub-table', () => {
    const tableElement = document.createElement('table');
    const tbody = document.createElement('tbody');
    const addRow = (className: string, containsSubTable = false) => {
      const row = document.createElement('tr');
      const cell = document.createElement('td');

      row.classList.add(className);
      if (containsSubTable) {
        const subTable = document.createElement('div');

        subTable.classList.add('sub-table');
        cell.append(subTable);
      }
      row.append(cell);
      tbody.append(row);

      return row;
    };
    const mainRow = addRow('main-row');
    const checkboxCtrl = document.createElement('div');

    checkboxCtrl.dataset.checkboxCtrl = '';
    checkboxCtrl.dataset.nodeId = 'a';
    mainRow.querySelector('td')?.append(checkboxCtrl);

    const subRow = addRow('sub-row');
    const additionalSubRow = addRow('additional-sub-row');
    const nestedTableRow = addRow('sub-row', true);
    const followingSubRow = addRow('sub-row');

    tableElement.append(tbody);
    Reflect.apply(methods.updateInput, { $el: tableElement }, [{ id: 'a' }, true, 'id']);

    expect([
      mainRow,
      subRow,
      additionalSubRow,
      nestedTableRow,
      followingSubRow,
    ].map((row) => row.classList.contains('row-selected'))).toStrictEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
  });

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

    expect(t.selectedRows.map((r) => r.id)).toStrictEqual(['b']);
  });

  it('should keep the selected rows still on the page, and drop the ones that left it', () => {
    const t = table();

    t.update([rowA, rowB], []);
    t.pageChanged([rowB]);

    expect(t.selectedRows.map((r) => r.id)).toStrictEqual(['b']);
  });
});
