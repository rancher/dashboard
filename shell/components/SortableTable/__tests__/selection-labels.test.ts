import SortableTable from '@shell/components/SortableTable/index.vue';

const { computed, methods } = SortableTable as any;

/**
 * Mirrors the i18n `t` helper closely enough to assert on both the key and the
 * interpolated values
 */
const t = (key: string, args?: Record<string, string>) => (args ? `${ key }-${ JSON.stringify(args) }` : key);

describe('component: SortableTable, accessible selection labels', () => {
  describe('selectAllCheckboxLabel', () => {
    const selectAllCheckboxLabel = (context: Record<string, any>) => computed.selectAllCheckboxLabel.call({ t, ...context });

    it('should use the resource name given by the page over the one from the schema', () => {
      const label = selectAllCheckboxLabel({
        selectAllLabel: 'Projects/Namespaces',
        pagingParams:   { pluralLabel: 'Namespaces' },
      });

      expect(label).toBe('sortableTable.selectAllResources-{"resource":"Projects/Namespaces"}');
    });

    it('should fall back to the resource name derived from the schema', () => {
      const label = selectAllCheckboxLabel({
        selectAllLabel: null,
        pagingParams:   { pluralLabel: 'Deployments' },
      });

      expect(label).toBe('sortableTable.selectAllResources-{"resource":"Deployments"}');
    });

    it.each([
      ['there is no resource context at all', { selectAllLabel: null, pagingParams: null }],
      ['the schema provided an empty name', { selectAllLabel: null, pagingParams: { pluralLabel: '' } }],
      ['the schema provided no name', { selectAllLabel: null, pagingParams: {} }],
    ])('should fall back to the generic label when %s', (_, context) => {
      expect(selectAllCheckboxLabel(context)).toBe('sortableTable.genericGroupCheckbox');
    });
  });

  describe('rowCheckboxLabel', () => {
    const rowCheckboxLabel = (row: any) => methods.rowCheckboxLabel.call({ t }, row);

    it('should name the row it selects', () => {
      expect(rowCheckboxLabel({ row: { id: 'default/nginx' } })).toBe('sortableTable.genericRowCheckbox-{"item":"default/nginx"}');
    });

    it.each([
      ['the row has no id', { row: {} }],
      ['the row has an empty id', { row: { id: '' } }],
      ['there is no row', undefined],
    ])('should fall back to the generic label when %s', (_, row) => {
      expect(rowCheckboxLabel(row)).toBe('sortableTable.genericRowCheckboxNoItem');
    });
  });
});
