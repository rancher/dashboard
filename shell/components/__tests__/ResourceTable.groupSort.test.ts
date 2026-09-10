import ResourceTable from '@shell/components/ResourceTable.vue';

const { viewGroupSort } = (ResourceTable as any).computed;

describe('ResourceTable', () => {
  describe('groupSort prop', () => {
    it('should be declared, so a caller supplied value is not left to fall through in $attrs', () => {
      // PaginatedResourceTable passes `:group-sort`. Without this declaration it lands in `$attrs`,
      // and the `v-bind="$attrs"` on SortableTable clobbers the path `viewGroupSort` works out -
      // which left server side grouping unsorted on every paginated list (nodes, for example).
      expect((ResourceTable as any).props.groupSort).toBeDefined();
    });
  });

  describe('viewGroupSort', () => {
    function createContext({
      viewGroupField = null as any,
      groupSort = null as string | null,
    } = {}) {
      return { viewGroupField, groupSort };
    }

    it('should fall back to the groupSort prop when the toolbar is not grouping', () => {
      const ctx = createContext({ groupSort: 'metadata.namespace' });

      expect(viewGroupSort.call(ctx)).toBe('metadata.namespace');
    });

    it('should return null when nothing supplies a group sort', () => {
      expect(viewGroupSort.call(createContext())).toBeNull();
    });

    it('should return the server path of the field the toolbar groups by', () => {
      const ctx = createContext({ viewGroupField: { id: 'state', header: { name: 'state' } } });

      expect(viewGroupSort.call(ctx)).toBe('metadata.state.name');
    });

    it('should return the label path when the toolbar groups by a label', () => {
      const ctx = createContext({ viewGroupField: { id: 'label:app', isLabel: true, labelKey: 'app' } });

      expect(viewGroupSort.call(ctx)).toBe('metadata.labels[app]');
    });

    it('should fall back to the groupSort prop when the grouped field has no single server path', () => {
      const ctx = createContext({
        viewGroupField: { id: 'restarts', header: { name: 'restarts', search: ['a', 'b'] } },
        groupSort:      'metadata.namespace',
      });

      expect(viewGroupSort.call(ctx)).toBe('metadata.namespace');
    });
  });
});
