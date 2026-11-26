import { shallowMount } from '@vue/test-utils';
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

  describe('row selection checkbox cell alignment', () => {
    const mountTable = () => {
      const store = {
        getters: {
          'prefs/get':                                 () => 100,
          'i18n/t':                                    (key: string) => key,
          'i18n/exists':                               () => false,
          'features/get':                              () => false,
          'uiplugins/tableHeaders':                    () => [],
          'uiplugins/listHooks':                       () => [],
          'management/schemaFor':                      () => null,
          'management/byId':                           () => null,
          'cluster/schemaFor':                         () => null,
          'resource-fetch/manualRefreshIsLoading':     () => false,
          'resource-fetch/isTooManyItemsToAutoUpdate': () => false,
          currentStore:                                () => 'cluster',
        },
        dispatch: jest.fn(),
      };

      return shallowMount(SortableTable, {
        props: {
          headers: [{
            name: 'name', label: 'Name', value: 'name'
          }],
          rows: [{
            id:               'default/pod-1',
            name:             'pod-1',
            stateDescription: 'Container creating',
            stateObj:         { error: false },
          }],
          keyField:     'id',
          tableActions: true,
          rowActions:   false,
          subRows:      true,
        },
        global: {
          provide: { store },
          mocks:   {
            $store:  store,
            $route:  { query: {}, params: {} },
            $router: { replace: jest.fn(), push: jest.fn() },
          },
          directives: {
            'clean-tooltip':   () => {},
            'ui-context':      () => {},
            'trim-whitespace': () => {},
            shortkey:          () => {},
          },
        },
      });
    };

    it('should not set align on main-row checkbox cell so it left-aligns with the header checkbox', () => {
      const wrapper = mountTable();
      const mainRowCheck = wrapper.find('tr.main-row td.row-check');

      expect(mainRowCheck.exists()).toStrictEqual(true);
      expect(mainRowCheck.attributes('align')).toStrictEqual(undefined);
    });

    it('should not set align on state-description sub-row checkbox spacer cell', () => {
      const wrapper = mountTable();
      const subRowCheck = wrapper.find('tr.state-description td.row-check');

      expect(subRowCheck.exists()).toStrictEqual(true);
      expect(subRowCheck.attributes('align')).toStrictEqual(undefined);
    });
  });
});
