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

  describe('on a Rancher from before table views', () => {
    const { data, computed } = ResourceTableViews;

    const unknown = (kind: string) => (name: string) => {
      throw new Error(`Unknown ${ kind }: ${ name }`);
    };

    function table() {
      const base: Record<string, unknown> = {
        $store: {
          getters: { 'features/get': unknown('feature'), 'prefs/get': unknown('preference') },
          state:   { $extension: { getPlugins: () => ({}) } },
        },
        $route:                  { meta: {}, params: {} },
        schema:                  { id: 'pod' },
        hasAdvancedFiltering:    false,
        tableViews:              null,
        providedTableViewsShell: EXTENSION_COPY,
      };
      const ctx: Record<string, unknown> = Object.assign(base, data.call(base));

      Object.entries(computed).forEach(([name, get]) => {
        Object.defineProperty(ctx, name, { get: () => get.call(ctx), configurable: true });
      });

      return ctx;
    }

    it('should render the table without saved views or table views', () => {
      const ctx = table();

      expect(ctx.savedViews).toStrictEqual([]);
      expect(ctx.openedViewId).toBeUndefined();
      expect(ctx.showTableViews).toBe(false);
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

describe('a standalone product\'s table, eg Harvester', () => {
  const singleProductStore = (isSingleProduct: object | false) => ({
    getters: { ...store.getters, isSingleProduct },
    state:   store.state,
  });
  const HARVESTER = { productNameKey: 'harvester.productLabel' };

  describe('resourceTable', () => {
    const { showTableViews, inExtension } = ResourceTableViews.computed;

    // A standalone product builds the package into the app, so its tables get the app's own copy of the shell
    function table(isSingleProduct: object | false, tableViews: boolean | null = null) {
      const ctx: Record<string, unknown> = {
        $store: singleProductStore(isSingleProduct), $route: { meta: {} }, schema: { id: 'pod' }, hasAdvancedFiltering: false, tableViews, providedTableViewsShell: TABLE_VIEWS_SHELL
      };

      Object.defineProperty(ctx, 'inExtension', { get: () => inExtension.call(ctx) });

      return ctx;
    }

    it('should keep the table it was written for, as an extension does', () => {
      expect(showTableViews.call(table(HARVESTER))).toBe(false);
    });

    it('should have table views once the table asks for them', () => {
      expect(showTableViews.call(table(HARVESTER, true))).toBe(true);
    });

    it('should still have table views in Rancher, which is not a single product', () => {
      expect(showTableViews.call(table(false))).toBe(true);
    });
  });

  describe('sortableTable', () => {
    const { useTableViewsLayout } = SortableTable.computed as unknown as Record<string, (this: object) => boolean>;

    const table = (isSingleProduct: object | false, tableViewsLayout: boolean | null = null) => ({
      $store: singleProductStore(isSingleProduct), $route: { meta: {} }, tableViewsLayout, providedTableViewsShell: TABLE_VIEWS_SHELL
    });

    it('should keep its masthead unless it asks for the table views one', () => {
      expect(useTableViewsLayout.call(table(HARVESTER))).toBe(false);
      expect(useTableViewsLayout.call(table(HARVESTER, true))).toBe(true);
      expect(useTableViewsLayout.call(table(false))).toBe(true);
    });
  });
});
