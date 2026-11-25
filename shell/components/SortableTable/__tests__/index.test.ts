import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import SortableTable from '@shell/components/SortableTable/index.vue';

type Column = { hide?: boolean, isColVisible?: boolean } | null | undefined;
type Row = Record<string, unknown>;

const methods = SortableTable.methods as unknown as {
  isColumnVisible: (this: { hasAdvancedFiltering: boolean }, col: Column) => boolean;
  expandAll: (this: { rows: Row[], keyField: string, expanded: Record<string, boolean> }) => void;
  collapseAll: (this: { expanded: Record<string, boolean> }) => void;
};

describe('sortableTable methods', () => {
  describe('isColumnVisible', () => {
    it.each([
      ['a missing column', undefined, false, false],
      ['a hidden column', { hide: true }, false, false],
      ['a column with no advanced filtering', { isColVisible: false }, false, true],
      ['a column included by advanced filtering', { isColVisible: true }, true, true],
      ['a column excluded by advanced filtering', { isColVisible: false }, true, false],
    ])('should determine visibility for %s', (_label, col, hasAdvancedFiltering, expected) => {
      expect(methods.isColumnVisible.call({ hasAdvancedFiltering }, col)).toStrictEqual(expected);
    });
  });

  describe('expandAll', () => {
    it('should mark every row expanded using the configured key field', () => {
      const ctx = {
        rows:     [{ id: 'one' }, { id: 'two' }],
        keyField: 'id',
        expanded: { stale: true },
      };

      methods.expandAll.call(ctx);

      expect(ctx.expanded).toStrictEqual({ one: true, two: true });
    });
  });

  describe('collapseAll', () => {
    it('should clear the expanded state', () => {
      const ctx = { expanded: { one: true, two: true } };

      methods.collapseAll.call(ctx);

      expect(ctx.expanded).toStrictEqual({});
    });
  });
});

describe('sortableTable row menu', () => {
  it('should pass the table to the actions asking for it', () => {
    const headers = [{
      name: 'name', label: 'Name', value: 'id'
    }];
    const rows = [{ id: 'one' }, { id: 'two' }];
    const store = createStore({
      getters: {
        'i18n/t':          () => (key: string) => key,
        'prefs/get':       () => () => 10,
        'management/byId': () => () => ({ value: 'v2.17.0' }),
      }
    });
    const wrapper = shallowMount(SortableTable, {
      props:  { headers, rows },
      global: {
        plugins: [store],
        mocks:   {
          $store: store, $route: { query: {} }, $router: { applyQuery: jest.fn() }
        },
        directives: {
          shortkey: () => {}, 'trim-whitespace': () => {}, 'ui-context': () => {}
        },
      },
    });
    const menu = wrapper.findAllComponents(ActionMenu)[1];
    const argsFor = menu.props('actionArgs') as (action: object, resources: unknown[]) => unknown;

    expect(argsFor({ action: 'download', passTable: true }, [menu.props('resource')])).toStrictEqual([{ headers, rows: [rows[1]] }]);
    expect(argsFor({ action: 'promptRemove' }, [menu.props('resource')])).toBeUndefined();
  });
});
