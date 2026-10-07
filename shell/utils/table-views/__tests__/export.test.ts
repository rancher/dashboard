import { exportColumnsFor, rowsToCsv } from '@shell/utils/table-views/export';
import { fieldsFor, isIgnoredColumn } from '@shell/utils/table-views/fields';
import type { TableViewColumn, TableViewRow } from '@shell/types/table-views';

interface Row extends TableViewRow {
  nameDisplay: string;
  metadata: { creationTimestamp: string };
}

const row: Row = { nameDisplay: 'one', metadata: { creationTimestamp: '2026-09-30T10:00:00Z' } };

const NAME: TableViewColumn = {
  name: 'name', label: 'Name', value: 'nameDisplay', sort: ['nameDisplay']
};
// Drawn by its formatter alone: `value` is empty, so only its sort path says anything
const AGE: TableViewColumn = {
  name: 'age', label: 'Age', value: '', formatter: 'LiveDate', sort: ['metadata.creationTimestamp']
};
const EXPLORE: TableViewColumn = {
  name: 'explorer', label: 'Explore', formatter: 'ClusterExplore', tableViews: false
};
const t = (key: string) => key;

describe('table views exports', () => {
  it('should leave out a column a formatter draws on its own, rather than guess its value', () => {
    expect(exportColumnsFor([NAME, AGE], t).map((c) => c.label)).toStrictEqual(['Name']);
  });

  it('should keep a column with a value of its own, from a path, a function or getValue', () => {
    const columns = exportColumnsFor([
      NAME,
      {
        name: 'fn', label: 'Fn', value: (r: TableViewRow) => (r as Row).nameDisplay.toUpperCase()
      },
      {
        name: 'got', label: 'Got', value: '', getValue: (r: TableViewRow) => `${ (r as Row).nameDisplay }!`
      },
    ], t);

    expect(rowsToCsv([row], columns)).toBe('Name,Fn,Got\none,ONE,one!');
  });

  it('should leave out a column marked as not data', () => {
    expect(exportColumnsFor([NAME, EXPLORE], t).map((c) => c.label)).toStrictEqual(['Name']);
  });
});

describe('columns that aren\'t data', () => {
  it('should be known by the header saying so, or by the names used before it could', () => {
    expect(isIgnoredColumn(EXPLORE)).toBe(true);
    expect(isIgnoredColumn({ name: 'actions', label: '' })).toBe(true);
    expect(isIgnoredColumn(NAME)).toBe(false);
  });

  it('should get no field, so no Columns entry, grouping or query term', () => {
    expect(fieldsFor([NAME, EXPLORE], [row]).map((f) => f.id)).toStrictEqual(['name']);
  });
});
