import SortableTable from '@shell/components/SortableTable/index.vue';

type Computed = (this: object) => { rows: { columns: { limits?: object }[] }[] }[];

const { displayRows } = SortableTable.computed as unknown as Record<string, Computed>;

describe('sortableTable column limits', () => {
  const table = (columns: object[]) => ({
    columns,
    columnFormmatterIDs: {},
    groupedRows:         [{
      key: 'all', ref: null, rows: [{ id: 'a', name: 'a' }]
    }],
    keyField:                   'id',
    get:                        (row: Record<string, unknown>, key: string) => row[key],
    showSubRow:                 () => false,
    canRunBulkActionOfInterest: () => false,
    valueFor:                   () => 'value',
    labelFor:                   () => '',
  });

  it('should hand a column\'s width and line limits to its cells', () => {
    const [group] = displayRows.call(table([{
      name: 'description', minWidth: 100, maxWidth: 300, lineClamp: 3
    }]));

    expect(group.rows[0].columns[0].limits).toStrictEqual({
      minWidth: 100, maxWidth: 300, lineClamp: 3
    });
  });

  it('should leave the cells of a column without limits as they are', () => {
    const [group] = displayRows.call(table([{ name: 'name', width: 120 }]));

    expect(group.rows[0].columns[0].limits).toBeUndefined();
  });
});
