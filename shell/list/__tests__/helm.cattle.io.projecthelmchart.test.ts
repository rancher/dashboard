import { shallowMount } from '@vue/test-utils';
import ProjectHelmChartList from '@shell/list/helm.cattle.io.projecthelmchart.vue';
import ResourceTable from '@shell/components/ResourceTable';
import { HELM } from '@shell/config/types';

const creatableSchema = { id: HELM.PROJECTHELMCHART, collectionMethods: ['GET', 'POST'] };

const mountList = async(federatorMissing: boolean, rows: object[] = []) => {
  const wrapper = shallowMount(ProjectHelmChartList, {
    props:  { resource: HELM.PROJECTHELMCHART },
    global: {
      mocks: {
        $store: {
          getters: {
            'i18n/t':                     (text: string) => text,
            'prefs/get':                  () => false,
            'management/byId':            () => undefined,
            'type-map/optionsFor':        () => ({}),
            'type-map/headersFor':        () => [],
            currentStore:                 () => 'cluster',
            'cluster/all':                () => rows,
            'cluster/schemaFor':          () => creatableSchema,
            'cluster/haveAll':            () => true,
            'cluster/haveSelector':       () => false,
            'cluster/havePage':           () => false,
            'cluster/count':              () => 0,
            'resource-fetch/refreshFlag': false,
            federatorMissing,
          },
          dispatch: jest.fn(),
        },
        $fetchState: { pending: false },
        $route:      { query: {}, params: {} },
      },
    },
  });

  await wrapper.setData({ projectHelmChartSchema: creatableSchema, fetchedResourceType: [{ type: HELM.PROJECTHELMCHART, currStore: 'cluster' }] });

  return wrapper;
};

describe('list: helm.cattle.io.projecthelmchart', () => {
  it('should not offer to create a project monitor when the federator is not installed', async() => {
    const wrapper = await mountList(true);

    expect(wrapper.vm.canCreateProjectHelmChart).toBe(false);
    expect(wrapper.find('[data-testid="project-monitoring-federator-not-installed"]').exists()).toBe(true);
  });

  it('should still list the project monitors left behind when the federator is not installed', async() => {
    const rows = [{ id: 'cattle-project-p-abc/monitor' }];
    const wrapper = await mountList(true, rows);

    expect(wrapper.vm.canCreateProjectHelmChart).toBe(false);
    expect(wrapper.find('[data-testid="project-monitoring-federator-not-installed"]').exists()).toBe(true);
    expect(wrapper.findComponent(ResourceTable).props('rows')).toStrictEqual(rows);
    expect(wrapper.find('.empty-list').exists()).toBe(false);
  });

  it('should offer to create a project monitor when the federator is installed', async() => {
    const wrapper = await mountList(false);

    expect(wrapper.vm.canCreateProjectHelmChart).toBe(true);
    expect(wrapper.find('[data-testid="project-monitoring-federator-not-installed"]').exists()).toBe(false);
  });
});
