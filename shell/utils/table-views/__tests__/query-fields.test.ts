import {
  CLUSTER_ID_FIELD_ID, NO_MATCH, PINNED_FIELD_ID, expandQuery, pinnedQueryFields
} from '@shell/utils/table-views/query-fields';
import { applyQueryExpression } from '@shell/utils/table-views/filter-rows';
import { queryToServerFilters } from '@shell/utils/table-views/server-filters';
import { parseQueryExpression } from '@shell/utils/table-views/query';
import type { TableViewField, TableViewRow } from '@shell/types/table-views';
import { PaginationFilterEquality } from '@shell/types/store/pagination.types';

const NAME: TableViewField = {
  id: 'name', label: 'Name', isLabel: false, header: { name: 'name', value: 'nameDisplay' }, paginationHeader: { name: 'name', search: 'spec.displayName' }
};

interface ClusterRow extends TableViewRow {
  id: string;
  nameDisplay: string;
}

const row = (id: string, nameDisplay: string): ClusterRow => ({
  id, nameDisplay, metadata: {}
});
const rows = [row('c-1', 'one'), row('c-2', 'two'), row('c-3', 'three')];

function fieldsWith(pinned: string[], total = 3): TableViewField[] {
  return [NAME, ...pinnedQueryFields({
    label: 'Pinned', idLabel: 'Cluster ID', pinnedIds: () => pinned, idPath: 'id', serverPath: 'metadata.name', total
  })];
}

const namesFor = (query: string, fields: TableViewField[]) => applyQueryExpression(rows, expandQuery(parseQueryExpression(query, fields), fields), fields).map((row) => row.nameDisplay);

describe('pinned query fields', () => {
  it('should suggest true and false, counted', () => {
    const pinned = fieldsWith(['c-1']).find((field) => field.id === PINNED_FIELD_ID);

    expect(pinned?.values).toStrictEqual([{ value: 'true', count: 1 }, { value: 'false', count: 2 }]);
  });

  it.each([
    ['pinned:true', ['one', 'three']],
    ['pinned:false', ['two']],
    ['not pinned:true', ['two']],
    ['not pinned:false', ['one', 'three']],
    ['pinned:true th', ['three']],
    ['pinned:TRUE', ['one', 'three']],
    ['pinned:true pinned:false', ['one', 'two', 'three']],
    ['pinned:true or pinned:false', ['one', 'two', 'three']],
    ['pinned:true and pinned:false', []],
    ['pinned:true not pinned:true', []],
    ['not pinned:true not pinned:false', []],
    ['pinned:true pinned:tr', ['one', 'three']],
    ['pinned:true or name:two', ['one', 'two', 'three']],
    ['pinned:false or name:one', ['one', 'two']],
    ['pinned:true and not name:one', ['three']],
  ])('should narrow the rows for %s', (query, expected) => {
    expect(namesFor(query, fieldsWith(['c-1', 'c-3']))).toStrictEqual(expected);
  });

  it('should match nothing for pinned:true, and everything for pinned:false, with no pins', () => {
    expect(namesFor('pinned:true', fieldsWith([]))).toStrictEqual([]);
    expect(namesFor('pinned:false', fieldsWith([]))).toStrictEqual(['one', 'two', 'three']);
  });

  it('should leave the list alone while the value is half typed', () => {
    expect(namesFor('pinned:tr', fieldsWith(['c-1']))).toStrictEqual(['one', 'two', 'three']);
  });

  it('should not let free text match the clusters\' ids', () => {
    expect(namesFor('c-2', fieldsWith(['c-1']))).toStrictEqual([]);
  });

  it('should ask the api for the clusters in, or not in, the pinned ids', () => {
    const fields = fieldsWith(['c-1', 'c-3']);
    const filtersFor = (query: string) => queryToServerFilters(expandQuery(parseQueryExpression(query, fields), fields), fields).filters
      .map((filter) => filter.fields.map((f) => [f.field, f.value, f.equality]));

    expect(filtersFor('pinned:true')).toStrictEqual([[['metadata.name', 'c-1,c-3', PaginationFilterEquality.IN]]]);
    expect(filtersFor('pinned:false')).toStrictEqual([[['metadata.name', 'c-1,c-3', PaginationFilterEquality.NOT_IN]]]);
    expect(filtersFor('pinned:true pinned:false')).toStrictEqual([]);
    expect(filtersFor('pinned:true name:on')).toStrictEqual([
      [['metadata.name', 'c-1,c-3', PaginationFilterEquality.IN]],
      [['spec.displayName', 'on', PaginationFilterEquality.CONTAINS]],
    ]);
  });

  it('should match an id whole, not a part of it', () => {
    expect(namesFor('pinned:true', fieldsWith(['c']))).toStrictEqual([]);
  });

  it('should target a value no cluster has when nothing is pinned', () => {
    const fields = fieldsWith([]);
    const expanded = expandQuery(parseQueryExpression('pinned:true', fields), fields);

    expect(expanded.clauses[0].groups[0]).toStrictEqual([{
      field: CLUSTER_ID_FIELD_ID, value: NO_MATCH, negated: false
    }]);
  });
});
