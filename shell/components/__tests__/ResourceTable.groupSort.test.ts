import ResourceTable from '@shell/components/ResourceTable.vue';
import ResourceTableViews from '@shell/mixins/resource-table-views';
import type { TableViewField } from '@shell/types/table-views';

// The table views half of ResourceTable is its own mixin, so that is where these live
const { viewGroupSort } = ResourceTableViews.computed;
const { groupSortFor } = ResourceTableViews.methods;

describe('ResourceTable', () => {
  describe('groupSort prop', () => {
    it('should be declared, so a caller supplied value is not left to fall through in $attrs', () => {
      // PaginatedResourceTable passes `:group-sort`. Without this declaration it lands in `$attrs`,
      // and the `v-bind="$attrs"` on SortableTable clobbers the path `viewGroupSort` works out -
      // which left server side grouping unsorted on every paginated list (nodes, for example).
      expect(ResourceTable.props?.groupSort).toBeDefined();
    });
  });

  describe('viewGroupSort', () => {
    function createContext({
      viewGroupField = null as Partial<TableViewField> | null,
      groupSort = null as string | null,
    } = {}) {
      return {
        viewGroupField, groupSort, groupSortFor
      };
    }

    it('should fall back to the groupSort prop when the toolbar is not grouping', () => {
      const ctx = createContext({ groupSort: 'metadata.namespace' });

      expect(viewGroupSort.call(ctx)).toBe('metadata.namespace');
    });

    it('should return null when nothing supplies a group sort', () => {
      expect(viewGroupSort.call(createContext())).toBeNull();
    });

    it('should return the server path of the field the toolbar groups by', () => {
      // The path comes from the column as the pagination api defines it. The display definition
      // beside it says `stateDisplay`, which is the whole reason the other one is consulted
      const ctx = createContext({
        viewGroupField: {
          id:               'state',
          header:           { name: 'state', value: 'stateDisplay' },
          paginationHeader: { name: 'state', search: 'metadata.state.name' },
        }
      });

      expect(viewGroupSort.call(ctx)).toBe('metadata.state.name');
    });

    it('should return the label path when the toolbar groups by a label', () => {
      const ctx = createContext({
        viewGroupField: {
          id: 'label:app', isLabel: true, labelKey: 'app'
        }
      });

      expect(viewGroupSort.call(ctx)).toBe('metadata.labels[app]');
    });

    it('should fall back to the groupSort prop when the grouped field has no single server path', () => {
      const ctx = createContext({
        viewGroupField: {
          id:               'restarts',
          header:           { name: 'restarts' },
          paginationHeader: { name: 'restarts', search: ['a', 'b'] },
        },
        groupSort: 'metadata.namespace',
      });

      expect(viewGroupSort.call(ctx)).toBe('metadata.namespace');
    });

    it('should fall back to the groupSort prop when the list is not paginated', () => {
      // No pagination definition, so nothing can be asked of the api for this column
      const ctx = createContext({
        viewGroupField: { id: 'state', header: { name: 'state', value: 'stateDisplay' } },
        groupSort:      'metadata.namespace',
      });

      expect(viewGroupSort.call(ctx)).toBe('metadata.namespace');
    });
  });
});
