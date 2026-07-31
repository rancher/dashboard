import { shallowMount } from '@vue/test-utils';
import Workload from '@shell/list/workload.vue';
import ResourceFetch from '@shell/mixins/resource-fetch';
import ResourceTable from '@shell/components/ResourceTable.vue';

describe('component: workload', () => {
  it('should load the schema for the workload', () => {
    const resource = 'workload';
    const schema = {
      id:         resource,
      type:       'schema',
      attributes: {
        kind:       'Workload',
        namespaced: true,
      },
      metadata: { name: resource },
    };

    const wrapper = shallowMount(Workload, {
      components: { ResourceTable },
      mixins:     [ResourceFetch],
      global:     {
        mocks: {
          $store: {
            dispatch: () => jest.fn(),
            getters:  {
              currentStore:                  () => 'cluster',
              namespaces:                    () => jest.fn(),
              'management/byId':             () => jest.fn(),
              'resource-fetch/refreshFlag':  () => jest.fn(),
              'type-map/hideBulkActionsFor': () => jest.fn(),
              'type-map/labelFor':           () => jest.fn(),
              'type-map/optionsFor':         () => jest.fn(),
              'type-map/headersFor':         () => jest.fn(),
              'prefs/get':                   () => resource,
              'cluster/schemaFor':           () => {},
              'cluster/all':                 () => [{}],
              'features/get':                () => false,
            }
          },
          $fetchState: {
            pending: false, error: true, timestamp: Date.now()
          },
          $route: { params: { resource } },
        },
      }
    });

    expect((wrapper.vm as any).schema).toStrictEqual(schema);
  });

  // TODO - #7473: Further tests may be defined within one of the table components
  it.todo('should display the list of workloads');
});
