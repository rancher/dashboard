import ResourceTableViews from '@shell/mixins/resource-table-views';
import SortableTable from '@shell/components/SortableTable/index.vue';
import { CONFIGURABLE_TABLES } from '@shell/store/features';
import { TABLE_VIEWS_SHELL } from '@shell/utils/table-views/feature';

const store = {
  getters: { 'features/get': (name: string) => (name === CONFIGURABLE_TABLES ? true : undefined) },
  state:   { $extension: { getPlugins: () => ({}) } },
};

/** An extension's own copy of the shell provides a different object from the dashboard's */
const EXTENSION_COPY = {};

describe('an extension\'s table', () => {
  describe('resourceTable', () => {
    const { showTableViews, inExtension } = ResourceTableViews.computed;

    function table(providedTableViewsShell: object, tableViews: boolean | null = null) {
      const ctx: Record<string, unknown> = {
        $store: store, $route: { meta: {} }, schema: { id: 'pod' }, hasAdvancedFiltering: false, tableViews, providedTableViewsShell
      };

      Object.defineProperty(ctx, 'inExtension', { get: () => inExtension.call(ctx) });

      return ctx;
    }

    it('should have table views in the dashboard', () => {
      expect(showTableViews.call(table(TABLE_VIEWS_SHELL))).toBe(true);
    });

    it('should keep the table it was written for', () => {
      expect(showTableViews.call(table(EXTENSION_COPY))).toBe(false);
    });

    it('should have table views once the extension asks for them', () => {
      expect(showTableViews.call(table(EXTENSION_COPY, true))).toBe(true);
    });
  });

  describe('sortableTable', () => {
    const { useTableViewsLayout } = SortableTable.computed as unknown as Record<string, (this: object) => boolean>;

    const table = (providedTableViewsShell: object, tableViewsLayout: boolean | null = null) => ({
      $store: store, $route: { meta: {} }, tableViewsLayout, providedTableViewsShell
    });

    it('should keep its masthead unless it asks for the table views one', () => {
      expect(useTableViewsLayout.call(table(TABLE_VIEWS_SHELL))).toBe(true);
      expect(useTableViewsLayout.call(table(EXTENSION_COPY))).toBe(false);
      expect(useTableViewsLayout.call(table(EXTENSION_COPY, true))).toBe(true);
    });
  });
});
