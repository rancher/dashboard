import { shallowMount } from '@vue/test-utils';
import ExplorerProjectsNamespaces from '@shell/components/ExplorerProjectsNamespaces.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';

describe('component: ExplorerProjectsNamespaces', () => {
  const mountPage = () => shallowMount(ExplorerProjectsNamespaces, {
    global: {
      mocks: {
        $store: {
          dispatch: jest.fn(),
          getters:  {
            currentStore:                      () => 'cluster',
            currentCluster:                    { id: 'local' },
            currentProduct:                    { name: 'explorer', inStore: 'cluster' },
            namespaces:                        () => ({}),
            activeNamespaceFilters:            [],
            namespaceFilters:                  [],
            'action-menu/performCallbackData': null,
            'management/byId':                 () => undefined,
            'management/schemaFor':            () => undefined,
            'management/all':                  () => [],
            'cluster/schemaFor':               () => undefined,
            'cluster/all':                     () => [],
            'resource-fetch/refreshFlag':      () => undefined,
            'prefs/get':                       () => undefined,
            'features/get':                    () => false,
            'i18n/t':                          (key: string) => key,
          }
        },
        $fetchState: { pending: false },
        $route:      { params: {}, query: {} },
        t:           (key: string) => key,
      },
    }
  });

  it('should name grouping by project as the table\'s default, so its views start grouped by project', () => {
    const table = mountPage().findComponent(ResourceTable);

    expect(table.props('groupDefault')).toBe('namespace');
  });

  it('should offer grouping by project under the namespace grouping\'s name, that the table starts with', () => {
    const table = mountPage().findComponent(ResourceTable);
    const offered = (table.props('groupOptions') as { value: string, field?: string }[]).find((option) => option.value === table.props('groupDefault'));

    expect(offered?.field).toBe('groupById');
  });

  describe('filteredRows', () => {
    const { filteredRows } = ExplorerProjectsNamespaces.computed as unknown as Record<string, (this: object) => unknown>;
    const rows = [{ id: 'ns-1' }];
    // Includes a placeholder row for a project with no namespaces, so it still gets a group
    const rowsWithFakeNamespaces = [{ id: 'ns-1' }, { id: 'fake-p-empty', groupById: 'p-empty' }];

    it('should list empty projects while grouped by project', () => {
      expect(filteredRows.call({
        groupMode: 'namespace', rows, rowsWithFakeNamespaces
      })).toStrictEqual(rowsWithFakeNamespaces);
    });

    it('should list only namespaces while flat', () => {
      expect(filteredRows.call({
        groupMode: 'none', rows, rowsWithFakeNamespaces
      })).toStrictEqual(rows);
    });
  });
});
