import { mount } from '@vue/test-utils';
import PersistentVolume from '@shell/edit/persistentvolume/index';
import { ExtendedVue, Vue } from 'vue/types/vue';

describe('view: PersistentVolume', () => {
  it('should list enabled PV storage', () => {
    const plugin = 'csi';
    const wrapper = mount(PersistentVolume as ExtendedVue<Vue, {}, {}, {}, PersistentVolume>, {
      propsData: { value: { spec: { [plugin]: { value: plugin } } } },
      mocks:     {
        $store: {
          dispatch: () => jest.fn(),
          getters:  {
            'current_store/schemaFor':     jest.fn(),
            'current_store/all':           jest.fn(),
            'i18n/t':                      jest.fn(),
            'i18n/exists':                 jest.fn(),
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
          }
        },
        $fetchState: {
          pending: false, error: true, timestamp: Date.now()
        },
        $route: { params: { resource: 'PersistentVolume' } },
      }
    });

    expect(wrapper.vm.plugin).toBe(plugin);
  });

  it.todo('should select current plugin');
});
